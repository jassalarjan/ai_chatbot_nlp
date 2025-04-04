import React, {useEffect, useState } from "react";
import axios from "axios";

const OllamaChat = () => {
	const [prompt, setPrompt] = useState("");
	const [response, setResponse] = useState("");
	const [msgcount, setmsgcount] = useState(0);
	const [chatcount, setchatcount] = useState(1);
	useEffect(() => {
		fetch("http://localhost:5000/api/latest-chat")
			.then((response) => response.json())
			.then((data) => {
				setchatcount(data.chat_id); // Update state with latest chat_id
			})
			.catch((error) => console.error("Error fetching latest chat:", error));
	}, []);

	const handleSubmit = async (e) => {
		e.preventDefault();
		try {
			
			console.log("Sending request:", { prompt });

			const res = await axios.post(
				"http://localhost:5000/api/ollama",
				{ prompt, msgcount, chatcount }
			);

			console.log("Response received:", res.data);

			setResponse(res.data || "No response received");
		} catch (error) {
			console.error("Error fetching response:", error);
			setResponse("Error: Could not fetch response");
		}
	};

	// Function to start a new chat
	const handleNewChat = () => {
		setPrompt(""); // Clear the input
		setResponse(""); // Clear the response
	};
	const handleMsgCounter = () => {
		setmsgcount(msgcount + 1);
	};
	const handleChatCounter = () => {
		setchatcount(chatcount + 1);
	};
	return (
		<div style={{ padding: "20px", textAlign: "center" }}>
			<h2>AI Chat</h2>
			<form onSubmit={handleSubmit}>
				<input
					type="text"
					value={prompt}
					onChange={(e) => setPrompt(e.target.value)}
					placeholder="Enter your message..."
					style={{ width: "80%", padding: "10px" }}
				/>
				<button
					onClick={handleMsgCounter}
					type="submit"
					style={{ padding: "10px", marginLeft: "10px" }}
				>
					Send
				</button>
			</form>
			<button
				onClick={() => {
					handleNewChat();
					handleChatCounter();
				}}
				style={{ padding: "10px", marginTop: "10px" }}
			>
				New Chat
			</button>
			<div style={{ marginTop: "20px", textAlign: "left" }}>
				<strong>Response:</strong>
				<pre
					style={{
						background: "#f4f4f4",
						padding: "10px",
						borderRadius: "5px",
						overflowX: "auto",
					}}
				>
					<code>{response}</code>
				</pre>
			</div>
		</div>
	);
};

export default OllamaChat;
