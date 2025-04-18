import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./api/axios";
import MessageFormatter from "./MessageFormatter";

const ChatDetailPage = () => {
    const { chatId } = useParams();
    const navigate = useNavigate();
    const [messages, setMessages] = useState([]);
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);

    // Fetch messages for the selected chatId
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const { data } = await api.get(`/chats/${chatId}/messages`);
                const formattedMessages = data.map(msg => ({
                    sender: msg.sender,
                    text: msg.message || msg.response
                }));
                setMessages(formattedMessages);
            } catch (error) {
                console.error("Error fetching messages:", error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    navigate("/login");
                }
            }
        };

        fetchMessages();
    }, [chatId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!prompt.trim()) return;

        setLoading(true);
        try {
            // Add user message to UI immediately
            const userMessage = { sender: 'user', text: prompt };
            setMessages(prev => [...prev, userMessage]);
            setPrompt(""); // Clear input immediately for better UX

            // Send message to server
            const { data } = await api.post('/chat', {
                prompt,
                chat_id: chatId,
                sender: "user"
            });

            // Add AI response to messages
            const botMessage = {
                sender: 'ai',
                text: data.response
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (error) {
            console.error("Error submitting message:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate("/login");
            }
            // Add error message to UI
            const errorMessage = {
                sender: 'ai',
                text: "⚠️ Error: Failed to send message. Please try again."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
                <button 
                    onClick={() => navigate("/chat")} 
                    className="mr-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition-colors"
                >
                    Back
                </button>
                <h2 className="text-2xl font-semibold">Chat #{chatId}</h2>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6 mb-6 h-[60vh] overflow-y-auto">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`mb-4 ${
                            msg.sender === "user" ? "text-right" : "text-left"
                        }`}
                    >
                        <div
                            className={`inline-block max-w-[70%] rounded-lg p-4 ${
                                msg.sender === "user"
                                    ? "bg-blue-100 text-blue-900"
                                    : "bg-gray-100 text-gray-900"
                            }`}
                        >
                            <MessageFormatter message={msg.text} />
                        </div>
                    </div>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-4">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:bg-blue-300"
                    disabled={loading}
                >
                    {loading ? "Sending..." : "Send"}
                </button>
            </form>
        </div>
    );
};

export default ChatDetailPage;
