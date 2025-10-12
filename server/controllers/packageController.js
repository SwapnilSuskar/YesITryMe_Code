import Package from "../models/Package.js";
import Purchase from "../models/Purchase.js";
import Wallet from "../models/Wallet.js";
import referralService from "../services/referralService.js";
import User from "../models/User.js";
import notificationService from "../services/notificationService.js";
import { calculateAndUpdateMLMLevel } from "../services/mlmService.js";
// Get all available packages
export const getPackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true });
    res.status(200).json({
      success: true,
      data: packages,
    });
  } catch (error) {
    console.error("Error fetching packages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch packages",
    });
  }
};

// Purchase a package and distribute commissions
export const purchasePackage = async (req, res) => {
  try {
    const { packageId, packageName, paymentMethod } = req.body;
    const userId = req.user.userId; // From auth middleware

    // Validate package - try packageId first, then packageName
    let packageData;
    if (packageId) {
      packageData = await Package.findOne({ _id: packageId, isActive: true });
    }

    if (!packageData && packageName) {
      packageData = await Package.findOne({
        name: packageName,
        isActive: true,
      });
    }

    if (!packageData) {
      return res.status(400).json({
        success: false,
        message: "Invalid package or package not available",
      });
    }

    // Check if user already purchased this package
    const existingPurchase = await Purchase.findOne({
      purchaserId: userId,
      packageId: packageData._id,
      status: "active",
    });

    if (existingPurchase) {
      return res.status(400).json({
        success: false,
        message: "You have already purchased this package",
      });
    }

    // Process purchase and commission distribution
    const purchaseData = {
      purchaserId: userId,
      packageId: packageData._id,
      packageName: packageData.name,
      packagePrice: packageData.price,
      paymentMethod: paymentMethod,
    };

    const result = await referralService.processPackagePurchase(purchaseData);

    // Update user status to 'active' and set activation date only if not already set
    const user = await User.findOne({ userId });
    if (user) {
      if (!user.activationDate) {
        user.activationDate = new Date();
      }
      user.status = "active";
      await user.save();
      
      // Update MLM level after package purchase
      await calculateAndUpdateMLMLevel(userId);
    }

    // Create activation notification for purchaser
    try {
      await notificationService.createActivationNotification(
        userId,
        packageData.name,
        packageData.price
      );
    } catch (err) {
      console.error("Error creating activation notification:", err);
    }

    res.status(200).json({
      success: true,
      message: "Package purchased successfully",
      data: {
        purchaseId: result.purchaseId,
        packageName: packageData.name,
        packagePrice: packageData.price,
        totalCommissionDistributed: result.totalCommissionDistributed,
        distributions: result.distributions.length,
      },
    });
  } catch (error) {
    console.error("Error purchasing package:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to purchase package",
    });
  }
};

// Get user's purchase history
export const getUserPurchases = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const purchases = await Purchase.find({ purchaserId: userId })
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Purchase.countDocuments({ purchaserId: userId });

    res.status(200).json({
      success: true,
      data: {
        purchases,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching user purchases:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchase history",
    });
  }
};

// Get purchase details with commission distribution
export const getPurchaseDetails = async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const userId = req.user.userId;

    const purchase = await Purchase.findOne({
      purchaseId: purchaseId,
      purchaserId: userId,
    });

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });
    }

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    console.error("Error fetching purchase details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchase details",
    });
  }
};

// Get commission earnings summary
export const getCommissionSummary = async (req, res) => {
  try {
    const userId = req.user.userId;
    const summary = await referralService.getCommissionSummary(userId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error fetching commission summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch commission summary",
    });
  }
};

// Get user's genealogy tree
export const getUserGenealogy = async (req, res) => {
  try {
    const userId = req.user.userId;
    const genealogy = await referralService.getUserGenealogy(userId);

    res.status(200).json({
      success: true,
      data: genealogy,
    });
  } catch (error) {
    console.error("Error fetching user genealogy:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch genealogy",
    });
  }
};

// Get user's referrals (people they have referred)
export const getUserReferrals = async (req, res) => {
  try {
    const userId = req.user.userId;
    const referrals = await referralService.getUserReferrals(userId);

    // Group referrals by level
    const referralsByLevel = {};
    referrals.forEach((referral) => {
      if (!referralsByLevel[referral.level]) {
        referralsByLevel[referral.level] = [];
      }
      referralsByLevel[referral.level].push(referral);
    });

    res.status(200).json({
      success: true,
      data: {
        totalReferrals: referrals.length,
        referralsByLevel,
        referrals: referrals,
      },
    });
  } catch (error) {
    console.error("Error fetching user referrals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch referrals",
    });
  }
};

// Get user's referral tree in hierarchical structure
export const getUserReferralTree = async (req, res) => {
  try {
    const userId = req.user.userId;
    const referralTree = await referralService.getUserReferralTree(userId);

    res.status(200).json({
      success: true,
      data: referralTree,
    });
  } catch (error) {
    console.error("Error fetching user referral tree:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch referral tree",
    });
  }
};

// Get commission transactions
export const getCommissionTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(200).json({
        success: true,
        data: {
          transactions: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit,
          },
        },
      });
    }

    const transactions = wallet.transactions
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    const total = wallet.transactions.length;

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching commission transactions:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transactions",
    });
  }
};
