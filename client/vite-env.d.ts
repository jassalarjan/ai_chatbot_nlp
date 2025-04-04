/// <reference types="vite/client" />

/**
 * Web Speech API type definitions
 */
interface Window {
  webkitSpeechRecognition: any;
  SpeechRecognition: any;
}

/**
 * SpeechRecognition interface
 */
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  onerror: ((this: SpeechRecognition, ev: Event) => any) | null;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null;
}

/**
 * SpeechRecognitionEvent interface
 */
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

/**
 * SpeechRecognitionResultList interface
 */
interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

/**
 * SpeechRecognitionResult interface
 */
interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

/**
 * SpeechRecognitionAlternative interface
 */
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
} 