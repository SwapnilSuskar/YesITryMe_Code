import express from "express";
import jwt from "jsonwebtoken";
import { protect } from "../middleware/authMiddleware.js";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationStream,
} from "../controllers/notificationController.js";

const router = express.Router();

// Server-Sent Events stream for real-time notifications (BEFORE auth middleware)
router.get(
  "/stream",
  (req, res, next) => {
    // Extract token from query parameter for SSE
    const token = req.query.token;
    if (!token) {
      return res.status(401).json({ error: "Token required" });
    }

    // Verify token manually for SSE
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = { userId: decoded.userId };
      next();
    } catch (error) {
      console.error("❌ SSE token verification error:", error.message);
      console.error("❌ Token:", token.substring(0, 20) + "...");
      return res.status(401).json({ error: "Invalid token" });
    }
  },
  getNotificationStream
);

// Apply authentication middleware to all other notification routes
router.use(protect);

// Get user notifications with pagination
router.get("/", getUserNotifications);

// Get unread notifications count
router.get("/unread-count", getUnreadCount);

// Mark all notifications as read
router.patch("/mark-all-read", markAllAsRead);

// Mark specific notification as read
router.patch("/:notificationId/read", markAsRead);

// Delete a notification
router.delete("/:notificationId", deleteNotification);

export default router;
