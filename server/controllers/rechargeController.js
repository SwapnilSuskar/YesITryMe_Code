import Recharge from "../models/Recharge.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import { protect } from "../middleware/authMiddleware.js";
import axios from "axios";
import crypto from "crypto";

// ==================== Helper Functions ====================

/**
 * Generate PhonePe payment signature
 */
const generatePhonePeSignature = (payload, saltKey, saltIndex) => {
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64");
  const stringToHash = base64Payload + "/pg/v1/pay" + saltKey;
  const sha256Hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
  const finalString = sha256Hash + saltKey;
  const signature = crypto.createHash("sha256").update(finalString).digest("hex") + "###" + saltIndex;
  return { base64Payload, signature };
};

/**
 * Verify PhonePe callback signature
 */
const verifyPhonePeSignature = (response, saltKey, saltIndex) => {
  try {
    const xVerify = response.headers["x-verify"] || "";
    const [receivedSignature] = xVerify.split("###");
    
    const stringToHash = response.body.response + "/pg/v1/status/" + 
      process.env.PHONEPE_MERCHANT_ID + saltKey;
    const sha256Hash = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const finalString = sha256Hash + saltKey;
    const calculatedSignature = crypto.createHash("sha256").update(finalString).digest("hex");
    
    return calculatedSignature === receivedSignature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
};

/**
 * Operator code mapping for aiTopUp API
 */
export const OPERATOR_CODES = {
  // Prepaid/Topup
  "Airtel": { code: "A", type: "prepaid" },
  "Vodafone": { code: "V", type: "prepaid" },
  "BSNL TOPUP": { code: "BT", type: "prepaid" },
  "RELIANCE JIO": { code: "RC", type: "prepaid" },
  "Idea": { code: "I", type: "prepaid" },
  "BSNL STV": { code: "BSNL", type: "prepaid" },
  // Postpaid
  "Airtel Postpaid": { code: "PAT", type: "postpaid" },
  "Idea Postpaid": { code: "IP", type: "postpaid" },
  "Vodafone Postpaid": { code: "VP", type: "postpaid" },
  "JIO PostPaid": { code: "JPP", type: "postpaid" },
  "BSNL Postpaid": { code: "BSNL", type: "postpaid" },
};

/**
 * Calculate admin and user commission based on operator and amount
 * Commission rates:
 * - Jio: user 0%, admin 0.65%
 * - Airtel: user 0.5%, admin 2%
 * - Vodafone: user 1%, admin 3%
 * - Idea: user 1%, admin 3%
 * - BSNL: user 1%, admin 4%
 */
export const calculateCommissions = (operator, amount) => {
  // Admin commission rates
  const adminRates = {
    "RELIANCE JIO": 0.65,
    "JIO PostPaid": 0.65,
    "Airtel": 2.0,
    "Airtel Postpaid": 2.0,
    "Vodafone": 3.0,
    "Vodafone Postpaid": 3.0,
    "Idea": 3.0,
    "Idea Postpaid": 3.0,
    "BSNL TOPUP": 4.0,
    "BSNL STV": 4.0,
    "BSNL Postpaid": 4.0,
  };

  // User commission rates
  const userRates = {
    "RELIANCE JIO": 0,
    "JIO PostPaid": 0,
    "Airtel": 0.5,
    "Airtel Postpaid": 0.5,
    "Vodafone": 1.0,
    "Vodafone Postpaid": 1.0,
    "Idea": 1.0,
    "Idea Postpaid": 1.0,
    "BSNL TOPUP": 1.0,
    "BSNL STV": 1.0,
    "BSNL Postpaid": 1.0,
  };

  const adminRate = adminRates[operator] || 0.65;
  const userRate = userRates[operator] || 0;

  const adminCommission = (amount * adminRate) / 100;
  const userCommission = (amount * userRate) / 100;

  return {
    adminCommission: Math.round(adminCommission * 100) / 100,
    adminPercentage: adminRate,
    userCommission: Math.round(userCommission * 100) / 100,
    userPercentage: userRate,
  };
};

/**
 * Distribute commissions to admin and user wallets
 */
const distributeCommissions = async (recharge) => {
  try {
    // Distribute admin commission
    const adminUser = await User.findOne({ role: "admin" });
    if (adminUser && recharge.adminCommission > 0) {
      let adminWallet = await Wallet.findOne({ userId: adminUser.userId });
      if (!adminWallet) {
        adminWallet = new Wallet({
          userId: adminUser.userId,
          balance: 0,
          totalEarned: 0,
        });
      }

      adminWallet.balance += recharge.adminCommission;
      adminWallet.totalEarned += recharge.adminCommission;
      adminWallet.passiveIncome += recharge.adminCommission;

      adminWallet.transactions.push({
        type: "commission",
        amount: recharge.adminCommission,
        description: `Recharge commission from ${recharge.mobileNumber} (${recharge.operator}) - ₹${recharge.amount}`,
        status: "completed",
        reference: `RECHARGE_ADMIN_COMM_${recharge._id}`,
        incomeType: "recharge_commission",
        createdAt: new Date(),
      });

      await adminWallet.save();
      console.log(`✅ Admin commission distributed: ₹${recharge.adminCommission}`);
    }

    // Distribute user commission
    if (recharge.userCommission > 0) {
      let userWallet = await Wallet.findOne({ userId: recharge.userId });
      if (!userWallet) {
        userWallet = new Wallet({
          userId: recharge.userId,
          balance: 0,
          totalEarned: 0,
        });
      }

      userWallet.balance += recharge.userCommission;
      userWallet.totalEarned += recharge.userCommission;
      userWallet.activeIncome += recharge.userCommission;

      userWallet.transactions.push({
        type: "commission",
        amount: recharge.userCommission,
        description: `Recharge commission from your recharge - ₹${recharge.amount} (${recharge.operator})`,
        status: "completed",
        reference: `RECHARGE_USER_COMM_${recharge._id}`,
        incomeType: "recharge_commission",
        createdAt: new Date(),
      });

      await userWallet.save();
      console.log(`✅ User commission distributed: ₹${recharge.userCommission}`);
    }

    recharge.commissionDistributed = true;
    await recharge.save();

    return true;
  } catch (error) {
    console.error("Error distributing commissions:", error);
    return false;
  }
};

// ==================== API Endpoints ====================

/**
 * Fetch recharge plans from aiTopUp API
 */
export const fetchRechargePlans = async (req, res) => {
  try {
    const { mobileNumber, operator, circle, rechargeType = "prepaid" } = req.query;

    if (!mobileNumber || !operator || !circle) {
      return res.status(400).json({
        success: false,
        message: "Mobile number, operator, and circle are required",
      });
    }

    // Get operator code from operator name
    const operatorInfo = OPERATOR_CODES[operator];
    if (!operatorInfo) {
      return res.status(400).json({
        success: false,
        message: "Invalid operator selected",
      });
    }

    // Call aiTopUp API to fetch plans using operator code
    const aiTopUpResponse = await axios.get(
      `${process.env.AITOPUP_BASE_URL}/api/recharge/plans`,
      {
        params: {
          mobile: mobileNumber,
          operator: operatorInfo.code,
          circle: circle,
          type: operatorInfo.type || rechargeType,
        },
        headers: {
          Authorization: `Bearer ${process.env.AITOPUP_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (aiTopUpResponse.data && aiTopUpResponse.data.success) {
      return res.status(200).json({
        success: true,
        data: aiTopUpResponse.data.data,
        message: "Plans fetched successfully",
      });
    } else {
      return res.status(400).json({
        success: false,
        message: aiTopUpResponse.data?.message || "Failed to fetch plans",
      });
    }
  } catch (error) {
    console.error("Error fetching recharge plans:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recharge plans",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Initiate recharge - Create payment request
 */
export const initiateRecharge = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      mobileNumber,
      operator,
      circle,
      amount,
      rechargeType = "prepaid",
      planId = "",
      planDescription = "",
      paymentMethod = "phonepe",
    } = req.body;

    // Validation
    if (!mobileNumber || !operator || !circle || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "All fields are required and amount must be greater than 0",
      });
    }

    // Validate mobile number format
    if (!/^[6-9]\d{9}$/.test(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: "Invalid mobile number format",
      });
    }

    // Get operator code and type
    const operatorInfo = OPERATOR_CODES[operator];
    if (!operatorInfo) {
      return res.status(400).json({
        success: false,
        message: "Invalid operator selected",
      });
    }

    // Calculate commissions
    const commissionData = calculateCommissions(operator, parseFloat(amount));

    // Determine recharge type from operator
    const actualRechargeType = operatorInfo.type || rechargeType;

    // Create recharge record
    const recharge = new Recharge({
      userId,
      mobileNumber,
      operator,
      operatorCode: operatorInfo.code,
      circle,
      rechargeType: actualRechargeType,
      amount: parseFloat(amount),
      planId,
      planDescription,
      paymentMethod,
      status: "pending",
      adminCommission: commissionData.adminCommission,
      adminCommissionPercentage: commissionData.adminPercentage,
      userCommission: commissionData.userCommission,
      userCommissionPercentage: commissionData.userPercentage,
      paymentInitiatedAt: new Date(),
    });

    await recharge.save();

    // Generate PhonePe payment request
    const merchantTransactionId = `RECHARGE_${recharge._id}_${Date.now()}`;
    const phonePePayload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      merchantTransactionId: merchantTransactionId,
      amount: Math.round(amount * 100), // Amount in paise
      merchantUserId: userId,
      redirectUrl: `${process.env.FRONTEND_URL}/recharge/callback`,
      redirectMode: "REDIRECT",
      callbackUrl: `${process.env.BACKEND_URL || process.env.FRONTEND_URL}/api/recharge/payment-callback`,
      mobileNumber: mobileNumber,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    const { base64Payload, signature } = generatePhonePeSignature(
      phonePePayload,
      process.env.PHONEPE_SALT_KEY,
      process.env.PHONEPE_SALT_INDEX
    );

    // Store PhonePe details
    recharge.phonePeOrderId = merchantTransactionId;
    await recharge.save();

    // Make PhonePe API call
    const phonePeResponse = await axios.post(
      `${process.env.PHONEPE_BASE_URL}/pg/v1/pay`,
      { request: base64Payload },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": signature,
          accept: "application/json",
        },
      }
    );

    if (phonePeResponse.data && phonePeResponse.data.success) {
      recharge.phonePeResponse = phonePeResponse.data;
      recharge.phonePeTransactionId = phonePeResponse.data.data?.transactionId || "";
      await recharge.save();

      return res.status(200).json({
        success: true,
        message: "Payment initiated successfully",
        data: {
          rechargeId: recharge._id,
          paymentUrl: phonePeResponse.data.data?.instrumentResponse?.redirectInfo?.url,
          merchantTransactionId: merchantTransactionId,
        },
      });
    } else {
      recharge.status = "failed";
      recharge.failureReason = phonePeResponse.data?.message || "Payment initiation failed";
      await recharge.save();

      return res.status(400).json({
        success: false,
        message: "Failed to initiate payment",
        error: phonePeResponse.data?.message || "Payment gateway error",
      });
    }
  } catch (error) {
    console.error("Error initiating recharge:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to initiate recharge",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * PhonePe payment callback handler
 */
export const phonePeCallback = async (req, res) => {
  try {
    const { transactionId, merchantTransactionId } = req.body;

    // Find recharge record
    const recharge = await Recharge.findOne({
      phonePeOrderId: merchantTransactionId,
    });

    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: "Recharge transaction not found",
      });
    }

    // Verify payment status with PhonePe
    const statusResponse = await axios.get(
      `${process.env.PHONEPE_BASE_URL}/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}`,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          "X-VERIFY": `${crypto
            .createHash("sha256")
            .update(
              `/pg/v1/status/${process.env.PHONEPE_MERCHANT_ID}/${merchantTransactionId}${process.env.PHONEPE_SALT_KEY}`
            )
            .digest("hex")}###${process.env.PHONEPE_SALT_INDEX}`,
          "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID,
        },
      }
    );

    if (statusResponse.data && statusResponse.data.success) {
      const paymentStatus = statusResponse.data.data?.state;

      if (paymentStatus === "COMPLETED") {
        // Payment successful, initiate recharge with aiTopUp
        recharge.status = "payment_success";
        recharge.paymentCompletedAt = new Date();
        recharge.phonePeTransactionId = transactionId || statusResponse.data.data?.transactionId || "";
        recharge.phonePeResponse = statusResponse.data.data;
        await recharge.save();

        // Process recharge with aiTopUp
        try {
          await processRechargeWithAiTopUp(recharge);
        } catch (rechargeError) {
          console.error("Recharge processing error:", rechargeError);
          // Handle failure and initiate refund
          await handleFailedRecharge(recharge, rechargeError.message);
        }
      } else if (paymentStatus === "FAILED") {
        recharge.status = "failed";
        recharge.failureReason = statusResponse.data.data?.responseCode || "Payment failed";
        await recharge.save();
      }
    }

    // Redirect to frontend
    return res.redirect(
      `${process.env.FRONTEND_URL}/recharge/status?rechargeId=${recharge._id}&status=${recharge.status}`
    );
  } catch (error) {
    console.error("Payment callback error:", error.response?.data || error.message);
    return res.status(500).json({
      success: false,
      message: "Payment callback processing failed",
    });
  }
};

/**
 * Process recharge with aiTopUp API
 */
const processRechargeWithAiTopUp = async (recharge) => {
  try {
    recharge.status = "processing";
    recharge.rechargeInitiatedAt = new Date();
    await recharge.save();

    // Call aiTopUp API to process recharge using operator code
    const rechargePayload = {
      mobile: recharge.mobileNumber,
      operator: recharge.operatorCode,
      circle: recharge.circle,
      amount: recharge.amount,
      type: recharge.rechargeType,
      planId: recharge.planId || undefined,
    };

    const aiTopUpResponse = await axios.post(
      `${process.env.AITOPUP_BASE_URL}/api/recharge/process`,
      rechargePayload,
      {
        headers: {
          Authorization: `Bearer ${process.env.AITOPUP_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (aiTopUpResponse.data && aiTopUpResponse.data.success) {
      // Recharge successful
      recharge.status = "success";
      recharge.rechargeCompletedAt = new Date();
      recharge.aiTopUpOrderId = aiTopUpResponse.data.data?.orderId || "";
      recharge.aiTopUpTransactionId = aiTopUpResponse.data.data?.transactionId || "";
      recharge.aiTopUpResponse = aiTopUpResponse.data.data;
      await recharge.save();

      // Distribute commissions (admin + user)
      await distributeCommissions(recharge);

      console.log(`✅ Recharge successful: ${recharge.mobileNumber}, Amount: ₹${recharge.amount}`);
    } else {
      // Recharge failed
      throw new Error(aiTopUpResponse.data?.message || "Recharge failed");
    }
  } catch (error) {
    console.error("aiTopUp recharge error:", error.response?.data || error.message);
    throw error;
  }
};

/**
 * Handle failed recharge and initiate refund
 */
const handleFailedRecharge = async (recharge, reason) => {
  try {
    recharge.status = "failed";
    recharge.failureReason = reason;
    recharge.rechargeCompletedAt = new Date();
    await recharge.save();

    // Initiate PhonePe refund
    const refundPayload = {
      merchantId: process.env.PHONEPE_MERCHANT_ID,
      transactionId: recharge.phonePeTransactionId,
      amount: Math.round(recharge.amount * 100),
    };

    const refundResponse = await axios.post(
      `${process.env.PHONEPE_BASE_URL}/pg/v1/refund`,
      refundPayload,
      {
        headers: {
          "Content-Type": "application/json",
          accept: "application/json",
          "X-VERIFY": `${crypto
            .createHash("sha256")
            .update(
              `/pg/v1/refund${JSON.stringify(refundPayload)}${process.env.PHONEPE_SALT_KEY}`
            )
            .digest("hex")}###${process.env.PHONEPE_SALT_INDEX}`,
          "X-MERCHANT-ID": process.env.PHONEPE_MERCHANT_ID,
        },
      }
    );

    if (refundResponse.data && refundResponse.data.success) {
      recharge.status = "refunded";
      recharge.refundReason = reason;
      recharge.refundedAt = new Date();
      recharge.refundTransactionId = refundResponse.data.data?.refundId || "";
      await recharge.save();

      console.log(`💰 Refund processed: ₹${recharge.amount} for ${recharge.mobileNumber}`);
    }
  } catch (error) {
    console.error("Refund processing error:", error.response?.data || error.message);
    recharge.adminNotes = `Refund initiation failed: ${error.message}`;
    await recharge.save();
  }
};

/**
 * Check recharge status
 */
export const checkRechargeStatus = async (req, res) => {
  try {
    const { rechargeId } = req.params;
    const userId = req.user.userId;

    const recharge = await Recharge.findOne({
      _id: rechargeId,
      userId: userId,
    });

    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: "Recharge transaction not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: recharge,
    });
  } catch (error) {
    console.error("Error checking recharge status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to check recharge status",
    });
  }
};

/**
 * Get user recharge history
 */
export const getRechargeHistory = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { userId };
    if (status && status !== "all") {
      query.status = status;
    }

    const recharges = await Recharge.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Recharge.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: {
        recharges,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalRecords: total,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching recharge history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recharge history",
    });
  }
};

// ==================== Admin Endpoints ====================

/**
 * Admin: Get all recharge transactions
 */
export const getAllRecharges = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, operator, startDate, endDate } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    if (status && status !== "all") {
      query.status = status;
    }
    if (operator && operator !== "all") {
      query.operator = operator;
    }
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const recharges = await Recharge.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get user details separately since userId is a string, not ObjectId
    const userIds = [...new Set(recharges.map(r => r.userId))];
    const users = await User.find({ userId: { $in: userIds } });
    const userMap = users.reduce((map, user) => {
      map[user.userId] = user;
      return map;
    }, {});

    // Attach user data to recharges
    const rechargesWithUsers = recharges.map(recharge => {
      const rechargeObj = recharge.toObject();
      return {
        ...rechargeObj,
        user: userMap[recharge.userId] || null,
      };
    });

    const total = await Recharge.countDocuments(query);

    // Calculate stats
    const totalRevenue = await Recharge.aggregate([
      { $match: { ...query, status: "success" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalCommission = await Recharge.aggregate([
      { $match: { ...query, status: "success", commissionDistributed: true } },
      { $group: { _id: null, total: { $sum: "$adminCommission" } } },
    ]);

    return res.status(200).json({
      success: true,
      data: {
        recharges: rechargesWithUsers,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalRecords: total,
        },
        stats: {
          totalRevenue: totalRevenue[0]?.total || 0,
          totalCommission: totalCommission[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching all recharges:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recharge transactions",
    });
  }
};

/**
 * Admin: Get recharge statistics
 */
export const getRechargeStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate || endDate) {
      dateQuery.createdAt = {};
      if (startDate) dateQuery.createdAt.$gte = new Date(startDate);
      if (endDate) dateQuery.createdAt.$lte = new Date(endDate);
    }

    const [
      totalTransactions,
      successfulRecharges,
      failedRecharges,
      totalRevenue,
      totalCommission,
      operatorStats,
    ] = await Promise.all([
      Recharge.countDocuments(dateQuery),
      Recharge.countDocuments({ ...dateQuery, status: "success" }),
      Recharge.countDocuments({ ...dateQuery, status: "failed" }),
      Recharge.aggregate([
        { $match: { ...dateQuery, status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Recharge.aggregate([
        { $match: { ...dateQuery, status: "success", commissionDistributed: true } },
        { $group: { _id: null, total: { $sum: "$adminCommission" } } },
      ]),
      Recharge.aggregate([
        { $match: { ...dateQuery, status: "success" } },
        {
          $group: {
            _id: "$operator",
            count: { $sum: 1 },
            revenue: { $sum: "$amount" },
            commission: { $sum: "$adminCommission" },
          },
        },
        { $sort: { revenue: -1 } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalTransactions,
        successfulRecharges,
        failedRecharges,
        pendingRecharges: totalTransactions - successfulRecharges - failedRecharges,
        totalRevenue: totalRevenue[0]?.total || 0,
        totalCommission: totalCommission[0]?.total || 0,
        operatorStats,
      },
    });
  } catch (error) {
    console.error("Error fetching recharge stats:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recharge statistics",
    });
  }
};

/**
 * Admin: Update recharge record
 */
export const updateRecharge = async (req, res) => {
  try {
    const { rechargeId } = req.params;
    const updateData = req.body;

    const recharge = await Recharge.findById(rechargeId);
    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: "Recharge record not found",
      });
    }

    // Recalculate commissions if amount or operator changed
    if (updateData.amount || updateData.operator) {
      const operator = updateData.operator || recharge.operator;
      const amount = parseFloat(updateData.amount || recharge.amount);
      const commissionData = calculateCommissions(operator, amount);

      updateData.adminCommission = commissionData.adminCommission;
      updateData.adminCommissionPercentage = commissionData.adminPercentage;
      updateData.userCommission = commissionData.userCommission;
      updateData.userCommissionPercentage = commissionData.userPercentage;

      // If operator changed, update operatorCode
      if (updateData.operator) {
        const operatorInfo = OPERATOR_CODES[updateData.operator];
        if (operatorInfo) {
          updateData.operatorCode = operatorInfo.code;
          updateData.rechargeType = operatorInfo.type || recharge.rechargeType;
        }
      }
    }

    // Update the recharge record
    const updatedRecharge = await Recharge.findByIdAndUpdate(
      rechargeId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Recharge record updated successfully",
      data: updatedRecharge,
    });
  } catch (error) {
    console.error("Error updating recharge:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update recharge record",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Admin: Delete recharge record
 */
export const deleteRecharge = async (req, res) => {
  try {
    const { rechargeId } = req.params;

    const recharge = await Recharge.findById(rechargeId);
    if (!recharge) {
      return res.status(404).json({
        success: false,
        message: "Recharge record not found",
      });
    }

    // Only allow deletion if commission hasn't been distributed or if status is pending/failed
    if (recharge.commissionDistributed && recharge.status === "success") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete recharge record with distributed commissions. Please mark as cancelled instead.",
      });
    }

    await Recharge.findByIdAndDelete(rechargeId);

    return res.status(200).json({
      success: true,
      message: "Recharge record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting recharge:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete recharge record",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

