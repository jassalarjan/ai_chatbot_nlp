import React, { useEffect, useState, useRef } from 'react';
import axios from './api/axios';
import './VoiceRecognition.css';

const VoiceRecognition = () => {
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // 👇 Initialize chat and recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert('Speech Recognition not supported.');

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      addUserMessage(transcript);
      sendToAI(transcript);
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Recognition error:', event.error);
      setIsListening(false);
    };

    fetchChatId();
  }, []);

  const fetchChatId = async () => {
    try {
      const res = await axios.get('/latest-chat');
      setChatId(res.data.chat_id || 1);
    } catch (error) {
      console.error('Chat ID fetch error:', error);
      setChatId(1);
    }
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { sender: 'user', text }]);
  };

  const addAIMessage = (text) => {
    setMessages(prev => [...prev, { sender: 'ai', text }]);
  };

  const sendToAI = async (text) => {
    try {
      const res = await axios.post('/nlp', { prompt: text, chatId });
      const reply = res.data.response;
      addAIMessage(reply);
      speakAI(reply);
    } catch {
      const errMsg = "Sorry, I couldn't process that.";
      addAIMessage(errMsg);
      speakAI(errMsg);
    }
  };

  const speakAI = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';

    utterance.onstart = () => {
      setAiSpeaking(true);
      setControlsVisible(false);
    };
    utterance.onend = () => {
      setAiSpeaking(false);
      setControlsVisible(true);
    };

    synthRef.current.speak(utterance);
  };

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setControlsVisible(false);
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const stopSpeaking = () => {
    synthRef.current.cancel();
    setAiSpeaking(false);
    setControlsVisible(true);
  };

  return (
    <div className="voice-chat-container">
      <h2 className="title">🎤 Aetheron Voice AI</h2>

      <div className="chat-box">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.sender}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="controls">
        {isListening && <p className="status">🎧 Listening...</p>}
        {aiSpeaking && <p className="status">🗣️ Speaking...</p>}

        {!isListening && !aiSpeaking && !controlsVisible && (
          <button className="mic-button" onClick={startListening}>
            🎙️ Start Listening
          </button>
        )}

        {controlsVisible && (
          <div className="control-group">
            <button className="control-button" onClick={startListening}>🎙️ Speak Again</button>
            <button className="control-button danger" onClick={stopSpeaking}>🛑 Stop</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecognition;
