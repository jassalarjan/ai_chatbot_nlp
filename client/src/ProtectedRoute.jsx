import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import axios from "axios";

const ProtectedRoute = ({ children }) => {
    const navigate = useNavigate();
    const token = localStorage.getItem("authToken");

    useEffect(() => {
        // Verify token on mount
        if (token) {
            // Set default axios headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Optional: Verify token with backend
            axios.get('/api/health')
                .catch(error => {
                    if (error.response?.status === 401 || error.response?.status === 403) {
                        // Clear invalid token
                        localStorage.removeItem("authToken");
                        localStorage.removeItem("userId");
                        localStorage.removeItem("username");
                        navigate("/login", { replace: true });
                    }
                });
        }
    }, [token, navigate]);

    // If there is no token, redirect to login page
    if (!token) {
        return <Navigate to="/login" replace />;
    }

    return children; // If the user is authenticated, render the children components
};

export default ProtectedRoute;
