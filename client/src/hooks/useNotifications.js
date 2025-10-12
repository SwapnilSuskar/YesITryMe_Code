import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { api, API_ENDPOINTS } from "../config/api";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const { isAuthenticated, user, token, isTokenValid, validateAuth } = useAuthStore();
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastConnectionAttemptRef = useRef(0);

  // Check if we should proceed with API calls
  const shouldProceed = () => {
    if (!isAuthenticated || !user || !token) {
      return false;
    }
    
    if (!isTokenValid()) {
      validateAuth();
      return false;
    }
    
    return true;
  };

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (skip = 0) => {
      if (!shouldProceed()) return;

      try {
        setLoading(true);
        const response = await api.get(
          `${API_ENDPOINTS.notifications.all}?limit=10&skip=${skip}`
        );

        if (response.data.success) {
          if (skip === 0) {
            setNotifications(response.data.data.notifications);
          } else {
            setNotifications((prev) => [
              ...prev,
              ...response.data.data.notifications,
            ]);
          }
          setUnreadCount(response.data.data.unreadCount);
          setHasMore(response.data.data.hasMore);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
        // If we get a 401, validate auth
        if (error.response?.status === 401) {
          validateAuth();
        }
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated, user, token, isTokenValid, validateAuth]
  );

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!shouldProceed()) return;

    try {
      const response = await api.get(API_ENDPOINTS.notifications.unreadCount);
      if (response.data.success) {
        setUnreadCount(response.data.data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching unread count:", error);
      // If we get a 401, validate auth
      if (error.response?.status === 401) {
        validateAuth();
      }
    }
  }, [isAuthenticated, user, token, isTokenValid, validateAuth]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!shouldProceed()) return;

    try {
      const response = await api.patch(
        API_ENDPOINTS.notifications.markAsRead.replace(
          ":notificationId",
          notificationId
        )
      );
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notif) =>
            notif._id === notificationId
              ? { ...notif, isRead: true, readAt: new Date() }
              : notif
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      if (error.response?.status === 401) {
        validateAuth();
      }
    }
  }, [isAuthenticated, user, token, isTokenValid, validateAuth]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!shouldProceed()) return;

    try {
      const response = await api.patch(
        API_ENDPOINTS.notifications.markAllAsRead
      );
      if (response.data.success) {
        setNotifications((prev) =>
          prev.map((notif) => ({ ...notif, isRead: true, readAt: new Date() }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      if (error.response?.status === 401) {
        validateAuth();
      }
    }
  }, [isAuthenticated, user, token, isTokenValid, validateAuth]);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId) => {
      if (!shouldProceed()) return;

      try {
        const response = await api.delete(
          API_ENDPOINTS.notifications.delete.replace(
            ":notificationId",
            notificationId
          )
        );
        if (response.data.success) {
          setNotifications((prev) =>
            prev.filter((notif) => notif._id !== notificationId)
          );
          // Update unread count if the deleted notification was unread
          const deletedNotif = notifications.find(
            (notif) => notif._id === notificationId
          );
          if (deletedNotif && !deletedNotif.isRead) {
            setUnreadCount((prev) => Math.max(0, prev - 1));
          }
        }
      } catch (error) {
        console.error("Error deleting notification:", error);
        if (error.response?.status === 401) {
          validateAuth();
        }
      }
    },
    [notifications, isAuthenticated, user, token, isTokenValid, validateAuth]
  );

  // Add new notification (for real-time updates)
  const addNotification = useCallback((notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount((prev) => prev + 1);
    }
  }, []);

  // Initialize SSE connection for real-time notifications
  useEffect(() => {
    // Early return if not authenticated or missing credentials
    if (!shouldProceed()) {
      // Clean up SSE connection when not authenticated
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      // Reset state
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    // Debounce connection attempts to prevent rapid reconnections
    const now = Date.now();
    if (now - lastConnectionAttemptRef.current < 2000) {
      return;
    }
    lastConnectionAttemptRef.current = now;
    

    // Create SSE connection
    const connectSSE = () => {
      try {
        // Close existing connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }

        // Create new SSE connection with auth token as query parameter
        const eventSource = new EventSource(`${API_ENDPOINTS.notifications.stream}?token=${encodeURIComponent(token)}`);

        eventSource.onopen = () => {
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'connection':
                break;
              case 'heartbeat':
                // Keep connection alive
                break;
              case 'new_notification':
                // Add new notification to state
                addNotification(data.notification);
                // Update unread count
                setUnreadCount(prev => prev + 1);
                break;
              default:
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          console.error('SSE readyState:', eventSource.readyState);
          eventSource.close();
          
          // Reconnect after 5 seconds with debouncing
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(() => {
            connectSSE();
          }, 5000);
        };

        eventSourceRef.current = eventSource;
      } catch (error) {
        console.error('Error creating SSE connection:', error);
        
        // Fallback to polling if SSE fails
        const interval = setInterval(() => {
          fetchUnreadCount();
        }, 30000);
        return () => clearInterval(interval);
      }
    };

    // Temporarily disable SSE and use polling only for production
    const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
    
    if (isProduction) {
      // Use polling for production
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      return () => clearInterval(interval);
    } else {
      // Use SSE for development
      connectSSE();
    }

    // Initial fetch of notifications
    fetchUnreadCount();

    // Cleanup function
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated, user, token, isTokenValid, validateAuth, fetchUnreadCount, addNotification]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };
};
