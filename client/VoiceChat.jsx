import React, { useState, useEffect, useRef } from 'react';

const VoiceChat = () => {
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Setup Web Speech API recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech Recognition API not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onerror = (e) => {
      setError('Microphone error or permission denied.');
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      handleUserMessage(transcript);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    setError(null);
    try {
      recognitionRef.current?.start();
    } catch (e) {
      setError('Unable to start voice recognition.');
    }
  };

  const handleUserMessage = async (text) => {
    if (!text.trim()) return;

    const userMsg = { sender: 'user', text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error('API error');

      const data = await response.json();
      const botMsg = { sender: 'bot', text: data.reply };
      setMessages((prev) => [...prev, botMsg]);
      speakText(data.reply);
    } catch (err) {
      setError('Failed to get response from server.');
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={styles.container}>
      <h2>🎙️ Voice Chat</h2>
      <div style={styles.chatBox}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              ...styles.message,
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              backgroundColor: msg.sender === 'user' ? '#DCF8C6' : '#E0E0E0',
            }}
          >
            <strong>{msg.sender === 'user' ? 'You' : 'Bot'}:</strong> {msg.text}
          </div>
        ))}
      </div>
      {error && <div style={styles.error}>{error}</div>}
      <button onClick={startListening} style={styles.button} disabled={isListening}>
        {isListening ? 'Listening...' : 'Start Talking 🎤'}
      </button>
    </div>
  );
};

// Inline styling for minimal UI
const styles = {
  container: {
    maxWidth: '500px',
    margin: '30px auto',
    padding: '20px',
    border: '2px solid #ddd',
    borderRadius: '10px',
    fontFamily: 'Arial, sans-serif',
  },
  chatBox: {
    minHeight: '200px',
    maxHeight: '300px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px',
    border: '1px solid #ccc',
    padding: '10px',
    borderRadius: '5px',
  },
  message: {
    padding: '8px 12px',
    borderRadius: '12px',
    maxWidth: '80%',
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
  },
  error: {
    color: 'red',
    marginBottom: '10px',
  },
};

export default VoiceChat;
