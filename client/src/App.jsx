import React, { useState, useEffect } from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from "react-router-dom"; // Keep your imports as is
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/tailwind.css";
import axios from "axios";

// Importing components
import Chat from "./TogetherAIChat";
import LoginSignup from "./LoginSignup";
import Profile from "./Profile";

// Import ProtectedRoute for route protection
import ProtectedRoute from "./ProtectedRoute";

function App() {
	const [view, setView] = useState("chat");
	const [isAuthenticated, setIsAuthenticated] = useState(false);

	useEffect(() => {
		// Check authentication status on mount
		const token = localStorage.getItem("authToken");
		if (token) {
			// Set default axios headers
			axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
			setIsAuthenticated(true);
		}
	}, []);

	return (
		<Router>
			<Routes>
				{/* Public routes */}
				<Route 
					path="/login" 
					element={
						isAuthenticated ? 
						<Navigate to="/chat" replace /> : 
						<LoginSignup />
					} 
				/>
				<Route 
					path="/register" 
					element={
						isAuthenticated ? 
						<Navigate to="/chat" replace /> : 
						<LoginSignup />
					} 
				/>

				{/* Protected routes */}
				<Route
					path="/chat"
					element={
						<ProtectedRoute>
							<Chat setView={setView} />
						</ProtectedRoute>
					}
				/>
				<Route
					path="/profile"
					element={
						<ProtectedRoute>
							<Profile />
						</ProtectedRoute>
					}
				/>

				{/* Redirect root to chat if authenticated, otherwise to login */}
				<Route
					path="/"
					element={
						isAuthenticated ? (
							<Navigate to="/chat" replace />
						) : (
							<Navigate to="/login" replace />
						)
					}
				/>
			</Routes>
		</Router>
	);
}

export default App;
