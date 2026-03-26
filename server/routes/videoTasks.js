import express from "express";
import multer from "multer";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  uploadEngagementVideo,
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

const upload = multer({ storage: multer.memoryStorage() });

// Shared routes (no auth, token-based)
router.get("/shared/:token", getSharedEngagementVideo);

// User routes
router.get("/", protect, listEngagementVideos);
router.get("/:videoId", protect, getEngagementVideoById);
router.get("/:videoId/my-engagements", protect, getMyVideoEngagements);
router.get("/:videoId/stats", protect, getVideoStats);
router.get("/:videoId/comments", protect, listVideoComments);
router.post("/:videoId/share-token", protect, createVideoShareToken);
router.post("/:videoId/claim", protect, claimVideoAction);

// Admin routes
router.get("/admin/all", protect, admin, adminListEngagementVideos);
router.post("/admin/upload", protect, admin, upload.single("video"), uploadEngagementVideo);
router.get("/admin/:videoId/analytics", protect, admin, adminVideoAnalytics);
router.patch("/admin/:videoId/toggle", protect, admin, adminToggleEngagementVideo);
router.delete("/admin/:videoId", protect, admin, adminDeleteEngagementVideo);

export default router;

