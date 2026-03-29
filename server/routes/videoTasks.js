import express from "express";
import multer from "multer";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  uploadEngagementVideo,
  getEngagementVideoUploadSignature,
  completeEngagementVideoUpload,
  listEngagementVideos,
  getEngagementVideoById,
  getMyVideoEngagements,
  adminListEngagementVideos,
  adminToggleEngagementVideo,
  adminDeleteEngagementVideo,
  claimVideoAction,
  listVideoComments,
  adminVideoAnalytics,
  getVideoStats,
  createVideoShareToken,
  getSharedEngagementVideo,
} from "../controllers/videoTasksController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 120 * 1024 * 1024 },
});

// Shared routes (no auth, token-based)
router.get("/shared/:token", getSharedEngagementVideo);

// Admin routes (before "/:videoId" so paths like /admin are not captured as ids)
router.get("/admin/all", protect, admin, adminListEngagementVideos);
router.get("/admin/upload-signature", protect, admin, getEngagementVideoUploadSignature);
router.post("/admin/complete-upload", protect, admin, completeEngagementVideoUpload);
router.post("/admin/upload", protect, admin, upload.single("video"), uploadEngagementVideo);
router.get("/admin/:videoId/analytics", protect, admin, adminVideoAnalytics);
router.patch("/admin/:videoId/toggle", protect, admin, adminToggleEngagementVideo);
router.delete("/admin/:videoId", protect, admin, adminDeleteEngagementVideo);

// User routes
router.get("/", protect, listEngagementVideos);
router.get("/:videoId", protect, getEngagementVideoById);
router.get("/:videoId/my-engagements", protect, getMyVideoEngagements);
router.get("/:videoId/stats", protect, getVideoStats);
router.get("/:videoId/comments", protect, listVideoComments);
router.post("/:videoId/share-token", protect, createVideoShareToken);
router.post("/:videoId/claim", protect, claimVideoAction);

export default router;

