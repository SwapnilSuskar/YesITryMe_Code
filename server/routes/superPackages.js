import express from "express";
import fileUpload from "express-fileupload";
import {
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
  getSuperPackageCommissionSummary,
  getSuperPackageCommissionTransactions,
  getAllSuperPackagePaymentVerifications,
  updateSuperPackagePaymentVerificationStatus,
  getSuperPackageReferralStats7Days,
  getSuperPackageDownlineStats7Days,
  getTotalSuperPackageBuyersCount,
} from "../controllers/superPackageController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// File upload middleware
router.use(
  fileUpload({
    useTempFiles: false,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    abortOnLimit: true,
  })
);

// Public routes
router.get("/", getActiveSuperPackages);

// User routes (protected)
router.use(protect);
router.post("/purchase", purchaseSuperPackage);
router.get("/purchases", getUserSuperPackagePurchases);
router.get("/commission/summary", getSuperPackageCommissionSummary);
router.get("/commission/transactions", getSuperPackageCommissionTransactions);

// Super Package referral routes
router.get("/referral-stats-7days", getSuperPackageReferralStats7Days);
router.get("/downline-stats-7days", getSuperPackageDownlineStats7Days);
router.get("/total-super-package-buyers", getTotalSuperPackageBuyersCount);

// Specific ID route (must come after specific routes)
router.get("/:id", getSuperPackageById);

// Admin routes (protected)
router.use(admin);
router.get("/admin/all", getAllSuperPackages); // Admin endpoint to see all packages
router.post("/", createSuperPackage);
router.put("/:id", updateSuperPackage);
router.delete("/:id", deleteSuperPackage);
router.patch("/:id/toggle-status", toggleSuperPackageStatus);
router.get("/stats/overview", getSuperPackageStats);

// Admin payment verification routes
router.get(
  "/admin/payment-verifications",
  getAllSuperPackagePaymentVerifications
);
router.put(
  "/admin/payment-verifications/:verificationId/status",
  updateSuperPackagePaymentVerificationStatus
);

export default router;
