import React, { useState, useEffect, useRef } from "react";
import { Send, X, ChevronDown } from "lucide-react";
import axios from "axios";

const ExpertiseModal = ({ onClose }) => {
	const [userPreferences, setUserPreferences] = useState("");
	const [expertiseDomains, setExpertiseDomains] = useState([]);
	const [selectedDomain, setSelectedDomain] = useState("");
	const [isLoading, setIsLoading] = useState(true);
	const modalRef = useRef(null);

	const handleClose = () => {
		if (onClose) {
			onClose();
		}
	};

	useEffect(() => {
		// Preload expertise domains
		const predefinedDomains = [
			"General Knowledge",
			"Programming",
			"Mathematics",
			"Science",
			"Medicine",
			"Business",
			"Law",
			"Creative Writing",
			"Data Science",
			"Artificial Intelligence",
			"History",
			"Philosophy",
			"Psychology",
			"Education",
			"Engineering",
		];

		const timer = setTimeout(() => {
			setExpertiseDomains(predefinedDomains);
			setIsLoading(false);
		}, 300);

		// Handle click outside modal
		const handleClickOutside = (event) => {
			if (modalRef.current && !modalRef.current.contains(event.target)) {
				handleClose();
			}
		};

		// Handle escape key
		const handleEscapeKey = (event) => {
			if (event.key === "Escape") {
				handleClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleEscapeKey);

		return () => {
			clearTimeout(timer);
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleEscapeKey);
		};
	}, [onClose]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!userPreferences.trim() || !selectedDomain.trim()) {
			alert("Please fill in both preferences and select an expertise domain.");
			return;
		}

		try {
			const userId = localStorage.getItem("userId");
			const { data } = await axios.post(
				`/api/user-preferences/${userId}`,
				{
					preferences: userPreferences,
					expertise_domains: selectedDomain,
				},
				{
					headers: {
						"Content-Type": "application/json",
						"Authorization": `Bearer ${localStorage.getItem("authToken")}`
					},
				}
			);
			
			// Show success message
			alert("Preferences saved successfully!");
			
			// Store preferences in localStorage for future use
			localStorage.setItem("userPreferences", userPreferences);
			localStorage.setItem("expertiseDomain", selectedDomain);
			
			// Close the modal
			handleClose();
		} catch (error) {
			console.error("Error saving preferences:", error);
			const errorMessage = error.response?.data?.error || "Could not save preferences. Please try again.";
			alert(`⚠️ Error: ${errorMessage}`);
		}
	};

	return (
		<div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn p-4 overflow-y-auto">
			<div
				ref={modalRef}
				tabIndex={-1}
				className="bg-white rounded-xl shadow-xl w-full max-w-lg transform transition-all animate-slideIn relative my-8"
			>
				{/* Modal Header */}
				<div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
					<h2 className="text-lg sm:text-xl font-semibold text-gray-800">
						System Preferences
					</h2>
					<button
						onClick={handleClose}
						className="text-gray-400 hover:text-gray-600 transition p-1 hover:bg-gray-100 rounded-full"
						aria-label="Close modal"
					>
						<X size={20} />
					</button>
				</div>

				{/* Modal Content */}
				<form onSubmit={handleSubmit} className="d-block p-4 sm:p-6 space-y-4">
					{/* System Prompt */}
					<div>
						<label
							htmlFor="system-prompt"
							className="text-sm font-medium text-gray-700 mb-2"
						>
							System Prompt
						</label>
						<textarea
							id="system-prompt"
							value={userPreferences}
							onChange={(e) => setUserPreferences(e.target.value)}
							rows={4}
							className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none transition"
							placeholder="Enter your system preferences..."
						/>
					</div>

					{/* Expertise Domain */}
					<div>
						<label
							htmlFor="expertise-domain"
							className="text-sm font-medium text-gray-700 mb-2"
						>
							Expertise Domain
						</label>
						{isLoading ? (
							<div className="flex items-center space-x-3 text-gray-500 p-3 border border-gray-200 rounded-lg bg-gray-50">
								<div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
								<span>Loading domains...</span>
							</div>
						) : (
							<div className="relative">
								<select
									id="expertise-domain"
									value={selectedDomain}
									onChange={(e) => setSelectedDomain(e.target.value)}
									className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 pr-10 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 appearance-none cursor-pointer transition"
								>
									<option value="" className="text-gray-500">
										Select a domain...
									</option>
									{expertiseDomains.map((domain) => (
										<option key={domain} value={domain} className="py-2">
											{domain}
										</option>
									))}
								</select>
								<div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
									<ChevronDown size={18} />
								</div>
							</div>
						)}
					</div>

					{/* Actions */}
					<div className="flex flex-col sm:flex-row justify-end gap-3 mt-6 sm:mt-8">
						<button
							type="button"
							onClick={handleClose}
							className="w-full sm:w-auto px-4 py-2 text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition text-sm font-medium order-2 sm:order-1"
						>
							Cancel
						</button>
						<button
							type="submit"
							className="w-full sm:w-auto px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm font-medium flex items-center justify-center gap-2 order-1 sm:order-2"
						>
							Save
							<Send size={16} />
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

export default ExpertiseModal;
