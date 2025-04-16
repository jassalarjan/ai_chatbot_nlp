import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { User, Send, MessageSquare, Plus, LogOut, Settings } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import ExpertiseModal from "./ExpertiseModal";
import MessageFormatter from "./MessageFormatter";
import api from "./api/axios";

const apiUrl = import.meta.env.VITE_API_URL;
// Update the API URL to use the correct frontend port
const API_URL = "http://localhost:5173/api/chat";
// Message formatter component
const MessageFormatterComponent = ({ message }) => (
	<ReactMarkdown
		components={{
			code: ({ node, inline, className, children, ...props }) => {
				const match = /language-(\w+)/.exec(className || "");
				return !inline && match ? (
					<div className="my-4 rounded-lg overflow-hidden bg-gray-900">
						<SyntaxHighlighter
							style={vscDarkPlus}
							language={match[1]}
							PreTag="div"
							showLineNumbers={true}
							{...props}
						>
							{String(children).replace(/\n$/, "")}
						</SyntaxHighlighter>
					</div>
				) : (
					<code
						className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded"
						{...props}
					>
						{children}
					</code>
				);
			},
		}}
	>
		{message}
	</ReactMarkdown>
);

const TogetherAIChat = ({ setView }) => {
	const [prompt, setPrompt] = useState("");
	const [chatId, setChatId] = useState(null);
	const [messages, setMessages] = useState([]);
	const [chatHistory, setChatHistory] = useState([]); // Add missing state for chat history
	const [dropdownOpen, setDropdownOpen] = useState(false);
	const [showModal, setShowModal] = useState(false);
	const chatBoxRef = useRef(null);

	// Check authentication on component mount
	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			window.location.href = "/login";
			return;
		}
	}, []);

	const fetchChatHistory = async () => {
		try {
			const response = await api.get('/chat-history');
			if (response.data.chats && response.data.chats.length > 0) {
				setChatHistory(response.data.chats);
			} else {
				console.log(response.data.message || 'No chat history found');
				setChatHistory([]); // Set empty history if no chats exist
			}
		} catch (error) {
			console.error('Error fetching chat history:', error);
			// Check for auth errors
			if (error.response?.status === 401 || error.response?.status === 403) {
				handleLogout();
				return;
			}
			setChatHistory([]); // Set empty history on error
		}
	};

	const fetchOrCreateChat = async () => {
		try {
			const response = await api.get('/latest-chat');
			if (response.data.chat_id) {
				setChatId(response.data.chat_id);
			} else {
				console.log(response.data.message || 'No chats available');
				setChatId(1); // Default to chat ID 1 if no chats exist
			}
		} catch (error) {
			console.error('Error fetching latest chat:', error);
			setChatId(1); // Default to chat ID 1 on error
		}
	};

	useEffect(() => {
		fetchChatHistory();
		fetchOrCreateChat();
	}, []);

	useEffect(() => {
		if (chatBoxRef.current) {
			chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
		}
	}, [messages]);

	// Update the handleSendMessage function to save AI responses with sender as 'ai'
	const handleSendMessage = async () => {
		if (!prompt.trim()) return;

		try {
			const userPreferences = localStorage.getItem("userPreferences") || "";
			const expertiseDomain = localStorage.getItem("expertiseDomain") || "";

			// Add user message to UI immediately
			const userMessage = { sender: 'user', text: prompt };
			setMessages(prev => [...prev, userMessage]);
			setPrompt(''); // Clear input immediately for better UX

			// Send message to server using the configured axios instance
			const { data } = await api.post('/chat', {
				prompt,
				chat_id: chatId,
				sender: "user",
				userPreferences,
				expertiseDomains: expertiseDomain
			});

			// Add bot response to UI
			const botMessage = {
				sender: 'ai',
				text: data.response,
			};
			setMessages(prev => [...prev, botMessage]);

				// Update chat ID if this was a new chat
			if (data.chat_id !== chatId) {
				setChatId(data.chat_id);
				await fetchChatHistory();
			}

		} catch (error) {
			console.error('Error sending message:', error);
			let errorMessage = 'An error occurred while sending your message.';

			if (error.response?.status === 401 || error.response?.status === 403) {
				localStorage.removeItem("authToken");
				window.location.href = "/login";
				return;
			} else if (error.response?.data?.error) {
				errorMessage = error.response.data.error;
			} else if (!navigator.onLine) {
				errorMessage = 'You are offline. Please check your internet connection.';
			}

			// Add error message to UI
			const errorBotMessage = { 
				sender: 'ai', 
				text: `Error: ${errorMessage}`
			};
			setMessages(prev => [...prev, errorBotMessage]);
		}
	};

	// Add a function to check network connectivity
	const checkNetworkConnectivity = () => {
		if (!navigator.onLine) {
			console.error("No internet connection");
			return false;
		}
		return true;
	};

	const handleChatSelect = async (chat) => {
		setChatId(chat.chat_id);
		try {
			const response = await api.get(`/chats/${chat.chat_id}/messages`);
			const messages = response.data;
			const formattedMessages = messages.map((msg) => ({
				sender: msg.sender,
				text: msg.message || msg.response // Use message for user, response for AI
			}));
			setMessages(formattedMessages);
		} catch (error) {
			if (error.response?.status === 401 || error.response?.status === 403) {
				window.location.href = "/login";
				return;
			}
			console.error("Error fetching chat messages:", error);
			setMessages([]);
		}
	};

	const handleNewChat = async () => {
		try {
			// Clear current chat state
			setMessages([]);
			setChatId(null);
			setPrompt('');
			
			// Refresh chat history
			await fetchChatHistory();
		} catch (error) {
			console.error("Error creating new chat:", error);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("authToken");
		window.location.href = "/login";
	};

	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	return (
		<div className="flex h-screen bg-white">
			{/* Sidebar */}
			<div className="w-80 bg-white border-r border-gray-300 flex flex-col">
				{/* User Profile Section */}
				<div className="p-4 border-b border-gray-700">
					<div className="relative">
						<button
							onClick={() => setDropdownOpen(!dropdownOpen)}
							className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-700 transition-colors"
						>
							<div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center">
								<User className="w-6 h-6 text-indigo-400" />
							</div>
							<div className="flex-1 text-left">
								<div className="font-medium text-gray-100">
									{localStorage.getItem("username") || "User"}
								</div>
								<div className="text-sm text-gray-400">Click to manage</div>
							</div>
						</button>

						{dropdownOpen && (
							<div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-2">
								<button
									onClick={() => {
										setShowModal(true);
										setDropdownOpen(false);
									}}
									className="flex items-center space-x-3 w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-700"
								>
									<Settings className="w-4 h-4" />
									<span>Edit System Prompt</span>
								</button>
								<button
									onClick={handleLogout}
									className="flex items-center space-x-3 w-full px-4 py-2 text-left text-red-400 hover:bg-gray-700"
								>
									<LogOut className="w-4 h-4" />
									<span>Logout</span>
								</button>
							</div>
						)}
					</div>
				</div>

				{/* New Chat Button */}
				<div className="p-4">
					<button
						onClick={handleNewChat}
						className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
					>
						<Plus className="w-5 h-5" />
						New Chat
					</button>
				</div>

				{/* Chat History */}
				<div className="flex-1 overflow-y-auto p-4">
					<h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
						Chat History
					</h2>
					<div className="space-y-2">
						{chatHistory.map((chat) => (
							<button
								key={chat.chat_id}
								className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
									chat.chat_id === chatId
										? "bg-indigo-500/20 text-indigo-400"
										: "text-gray-300 hover:bg-gray-700"
								}`}
								onClick={() => handleChatSelect(chat)}
							>
								<div className="flex items-center gap-3">
									<MessageSquare className="w-4 h-4" />
									<span>Chat {chat.chat_id}</span>
								</div>
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Chat Window */}
			<div className="flex-1 flex flex-col bg-white">
				<div ref={chatBoxRef} className="flex-1 overflow-y-auto p-6 space-y-6">
					{messages.map((msg, index) => (
						<div
							key={index}
							className={`flex ${
								msg.sender === "user" ? "justify-end" : "justify-start"
							}`}
						>
							<div
								className={`max-w-2xl rounded-lg p-4 ${
									msg.sender === "user"
										? "bg-blue-100 text-blue-800"
										: "bg-gray-100 text-gray-800 border border-gray-300"
								}`}
							>
								<MessageFormatter message={msg.text} />
							</div>
						</div>
					))}
				</div>

				

				{/* Network Status Alert */}
				{!checkNetworkConnectivity() && (
					<div className="mx-6 mb-4">
						<div className="bg-red-900/50 border-l-4 border-red-500 p-4 rounded-r-lg">
							<div className="flex">
								<div className="flex-shrink-0">
									<svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
										<path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
										<path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
									</svg>
								</div>
								<div className="ml-3">
									<p className="text-sm text-red-200">
										No internet connection
									</p>
									<p className="text-xs text-red-300/80 mt-1">
										Please check your network connection and try again
									</p>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Input Area */}
				<div className="border-t border-gray-300 p-4 bg-gray-50">
					<form onSubmit={handleSendMessage} className="flex gap-4">
						<textarea
							className="flex-1 resize-none rounded-lg bg-white border border-gray-300 p-3 text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							onKeyDown={handleKeyDown}
							rows="1"
							placeholder="Type a message..."
						/>
						<button
							type="submit"
							className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
							title="Send message"
						>
							<Send className="h-5 w-5" />
						</button>
					</form>
				</div>
			</div>

			{/* Modal */}
			{showModal && (
				<ExpertiseModal onClose={() => setShowModal(false)} />
			)}
		</div>
	);
};

export default TogetherAIChat;
