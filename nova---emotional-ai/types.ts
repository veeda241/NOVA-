export interface EmotionAnalysis {
  detected_emotion: string;
  confidence: number;
  reasoning: string;
}

export interface NovaResponse {
  response: string;
  analysis: EmotionAnalysis;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  image?: string; // base64
  audio?: boolean; // marker if it was audio input
  emotionAnalysis?: EmotionAnalysis; // Only for model messages or processed user input
}

export type InputMode = 'text' | 'voice' | 'vision';

// List of GoEmotions for visualization context
export const EMOTION_LABELS = [
  "Admiration", "Amusement", "Anger", "Annoyance", "Approval", "Caring",
  "Confusion", "Curiosity", "Desire", "Disappointment", "Disapproval",
  "Disgust", "Embarrassment", "Excitement", "Fear", "Gratitude", "Grief",
  "Joy", "Love", "Nervousness", "Optimism", "Pride", "Realization",
  "Relief", "Remorse", "Sadness", "Surprise", "Neutral"
];

export interface EmotionalProfileItem {
  emotion: string;
  score: number; // 0-100
  color?: string;
}

export interface AnalysisReport {
  timestamp: string;
  patientName: string;
  stressLevel: number; // 0-100
  emotionalProfile: EmotionalProfileItem[];
  rootCauseAnalysis: string;
  longTermStrategy: string;
  inputSummary: string;
  suggestedInterventions: string[];
}

export interface ChatSession {
  id: string;
  timestamp: number;
  preview: string;
  messages: Message[];
}