import React, { useState, useCallback } from 'react';
import { Mic, MicOff } from 'lucide-react';

/**
 * VoiceRecognition component that allows users to input text using speech
 * @param {Object} props - Component props
 * @param {Function} props.onTranscript - Callback function that receives the transcribed text
 * @param {string} props.className - Optional CSS class name
 * @returns {JSX.Element} The VoiceRecognition component
 */
const VoiceRecognition = ({ onTranscript, className = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');

  /**
   * Starts the speech recognition process
   */
  const startListening = useCallback(() => {
    setError('');
    
    // Check if browser supports speech recognition
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    // Create speech recognition instance
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event) => {
      setError('Error occurred in recognition: ' + event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, [onTranscript]);

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        onClick={startListening}
        disabled={isListening}
        className={`flex items-center justify-center p-3 rounded-lg transition-all duration-200 ${
          isListening
            ? 'bg-red-500 text-white animate-pulse'
            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
        }`}
        title={isListening ? 'Listening...' : 'Click to speak'}
      >
        {isListening ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </button>
      {error && (
        <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-700 px-3 py-1 rounded-md text-sm whitespace-nowrap z-50">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceRecognition;