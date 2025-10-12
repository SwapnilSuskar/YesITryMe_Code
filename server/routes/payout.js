import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/authMiddleware.js";
import {
  checkPayoutEligibility,
  requestPayout,
  getPayoutHistory,
  getWalletBalance,
  getAllPayoutRequests,
  updatePayoutStatus
} from "../controllers/payoutController.js";

const router = express.Router();

// User routes
router.get("/eligibility", protect, checkPayoutEligibility);
router.post("/request", protect, requestPayout);
router.get("/history", protect, getPayoutHistory);
router.get("/balance", protect, getWalletBalance);

// Admin routes
router.get("/admin/all", protect, admin, getAllPayoutRequests);
router.put("/admin/:payoutId/status", protect, admin, updatePayoutStatus);

export default router;