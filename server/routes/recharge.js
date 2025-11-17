import express from "express";
import {
  fetchRechargePlans,
  detectCircle,
  initiateRecharge,
  checkRechargeStatus,
  getRechargeHistory,
  getAllRecharges,
  getRechargeStats,
  updateRecharge,
  deleteRecharge,
} from "../controllers/rechargeController.js";
import { protect } from "../middleware/authMiddleware.js";
import { admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Protected user routes
router.get("/plans", protect, fetchRechargePlans);
router.get("/detect-circle", protect, detectCircle);
router.post("/initiate", protect, initiateRecharge);
router.get("/status/:rechargeId", protect, checkRechargeStatus);
router.get("/history", protect, getRechargeHistory);

// Admin routes
router.get("/admin/all", protect, admin, getAllRecharges);
router.get("/admin/stats", protect, admin, getRechargeStats);
router.put("/admin/:rechargeId", protect, admin, updateRecharge);
router.delete("/admin/:rechargeId", protect, admin, deleteRecharge);

export default router;

