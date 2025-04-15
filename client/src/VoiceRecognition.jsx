import React, { useState } from 'react';
import { Mic, StopCircle } from 'lucide-react';

/**
 * VoiceRecognition component that allows users to input text using speech
 * @param {Object} props - Component props
 * @param {Function} props.onTranscript - Callback function that receives the transcribed text
 * @param {string} props.className - Optional CSS class name
 * @returns {JSX.Element} The VoiceRecognition component
 */
const VoiceRecognition = ({ onTranscript, className = '' }) => {
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  const startListening = () => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const newRecognition = new SpeechRecognition();

      newRecognition.continuous = true;
      newRecognition.interimResults = true;

      newRecognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');

        if (event.results[0].isFinal) {
          onTranscript(transcript);
          stopListening();
        }
      };

      newRecognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        stopListening();
      };

      newRecognition.start();
      setRecognition(newRecognition);
      setIsListening(true);
    } else {
      console.error('Speech recognition not supported in this browser');
    }
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setRecognition(null);
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <button
      onClick={toggleListening}
      type="button"
      className={`p-3 rounded-lg transition-colors flex items-center justify-center ${
        isListening 
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
      }`}
      title={isListening ? 'Stop recording' : 'Start recording'}
    >
      {isListening ? (
        <StopCircle className="h-5 w-5" />
      ) : (
        <Mic className="h-5 w-5" />
      )}
    </button>
  );
};

export default VoiceRecognition;