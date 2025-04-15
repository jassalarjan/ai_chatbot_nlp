import React, { useState, useEffect } from 'react';
import axios from './api/axios';
import ProtectedRoute from './ProtectedRoute';
import './ImageGenerator.css';

const ImageGenerator = () => {
  const [messages, setMessages] = useState([]);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const [imageHistory, setImageHistory] = useState([]);

  // Fetch chat history and images on component mount
  useEffect(() => {
    fetchImageHistory();
    fetchOrCreateChat();
  }, []);

  const fetchImageHistory = async () => {
    try {
      const response = await axios.get('/image/history');
      setImageHistory(response.data);
    } catch (error) {
      console.error('Error fetching image history:', error);
      setImageHistory([]); // Set empty history on error
    }
  };

  const fetchOrCreateChat = async () => {
    try {
      const response = await axios.get('/latest-chat');
      if (response.data.chat_id) {
        setChatId(response.data.chat_id);
      } else {
        console.log(response.data.message || 'No chats available');
        setChatId(1); // Default to chat ID 1 if no chats exist
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
      setChatId(1); // Default to chat ID 1 on error
    }
  };

  const handleSend = async () => {
    if (!prompt.trim()) return;

    const userMessage = { sender: 'user', text: prompt };
    setMessages((prev) => [...prev, userMessage]);

    setLoading(true);
    try {
      const response = await axios.post('/image', 
        { prompt, chatId },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      const botMessage = {
        sender: 'bot',
        text: 'Here is your generated image:',
        imageUrl: response.data.imageUrl,
      };
      setMessages((prev) => [...prev, botMessage]);
      await fetchImageHistory();
    } catch (error) {
      console.error('Error generating image:', error);
      const errorMessage = { 
        sender: 'bot', 
        text: `Failed to generate image: ${error.response?.data?.error || error.message || 'Unknown error'}` 
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setPrompt('');
    }
  };

  const handleNewChat = async () => {
    try {
      await fetchOrCreateChat();
      setMessages([]);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  return (
    <div className="image-generator-page">
      <div className="page-header">
        <h1 className="page-title">Image Generator Chat</h1>
        <button onClick={handleNewChat} className="new-chat-button">
          New Chat
        </button>
      </div>

      <div className="content-wrapper">
        <div className="chat-box">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <p>{msg.text}</p>
              {msg.imageUrl && <img src={msg.imageUrl} alt="Generated" className="generated-image" />}
            </div>
          ))}
        </div>

        <div className="image-history-sidebar">
          <h2>Image History</h2>
          <div className="image-history-list">
            {imageHistory.map((img) => (
              <div key={img.id} className="history-item">
                <small>{new Date(img.created_at).toLocaleString()}</small>
                <p className="prompt-text">{img.prompt}</p>
                <button 
                  className="view-image-btn"
                  onClick={async () => {
                    try {
                      const response = await axios.get(`/image/${img.id}`);
                      setMessages(prev => [...prev, {
                        sender: 'bot',
                        text: 'Previous image:',
                        imageUrl: response.data.imageUrl
                      }]);
                    } catch (error) {
                      console.error('Error fetching image:', error);
                    }
                  }}
                >
                  View Image
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="input-area">
        <textarea
          placeholder="Type your prompt here..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="input-prompt"
        />
        <button onClick={handleSend} disabled={loading} className="send-button">
          {loading ? 'Generating...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

const SecuredImageGenerator = () => (
  <ProtectedRoute>
    <ImageGenerator />
  </ProtectedRoute>
);

export default SecuredImageGenerator;