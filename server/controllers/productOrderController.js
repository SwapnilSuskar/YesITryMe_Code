import fs from "fs";
import Product from "../models/Product.js";
import ProductOrder from "../models/ProductOrder.js";
import CoinWallet from "../models/Coin.js";
import cloudinary from "../config/cloudinary.js";
import { buildUpiPayUri } from "../utils/buildUpiPayUri.js";
import { distributeProductOrderWalletCommissions } from "../services/productOrderCommissionService.js";

const COINS_PER_RUPEE = 100;

const roundMoney = (n) => Math.round(Number(n) * 100) / 100;

const validateMobile = (m) => {
  const d = String(m).replace(/\D/g, "");
  return d.length === 10;
};

const validatePincode = (p) => /^\d{6}$/.test(String(p).trim());

async function generateOrderNumber() {
  const prefix = "PO";
  for (let i = 0; i < 5; i++) {
    const num = `${prefix}${Date.now()}${Math.floor(Math.random() * 900 + 100)}`;
    const exists = await ProductOrder.findOne({ orderNumber: num });
    if (!exists) return num;
  }
  return `${prefix}${Date.now()}${Math.random().toString(36).slice(2, 8)}`;
}

/** Return coins when an order is rejected/cancelled (not after confirmed fulfillment). */
async function refundProductOrderCoins(order, reason) {
  if (!order?.coinsDeducted || !order.coinsApplied || order.coinsApplied <= 0) return;
  const w = await CoinWallet.findOne({ userId: order.userId });
  if (!w) return;
  await w.restoreCoins(
    "product_order",
    order.coinsApplied,
    { orderNumber: order.orderNumber, reason: reason || "product_order_refund" },
    `PRODUCT_ORDER_REFUND_${order.orderNumber}`
  );
}

export const createProductOrder = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { items, shipping, coinDiscountRupees: rawCoinDiscount } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }
    if (
      !shipping?.fullName ||
      !shipping?.mobile ||
      !shipping?.pincode ||
      !shipping?.address
    ) {
      return res.status(400).json({
        success: false,
        message: "Name, mobile, pincode, and address are required",
      });
    }
    if (!validateMobile(shipping.mobile)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 10-digit mobile number",
      });
    }
    if (!validatePincode(shipping.pincode)) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid 6-digit pincode",
      });
    }

    const resolvedItems = [];
    let productSubtotal = 0;
    let deliveryTotal = 0;

    for (const line of items) {
      const { productId, packageName, quantity } = line;
      const qty = parseInt(quantity, 10);
      if (!productId || !packageName || !qty || qty < 1) {
        return res.status(400).json({ success: false, message: "Invalid cart line" });
      }

      const product = await Product.findById(productId);
      if (!product || product.status !== "active") {
        return res.status(400).json({
          success: false,
          message: "One or more products are no longer available",
        });
      }

      const pricingOpt = (product.pricing || []).find(
        (p) => p.packageName?.trim() === String(packageName).trim()
      );
      if (!pricingOpt) {
        return res.status(400).json({
          success: false,
          message: `Package "${packageName}" is not available for "${product.title}"`,
        });
      }

      const unitPrice = roundMoney(pricingOpt.price);
      const deliveryChargePerUnit = roundMoney(product.deliveryCharge || 0);
      const lineSubtotal = roundMoney(unitPrice * qty);
      const lineDeliveryTotal = roundMoney(deliveryChargePerUnit * qty);

      resolvedItems.push({
        productId: product._id,
        title: product.title,
        packageName: pricingOpt.packageName,
        unitPrice,
        quantity: qty,
        lineSubtotal,
        deliveryChargePerUnit,
        lineDeliveryTotal,
      });

      productSubtotal += lineSubtotal;
      deliveryTotal += lineDeliveryTotal;
    }

    productSubtotal = roundMoney(productSubtotal);
    deliveryTotal = roundMoney(deliveryTotal);

    const maxCoinDiscountRupees = roundMoney(productSubtotal * 0.2);

    let requestedCoinRupees = roundMoney(parseFloat(rawCoinDiscount) || 0);
    if (requestedCoinRupees < 0) requestedCoinRupees = 0;
    requestedCoinRupees = Math.min(requestedCoinRupees, maxCoinDiscountRupees);

    const orderNumber = await generateOrderNumber();
    const coinReference = `PRODUCT_ORDER_${orderNumber}`;

    // Fresh balance so users cannot attach the same coins to multiple open orders
    const walletFresh = await CoinWallet.getOrCreateWallet(userId);
    const maxRupeesFromWallet = roundMoney(walletFresh.balance / COINS_PER_RUPEE);
    requestedCoinRupees = Math.min(requestedCoinRupees, maxRupeesFromWallet);

    const coinsApplied = Math.round(requestedCoinRupees * COINS_PER_RUPEE);
    const coinDiscountRupees = roundMoney(coinsApplied / COINS_PER_RUPEE);

    let amountPayable = roundMoney(
      productSubtotal + deliveryTotal - coinDiscountRupees
    );
    if (amountPayable < 0) amountPayable = 0;

    let upiPayUri = null;
    if (amountPayable >= 0.01) {
      upiPayUri = buildUpiPayUri({
        amountRupees: amountPayable,
        transactionNote: `Order ${orderNumber}`,
        transactionRef: orderNumber,
      });
    }

    let status = "awaiting_payment";
    let coinsDeducted = false;

    if (amountPayable < 0.01) {
      status = "confirmed";
    }

    if (coinsApplied > 0) {
      try {
        const w = await CoinWallet.findOne({ userId });
        if (!w) throw new Error("Wallet not found");
        await w.deductCoins(
          "product_order",
          coinsApplied,
          {
            orderNumber,
            reason:
              status === "confirmed"
                ? "product_checkout_zero_payable"
                : "product_checkout_reserved",
          },
          coinReference
        );
        coinsDeducted = true;
      } catch (err) {
        return res.status(400).json({
          success: false,
          message: err.message || "Could not apply wallet coins",
        });
      }
    }

    let order;
    try {
      order = await ProductOrder.create({
        orderNumber,
        userId,
        items: resolvedItems,
        shipping: {
          fullName: shipping.fullName.trim(),
          mobile: String(shipping.mobile).replace(/\D/g, "").slice(-10),
          pincode: String(shipping.pincode).trim(),
          address: shipping.address.trim(),
        },
        productSubtotal,
        deliveryTotal,
        maxCoinDiscountRupees,
        coinDiscountRupees,
        coinsApplied,
        amountPayable,
        upiPayUri,
        status,
        coinsDeducted,
      });
    } catch (createErr) {
      if (coinsDeducted && coinsApplied > 0) {
        try {
          const tempOrder = { userId, orderNumber, coinsDeducted: true, coinsApplied };
          await refundProductOrderCoins(tempOrder, "product_order_create_failed_refund");
        } catch (refundErr) {
          console.error("createProductOrder: refund after create failure:", refundErr);
        }
      }
      throw createErr;
    }

    if (status === "confirmed") {
      try {
        await distributeProductOrderWalletCommissions(order);
        await order.save();
      } catch (distErr) {
        console.error("createProductOrder: commission distribution:", distErr);
        return res.status(500).json({
          success: false,
          message:
            distErr?.message ||
            "Order was created but commission distribution failed. Retry or contact support.",
        });
      }
    }

    return res.status(201).json({
      success: true,
      data: order,
      message:
        status === "confirmed"
          ? "Order confirmed."
          : "Order created. Pay via the QR code and submit payment proof for verification.",
    });
  } catch (error) {
    console.error("createProductOrder:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
    });
  }
};

export const submitProductOrderPayment = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { paymentMethod, transactionId, payerNotes } = req.body;

    if (!paymentMethod || !transactionId) {
      return res.status(400).json({
        success: false,
        message: "Payment method and transaction ID are required",
      });
    }

    const order = await ProductOrder.findById(id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.status !== "awaiting_payment") {
      return res.status(400).json({
        success: false,
        message: "This order does not accept payment proof in its current state",
      });
    }

    if (order.amountPayable >= 0.01 && !req.files?.paymentProof) {
      return res.status(400).json({
        success: false,
        message: "Payment proof screenshot is required",
      });
    }

    const dup = await ProductOrder.findOne({
      transactionId: String(transactionId).trim(),
      _id: { $ne: order._id },
      status: { $in: ["payment_submitted", "confirmed"] },
    });
    if (dup) {
      return res.status(400).json({
        success: false,
        message: "This transaction ID has already been used",
      });
    }

    let paymentProofUrl = "";
    let paymentProofPublicId = "";

    if (req.files?.paymentProof) {
      try {
        const file = req.files.paymentProof;
        if (file.size > 10 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message: "File size must be less than 10MB",
          });
        }

        let uploadSource;
        if (file.data) {
          const mimeType = file.mimetype || "application/octet-stream";
          const base64Data = file.data.toString("base64");
          uploadSource = `data:${mimeType};base64,${base64Data}`;
        } else if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
          uploadSource = file.tempFilePath;
        } else {
          return res.status(400).json({
            success: false,
            message: "Invalid file upload. Please try again.",
          });
        }

        const result = await cloudinary.uploader.upload(uploadSource, {
          folder: "product-order-payments",
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          resource_type: "auto",
        });
        paymentProofUrl = result.secure_url;
        paymentProofPublicId = result.public_id;

        if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
          try {
            fs.unlinkSync(file.tempFilePath);
          } catch (cleanupError) {
            console.warn("Failed to cleanup temp file:", cleanupError);
          }
        }
      } catch (err) {
        console.error("Product order proof upload error:", err);
        return res.status(500).json({
          success: false,
          message: `Failed to upload payment proof: ${err.message || "Unknown error"}`,
        });
      }
    }

    order.paymentMethod = paymentMethod;
    order.transactionId = String(transactionId).trim();
    order.payerNotes = payerNotes || "";
    order.paymentProofUrl = paymentProofUrl;
    order.paymentProofPublicId = paymentProofPublicId;
    order.status = "payment_submitted";
    await order.save();

    return res.status(200).json({
      success: true,
      data: order,
      message:
        "Payment proof submitted. Your order will be confirmed after admin verification.",
    });
  } catch (error) {
    console.error("submitProductOrderPayment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit payment",
    });
  }
};

export const getMyProductOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const orders = await ProductOrder.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("getMyProductOrders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
};

export const getMyProductOrderById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const order = await ProductOrder.findById(req.params.id);
    if (!order || order.userId !== userId) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    console.error("getMyProductOrderById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order",
    });
  }
};

/** Admin: list product orders (payment queue + history) */
export const listAdminProductOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status && status !== "all") {
      query.status = status;
    }
    const orders = await ProductOrder.find(query).sort({ createdAt: -1 }).limit(500);
    res.json({ success: true, data: orders });
  } catch (error) {
    console.error("listAdminProductOrders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list orders",
    });
  }
};

/** Admin: after verifying Smart Wallet / UPI payment — deduct coins and confirm */
export const adminVerifyProductOrder = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const { adminNotes } = req.body;

    const order = await ProductOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.status !== "payment_submitted") {
      return res.status(400).json({
        success: false,
        message: "Order is not waiting for payment verification",
      });
    }

    const wallet = await CoinWallet.getOrCreateWallet(order.userId);
    if (order.coinsApplied > 0 && !order.coinsDeducted) {
      try {
        await wallet.deductCoins(
          "product_order",
          order.coinsApplied,
          { orderNumber: order.orderNumber, reason: "product_checkout_verified" },
          `PRODUCT_ORDER_${order.orderNumber}`
        );
        order.coinsDeducted = true;
      } catch (err) {
        return res.status(400).json({
          success: false,
          message:
            err.message ||
            "Could not deduct wallet coins; user balance may have changed.",
        });
      }
    }

    order.status = "confirmed";
    order.verifiedAt = new Date();
    order.verifiedBy = adminId;
    order.adminNotes = adminNotes || order.adminNotes || "";

    try {
      await distributeProductOrderWalletCommissions(order);
    } catch (distErr) {
      console.error("adminVerifyProductOrder: commission distribution:", distErr);
      return res.status(500).json({
        success: false,
        message:
          distErr?.message ||
          "Could not run wallet distribution. Order left unconfirmed; try again.",
      });
    }

    await order.save();

    res.json({
      success: true,
      data: order,
      message: "Order confirmed after payment verification.",
    });
  } catch (error) {
    console.error("adminVerifyProductOrder:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to verify order",
    });
  }
};

export const adminRejectProductOrder = async (req, res) => {
  try {
    const adminId = req.user.userId;
    const { id } = req.params;
    const { adminNotes, rejectionReason } = req.body;

    const order = await ProductOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    if (order.status !== "payment_submitted") {
      return res.status(400).json({
        success: false,
        message: "Order is not waiting for payment verification",
      });
    }

    try {
      await refundProductOrderCoins(order, "product_order_rejected_refund");
    } catch (refErr) {
      console.error("adminRejectProductOrder: coin refund:", refErr);
      return res.status(500).json({
        success: false,
        message: refErr.message || "Could not refund wallet coins for this order.",
      });
    }

    order.status = "rejected";
    order.verifiedAt = new Date();
    order.verifiedBy = adminId;
    order.adminNotes = adminNotes || "";
    order.rejectionReason = rejectionReason || "";
    await order.save();

    res.json({
      success: true,
      data: order,
      message: "Order payment rejected.",
    });
  } catch (error) {
    console.error("adminRejectProductOrder:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to reject order",
    });
  }
};

/** Admin: permanently delete a product order (optional Cloudinary proof cleanup) */
export const adminDeleteProductOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await ProductOrder.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (order.paymentProofPublicId) {
      try {
        await cloudinary.uploader.destroy(order.paymentProofPublicId, {
          resource_type: "auto",
        });
      } catch (cloudErr) {
        console.warn("adminDeleteProductOrder: Cloudinary cleanup:", cloudErr?.message || cloudErr);
      }
    }

    // Do not refund coins for completed orders (buyer received goods); only for non-confirmed cleanup
    if (order.status !== "confirmed") {
      try {
        await refundProductOrderCoins(order, "product_order_deleted_refund");
      } catch (refErr) {
        console.error("adminDeleteProductOrder: coin refund:", refErr);
        return res.status(500).json({
          success: false,
          message: refErr.message || "Could not refund wallet coins; delete aborted.",
        });
      }
    }

    await ProductOrder.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Product order deleted.",
    });
  } catch (error) {
    console.error("adminDeleteProductOrder:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete order",
    });
  }
};
