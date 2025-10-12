import express from "express";
import {
  getPackages,
  purchasePackage,
  getUserPurchases,
  getPurchaseDetails,
  getCommissionSummary,
  getUserGenealogy,
  getCommissionTransactions,
  getUserReferrals,
  getUserReferralTree,
} from "../controllers/packageController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/available", getPackages);

// Protected routes
router.use(protect);

// Package operations
router.post("/purchase", purchasePackage);
router.get("/purchases", getUserPurchases);
router.get("/purchases/:purchaseId", getPurchaseDetails);

// Commission and referral operations
router.get("/commission/summary", getCommissionSummary);
router.get("/commission/transactions", getCommissionTransactions);
router.get("/genealogy", getUserGenealogy);
router.get("/referrals", getUserReferrals);
router.get("/referral-tree", getUserReferralTree);

export default router;
 