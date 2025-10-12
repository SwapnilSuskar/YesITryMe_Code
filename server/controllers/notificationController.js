import notificationService from "../services/notificationService.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Server-Sent Events endpoint for real-time notifications
export const getNotificationStream = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  // Set headers for SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connection', message: 'Connected to notification stream' })}\n\n`);

  // Store the response object for later use
  if (!global.notificationStreams) {
    global.notificationStreams = new Map();
  }
  global.notificationStreams.set(userId, res);

  // Handle client disconnect
  req.on('close', () => {
    global.notificationStreams.delete(userId);
  });

  // Keep connection alive with heartbeat
  const heartbeat = setInterval(() => {
    if (res.writableEnded) {
      clearInterval(heartbeat);
      return;
    }
    res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: Date.now() })}\n\n`);
  }, 30000); // Send heartbeat every 30 seconds

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
  });
});

// Get user notifications
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { limit = 20, skip = 0 } = req.query;

  const notifications = await notificationService.getUserNotifications(
    userId,
    parseInt(limit),
    parseInt(skip)
  );

  const unreadCount = await notificationService.getUnreadCount(userId);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications,
        unreadCount,
        hasMore: notifications.length === parseInt(limit),
      },
      "Notifications retrieved successfully"
    )
  );
});

// Get unread notifications count
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const unreadCount = await notificationService.getUnreadCount(userId);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { unreadCount },
        "Unread count retrieved successfully"
      )
    );
});

// Mark notification as read
export const markAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { notificationId } = req.params;

  const notification = await notificationService.markAsRead(
    notificationId,
    userId
  );

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, notification, "Notification marked as read"));
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  const result = await notificationService.markAllAsRead(userId);

  return res
    .status(200)
    .json(new ApiResponse(200, result, "All notifications marked as read"));
});

// Delete notification (optional feature)
export const deleteNotification = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { notificationId } = req.params;

  // Import Notification model here to avoid circular dependency
  const Notification = (await import("../models/Notification.js")).default;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    userId,
  });

  if (!notification) {
    throw new ApiError(404, "Notification not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Notification deleted successfully"));
});
