import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/useAuthStore";

const ProtectedAdminRoute = ({ children }) => {
    const { user, isAuthenticated, checkAdminSession } = useAuthStore();

    // Check admin session timeout on component mount and every minute
    useEffect(() => {
        // Check immediately
        const isValid = checkAdminSession();
        if (!isValid) {
            return;
        }

        // Check every minute
        const interval = setInterval(() => {
            const isValid = checkAdminSession();
            if (!isValid) {
                clearInterval(interval);
            }
        }, 60000); // 1 minute

        return () => clearInterval(interval);
    }, [checkAdminSession]);

    if (!isAuthenticated || !user || user.role !== "admin") {
        // Not authorized, redirect to home or show message
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedAdminRoute; 