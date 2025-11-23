# emotional_ai_llm_web/app.py

import sys
import os
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Configure logging for the Flask app
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Add the parent directory (emotional_ai_llm_web) to sys.path to allow absolute imports within it
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

# Import the main orchestration function and necessary components from the emotional_ai_llm package
from emotional_ai_llm.main import load_all_models, initialize_components, simulate_input_processing, EMOTION_LABELS, MAX_LEN_TEXT, VOCAB_SIZE_TEXT
from emotional_ai_llm.utils import create_text_tokenizer
from emotional_ai_llm.reporter import Reporter # Import Reporter

app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Global instances of LLM components
text_encoder_model = None
audio_encoder_model = None
vision_encoder_model = None
fusion_model = None
memory = None
planner = None
safety_checker = None
output_handler = None
text_tokenizer = None # Global tokenizer instance
reporter = None # Global reporter instance

def load_llm_components():
    """Loads all models and initializes AI components globally."""
    global text_encoder_model, audio_encoder_model, vision_encoder_model, fusion_model
    global memory, planner, safety_checker, output_handler, text_tokenizer, reporter

    logging.info("Starting to load LLM components for Flask app...")
    text_encoder_model, audio_encoder_model, vision_encoder_model, fusion_model = load_all_models()
    memory, planner, safety_checker, output_handler = initialize_components()

    # Initialize tokenizer once globally
    dummy_texts = ["dummy text for tokenizer initialization"]
    text_tokenizer = create_text_tokenizer(dummy_texts, num_words=VOCAB_SIZE_TEXT)
    
    reporter = Reporter() # Initialize Reporter
    logging.info("LLM components loaded and initialized for Flask app.")

# Pre-load components when Flask app starts
with app.app_context():
    load_llm_components()

@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_input_text = data.get('text')
    # audio_input = data.get('audio') # Not implemented yet
    # image_input = data.get('image') # Not implemented yet

    interaction_data = {
        "user_input": user_input_text,
        "ai_response": "",
        "dominant_emotions": "",
        "suggested_actions": [],
        "safety_flag_user_input": False,
        "safety_flag_ai_response": False,
        "crisis_keywords_user": [],
        "crisis_keywords_ai": []
    }

    if not user_input_text:
        return jsonify({"error": "No text input provided"}), 400

    logging.info(f"Received chat request: '{user_input_text}'")

    # 1. Safety Check on User Input
    is_crisis_input, detected_keywords_input = safety_checker.check_for_crisis_language(user_input_text)
    if is_crisis_input:
        logging.warning("Crisis language detected in user input.")
        output_handler.escalate_to_human(reason="Crisis language in user input", text_to_escalate=user_input_text)
        response_text = "I'm here for you. Please hold while I connect you to a human expert."
        interaction_data["ai_response"] = response_text
        interaction_data["safety_flag_user_input"] = True
        interaction_data["crisis_keywords_user"] = detected_keywords_input
        reporter.log_interaction(interaction_data)
        return jsonify({"response": response_text, "safe": False, "suggested_actions": ["Human escalation triggered"]})

    # 2. Simulate Input and Get Embeddings
    # For now, audio_path and image_path are None, so dummy embeddings will be generated
    text_emb, audio_emb, vision_emb = simulate_input_processing(
        user_input_text, 
        text_encoder_model=text_encoder_model, 
        audio_encoder_model=audio_encoder_model, 
        vision_encoder_model=vision_encoder_model
    )
    logging.debug("Multimodal embeddings generated.")

    # 3. Fuse Embeddings
    fused_embedding_input = {
        "text_embedding_input": text_emb,
        "audio_embedding_input": audio_emb,
        "vision_embedding_input": vision_emb
    }
    fused_output_raw = fusion_model.predict(fused_embedding_input)
    
    emotion_probabilities = fused_output_raw[0] if isinstance(fused_output_raw, list) else fused_output_raw[0]
    logging.debug(f"Fused emotion probabilities: {emotion_probabilities}")

    # 4. Store Fused Embedding in Conversation Memory
    current_turn_embedding = np.concatenate([text_emb.flatten(), audio_emb.flatten(), vision_emb.flatten()])
    memory.add_context(current_turn_embedding)
    logging.debug("Current turn embedding added to memory.")

    # 5. Get Recency-Weighted Context from Memory
    weighted_context_vector = memory.get_weighted_context()
    logging.debug(f"Recency-weighted context vector shape: {weighted_context_vector.shape}")

    # 6. Generate Empathetic Response
    empathetic_response_text = planner.generate_empathetic_response(
        current_emotion_probabilities=emotion_probabilities,
        conversation_context_vector=weighted_context_vector
    )
    logging.info(f"Generated empathetic response: '{empathetic_response_text}'")

    # 7. Safety Check on Generated Response
    is_crisis_output, detected_keywords_output = safety_checker.check_for_crisis_language(empathetic_response_text)
    if is_crisis_output:
        logging.warning("Crisis language detected in AI's generated response.")
        output_handler.escalate_to_human(reason="Crisis language in generated response", text_to_escalate=empathetic_response_text)
        empathetic_response_text = "I'm processing that. My apologies if anything I said was unhelpful. Let me connect you with a human expert."
        logging.info(f"Overridden response due to safety: '{empathetic_response_text}'")
        interaction_data["safety_flag_ai_response"] = True
        interaction_data["crisis_keywords_ai"] = detected_keywords_output

    # 8. Get Suggested Actions
    dominant_emotions_str = planner._get_dominant_emotions(emotion_probabilities)
    # Ensure consistent handling of dominant_emotions_str for action suggestions
    # Split by ', ' and take the first one, then convert to lower for dictionary lookup
    first_dominant_emotion = dominant_emotions_str.split(', ')[0].lower() if dominant_emotions_str else "neutral"
    suggested_actions_list = output_handler.action_suggestions.get(first_dominant_emotion, output_handler.action_suggestions["neutral"])

    interaction_data["ai_response"] = empathetic_response_text
    interaction_data["dominant_emotions"] = dominant_emotions_str
    interaction_data["suggested_actions"] = suggested_actions_list
    reporter.log_interaction(interaction_data)

    return jsonify({
        "response": empathetic_response_text,
        "safe": not is_crisis_output,
        "dominant_emotions": dominant_emotions_str,
        "suggested_actions": suggested_actions_list
    })

@app.route('/reports', methods=['GET'])
def get_reports():
    """API endpoint to retrieve all interaction logs."""
    logs = reporter.get_all_logs()
    logging.info(f"Retrieved {len(logs)} interaction logs.")
    return jsonify(logs)

@app.route('/')
def index():
    return "Emotional AI LLM Backend is running."

if __name__ == '__main__':
    # When running directly, load components
    app.run(debug=True, port=5000)