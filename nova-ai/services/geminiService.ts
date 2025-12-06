import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisReport, EmotionMetric } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    primaryEmotion: { type: Type.STRING, description: "The dominant emotion detected." },
    stressLevel: { type: Type.INTEGER, description: "Estimated stress level from 0 to 100." },
    emotionalProfile: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          emotion: { type: Type.STRING },
          score: { type: Type.INTEGER },
          color: { type: Type.STRING, description: "Hex code color suggestion for this emotion." }
        },
        required: ["emotion", "score", "color"]
      }
    },
    rootCauseAnalysis: { type: Type.STRING, description: "A paragraph analyzing why the patient feels this way based on the chat." },
    suggestedInterventions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of immediate actionable steps."
    },
    longTermStrategy: { type: Type.STRING, description: "Strategic plan for long-term improvement." },
    inputSummary: { type: Type.STRING, description: "Brief summary of the patient's situation." }
  },
  required: ["primaryEmotion", "stressLevel", "emotionalProfile", "rootCauseAnalysis", "suggestedInterventions", "longTermStrategy", "inputSummary"]
};

export const createChatSession = () => {
  return ai.chats.create({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: "You are NOVA, a compassionate, professional, and empathetic AI mental health companion. Your goal is to provide emotional support, active listening, and grounding techniques to students and staff. Help the user feel heard and validated. Be concise but warm. Do not act as a doctor or give medical prescriptions. Focus on psychological well-being and stability.",
    }
  });
};

export const analyzePatientEmotion = async (
  textInput: string,
  patientName: string
): Promise<AnalysisReport> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following conversation transcript between NOVA (AI) and a user. 
      Think deeply about the underlying psychological factors and provide a professional clinical report.
      
      Patient Name: ${patientName}
      Transcript: "${textInput}"
      
      Provide a structured JSON output containing emotional metrics, root cause analysis, and specific interventions.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        thinkingConfig: {
          thinkingBudget: 1024 
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    // Transform API result into internal type
    const report: AnalysisReport = {
      id: crypto.randomUUID(),
      patientName,
      timestamp: new Date().toISOString(),
      inputSummary: result.inputSummary || "No summary provided.",
      emotionalProfile: result.emotionalProfile || [],
      primaryEmotion: result.primaryEmotion || "Neutral",
      stressLevel: result.stressLevel || 0,
      rootCauseAnalysis: result.rootCauseAnalysis || "Analysis failed.",
      suggestedInterventions: result.suggestedInterventions || [],
      longTermStrategy: result.longTermStrategy || "No strategy available.",
    };

    return report;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze patient emotions. Please try again.");
  }
};