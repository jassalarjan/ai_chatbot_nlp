import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./assets/css/login.css";
import logImage from "./assets/images/log.png";
import registerImage from "./assets/images/register.png";
import api from "./api/axios";

const LoginSignup = () => {
	const [isLogin, setIsLogin] = useState(true);
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
	});
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
		setError(""); // Clear errors when user types
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			console.log("Debug - Attempting", isLogin ? "login" : "registration");
			const endpoint = isLogin ? "/login" : "/register";
			
			// Use our configured api instance
			const response = await api.post(endpoint, formData);
			console.log("Debug - Auth response:", {
				status: response.status,
				hasToken: !!response.data.token,
				hasUser: !!response.data.user
			});

			if (isLogin) {
				if (response.data.token) {
					// Store token and user info
					localStorage.setItem("authToken", response.data.token);
					
					if (response.data.user) {
						localStorage.setItem("userId", response.data.user.id);
						localStorage.setItem("username", response.data.user.username);
					}

					// Verify the token immediately
					try {
						console.log("Debug - Verifying new token");
						await api.get("/verify-token");
						console.log("Debug - Token verified successfully");
						navigate("/chat");
					} catch (verifyErr) {
						// Only show error if it's not a 404 (server startup timing issue)
						if (verifyErr.response?.status !== 404) {
							console.error("Debug - Token verification failed:", verifyErr);
							localStorage.removeItem("authToken");
							setError("Authentication failed. Please try logging in again.");
						} else {
							// If it's a 404, just proceed with navigation
							console.log("Debug - Verify token endpoint not ready, proceeding anyway");
							navigate("/chat");
						}
					}
				}
			} else {
				if (response.data.message === "User registered successfully") {
					console.log("Debug - Registration successful");
					setError("");
					setIsLogin(true);
					alert("Registration successful! Please login.");
					setFormData({ username: "", email: "", password: "" });
				}
			}
		} catch (err) {
			console.error("Debug - Auth error:", {
				status: err.response?.status,
				message: err.response?.data?.error || err.message
			});
			
			setError(
				err.response?.data?.error || 
				"An error occurred during " + (isLogin ? "login" : "registration")
			);
		} finally {
			setLoading(false);
		}
	};

	const toggleForm = (isLoginMode) => {
		setIsLogin(isLoginMode);
		setError("");
		setFormData({ username: "", email: "", password: "" });
	};

	return (
		<div className="block">
			<div className={`container ${!isLogin ? "sign-up-mode" : ""}`}>
				<div className="forms-container">
					<div className="signin-signup">
						{/* Sign In Form */}
						<form onSubmit={handleSubmit} className="form sign-in-form">
							<h2 className="title">Sign in</h2>
							{error && (
								<div
									className="alert alert-danger"
									role="alert"
									aria-live="polite"
								>
									{error}
								</div>
							)}
							{loading && (
								<div className="loading-spinner">
									Loading...
								</div>
							)}
							<div className="input-field">
								<i className="fas fa-user"></i>
								<input
									type="text"
									name="username"
									placeholder="Username"
									value={formData.username}
									onChange={handleChange}
									required
									disabled={loading}
								/>
							</div>
							<div className="input-field">
								<i className="fas fa-lock"></i>
								<input
									type="password"
									name="password"
									placeholder="Password"
									value={formData.password}
									onChange={handleChange}
									required
									disabled={loading}
								/>
							</div>
							<input 
								type="submit" 
								value={loading ? "Please wait..." : "Login"} 
								className="btn solid" 
								disabled={loading}
							/>
							<p className="social-text">
								Don't have an account?{" "}
								<button
									type="button"
									className="btn transparent"
									onClick={() => toggleForm(false)}
									disabled={loading}
								>
									Sign up
								</button>
							</p>
						</form>

						{/* Sign Up Form */}
						<form onSubmit={handleSubmit} className="form sign-up-form">
							<h2 className="title">Sign up</h2>
							{error && (
								<div
									className="alert alert-danger"
									role="alert"
									aria-live="polite"
								>
									{error}
								</div>
							)}
							{loading && (
								<div className="loading-spinner">
									Loading...
								</div>
							)}
							<div className="input-field">
								<i className="fas fa-user"></i>
								<input
									type="text"
									name="username"
									placeholder="Username"
									value={formData.username}
									onChange={handleChange}
									required
									disabled={loading}
								/>
							</div>
							<div className="input-field">
								<i className="fas fa-envelope"></i>
								<input
									type="email"
									name="email"
									placeholder="Email"
									value={formData.email}
									onChange={handleChange}
									required
									disabled={loading}
								/>
							</div>
							<div className="input-field">
								<i className="fas fa-lock"></i>
								<input
									type="password"
									name="password"
									placeholder="Password"
									value={formData.password}
									onChange={handleChange}
									required
									disabled={loading}
								/>
							</div>
							<input 
								type="submit" 
								value={loading ? "Please wait..." : "Sign up"} 
								className="btn solid"
								disabled={loading}
							/>
							<p className="social-text">
								Already have an account?{" "}
								<button
									type="button"
									className="btn transparent"
									onClick={() => toggleForm(true)}
									disabled={loading}
								>
									Sign in
								</button>
							</p>
						</form>
					</div>
				</div>

				<div className="panels-container">
					<div className="panel left-panel">
						<div className="content">
							<h3>New here?</h3>
							<p>Join us to unlock the full potential of AI!</p>
							<button
								className="btn transparent"
								onClick={() => toggleForm(false)}
								disabled={loading}
							>
								Sign up
							</button>
						</div>
						<img src={logImage} className="image" alt="" />
					</div>

					<div className="panel right-panel">
						<div className="content">
							<h3>One of us?</h3>
							<p>Sign in to continue your AI journey!</p>
							<button
								className="btn transparent"
								onClick={() => toggleForm(true)}
								disabled={loading}
							>
								Sign in
							</button>
						</div>
						<img src={registerImage} className="image" alt="" />
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginSignup;
