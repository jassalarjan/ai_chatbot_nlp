import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ChatHistoryPage = ({ userId }) => {
	const [chats, setChats] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchChats = async () => {
			try {
				const { data } = await axios.get(
					`http://localhost:5000/api/chats/${userId}`
				);
				setChats(data);
			} catch (err) {
				console.error("Error fetching chat history:", err);
				setError("Failed to load chat history.");
			} finally {
				setLoading(false);
			}
		};

		fetchChats();
	}, [userId]);

	const handleChatSelect = (chatId) => {
		navigate(`/chat/${chatId}`); // Navigate to the ChatDetailPage
	};

	return (
		<div className="container">
			<h2 className="mb-4">Chat History</h2>

			{/* Loading Indicator */}
			{loading && <p className="text-muted">Loading chat history...</p>}

			{/* Error Message */}
			{error && <p className="text-danger">{error}</p>}

			{/* Chat List */}
			{!loading && !error && (
				<ul className="list-group">
					{chats.length === 0 ? (
						<li className="list-group-item text-muted">No chats found.</li>
					) : (
						chats.map((chat) => (
							<li
								key={chat.chat_id}
								className="list-group-item list-group-item-action cursor-pointer"
								onClick={() => handleChatSelect(chat.chat_id)}
								style={{ cursor: "pointer" }}
							>
								<strong>Chat ID:</strong> {chat.chat_id} <br />
								<small>
									<strong>Started at:</strong>{" "}
									{new Date(chat.timestamp).toLocaleString()}
								</small>
							</li>
						))
					)}
				</ul>
			)}
		</div>
	);
};

export default ChatHistoryPage;
