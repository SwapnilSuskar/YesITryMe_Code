import SuperPackage from "../models/SuperPackage.js";
import SuperPackagePaymentVerification from "../models/SuperPackagePaymentVerification.js";
import SuperPackagePurchase from "../models/SuperPackagePurchase.js";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import referralService from "../services/referralService.js";
import notificationService from "../services/notificationService.js";
import { sendSuperPackagePurchaseReceipt } from "../services/emailReceiptService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";

// Helper function to generate commission structure for ₹500 distribution
const generateCommissionStructure = () => {
  const structure = [];

  // Level 1: ₹250 (50%)
  structure.push({ level: 1, percentage: 50, amount: 250 });

  // Level 2: ₹100 (20%)
  structure.push({ level: 2, percentage: 20, amount: 100 });

  // Level 3: ₹50 (10%)
  structure.push({ level: 3, percentage: 10, amount: 50 });

  // Level 4: ₹10 (2%)
  structure.push({ level: 4, percentage: 2, amount: 10 });

  // Level 5: ₹10 (2%)
  structure.push({ level: 5, percentage: 2, amount: 10 });

  // Levels 6-20: ₹5 each (1% each) - 15 levels
  for (let i = 6; i <= 20; i++) {
    structure.push({ level: i, percentage: 1, amount: 5 });
  }

  // Levels 21-120: ₹0.05 each (0.01% each) - 100 levels
  for (let i = 21; i <= 120; i++) {
    structure.push({ level: i, percentage: 0.01, amount: 0.05 });
  }

  return structure;
};

// Helper function to distribute commissions using the same logic as regular packages
const distributeSuperPackageCommissions = async (
  user,
  superPackage,
  purchase
) => {
  try {

    // Get sponsor genealogy using the same logic as regular packages
    const sponsors = await referralService.getSponsorGenealogy(user.userId);

    const commissionDistributions = [];
    let totalCommissionDistributed = 0;
    let unassignedCommission = 0;

    // Calculate total commission to be distributed (₹500 for non-Booster packages)
    const totalCommissionToDistribute = superPackage.commissionStructure.reduce(
      (sum, level) => sum + level.amount,
      0
    );

    // Create a map of sponsor levels for quick lookup
    const sponsorMap = new Map();
    sponsors.forEach((sponsor) => {
      sponsorMap.set(sponsor.level, sponsor);
    });

    // Distribute commissions to each sponsor according to the commission structure
    for (const commissionLevel of superPackage.commissionStructure) {
      const sponsor = sponsorMap.get(commissionLevel.level);

      if (sponsor && commissionLevel.amount > 0) {
        // Find or create wallet for sponsor
        let wallet = await Wallet.findOne({ userId: sponsor.userId });
        if (!wallet) {
          wallet = new Wallet({
            userId: sponsor.userId,
            balance: 0,
            totalEarned: 0,
          });
        }

        // Add commission to wallet
        wallet.balance += commissionLevel.amount;
        wallet.totalEarned += commissionLevel.amount;

        // Add transaction record
        wallet.transactions.push({
          type: "commission",
          amount: commissionLevel.amount,
          description: `Level ${sponsor.level} commission from ${purchase.purchaserName}'s ${superPackage.name} purchase`,
          packageName: superPackage.name,
          purchaserId: purchase.purchaserId,
          purchaserName: purchase.purchaserName,
          level: sponsor.level,
          status: "completed",
        });

        await wallet.save();
        // Create commission notification
        try {
         
          const notification =
            await notificationService.createCommissionNotification(
              sponsor.userId,
              commissionLevel.amount,
              sponsor.level,
              purchase.purchaserName,
              superPackage.name
            );
          
        } catch (error) {
          console.error(
            `❌ Error creating commission notification for ${sponsor.userId}:`,
            error
          );
          // Don't fail the commission distribution if notification fails
        }

        // Record the commission distribution
        commissionDistributions.push({
          level: sponsor.level,
          sponsorId: sponsor.userId,
          sponsorName: `${sponsor.firstName} ${sponsor.lastName}`,
          percentage: commissionLevel.percentage,
          amount: commissionLevel.amount,
          status: "distributed",
          distributedAt: new Date(),
        });

        totalCommissionDistributed += commissionLevel.amount;
      } else {
        // No sponsor at this level, add to unassigned commission
        unassignedCommission += commissionLevel.amount;
       
      }
    }

    // If there's unassigned commission, assign it to admin
    if (unassignedCommission > 0) {
      try {
        // Find admin user (assuming admin has role 'admin')
        const adminUser = await User.findOne({ role: "admin" });

        if (adminUser) {
          // Find or create wallet for admin
          let adminWallet = await Wallet.findOne({ userId: adminUser.userId });
          if (!adminWallet) {
            adminWallet = new Wallet({
              userId: adminUser.userId,
              balance: 0,
              totalEarned: 0,
            });
          }

          // Record unassigned commission as passive income only (do not add to wallet balance)
          adminWallet.totalEarned += unassignedCommission;
          adminWallet.passiveIncome += unassignedCommission;

          // Add transaction record for admin
          adminWallet.transactions.push({
            type: "commission",
            amount: unassignedCommission,
            description: `Unassigned commission from ${purchase.purchaserName}'s ${superPackage.name} purchase (missing levels)`,
            packageName: superPackage.name,
            purchaserId: purchase.purchaserId,
            purchaserName: purchase.purchaserName,
            // No level field for admin commissions (not required)
            status: "completed",
          });

          await adminWallet.save();

          

          // Record the admin commission distribution
          commissionDistributions.push({
            level: 120, // Use max level (120) to indicate admin commission
            sponsorId: adminUser.userId,
            sponsorName: `${adminUser.firstName} ${adminUser.lastName} (Admin)`,
            percentage:
              (unassignedCommission / totalCommissionToDistribute) * 100,
            amount: unassignedCommission,
            status: "distributed",
            distributedAt: new Date(),
          });

          totalCommissionDistributed += unassignedCommission;
        } else {
          
        }
      } catch (adminError) {
        console.error(
          "❌ Error assigning unassigned commission to admin:",
          adminError
        );
      }
    }

    // Update purchase record with commission distributions
    purchase.commissionDistributions = commissionDistributions;
    purchase.totalCommissionDistributed = totalCommissionDistributed;
    await purchase.save();

    
  } catch (error) {
    console.error("❌ Error distributing Super Package commissions:", error);
    throw error;
  }
};

// Helper function to update user MLM level
const updateUserMLMLevel = async (userId) => {
  const user = await User.findOne({ userId: userId });
  if (!user) return;

  // Check if user has any active purchases
  const activePurchases = await SuperPackagePurchase.find({
    purchaserId: userId,
    status: "active",
  });

  if (activePurchases.length > 0) {
    // User has active purchases, set to "Active Member"
    if (user.mlmLevel !== "Active Member") {
      user.mlmLevel = "Active Member";
      await user.save();
    }
  } else {
    // No active purchases, set to "Free"
    if (user.mlmLevel !== "Free") {
      user.mlmLevel = "Free";
      await user.save();
    }
  }
};

// Create a new super package
const createSuperPackage = asyncHandler(async (req, res) => {
  const { name, price, description } = req.body;

  if (!name || !price || !description) {
    throw new ApiError(400, "Name, price, and description are required");
  }

  // Check if package with same name already exists
  const existingPackage = await SuperPackage.findOne({ name });
  if (existingPackage) {
    throw new ApiError(400, "Package with this name already exists");
  }

  // Generate commission structure (₹500 distribution for all packages except Booster)
  const commissionStructure = name.toLowerCase().includes("booster")
    ? [] // No distribution for Booster Package
    : generateCommissionStructure();

  const superPackage = await SuperPackage.create({
    name,
    price,
    description,
    commissionStructure,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, superPackage, "Super Package created successfully")
    );
});

// Get all super packages (admin view - includes active and inactive)
const getAllSuperPackages = asyncHandler(async (req, res) => {
  const superPackages = await SuperPackage.find().sort({ price: 1 });

  return res
    .status(200)
    .json(
      new ApiResponse(200, superPackages, "Super Packages fetched successfully")
    );
});

// Get active super packages (user view - only active packages)
const getActiveSuperPackages = asyncHandler(async (req, res) => {
  const superPackages = await SuperPackage.find({ isActive: true }).sort({
    price: 1,
  });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        superPackages,
        "Active Super Packages fetched successfully"
      )
    );
});

// Get super package by ID
const getSuperPackageById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const superPackage = await SuperPackage.findById(id);
  if (!superPackage) {
    throw new ApiError(404, "Super Package not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, superPackage, "Super Package fetched successfully")
    );
});

// Update super package
const updateSuperPackage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, price, description, isActive } = req.body;

  const superPackage = await SuperPackage.findById(id);
  if (!superPackage) {
    throw new ApiError(404, "Super Package not found");
  }

  // Check if name is being changed and if it conflicts with existing package
  if (name && name !== superPackage.name) {
    const existingPackage = await SuperPackage.findOne({
      name,
      _id: { $ne: id },
    });
    if (existingPackage) {
      throw new ApiError(400, "Package with this name already exists");
    }
  }

  // Update commission structure if name changes (Booster vs others)
  let commissionStructure = superPackage.commissionStructure;
  if (name && name !== superPackage.name) {
    commissionStructure = name.toLowerCase().includes("booster")
      ? [] // No distribution for Booster Package
      : generateCommissionStructure();
  }

  const updatedSuperPackage = await SuperPackage.findByIdAndUpdate(
    id,
    {
      name,
      price,
      description,
      isActive,
      commissionStructure,
    },
    { new: true }
  );

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedSuperPackage,
        "Super Package updated successfully"
      )
    );
});

// Delete super package
const deleteSuperPackage = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const superPackage = await SuperPackage.findById(id);
  if (!superPackage) {
    throw new ApiError(404, "Super Package not found");
  }

  await SuperPackage.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Super Package deleted successfully"));
});

// Toggle super package status
const toggleSuperPackageStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const superPackage = await SuperPackage.findById(id);
  if (!superPackage) {
    throw new ApiError(404, "Super Package not found");
  }

  superPackage.isActive = !superPackage.isActive;
  await superPackage.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        superPackage,
        "Super Package status updated successfully"
      )
    );
});

// Get super package statistics
const getSuperPackageStats = asyncHandler(async (req, res) => {
  const totalPackages = await SuperPackage.countDocuments();
  const activePackages = await SuperPackage.countDocuments({ isActive: true });
  const inactivePackages = await SuperPackage.countDocuments({
    isActive: false,
  });

  const stats = {
    totalPackages,
    activePackages,
    inactivePackages,
  };

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        stats,
        "Super Package statistics fetched successfully"
      )
    );
});

// Purchase super package (payment verification submission)
const purchaseSuperPackage = asyncHandler(async (req, res) => {
  try {
    const {
      superPackageId,
      paymentAmount,
      paymentMethod,
      transactionId,
      payerName,
      payerMobile,
      payerEmail,
      additionalNotes,
    } = req.body;

    const userId = req.user?.userId;
    
    if (!userId) {
      throw new ApiError(401, "User authentication required");
    }

    // Validate required fields
    if (
      !superPackageId ||
      !paymentAmount ||
      !paymentMethod ||
      !transactionId ||
      !payerName ||
      !payerMobile ||
      !payerEmail
    ) {
      throw new ApiError(400, "All required fields must be provided");
    }

    // Check if super package exists
    const superPackage = await SuperPackage.findById(superPackageId);
    if (!superPackage) {
      throw new ApiError(404, "Super Package not found");
    }

    // Check if super package is active
    if (!superPackage.isActive) {
      throw new ApiError(400, "This super package is not available for purchase");
    }

    // Validate payment amount (allow small floating point differences)
    const packagePrice = parseFloat(superPackage.price);
    const providedAmount = parseFloat(paymentAmount);
    if (Math.abs(packagePrice - providedAmount) > 0.01) {
      throw new ApiError(
        400,
        `Payment amount (${providedAmount}) must match the super package price (${packagePrice})`
      );
    }

    // Check if transaction ID already exists
    const existingVerification = await SuperPackagePaymentVerification.findOne({
      transactionId,
    });
    if (existingVerification) {
      throw new ApiError(400, "Transaction ID already exists");
    }

    // Handle payment proof upload
    let paymentProofUrl = "";
    if (req.files && req.files.paymentProof) {
      try {
        const file = req.files.paymentProof;
        
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new ApiError(400, "File size must be less than 10MB");
        }

        // For production (Vercel/serverless), prefer buffer over temp files
        let uploadSource;
        if (file.data) {
          // Use buffer (works in all environments)
          uploadSource = file.data;
        } else if (file.tempFilePath && fs.existsSync(file.tempFilePath)) {
          // Use temp file if available (local development)
          uploadSource = file.tempFilePath;
        } else {
          throw new ApiError(400, "Invalid file upload. Please try again.");
        }

        const result = await cloudinary.uploader.upload(
          uploadSource,
          {
            folder: "super-package-payments",
            use_filename: true,
            unique_filename: true,
            overwrite: false,
            resource_type: "auto",
          }
        );
        paymentProofUrl = result.secure_url;

        // Clean up temporary file if it exists (only in local dev)
        if (
          file.tempFilePath &&
          fs.existsSync(file.tempFilePath)
        ) {
          try {
            fs.unlinkSync(file.tempFilePath);
          } catch (cleanupError) {
            console.warn("Failed to cleanup temp file:", cleanupError);
          }
        }
      } catch (error) {
        console.error("Payment proof upload error:", error);
        
        // Clean up temporary file if it exists
        if (
          req.files.paymentProof.tempFilePath &&
          fs.existsSync(req.files.paymentProof.tempFilePath)
        ) {
          try {
            fs.unlinkSync(req.files.paymentProof.tempFilePath);
          } catch (cleanupError) {
            console.warn("Failed to cleanup temp file:", cleanupError);
          }
        }
        
        if (error instanceof ApiError) {
          throw error;
        }
        throw new ApiError(500, `Failed to upload payment proof: ${error.message || "Unknown error"}`);
      }
    } else {
      throw new ApiError(400, "Payment proof is required");
    }

    // Create payment verification record
    const paymentVerification = await SuperPackagePaymentVerification.create({
      userId,
      superPackageId,
      superPackageName: superPackage.name,
      superPackagePrice: superPackage.price,
      paymentAmount: providedAmount,
      paymentMethod,
      transactionId,
      paymentProofUrl,
      payerName,
      payerMobile,
      payerEmail,
      additionalNotes: additionalNotes || "",
    });

    return res
      .status(201)
      .json(
        new ApiResponse(
          201,
          paymentVerification,
          "Payment verification submitted successfully"
        )
      );
  } catch (error) {
    console.error("Purchase super package error:", error);
    
    // If it's already an ApiError, re-throw it
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Otherwise, wrap it in an ApiError
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Failed to submit payment verification"
    );
  }
});

// Get user's super package purchases
const getUserSuperPackagePurchases = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const purchases = await SuperPackagePurchase.find({
    purchaserId: userId,
  }).sort({ purchaseDate: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { purchases },
        "Super package purchases fetched successfully"
      )
    );
});

// Get user's own payment verifications
const getUserSuperPackagePaymentVerifications = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const verifications = await SuperPackagePaymentVerification.find({
    userId: userId,
  })
    .populate("superPackageId", "name price")
    .sort({ submittedAt: -1 });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { verifications },
        "Payment verifications fetched successfully"
      )
    );
});

// Get super package commission summary for user
const getSuperPackageCommissionSummary = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  try {
    // Get user's wallet
    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            balance: 0,
            totalEarned: 0,
            totalSpent: 0,
            totalWithdrawn: 0,
            transactions: [],
            totalTransactions: 0,
          },
          "Super package commission summary fetched successfully"
        )
      );
    }

    // Get user's own super package purchases
    const userPurchases = await SuperPackagePurchase.find({
      purchaserId: userId,
    });
    const totalSpent = userPurchases.reduce(
      (sum, purchase) => sum + purchase.superPackagePrice,
      0
    );

    // Get Super Package commission transactions from wallet
    const superPackageTransactions = wallet.transactions.filter(
      (t) =>
        t.type === "commission" &&
        t.packageName &&
        (t.packageName.toLowerCase().includes("booster") ||
          t.packageName.toLowerCase().includes("bronze") ||
          t.packageName.toLowerCase().includes("silver") ||
          t.packageName.toLowerCase().includes("gold") ||
          t.packageName.toLowerCase().includes("diamond"))
    );

    // Calculate Super Package specific active and passive income
    const superPackageActiveIncome = superPackageTransactions
      .filter((t) => t.level === 1)
      .reduce((sum, t) => sum + t.amount, 0);

    const superPackagePassiveIncome = superPackageTransactions
      .filter((t) => t.level >= 2 && t.level <= 120)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalEarned = superPackageTransactions.reduce(
      (sum, t) => sum + t.amount,
      0
    );
    const balance = wallet.balance; // Use wallet balance directly

    const summary = {
      balance: balance,
      activeIncome: superPackageActiveIncome,
      passiveIncome: superPackagePassiveIncome,
      totalEarned: totalEarned,
      totalSpent: totalSpent,
      totalWithdrawn: wallet.totalWithdrawn,
      transactions: superPackageTransactions.slice(0, 10), // First 10 transactions
      totalTransactions: superPackageTransactions.length,
    };

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          summary,
          "Super package commission summary fetched successfully"
        )
      );
  } catch (error) {
    console.error("Error getting Super Package commission summary:", error);
    return res
      .status(500)
      .json(
        new ApiResponse(
          500,
          null,
          "Failed to fetch Super Package commission summary"
        )
      );
  }
});

// Get super package commission transactions for user
const getSuperPackageCommissionTransactions = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { page = 1, limit = 10 } = req.query;

  const skip = (page - 1) * limit;

  // Get user's wallet
  const wallet = await Wallet.findOne({ userId });

  if (!wallet) {
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          transactions: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        },
        "Super package commission transactions fetched successfully"
      )
    );
  }

  // Get Super Package commission transactions from wallet
  const superPackageTransactions = wallet.transactions.filter(
    (t) =>
      t.type === "commission" &&
      t.packageName &&
      (t.packageName.toLowerCase().includes("booster") ||
        t.packageName.toLowerCase().includes("bronze") ||
        t.packageName.toLowerCase().includes("silver") ||
        t.packageName.toLowerCase().includes("gold") ||
        t.packageName.toLowerCase().includes("diamond"))
  );

  // Sort by creation date (newest first)
  superPackageTransactions.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Apply pagination
  const total = superPackageTransactions.length;
  const paginatedTransactions = superPackageTransactions.slice(
    skip,
    skip + parseInt(limit)
  );

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        transactions: paginatedTransactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
      "Super package commission transactions fetched successfully"
    )
  );
});

// Get all payment verifications (admin only)
const getAllSuperPackagePaymentVerifications = asyncHandler(
  async (req, res) => {
    const { status, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    const verifications = await SuperPackagePaymentVerification.find(query)
      .populate({
        path: "userId",
        select: "firstName lastName email mobile",
        model: "User",
        localField: "userId",
        foreignField: "userId",
      })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SuperPackagePaymentVerification.countDocuments(query);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          verifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit),
          },
        },
        "Payment verifications fetched successfully"
      )
    );
  }
);

// Update payment verification status (admin only)
const updateSuperPackagePaymentVerificationStatus = asyncHandler(
  async (req, res) => {
    const { verificationId } = req.params;
    const { status, adminNotes, rejectionReason } = req.body;
    const adminId = req.user.userId;

    if (!["verified", "rejected"].includes(status)) {
      throw new ApiError(400, "Status must be either 'verified' or 'rejected'");
    }

    const verification = await SuperPackagePaymentVerification.findById(
      verificationId
    );
    if (!verification) {
      throw new ApiError(404, "Payment verification not found");
    }

    if (verification.status !== "pending") {
      throw new ApiError(
        400,
        "Payment verification has already been processed"
      );
    }

    // Update verification status
    verification.status = status;
    verification.adminNotes = adminNotes || "";
    verification.verifiedAt = new Date();
    verification.verifiedBy = adminId;

    if (status === "rejected") {
      verification.rejectionReason = rejectionReason || "";
    }

    await verification.save();

    // If verified, create purchase record and distribute commissions
    if (status === "verified") {
      try {
        // Generate purchase ID
        const purchaseId = `SPP${Date.now()}${Math.random()
          .toString(36)
          .substr(2, 5)
          .toUpperCase()}`;

        // Create purchase record
        const purchase = await SuperPackagePurchase.create({
          purchaseId,
          purchaserId: verification.userId,
          purchaserName: verification.payerName,
          superPackageId: verification.superPackageId,
          superPackageName: verification.superPackageName,
          superPackagePrice: verification.superPackagePrice,
          paymentMethod: verification.paymentMethod,
          paymentStatus: "completed",
          status: "active",
          purchaseDate: new Date(),
        });

        // Update verification with purchase reference
        verification.purchaseId = purchaseId;
        verification.purchaseRecord = purchase._id;
        await verification.save();

        // Get user and their sponsor chain for commission distribution
        const user = await User.findOne({ userId: verification.userId });
        if (!user) {
          throw new ApiError(404, "User not found");
        }

        // Get super package details
        const superPackage = await SuperPackage.findById(
          verification.superPackageId
        );
        if (!superPackage) {
          throw new ApiError(404, "Super package not found");
        }

        // Distribute commissions if package has commission structure (not Booster)
        if (
          superPackage.commissionStructure &&
          superPackage.commissionStructure.length > 0
        ) {
          await distributeSuperPackageCommissions(user, superPackage, purchase);
        }

        // Update user's MLM level if needed
        await updateUserMLMLevel(user.userId);

        // Activate user when Super Package is purchased
        if (user.status !== "active") {
          user.status = "active";
          user.activationDate = new Date();
          await user.save();
          
        }

        // Create activation notification
        try {
          
          const notification =
            await notificationService.createActivationNotification(
              verification.userId,
              verification.superPackageName,
              verification.superPackagePrice
            );
          
        } catch (error) {
          console.error(
            "❌ Error creating Super Package activation notification:",
            error
          );
          // Don't fail the payment verification if notification fails
        }

        // Send email receipt
        try {
          await sendSuperPackagePurchaseReceipt(
            purchase.toObject(),
            verification.toObject(),
            {
              userId: user.userId,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              mobile: user.mobile,
            }
          );
        } catch (emailError) {
          console.error("Error sending super package purchase receipt email:", emailError);
          // Don't fail the verification if email fails
        }
      } catch (error) {
        console.error("Error processing verified payment:", error);
        // Don't fail the verification update, but log the error
      }
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          verification,
          `Payment verification ${status} successfully`
        )
      );
  }
);

// Get super package referral stats for the last 7 days
export const getSuperPackageReferralStats7Days = async (req, res) => {
  try {
    const userId = req.user.userId;
    const directStats = await referralService.getDirectReferralsLast7Days(
      userId
    );
    const downlineStats = await referralService.getDownlineReferralsLast7Days(
      userId
    );

    // Combine direct and indirect stats correctly
    const combinedStats = directStats.map((directItem, index) => {
      const downlineItem = downlineStats[index] || { count: 0 };
      // Calculate indirect count by subtracting direct from total downline
      const indirectCount = Math.max(0, downlineItem.count - directItem.count);
      return {
        date: directItem.date,
        count: downlineItem.count, // Total is the downline count (includes direct + indirect)
        directCount: directItem.count,
        indirectCount: indirectCount,
      };
    });

    res.status(200).json({ success: true, data: combinedStats });
  } catch (error) {
    console.error("Error getting super package 7-day referral stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get super package 7-day referral stats",
    });
  }
};

// Get super package downline stats (direct + indirect super package buyers) for the logged-in user
export const getSuperPackageDownlineStats7Days = async (req, res) => {
  try {
    const userId = req.user.userId;
    const period = req.query.period || "7days";

    // Get categorized super package buyers data
    const categorizedData =
      await referralService.getCategorizedSuperPackageBuyersByPeriod(
        userId,
        period
      );

    // Get total categorized super package buyers count
    const totalCategorized =
      await referralService.getTotalCategorizedSuperPackageBuyers(userId);

    // Combine direct and indirect super package buyer stats
    const combinedStats = categorizedData.directBuyers.map(
      (directItem, index) => {
        const indirectItem = categorizedData.indirectBuyers[index] || {
          count: 0,
        };
        return {
          date: directItem.date,
          count: directItem.count + indirectItem.count,
          directCount: directItem.count,
          indirectCount: indirectItem.count,
        };
      }
    );

    res.status(200).json({
      success: true,
      data: combinedStats,
      totalUniqueBuyers: totalCategorized.totalCount,
      directBuyers: totalCategorized.directCount,
      indirectBuyers: totalCategorized.indirectCount,
    });
  } catch (error) {
    console.error("Error getting super package downline stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get super package downline stats",
    });
  }
};

// Get total super package buyers count for the logged-in user
export const getTotalSuperPackageBuyersCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const totalCount = await referralService.getTotalSuperPackageBuyersCount(
      userId
    );

    res.status(200).json({
      success: true,
      data: {
        totalSuperPackageBuyers: totalCount,
      },
    });
  } catch (error) {
    console.error("Error getting total super package buyers count:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get total super package buyers count",
    });
  }
};

export {
  createSuperPackage,
  getAllSuperPackages,
  getActiveSuperPackages,
  getSuperPackageById,
  updateSuperPackage,
  deleteSuperPackage,
  toggleSuperPackageStatus,
  getSuperPackageStats,
  purchaseSuperPackage,
  getUserSuperPackagePurchases,
  getUserSuperPackagePaymentVerifications,
  getSuperPackageCommissionSummary,
  getSuperPackageCommissionTransactions,
  getAllSuperPackagePaymentVerifications,
  updateSuperPackagePaymentVerificationStatus,
};
