import User from "../models/User.js";
import Purchase from "../models/Purchase.js";
import Wallet from "../models/Wallet.js";
import RechargeWallet from "../models/RechargeWallet.js";
import SuperPackagePurchase from "../models/SuperPackagePurchase.js";
import MotivationQuote from "../models/MotivationQuote.js";
import GalleryImage from "../models/GalleryImage.js";
import Funds from "../models/Funds.js";
import Payout from "../models/Payout.js";
import SpecialIncome from "../models/SpecialIncome.js";
import Kyc from "../models/Kyc.js";
import PaymentVerification from "../models/PaymentVerification.js";
import SuperPackagePaymentVerification from "../models/SuperPackagePaymentVerification.js";
import referralService from "../services/referralService.js";
// Removed referralService import - using aggregation queries instead
import multer from "multer";
import path from "path";
import fs from "fs";
import { compressGalleryImage } from "../utils/imageCompression.js";

// Multer setup for gallery image uploads - using memory storage for serverless
const galleryStorage = multer.memoryStorage();
export const uploadGalleryImageFile = multer({
  storage: galleryStorage,
}).single("image");

// Multer setup for motivation quote image uploads
const motivationQuoteStorage = multer.memoryStorage();
export const uploadMotivationQuoteImage = multer({
  storage: motivationQuoteStorage,
}).single("image");

// Get comprehensive analytics data
export const getAnalytics = async (req, res) => {
  try {
    const { timeRange = "all", startDate: customStart, endDate: customEnd } =
      req.query;

    const now = new Date();
    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    let rangeStart = new Date(0); // default to beginning of time
    let rangeEnd = new Date(endOfToday);

    switch (timeRange) {
      case "today":
        rangeStart = new Date(
          rangeEnd.getFullYear(),
          rangeEnd.getMonth(),
          rangeEnd.getDate()
        );
        break;
      case "week":
        rangeStart = new Date(rangeEnd.getTime() - 6 * 24 * 60 * 60 * 1000);
        rangeStart.setHours(0, 0, 0, 0);
        break;
      case "month":
        rangeStart = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth(), 1);
        break;
      default:
        rangeStart = new Date(0);
        break;
    }

    const parseDateInput = (value) => {
      if (!value) return null;
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    if (customStart) {
      const parsedStart = parseDateInput(customStart);
      if (!parsedStart) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date",
        });
      }
      rangeStart = parsedStart;
    }

    if (customEnd) {
      const parsedEnd = parseDateInput(customEnd);
      if (!parsedEnd) {
        return res.status(400).json({
          success: false,
          message: "Invalid end date",
        });
      }
      rangeEnd = parsedEnd;
    }

    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    if (rangeStart > rangeEnd) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date",
      });
    }

    const shouldFilter = timeRange !== "all" || customStart || customEnd;
    const dateFilter = { $gte: rangeStart, $lte: rangeEnd };

    // User analytics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const kycApprovedUsers = await User.countDocuments({
      kycApprovedDate: { $exists: true, $ne: null },
    });
    const newUsersInRange = await User.countDocuments({
      createdAt: dateFilter,
    });
    const activatedUsersInRange = await User.countDocuments({
      activationDate: dateFilter,
    });

    // Referral analytics - Use simple database queries instead of recursive referral service
    const totalReferrals = await User.countDocuments({
      sponsorId: { $exists: true, $ne: null, $ne: "" },
    });

    // Count active referrers (users who have referred at least one person)
    const activeReferrers = await User.countDocuments({
      userId: {
        $in: await User.distinct("sponsorId", {
          sponsorId: { $exists: true, $ne: null, $ne: "" },
        }),
      },
    });

    // Find top referrer using aggregation
    const topReferrerResult = await User.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "sponsorId",
          as: "referrals",
        },
      },
      {
        $project: {
          userId: 1,
          firstName: 1,
          lastName: 1,
          referralCount: { $size: "$referrals" },
        },
      },
      {
        $match: {
          referralCount: { $gt: 0 },
        },
      },
      {
        $sort: { referralCount: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    const topReferrer =
      topReferrerResult.length > 0
        ? {
            userId: topReferrerResult[0].userId,
            name: `${topReferrerResult[0].firstName} ${topReferrerResult[0].lastName}`,
            referralCount: topReferrerResult[0].referralCount,
          }
        : null;

    const avgReferralsPerUser =
      totalUsers > 0 ? totalReferrals / totalUsers : 0;

    // Purchase analytics
    const purchaseQuery = shouldFilter
      ? { purchaseDate: dateFilter }
      : {};
    const purchases = await Purchase.find(purchaseQuery).sort({
      purchaseDate: 1,
    });

    const totalPurchases = purchases.length;
    const totalRevenue = purchases.reduce(
      (sum, purchase) => sum + parseFloat(purchase.packagePrice || 0),
      0
    );
    const avgPurchaseValue =
      totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

    // Package sales breakdown
    const packagesSold = {};
    purchases.forEach((purchase) => {
      packagesSold[purchase.packageName] =
        (packagesSold[purchase.packageName] || 0) + 1;
    });

    const purchaseTrendMap = {};
    purchases.forEach((purchase) => {
      if (!purchase.purchaseDate) return;
      const dayKey = purchase.purchaseDate.toISOString().split("T")[0];
      if (!purchaseTrendMap[dayKey]) {
        purchaseTrendMap[dayKey] = {
          date: dayKey,
          revenue: 0,
          orders: 0,
        };
      }
      purchaseTrendMap[dayKey].revenue += Number(purchase.packagePrice || 0);
      purchaseTrendMap[dayKey].orders += 1;
    });

    const purchaseTrend = Object.values(purchaseTrendMap).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Commission analytics
    const wallets = await Wallet.find();
    const totalDistributed = wallets.reduce(
      (sum, wallet) =>
        sum +
        wallet.transactions
          .filter((t) => t.type === "commission" && t.status === "completed")
          .reduce((tSum, t) => tSum + parseFloat(t.amount || 0), 0),
      0
    );

    const totalEarned = wallets.reduce(
      (sum, wallet) => sum + parseFloat(wallet.totalEarned || 0),
      0
    );
    const avgCommissionPerUser = totalUsers > 0 ? totalEarned / totalUsers : 0;

    // Find top earner using aggregation for better performance
    const topEarnerResult = await Wallet.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "userId",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          userId: 1,
          firstName: "$user.firstName",
          lastName: "$user.lastName",
          totalEarned: { $toDouble: "$totalEarned" },
        },
      },
      {
        $sort: { totalEarned: -1 },
      },
      {
        $limit: 1,
      },
    ]);

    const topEarner =
      topEarnerResult.length > 0
        ? {
            userId: topEarnerResult[0].userId,
            name: `${topEarnerResult[0].firstName} ${topEarnerResult[0].lastName}`,
            earnings: topEarnerResult[0].totalEarned,
          }
        : null;

    const rangeDiffMs = Math.max(
      0,
      rangeEnd.getTime() - rangeStart.getTime()
    );
    const rangeDays = Math.max(1, Math.floor(rangeDiffMs / 86400000) + 1);

    res.status(200).json({
      success: true,
      data: {
        period: {
          timeRange,
          customRange: Boolean(customStart || customEnd),
          start: rangeStart.toISOString(),
          end: rangeEnd.toISOString(),
          days: rangeDays,
        },
        users: {
          total: Number(totalUsers),
          active: Number(activeUsers),
          kycApproved: Number(kycApprovedUsers),
          newInRange: Number(newUsersInRange),
          activatedInRange: Number(activatedUsersInRange),
        },
        referrals: {
          totalReferrals: Number(totalReferrals),
          activeReferrers: Number(activeReferrers),
          avgReferralsPerUser: Number(avgReferralsPerUser),
          topReferrer,
        },
        purchases: {
          totalPurchases: Number(totalPurchases),
          totalRevenue: Number(totalRevenue),
          avgPurchaseValue: Number(avgPurchaseValue),
          packagesSold,
          trend: purchaseTrend,
        },
        commissions: {
          totalDistributed: Number(totalDistributed),
          totalEarned: Number(totalEarned),
          avgCommissionPerUser: Number(avgCommissionPerUser),
          topEarner,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics",
    });
  }
};

// Get all referral data - Use simple database queries instead of recursive referral service
export const getAllReferrals = async (req, res) => {
  try {
    // Get all users with their direct referrals using aggregation
    const referralData = await User.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "sponsorId",
          as: "directReferrals",
        },
      },
      {
        $project: {
          userId: 1,
          firstName: 1,
          lastName: 1,
          mobile: 1,
          email: 1,
          referralCode: 1,
          isActive: 1,
          referralCount: { $size: "$directReferrals" },
          referrals: { $slice: ["$directReferrals", 5] }, // Limit to first 5 for performance
        },
      },
      {
        $sort: { referralCount: -1 },
      },
    ]);

    res.status(200).json({
      success: true,
      data: referralData,
    });
  } catch (error) {
    console.error("Error fetching all referrals:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch referral data",
    });
  }
};

// Get top referrers - Use aggregation instead of recursive referral service
export const getTopReferrers = async (req, res) => {
  try {
    // Get top referrers using aggregation
    const topReferrers = await User.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "sponsorId",
          as: "referrals",
        },
      },
      {
        $project: {
          userId: 1,
          firstName: 1,
          lastName: 1,
          referralCode: 1,
          referralCount: { $size: "$referrals" },
        },
      },
      {
        $match: {
          referralCount: { $gt: 0 },
        },
      },
      {
        $sort: { referralCount: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.status(200).json({
      success: true,
      data: topReferrers,
    });
  } catch (error) {
    console.error("Error fetching top referrers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch top referrers",
    });
  }
};

// Get referral statistics - Use aggregation instead of recursive referral service
export const getReferralStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    // Count users who have a sponsor (i.e., they were referred by someone)
    const referredUsers = await User.countDocuments({
      sponsorId: { $exists: true, $ne: null, $ne: "" },
    });

    // Count users who have made referrals (active referrers) using aggregation
    const activeReferrersResult = await User.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "sponsorId",
          as: "referrals",
        },
      },
      {
        $match: {
          "referrals.0": { $exists: true }, // Has at least one referral
        },
      },
      {
        $count: "activeReferrers",
      },
    ]);

    const activeReferrers =
      activeReferrersResult.length > 0
        ? activeReferrersResult[0].activeReferrers
        : 0;
    const avgReferralsPerUser = totalUsers > 0 ? referredUsers / totalUsers : 0;

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalReferrals: referredUsers, // This now shows unique referred users
        activeReferrers,
        avgReferralsPerUser,
      },
    });
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch referral statistics",
    });
  }
};

// Get all purchases with details
export const getAllPurchases = async (req, res) => {
  try {
    const { timeRange = "all" } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date(0);

    switch (timeRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const query =
      timeRange !== "all" ? { purchaseDate: { $gte: startDate } } : {};
    const purchases = await Purchase.find(query).sort({ purchaseDate: -1 });

    res.status(200).json({
      success: true,
      data: purchases,
    });
  } catch (error) {
    console.error("Error fetching all purchases:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchase data",
    });
  }
};

// Get purchase statistics
export const getPurchaseStats = async (req, res) => {
  try {
    const { timeRange = "all" } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date(0);

    switch (timeRange) {
      case "today":
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const query =
      timeRange !== "all" ? { purchaseDate: { $gte: startDate } } : {};
    const purchases = await Purchase.find(query);

    const totalPurchases = purchases.length;
    const totalRevenue = purchases.reduce(
      (sum, purchase) => sum + purchase.packagePrice,
      0
    );
    const avgPurchaseValue =
      totalPurchases > 0 ? totalRevenue / totalPurchases : 0;

    // Calculate total commissions distributed
    const totalCommissions = purchases.reduce(
      (sum, purchase) => sum + (purchase.totalCommissionDistributed || 0),
      0
    );

    res.status(200).json({
      success: true,
      data: {
        totalPurchases,
        totalRevenue,
        avgPurchaseValue,
        totalCommissions,
      },
    });
  } catch (error) {
    console.error("Error fetching purchase stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch purchase statistics",
    });
  }
};

// Activation overview for packages, super packages, and registrations
export const getActivationReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const now = new Date();
    const defaultEnd = new Date(now);
    defaultEnd.setHours(23, 59, 59, 999);
    const defaultStart = new Date(defaultEnd);
    defaultStart.setDate(defaultStart.getDate() - 6);
    defaultStart.setHours(0, 0, 0, 0);

    const parseDateInput = (value) => {
      if (!value) return null;
      const parsed = new Date(value);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const parsedStart = parseDateInput(startDate) || new Date(defaultStart);
    const parsedEnd = parseDateInput(endDate) || new Date(defaultEnd);

    parsedStart.setHours(0, 0, 0, 0);
    parsedEnd.setHours(23, 59, 59, 999);

    if (parsedStart > parsedEnd) {
      return res.status(400).json({
        success: false,
        message: "Start date cannot be after end date",
      });
    }

    const dateFilter = { $gte: parsedStart, $lte: parsedEnd };

    const [packagePurchases, superPackagePurchases, registrations] =
      await Promise.all([
        Purchase.find({ purchaseDate: dateFilter })
          .sort({ purchaseDate: -1 })
          .select(
            "purchaseId purchaserId purchaserName packageName packagePrice paymentMethod paymentStatus status purchaseDate totalCommissionDistributed"
          )
          .lean(),
        SuperPackagePurchase.find({ purchaseDate: dateFilter })
          .sort({ purchaseDate: -1 })
          .select(
            "purchaseId purchaserId purchaserName superPackageName superPackagePrice paymentMethod paymentStatus status purchaseDate"
          )
          .lean(),
        User.find({ createdAt: dateFilter })
          .sort({ createdAt: -1 })
          .select(
            "userId firstName lastName email mobile sponsorId sponsorName status createdAt activationDate"
          )
          .lean(),
      ]);

    const packagePurchaseIds = packagePurchases
      .map((purchase) => purchase.purchaseId)
      .filter(Boolean);
    const superPackagePurchaseIds = superPackagePurchases
      .map((purchase) => purchase.purchaseId)
      .filter(Boolean);

    const [packageVerifications, superPackageVerifications] =
      await Promise.all([
        packagePurchaseIds.length
          ? PaymentVerification.find({
              purchaseId: { $in: packagePurchaseIds },
            })
              .select(
                "purchaseId transactionId payerName payerMobile payerEmail paymentMethod verifiedAt submittedAt"
              )
              .lean()
          : [],
        superPackagePurchaseIds.length
          ? SuperPackagePaymentVerification.find({
              purchaseId: { $in: superPackagePurchaseIds },
            })
              .select(
                "purchaseId transactionId payerName payerMobile payerEmail paymentMethod verifiedAt submittedAt"
              )
              .lean()
          : [],
      ]);

    const verificationMap = packageVerifications.reduce((map, verification) => {
      map[verification.purchaseId] = verification;
      return map;
    }, {});

    const superVerificationMap = superPackageVerifications.reduce(
      (map, verification) => {
        map[verification.purchaseId] = verification;
        return map;
      },
      {}
    );

    const userIds = [
      ...new Set(
        [
          ...packagePurchases.map((p) => p.purchaserId),
          ...superPackagePurchases.map((p) => p.purchaserId),
        ].filter(Boolean)
      ),
    ];

    const purchasers =
      userIds.length > 0
        ? await User.find({ userId: { $in: userIds } })
            .select(
              "userId firstName lastName email mobile sponsorId sponsorName status activationDate createdAt"
            )
            .lean()
        : [];

    const userMap = purchasers.reduce((map, purchaser) => {
      map[purchaser.userId] = purchaser;
      return map;
    }, {});

    registrations.forEach((registration) => {
      userMap[registration.userId] = registration;
    });

    const packageActivations = packagePurchases.map((purchase) => {
      const verification = verificationMap[purchase.purchaseId];
      const purchaser = userMap[purchase.purchaserId];

      return {
        purchaseId: purchase.purchaseId,
        purchaserId: purchase.purchaserId,
        purchaserName: purchase.purchaserName,
        packageName: purchase.packageName,
        amount: Number(purchase.packagePrice),
        paymentMethod: purchase.paymentMethod,
        paymentStatus: purchase.paymentStatus,
        status: purchase.status,
        purchaseDate: purchase.purchaseDate,
        transactionId: verification?.transactionId || null,
        payerName: verification?.payerName || purchase.purchaserName,
        sponsorId: purchaser?.sponsorId || null,
        sponsorName: purchaser?.sponsorName || null,
        contact: {
          email: purchaser?.email || verification?.payerEmail || null,
          mobile: purchaser?.mobile || verification?.payerMobile || null,
        },
        activationDate: purchaser?.activationDate || null,
      };
    });

    const superPackageActivations = superPackagePurchases.map((purchase) => {
      const verification = superVerificationMap[purchase.purchaseId];
      const purchaser = userMap[purchase.purchaserId];

      return {
        purchaseId: purchase.purchaseId,
        purchaserId: purchase.purchaserId,
        purchaserName: purchase.purchaserName,
        packageName: purchase.superPackageName,
        amount: Number(purchase.superPackagePrice),
        paymentMethod: purchase.paymentMethod,
        paymentStatus: purchase.paymentStatus,
        status: purchase.status,
        purchaseDate: purchase.purchaseDate,
        transactionId: verification?.transactionId || null,
        payerName: verification?.payerName || purchase.purchaserName,
        sponsorId: purchaser?.sponsorId || null,
        sponsorName: purchaser?.sponsorName || null,
        contact: {
          email: purchaser?.email || verification?.payerEmail || null,
          mobile: purchaser?.mobile || verification?.payerMobile || null,
        },
        activationDate: purchaser?.activationDate || null,
      };
    });

    const registrationDetails = registrations.map((registration) => ({
      userId: registration.userId,
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      mobile: registration.mobile,
      sponsorId: registration.sponsorId,
      sponsorName: registration.sponsorName,
      status: registration.status,
      createdAt: registration.createdAt,
      activationDate: registration.activationDate,
    }));

    res.status(200).json({
      success: true,
      data: {
        range: {
          start: parsedStart.toISOString(),
          end: parsedEnd.toISOString(),
        },
        counts: {
          packages: packageActivations.length,
          superPackages: superPackageActivations.length,
          registrations: registrationDetails.length,
        },
        packages: packageActivations,
        superPackages: superPackageActivations,
        registrations: registrationDetails,
      },
    });
  } catch (error) {
    console.error("Error fetching activation report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch activation report",
    });
  }
};

// Activate user (admin only)
export const activateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Admin can activate users regardless of KYC status
    user.activationDate = new Date();
    user.isActive = true;
    user.status = "active";
    await user.save();
    res.json({ message: "User activated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    // Use lean() for better performance and less memory usage
    const users = await User.find()
      .select(
        "userId firstName lastName mobile email sponsorMobile mlmLevel status createdAt activationDate"
      )
      .lean();
    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Deactivate user (admin only)
export const deactivateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.isActive = false;
    user.activationDate = null;
    user.status = "blocked";
    await user.save();
    res.json({ message: "User deactivated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Reject KYC (admin only)
export const rejectKyc = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.kycApprovedDate = null;
    user.kycVerified = false;
    user.kycRejected = true;
    user.status = "free";
    await user.save();
    res.json({ message: "KYC rejected successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update user status (admin only)
export const updateUserStatus = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    const validStatuses = ["free", "active", "kyc_verified", "blocked"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Update status and related fields
    user.status = status;

    // Update related fields based on status
    switch (status) {
      case "active":
        // Admin can activate users regardless of KYC status
        user.isActive = true;
        user.activationDate = new Date();
        break;
      case "kyc_verified":
        user.kycApprovedDate = new Date();
        user.kycVerified = true;
        user.kycRejected = false;
        break;
      case "blocked":
        user.isActive = false;
        user.activationDate = null;
        break;
      case "free":
        user.isActive = false;
        user.activationDate = null;
        user.kycApprovedDate = null;
        user.kycVerified = false;
        user.kycRejected = true;
        break;
    }

    // Add admin notes if provided
    if (adminNotes) {
      user.adminNotes = adminNotes;
    }

    await user.save();
    res.json({
      message: `User status updated to ${status} successfully`,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Upload motivation quote (admin only)
export const uploadMotivationQuote = async (req, res) => {
  try {
    const { quote, author, category } = req.body;
    const uploadedBy = req.user?._id; // Assuming you have user info in req.user

    // At least one of quote text or image must be provided
    if (!quote && !req.file) {
      return res.status(400).json({
        message: "Please provide either a quote text or an image (or both).",
      });
    }

    // If quote text is provided, author is required
    if (quote && !author) {
      return res
        .status(400)
        .json({ message: "Author is required when providing quote text." });
    }

    let imageUrl = null;

    // Handle image upload if present
    if (req.file) {
      try {
        // Compress the image
        const compressedImageBuffer = await compressGalleryImage(
          req.file.buffer
        );

        // Upload to Cloudinary
        const cloudinary = await import("cloudinary").then(
          (module) => module.v2
        );

        // Configure Cloudinary
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        // Upload to Cloudinary
        const uploadPromise = new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "motivation-quotes",
              resource_type: "image",
              transformation: [{ quality: "auto:good", fetch_format: "auto" }],
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                reject(error);
              } else {
                resolve(result);
              }
            }
          );

          uploadStream.end(compressedImageBuffer);
        });

        const result = await uploadPromise;
        imageUrl = result.secure_url;
      } catch (imageError) {
        console.error("Image upload error:", imageError);
        return res
          .status(400)
          .json({ message: "Failed to process image upload" });
      }
    }

    const motivationQuote = await MotivationQuote.create({
      quote: quote || "",
      author: author || "",
      category: category || "general",
      imageUrl,
      uploadedBy,
    });

    res.status(201).json({
      message: "Motivation quote uploaded successfully!",
      quote: motivationQuote,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: errors.join(" ") });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all motivation quotes (admin only)
export const getAllMotivationQuotes = async (req, res) => {
  try {
    const quotes = await MotivationQuote.find()
      .populate("uploadedBy", "firstName lastName")
      .sort({ uploadDate: -1 });
    res.json({ quotes });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Toggle motivation quote status (admin only)
export const toggleMotivationQuoteStatus = async (req, res) => {
  try {
    const quote = await MotivationQuote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    quote.isActive = !quote.isActive;
    await quote.save();

    res.json({
      message: `Quote ${
        quote.isActive ? "activated" : "deactivated"
      } successfully`,
      quote,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete motivation quote (admin only)
export const deleteMotivationQuote = async (req, res) => {
  try {
    const quote = await MotivationQuote.findByIdAndDelete(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: "Quote not found" });
    }

    res.json({ message: "Quote deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Approve KYC (admin only)
export const approveKyc = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        kycApprovedDate: new Date(),
        kycVerified: true,
        status: "kyc_verified",
      },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "KYC approved successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Upload gallery image (admin only)
export const uploadGalleryImage = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const uploadedBy = req.user?._id;

    if (!title || !req.file) {
      return res.status(400).json({ message: "Title and image are required." });
    }

    // Compress and resize image before uploading
    const compressedImageBuffer = await compressGalleryImage(req.file.buffer);

    // Upload to Cloudinary
    const cloudinary = await import("cloudinary").then((c) => c.v2);
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const uploadPromise = new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "gallery",
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

    const galleryImage = await GalleryImage.create({
      title,
      description: description || "",
      category: category || "general",
      imageUrl: result.secure_url,
      uploadedBy,
    });

    res.status(201).json({
      message: "Gallery image uploaded successfully with compression!",
      image: galleryImage,
    });
  } catch (error) {
    console.error("Gallery image upload error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: errors.join(" ") });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all gallery images (admin only)
export const getAllGalleryImages = async (req, res) => {
  try {
    const images = await GalleryImage.find()
      .populate("uploadedBy", "firstName lastName")
      .sort({ uploadDate: -1 });
    res.json({ images });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get active gallery images (public)
export const getActiveGalleryImages = async (req, res) => {
  try {
    const images = await GalleryImage.find({ isActive: true }).sort({
      uploadDate: -1,
    });
    res.json({ images });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Toggle gallery image status (admin only)
export const toggleGalleryImageStatus = async (req, res) => {
  try {
    const image = await GalleryImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    image.isActive = !image.isActive;
    await image.save();

    res.json({
      message: `Image ${
        image.isActive ? "activated" : "deactivated"
      } successfully`,
      image,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete gallery image (admin only)
export const deleteGalleryImage = async (req, res) => {
  try {
    const image = await GalleryImage.findByIdAndDelete(req.params.id);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.json({ message: "Image deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get specific user's dashboard data for admin
export const getUserDashboardData = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    // Find the user with lean() for better performance
    const user = await User.findById(userId).select("-password").lean();
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Get user's commission summary with lean()
    const commissionSummary = await Wallet.findOne({
      userId: user.userId,
    }).lean();

    // Get user's funds with lean()
    const userFunds = await Funds.findOne({ userId: user.userId }).lean();

    // Get user's payout history with limit and lean()
    const payoutHistory = await Payout.find({ userId: user.userId })
      .sort({ requestDate: -1 })
      .limit(10) // Limit to last 10 payouts
      .lean();

    // Get user's special income with lean()
    const specialIncome = await SpecialIncome.findOne({
      userId: user.userId,
    }).lean();

    // Calculate values exactly as user sees them on dashboard
    const withdrawn = payoutHistory
      .filter((p) => p.status === "approved" || p.status === "completed")
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

    const activeIncome = commissionSummary?.activeIncome || 0;
    const passiveIncome = commissionSummary?.passiveIncome || 0;
    const leadershipFund = specialIncome?.leaderShipFund || 0;
    const royaltyIncome = specialIncome?.royaltyIncome || 0;
    const rewardIncome = specialIncome?.rewardIncome || 0;

    // Note: superPackageTotalEarned will be calculated below and added to totalIncome

    // Get direct buyers count (My Successfully Downline)
    // Count direct referrals who purchased regular packages or super packages (paymentStatus completed)
    const directReferrals = await User.find({ sponsorId: user.userId }).select("userId").lean();
    const directReferralIds = directReferrals.map((ref) => ref.userId);

    // Regular package completed purchases by direct referrals
    const packagePurchases = await Purchase.find({
      purchaserId: { $in: directReferralIds },
      paymentStatus: "completed",
    })
      .select("purchaserId")
      .lean();

    // Super package completed purchases by direct referrals
    const superPackagePurchases = await SuperPackagePurchase.find({
      purchaserId: { $in: directReferralIds },
      paymentStatus: "completed",
    })
      .select("purchaserId")
      .lean();

    // Fallback: derive direct buyers from commission distributions (level 1 to this sponsor)
    const level1CommissionPurchases = await Purchase.find({
      commissionDistributions: {
        $elemMatch: { level: 1, sponsorId: user.userId },
      },
    })
      .select("purchaserId")
      .lean();

    const level1SuperCommissionPurchases = await SuperPackagePurchase.find({
      commissionDistributions: {
        $elemMatch: { level: 1, sponsorId: user.userId },
      },
    })
      .select("purchaserId")
      .lean();

    const regularBuyerIds = new Set([
      ...packagePurchases.map((p) => p.purchaserId),
      ...level1CommissionPurchases.map((p) => p.purchaserId),
    ]);
    const superBuyerIds = new Set([
      ...superPackagePurchases.map((p) => p.purchaserId),
      ...level1SuperCommissionPurchases.map((p) => p.purchaserId),
    ]);

    // Additional robust fallback: direct referrals who have been activated (activationDate)
    const activatedDirects = await User.find({
      sponsorId: user.userId,
      activationDate: { $exists: true, $ne: null },
    })
      .select("userId")
      .lean();
    for (const u of activatedDirects) {
      regularBuyerIds.add(u.userId);
    }
    // Fallback: consider verified payment verifications for direct referrals (in case purchases were missing)
    const verifiedDirectVerifications = await PaymentVerification.find({
      userId: { $in: directReferralIds },
      status: "verified",
    })
      .select("userId")
      .lean();
    for (const v of verifiedDirectVerifications) {
      regularBuyerIds.add(v.userId);
    }

    // Get referral leads count - optimized to avoid loading full tree
    const directReferralsCount = await User.countDocuments({
      sponsorId: user.userId,
    });

    // Get limited wallet transactions for admin view
    const walletTransactions = commissionSummary?.transactions?.slice(-5) || []; // Last 5 transactions

    // Mirror dashboard counts using referralService for accuracy
    // Use exact values from referralService to match Dashboard calculation
    const regularTotals = await referralService.getTotalCategorizedPackageBuyers(
      user.userId
    );
    const superTotals =
      await referralService.getTotalCategorizedSuperPackageBuyers(user.userId);

    // Use exact values from referralService to match Dashboard (no Math.max)
    const directBuyers = regularTotals?.directCount || 0;
    const directSuperPackageBuyers = superTotals?.directCount || 0;
    
    // Keep fallback values for backwards compatibility but use Dashboard values for display
    const finalRegularDirect = directBuyers;
    const finalSuperDirect = directSuperPackageBuyers;

    // Calculate Super Package commissions exactly as Dashboard does
    // Filter wallet transactions for super package commissions
    const superPackageTransactions = (commissionSummary?.transactions || []).filter(
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
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const superPackagePassiveIncome = superPackageTransactions
      .filter((t) => t.level >= 2 && t.level <= 120)
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const superPackageTotalEarned = superPackageTransactions.reduce(
      (sum, t) => sum + (parseFloat(t.amount) || 0),
      0
    );

    const dashboardData = {
      user: {
        _id: user._id,
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobile: user.mobile,
        profilePhoto: user.profilePhoto,
        activationDate: user.activationDate,
        createdAt: user.createdAt,
        sponsorId: user.sponsorId,
        sponsorName: user.sponsorName,
        isActive: user.isActive,
        kycApprovedDate: user.kycApprovedDate,
        status: user.status,
      },
      // Values exactly as user sees on dashboard
      wallet: commissionSummary?.balance || 0,
      withdrawn: withdrawn,
      referralLeads: directReferralsCount,
      successfullyDownline: finalRegularDirect,
      superSuccessfullyDownline: finalSuperDirect,
      // Direct buyers matching Dashboard calculation exactly
      directBuyers: directBuyers,
      directSuperPackageBuyers: directSuperPackageBuyers,
      activeIncome: activeIncome,
      passiveIncome: passiveIncome,
      leadershipFund: leadershipFund,
      royaltyIncome: royaltyIncome,
      rewardIncome: rewardIncome,
      superPackageCommissions: {
        totalEarned: superPackageTotalEarned,
        activeIncome: superPackageActiveIncome,
        passiveIncome: superPackagePassiveIncome,
      },
      // Total Income calculation exactly as user sees it (includes super package commissions)
      totalIncome:
        parseFloat(activeIncome) +
        parseFloat(passiveIncome) +
        parseFloat(superPackageTotalEarned) +
        parseFloat(royaltyIncome) +
        parseFloat(rewardIncome) +
        parseFloat(leadershipFund) +
        parseFloat(withdrawn),
      userFunds: {
        mobileFund: userFunds?.mobileFund || 0,
        laptopFund: userFunds?.laptopFund || 0,
        bikeFund: userFunds?.bikeFund || 0,
        carFund: userFunds?.carFund || 0,
        houseFund: userFunds?.houseFund || 0,
        travelFund: userFunds?.travelFund || 0,
        totalFunds: userFunds?.totalFunds || 0,
      },
      // Include limited payout history for admin view
      payoutHistory: payoutHistory,
      // Include limited wallet transactions for admin view
      walletTransactions: walletTransactions,
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error("Error fetching user dashboard data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user dashboard data",
    });
  }
};

// Helper function to get direct package buyers count
const getDirectPackageBuyersCount = async (userId) => {
  try {
    // Get all direct referrals
    const directReferrals = await User.find({ sponsorId: userId }).select(
      "userId"
    );
    const directReferralIds = directReferrals.map((ref) => ref.userId);

    // Count how many of these direct referrals have made purchases
    const packagePurchases = await Purchase.find({
      purchaserId: { $in: directReferralIds },
      status: "completed",
    });

    // Count unique users who made purchases
    const uniqueBuyers = new Set(
      packagePurchases.map((purchase) => purchase.purchaserId)
    );
    return uniqueBuyers.size;
  } catch (error) {
    console.error("Error getting direct package buyers count:", error);
    return 0;
  }
};

// Helper function to get referral tree for a specific user
const getReferralTreeForUser = async (userId) => {
  try {
    // Get direct referrals
    const directReferrals = await User.find({ sponsorId: userId })
      .select(
        "userId firstName lastName email mobile profilePhoto activationDate createdAt"
      )
      .sort({ createdAt: -1 });

    // Get all downline users recursively
    const getAllDownlineUserIds = async (sponsorId) => {
      const directUsers = await User.find({ sponsorId }).select("userId");
      let allUsers = [...directUsers];

      for (const user of directUsers) {
        const subUsers = await getAllDownlineUserIds(user.userId);
        allUsers = [...allUsers, ...subUsers];
      }

      return allUsers;
    };

    const allDownlineUserIds = await getAllDownlineUserIds(userId);
    const totalReferrals = allDownlineUserIds.length;

    // Get sub-referrals for each direct referral
    const directReferralsWithSubs = await Promise.all(
      directReferrals.map(async (direct) => {
        const subReferrals = await User.find({ sponsorId: direct.userId })
          .select(
            "userId firstName lastName email mobile profilePhoto activationDate createdAt"
          )
          .sort({ createdAt: -1 });

        return {
          ...direct.toObject(),
          subReferrals: subReferrals,
        };
      })
    );

    return {
      totalReferrals,
      directReferrals: directReferralsWithSubs,
    };
  } catch (error) {
    console.error("Error getting referral tree:", error);
    return { totalReferrals: 0, directReferrals: [] };
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.userId;
    delete updateData.referralCode;
    delete updateData.referralLink;
    delete updateData.password;

    // Only allow updating specific fields
    const allowedFields = [
      "firstName",
      "lastName",
      "email",
      "mobile",
      "mlmLevel",
    ];
    const filteredUpdateData = {};

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    });

    // Check if email or mobile is being updated and if it already exists
    if (updateData.email || updateData.mobile) {
      const existingUser = await User.findOne({
        $or: [{ email: updateData.email }, { mobile: updateData.mobile }],
        _id: { $ne: id },
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email or mobile already exists",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { ...filteredUpdateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "User updated successfully",
      user: {
        _id: updatedUser._id,
        userId: updatedUser.userId,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        mobile: updatedUser.mobile,
        role: updatedUser.role,
        mlmLevel: updatedUser.mlmLevel,
        status: updatedUser.status,
        isActive: updatedUser.isActive,
      },
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Check if user has any dependencies (purchases, referrals, etc.)
    const hasPurchases = await Purchase.findOne({ purchaserId: user.userId });
    const hasReferrals = await User.findOne({ sponsorId: user.userId });

    if (hasPurchases || hasReferrals) {
      return res.status(400).json({
        success: false,
        message:
          "Cannot delete user with existing purchases or referrals. Consider deactivating instead.",
      });
    }

    await User.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

// Get user wallet information
export const getUserWallet = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user
    const user = await User.findOne({ userId }).select("userId firstName lastName email mobile");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get wallet information
    const wallet = await Wallet.findOne({ userId });
    const smartWallet = await RechargeWallet.findOne({ userId });

    res.json({
      success: true,
      data: {
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
        },
        wallet: wallet ? {
          balance: wallet.balance,
          activeIncome: wallet.activeIncome,
          passiveIncome: wallet.passiveIncome,
          totalEarned: wallet.totalEarned,
          totalWithdrawn: wallet.totalWithdrawn,
          isActive: wallet.isActive,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
        } : null,
        smartWallet: smartWallet ? {
          balance: smartWallet.balance,
          totalAdded: smartWallet.totalAdded,
          totalSpent: smartWallet.totalSpent,
          totalRefunded: smartWallet.totalRefunded,
          isActive: smartWallet.isActive,
          createdAt: smartWallet.createdAt,
          updatedAt: smartWallet.updatedAt,
        } : null,
      },
    });
  } catch (error) {
    console.error("Error getting user wallet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user wallet",
      error: error.message,
    });
  }
};

// Get user wallet information by mobile number
export const getUserWalletByMobile = async (req, res) => {
  try {
    const { mobile } = req.params;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is required",
      });
    }

    // Find user by mobile number
    const user = await User.findOne({ mobile }).select("userId firstName lastName email mobile");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get wallet information using the found userId
    const wallet = await Wallet.findOne({ userId: user.userId });
    const smartWallet = await RechargeWallet.findOne({ userId: user.userId });

    res.json({
      success: true,
      data: {
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          mobile: user.mobile,
        },
        wallet: wallet ? {
          balance: wallet.balance,
          activeIncome: wallet.activeIncome,
          passiveIncome: wallet.passiveIncome,
          totalEarned: wallet.totalEarned,
          totalWithdrawn: wallet.totalWithdrawn,
          isActive: wallet.isActive,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
        } : null,
        smartWallet: smartWallet ? {
          balance: smartWallet.balance,
          totalAdded: smartWallet.totalAdded,
          totalSpent: smartWallet.totalSpent,
          totalRefunded: smartWallet.totalRefunded,
          isActive: smartWallet.isActive,
          createdAt: smartWallet.createdAt,
          updatedAt: smartWallet.updatedAt,
        } : null,
      },
    });
  } catch (error) {
    console.error("Error getting user wallet by mobile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user wallet",
      error: error.message,
    });
  }
};

// Add money to user wallet
export const addMoneyToWallet = async (req, res) => {
  try {
    const { userId, amount, walletType = "wallet", incomeType = "active", description, adminNotes } = req.body;
    const adminId = req.user.userId;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "User ID and positive amount are required",
      });
    }

    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const numericAmount = parseFloat(amount);
    let result;

    // Add to regular wallet only
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      const newWallet = new Wallet({ userId });
      await newWallet.save();
      result = newWallet;
    } else {
      result = wallet;
    }

    // Add transaction
    result.balance += numericAmount;
    result.totalEarned += numericAmount;
    
    // Update income type specific balance
    if (incomeType === "active") {
      result.activeIncome += numericAmount;
    } else if (incomeType === "passive") {
      result.passiveIncome += numericAmount;
    }
    
    result.transactions.push({
      type: "fund_credit",
      amount: numericAmount,
      incomeType: incomeType,
      description: description || `Admin added ₹${numericAmount} to Regular Wallet (${incomeType === 'active' ? 'Active Income' : 'Passive Income'})`,
      adminNotes: adminNotes || `Admin adjustment by ${adminId}`,
      status: "completed",
      reference: `ADMIN_ADD_${adminId}_${Date.now()}`,
      createdAt: new Date(),
    });
    await result.save();

    res.json({
      success: true,
      message: `Successfully added ₹${numericAmount} to user's Regular Wallet`,
      data: {
        userId,
        walletType: "wallet",
        amount: numericAmount,
        newBalance: result.balance,
        transactionId: `ADMIN_ADD_${adminId}_${Date.now()}`,
      },
    });
  } catch (error) {
    console.error("Error adding money to wallet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add money to wallet",
      error: error.message,
    });
  }
};

// Deduct money from user wallet
export const deductMoneyFromWallet = async (req, res) => {
  try {
    const { userId, amount, walletType = "wallet", incomeType = "active", description, adminNotes } = req.body;
    const adminId = req.user.userId;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "User ID and positive amount are required",
      });
    }

    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const numericAmount = parseFloat(amount);
    let result;

    // Deduct from regular wallet only
    const wallet = await Wallet.findOne({ userId });
    if (!wallet || wallet.balance < numericAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient wallet balance",
        currentBalance: wallet?.balance || 0,
        requestedAmount: numericAmount,
      });
    }

    // Add transaction
    wallet.balance -= numericAmount;
    wallet.totalWithdrawn += numericAmount;
    
    // Update income type specific balance
    if (incomeType === "active") {
      wallet.activeIncome = Math.max(0, wallet.activeIncome - numericAmount);
    } else if (incomeType === "passive") {
      wallet.passiveIncome = Math.max(0, wallet.passiveIncome - numericAmount);
    }
    
    wallet.transactions.push({
      type: "withdrawal",
      amount: -numericAmount,
      incomeType: incomeType,
      description: description || `Admin deducted ₹${numericAmount} from Regular Wallet (${incomeType === 'active' ? 'Active Income' : 'Passive Income'})`,
      adminNotes: adminNotes || `Admin adjustment by ${adminId}`,
      status: "completed",
      reference: `ADMIN_DEDUCT_${adminId}_${Date.now()}`,
      createdAt: new Date(),
    });
    await wallet.save();
    result = wallet;

    res.json({
      success: true,
      message: `Successfully deducted ₹${numericAmount} from user's Regular Wallet`,
      data: {
        userId,
        walletType: "wallet",
        amount: numericAmount,
        newBalance: result.balance,
        transactionId: `ADMIN_DEDUCT_${adminId}_${Date.now()}`,
      },
    });
  } catch (error) {
    console.error("Error deducting money from wallet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deduct money from wallet",
      error: error.message,
    });
  }
};

// Add money to Smart Wallet (Recharge Wallet)
export const addMoneyToSmartWallet = async (req, res) => {
  try {
    const { userId, amount, description, adminNotes } = req.body;
    const adminId = req.user.userId;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "User ID and positive amount are required",
      });
    }

    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const numericAmount = parseFloat(amount);
    
    // Get or create Smart Wallet (RechargeWallet)
    const smartWallet = await RechargeWallet.getOrCreateWallet(userId);

    // Add to balance
    smartWallet.balance = Math.round((smartWallet.balance + numericAmount) * 100) / 100;
    smartWallet.totalAdded = Math.round((smartWallet.totalAdded + numericAmount) * 100) / 100;

    // Add transaction
    smartWallet.transactions.push({
      type: "admin_adjustment",
      amount: numericAmount,
      description: description || `Admin added ₹${numericAmount} to Smart Wallet`,
      adminNotes: adminNotes || `Admin adjustment by ${adminId}`,
      status: "completed",
      reference: `ADMIN_SMART_ADD_${adminId}_${Date.now()}`,
      createdAt: new Date(),
    });

    await smartWallet.save();

    res.json({
      success: true,
      message: `Successfully added ₹${numericAmount} to user's Smart Wallet`,
      data: {
        userId,
        walletType: "smartWallet",
        amount: numericAmount,
        newBalance: smartWallet.balance,
        transactionId: `ADMIN_SMART_ADD_${adminId}_${Date.now()}`,
      },
    });
  } catch (error) {
    console.error("Error adding money to Smart Wallet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add money to Smart Wallet",
      error: error.message,
    });
  }
};

// Deduct money from Smart Wallet (Recharge Wallet)
export const deductMoneyFromSmartWallet = async (req, res) => {
  try {
    const { userId, amount, description, adminNotes } = req.body;
    const adminId = req.user.userId;

    if (!userId || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "User ID and positive amount are required",
      });
    }

    // Find user
    const user = await User.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const numericAmount = parseFloat(amount);
    
    // Get Smart Wallet (RechargeWallet)
    const smartWallet = await RechargeWallet.getOrCreateWallet(userId);

    if (smartWallet.balance < numericAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient Smart Wallet balance",
        currentBalance: smartWallet.balance,
        requestedAmount: numericAmount,
      });
    }

    // Deduct from balance
    smartWallet.balance = Math.round((smartWallet.balance - numericAmount) * 100) / 100;
    smartWallet.totalSpent = Math.round((smartWallet.totalSpent + numericAmount) * 100) / 100;

    // Add transaction
    smartWallet.transactions.push({
      type: "admin_adjustment",
      amount: -numericAmount,
      description: description || `Admin deducted ₹${numericAmount} from Smart Wallet`,
      adminNotes: adminNotes || `Admin adjustment by ${adminId}`,
      status: "completed",
      reference: `ADMIN_SMART_DEDUCT_${adminId}_${Date.now()}`,
      createdAt: new Date(),
    });

    await smartWallet.save();

    res.json({
      success: true,
      message: `Successfully deducted ₹${numericAmount} from user's Smart Wallet`,
      data: {
        userId,
        walletType: "smartWallet",
        amount: numericAmount,
        newBalance: smartWallet.balance,
        transactionId: `ADMIN_SMART_DEDUCT_${adminId}_${Date.now()}`,
      },
    });
  } catch (error) {
    console.error("Error deducting money from Smart Wallet:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deduct money from Smart Wallet",
      error: error.message,
    });
  }
};

// Get user transaction history
export const getUserTransactionHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { walletType = "all", page = 1, limit = 50 } = req.query;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    // Find user
    const user = await User.findOne({ userId }).select("userId firstName lastName");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let allTransactions = [];

    // Get regular wallet transactions
    if (walletType === "all" || walletType === "wallet") {
      const wallet = await Wallet.findOne({ userId });
      if (wallet && Array.isArray(wallet.transactions)) {
        const regularTransactions = wallet.transactions.map((t) => ({
          ...t.toObject ? t.toObject() : t,
          walletType: "wallet",
          walletName: "Regular Wallet",
        }));
        allTransactions = [...allTransactions, ...regularTransactions];
      }
    }

    // Get Smart Wallet (RechargeWallet) transactions
    if (walletType === "all" || walletType === "smartWallet") {
      const smartWallet = await RechargeWallet.findOne({ userId });
      if (smartWallet && Array.isArray(smartWallet.transactions)) {
        const smartTransactions = smartWallet.transactions.map((t) => ({
          ...t.toObject ? t.toObject() : t,
          walletType: "smartWallet",
          walletName: "Smart Wallet",
        }));
        allTransactions = [...allTransactions, ...smartTransactions];
      }
    }

    // Sort all transactions by date (newest first)
    allTransactions.sort((a, b) => {
      const dateA = new Date(a.createdAt || a.date || 0);
      const dateB = new Date(b.createdAt || b.date || 0);
      return dateB - dateA;
    });

    // Apply pagination
    const skip = (page - 1) * limit;
    const totalTransactions = allTransactions.length;
    const paginatedTransactions = allTransactions.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        user: {
          userId: user.userId,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        transactions: paginatedTransactions,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(totalTransactions / limit),
          totalTransactions,
        },
      },
    });
  } catch (error) {
    console.error("Error getting transaction history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get transaction history",
      error: error.message,
    });
  }
};
