import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { User, Send, MessageSquare, Plus, LogOut, Settings } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import ExpertiseModal from "./ExpertiseModal";
import VoiceRecognition from "./VoiceRecognition";
import MessageFormatter from "./MessageFormatter";

const apiUrl = import.meta.env.VITE_API_URL;
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
	const [showVoiceAlert, setShowVoiceAlert] = useState(false);
	const chatBoxRef = useRef(null);

	// Check authentication on component mount
	useEffect(() => {
		const token = localStorage.getItem("authToken");
		if (!token) {
			window.location.href = "/login";
			return;
		}
	}, []);

	// Add authentication header to axios requests
	const authAxios = axios.create({
		baseURL: '/api',
		headers: {
			'Authorization': `Bearer ${localStorage.getItem("authToken")}`
		}
	});

	useEffect(() => {
		const fetchChatData = async () => {
			try {
				const latestChatResponse = await authAxios.get('/latest-chat');
				setChatId(latestChatResponse.data.chat_id + 1);

				const chatHistoryResponse = await authAxios.get('/chat-history');
				setChatHistory(chatHistoryResponse.data);
			} catch (error) {
				if (error.response?.status === 401 || error.response?.status === 403) {
					window.location.href = "/login";
				}
				console.error("Error fetching chat data:", error);
			}
		};

		fetchChatData();
	}, []);

	useEffect(() => {
		if (chatBoxRef.current) {
			chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
		}
	}, [messages]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!prompt.trim()) return;

		const newMessages = [...messages, { sender: "user", message: prompt }];
		setMessages(newMessages);

		try {
			const userPreferences = localStorage.getItem("userPreferences") || "";
			const expertiseDomain = localStorage.getItem("expertiseDomain") || "";
			
			const { data } = await authAxios.post('/chat', {
				prompt,
				chat_id: chatId,
				sender: "user",
				userPreferences,
				expertiseDomains: expertiseDomain
			});

			setMessages((prevMessages) => [
				...prevMessages,
				{ sender: "ai", message: data.response },
			]);
			setPrompt("");
		} catch (error) {
			if (error.response?.status === 401 || error.response?.status === 403) {
				window.location.href = "/login";
				return;
			}
			console.error("Error fetching response:", error);
			setMessages((prevMessages) => [
				...prevMessages,
				{ sender: "ai", message: "⚠️ Error: Could not fetch response" },
			]);
		}
	};

	// Check for microphone permissions
	useEffect(() => {
		const checkMicrophonePermission = async () => {
			try {
				// Check if getUserMedia is supported
				if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
					console.error("getUserMedia not supported in this browser");
					setShowVoiceAlert(true);
					return;
				}

				// Request microphone access
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
				
				// Stop all tracks to release the microphone
				stream.getTracks().forEach(track => track.stop());
				
				// Check if we have permission
				const permissionStatus = await navigator.permissions.query({ name: 'microphone' });
				if (permissionStatus.state === 'granted') {
					console.log("Microphone permission granted");
					setShowVoiceAlert(false);
				} else {
					console.warn("Microphone permission not granted:", permissionStatus.state);
					setShowVoiceAlert(true);
				}
			} catch (error) {
				console.error("Microphone permission error:", error);
				setShowVoiceAlert(true);
			}
		};

		checkMicrophonePermission();
	}, []);

	// Add a function to check network connectivity
	const checkNetworkConnectivity = () => {
		if (!navigator.onLine) {
			console.error("No internet connection");
			return false;
		}
		return true;
	};

	const handleVoiceTranscript = (transcript) => {
		console.log("Voice transcript received:", transcript);
		if (transcript && transcript.trim()) {
			setPrompt(transcript);
			// Add a small delay before submitting to allow the user to see what was transcribed
			setTimeout(() => {
				handleSubmit({ preventDefault: () => {} });
			}, 500);
		}
	};

	const handleChatSelect = async (chat) => {
		setChatId(chat.chat_id);
		try {
			const response = await authAxios.get(`/chats/${chat.chat_id}/messages`);
			const messages = response.data;
			const formattedMessages = messages.flatMap((msg) => [
				{ sender: "user", message: msg.message },
				{ sender: "ai", message: msg.response },
			]);
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
			const { data } = await authAxios.get('/latest-chat');
			const newChatId = data.chat_id + 1;
			setChatId(newChatId);
			setMessages([]);
			setPrompt("");
		} catch (error) {
			if (error.response?.status === 401 || error.response?.status === 403) {
				window.location.href = "/login";
				return;
			}
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
			handleSubmit(e);
		}
	};

	return (
		<div className="h-screen flex bg-gray-50">
			{/* Sidebar */}
			<div className="w-80 bg-white border-r border-gray-200 flex flex-col">
				{/* User Profile Section */}
				<div className="p-4 border-b border-gray-200">
					<div className="relative">
						<button
							onClick={() => setDropdownOpen(!dropdownOpen)}
							className="flex items-center space-x-3 w-full p-2 rounded-lg hover:bg-gray-50 transition-colors"
						>
							<div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
								<User className="w-6 h-6 text-indigo-600" />
							</div>
							<div className="flex-1 text-left">
								<div className="font-medium text-gray-900">
									{localStorage.getItem("username") || "User"}
								</div>
								<div className="text-sm text-gray-500">Click to manage</div>
							</div>
						</button>

						{dropdownOpen && (
							<div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
								<button
									onClick={() => {
										setShowModal(true);
										setDropdownOpen(false);
									}}
									className="flex items-center space-x-3 w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
								>
									<Settings className="w-4 h-4" />
									<span>Edit System Prompt</span>
								</button>
								<button
									onClick={handleLogout}
									className="flex items-center space-x-3 w-full px-4 py-2 text-left text-red-600 hover:bg-gray-50"
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
						className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
					>
						New Chat
					</button>
				</div>

				{/* Chat History */}
				<div className="flex-1 overflow-y-auto p-4">
					<h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
						Chat History
					</h2>
					<div className="space-y-2">
						{chatHistory.map((chat) => (
							<button
								key={chat.chat_id}
								className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
									chat.chat_id === chatId
										? "bg-indigo-50 text-indigo-700"
										: "hover:bg-gray-50 text-gray-700"
								}`}
								onClick={() => handleChatSelect(chat)}
							>
								Chat {chat.chat_id}
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Chat Window */}
			<div className="flex-1 flex flex-col">
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
										? "bg-indigo-600 text-white"
										: "bg-white shadow-sm border border-gray-200"
								}`}
							>
								<MessageFormatter message={msg.message} />
							</div>
						</div>
					))}
				</div>

				{/* Voice Alert */}
				{showVoiceAlert && (
					<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
						<div className="flex">
							<div className="flex-shrink-0">
								<svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
								</svg>
							</div>
							<div className="ml-3">
								<p className="text-sm text-yellow-700">
									Microphone access is required for voice input. Please enable it in your browser settings.
								</p>
								<p className="text-xs text-yellow-600 mt-1">
									Click the lock/info icon in your browser's address bar to manage permissions.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Network Status Alert */}
				{!checkNetworkConnectivity() && (
					<div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
						<div className="flex">
							<div className="flex-shrink-0">
								<svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
									<path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
									<path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
								</svg>
							</div>
							<div className="ml-3">
								<p className="text-sm text-red-700">
									No internet connection. Voice recognition requires an active internet connection.
								</p>
								<p className="text-xs text-red-600 mt-1">
									Please check your network connection and try again.
								</p>
							</div>
						</div>
					</div>
				)}

				{/* Input Area */}
				<div className="border-t border-gray-200 p-4 bg-white">
					<form onSubmit={handleSubmit} className="flex gap-4">
						<textarea
							className="flex-1 resize-none rounded-lg border border-gray-200 p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							value={prompt}
							onChange={(e) => setPrompt(e.target.value)}
							onKeyDown={handleKeyDown}
							rows="1"
							placeholder="Type a message..."
						/>
						<div className="flex items-center gap-2">
							<VoiceRecognition onTranscript={handleVoiceTranscript} />
							<button
								type="submit"
								className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors"
							>
								<Send size={20} />
							</button>
						</div>
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
