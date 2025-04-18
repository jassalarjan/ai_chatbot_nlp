import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "./api/axios";
import { MessageSquare, Plus } from "lucide-react";

const ChatHistoryPage = () => {
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchChats = async () => {
            try {
                const { data } = await api.get("/chat-history");
                setChats(data.chats || []);
            } catch (error) {
                console.error("Error fetching chat history:", error);
                if (error.response?.status === 401 || error.response?.status === 403) {
                    navigate("/login");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchChats();
    }, [navigate]);

    const handleNewChat = async () => {
        try {
            const { data } = await api.post("/chat", {
                prompt: "Hello",
                sender: "user"
            });
            navigate(`/chat/${data.chat_id}`);
        } catch (error) {
            console.error("Error creating new chat:", error);
            if (error.response?.status === 401 || error.response?.status === 403) {
                navigate("/login");
            }
        }
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Chat History</h2>
                <button
                    onClick={handleNewChat}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    New Chat
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8">Loading chat history...</div>
            ) : chats.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                    No chat history found. Start a new chat!
                </div>
            ) : (
                <div className="grid gap-4">
                    {chats.map((chat) => (
                        <button
                            key={chat.chat_id}
                            onClick={() => navigate(`/chat/${chat.chat_id}`)}
                            className="block w-full text-left p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
                        >
                            <div className="flex items-center gap-3">
                                <MessageSquare className="w-5 h-5 text-blue-500" />
                                <div>
                                    <div className="font-medium">Chat #{chat.chat_id}</div>
                                    <div className="text-sm text-gray-500">
                                        Last message: {new Date(chat.last_message_time).toLocaleString()}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ChatHistoryPage;
