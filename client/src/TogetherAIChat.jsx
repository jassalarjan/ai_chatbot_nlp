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
	const [chatHistory, setChatHistory] = useState([]);
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
			const response = await api.get('/chat/chat-history');
			if (response.data.chats && response.data.chats.length > 0) {
				setChatHistory(response.data.chats);
			} else {
				console.log(response.data.message || 'No chat history found');
				setChatHistory([]);
			}
		} catch (error) {
			console.error('Error fetching chat history:', error);
			if (error.response?.status === 401 || error.response?.status === 403) {
				handleLogout();
				return;
			}
			setChatHistory([]);
		}
	};

	const fetchOrCreateChat = async () => {
		try {
			const response = await api.get('/chat/latest-chat');
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
			const response = await api.get(`/chat/chats/${chat.chat_id}/messages`);
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

				{/* Chat History Section */}
				<div className="flex-1 overflow-y-auto">
					{/* Add your chat history */}
					{chatHistory.map((chat) => (
						<div
							key={chat.chat_id}
							className="cursor-pointer hover:bg-gray-200 py-3 px-4 border-b border-gray-300"
							onClick={() => handleChatSelect(chat)}
						>
							<span className="font-medium">Chat {chat.chat_id}</span>
						</div>
					))}
				</div>

				{/* New Chat Button */}
				<div className="p-4">
					<button
						onClick={handleNewChat}
						className="flex items-center space-x-2 p-3 w-full rounded-lg bg-indigo-500 text-white"
					>
						<Plus className="w-5 h-5" />
						<span>Create New Chat</span>
					</button>
				</div>
			</div>

			{/* Main Chat Section */}
			<div className="flex-1 flex flex-col">
				<div className="flex-1 overflow-y-auto p-4" ref={chatBoxRef}>
					{messages.length ? (
						messages.map((message, index) => (
							<div
								key={index}
								className={`my-2 flex ${message.sender === "ai" ? "justify-start" : "justify-end"}`}
							>
								<div
									className={`rounded-lg p-3 ${message.sender === "ai" ? "bg-gray-200" : "bg-indigo-500 text-white"}`}
								>
									<MessageFormatterComponent message={message.text} />
								</div>
							</div>
						))
					) : (
						<div className="text-center text-gray-400 py-5">No messages yet</div>
					)}
				</div>

				{/* Chat Input Section */}
				<div className="border-t border-gray-300 p-4">
					<div className="relative flex items-center space-x-2">
						<textarea
							className="w-full h-16 p-3 rounded-lg border border-gray-300 resize-none"
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							onKeyDown={handleKeyDown}
							placeholder="Type your message..."
						/>
						<button
							onClick={handleSendMessage}
							className="absolute right-3 top-3 text-indigo-500"
						>
							<Send />
						</button>
					</div>
				</div>
			</div>

			{/* Expertise Modal */}
			{showModal && (
				<ExpertiseModal
					onClose={() => setShowModal(false)}
					onSave={() => setShowModal(false)}
				/>
			)}
		</div>
	);
};

export default TogetherAIChat;
