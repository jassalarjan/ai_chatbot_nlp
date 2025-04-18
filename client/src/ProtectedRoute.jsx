import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "./api/axios";

const ProtectedRoute = ({ children }) => {
    const [isVerifying, setIsVerifying] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const token = localStorage.getItem("authToken");

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setIsVerifying(false);
                return;
            }
            
            try {
                const response = await api.get('/api/verify-token');
                if (response.data.valid) {
                    setIsAuthenticated(true);
                }
            } catch (error) {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("userId");
                    localStorage.removeItem("username");
                }
            } finally {
                setIsVerifying(false);
            }
        };

        verifyToken();
    }, [token]); // Only re-run when token changes

    if (isVerifying) {
        return <div>Loading...</div>; // Add a loading indicator
    }

    if (!token || !isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
