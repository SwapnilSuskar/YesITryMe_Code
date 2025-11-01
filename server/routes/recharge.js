import express from "express";
import {
  fetchRechargePlans,
  initiateRecharge,
  phonePeCallback,
  checkRechargeStatus,
  getRechargeHistory,
  getAllRecharges,
  getRechargeStats,
} from "../controllers/rechargeController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes (payment callback)
router.post("/payment-callback", phonePeCallback);

// Protected user routes
router.get("/plans", protect, fetchRechargePlans);
router.post("/initiate", protect, initiateRecharge);
router.get("/status/:rechargeId", protect, checkRechargeStatus);
router.get("/history", protect, getRechargeHistory);

// Admin routes
router.get("/admin/all", protect, admin, getAllRecharges);
router.get("/admin/stats", protect, admin, getRechargeStats);

export default router;

