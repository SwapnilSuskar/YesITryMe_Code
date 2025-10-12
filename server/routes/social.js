import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  startYouTubeOAuth,
  handleYouTubeCallback,
  getYouTubeStatus,
  getYouTubeChannelInfo,
  disconnectYouTube,
  getSocialTasks,
  verifySocialAction,
  createSocialTask,
  getAllSocialTasks,
  toggleTaskStatus,
  updateSocialTask,
  deleteSocialTask,
  startPublicYouTubeOAuth,
  handlePublicYouTubeCallback,
  getPublicSession,
  verifyPublicAction,
  getShareableLink
} from "../controllers/socialController.js";

const router = express.Router();

// User routes
router.get("/youtube/oauth/start", protect, startYouTubeOAuth);
router.get("/youtube/oauth/callback", handleYouTubeCallback);
router.get("/youtube/status", protect, getYouTubeStatus);
router.get("/youtube/channel", protect, getYouTubeChannelInfo);
router.delete("/youtube/disconnect", protect, disconnectYouTube);
router.get("/tasks", protect, getSocialTasks);
router.post("/verify", protect, verifySocialAction);

// Public routes (no auth)
router.get("/public/start", startPublicYouTubeOAuth);
router.get("/public/callback", handlePublicYouTubeCallback);
router.get("/public/session/:sessionId", getPublicSession);
router.get("/public/verify", verifyPublicAction);

// Admin routes
router.post("/admin/tasks", protect, admin, createSocialTask);
router.get("/admin/share-link", protect, admin, getShareableLink);
router.get("/admin/tasks", protect, admin, getAllSocialTasks);
router.put("/admin/tasks/:taskId/toggle", protect, admin, toggleTaskStatus);
router.put("/admin/tasks/:taskId", protect, admin, updateSocialTask);
router.delete("/admin/tasks/:taskId", protect, admin, deleteSocialTask);

export default router;


