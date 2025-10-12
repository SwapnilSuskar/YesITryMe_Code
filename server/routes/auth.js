import express from "express";
import cors from "cors";
import {
  signup,
  login,
  getUserByReferralCode,
  getTopPerformers,
  getTotalPackageBuyersCount,
  checkMobileExists,
  adminSendOtp,
  adminLoginWithOtp,
} from "../controllers/authController.js";
import { getActiveGalleryImages } from "../controllers/adminController.js";
import { sendSignupOtp, verifySignupOtp } from "../services/otpService.js";
import {
  getActiveMotivationQuote,
  toggleMotivationQuoteStatus,
  deleteMotivationQuote,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
  handleTwilioIncoming,
  handleTwilioStatusCallback,
  getReferralStats7Days,
  getDownlineStats7Days,
  getTopDownlinePerformers,
  uploadProfilePhoto,
  updateProfilePhoto,
  debugOtpStore,
} from "../controllers/authController.js";
import { otpLimiter } from "../middleware/rateLimiter.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// CORS middleware for auth routes
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://www.yesitryme.com",
    "https://yes-i-try-me-codebase-client.vercel.app",
    "https://yes-i-try-me-client-yesitrymes-projects.vercel.app",
    "https://yes-i-try-me-client.vercel.app",
    "https://i-try-me-codebase-server.vercel.app",
    "https://yes-i-try-me-code.vercel.app",
    "https://yes-i-try-me-client-git-main-yesitrymes-projects.vercel.app",
    "https://yes-i-try-me-client-h1kdqb7le-yesitrymes-projects.vercel.app",
    "https://yes-i-try-me-code-git-main-yesitrymes-projects.vercel.app",
    "https://yes-i-try-me-code-73nawtz6c-yesitrymes-projects.vercel.app",
    "https://yes-i-try-me-client-i3i3ect8d-yesitrymes-projects.vercel.app",
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
  ],
};

router.use(cors(corsOptions));

// Handle preflight requests for auth routes
router.options("/{*splat}", cors(corsOptions), (req, res) => {
  res.status(200).end();
});

// Health check for auth routes
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Auth routes are working",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// @route   POST /api/auth/signup
router.post("/signup", signup);
router.post("/login", async (req, res, next) => {
  try {
    await login(req, res);
  } catch (error) {
    console.error("Login route error:", error);
    res.status(500).json({
      message: "Login failed",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});
// @route   POST /api/auth/send-otp
router.post("/send-otp", otpLimiter, sendSignupOtp);
// @route   POST /api/auth/verify-otp
router.post("/verify-otp", otpLimiter, verifySignupOtp);
// @route   POST /api/auth/check-mobile
router.post("/check-mobile", checkMobileExists);
// @route   POST /api/auth/forgot-password/send-otp
router.post("/forgot-password/send-otp", otpLimiter, sendForgotPasswordOtp);
// @route   POST /api/auth/forgot-password/reset
router.post("/forgot-password/reset", resetPasswordWithOtp);
// @route   GET /api/auth/debug/otp-store
router.get("/debug/otp-store", debugOtpStore);
// @route   POST /api/auth/admin/send-otp
router.post("/admin/send-otp", otpLimiter, adminSendOtp);
// @route   POST /api/auth/admin/login
router.post("/admin/login", adminLoginWithOtp);
// @route   GET /api/auth/referral/:referralCode
router.get("/referral/:referralCode", getUserByReferralCode);

// @route   GET /api/auth/motivation-quotes/active
router.get("/motivation-quotes/active", getActiveMotivationQuote);
// @route   GET /api/auth/gallery-images/active
router.get("/gallery-images/active", getActiveGalleryImages);
// @route   PATCH /api/auth/motivation-quotes/:id/toggle
router.patch("/motivation-quotes/:id/toggle", toggleMotivationQuoteStatus);
// @route   DELETE /api/auth/motivation-quotes/:id
router.delete("/motivation-quotes/:id", deleteMotivationQuote);
// Twilio webhook endpoints
router.post("/twilio/incoming", handleTwilioIncoming);
router.post("/twilio/status-callback", handleTwilioStatusCallback);
// Public: Top performers (for all users)
router.get("/top-performers", getTopPerformers);
// Protected: 7-day direct referral stats for logged-in user
router.get("/referral-stats-7days", protect, getReferralStats7Days);
// Protected: 7-day downline referral stats for logged-in user
router.get("/downline-stats-7days", protect, getDownlineStats7Days);
// Protected: Top performers in my downline
router.get("/top-downline-performers", protect, getTopDownlinePerformers);
// Protected: Total package buyers count for logged-in user
router.get("/total-package-buyers", protect, getTotalPackageBuyersCount);
// Profile photo upload
router.post("/profile-photo", protect, uploadProfilePhoto, updateProfilePhoto);
export default router;
