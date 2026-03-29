import User from "../models/User.js";
import Product from "../models/Product.js";
import Wallet from "../models/Wallet.js";
import referralService from "./referralService.js";
import notificationService from "./notificationService.js";
import { scaleCommissionStructureToPool } from "../utils/scaleStandardCommissionPool.js";

const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

/**
 * Credit rupee wallets (same model as super packages) when a product order is confirmed.
 * Uses each product's distribution % of line subtotal as the pool; splits across 120 levels.
 *
 * @param {import("mongoose").Document} orderDoc - ProductOrder mongoose document
 * @returns {Promise<void>}
 */
export async function distributeProductOrderWalletCommissions(orderDoc) {
  if (!orderDoc || orderDoc.productCommissionsDistributed) return;

  const buyer = await User.findOne({ userId: orderDoc.userId });
  const purchaserName = buyer
    ? `${buyer.firstName || ""} ${buyer.lastName || ""}`.trim() || orderDoc.userId
    : orderDoc.userId;

  const sponsors = await referralService.getSponsorGenealogy(orderDoc.userId);
  const sponsorMap = new Map(sponsors.map((s) => [s.level, s]));

  const commissionDistributions = [];
  let totalCommissionDistributed = 0;
  let unassignedCommission = 0;

  for (const item of orderDoc.items || []) {
    const product = await Product.findById(item.productId);
    if (!product?.distributionEnabled || !(product.distributionRupeesPerUnit > 0)) {
      continue;
    }

    const perUnit = roundMoney(Number(product.distributionRupeesPerUnit) || 0);
    const qty = Math.max(0, parseInt(item.quantity, 10) || 0);
    const pool = roundMoney(perUnit * qty);
    if (pool < 0.01) continue;

    const structure = scaleCommissionStructureToPool(pool);
    const packageLabel = `${product.title} — ${item.packageName}`;

    for (const commissionLevel of structure) {
      const amt = commissionLevel.amount;
      if (amt < 0.001) continue;

      const sponsor = sponsorMap.get(commissionLevel.level);
      if (sponsor) {
        let wallet = await Wallet.findOne({ userId: sponsor.userId });
        if (!wallet) {
          wallet = new Wallet({
            userId: sponsor.userId,
            balance: 0,
            totalEarned: 0,
          });
        }

        wallet.balance = roundMoney(wallet.balance + amt);
        wallet.totalEarned = roundMoney(wallet.totalEarned + amt);
        wallet.transactions.push({
          type: "commission",
          amount: amt,
          description: `Level ${sponsor.level} commission from ${purchaserName}'s product order ${orderDoc.orderNumber} (${packageLabel})`,
          packageName: packageLabel,
          purchaserId: orderDoc.userId,
          purchaserName,
          level: sponsor.level,
          status: "completed",
        });

        await wallet.save();

        try {
          await notificationService.createCommissionNotification(
            sponsor.userId,
            amt,
            sponsor.level,
            purchaserName,
            packageLabel
          );
        } catch (err) {
          console.warn(
            `productOrderCommission: notification ${sponsor.userId}:`,
            err?.message || err
          );
        }

        commissionDistributions.push({
          productId: product._id,
          productTitle: product.title,
          packageName: item.packageName,
          lineSubtotal: item.lineSubtotal,
          distributionPool: pool,
          level: sponsor.level,
          sponsorId: sponsor.userId,
          sponsorName: `${sponsor.firstName} ${sponsor.lastName}`,
          percentage: commissionLevel.percentage,
          amount: amt,
          status: "distributed",
          distributedAt: new Date(),
        });

        totalCommissionDistributed = roundMoney(totalCommissionDistributed + amt);
      } else {
        unassignedCommission = roundMoney(unassignedCommission + amt);
      }
    }
  }

  if (unassignedCommission > 0.009) {
    try {
      const adminUser = await User.findOne({ role: "admin" });
      if (adminUser) {
        let adminWallet = await Wallet.findOne({ userId: adminUser.userId });
        if (!adminWallet) {
          adminWallet = new Wallet({
            userId: adminUser.userId,
            balance: 0,
            totalEarned: 0,
          });
        }

        const u = roundMoney(unassignedCommission);
        adminWallet.totalEarned = roundMoney(adminWallet.totalEarned + u);
        adminWallet.passiveIncome = roundMoney(
          (adminWallet.passiveIncome || 0) + u
        );
        adminWallet.transactions.push({
          type: "commission",
          amount: u,
          description: `Unassigned product-order commission from ${purchaserName} order ${orderDoc.orderNumber} (missing upline levels)`,
          packageName: "Product shop",
          purchaserId: orderDoc.userId,
          purchaserName,
          status: "completed",
        });
        await adminWallet.save();

        commissionDistributions.push({
          productId: null,
          productTitle: "—",
          packageName: "—",
          lineSubtotal: 0,
          distributionPool: u,
          level: 120,
          sponsorId: adminUser.userId,
          sponsorName: `${adminUser.firstName} ${adminUser.lastName} (Admin)`,
          percentage: 0,
          amount: u,
          status: "distributed",
          distributedAt: new Date(),
        });

        totalCommissionDistributed = roundMoney(totalCommissionDistributed + u);
      }
    } catch (adminErr) {
      console.error(
        "productOrderCommission: admin unassigned bucket:",
        adminErr
      );
    }
  }

  orderDoc.commissionDistributions = commissionDistributions;
  orderDoc.totalCommissionDistributed = totalCommissionDistributed;
  orderDoc.productCommissionsDistributed = true;
  orderDoc.commissionsDistributedAt = new Date();
}
