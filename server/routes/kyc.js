import express from "express";
import {
  submitKyc,
  getUserKycStatus,
  getAllKycApplications,
  getKycApplication,
  approveKyc,
  rejectKyc,
  getKycStats
} from "../controllers/kycController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import fileUpload from "express-fileupload";

const router = express.Router();

// User routes
router.post("/submit", protect, fileUpload({
  useTempFiles: false,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  abortOnLimit: true
}), submitKyc);

router.get("/status", protect, getUserKycStatus);

// Admin routes
router.get("/admin/applications", protect, admin, getAllKycApplications);
router.get("/admin/applications/:id", protect, admin, getKycApplication);
router.patch("/admin/applications/:id/approve", protect, admin, approveKyc);
router.patch("/admin/applications/:id/reject", protect, admin, rejectKyc);
router.get("/admin/stats", protect, admin, getKycStats);

export default router; 