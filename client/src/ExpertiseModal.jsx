import React, { useState } from 'react';
import { X, CheckCircle, Send } from 'lucide-react';

const ExpertiseModal = ({ onClose }) => {
    const [userPreferences, setUserPreferences] = useState(localStorage.getItem("userPreferences") || "");
    const [expertiseDomain, setExpertiseDomain] = useState(localStorage.getItem("expertiseDomain") || "");

    const handleSubmit = (e) => {
        e.preventDefault();
        localStorage.setItem("userPreferences", userPreferences);
        localStorage.setItem("expertiseDomain", expertiseDomain);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 rounded-xl shadow-xl max-w-md w-full border border-gray-700 animate-fadeIn">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold text-gray-100">System Preferences</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-300 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="userPreferences" className="block text-sm font-medium text-gray-300 mb-2">
                                User Preferences
                            </label>
                            <textarea
                                id="userPreferences"
                                value={userPreferences}
                                onChange={(e) => setUserPreferences(e.target.value)}
                                placeholder="Enter your preferences for AI interactions..."
                                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                rows="4"
                            />
                        </div>

                        <div>
                            <label htmlFor="expertiseDomain" className="block text-sm font-medium text-gray-300 mb-2">
                                Expertise Domain
                            </label>
                            <textarea
                                id="expertiseDomain"
                                value={expertiseDomain}
                                onChange={(e) => setExpertiseDomain(e.target.value)}
                                placeholder="Specify your areas of expertise..."
                                className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                rows="4"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="w-full sm:w-auto px-6 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition text-sm font-medium flex items-center justify-center gap-2 order-2 sm:order-1"
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
        </div>
    );
};

export default ExpertiseModal;
