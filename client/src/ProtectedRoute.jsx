import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "./api/axios";

const ProtectedRoute = ({ children }) => {
    const [isVerifying, setIsVerifying] = useState(true);
    const token = localStorage.getItem("authToken");

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setIsVerifying(false);
                return;
            }
            
            try {
                await api.get('/health');
                setIsVerifying(false);
            } catch (error) {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    // Clear invalid token
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("userId");
                    localStorage.removeItem("username");
                }
                setIsVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    if (isVerifying) {
        return null; // or a loading spinner
    }

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
