import express from "express";
import {
  submitWalletTopUp,
  getWalletTopUpHistory,
  getAllWalletTopUps,
  getWalletTopUp,
  approveWalletTopUp,
  rejectWalletTopUp,
  getWalletTopUpStats,
} from "../controllers/walletTopUpController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import fileUpload from "express-fileupload";

const router = express.Router();

// User routes
router.post(
  "/submit",
  protect,
  fileUpload({
    useTempFiles: false,
    limits: { fileSize: 10 * 1024 * 1024 },
    abortOnLimit: true,
  }),
  submitWalletTopUp
);

router.get("/history", protect, getWalletTopUpHistory);

// Admin routes
router.get("/admin/all", protect, admin, getAllWalletTopUps);
router.get("/admin/stats", protect, admin, getWalletTopUpStats);
router.get("/admin/:id", protect, admin, getWalletTopUp);
router.patch("/admin/:id/approve", protect, admin, approveWalletTopUp);
router.patch("/admin/:id/reject", protect, admin, rejectWalletTopUp);

export default router;

