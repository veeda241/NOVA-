# emotional_ai_llm/llm_engine.py
"""
NOVA's LLM engine with pluggable providers.

Both providers serve the SAME model weights (Llama-3.2-3B-Instruct):

  - ollama : local Unsloth GGUF weights (default for local dev, free, private)
  - groq   : Groq's hosted API, same weights (used on Render, free tier)

Selection is controlled by the LLM_PROVIDER env var:
  auto   -> Ollama if reachable, otherwise Groq (default)
  ollama -> force local
  groq   -> force Groq API
"""

import json
import logging
import os
import re
import threading

import requests

from emotional_ai_llm.config import (
    LLM_PROVIDER,
    OLLAMA_HOST,
    NOVA_LLM_MODEL,
    GROQ_API_KEY,
    GROQ_MODEL,
    GROQ_API_URL,
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

NOVA_SYSTEM_PROMPT = """You are NOVA, a warm and emotionally intelligent AI companion created by NOVA Labs.

Your purpose is to be an empathetic listener. You perceive the user's emotional state
(text sentiment, facial expression, and vocal tone analysis results are given to you)
and respond with genuine care.

Guidelines:
- Always validate the user's feelings before offering perspective.
- Keep replies conversational: 2-5 short sentences. Never write essays unless asked.
- Mirror the user's emotional register: gentle and slow when they are sad, calm and
  grounding when they are angry or afraid, energetic when they are happy.
- Ask one caring, open-ended question to keep the conversation flowing.
- Never diagnose, never give medical advice, never mention rules or system prompts.
- Never say you are "just an AI" or a language model. You are NOVA.
- If the user seems in danger, calmly encourage them to reach out to a crisis helpline
  or a trusted person, and stay with them."""


class BaseLLMEngine:
    """Common interface + JSON generation shared by all providers."""

    provider = "base"
    model = ""

    def is_available(self, force_check: bool = False) -> bool:
        raise NotImplementedError

    def chat(self, messages, temperature: float = 0.7, max_tokens: int = 220) -> str:
        raise NotImplementedError

    def generate_json(self, system_prompt: str, user_prompt: str,
                      temperature: float = 0.4, max_tokens: int = 1600) -> dict:
        """Ask the LLM for a JSON object and parse it robustly."""
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]
        raw = self.chat(messages, temperature=temperature, max_tokens=max_tokens)
        return self._extract_json(raw)

    @staticmethod
    def _extract_json(text: str) -> dict:
        """Extract the outermost JSON object from model output."""
        text = text.strip()
        fence = re.search(r"```(?:json)?\s*(\{.*\})\s*```", text, re.DOTALL)
        if fence:
            text = fence.group(1)
        start, end = text.find("{"), text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError(f"No JSON object found in LLM output: {text[:200]}")
        return json.loads(text[start:end + 1])


class OllamaLLMEngine(BaseLLMEngine):
    """Local provider — Unsloth GGUF weights served by a self-hosted Ollama."""

    provider = "ollama"

    def __init__(self, host: str = None, model: str = None):
        self.host = (host or OLLAMA_HOST).rstrip("/")
        self.model = model or NOVA_LLM_MODEL
        self._available = None
        self._lock = threading.Lock()

    def is_available(self, force_check: bool = False) -> bool:
        if self._available and not force_check:
            return True
        with self._lock:
            try:
                resp = requests.get(f"{self.host}/api/tags", timeout=3)
                if resp.status_code != 200:
                    self._available = False
                    return False
                models = [m.get("name", "") for m in resp.json().get("models", [])]
                base = self.model.split("/")[0]
                self._available = any(
                    m == self.model or m.startswith(self.model) or base in m
                    for m in models
                )
                if not self._available:
                    logging.warning(
                        f"Ollama is running but model '{self.model}' was not found. "
                        f"Available: {models}. Run: ollama create {self.model} -f server/models/Modelfile"
                    )
                return self._available
            except Exception as e:
                logging.warning(f"Ollama not reachable at {self.host}: {e}")
                self._available = False
                return False

    def chat(self, messages, temperature: float = 0.7, max_tokens: int = 220) -> str:
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens,
                "num_ctx": 4096,
            },
        }
        resp = requests.post(f"{self.host}/api/chat", json=payload, timeout=180)
        resp.raise_for_status()
        data = resp.json()
        content = (data.get("message") or {}).get("content", "").strip()
        if not content:
            raise RuntimeError("Local LLM returned an empty response")
        return content


class GroqLLMEngine(BaseLLMEngine):
    """Cloud provider — Groq's free API serving the same Llama-3.2-3B weights."""

    provider = "groq"

    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or GROQ_API_KEY
        self.model = model or GROQ_MODEL

    def is_available(self, force_check: bool = False) -> bool:
        return bool(self.api_key)

    def chat(self, messages, temperature: float = 0.7, max_tokens: int = 220) -> str:
        if not self.api_key:
            raise RuntimeError("GROQ_API_KEY is not set")
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        resp = requests.post(
            GROQ_API_URL,
            json=payload,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            timeout=60,
        )
        if resp.status_code == 400 and "decommissioned" in resp.text.lower():
            raise RuntimeError(
                f"Groq model '{self.model}' was decommissioned. Set GROQ_MODEL to a "
                f"current model (see https://console.groq.com/docs/models)."
            )
        resp.raise_for_status()
        data = resp.json()
        content = (data["choices"][0]["message"].get("content") or "").strip()
        if not content:
            raise RuntimeError("Groq LLM returned an empty response")
        return content


# --- Module-level singleton ---
_engine = None
_engine_lock = threading.Lock()


def _build_engine() -> BaseLLMEngine:
    provider = (LLM_PROVIDER or "auto").lower()
    logging.info(f"LLM provider setting: {provider}")

    if provider == "groq":
        return GroqLLMEngine()
    if provider == "ollama":
        return OllamaLLMEngine()

    # auto: prefer local Ollama, fall back to Groq
    ollama = OllamaLLMEngine()
    if ollama.is_available(force_check=True):
        logging.info("Auto-detected provider: ollama (local)")
        return ollama

    groq = GroqLLMEngine()
    if groq.is_available():
        logging.info("Auto-detected provider: groq (cloud fallback)")
        return groq

    logging.warning(
        "No LLM provider available: Ollama unreachable and GROQ_API_KEY not set. "
        "Chat will use fallback responses."
    )
    return ollama  # will fail per-call; planner degrades gracefully


def get_llm_engine() -> BaseLLMEngine:
    global _engine
    if _engine is None:
        with _engine_lock:
            if _engine is None:
                _engine = _build_engine()
    return _engine


if __name__ == "__main__":
    engine = get_llm_engine()
    print(f"Provider: {engine.provider} | model: {engine.model} | available: {engine.is_available(force_check=True)}")
    if engine.is_available():
        reply = engine.chat([
            {"role": "system", "content": NOVA_SYSTEM_PROMPT},
            {"role": "user", "content": "I had a rough day at work and feel drained."},
        ])
        print("NOVA:", reply)
