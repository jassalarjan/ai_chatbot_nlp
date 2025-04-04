import React, { useState, useEffect } from 'react';
import { Mic, MicOff, AlertCircle, WifiOff } from 'lucide-react';

const VoiceRecognition = ({ onTranscript }) => {
    const [isListening, setIsListening] = useState(false);
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(true);
    const [recognition, setRecognition] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const maxRetries = 3;

    useEffect(() => {
        // Check if browser supports speech recognition
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.error('Speech recognition not supported in this browser');
            setIsSupported(false);
            setError('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
            return;
        }

        // Initialize speech recognition
        try {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const recognitionInstance = new SpeechRecognition();
            
            recognitionInstance.continuous = false;
            recognitionInstance.interimResults = false;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onstart = () => {
                setIsListening(true);
                setError(null);
                console.log('Voice recognition started');
            };

            recognitionInstance.onresult = (event) => {
                if (event.results && event.results.length > 0 && event.results[0].length > 0) {
                    const transcript = event.results[0][0].transcript;
                    console.log('Voice transcript:', transcript);
                    onTranscript(transcript);
                    setIsListening(false);
                    setRetryCount(0); // Reset retry count on success
                } else {
                    console.error('No transcript in results');
                    setError('No speech detected. Please try speaking again.');
                    setIsListening(false);
                }
            };

            recognitionInstance.onerror = (event) => {
                console.error('Voice recognition error:', event.error);
                
                // Handle specific error types
                if (event.error === 'network') {
                    setError('Network error: Please check your internet connection and try again.');
                } else if (event.error === 'not-allowed') {
                    setError('Microphone access denied. Please allow microphone access in your browser settings.');
                } else if (event.error === 'no-speech') {
                    setError('No speech detected. Please try speaking again.');
                } else if (event.error === 'audio-capture') {
                    setError('No microphone detected. Please connect a microphone and try again.');
                } else if (event.error === 'service-not-allowed') {
                    setError('Speech recognition service not allowed. Please check your browser settings.');
                } else {
                    setError(`Error: ${event.error}`);
                }
                
                setIsListening(false);
            };

            recognitionInstance.onend = () => {
                console.log('Voice recognition ended');
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        } catch (err) {
            console.error('Failed to initialize speech recognition:', err);
            setError('Failed to initialize speech recognition. Please check your browser settings.');
            setIsSupported(false);
        }

        return () => {
            if (recognition) {
                recognition.stop();
            }
        };
    }, [onTranscript]);

    const toggleListening = () => {
        if (!isSupported) {
            setError('Speech recognition is not supported in your browser.');
            return;
        }

        if (!isListening && recognition) {
            try {
                // Check if we've exceeded retry attempts
                if (retryCount >= maxRetries) {
                    setError('Too many failed attempts. Please try again later or use text input.');
                    return;
                }
                
                // Check network connectivity
                if (!navigator.onLine) {
                    setError('Network error: Please check your internet connection.');
                    return;
                }
                
                setRetryCount(prev => prev + 1);
                recognition.start();
            } catch (err) {
                console.error('Failed to start voice recognition:', err);
                setError('Failed to start voice recognition. Please check your microphone permissions.');
            }
        } else if (isListening && recognition) {
            recognition.stop();
        }
    };

    // Get specific error message based on error type
    const getErrorMessage = () => {
        if (error && error.includes('Network error')) {
            return (
                <div className="mt-2 text-sm text-red-500 flex items-center">
                    <WifiOff size={14} className="mr-1" />
                    <div>
                        <p>Network error: Please check your internet connection.</p>
                        <p className="text-xs mt-1">Try using a different network or disabling VPN if you're using one.</p>
                    </div>
                </div>
            );
        }
        
        return (
            <div className="mt-2 text-sm text-red-500 flex items-center">
                <AlertCircle size={14} className="mr-1" />
                {error}
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center">
            <button
                onClick={toggleListening}
                disabled={!isSupported}
                className={`p-2 rounded-full transition-colors ${
                    isListening 
                        ? 'bg-red-500 hover:bg-red-600 text-white' 
                        : isSupported
                            ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
                title={isListening ? 'Stop listening' : 'Start voice input'}
            >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            {isListening && (
                <div className="mt-2 text-sm text-gray-600 flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-pulse"></div>
                    Listening...
                </div>
            )}
            {error && getErrorMessage()}
            
            {/* Debug information - only visible in development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-500">
                    <p>Browser: {navigator.userAgent}</p>
                    <p>Online: {navigator.onLine ? 'Yes' : 'No'}</p>
                    <p>Speech API: {('webkitSpeechRecognition' in window) ? 'webkitSpeechRecognition' : ('SpeechRecognition' in window) ? 'SpeechRecognition' : 'Not supported'}</p>
                    <p>Microphone: {navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? 'Available' : 'Not available'}</p>
                </div>
            )}
        </div>
    );
};

export default VoiceRecognition; 