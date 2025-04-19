import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useHistory } from "react-router-dom";

const ChatDetailPage = () => {
	const { chatId } = useParams(); // Get chatId from the URL
	const history = useHistory();
	const [messages, setMessages] = useState([]);
	const [prompt, setPrompt] = useState("");
	const [response, setResponse] = useState("");

	// Fetch messages for the selected chatId
	useEffect(() => {
		const fetchMessages = async () => {
			try {
				const { data } = await axios.get(
					`http://localhost:5000/api/messages/${chatId}`
				);
				setMessages(data);
			} catch (error) {
				console.error("Error fetching messages:", error);
			}
		};

		fetchMessages();
	}, [chatId]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setResponse("Loading...");

		if (!prompt) {
			setResponse("⚠️ Please enter a message.");
			return;
		}

		try {
			const { data } = await axios.post("http://localhost:5000/api/messages", {
				chat_id: chatId,
				sender: "user",
				message: prompt,
				response: "AI is thinking...", // Mocking the AI response initially
			});

			// Append the new message
			setMessages((prevMessages) => [
				...prevMessages,
				{ sender: "user", message: prompt, response: "AI is thinking..." },
			]);

			// Fetch the actual AI response (you can replace this with actual logic)
			setTimeout(() => {
				setMessages((prevMessages) => [
					...prevMessages,
					{ sender: "ai", message: prompt, response: "AI response here!" },
				]);
				setResponse("AI response here!");
			}, 1000);

			setPrompt(""); // Clear the input
		} catch (error) {
			console.error("Error submitting message:", error);
			setResponse("⚠️ Error sending message.");
		}
	};

	const handleBackClick = () => {
		history.push("/"); // Go back to chat history
	};

	return (
		<div className="container">
			<h2>Chat with Aetheron NLP (Chat ID: {chatId})</h2>
			<button onClick={handleBackClick} className="btn btn-secondary mb-3">
				Back to Chat History
			</button>
			<div
				className="chat-box"
				style={{ maxHeight: "60vh", overflowY: "auto" }}
			>
				{messages.map((msg, index) => (
					<div
						key={index}
						className={`alert ${
							msg.sender === "user" ? "alert-primary" : "alert-secondary"
						}`}
					>
						<strong>{msg.sender === "user" ? "You" : "Aetheron NLP"}:</strong>
						<p>{msg.message}</p>
						{msg.response && (
							<p>
								<strong>Response:</strong> {msg.response}
							</p>
						)}
					</div>
				))}
				{response && (
					<div className="alert alert-secondary">
						<strong>Aetheron NLP:</strong>
						<p>{response}</p>
					</div>
				)}
			</div>

			<form onSubmit={handleSubmit} className="d-flex mt-3">
				<input
					type="text"
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder="Continue the conversation..."
					className="form-control"
				/>
				<button type="submit" className="btn btn-primary ms-2">
					Send
				</button>
			</form>
		</div>
	);
};

export default ChatDetailPage;
