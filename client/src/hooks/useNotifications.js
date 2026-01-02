import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { api, API_ENDPOINTS } from "../config/api";

// Shared polling state to prevent multiple intervals
let globalPollingInterval = null;
let globalUnreadCountCache = { count: 0, timestamp: 0 };
let activeComponentsCount = 0; // Track how many components are using the hook
const CACHE_DURATION = 10000; // 10 seconds cache
const POLLING_INTERVAL = 60000; // 60 seconds (1 minute) instead of 30 seconds
let pendingRequest = null;

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const { isAuthenticated, user, token, isTokenValid, validateAuth } = useAuthStore();
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const lastConnectionAttemptRef = useRef(0);
  const lastFetchTimeRef = useRef(0);

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

  // Fetch unread count with caching and deduplication
  const fetchUnreadCount = useCallback(async (force = false) => {
    if (!shouldProceed()) return;

    // Check cache first (unless forced)
    const now = Date.now();
    if (!force && now - globalUnreadCountCache.timestamp < CACHE_DURATION) {
      setUnreadCount(globalUnreadCountCache.count);
      return;
    }

    // Prevent duplicate simultaneous requests
    if (pendingRequest) {
      return pendingRequest.then(() => {
        setUnreadCount(globalUnreadCountCache.count);
      });
    }

    // Throttle: Don't fetch if last fetch was less than 5 seconds ago
    if (!force && now - lastFetchTimeRef.current < 5000) {
      setUnreadCount(globalUnreadCountCache.count);
      return;
    }

    lastFetchTimeRef.current = now;

    // Create the request promise
    pendingRequest = (async () => {
      try {
        const response = await api.get(API_ENDPOINTS.notifications.unreadCount);
        if (response.data.success) {
          const count = response.data.data.unreadCount;
          // Update cache
          globalUnreadCountCache = { count, timestamp: now };
          setUnreadCount(count);
        }
      } catch (error) {
        console.error("Error fetching unread count:", error);
        // If we get a 401, validate auth
        if (error.response?.status === 401) {
          validateAuth();
        }
      } finally {
        pendingRequest = null;
      }
    })();

    return pendingRequest;
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
        const newCount = Math.max(0, unreadCount - 1);
        setUnreadCount(newCount);
        // Update cache
        globalUnreadCountCache = { count: newCount, timestamp: Date.now() };
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      if (error.response?.status === 401) {
        validateAuth();
      }
    }
  }, [isAuthenticated, user, token, isTokenValid, validateAuth, unreadCount]);

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
        // Update cache
        globalUnreadCountCache = { count: 0, timestamp: Date.now() };
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
    // Increment active components count
    activeComponentsCount++;
    
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
      activeComponentsCount--;
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
                // Update unread count and cache (use functional update to get current value)
                setUnreadCount(prev => {
                  const newCount = prev + 1;
                  globalUnreadCountCache = { count: newCount, timestamp: Date.now() };
                  return newCount;
                });
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
    
    // Use shared global polling to prevent multiple intervals
    if (isProduction) {
      // Clear any existing polling interval
      if (globalPollingInterval) {
        clearInterval(globalPollingInterval);
      }
      
      // Set up shared polling interval (only one for all components)
      globalPollingInterval = setInterval(() => {
        fetchUnreadCount(false); // Use cache if available
      }, POLLING_INTERVAL);
    } else {
      // Use SSE for development
      connectSSE();
    }

    // Initial fetch of notifications (force fetch on mount)
    fetchUnreadCount(true);

    // Cleanup function
    return () => {
      activeComponentsCount--;
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      // Clear global polling interval when no components are using it
      if (activeComponentsCount === 0 && globalPollingInterval) {
        clearInterval(globalPollingInterval);
        globalPollingInterval = null;
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
