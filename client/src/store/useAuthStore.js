import { create } from "zustand";
import api, { API_ENDPOINTS } from "../config/api";

// Helper to load user and token from localStorage
const getStoredUser = () => {
  try {
    const user = localStorage.getItem("authUser");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const getStoredToken = () => {
  try {
    return localStorage.getItem("authToken");
  } catch {
    return null;
  }
};

// Helper to validate JWT token expiration
const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error parsing token:', error);
    return true;
  }
};

export const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: false, // Start as false, will be validated
  loading: false,
  error: "",
  success: "",
  setUser: (user) => set({ user }),

  // Initialize authentication state
  initializeAuth: () => {
    const storedUser = getStoredUser();
    const storedToken = getStoredToken();
    
    if (!storedUser || !storedToken) {
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }

    // Check if token is expired
    if (isTokenExpired(storedToken)) {
      get().logout();
      return;
    }

    // Token is valid, set authenticated state
    set({ 
      isAuthenticated: true, 
      user: storedUser, 
      token: storedToken 
    });
  },

  // Check if current token is valid
  isTokenValid: () => {
    const { token } = get();
    if (!token) return false;
    return !isTokenExpired(token);
  },

  // Validate and update authentication state
  validateAuth: () => {
    const { token, user } = get();
    
    if (!token || !user) {
      set({ isAuthenticated: false });
      return false;
    }

    if (isTokenExpired(token)) {
      console.log('Token expired, logging out...');
      get().logout();
      return false;
    }

    set({ isAuthenticated: true });
    return true;
  },

  // Check authentication before making API calls
  checkAuthBeforeRequest: () => {
    const { token } = get();
    if (!token || isTokenExpired(token)) {
      get().logout();
      return false;
    }
    return true;
  },

  // Update user status based on package purchases
  updateUserStatus: (newStatus) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, status: newStatus };
      set({ user: updatedUser });
      localStorage.setItem("authUser", JSON.stringify(updatedUser));
    }
  },

  // Sync user status based on package purchases (both regular and Super packages)
  syncUserStatus: async () => {
    const { token } = get();
    if (!token) return;

    try {
      // Fetch user's regular package purchases
      const purchasesResponse = await api.get(
        `${API_ENDPOINTS.packages.purchases}`
      );
      
      // Fetch user's Super package purchases
      const superPackagesResponse = await api.get(
        `${API_ENDPOINTS.superPackages.purchases}`
      );

      let hasActivePackages = false;

      // Check regular packages
      if (purchasesResponse.data?.data?.purchases) {
        const purchases = purchasesResponse.data.data.purchases;
        hasActivePackages = purchases.some(
          (purchase) => purchase.status === "active"
        );
      }

      // Check Super packages if regular packages are not active
      if (!hasActivePackages && superPackagesResponse.data?.data?.purchases) {
        const superPurchases = superPackagesResponse.data.data.purchases;
        hasActivePackages = superPurchases.some(
          (purchase) => purchase.status === "active"
        );
      }

      // Determine new status
      let newStatus = "free";
      if (hasActivePackages) {
        newStatus = "active";
      }

      // Don't override kyc_verified or blocked status
      const currentUser = get().user;
      if (
        currentUser &&
        (currentUser.status === "kyc_verified" ||
          currentUser.status === "blocked")
      ) {
        return;
      }

      // Update status if different
      if (currentUser && currentUser.status !== newStatus) {
        get().updateUserStatus(newStatus);
      }
    } catch (error) {
      console.error("Error syncing user status:", error);
    }
  },

  // Force refresh user status (for manual sync)
  refreshUserStatus: async () => {
    await get().syncUserStatus();
  },

  // Create a new user / Signup
  signup: async (formData, navigate) => {
    set({ loading: true, error: "", success: "" });
    try {
      const response = await api.post(`${API_ENDPOINTS.auth.signup}`, formData);
      if (response.data) {
        // Don't automatically log in the user, just show success with credentials
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          success: response.data.message,
          error: "",
        });
        
        // Return the credentials so the component can display them
        return {
          success: true,
          message: response.data.message,
          credentials: response.data.credentials,
          user: response.data.user
        };
      }
    } catch (err) {
      set({
        error: err.response?.data?.message || "Signup failed",
        success: "",
      });
      return {
        success: false,
        error: err.response?.data?.message || "Signup failed"
      };
    } finally {
      set({ loading: false });
    }
  },

  // Login action
  login: async (payload, navigate) => {
    set({ loading: true, error: "", success: "" });
    try {
      const response = await api.post(`${API_ENDPOINTS.auth.login}`, payload);
      if (response.data) {
        set({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
          success: response.data.message,
          error: "",
        });
        localStorage.setItem("authUser", JSON.stringify(response.data.user));
        localStorage.setItem("authToken", response.data.token);

        // Sync user status after login
        setTimeout(async () => {
          await get().syncUserStatus();
        }, 500);

        if (navigate) setTimeout(() => navigate("/dashboard"), 1000);
      }
    } catch (err) {
      set({
        error: err.response?.data?.message || "Login failed",
        success: "",
      });
    } finally {
      set({ loading: false });
    }
  },

  // Admin Login action
  adminLogin: async (payload, navigate) => {
    set({ loading: true, error: "", success: "" });
    try {
      const response = await api.post(`${API_ENDPOINTS.auth.adminLogin}`, payload);
      if (response.data) {
        set({
          user: response.data.user,
          token: response.data.token,
          isAuthenticated: true,
          success: response.data.message,
          error: "",
        });
        localStorage.setItem("authUser", JSON.stringify(response.data.user));
        localStorage.setItem("authToken", response.data.token);

        // Set admin session timeout (8 hours)
        const sessionTimeout = Date.now() + (8 * 60 * 60 * 1000); // 8 hours
        localStorage.setItem("adminSessionTimeout", sessionTimeout.toString());

        if (navigate) setTimeout(() => navigate("/admin"), 1000);
      }
    } catch (err) {
      set({
        error: err.response?.data?.message || "Admin login failed",
        success: "",
      });
    } finally {
      set({ loading: false });
    }
  },

  // Check admin session timeout
  checkAdminSession: () => {
    const timeout = localStorage.getItem("adminSessionTimeout");
    if (timeout && Date.now() > parseInt(timeout)) {
      // Session expired, logout admin
      get().logout();
      return false;
    }
    return true;
  },

  // Check if session is about to expire (within 5 minutes)
  checkSessionExpiry: () => {
    const { token } = get();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = payload.exp - currentTime;
      
      // If expires within 5 minutes (300 seconds)
      if (timeUntilExpiry < 300 && timeUntilExpiry > 0) {
        return {
          willExpireSoon: true,
          minutesLeft: Math.ceil(timeUntilExpiry / 60)
        };
      }
      
      return { willExpireSoon: false };
    } catch (error) {
      console.error('Error checking session expiry:', error);
      return { willExpireSoon: false };
    }
  },

  // Logout action
  logout: () => {
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      success: "",
      error: "",
    });
    localStorage.removeItem("authUser");
    localStorage.removeItem("authToken");
    localStorage.removeItem("adminSessionTimeout");
  },
}));
