import WalletTopUp from "../models/WalletTopUp.js";
import Wallet from "../models/Wallet.js";
import RechargeWallet from "../models/RechargeWallet.js";
import User from "../models/User.js";
import { v2 as cloudinary } from "cloudinary";
import { compressPaymentProof } from "../utils/imageCompression.js";

// Helper function to fetch user by userId string
const fetchUserByUserId = async (userIdString) => {
  if (!userIdString) return null;
  try {
    const user = await User.findOne({ userId: userIdString }).select(
      "userId firstName lastName email mobile"
    );
    return user;
  } catch (error) {
    console.error(`Error fetching user ${userIdString}:`, error);
    return null;
  }
};

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Submit wallet top-up request
export const submitWalletTopUp = async (req, res) => {
  try {
    const {
      paymentAmount,
      paymentMethod,
      transactionId,
      payerName,
      payerMobile,
      payerEmail,
      additionalNotes,
    } = req.body;

    const userId = req.user.userId;

    // Validate and round amount to 2 decimal places to avoid floating-point precision issues
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0 || isNaN(amount)) {
      return res.status(400).json({
        success: false,
        message: "Payment amount must be greater than 0",
      });
    }

    // Validate minimum amount (₹300) for smart wallet top-up
    const MINIMUM_TOPUP_AMOUNT = 300;
    if (amount < MINIMUM_TOPUP_AMOUNT) {
      return res.status(400).json({
        success: false,
        message: `Minimum top-up amount is ₹${MINIMUM_TOPUP_AMOUNT}. Please enter a valid amount.`,
      });
    }

    // Round to 2 decimal places to avoid floating-point precision issues
    const roundedAmount = Math.round(amount * 100) / 100;

    // Check if user already has a pending top-up with same transaction ID
    const existingTopUp = await WalletTopUp.findOne({
      userId,
      transactionId,
      status: "pending",
    });

    if (existingTopUp) {
      return res.status(400).json({
        success: false,
        message:
          "You already have a pending wallet top-up with this transaction ID",
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
          folder: "wallet-topup-proofs",
          resource_type: "auto",
          transformation: [{ quality: "auto", fetch_format: "auto" }],
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

    // Create wallet top-up record
    const walletTopUp = new WalletTopUp({
      userId,
      paymentAmount: roundedAmount,
      paymentMethod,
      transactionId,
      paymentProofUrl: result.secure_url,
      payerName,
      payerMobile,
      payerEmail,
      additionalNotes: additionalNotes || "",
      status: "pending",
    });

    await walletTopUp.save();

    return res.status(201).json({
      success: true,
      message:
        "Wallet top-up request submitted successfully. We will review and credit your wallet soon.",
      data: {
        topUpId: walletTopUp._id,
        status: walletTopUp.status,
      },
    });
  } catch (error) {
    console.error("Wallet top-up submission error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to submit wallet top-up request",
      error: error.message,
    });
  }
};

// Get user's wallet top-up history
export const getWalletTopUpHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const topUps = await WalletTopUp.find({ userId })
      .sort({ submittedAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: {
        topUps: topUps.map((topUp) => ({
          id: topUp._id,
          paymentAmount: topUp.paymentAmount,
          paymentMethod: topUp.paymentMethod,
          transactionId: topUp.transactionId,
          status: topUp.status,
          submittedAt: topUp.submittedAt,
          approvedAt: topUp.approvedAt,
          rejectedAt: topUp.rejectedAt,
          rejectionReason: topUp.rejectionReason,
        })),
      },
    });
  } catch (error) {
    console.error("Get wallet top-up history error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallet top-up history",
      error: error.message,
    });
  }
};

// Admin: Get all wallet top-up requests
export const getAllWalletTopUps = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    let query = {};
    if (status) {
      query.status = status;
    }

    const topUps = await WalletTopUp.find(query)
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await WalletTopUp.countDocuments(query);

    // Get unique user IDs to fetch
    const userIds = [...new Set(topUps.map((t) => t.userId).filter(Boolean))];
    const approvedByIds = [
      ...new Set(topUps.map((t) => t.approvedBy).filter(Boolean)),
    ];
    const rejectedByIds = [
      ...new Set(topUps.map((t) => t.rejectedBy).filter(Boolean)),
    ];
    const allUserIds = [
      ...new Set([...userIds, ...approvedByIds, ...rejectedByIds]),
    ];

    // Fetch all users at once
    const users = await User.find({ userId: { $in: allUserIds } }).select(
      "userId firstName lastName email mobile"
    );
    const userMap = new Map(users.map((u) => [u.userId, u]));

    return res.status(200).json({
      success: true,
      data: {
        topUps: topUps.map((topUp) => {
          const user = userMap.get(topUp.userId);
          const approvedByUser = topUp.approvedBy
            ? userMap.get(topUp.approvedBy)
            : null;
          const rejectedByUser = topUp.rejectedBy
            ? userMap.get(topUp.rejectedBy)
            : null;

          return {
            id: topUp._id,
            user: user
              ? {
                  userId: user.userId,
                  name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
                  email: user.email,
                  mobile: user.mobile,
                }
              : null,
            paymentAmount: topUp.paymentAmount,
            paymentMethod: topUp.paymentMethod,
            transactionId: topUp.transactionId,
            paymentProofUrl: topUp.paymentProofUrl,
            payerName: topUp.payerName,
            payerMobile: topUp.payerMobile,
            payerEmail: topUp.payerEmail,
            additionalNotes: topUp.additionalNotes,
            status: topUp.status,
            adminNotes: topUp.adminNotes,
            submittedAt: topUp.submittedAt,
            approvedAt: topUp.approvedAt,
            approvedBy: approvedByUser
              ? {
                  userId: approvedByUser.userId,
                  name: `${approvedByUser.firstName || ""} ${
                    approvedByUser.lastName || ""
                  }`.trim(),
                }
              : null,
            rejectedAt: topUp.rejectedAt,
            rejectedBy: rejectedByUser
              ? {
                  userId: rejectedByUser.userId,
                  name: `${rejectedByUser.firstName || ""} ${
                    rejectedByUser.lastName || ""
                  }`.trim(),
                }
              : null,
            rejectionReason: topUp.rejectionReason,
          };
        }),
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum,
        },
      },
    });
  } catch (error) {
    console.error("Get all wallet top-ups error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallet top-up requests",
      error: error.message,
    });
  }
};

// Admin: Get single wallet top-up request
export const getWalletTopUp = async (req, res) => {
  try {
    const { id } = req.params;

    const topUp = await WalletTopUp.findById(id);

    if (!topUp) {
      return res.status(404).json({
        success: false,
        message: "Wallet top-up request not found",
      });
    }

    // Fetch user data manually
    const userIds = [topUp.userId, topUp.approvedBy, topUp.rejectedBy].filter(
      Boolean
    );
    const users = await User.find({ userId: { $in: userIds } }).select(
      "userId firstName lastName email mobile"
    );
    const userMap = new Map(users.map((u) => [u.userId, u]));

    const user = userMap.get(topUp.userId);
    const approvedByUser = topUp.approvedBy
      ? userMap.get(topUp.approvedBy)
      : null;
    const rejectedByUser = topUp.rejectedBy
      ? userMap.get(topUp.rejectedBy)
      : null;

    return res.status(200).json({
      success: true,
      data: {
        id: topUp._id,
        user: user
          ? {
              userId: user.userId,
              name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
              email: user.email,
              mobile: user.mobile,
            }
          : null,
        paymentAmount: topUp.paymentAmount,
        paymentMethod: topUp.paymentMethod,
        transactionId: topUp.transactionId,
        paymentProofUrl: topUp.paymentProofUrl,
        payerName: topUp.payerName,
        payerMobile: topUp.payerMobile,
        payerEmail: topUp.payerEmail,
        additionalNotes: topUp.additionalNotes,
        status: topUp.status,
        adminNotes: topUp.adminNotes,
        submittedAt: topUp.submittedAt,
        approvedAt: topUp.approvedAt,
        approvedBy: approvedByUser
          ? {
              userId: approvedByUser.userId,
              name: `${approvedByUser.firstName || ""} ${
                approvedByUser.lastName || ""
              }`.trim(),
            }
          : null,
        rejectedAt: topUp.rejectedAt,
        rejectedBy: rejectedByUser
          ? {
              userId: rejectedByUser.userId,
              name: `${rejectedByUser.firstName || ""} ${
                rejectedByUser.lastName || ""
              }`.trim(),
            }
          : null,
        rejectionReason: topUp.rejectionReason,
      },
    });
  } catch (error) {
    console.error("Get wallet top-up error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallet top-up request",
      error: error.message,
    });
  }
};

// Admin: Approve wallet top-up
export const approveWalletTopUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user.userId;

    const topUp = await WalletTopUp.findById(id);

    if (!topUp) {
      return res.status(404).json({
        success: false,
        message: "Wallet top-up request not found",
      });
    }

    if (topUp.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Wallet top-up request is not pending",
      });
    }

    // Update top-up status
    topUp.status = "approved";
    topUp.approvedAt = new Date();
    topUp.approvedBy = adminId;
    topUp.adminNotes = adminNotes || "";
    await topUp.save();

    // Get or create user's recharge wallet (separate from main wallet - no active/passive income)
    const rechargeWallet = await RechargeWallet.getOrCreateWallet(topUp.userId);

    // Round amount to 2 decimal places to avoid floating-point precision issues
    const amountToAdd = Math.round(topUp.paymentAmount * 100) / 100;

    // Add amount to recharge wallet balance (separate from main wallet)
    rechargeWallet.balance =
      Math.round((rechargeWallet.balance + amountToAdd) * 100) / 100;
    rechargeWallet.totalAdded =
      Math.round((rechargeWallet.totalAdded + amountToAdd) * 100) / 100;

    // Add transaction record
    rechargeWallet.transactions.push({
      type: "topup",
      amount: amountToAdd,
      description: `Recharge wallet top-up approved - Transaction ID: ${topUp.transactionId}`,
      status: "completed",
      reference: topUp.transactionId,
      topUpId: topUp._id,
      adminNotes: adminNotes || "",
    });

    await rechargeWallet.save();

    // Get user details for notification
    const user = await User.findOne({ userId: topUp.userId });
    if (user) {
      // Create notification (if notification service exists)
      try {
        // You can add notification creation here if needed
        console.log(
          `Wallet top-up approved for user ${user.userId}: ₹${topUp.paymentAmount}`
        );
      } catch (error) {
        console.error("Error creating notification:", error);
        // Don't fail the approval if notification fails
      }
    }

    return res.status(200).json({
      success: true,
      message: "Wallet top-up approved successfully",
      data: {
        topUpId: topUp._id,
        amount: topUp.paymentAmount,
        newBalance: rechargeWallet.balance,
      },
    });
  } catch (error) {
    console.error("Approve wallet top-up error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to approve wallet top-up",
      error: error.message,
    });
  }
};

// Admin: Reject wallet top-up
export const rejectWalletTopUp = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason, adminNotes } = req.body;
    const adminId = req.user.userId;

    const topUp = await WalletTopUp.findById(id);

    if (!topUp) {
      return res.status(404).json({
        success: false,
        message: "Wallet top-up request not found",
      });
    }

    if (topUp.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Wallet top-up request is not pending",
      });
    }

    // Update top-up status
    topUp.status = "rejected";
    topUp.rejectedAt = new Date();
    topUp.rejectedBy = adminId;
    topUp.rejectionReason = rejectionReason || "";
    topUp.adminNotes = adminNotes || "";
    await topUp.save();

    return res.status(200).json({
      success: true,
      message: "Wallet top-up rejected successfully",
      data: {
        topUpId: topUp._id,
      },
    });
  } catch (error) {
    console.error("Reject wallet top-up error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reject wallet top-up",
      error: error.message,
    });
  }
};

// Get wallet top-up stats (admin)
export const getWalletTopUpStats = async (req, res) => {
  try {
    const [pending, approved, rejected, total] = await Promise.all([
      WalletTopUp.countDocuments({ status: "pending" }),
      WalletTopUp.countDocuments({ status: "approved" }),
      WalletTopUp.countDocuments({ status: "rejected" }),
      WalletTopUp.countDocuments(),
    ]);

    const recent = await WalletTopUp.countDocuments({
      submittedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    return res.status(200).json({
      success: true,
      data: {
        pending,
        approved,
        rejected,
        total,
        recent,
      },
    });
  } catch (error) {
    console.error("Get wallet top-up stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch wallet top-up stats",
      error: error.message,
    });
  }
};

// Admin: Delete wallet top-up
export const deleteWalletTopUp = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const topUp = await WalletTopUp.findById(id);

    if (!topUp) {
      return res.status(404).json({
        success: false,
        message: "Wallet top-up request not found",
      });
    }

    // Prevent deletion of approved top-ups that have already credited the wallet
    if (topUp.status === "approved") {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete an approved wallet top-up. The amount has already been credited to the user's wallet.",
      });
    }

    // Delete payment proof from Cloudinary if it exists
    if (topUp.paymentProofUrl) {
      try {
        const publicId = topUp.paymentProofUrl.split("/").pop().split(".")[0];
        await cloudinary.uploader.destroy(publicId);
      } catch (cloudinaryError) {
        console.error(
          "Error deleting payment proof from Cloudinary:",
          cloudinaryError
        );
        // Continue with deletion even if Cloudinary deletion fails
      }
    }

    // Delete the top-up record
    await WalletTopUp.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Wallet top-up deleted successfully",
    });
  } catch (error) {
    console.error("Delete wallet top-up error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete wallet top-up",
      error: error.message,
    });
  }
};
