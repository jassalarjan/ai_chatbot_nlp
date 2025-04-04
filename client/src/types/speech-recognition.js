/**
 * @typedef {Object} SpeechRecognitionEvent
 * @property {Array} results - The recognition results
 */

/**
 * @typedef {Object} SpeechRecognition
 * @property {boolean} continuous - Whether recognition is continuous
 * @property {boolean} interimResults - Whether to return interim results
 * @property {string} lang - The language to use for recognition
 * @property {Function} start - Start recognition
 * @property {Function} stop - Stop recognition
 * @property {Function} onstart - Called when recognition starts
 * @property {Function} onresult - Called when results are available
 * @property {Function} onerror - Called when an error occurs
 * @property {Function} onend - Called when recognition ends
 */

/**
 * Extends the Window interface to include Web Speech API
 * @typedef {Object} Window
 * @property {typeof SpeechRecognition} webkitSpeechRecognition - WebKit Speech Recognition API
 * @property {typeof SpeechRecognition} SpeechRecognition - Standard Speech Recognition API
 */

// This file is used for JSDoc type definitions only
// It doesn't export anything and is only used for documentation 