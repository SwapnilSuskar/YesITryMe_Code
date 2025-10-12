import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { withdrawalRateLimit, verificationRateLimit } from "../middleware/rateLimiter.js";
import {
  getCoinBalance,
  grantActivationBonus,
  requestCoinWithdrawal,
  getCoinTransactions,
  getAllUsersCoins,
  adjustUserCoins,
  getPendingWithdrawals,
  processWithdrawal
} from "../controllers/coinsController.js";

const router = express.Router();

// User routes
router.get("/balance", protect, getCoinBalance);
router.post("/activation-bonus", protect, grantActivationBonus);
router.post("/withdraw", protect, withdrawalRateLimit, requestCoinWithdrawal);
router.get("/transactions", protect, getCoinTransactions);

// Admin routes
router.get("/admin/users", protect, admin, getAllUsersCoins);
router.post("/admin/adjust", protect, admin, adjustUserCoins);
router.get("/admin/withdrawals", protect, admin, getPendingWithdrawals);
router.post("/admin/withdrawals/process", protect, admin, processWithdrawal);

export default router;



