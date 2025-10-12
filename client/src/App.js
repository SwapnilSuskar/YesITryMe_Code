import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import AppRouter from "./Router/Router";
import { ReferralProvider } from "./components/Auth/ReferralHandler";
import { useAuthStore } from "./store/useAuthStore";

function App() {
  const { isAuthenticated, user, token, initializeAuth, isTokenValid } = useAuthStore();

  // Initialize authentication state on app start
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Only render NotificationProvider if user is authenticated, has user data, has a valid token, and token is not expired
  const shouldRenderNotifications = isAuthenticated && user && token && isTokenValid();

  return (
    <div className="overflow-x-hidden">
      <Router>
        <ReferralProvider>
          {shouldRenderNotifications ? (
              <AppRouter />
          ) : (
            <AppRouter />
          )}
        </ReferralProvider>
      </Router>
    </div>
  );
}

export default App;
