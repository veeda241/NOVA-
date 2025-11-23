import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Add the parent directory to sys.path to allow absolute imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import tensorflow as tf
import numpy as np
import random
import time

# Import all modules using absolute paths
from emotional_ai_llm.text_encoder import build_cnn_text_encoder, get_cnn_text_embeddings
from emotional_ai_llm.audio_encoder import build_audio_cnn_encoder, get_audio_embeddings_cnn_model
from emotional_ai_llm.vision_encoder import build_mobilenet_vision_encoder, get_vision_embeddings
from emotional_ai_llm.fusion_module import build_fusion_model
from emotional_ai_llm.conversation_memory import ConversationMemory
from emotional_ai_llm.response_planner import ResponsePlanner
from emotional_ai_llm.safety_layer import SafetyLayer
from emotional_ai_llm.output_actions import OutputActions
from emotional_ai_llm.utils import create_text_tokenizer, texts_to_sequences_and_pad, extract_mel_spectrogram

# Define paths to saved models
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'models'))
TEXT_ENCODER_MODEL_PATH = os.path.join(MODELS_DIR, "cnn_text_encoder.keras")
AUDIO_ENCODER_MODEL_PATH = os.path.join(MODELS_DIR, "audio_cnn_encoder.keras")
VISION_ENCODER_MODEL_PATH = os.path.join(MODELS_DIR, "vision_mobilenet_encoder.keras")
FUSION_MODEL_PATH = os.path.join(MODELS_DIR, "fusion_mlp_model.keras")

# Constants (should ideally be imported from individual modules or a config file)
# For simplicity, redefining some key constants here for the orchestration script.
MAX_LEN_TEXT = 128
VOCAB_SIZE_TEXT = 10000 # Max number of words to keep in tokenizer
TEXT_EMBEDDING_DIM = 128

INPUT_SHAPE_AUDIO = (128, 44, 1) # (Mel bands, frames, channels)
AUDIO_EMBEDDING_DIM = 128

IMG_HEIGHT_VISION = 128
IMG_WIDTH_VISION = 128
IMG_CHANNELS_VISION = 3
INPUT_SHAPE_VISION = (IMG_HEIGHT_VISION, IMG_WIDTH_VISION, IMG_CHANNELS_VISION)
VISION_EMBEDDING_DIM = 128

EMBEDDING_DIM_FUSION = TEXT_EMBEDDING_DIM + AUDIO_EMBEDDING_DIM + VISION_EMBEDDING_DIM
EMOTION_LABELS = ["anger", "disgust", "fear", "happy", "sad", "surprise", "neutral"] # Example, actual labels depend on dataset
NUM_EMOTION_LABELS = len(EMOTION_LABELS)

# Global model variables
text_encoder_model, audio_encoder_model, vision_encoder_model, fusion_model = None, None, None, None

def load_all_models():
    """Loads all trained Keras models."""
    logging.info("Loading models...")
    try:
        text_encoder_model = tf.keras.models.load_model(TEXT_ENCODER_MODEL_PATH)
        audio_encoder_model = tf.keras.models.load_model(AUDIO_ENCODER_MODEL_PATH)
        vision_encoder_model = tf.keras.models.load_model(VISION_ENCODER_MODEL_PATH)
        fusion_model = tf.keras.models.load_model(FUSION_MODEL_PATH)
        logging.info("All models loaded successfully.")
        return text_encoder_model, audio_encoder_model, vision_encoder_model, fusion_model
    except Exception as e:
        logging.error(f"Error loading models: {e}")
        sys.exit(1)

def initialize_components():
    """Initializes other AI components."""
    logging.info("Initializing components...")
    memory = ConversationMemory(embedding_dim=EMBEDDING_DIM_FUSION)
    planner = ResponsePlanner(EMOTION_LABELS)
    safety_checker = SafetyLayer()
    output_handler = OutputActions()
    logging.info("Components initialized successfully.")
    return memory, planner, safety_checker, output_handler

def simulate_input_processing(text_input, audio_path=None, image_path=None, text_encoder_model=None, audio_encoder_model=None, vision_encoder_model=None):
    """Simulates multimodal input processing."""
    logging.info(f"Processing user input: '{text_input}'")

    # Text Processing
    dummy_texts = ["dummy text for tokenizer initialization"] # Dummy text to init tokenizer
    text_tokenizer = create_text_tokenizer(dummy_texts, num_words=VOCAB_SIZE_TEXT) 
    
    text_sequence = texts_to_sequences_and_pad(text_tokenizer, [text_input], MAX_LEN_TEXT)
    text_embedding = get_cnn_text_embeddings(text_encoder_model, text_sequence)
    logging.debug(f"Text embedding shape: {text_embedding.shape}")

    # Audio Processing (Placeholder)
    if audio_path and os.path.exists(audio_path):
        mel_spec = extract_mel_spectrogram(audio_path, n_mels=INPUT_SHAPE_AUDIO[0], hop_length=INPUT_SHAPE_AUDIO[1])
        if mel_spec is not None:
            mel_spec = np.expand_dims(mel_spec, axis=0) # Add batch dim
            mel_spec = np.expand_dims(mel_spec, axis=-1) # Add channel dim
            if mel_spec.shape[2] > INPUT_SHAPE_AUDIO[1]:
                mel_spec = tf.image.resize(mel_spec, (INPUT_SHAPE_AUDIO[0], INPUT_SHAPE_AUDIO[1]))
            elif mel_spec.shape[2] < INPUT_SHAPE_AUDIO[1]:
                pad_width = INPUT_SHAPE_AUDIO[1] - mel_spec.shape[2]
                mel_spec = np.pad(mel_spec, ((0,0),(0,0),(0,pad_width),(0,0)), mode='constant')
            audio_embedding = get_audio_embeddings_cnn_model(audio_encoder_model, mel_spec)
        else:
            audio_embedding = np.random.rand(1, AUDIO_EMBEDDING_DIM).astype(np.float32)
    else:
        audio_embedding = np.random.rand(1, AUDIO_EMBEDDING_DIM).astype(np.float32)
    logging.debug(f"Audio embedding shape: {audio_embedding.shape}")

    # Vision Processing (Placeholder)
    if image_path and os.path.exists(image_path):
        image_data = np.random.rand(1, IMG_HEIGHT_VISION, IMG_WIDTH_VISION, IMG_CHANNELS_VISION).astype(np.float32)
        vision_embedding = get_vision_embeddings(vision_encoder_model, image_data)
    else:
        vision_embedding = np.random.rand(1, VISION_EMBEDDING_DIM).astype(np.float32)
    logging.debug(f"Vision embedding shape: {vision_embedding.shape}")
    
    return text_embedding, audio_embedding, vision_embedding

def main_orchestrator():
    """Orchestrates the end-to-end functionality of the emotional AI LLM."""
    global text_encoder_model, audio_encoder_model, vision_encoder_model, fusion_model # Declare global here
    text_encoder_model, audio_encoder_model, vision_encoder_model, fusion_model = load_all_models()
    memory, planner, safety_checker, output_handler = initialize_components()

    logging.info("\n--- Starting Emotional AI Agent Conversation ---")
    print("AI: Hello! How can I help you today?")
    print("Type 'exit' or 'quit' to end the conversation.")

    while True:
        user_input_text = input("You: ")
        if user_input_text.lower() in ["exit", "quit"]:
            logging.info("User ended the conversation.")
            print("AI: Goodbye!")
            break

        logging.info(f"User input: '{user_input_text}'")
        print("AI: Thinking...")

        # 1. Safety Check on User Input
        is_crisis_input, detected_keywords_input = safety_checker.check_for_crisis_language(user_input_text)
        if is_crisis_input:
            logging.warning("Crisis language detected in user input.")
            output_handler.escalate_to_human(reason="Crisis language in user input", text_to_escalate=user_input_text)
            response_text = "I'm here for you. Please hold while I connect you to a human expert."
            output_handler.generate_text_response(response_text)
            output_handler.generate_tts_output(response_text)
            continue # Skip normal processing

        # 2. Simulate Input and Get Embeddings
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
            empathetic_response_text = "I'm here for you. Please hold while I connect you to a human expert."
            logging.info(f"Overridden response due to safety: '{empathetic_response_text}'")

        # 8. Output Actions
        print("AI: ", end="")
        output_handler.generate_text_response(empathetic_response_text)
        output_handler.generate_tts_output(empathetic_response_text)
        output_handler.suggest_actions(emotion_probabilities, EMOTION_LABELS)

        time.sleep(1) # Simulate thinking time

if __name__ == "__main__":
    main_orchestrator()