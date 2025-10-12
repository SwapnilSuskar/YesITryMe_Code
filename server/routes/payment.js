import express from "express";
import {
  submitPaymentVerification,
  getUserPaymentStatus,
  getAllPaymentVerifications,
  getPaymentVerification,
  verifyPayment,
  rejectPayment,
  getPaymentStats
} from "../controllers/paymentController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import fileUpload from "express-fileupload";

const router = express.Router();

// User routes
router.post("/submit", protect, fileUpload({ 
  useTempFiles: false, 
  limits: { fileSize: 10 * 1024 * 1024 }, 
  abortOnLimit: true 
}), submitPaymentVerification);

router.get("/status", protect, getUserPaymentStatus);

// Admin routes
router.get("/admin/verifications", protect, admin, getAllPaymentVerifications);
router.get("/admin/verifications/:id", protect, admin, getPaymentVerification);
router.patch("/admin/verifications/:id/verify", protect, admin, verifyPayment);
router.patch("/admin/verifications/:id/reject", protect, admin, rejectPayment);
router.get("/admin/stats", protect, admin, getPaymentStats);

export default router; 