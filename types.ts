export enum UserRole {
  STUDENT = 'Student',
  STAFF = 'Staff',
  ADMIN = 'Administrator'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  email?: string;
  phone?: string;
  location?: string;
  department?: string;
  year?: string;
  advisor?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface EmotionMetric {
  emotion: string;
  score: number; // 0-100
  color: string;
}

export interface AnalysisReport {
  id: string;
  patientName: string;
  timestamp: string;
  inputSummary: string;
  emotionalProfile: EmotionMetric[];
  primaryEmotion: string;
  stressLevel: number; // 0-100
  rootCauseAnalysis: string;
  suggestedInterventions: string[];
  longTermStrategy: string;
  aiThinkingProcess?: string; // Simulated or actual rationale
}

export interface AppState {
  currentUser: User | null;
  reports: AnalysisReport[];
  currentReport: AnalysisReport | null;
}