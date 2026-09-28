# emotional_ai_llm/emotion_detectors.py
"""
Multimodal emotion detection using pretrained Hugging Face models.

Replaces the custom Keras encoder stack (whose weights were never trained)
with battle-tested pretrained weights:

  - Text   : j-hartmann/emotion-english-distilroberta-base (DistilRoBERTa)
  - Vision : trpakov/vit-face-expression (ViT fine-tuned on FER2013)
  - Audio  : superb/wav2vec2-base-superb-er (wav2vec2 for speech emotion)

All three detectors expose `analyze(...) -> dict` returning
{label: probability} mapped onto the canonical EMOTION_LABELS set, so the
rest of the pipeline (memory, planner, actions, reporting) works unchanged.
"""

import logging
import os
import tempfile

import numpy as np

from emotional_ai_llm.config import (
    EMOTION_LABELS,
    TEXT_EMOTION_MODEL,
    FACIAL_EMOTION_MODEL,
    SPEECH_EMOTION_MODEL,
    ENABLE_TEXT_EMOTION,
    ENABLE_VISION_EMOTION,
    ENABLE_AUDIO_EMOTION,
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Dataset -> canonical label mapping
_TEXT_LABEL_MAP = {"joy": "happy", "sadness": "sad"}
_FER_LABEL_MAP = {"angry": "anger", "happy": "happy", "sad": "sad",
                  "fearful": "fear", "surprised": "surprise", "disgusted": "disgust",
                  "neutral": "neutral"}
_ER_LABEL_MAP = {"angry": "anger", "happy": "happy", "sad": "sad", "neutral": "neutral"}


class MultimodalEmotionDetector:
    """Loads all three pretrained detectors lazily; each one degrades gracefully."""

    def __init__(self):
        self._text_pipe = None
        self._vision_pipe = None
        self._speech_pipe = None
        self._loaded = {"text": False, "vision": False, "audio": False}

    # ------------------------------------------------------------------ #
    # Lazy loaders
    # ------------------------------------------------------------------ #
    def _get_text_pipe(self):
        if not ENABLE_TEXT_EMOTION:
            return None
        if not self._loaded["text"]:
            self._loaded["text"] = True
            try:
                from transformers import pipeline
                device = 0 if torch_cuda_available() else -1
                self._text_pipe = pipeline(
                    "text-classification",
                    model=TEXT_EMOTION_MODEL,
                    top_k=None,
                    device=device,
                )
                logging.info(f"Text emotion model loaded: {TEXT_EMOTION_MODEL}")
            except Exception as e:
                logging.error(f"Failed to load text emotion model: {e}")
                self._text_pipe = None
        return self._text_pipe

    def _get_vision_pipe(self):
        if not ENABLE_VISION_EMOTION:
            return None
        if not self._loaded["vision"]:
            self._loaded["vision"] = True
            try:
                from transformers import pipeline
                device = 0 if torch_cuda_available() else -1
                self._vision_pipe = pipeline(
                    "image-classification",
                    model=FACIAL_EMOTION_MODEL,
                    top_k=None,
                    device=device,
                )
                logging.info(f"Facial emotion model loaded: {FACIAL_EMOTION_MODEL}")
            except Exception as e:
                logging.error(f"Failed to load facial emotion model: {e}")
                self._vision_pipe = None
        return self._vision_pipe

    def _get_speech_pipe(self):
        if not ENABLE_AUDIO_EMOTION:
            return None
        if not self._loaded["audio"]:
            self._loaded["audio"] = True
            try:
                from transformers import pipeline
                import torch  # noqa: F401  (required by the pipeline)
                device = 0 if torch_cuda_available() else -1
                self._speech_pipe = pipeline(
                    "audio-classification",
                    model=SPEECH_EMOTION_MODEL,
                    device=device,
                )
                logging.info(f"Speech emotion model loaded: {SPEECH_EMOTION_MODEL}")
            except Exception as e:
                logging.error(f"Failed to load speech emotion model: {e}")
                self._speech_pipe = None
        return self._speech_pipe

    # ------------------------------------------------------------------ #
    # Startup warmup (downloads + loads models so first request is fast)
    # ------------------------------------------------------------------ #
    def warm_up(self):
        """Eagerly load all enabled modality pipelines. Safe to call at boot."""
        if ENABLE_TEXT_EMOTION:
            self._get_text_pipe()
        if ENABLE_VISION_EMOTION:
            self._get_vision_pipe()
        if ENABLE_AUDIO_EMOTION:
            self._get_speech_pipe()

    # ------------------------------------------------------------------ #
    # Public API
    # ------------------------------------------------------------------ #
    def analyze_text(self, text: str) -> dict:
        """{canonical_label: probability} for the given text."""
        probs = {label: 0.0 for label in EMOTION_LABELS}
        pipe = self._get_text_pipe()
        if not pipe or not text or not text.strip():
            probs["neutral"] = 1.0
            return probs
        try:
            results = pipe(text)[0]
            for res in results:
                label = _TEXT_LABEL_MAP.get(res["label"], res["label"])
                if label in probs:
                    probs[label] = float(res["score"])
            logging.info(f"Text emotion: {probs}")
        except Exception as e:
            logging.error(f"Text emotion analysis failed: {e}")
            probs["neutral"] = 1.0
        return probs

    def analyze_face(self, image_bgr: np.ndarray) -> dict:
        """Analyze an RGB/BGR numpy image (HxWx3). Returns {label: prob}."""
        probs = {label: 0.0 for label in EMOTION_LABELS}
        pipe = self._get_vision_pipe()
        if pipe is None or image_bgr is None:
            return probs
        try:
            from PIL import Image
            import cv2
            if image_bgr.ndim == 2:
                image_bgr = cv2.cvtColor(image_bgr, cv2.COLOR_GRAY2RGB)
            elif image_bgr.shape[2] == 4:
                image_bgr = cv2.cvtColor(image_bgr, cv2.COLOR_RGBA2RGB)
            elif image_bgr.shape[2] == 3:
                image_bgr = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
            image = Image.fromarray(image_bgr.astype(np.uint8))
            results = pipe(image)
            for res in results:
                label = _FER_LABEL_MAP.get(res["label"].lower(), res["label"].lower())
                if label in probs:
                    probs[label] = float(res["score"])
            logging.info(f"Facial emotion: {probs}")
        except Exception as e:
            logging.error(f"Facial emotion analysis failed: {e}")
        return probs

    def analyze_voice(self, audio_path: str) -> dict:
        """Analyze a wav file. Returns {label: prob}."""
        probs = {label: 0.0 for label in EMOTION_LABELS}
        pipe = self._get_speech_pipe()
        if pipe is None or not audio_path or not os.path.exists(audio_path):
            return probs
        try:
            results = pipe(audio_path)
            for res in results:
                label = _ER_LABEL_MAP.get(res["label"].lower(), res["label"].lower())
                if label in probs:
                    probs[label] = float(res["score"])
            logging.info(f"Speech emotion: {probs}")
        except Exception as e:
            logging.error(f"Speech emotion analysis failed: {e}")
        return probs

    def fuse(self, text_probs: dict = None, face_probs: dict = None,
             voice_probs: dict = None, client_emotion: str = None) -> dict:
        """
        Combine available modality probabilities into one distribution.
        Missing modalities are ignored; if nothing is available we fall back
        to a uniform distribution nudged by the client-reported emotion.
        """
        sources = []
        if text_probs and sum(text_probs.values()) > 0:
            sources.append(text_probs)
        if face_probs and sum(face_probs.values()) > 0:
            sources.append(face_probs)
        if voice_probs and sum(voice_probs.values()) > 0:
            sources.append(voice_probs)

        if sources:
            fused = {label: 0.0 for label in EMOTION_LABELS}
            for src in sources:
                total = sum(src.values()) or 1.0
                for label in EMOTION_LABELS:
                    fused[label] += src.get(label, 0.0) / total
            n = len(sources)
            fused = {label: val / n for label, val in fused.items()}
        else:
            fused = {label: 1.0 / len(EMOTION_LABELS) for label in EMOTION_LABELS}

        # Gentle nudge from the client-side face heuristic, if provided
        if client_emotion:
            ce = client_emotion.lower().strip()
            mapping = {"angry": "anger", "happy": "happy", "sad": "sad",
                       "fearful": "fear", "surprised": "surprise",
                       "disgusted": "disgust", "neutral": "neutral"}
            ce = mapping.get(ce, ce)
            if ce in fused:
                for label in fused:
                    fused[label] = fused[label] * 0.8 + (0.2 if label == ce else 0.0)

        # Normalize
        total = sum(fused.values())
        if total > 0:
            fused = {label: val / total for label, val in fused.items()}
        return fused


def torch_cuda_available() -> bool:
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False


# --- Module-level singleton ---
_detector = None


def get_detector() -> MultimodalEmotionDetector:
    global _detector
    if _detector is None:
        _detector = MultimodalEmotionDetector()
    return _detector


if __name__ == "__main__":
    det = get_detector()
    print("Text:", det.analyze_text("I lost the game and I feel terrible."))
    fused = det.fuse(text_probs=det.analyze_text("I lost the game and I feel terrible."))
    print("Fused:", fused)
