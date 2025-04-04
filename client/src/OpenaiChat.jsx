import React, { useState } from "react";
import axios from "axios";

const OpenAiChat = () => {
    const [prompt, setPrompt] = useState("");
    const [messages, setMessages] = useState([]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        // ✅ Add user message instantly
        const newMessages = [...messages, { role: "user", content: prompt }];
        setMessages(newMessages);
        setPrompt("");

        try {
            const res = await axios.post("http://localhost:5000/api/ollama", { prompt });

            // ✅ Add AI response immediately after
            setMessages([...newMessages, { role: "assistant", content: res.data.response }]);
        } catch (error) {
            console.error("Error fetching response:", error);
            setMessages([...newMessages, { role: "assistant", content: "⚠️ Error: Could not fetch response" }]);
        }
    };

    return (
        <div style={{ padding: "20px", textAlign: "center" }}>
            <h2>Together AI Chat</h2>
            <div
                style={{
                    height: "300px",
                    overflowY: "auto",
                    border: "1px solid #ddd",
                    padding: "10px",
                    marginBottom: "10px",
                    background: "#f9f9f9",
                }}
            >
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        style={{
                            textAlign: msg.role === "user" ? "right" : "left",
                            marginBottom: "5px",
                        }}
                    >
                        <strong>{msg.role === "user" ? "You" : "AI"}:</strong> {msg.content}
                    </div>
                ))}
            </div>
            <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ask something..."
                    style={{ flex: 1, padding: "10px" }}
                />
                <button type="submit" style={{ padding: "10px" }}>Send</button>
            </form>
        </div>
    );
};

export default OpenAiChat;
