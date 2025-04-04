import React, { useState, useEffect } from "react";
import { ArrowLeft, User, Mail, Bell, Lock, Save, Camera } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./styles/Profile.css";

const Profile = () => {
	const navigate = useNavigate();
	const [user, setUser] = useState({ username: "", email: "", avatar: "" });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isEditing, setIsEditing] = useState(false);
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	useEffect(() => {
		const fetchUserData = async () => {
			try {
				const token = localStorage.getItem("token");
				console.log("Token from localStorage:", token); // Debug log

				if (!token) {
					console.log("No token found, redirecting to login"); // Debug log
					setError("Please log in to view your profile");
					setLoading(false);
					navigate("/login");
					return;
				}

				console.log("Making API request with token:", token); // Debug log
				const response = await axios.get("http://localhost:5000/api/user", {
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				});

				console.log("API Response:", response.data); // Debug log

				if (response.data) {
					setUser(response.data);
					setFormData({
						username: response.data.username,
						email: response.data.email,
						currentPassword: "",
						newPassword: "",
						confirmPassword: "",
					});
				}
				setLoading(false);
			} catch (err) {
				console.error("Error fetching user data:", err);
				console.error("Error response:", err.response); // Debug log
				setError(
					err.response?.data?.message ||
						"Failed to fetch user data. Please log in again."
				);
				setLoading(false);
				if (err.response?.status === 401) {
					console.log("401 error, removing token and redirecting to login"); // Debug log
					localStorage.removeItem("token");
					navigate("/login");
				}
			}
		};

		fetchUserData();
	}, [navigate]);

	const handleChange = (e) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError("");
		setSuccess("");

		try {
			const token = localStorage.getItem("token");
			if (!token) {
				setError("Please log in to update your profile");
				navigate("/login");
				return;
			}

			// Validate passwords if changing
			if (formData.newPassword) {
				if (formData.newPassword !== formData.confirmPassword) {
					setError("New passwords do not match");
					return;
				}
				if (!formData.currentPassword) {
					setError("Current password is required to change password");
					return;
				}
			}

			const response = await axios.put(
				"http://localhost:5000/api/user",
				formData,
				{
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
				}
			);

			if (response.data) {
				setUser(response.data);
				setSuccess("Profile updated successfully!");
				setIsEditing(false);
			}
		} catch (err) {
			console.error("Error updating profile:", err);
			setError(err.response?.data?.message || "Failed to update profile");
			if (err.response?.status === 401) {
				localStorage.removeItem("token");
				navigate("/login");
			}
		}
	};

	if (loading) {
		return (
			<div className="profile-loading">
				<div className="spinner-border text-primary" role="status">
					<span className="visually-hidden">Loading...</span>
				</div>
			</div>
		);
	}

	return (
		<div className="profile-container">
			<div className="profile-header">
				<button
					className="btn btn-link text-decoration-none"
					onClick={() => navigate("/chat")}
				>
					<ArrowLeft className="me-2" />
					Back to Chat
				</button>
				<h2 className="profile-title">Profile Settings</h2>
			</div>

			<div className="profile-content">
				<div className="profile-avatar">
					<div className="avatar-wrapper">
						<img
							src={
								user.avatar ||
								`https://ui-avatars.com/api/?name=${user.username}&background=random`
							}
							alt="Profile"
							className="avatar-image"
						/>
						{isEditing && (
							<button className="avatar-upload">
								<Camera size={20} />
							</button>
						)}
					</div>
					<h3 className="avatar-name">{user.username}</h3>
				</div>

				<form onSubmit={handleSubmit} className="profile-form">
					{error && (
						<div className="alert alert-danger" role="alert">
							{error}
						</div>
					)}
					{success && (
						<div className="alert alert-success" role="alert">
							{success}
						</div>
					)}

					<div className="form-group">
						<label className="form-label">
							<User size={16} className="me-2" />
							Username
						</label>
						<input
							type="text"
							name="username"
							className="form-control"
							value={formData.username}
							onChange={handleChange}
							disabled={!isEditing}
						/>
					</div>

					<div className="form-group">
						<label className="form-label">
							<Mail size={16} className="me-2" />
							Email
						</label>
						<input
							type="email"
							name="email"
							className="form-control"
							value={formData.email}
							onChange={handleChange}
							disabled={!isEditing}
						/>
					</div>

					{isEditing && (
						<>
							<div className="form-group">
								<label className="form-label">
									<Lock size={16} className="me-2" />
									Current Password
								</label>
								<input
									type="password"
									name="currentPassword"
									className="form-control"
									value={formData.currentPassword}
									onChange={handleChange}
								/>
							</div>

							<div className="form-group">
								<label className="form-label">
									<Lock size={16} className="me-2" />
									New Password
								</label>
								<input
									type="password"
									name="newPassword"
									className="form-control"
									value={formData.newPassword}
									onChange={handleChange}
								/>
							</div>

							<div className="form-group">
								<label className="form-label">
									<Lock size={16} className="me-2" />
									Confirm New Password
								</label>
								<input
									type="password"
									name="confirmPassword"
									className="form-control"
									value={formData.confirmPassword}
									onChange={handleChange}
								/>
							</div>
						</>
					)}

					<div className="form-group">
						<label className="form-label">
							<Bell size={16} className="me-2" />
							Notification Preferences
						</label>
						<div className="form-check">
							<input
								className="form-check-input"
								type="checkbox"
								id="emailNotif"
								defaultChecked
								disabled={!isEditing}
							/>
							<label className="form-check-label" htmlFor="emailNotif">
								Email Notifications
							</label>
						</div>
						<div className="form-check">
							<input
								className="form-check-input"
								type="checkbox"
								id="soundNotif"
								defaultChecked
								disabled={!isEditing}
							/>
							<label className="form-check-label" htmlFor="soundNotif">
								Sound Notifications
							</label>
						</div>
					</div>

					<div className="profile-actions">
						{isEditing ? (
							<>
								<button type="submit" className="btn btn-primary">
									<Save size={16} className="me-2" />
									Save Changes
								</button>
								<button
									type="button"
									className="btn btn-outline-secondary"
									onClick={() => setIsEditing(false)}
								>
									Cancel
								</button>
							</>
						) : (
							<button
								type="button"
								className="btn btn-primary"
								onClick={() => setIsEditing(true)}
							>
								Edit Profile
							</button>
						)}
					</div>
				</form>
			</div>
		</div>
	);
};

export default Profile;
