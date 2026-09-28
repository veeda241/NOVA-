# emotional_ai_llm/config.py
"""
Central configuration shared across the Emotional AI package.
Keeps constants in one place so modules stay in sync.
"""

import os

# --- Paths ---
PACKAGE_DIR = os.path.abspath(os.path.dirname(__file__))
SERVER_DIR = os.path.abspath(os.path.join(PACKAGE_DIR, ".."))
MODELS_DIR = os.path.join(SERVER_DIR, "models")

TEXT_ENCODER_MODEL_PATH = os.path.join(MODELS_DIR, "cnn_text_encoder.keras")
AUDIO_ENCODER_MODEL_PATH = os.path.join(MODELS_DIR, "audio_cnn_encoder.keras")
VISION_ENCODER_MODEL_PATH = os.path.join(MODELS_DIR, "vision_mobilenet_encoder.keras")
FUSION_MODEL_PATH = os.path.join(MODELS_DIR, "fusion_mlp_model.keras")

# --- Emotion labels (canonical order used everywhere) ---
EMOTION_LABELS = ["anger", "disgust", "fear", "happy", "sad", "surprise", "neutral"]
NUM_EMOTION_LABELS = len(EMOTION_LABELS)

# --- Text input (legacy Keras encoders; optional) ---
MAX_LEN_TEXT = 128
VOCAB_SIZE_TEXT = 10000
TEXT_EMBEDDING_DIM = 128

# --- Audio input (legacy Keras encoders; optional) ---
INPUT_SHAPE_AUDIO = (128, 44, 1)
AUDIO_EMBEDDING_DIM = 128

# --- Vision input (legacy Keras encoders; optional) ---
IMG_HEIGHT_VISION = 128
IMG_WIDTH_VISION = 128
IMG_CHANNELS_VISION = 3
INPUT_SHAPE_VISION = (IMG_HEIGHT_VISION, IMG_WIDTH_VISION, IMG_CHANNELS_VISION)
VISION_EMBEDDING_DIM = 128

EMBEDDING_DIM_FUSION = TEXT_EMBEDDING_DIM + AUDIO_EMBEDDING_DIM + VISION_EMBEDDING_DIM

# --- LLM provider ---
#   "auto"   -> Ollama if reachable, else Groq API (cloud fallback)
#   "ollama" -> force local Ollama (default for local dev)
#   "groq"   -> force Groq API (used on Render deploy)
LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "auto")

# Local provider (Unsloth weights served via Ollama)
OLLAMA_HOST = os.environ.get("OLLAMA_HOST", "http://localhost:11434")
NOVA_LLM_MODEL = os.environ.get("NOVA_LLM_MODEL", "nova-llama3.2-3b")

# Cloud provider (Groq) — hosted Llama. Free API key: https://console.groq.com/keys
# Groq decommissioned the Llama-3.2 3B models; 3.1-8B-instant is the closest current one.
GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.1-8b-instant")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# --- Emotion modality toggles (for RAM-constrained deploys) ---
ENABLE_TEXT_EMOTION = os.environ.get("ENABLE_TEXT_EMOTION", "true").lower() == "true"
ENABLE_VISION_EMOTION = os.environ.get("ENABLE_VISION_EMOTION", "true").lower() == "true"
ENABLE_AUDIO_EMOTION = os.environ.get("ENABLE_AUDIO_EMOTION", "true").lower() == "true"

# --- Pretrained emotion models (Hugging Face) ---
TEXT_EMOTION_MODEL = "j-hartmann/emotion-english-distilroberta-base"
FACIAL_EMOTION_MODEL = "trpakov/vit-face-expression"
SPEECH_EMOTION_MODEL = "superb/wav2vec2-base-superb-er"
