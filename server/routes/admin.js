import express from "express";
import {
  getAnalytics,
  getAllReferrals,
  getTopReferrers,
  getReferralStats,
  getAllPurchases,
  getPurchaseStats,
  getAllUsers,
  updateUser,
  deleteUser,
  activateUser,
  approveKyc,
  deactivateUser,
  rejectKyc,
  updateUserStatus,
  getAllMotivationQuotes,
  uploadMotivationQuote,
  toggleMotivationQuoteStatus,
  deleteMotivationQuote,
  uploadGalleryImage,
  getAllGalleryImages,
  toggleGalleryImageStatus,
  deleteGalleryImage,
  uploadGalleryImageFile,
  uploadMotivationQuoteImage,
  getUserDashboardData,
} from "../controllers/adminController.js";
import {
  getWithdrawalRequests,
  approveWithdrawalRequest,
  rejectWithdrawalRequest,
  completeWithdrawalRequest,
} from "../controllers/coinsController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(admin);

// Analytics routes
router.get("/analytics/users", getAnalytics);
router.get("/analytics/referrals", getAnalytics);
router.get("/analytics/purchases", getAnalytics);
router.get("/analytics/commissions", getAnalytics);

// Referral management routes
router.get("/referrals/all", getAllReferrals);
router.get("/referrals/top-referrers", getTopReferrers);
router.get("/referrals/stats", getReferralStats);

// Purchase management routes
router.get("/purchases", getAllPurchases);
router.get("/purchases/stats", getPurchaseStats);

// User management routes (admin only)
router.get("/users", getAllUsers);
router.get("/users/:userId/dashboard", getUserDashboardData);
router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/activate", activateUser);
router.patch("/users/:id/kyc-approve", approveKyc);
router.patch("/users/:id/deactivate", deactivateUser);
router.patch("/users/:id/kyc-reject", rejectKyc);
router.patch("/users/:id/status", updateUserStatus);

// Motivation quotes routes (admin only)
router.get("/motivation-quotes", getAllMotivationQuotes);
router.post(
  "/motivation-quotes",
  uploadMotivationQuoteImage,
  uploadMotivationQuote
);
router.patch("/motivation-quotes/:id/toggle", toggleMotivationQuoteStatus);
router.delete("/motivation-quotes/:id", deleteMotivationQuote);

// Gallery images routes (admin only)
router.get("/gallery-images", getAllGalleryImages);
router.post("/gallery-images", uploadGalleryImageFile, uploadGalleryImage);
router.patch("/gallery-images/:id/toggle", toggleGalleryImageStatus);
router.delete("/gallery-images/:id", deleteGalleryImage);

// Withdrawal request management routes (admin only)
router.get("/withdrawal-requests", getWithdrawalRequests);
router.patch(
  "/withdrawal-requests/:requestId/approve",
  approveWithdrawalRequest
);
router.patch("/withdrawal-requests/:requestId/reject", rejectWithdrawalRequest);
router.patch(
  "/withdrawal-requests/:requestId/complete",
  completeWithdrawalRequest
);

export default router;
