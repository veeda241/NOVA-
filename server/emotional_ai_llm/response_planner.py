# emotional_ai_llm/response_planner.py
"""
Generates NOVA's empathetic responses.

The old implementation wrapped BlenderBot-400M output in canned therapist
phrases. Now the ResponsePlanner prompts the local Unsloth LLM (via Ollama)
with the fused emotion analysis, client-reported facial emotion and recent
conversation history, so responses are genuinely contextual.
"""

import logging

import numpy as np

from emotional_ai_llm.config import EMOTION_LABELS
from emotional_ai_llm.llm_engine import get_llm_engine, NOVA_SYSTEM_PROMPT

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

DETECTION_THRESHOLD = 0.5
MAX_HISTORY_TURNS = 8  # messages kept in the prompt


class ResponsePlanner:
    def __init__(self, emotion_labels=None):
        self.emotion_labels = emotion_labels or EMOTION_LABELS
        self.engine = get_llm_engine()

    # ------------------------------------------------------------------ #
    def _get_dominant_emotions(self, emotion_probabilities) -> str:
        """Comma-joined list of emotions above threshold (falls back to argmax)."""
        dominant = [
            self.emotion_labels[i]
            for i, prob in enumerate(emotion_probabilities)
            if prob > DETECTION_THRESHOLD
        ]
        if not dominant:
            max_idx = int(np.argmax(emotion_probabilities))
            dominant = [self.emotion_labels[max_idx]]
        return ", ".join(dominant)

    @staticmethod
    def _top_emotions(emotion_probabilities, k=3):
        """[(label, prob)] for the k most probable emotions."""
        probs = np.asarray(emotion_probabilities, dtype=float).flatten()
        order = np.argsort(probs)[::-1][:k]
        return [(EMOTION_LABELS[i], float(probs[i])) for i in order]

    # ------------------------------------------------------------------ #
    def generate_empathetic_response(
        self,
        user_input_text: str,
        current_emotion_probabilities,
        conversation_context_vector=None,   # kept for backward compat (unused)
        user_facial_emotion: str = "neutral",
        history=None,
    ) -> str:
        """
        Build an emotion-aware prompt and generate the reply with the local LLM.
        `history` is an optional list of {'role': 'user'|'assistant', 'content': str}.
        """
        dominant_str = self._get_dominant_emotions(current_emotion_probabilities)
        primary = dominant_str.split(",")[0].strip().lower()
        top = self._top_emotions(current_emotion_probabilities)
        top_str = ", ".join(f"{label} {prob:.0%}" for label, prob in top)

        emotion_context = (
            f"[Emotional analysis of the user's current state]\n"
            f"- Dominant emotion: {primary}\n"
            f"- Full readout: {top_str}\n"
            f"- Facial expression (camera): {user_facial_emotion}\n"
            f"Respond in a way that genuinely fits this state."
        )

        messages = [{"role": "system", "content": NOVA_SYSTEM_PROMPT}]

        # Trimmed conversation history for continuity
        if history:
            for msg in history[-MAX_HISTORY_TURNS:]:
                role = msg.get("role")
                content = (msg.get("content") or "").strip()
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})

        messages.append({
            "role": "user",
            "content": f"{emotion_context}\n\nThe user says: \"{user_input_text}\""
        })

        try:
            response = self.engine.chat(messages, temperature=0.7, max_tokens=220)
            logging.info(f"LLM response generated (primary emotion: {primary})")
            return response
        except Exception as e:
            logging.error(f"LLM generation failed: {e}")
            return (
                "I'm here with you. I'm having a little trouble finding the right "
                "words just now, but I'm listening - please tell me more."
            )


if __name__ == "__main__":
    planner = ResponsePlanner()
    probs = np.array([0.05, 0.02, 0.05, 0.04, 0.72, 0.03, 0.09])  # sad
    resp = planner.generate_empathetic_response(
        user_input_text="I lost the game and I feel terrible.",
        current_emotion_probabilities=probs,
        user_facial_emotion="sad",
        history=[{"role": "user", "content": "hey"},
                 {"role": "assistant", "content": "Hello! How are you feeling today?"}],
    )
    print("NOVA:", resp)
