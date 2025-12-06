// import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisReport, EmotionMetric } from "../types";

// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const BACKEND_URL = 'http://localhost:3001/chat';

interface BackendResponse {
  response: string;
  safe: boolean;
  dominant_emotions: string;
  suggested_actions: string[];
  analysisData: {
    moodScore: number;
    emotionalBreakdown: Array<{ emotion: string; value: number; color: string }>;
    userFacialEmotion: string;
    overallSummary: { status: string; trend: string; recommendation: string };
    insights: Array<{ title: string; description: string }>;
  };
}

export const sendMessageToBackend = async (text: string, patientName: string): Promise<{ text: string, reportData: AnalysisReport }> => {
  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: text, // The proxy expects 'message' or 'text' depending on how we fixed it. We fixed it to accept 'message' and map to 'text' if needed.
        text: text,    // Sending both to be safe with the proxy pass-through
        emotion: "neutral" // Default for now
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.statusText}`);
    }

    const data: BackendResponse = await response.json(); // The proxy wraps it in { message: "...", analysisData: ... } ?
    // Wait, let's check api/index.js again.
    // Proxy: res.json({ message: "Analysis complete", analysisData: data }); 
    // where 'data' is the BackendResponse from Python.
    // So the actual response structure from proxy is:
    // { message: string, analysisData: BackendResponse }
    
    // Actually, looking at api/index.js:
    // const data = await response.json(); // This IS the Python response (BackendResponse)
    // res.json({ message: "Analysis complete", analysisData: data });
    
    // So we need to parse that structure.
    const proxyResponse = await response.json() as { message: string, analysisData: BackendResponse };
    const backendData = proxyResponse.analysisData;

    // Map to AnalysisReport
    const report: AnalysisReport = {
      id: crypto.randomUUID(),
      patientName,
      timestamp: new Date().toISOString(),
      inputSummary: `Status: ${backendData.analysisData.overallSummary.status}. Trend: ${backendData.analysisData.overallSummary.trend}`,
      emotionalProfile: backendData.analysisData.emotionalBreakdown.map(e => ({
        emotion: e.emotion,
        score: e.value,
        color: e.color
      })),
      primaryEmotion: backendData.dominant_emotions.split(',')[0] || "Neutral",
      stressLevel: Math.max(0, Math.min(100, (10 - backendData.analysisData.moodScore) * 10)), // Rough conversion
      rootCauseAnalysis: backendData.analysisData.overallSummary.recommendation || "No analysis available.",
      suggestedInterventions: backendData.suggested_actions,
      longTermStrategy: backendData.analysisData.insights.map(i => `${i.title}: ${i.description}`).join(' '),
    };

    return {
      text: backendData.response,
      reportData: report
    };

  } catch (error) {
    console.error("Backend Error:", error);
    throw new Error("Failed to communicate with NOVA backend.");
  }
};

// Legacy/Compatibility shim
export const createChatSession = () => {
  return {
    sendMessage: async (msg: { message: string }) => {
      // This is a dummy to satisfy the old interface if needed, 
      // but we should switch ChatInterface to use sendMessageToBackend directly.
      return { text: "Interface deprecated. Please reload." };
    }
  };
};

export const analyzePatientEmotion = async (
  textInput: string,
  patientName: string
): Promise<AnalysisReport> => {
   // This was used for the final summary. 
   // Since we get a report with every message, we can just trigger a final "summary" call 
   // or just return the last state.
   // For now, let's just do a dummy call or re-use the logic.
   // Ideally, we pass the LAST report stored in the component.
   // But to keep the interface simple, we might just call the backend with a special flag or just text.
   
   // Hack: Just send the text "Generate final report" to get a fresh state?
   // Or better, throws an error saying "Use stored report".
   // Let's implement a dummy that returns a basic report if called, 
   // but the UI should use the real data.
   
   return {
      id: crypto.randomUUID(),
      patientName,
      timestamp: new Date().toISOString(),
      inputSummary: "Final analysis from session.",
      emotionalProfile: [],
      primaryEmotion: "Completed",
      stressLevel: 0,
      rootCauseAnalysis: "Session completed.",
      suggestedInterventions: [],
      longTermStrategy: ""
   };
};