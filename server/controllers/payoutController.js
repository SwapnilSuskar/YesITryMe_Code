import Payout from "../models/Payout.js";
import User from "../models/User.js";
import Purchase from "../models/Purchase.js";
import SuperPackagePurchase from "../models/SuperPackagePurchase.js";
import Wallet from "../models/Wallet.js";
import { calculateWithdrawalCharges } from "../services/mlmService.js";

// Check payout eligibility
export const checkPayoutEligibility = async (req, res) => {
  try {
    const { userId } = req.user;

    // Get user's wallet to check balance composition
    const wallet = await Wallet.findOne({ userId });
    const totalBalance = wallet ? wallet.balance : 0;

    // Get user's active and passive income from wallet
    const walletTransactions = await Wallet.findOne({ userId });
    let activeIncome = walletTransactions ? walletTransactions.activeIncome : 0;
    let passiveIncome = walletTransactions
      ? walletTransactions.passiveIncome
      : 0;

    // Remove global payout-requests gate from eligibility
    const totalPayoutRequests = await Payout.countDocuments();

    // Get user's referrals
    const userReferrals = await User.find({ sponsorId: userId });
    const totalReferrals = userReferrals.length;

    // Get referrals who have purchased courses (regular + super package)
    const directIds = userReferrals.map((ref) => ref.userId);
    const regularPurchases = await Purchase.aggregate([
      {
        $match: {
          purchaserId: { $in: directIds },
          paymentStatus: "completed",
        },
      },
      { $group: { _id: "$purchaserId" } },
    ]);
    const superPurchases = await SuperPackagePurchase.aggregate([
      {
        $match: {
          purchaserId: { $in: directIds },
          paymentStatus: "completed",
        },
      },
      { $group: { _id: "$purchaserId" } },
    ]);
    const buyersSet = new Set([
      ...regularPurchases.map((p) => p._id),
      ...superPurchases.map((p) => p._id),
    ]);
    const referralsWithCoursePurchases = buyersSet.size;

    // Check conditions for passive income (aligned rules)
    const hasMinimumPayoutRequests = true; // no global gate
    const hasMinimumReferrals = totalReferrals >= 10;
    const hasMinimumCoursePurchases = referralsWithCoursePurchases >= 7;

    const isEligibleForPassiveIncome =
      hasMinimumPayoutRequests &&
      hasMinimumReferrals &&
      hasMinimumCoursePurchases;

    // User is eligible if they have active income OR meet conditions for passive income
    const isEligible =
      activeIncome > 0 || (passiveIncome > 0 && isEligibleForPassiveIncome);

    // Determine what they can withdraw
    let withdrawableAmount = 0;
    let withdrawalType = "none";

    if (activeIncome > 0) {
      withdrawableAmount = activeIncome;
      withdrawalType = "active_only";
    } else if (passiveIncome > 0 && isEligibleForPassiveIncome) {
      withdrawableAmount = passiveIncome;
      withdrawalType = "passive_only";
    } else if (
      activeIncome > 0 &&
      passiveIncome > 0 &&
      isEligibleForPassiveIncome
    ) {
      withdrawableAmount = totalBalance;
      withdrawalType = "both";
    }

    res.json({
      success: true,
      isEligible,
      withdrawableAmount,
      withdrawalType,
      activeIncome,
      passiveIncome,
      conditions: {
        totalPayoutRequests,
        hasMinimumPayoutRequests,
        totalReferrals,
        hasMinimumReferrals,
        referralsWithCoursePurchases,
        hasMinimumCoursePurchases,
        isEligibleForPassiveIncome,
      },
    });
  } catch (error) {
    console.error("Error checking payout eligibility:", error);
    res.status(500).json({
      success: false,
      message: "Error checking payout eligibility",
      error: error.message,
    });
  }
};

// Request a payout
export const requestPayout = async (req, res) => {
  try {
    const { userId, firstName, lastName } = req.user;
    const { amount, paymentMethod, paymentDetails } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payout amount",
      });
    }

    // Check minimum withdrawal amount
    if (amount < 200) {
      return res.status(400).json({
        success: false,
        message: "Minimum withdrawal amount is ₹200",
      });
    }

    // Check eligibility first
    const { userId: checkUserId } = req.user;

    // Get user's wallet to check balance composition
    const wallet = await Wallet.findOne({ userId: checkUserId });
    const totalBalance = wallet ? wallet.balance : 0;

    // Use wallet's active/passive income directly for consistency
    let activeIncome = wallet ? wallet.activeIncome || 0 : 0;
    let passiveIncome = wallet ? wallet.passiveIncome || 0 : 0;

    // Get total payout requests in the system
    const totalPayoutRequests = await Payout.countDocuments();

    // Get user's referrals
    const userReferrals = await User.find({ sponsorId: checkUserId });
    const totalReferrals = userReferrals.length;

    // Get referrals who have purchased courses (regular + super package)
    const directIds2 = userReferrals.map((ref) => ref.userId);
    const regularPurchases2 = await Purchase.aggregate([
      {
        $match: {
          purchaserId: { $in: directIds2 },
          paymentStatus: "completed",
        },
      },
      { $group: { _id: "$purchaserId" } },
    ]);
    const superPurchases2 = await SuperPackagePurchase.aggregate([
      {
        $match: {
          purchaserId: { $in: directIds2 },
          paymentStatus: "completed",
        },
      },
      { $group: { _id: "$purchaserId" } },
    ]);
    const buyersSet2 = new Set([
      ...regularPurchases2.map((p) => p._id),
      ...superPurchases2.map((p) => p._id),
    ]);
    const referralsWithCoursePurchases = buyersSet2.size;

    // Check conditions for passive income (aligned rules)
    const hasMinimumPayoutRequests = true; // no global gate
    const hasMinimumReferrals = totalReferrals >= 10;
    const hasMinimumCoursePurchases = referralsWithCoursePurchases >= 7;

    const isEligibleForPassiveIncome =
      hasMinimumPayoutRequests &&
      hasMinimumReferrals &&
      hasMinimumCoursePurchases;

    // Determine what they can withdraw
    let withdrawableAmount = 0;
    let withdrawalType = "none";

    if (activeIncome > 0) {
      withdrawableAmount = activeIncome;
      withdrawalType = "active_only";
    } else if (passiveIncome > 0 && isEligibleForPassiveIncome) {
      withdrawableAmount = passiveIncome;
      withdrawalType = "passive_only";
    } else if (
      activeIncome > 0 &&
      passiveIncome > 0 &&
      isEligibleForPassiveIncome
    ) {
      withdrawableAmount = totalBalance;
      withdrawalType = "both";
    }

    // Check if user is eligible for any withdrawal
    if (withdrawableAmount === 0) {
      return res.status(400).json({
        success: false,
        message:
          "You are not eligible for payout. Please check the requirements.",
        conditions: {
          totalPayoutRequests,
          hasMinimumPayoutRequests,
          totalReferrals,
          hasMinimumReferrals,
          referralsWithCoursePurchases,
          hasMinimumCoursePurchases,
          isEligibleForPassiveIncome,
          activeIncome,
          passiveIncome,
        },
      });
    }

    // Check if requested amount exceeds withdrawable amount
    if (amount > withdrawableAmount) {
      return res.status(400).json({
        success: false,
        message: `You can only withdraw up to ₹${withdrawableAmount.toLocaleString()}. Active income: ₹${activeIncome.toLocaleString()}, Passive income: ₹${passiveIncome.toLocaleString()}`,
        withdrawableAmount,
        activeIncome,
        passiveIncome,
        withdrawalType,
      });
    }

    // Check if user has sufficient balance
    const userWallet = await Wallet.findOne({ userId });
    if (!userWallet || userWallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance for payout",
      });
    }

    // Check if user has any pending payout requests
    const pendingPayout = await Payout.findOne({
      userId,
      status: "pending",
    });

    if (pendingPayout) {
      return res.status(400).json({
        success: false,
        message: "You already have a pending payout request",
      });
    }

    // Calculate withdrawal charges
    const charges = calculateWithdrawalCharges(amount);

    // Create payout request WITHOUT deducting money immediately
    // IMPORTANT: Money will only be deducted when admin approves the payout in updatePayoutStatus
    // This prevents money from being deducted if admin rejects the request
    const payout = new Payout({
      userId,
      userName: `${firstName} ${lastName}`,
      amount: charges.grossAmount,
      netAmount: charges.netAmount,
      adminCharge: charges.adminCharge,
      tds: charges.tds,
      paymentMethod,
      paymentDetails,
    });

    await payout.save();

    res.json({
      success: true,
      message: "Payout request submitted successfully",
      data: {
        payout,
        charges: {
          grossAmount: charges.grossAmount,
          adminCharge: charges.adminCharge,
          tds: charges.tds,
          netAmount: charges.netAmount,
        },
      },
    });
  } catch (error) {
    console.error("Error requesting payout:", error);
    res.status(500).json({
      success: false,
      message: "Error requesting payout",
      error: error.message,
    });
  }
};

// Get user's payout history
export const getPayoutHistory = async (req, res) => {
  try {
    const { userId } = req.user;

    const payouts = await Payout.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      payouts,
    });
  } catch (error) {
    console.error("Error getting payout history:", error);
    res.status(500).json({
      success: false,
      message: "Error getting payout history",
      error: error.message,
    });
  }
};

// Get user's wallet balance
export const getWalletBalance = async (req, res) => {
  try {
    const { userId } = req.user;

    const wallet = await Wallet.findOne({ userId });
    const balance = wallet ? wallet.balance : 0;

    res.json({
      success: true,
      balance,
    });
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    res.status(500).json({
      success: false,
      message: "Error getting wallet balance",
      error: error.message,
    });
  }
};

// Admin: Get all payout requests
export const getAllPayoutRequests = async (req, res) => {
  try {
    const payouts = await Payout.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      payouts,
    });
  } catch (error) {
    console.error("Error getting all payout requests:", error);
    res.status(500).json({
      success: false,
      message: "Error getting payout requests",
      error: error.message,
    });
  }
};

// Admin: Update payout status
export const updatePayoutStatus = async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { status, adminNotes } = req.body;

    const payout = await Payout.findById(payoutId);
    if (!payout) {
      return res.status(404).json({
        success: false,
        message: "Payout request not found",
      });
    }

    // If status is being changed to completed or approved, handle the payout
    if (
      (status === "completed" || status === "approved") &&
      payout.status !== "completed" &&
      payout.status !== "approved"
    ) {
      // Handle different types of withdrawals
      if (payout.withdrawalType === "fund") {
        // For fund withdrawals, deduct from funds and create payout_received transaction
        const Funds = (await import("../models/Funds.js")).default;
        const funds = await Funds.findOne({ userId: payout.userId });

        if (!funds) {
          return res.status(404).json({
            success: false,
            message: "User funds not found",
          });
        }

        // Check if user still has sufficient funds
        if (funds[payout.fundType] < payout.amount) {
          return res.status(400).json({
            success: false,
            message: `Insufficient funds in ${payout.fundType}. User has ₹${
              funds[payout.fundType]
            } but trying to withdraw ₹${payout.amount}`,
          });
        }

        // Deduct from funds
        await funds.deductFunds(payout.fundType, payout.amount);

        // Create payout_received transaction in wallet
        const wallet = await Wallet.findOne({ userId: payout.userId });
        if (wallet) {
          wallet.transactions.push({
            type: "payout_received",
            amount: payout.netAmount,
            description: `Fund withdrawal payout received - ${payout.fundType} - Net amount: ₹${payout.netAmount}`,
            status: "completed",
            reference: `PAYOUT_RECEIVED_${payout._id}`,
            fundType: payout.fundType,
            createdAt: new Date(),
          });
          await wallet.save();
        }
      } else if (payout.withdrawalType === "special_income") {
        // For special income withdrawals, deduct from special income and create payout_received transaction
        const SpecialIncome = (await import("../models/SpecialIncome.js"))
          .default;
        const specialIncome = await SpecialIncome.findOne({
          userId: payout.userId,
        });

        if (!specialIncome) {
          return res.status(404).json({
            success: false,
            message: "User special income not found",
          });
        }

        // Check if user still has sufficient special income
        if (specialIncome[payout.incomeType] < payout.amount) {
          return res.status(400).json({
            success: false,
            message: `Insufficient special income in ${
              payout.incomeType
            }. User has ₹${
              specialIncome[payout.incomeType]
            } but trying to withdraw ₹${payout.amount}`,
          });
        }

        // Deduct from special income
        specialIncome[payout.incomeType] -= payout.amount;
        await specialIncome.save();

        // Create payout_received transaction in wallet
        const wallet = await Wallet.findOne({ userId: payout.userId });
        if (wallet) {
          wallet.transactions.push({
            type: "payout_received",
            amount: payout.netAmount,
            description: `Special income withdrawal payout received - ${payout.incomeType} - Net amount: ₹${payout.netAmount}`,
            status: "completed",
            reference: `PAYOUT_RECEIVED_${payout._id}`,
            incomeType: payout.incomeType,
            createdAt: new Date(),
          });
          await wallet.save();
        }
      } else {
        // For regular wallet withdrawals, deduct from wallet and create transactions

        const wallet = await Wallet.findOne({ userId: payout.userId });
        if (!wallet) {
          return res.status(404).json({
            success: false,
            message: "User wallet not found",
          });
        }

        // Check if user has sufficient balance
        if (wallet.balance < payout.amount) {
          return res.status(400).json({
            success: false,
            message: "Insufficient balance for payout",
          });
        }

        // Get active and passive income from wallet
        let activeIncome = wallet.activeIncome || 0;
        let passiveIncome = wallet.passiveIncome || 0;

        // No global payout-requests gate
        const totalPayoutRequests = await Payout.countDocuments();

        // Get user's referrals
        const userReferrals = await User.find({ sponsorId: payout.userId });
        const totalReferrals = userReferrals.length;

        // Get referrals who have purchased courses (regular + super package)
        const directIds3 = userReferrals.map((ref) => ref.userId);
        const regularPurchases3 = await Purchase.aggregate([
          {
            $match: {
              purchaserId: { $in: directIds3 },
              paymentStatus: "completed",
            },
          },
          { $group: { _id: "$purchaserId" } },
        ]);
        const superPurchases3 = await SuperPackagePurchase.aggregate([
          {
            $match: {
              purchaserId: { $in: directIds3 },
              paymentStatus: "completed",
            },
          },
          { $group: { _id: "$purchaserId" } },
        ]);
        const buyersSet3 = new Set([
          ...regularPurchases3.map((p) => p._id),
          ...superPurchases3.map((p) => p._id),
        ]);
        const referralsWithCoursePurchases = buyersSet3.size;

        // Check conditions for passive income eligibility (aligned rules)
        const hasMinimumPayoutRequests = true; // no global gate
        const hasMinimumReferrals = totalReferrals >= 10;
        const hasMinimumCoursePurchases = referralsWithCoursePurchases >= 7;
        const isEligibleForPassiveIncome =
          hasMinimumPayoutRequests &&
          hasMinimumReferrals &&
          hasMinimumCoursePurchases;

        // Determine withdrawal type and deduct accordingly
        let withdrawalType = "none";
        let deductionDescription = "";
        let activeDeduction = 0;
        let passiveDeduction = 0;

        // SIMPLE LOGIC: Always deduct from active income if available, then passive income
        if (activeIncome > 0) {
          // User has active income - deduct from it first
          withdrawalType = "active_only";
          activeDeduction = Math.min(payout.amount, activeIncome);
          deductionDescription = `Payout withdrawal from Active Income - Net received: ₹${payout.netAmount}`;
        } else if (passiveIncome > 0 && isEligibleForPassiveIncome) {
          // User has passive income and is eligible - deduct from passive
          withdrawalType = "passive_only";
          passiveDeduction = Math.min(payout.amount, passiveIncome);
          deductionDescription = `Payout withdrawal from Passive Income - Net received: ₹${payout.netAmount}`;
        } else if (
          activeIncome > 0 &&
          passiveIncome > 0 &&
          isEligibleForPassiveIncome
        ) {
          // User has both active and passive income and is eligible
          withdrawalType = "both";
          // Deduct from active income first, then passive if needed
          if (activeIncome >= payout.amount) {
            activeDeduction = payout.amount;
          } else {
            activeDeduction = activeIncome;
            passiveDeduction = payout.amount - activeIncome;
          }
          deductionDescription = `Payout withdrawal from Active & Passive Income - Net received: ₹${payout.netAmount}`;
        } else {
          // Fallback: deduct from total balance
          withdrawalType = "total_balance";
          deductionDescription = `Payout withdrawal from Total Balance - Net received: ₹${payout.netAmount}`;
        }

        // Deduct from specific income sources
        if (activeDeduction > 0) {
          const oldActiveIncome = wallet.activeIncome;
          wallet.activeIncome = Math.max(
            0,
            wallet.activeIncome - activeDeduction
          );
        }
        if (passiveDeduction > 0) {
          const oldPassiveIncome = wallet.passiveIncome;
          wallet.passiveIncome = Math.max(
            0,
            wallet.passiveIncome - passiveDeduction
          );
        }

        // Deduct the gross amount from wallet balance
        const oldBalance = wallet.balance;
        wallet.balance -= payout.amount;

        // Add a withdrawal transaction to wallet with detailed description
        wallet.transactions.push({
          type: "withdrawal",
          amount: -payout.amount, // Negative amount for withdrawal
          description: deductionDescription,
          status: "completed",
          reference: `PAYOUT_${payout._id}`,
          withdrawalType: withdrawalType,
          createdAt: new Date(),
        });

        // Add a positive transaction to show money received from admin (for Credited Amount section)
        wallet.transactions.push({
          type: "payout_received",
          amount: payout.netAmount, // Positive amount for money received
          description: `Payout received from admin - Net amount: ₹${payout.netAmount}`,
          status: "completed",
          reference: `PAYOUT_RECEIVED_${payout._id}`,
          withdrawalType: withdrawalType,
          createdAt: new Date(),
        });
        await wallet.save();
      }
    }

    // If status is being changed from completed/approved to something else, reverse the deduction
    if (
      (payout.status === "completed" || payout.status === "approved") &&
      status !== "completed" &&
      status !== "approved"
    ) {
      const wallet = await Wallet.findOne({ userId: payout.userId });
      if (wallet) {
        // Find the original withdrawal transaction to get withdrawal type
        const originalWithdrawal = wallet.transactions.find(
          (t) =>
            t.reference === `PAYOUT_${payout._id}` && t.type === "withdrawal"
        );

        let reversalDescription = `Payout reversal - Status changed to ${status}`;
        let activeRestore = 0;
        let passiveRestore = 0;

        if (originalWithdrawal && originalWithdrawal.withdrawalType) {
          reversalDescription = `Payout reversal (${originalWithdrawal.withdrawalType}) - Status changed from ${payout.status} to ${status}`;

          // Restore the specific income sources based on withdrawal type
          if (originalWithdrawal.withdrawalType === "active_only") {
            activeRestore = payout.amount;
          } else if (originalWithdrawal.withdrawalType === "passive_only") {
            passiveRestore = payout.amount;
          } else if (originalWithdrawal.withdrawalType === "both") {
            // For both, we need to restore proportionally
            // This is a simplified approach - in a real scenario, you might want to store the exact breakdown
            const totalIncome =
              wallet.activeIncome + wallet.passiveIncome + payout.amount;
            if (totalIncome > 0) {
              const activeRatio = wallet.activeIncome / totalIncome;
              const passiveRatio = wallet.passiveIncome / totalIncome;
              activeRestore = Math.round(payout.amount * activeRatio);
              passiveRestore = payout.amount - activeRestore;
            } else {
              // Fallback: restore equally
              activeRestore = Math.round(payout.amount / 2);
              passiveRestore = payout.amount - activeRestore;
            }
          }
        }

        // Restore the specific income sources
        if (activeRestore > 0) {
          wallet.activeIncome += activeRestore;
        }
        if (passiveRestore > 0) {
          wallet.passiveIncome += passiveRestore;
        }

        // Add back the amount to balance
        wallet.balance += payout.amount;

        // Add a reversal transaction
        wallet.transactions.push({
          type: "refund",
          amount: payout.amount, // Positive amount for reversal
          description: reversalDescription,
          status: "completed",
          reference: `PAYOUT_REVERSAL_${payout._id}`,
          withdrawalType: originalWithdrawal?.withdrawalType || "total_balance",
          createdAt: new Date(),
        });

        // Remove the payout_received transaction if it exists
        wallet.transactions = wallet.transactions.filter(
          (t) => t.reference !== `PAYOUT_RECEIVED_${payout._id}`
        );

        await wallet.save();
      }
    }

    payout.status = status;
    if (adminNotes) {
      payout.adminNotes = adminNotes;
    }

    if (status === "completed" || status === "approved") {
      payout.processedDate = new Date();
    }

    await payout.save();

    res.json({
      success: true,
      message: "Payout status updated successfully",
      payout,
    });
  } catch (error) {
    console.error("Error updating payout status:", error);
    res.status(500).json({
      success: false,
      message: "Error updating payout status",
      error: error.message,
    });
  }
};
