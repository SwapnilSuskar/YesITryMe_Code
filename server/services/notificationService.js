import Notification from "../models/Notification.js";

class NotificationService {
  /**
   * Create a new notification for a user
   * @param {string} userId - User ID
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {string} type - Notification type (activation, commission, system, payment)
   * @param {Object} data - Additional data for the notification
   * @returns {Object} Created notification
   */
  async createNotification(userId, title, message, type, data = {}) {
    try {
      const notification = new Notification({
        userId,
        title,
        message,
        type,
        data,
      });

      await notification.save();

      // Send real-time notification via SSE if client is connected
      this.sendRealTimeNotification(userId, notification);

      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw new Error("Failed to create notification");
    }
  }

  // Send real-time notification to connected clients
  sendRealTimeNotification(userId, notification) {
    try {
      if (
        global.notificationStreams &&
        global.notificationStreams.has(userId)
      ) {
        const res = global.notificationStreams.get(userId);
        if (res && !res.writableEnded) {
          const eventData = {
            type: "new_notification",
            notification: {
              _id: notification._id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              isRead: notification.isRead,
              createdAt: notification.createdAt,
              data: notification.data,
            },
          };
          res.write(`data: ${JSON.stringify(eventData)}\n\n`);
          console.log(`✅ Real-time notification sent to user ${userId}`);
        }
      }
    } catch (error) {
      console.error("Error sending real-time notification:", error);
    }
  }

  /**
   * Create activation notification
   * @param {string} userId - User ID
   * @param {string} packageName - Package name
   * @param {number} packagePrice - Package price
   * @returns {Object} Created notification
   */
  async createActivationNotification(userId, packageName, packagePrice) {
    const title = "🎉 Account Activated Successfully!";
    const message = `Congratulations! Your account has been activated with the ${packageName} package (₹${packagePrice}). You can now access all premium features and start earning commissions.`;

    return await this.createNotification(userId, title, message, "activation", {
      packageName,
      packagePrice,
    });
  }

  /**
   * Create commission notification
   * @param {string} userId - User ID
   * @param {number} amount - Commission amount
   * @param {number} level - Commission level
   * @param {string} purchaserName - Name of the person who made the purchase
   * @param {string} packageName - Package name
   * @returns {Object} Created notification
   */
  async createCommissionNotification(
    userId,
    amount,
    level,
    purchaserName,
    packageName
  ) {
    const title = `💰 Level ${level} Commission Received!`;
    const message = `You received ₹${amount.toFixed(
      2
    )} commission from ${purchaserName}'s ${packageName} purchase (Level ${level}).`;

    return await this.createNotification(userId, title, message, "commission", {
      amount,
      level,
      purchaserName,
      packageName,
    });
  }

  /**
   * Get notifications for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of notifications to return
   * @param {number} skip - Number of notifications to skip
   * @returns {Array} Array of notifications
   */
  async getUserNotifications(userId, limit = 20, skip = 0) {
    try {
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      return notifications;
    } catch (error) {
      console.error("Error getting user notifications:", error);
      throw new Error("Failed to get notifications");
    }
  }

  /**
   * Get unread notifications count for a user
   * @param {string} userId - User ID
   * @returns {number} Count of unread notifications
   */
  async getUnreadCount(userId) {
    try {
      const count = await Notification.countDocuments({
        userId,
        isRead: false,
      });

      return count;
    } catch (error) {
      console.error("Error getting unread count:", error);
      throw new Error("Failed to get unread count");
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @param {string} userId - User ID (for security)
   * @returns {Object} Updated notification
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        {
          isRead: true,
          readAt: new Date(),
        },
        { new: true }
      );

      return notification;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw new Error("Failed to mark notification as read");
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - User ID
   * @returns {Object} Update result
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.updateMany(
        { userId, isRead: false },
        {
          isRead: true,
          readAt: new Date(),
        }
      );

      return result;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw new Error("Failed to mark all notifications as read");
    }
  }

  /**
   * Delete old notifications (older than 30 days)
   * @param {string} userId - User ID (optional, if not provided, deletes for all users)
   * @returns {Object} Delete result
   */
  async deleteOldNotifications(userId = null) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const query = {
        createdAt: { $lt: thirtyDaysAgo },
        isRead: true,
      };

      if (userId) {
        query.userId = userId;
      }

      const result = await Notification.deleteMany(query);
      return result;
    } catch (error) {
      console.error("Error deleting old notifications:", error);
      throw new Error("Failed to delete old notifications");
    }
  }
}

const notificationService = new NotificationService();
export default notificationService;
