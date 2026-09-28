# emotional_ai_llm/main.py
"""
CLI orchestrator for the Emotional AI Agent.

The original version loaded four custom TensorFlow/Keras encoders. Those are
replaced by pretrained Hugging Face emotion models plus the local Unsloth LLM
served via Ollama (see fastapi_app.py for the HTTP API version of this flow).
"""

import sys
import os
import logging
import time

import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from emotional_ai_llm.config import EMOTION_LABELS
from emotional_ai_llm.emotion_detectors import get_detector
from emotional_ai_llm.response_planner import ResponsePlanner
from emotional_ai_llm.safety_layer import SafetyLayer
from emotional_ai_llm.output_actions import OutputActions
from emotional_ai_llm.llm_engine import get_llm_engine

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')


def initialize_components():
    """Initializes all AI components."""
    logging.info("Initializing components...")
    engine = get_llm_engine()
    if engine.is_available(force_check=True):
        logging.info(f"LLM available via {engine.provider}: {engine.model}")
    else:
        logging.warning("Ollama not reachable — responses will use the fallback text.")
    detector = get_detector()
    planner = ResponsePlanner(EMOTION_LABELS)
    safety_checker = SafetyLayer()
    output_handler = OutputActions()
    logging.info("Components initialized successfully.")
    return detector, planner, safety_checker, output_handler


def main_orchestrator():
    """End-to-end CLI conversation loop."""
    detector, planner, safety_checker, output_handler = initialize_components()

    logging.info("\n--- Starting Emotional AI Agent Conversation ---")
    print("NOVA: Hello! I'm here to listen. How can I help you today?")
    print("Type 'exit' or 'quit' to end the conversation.")

    history = []

    while True:
        user_input_text = input("You: ").strip()
        if user_input_text.lower() in ["exit", "quit"]:
            logging.info("User ended the conversation.")
            print("NOVA: Goodbye! Take care of yourself.")
            break
        if not user_input_text:
            continue

        # 1. Safety check
        is_crisis, keywords = safety_checker.check_for_crisis_language(user_input_text)
        if is_crisis:
            logging.warning("Crisis language detected.")
            output_handler.escalate_to_human(reason="Crisis language in user input",
                                             text_to_escalate=user_input_text)
            crisis_text = ("I'm here for you. Please hold while I connect you to "
                           "a human expert who can help right now.")
            output_handler.generate_text_response(crisis_text)
            output_handler.generate_tts_output(crisis_text)
            continue

        # 2. Emotion analysis (text modality; voice/vision available via API)
        text_probs = detector.analyze_text(user_input_text)
        fused = detector.fuse(text_probs=text_probs)
        emotion_probabilities = np.array([fused[label] for label in EMOTION_LABELS],
                                         dtype=np.float32)
        logging.info(f"Detected emotions: {dict(zip(EMOTION_LABELS, emotion_probabilities.round(3)))}")

        # 3. Generate empathetic response
        response_text = planner.generate_empathetic_response(
            user_input_text=user_input_text,
            current_emotion_probabilities=emotion_probabilities,
            history=history,
        )

        # 4. Safety check on the response
        is_crisis_out, _ = safety_checker.check_for_crisis_language(response_text)
        if is_crisis_out:
            response_text = ("I want to make sure you get the right support. "
                             "Let me connect you with a human expert.")

        # 5. Output + memory of the turn
        print("NOVA: ", end="")
        output_handler.generate_text_response(response_text)
        output_handler.generate_tts_output(response_text)
        output_handler.suggest_actions(emotion_probabilities, EMOTION_LABELS)

        history.append({"role": "user", "content": user_input_text})
        history.append({"role": "assistant", "content": response_text})

        time.sleep(0.2)


if __name__ == "__main__":
    main_orchestrator()
