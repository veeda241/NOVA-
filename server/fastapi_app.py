import sys
import os
import logging
from contextlib import asynccontextmanager
from typing import Optional, Any, List

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import numpy as np
import base64
import cv2
from io import BytesIO
from PIL import Image

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Add the parent directory to sys.path to allow absolute imports within emotional_ai_llm_web
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Import the main orchestration function and necessary components from the emotional_ai_llm package
from emotional_ai_llm.main import load_all_models, initialize_components, simulate_input_processing, EMOTION_LABELS, MAX_LEN_TEXT, VOCAB_SIZE_TEXT, INPUT_SHAPE_VISION
from emotional_ai_llm.utils import create_text_tokenizer
from emotional_ai_llm.reporter import Reporter
from emotional_ai_llm.nlp_analyzer import TextEmotionAnalyzer # Import NLP Analyzer

# --- Global instances of LLM components (will be initialized in lifespan event) ---
text_encoder_model = None
audio_encoder_model = None
vision_encoder_model = None
fusion_model = None
memory = None
planner = None
safety_checker = None
output_handler = None
text_tokenizer = None
reporter = None
nlp_analyzer = None # Global NLP analyzer

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Load the ML model when the app starts and clean up resources when the app stops.
    """
    global text_encoder_model, audio_encoder_model, vision_encoder_model, fusion_model
    global memory, planner, safety_checker, output_handler, text_tokenizer, reporter, nlp_analyzer

    logging.info("Starting to load LLM components for FastAPI app...")
    
    # Load all models and initialize AI components
    text_encoder_model, audio_encoder_model, vision_encoder_model, fusion_model = load_all_models()
    memory, planner, safety_checker, output_handler = initialize_components()

    # Initialize tokenizer once globally
    dummy_texts = ["dummy text for tokenizer initialization"]
    text_tokenizer = create_text_tokenizer(dummy_texts, num_words=VOCAB_SIZE_TEXT)
    
    reporter = Reporter()
    nlp_analyzer = TextEmotionAnalyzer() # Initialize NLP analyzer
    logging.info("LLM components loaded and initialized for FastAPI app.")
    
    yield # Application runs
    
    # Clean up resources (if any)
    logging.info("Shutting down FastAPI app.")

app = FastAPI(lifespan=lifespan)

# --- CORS Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Adjust this to your frontend's origin in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Request Models ---
class ChatRequest(BaseModel):
    text: str
    emotion: str = "neutral"
    image: Optional[str] = None # Base64 encoded image

class AnalysisData(BaseModel):
    moodScore: float
    emotionalBreakdown: List[dict]
    userFacialEmotion: str
    overallSummary: dict
    insights: List[dict]

class ChatResponse(BaseModel):
    response: str
    safe: bool
    dominant_emotions: str
    suggested_actions: List[str]
    analysisData: AnalysisData

# --- Endpoints ---

@app.post("/chat", response_model=ChatResponse)
async def chat(request_data: ChatRequest):
    user_input_text = request_data.text
    user_facial_emotion = request_data.emotion
    image_base64 = request_data.image

    interaction_data = {
        "user_input": user_input_text,
        "user_facial_emotion": user_facial_emotion,
        "ai_response": "",
        "dominant_emotions": "",
        "suggested_actions": [],
        "safety_flag_user_input": False,
        "safety_flag_ai_response": False,
        "crisis_keywords_user": [],
        "crisis_keywords_ai": []
    }

    if not user_input_text:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No text input provided")

    logging.info(f"Received chat request: '{user_input_text}', Facial Emotion: '{user_facial_emotion}'")

    image_input_processed = None
    if image_base64:
        try:
            if "base64," in image_base64:
                _, image_base64 = image_base64.split("base64,", 1)
            
            image_bytes = base64.b64decode(image_base64)
            image_array = np.array(Image.open(BytesIO(image_bytes)))
            
            if image_array.ndim == 3 and image_array.shape[2] == 4:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_RGBA2RGB)
            elif image_array.ndim == 2:
                image_array = cv2.cvtColor(image_array, cv2.COLOR_GRAY2RGB)
            
            target_height, target_width, _ = INPUT_SHAPE_VISION
            image_input_processed = cv2.resize(image_array, (target_width, target_height))
            image_input_processed = image_input_processed.astype(np.float32) / 255.0
            
            logging.info("Image data successfully decoded and preprocessed.")
        except Exception as e:
            logging.error(f"Error decoding or processing image: {e}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Error processing image: {e}")

    is_crisis_input, detected_keywords_input = safety_checker.check_for_crisis_language(user_input_text)
    if is_crisis_input:
        logging.warning("Crisis language detected in user input.")
        output_handler.escalate_to_human(reason="Crisis language in user input", text_to_escalate=user_input_text)
        response_text = "I'm here for you. Please hold while I connect you to a human expert."
        interaction_data["ai_response"] = response_text
        interaction_data["safety_flag_user_input"] = True
        interaction_data["crisis_keywords_user"] = detected_keywords_input
        reporter.log_interaction(interaction_data)
        return ChatResponse(
            response=response_text,
            safe=False,
            dominant_emotions="crisis",
            suggested_actions=["Human escalation triggered"],
            analysisData=AnalysisData(
                moodScore=0, emotionalBreakdown=[], userFacialEmotion=user_facial_emotion,
                overallSummary={"status": "Crisis", "trend": "N/A", "recommendation": response_text},
                insights=[{"title": "Safety Alert", "description": "Crisis language detected."}]
            )
        )

    text_emb, audio_emb, vision_emb = simulate_input_processing(
        user_input_text, 
        text_encoder_model=text_encoder_model, 
        audio_encoder_model=audio_encoder_model, 
        vision_encoder_model=vision_encoder_model,
        image_data=image_input_processed
    )
    logging.debug("Multimodal embeddings generated.")

    fused_embedding_input = {
        "text_embedding_input": text_emb,
        "audio_embedding_input": audio_emb,
        "vision_embedding_input": vision_emb
    }
    fused_output_raw = fusion_model.predict(fused_embedding_input)
    
    emotion_probabilities = fused_output_raw[0] if isinstance(fused_output_raw, list) else fused_output_raw[0]
    logging.debug(f"Fused emotion probabilities (original): {emotion_probabilities}")

    # --- NLP Sentiment Integration ---
    if nlp_analyzer:
        nlp_probs = nlp_analyzer.get_emotion_probabilities(user_input_text)
        if nlp_probs:
            logging.info(f"NLP emotion probabilities: {nlp_probs}")
            # Blend NLP probabilities with Fusion probabilities
            # Assuming Fusion probs order matches EMOTION_LABELS: ["anger", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
            
            for i, label in enumerate(EMOTION_LABELS):
                if label in nlp_probs:
                    # Weighted average: 
                    # If audio/vision is missing (text-only), trust NLP 100% to avoid fusion noise.
                    # Otherwise, blend 50/50.
                    
                    if not image_base64: 
                        weight_nlp = 1.0
                    else:
                        weight_nlp = 0.5
                        
                    nlp_score = nlp_probs[label]
                    fusion_score = emotion_probabilities[i]
                    
                    emotion_probabilities[i] = (nlp_score * weight_nlp) + (fusion_score * (1 - weight_nlp))
            
            # Re-normalize probabilities to sum to 1 (optional but good practice)
            total_prob = np.sum(emotion_probabilities)
            if total_prob > 0:
                emotion_probabilities = emotion_probabilities / total_prob
            
            logging.debug(f"Fused emotion probabilities (blended with NLP): {emotion_probabilities}")
    # ---------------------------------

    current_turn_embedding = np.concatenate([text_emb.flatten(), audio_emb.flatten(), vision_emb.flatten()])
    memory.add_context(current_turn_embedding)
    logging.debug("Current turn embedding added to memory.")

    weighted_context_vector = memory.get_weighted_context()
    logging.debug(f"Recency-weighted context vector shape: {weighted_context_vector.shape}")

    empathetic_response_text = planner.generate_empathetic_response(
        user_input_text=user_input_text,
        current_emotion_probabilities=emotion_probabilities,
        conversation_context_vector=weighted_context_vector,
        user_facial_emotion=user_facial_emotion
    )
    logging.info(f"Generated empathetic response: '{empathetic_response_text}'")

    is_crisis_output, detected_keywords_output = safety_checker.check_for_crisis_language(empathetic_response_text)
    if is_crisis_output:
        logging.warning("Crisis language detected in AI's generated response.")
        output_handler.escalate_to_human(reason="Crisis language in generated response", text_to_escalate=empathetic_response_text)
        empathetic_response_text = "I'm processing that. My apologies if anything I said was unhelpful. Let me connect you with a human expert."
        logging.info(f"Overridden response due to safety: '{empathetic_response_text}'")
        interaction_data["safety_flag_ai_response"] = True
        interaction_data["crisis_keywords_ai"] = detected_keywords_output

    dominant_emotions_str = planner._get_dominant_emotions(emotion_probabilities)
    first_dominant_emotion = dominant_emotions_str.split(', ')[0].lower() if dominant_emotions_str else "neutral"
    suggested_actions_list = output_handler.action_suggestions.get(first_dominant_emotion, output_handler.action_suggestions["neutral"])

    interaction_data["ai_response"] = empathetic_response_text
    interaction_data["dominant_emotions"] = dominant_emotions_str
    interaction_data["suggested_actions"] = suggested_actions_list
    reporter.log_interaction(interaction_data)

    # Prepare analysis data for response
    emotional_breakdown_list = [
        {"emotion": EMOTION_LABELS[i], "value": int(prob * 100), "color": "bg-primary" if prob > 0.5 else "bg-accent"}
        for i, prob in enumerate(emotion_probabilities)
    ]
    overall_summary_status = "Positive" if "positive" in dominant_emotions_str.lower() else ("Negative" if "negative" in dominant_emotions_str.lower() else "Neutral")
    
    analysis_data_response = AnalysisData(
        moodScore=7.5, # Placeholder, needs proper scoring
        emotionalBreakdown=emotional_breakdown_list,
        userFacialEmotion=user_facial_emotion,
        overallSummary={"status": overall_summary_status, "trend": "Stable", "recommendation": empathetic_response_text},
        insights=[
            {"title": "Key Emotions", "description": f"The dominant emotions detected were: {dominant_emotions_str}."},
            {"title": "AI Recommendation", "description": empathetic_response_text},
            {"title": "Suggested Next Steps", "description": ", ".join(suggested_actions_list)}
        ]
    )

    return ChatResponse(
        response=empathetic_response_text,
        safe=not is_crisis_output,
        dominant_emotions=dominant_emotions_str,
        suggested_actions=suggested_actions_list,
        analysisData=analysis_data_response
    )

@app.get("/reports")
async def get_reports():
    logs = reporter.get_all_logs()
    logging.info(f"Retrieved {len(logs)} interaction logs.")
    return logs

@app.get("/")
async def read_root():
    return {"message": "Emotional AI LLM FastAPI Backend is running."}

