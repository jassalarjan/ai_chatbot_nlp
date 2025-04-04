import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./assets/css/login.css";
import logImage from "./assets/images/log.png";
import registerImage from "./assets/images/register.png";
const host = import.meta.env.VITE_HOST;

const LoginSignup = () => {
	const [isLogin, setIsLogin] = useState(true);
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
	});
	const [error, setError] = useState("");
	const navigate = useNavigate();

	// Handle input change
	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	// Handle form submission
	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");

		try {
			const endpoint = isLogin ? "/api/login" : "/api/register";
			const response = await axios.post(endpoint, formData);

			if (isLogin) {
				if (response.data.token) {
					// Store token with correct key
					localStorage.setItem("authToken", response.data.token);
					
					// Store user info if available
					if (response.data.user) {
						localStorage.setItem("userId", response.data.user.id);
						localStorage.setItem("username", response.data.user.username);
					}
					
					// Set default axios headers for future requests
					axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
					
					navigate("/chat");
				}
			} else {
				// Handle registration success
				if (response.data.message === "User registered successfully") {
					setError(""); // Clear any errors
					toggleForm(true); // Switch to login form
					// Optional: Show success message
					alert("Registration successful! Please login.");
				}
			}

			// Reset form after success
			setFormData({ username: "", email: "", password: "" });
		} catch (err) {
			console.error("Authentication error:", err);
			setError(err.response?.data?.error || "An error occurred");
		}
	};

	// Toggle between login and signup
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
							<div className="input-field">
								<i className="fas fa-user"></i>
								<input
									type="text"
									name="username"
									placeholder="Username"
									value={formData.username}
									onChange={handleChange}
									required
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
								/>
							</div>
							<input type="submit" value="Login" className="btn solid" />
							<p className="social-text">
								Don't have an account?{" "}
								<button
									type="button"
									className="btn transparent"
									onClick={() => toggleForm(false)}
								>
									Sign up
								</button>
							</p>
						</form>

						{/* Sign Up Form */}
						<form onSubmit={handleSubmit} className="form  sign-up-form">
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
							<div className="input-field">
								<i className="fas fa-user"></i>
								<input
									type="text"
									name="username"
									placeholder="Username"
									value={formData.username}
									onChange={handleChange}
									required
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
								/>
							</div>
							<input type="submit" value="Sign up" className="btn solid" />
							<p className="social-text">
								Already have an account?{" "}
								<button
									type="button"
									className="btn transparent"
									onClick={() => toggleForm(true)}
								>
									Sign in
								</button>
							</p>
						</form>
					</div>
				</div>

				{/* Panels */}
				<div className="panels-container">
					<div className="panel left-panel">
						<div className="content">
							<h3>New here?</h3>
							<p>Join us to start your journey with our intelligent chatbot!</p>
							<button
								type="button"
								className="btn transparent"
								onClick={() => toggleForm(false)}
							>
								Sign up
							</button>
						</div>
						<img
							src={registerImage}
							className="image"
							alt="Sign up illustration"
						/>
					</div>
					<div className="panel right-panel">
						<div className="content">
							<h3>One of us?</h3>
							<p>Welcome back! Sign in to continue your conversation.</p>
							<button
								type="button"
								className="btn transparent"
								onClick={() => toggleForm(true)}
							>
								Sign in
							</button>
						</div>
						<img src={logImage} className="image" alt="Sign in illustration" />
					</div>
				</div>
			</div>
		</div>
	);
};

export default LoginSignup;
