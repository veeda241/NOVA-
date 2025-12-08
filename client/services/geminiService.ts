import { GoogleGenAI, Type } from "@google/genai";
import { NovaResponse, AnalysisReport, Message } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });
// If env var exists, append /chat, otherwise use default local endpoint
const LOCAL_API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/chat` : "http://localhost:8001/chat";

const MODEL_NAME = "gemini-2.5-flash";

const SYSTEM_INSTRUCTION = `
You are NOVA, a highly advanced Emotional AI. 
You have been trained on the following datasets to specialize in human empathy and emotion detection:
1. **EmpatheticDialogues**: You use this to form your conversational style. You must always be supportive, kind, and an active listener.
2. **GoEmotions**: You use this to analyze the user's text and detect fine-grained emotions.
3. **FER2013/RAVDESS**: You use these principles to analyze visual expressions and voice tone when provided with images or audio.

**Your Goal:**
Receive input from the user (text, image, or audio).
Analyze the input to determine the user's emotional state.
Reply with a deeply empathetic response that validates the user's feelings.

**Response Format:**
You must return a JSON object with the following schema:
- detected_emotion (string): The primary emotion detected (e.g., Joy, Sadness, Anger, Anxiety, Neutral).
- confidence (number): A value between 0 and 1 indicating how sure you are of this emotion.
- reasoning (string): A brief internal thought explaining why you detected this emotion (e.g., "User's facial expression shows frowning and text indicates loss").
- response (string): Your actual conversational reply to the user.
`;

const ANALYSIS_SYSTEM_INSTRUCTION = `
You are NOVA's Analytical Engine (SLM - Specialized Language Model).
Your goal is to digest a conversation history between a user and the NOVA Emotional AI and produce a comprehensive psychological assessment report.

**Output Format:**
Return a JSON object matching the AnalysisReport schema:
- timestamp (string): ISO date string.
- patientName (string): Inferred name or "Subject".
- stressLevel (number): 0-100 calculated stress level based on the conversation.
- emotionalProfile (array): List of objects { emotion: string, score: number (0-100), color: string (hex) }. Include top 5 emotions.
- rootCauseAnalysis (string): A detailed paragraph analyzing the underlying causes of the user's state.
- longTermStrategy (string): A strategic plan for emotional improvement.
- inputSummary (string): A concise summary of the user's key inputs/concerns.
- suggestedInterventions (string[]): A list of 3-5 actionable steps for the user.
`;

export const generateAnalysisReport = async (messages: Message[]): Promise<AnalysisReport> => {
    if (!apiKey) throw new Error("API Key is missing");

    // Filter out initial welcome message and only keep relevant content
    const conversationText = messages
        .filter(m => m.id !== 'welcome')
        .map(m => `${m.role.toUpperCase()}: ${m.text} ${m.emotionAnalysis ? `[Emotion: ${m.emotionAnalysis.detected_emotion}]` : ''}`)
        .join('\n');

    const prompt = `Please analyze the following conversation history and generate a detailed psychological report:\n\n${conversationText}`;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: {
                role: 'user',
                parts: [{ text: prompt }]
            },
            config: {
                systemInstruction: ANALYSIS_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        timestamp: { type: Type.STRING },
                        patientName: { type: Type.STRING },
                        stressLevel: { type: Type.NUMBER },
                        emotionalProfile: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    emotion: { type: Type.STRING },
                                    score: { type: Type.NUMBER },
                                    color: { type: Type.STRING }
                                }
                            }
                        },
                        rootCauseAnalysis: { type: Type.STRING },
                        longTermStrategy: { type: Type.STRING },
                        inputSummary: { type: Type.STRING },
                        suggestedInterventions: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["timestamp", "patientName", "stressLevel", "emotionalProfile", "rootCauseAnalysis", "longTermStrategy", "inputSummary", "suggestedInterventions"]
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No analysis generated");
        return JSON.parse(text) as AnalysisReport;

    } catch (error) {
        console.error("Analysis Generation Error:", error);
        throw error;
    }
};

// Interaction with Local Python Backend (Multimodal Fusion)
export const sendMessageToLocalNova = async (
    text: string,
    imageBase64?: string,
    audioBase64?: string // Currently backend might not handle raw audio base64 directly in the chat endpoint payload same way, but let's assume text/vision first
): Promise<NovaResponse> => {
    try {
        const payload: any = {
            text: text,
            emotion: "neutral", // Client-side initial guess or placeholder
            image: imageBase64, // Send base64 directly
            audio: audioBase64  // Send base64 audio
        };
        
        // Note: The Python backend now accepts an 'audio' field in ChatRequest.
        
        const response = await fetch(LOCAL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`Local Backend Error: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Map Python backend response to NovaResponse
        return {
            response: data.response,
            analysis: {
                detected_emotion: data.dominant_emotions || "Neutral",
                confidence: 0.85, // Mock confidence as backend returns dominant string
                reasoning: data.suggested_actions ? data.suggested_actions.join(". ") : "Based on multimodal fusion analysis."
            }
        };

    } catch (error) {
        console.warn("Local Nova Backend unavailable, falling back to Cloud Gemini...", error);
        return sendMessageToNova(text, imageBase64, audioBase64);
    }
};

export const sendMessageToNova = async (
  text: string, 
  imageBase64?: string,
  audioBase64?: string
): Promise<NovaResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing");
  }

  try {
    const parts: any[] = [];

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: "image/jpeg",
          data: imageBase64
        }
      });
    }

    if (audioBase64) {
      parts.push({
        inlineData: {
          mimeType: "audio/wav", 
          data: audioBase64
        }
      });
    }

    // Always add the text prompt, even if empty, to guide the model if only media is sent
    parts.push({
      text: text || (imageBase64 ? "Analyze this image for emotion." : "Analyze this audio for emotion.")
    });

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        role: 'user',
        parts: parts
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            detected_emotion: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            response: { type: Type.STRING },
          },
          required: ["detected_emotion", "confidence", "reasoning", "response"],
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response from NOVA");
    }

    const jsonResponse = JSON.parse(responseText) as NovaResponse;
    return jsonResponse;

  } catch (error) {
    console.error("NOVA Error:", error);
    // Fallback error response
    return {
      response: "I'm having trouble connecting to my emotional processing centers right now. Can we try again?",
      analysis: {
        detected_emotion: "Confusion",
        confidence: 0,
        reasoning: "System Error"
      }
    };
  }
};