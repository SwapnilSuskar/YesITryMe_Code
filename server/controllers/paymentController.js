import PaymentVerification from "../models/PaymentVerification.js";
import User from "../models/User.js";
import Package from "../models/Package.js";
import Purchase from "../models/Purchase.js";
import referralService from "../services/referralService.js";
import notificationService from "../services/notificationService.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { compressPaymentProof } from "../utils/imageCompression.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Submit payment verification request
export const submitPaymentVerification = async (req, res) => {
  try {
    const {
      packageId,
      paymentAmount,
      paymentMethod,
      transactionId,
      payerName,
      payerMobile,
      payerEmail,
      additionalNotes,
    } = req.body;

    const userId = req.user.userId;

    // Check if user already has a pending verification for this package
    const existingVerification = await PaymentVerification.findOne({
      userId,
      packageId,
      status: "pending",
    });

    if (existingVerification) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending payment verification for this package",
      });
    }

    // Get package details
    const packageDetails = await Package.findById(packageId);
    if (!packageDetails) {
      return res.status(404).json({
        success: false,
        message: "Package not found",
      });
    }

    // Handle payment proof upload
    if (!req.files || !req.files.paymentProof) {
      return res.status(400).json({
        success: false,
        message: "Payment proof is required",
      });
    }

    const file = req.files.paymentProof;

    // Compress and resize payment proof image before uploading
    const compressedImageBuffer = await compressPaymentProof(file.data);

    // Upload to Cloudinary using buffer
    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "payment-proofs",
          resource_type: "auto",
          transformation: [
            { quality: "auto", fetch_format: "auto" }, // Auto-optimize format and quality
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );
      uploadStream.end(compressedImageBuffer);
    });

    const result = await uploadPromise;

    // Create payment verification record
    const paymentVerification = new PaymentVerification({
      userId,
      packageId,
      packageName: packageDetails.name,
      packagePrice: packageDetails.price,
      paymentAmount,
      paymentMethod,
      transactionId,
      paymentProofUrl: result.secure_url,
      payerName,
      payerMobile,
      payerEmail,
      additionalNotes,
    });

    await paymentVerification.save();

    res.status(201).json({
      success: true,
      message:
        "Payment verification submitted successfully with optimized proof. We will review and activate your account soon.",
      data: {
        verificationId: paymentVerification._id,
        status: paymentVerification.status,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to submit payment verification",
      error: error.message,
    });
  }
};

// Get user's payment verification status
export const getUserPaymentStatus = async (req, res) => {
  try {
    const userId = req.user.userId;

    const verifications = await PaymentVerification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: verifications,
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment status",
    });
  }
};

// Admin: Get all payment verifications
export const getAllPaymentVerifications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    let query = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const verifications = await PaymentVerification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get user details for each verification
    const userIds = [...new Set(verifications.map((v) => v.userId))];
    const users = await User.find({ userId: { $in: userIds } });
    const userMap = users.reduce((map, user) => {
      map[user.userId] = user;
      return map;
    }, {});

    const verificationsWithUserData = verifications.map((verification) => {
      const verificationObj = verification.toObject();
      return {
        ...verificationObj,
        user: userMap[verification.userId] || null,
        // Ensure all required fields are present
        _id: verificationObj._id,
        userId: verificationObj.userId,
        packageId: verificationObj.packageId,
        packageName: verificationObj.packageName,
        packagePrice: verificationObj.packagePrice,
        paymentAmount: verificationObj.paymentAmount,
        paymentMethod: verificationObj.paymentMethod,
        transactionId: verificationObj.transactionId,
        paymentProofUrl: verificationObj.paymentProofUrl,
        payerName: verificationObj.payerName,
        payerMobile: verificationObj.payerMobile,
        payerEmail: verificationObj.payerEmail,
        additionalNotes: verificationObj.additionalNotes,
        status: verificationObj.status,
        adminNotes: verificationObj.adminNotes,
        submittedAt: verificationObj.submittedAt,
        verifiedAt: verificationObj.verifiedAt,
        verifiedBy: verificationObj.verifiedBy,
        rejectionReason: verificationObj.rejectionReason,
        purchaseId: verificationObj.purchaseId,
        purchaseRecord: verificationObj.purchaseRecord,
        createdAt: verificationObj.createdAt,
        updatedAt: verificationObj.updatedAt,
      };
    });

    const total = await PaymentVerification.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        verifications: verificationsWithUserData,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / limit),
          totalRecords: total,
        },
      },
    });
  } catch (error) {
    console.error("Get all payment verifications error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment verifications",
    });
  }
};

// Admin: Get single payment verification
export const getPaymentVerification = async (req, res) => {
  try {
    const { id } = req.params;

    const verification = await PaymentVerification.findById(id);
    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Payment verification not found",
      });
    }

    // Get user details
    const user = await User.findOne({ userId: verification.userId });

    // Get purchase record if verification is verified
    let purchaseRecord = null;
    if (verification.purchaseRecord) {
      purchaseRecord = await Purchase.findById(verification.purchaseRecord);
    }

    // Combine verification and user data into a single object
    const verificationWithUser = {
      ...verification.toObject(),
      user: user || null,
      purchaseRecord: purchaseRecord || null,
    };

    res.status(200).json({
      success: true,
      data: verificationWithUser,
    });
  } catch (error) {
    console.error("Get payment verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment verification",
    });
  }
};

// Admin: Verify payment and activate user
export const verifyPayment = async (req, res) => {
  try {
    // console.log("Verify payment request received");
    // console.log("Request params:", req.params);
    // console.log("Request body:", req.body);
    // console.log("User:", req.user);

    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.userId;

    // console.log("Verification ID:", id);
    // console.log("Admin ID:", adminId);

    const verification = await PaymentVerification.findById(id);
    // console.log("Found verification:", verification);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Payment verification not found",
      });
    }

    if (verification.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Payment verification is not pending",
      });
    }

    // Update verification status
    verification.status = "verified";
    verification.verifiedAt = new Date();
    verification.verifiedBy = adminId;
    verification.adminNotes = adminNotes || "";
    await verification.save();

    // Activate user and create purchase record
    const user = await User.findOne({ userId: verification.userId });
    if (user) {
      user.status = "active";
      user.activationDate = new Date();
      await user.save();
    }

    // Create activation notification
    try {
     
      const notification =
        await notificationService.createActivationNotification(
          verification.userId,
          verification.packageName,
          verification.packagePrice
        );
      
    } catch (error) {
      console.error("❌ Error creating activation notification:", error);
      // Don't fail the payment verification if notification fails
    }

    // Process purchase and commission distribution using referral service
    // Convert payment method to a valid format
    let paymentMethod = verification.paymentMethod;
    if (paymentMethod.toLowerCase().includes("google pay")) {
      paymentMethod = "google_pay";
    } else if (paymentMethod.toLowerCase().includes("phonepe")) {
      paymentMethod = "phonepe";
    } else if (paymentMethod.toLowerCase().includes("paytm")) {
      paymentMethod = "paytm";
    } else if (paymentMethod.toLowerCase().includes("amazon pay")) {
      paymentMethod = "amazon_pay";
    } else if (paymentMethod.toLowerCase().includes("net banking")) {
      paymentMethod = "net_banking";
    } else if (paymentMethod.toLowerCase().includes("credit card")) {
      paymentMethod = "credit_card";
    } else if (paymentMethod.toLowerCase().includes("debit card")) {
      paymentMethod = "debit_card";
    } else if (paymentMethod.toLowerCase().includes("upi")) {
      paymentMethod = "upi";
    } else if (paymentMethod.toLowerCase().includes("bank transfer")) {
      paymentMethod = "bank_transfer";
    } else if (paymentMethod.toLowerCase().includes("online")) {
      paymentMethod = "online";
    } else if (paymentMethod.toLowerCase().includes("cash")) {
      paymentMethod = "cash";
    }

    const purchaseData = {
      purchaserId: verification.userId,
      packageId: verification.packageId,
      packageName: verification.packageName,
      packagePrice: verification.packagePrice,
      paymentMethod: paymentMethod,
    };

    let result;
    try {
      result = await referralService.processPackagePurchase(purchaseData);

      // Update verification record with purchase reference
      verification.purchaseId = result.purchaseId;
      verification.purchaseRecord = result.purchaseObjectId; // Use the actual Purchase ObjectId
      await verification.save();
    } catch (purchaseError) {
      console.error(
        "❌ Error processing purchase and commission distribution:",
        purchaseError
      );

      // Revert verification status to pending if purchase fails
      verification.status = "pending";
      verification.verifiedAt = null;
      verification.verifiedBy = null;
      verification.adminNotes =
        (verification.adminNotes || "") +
        " [AUTO-REVERTED: Purchase processing failed]";
      await verification.save();

      throw new Error(`Payment verification failed: ${purchaseError.message}`);
    }

    res.status(200).json({
      success: true,
      message: "Payment verified and user activated successfully",
      data: {
        purchaseId: result.purchaseId,
        totalCommissionDistributed: result.totalCommissionDistributed,
        distributions: result.distributions.length,
      },
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify payment",
    });
  }
};

// Admin: Reject payment verification
export const rejectPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;
    const adminId = req.user.userId;

    const verification = await PaymentVerification.findById(id);

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: "Payment verification not found",
      });
    }

    if (verification.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Payment verification is not pending",
      });
    }

    // Update verification status
    verification.status = "rejected";
    verification.rejectionReason = rejectionReason || "";
    verification.adminNotes = adminNotes || "";
    verification.verifiedAt = new Date();
    verification.verifiedBy = adminId;
    await verification.save();

    res.status(200).json({
      success: true,
      message: "Payment verification rejected",
    });
  } catch (error) {
    console.error("Reject payment error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reject payment verification",
    });
  }
};

// Get payment verification stats
export const getPaymentStats = async (req, res) => {
  try {
    const [pending, verified, rejected, total] = await Promise.all([
      PaymentVerification.countDocuments({ status: "pending" }),
      PaymentVerification.countDocuments({ status: "verified" }),
      PaymentVerification.countDocuments({ status: "rejected" }),
      PaymentVerification.countDocuments(),
    ]);

    // Get recent verifications (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recent = await PaymentVerification.countDocuments({
      createdAt: { $gte: sevenDaysAgo },
    });

    res.status(200).json({
      success: true,
      data: {
        pending,
        verified,
        rejected,
        total,
        recent,
      },
    });
  } catch (error) {
    console.error("Get payment stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payment statistics",
    });
  }
};
