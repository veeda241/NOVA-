# emotional_ai_llm/llm_engine.py
"""
NOVA's LLM engine with pluggable providers.

Both providers serve a chat-capable instruct model. Which one is used is
controlled by the "provider" setting:

  - auto   : Ollama if reachable, otherwise Groq (default)
  - ollama : local Ollama server — any model pulled into Ollama works
             (default: nova-llama3.2-3b built from the Unsloth GGUF)
  - groq   : Groq's hosted API (used on Render, free tier)

Settings (provider / ollama model / ollama host) can be changed at runtime
from the web UI's Settings page: `NovaLLMEngine.configure(...)` swaps the
active provider in place and persists the choice to server/nova_settings.json,
so `get_llm_engine()` callers always see the current engine.
"""

import json
import logging
import os
import re
import threading
import time

import requests

from emotional_ai_llm.config import (
    LLM_PROVIDER,
    OLLAMA_HOST,
    NOVA_LLM_MODEL,
    GROQ_API_KEY,
    GROQ_MODEL,
    GROQ_API_URL,
    SETTINGS_PATH,
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

VALID_PROVIDERS = ("auto", "ollama", "groq")

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


def _model_present(available_names, wanted: str) -> bool:
    """True if `wanted` matches an Ollama tag (exact or :tag variant)."""
    wanted = (wanted or "").strip()
    if not wanted:
        return False
    return any(name == wanted or name.startswith(wanted + ":") for name in available_names)


def _ollama_error(resp) -> str:
    """Human-readable error text from an Ollama HTTP error response."""
    try:
        return str(resp.json().get("error") or resp.text)[:300]
    except Exception:
        return resp.text[:300]


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
    """Local provider — any model available in the local Ollama server."""

    provider = "ollama"

    def __init__(self, host: str = None, model: str = None):
        self.host = (host or OLLAMA_HOST).rstrip("/")
        self.model = model or NOVA_LLM_MODEL
        self._available = None
        self._lock = threading.Lock()

    def list_models(self):
        """Installed Ollama models, or None when the server is unreachable."""
        try:
            resp = requests.get(f"{self.host}/api/tags", timeout=3)
            resp.raise_for_status()
            models = []
            for m in resp.json().get("models", []):
                details = m.get("details") or {}
                models.append({
                    "name": m.get("name", ""),
                    "size": m.get("size", 0),
                    "parameter_size": details.get("parameter_size", ""),
                    "quantization": details.get("quantization_level", ""),
                    "capabilities": m.get("capabilities") or [],
                })
            return sorted(models, key=lambda m: m["name"])
        except Exception as e:
            logging.warning(f"Ollama not reachable at {self.host}: {e}")
            return None

    def is_available(self, force_check: bool = False) -> bool:
        if self._available is True and not force_check:
            return True
        with self._lock:
            models = self.list_models()
            if models is None:
                self._available = False
                return False
            names = [m["name"] for m in models]
            self._available = _model_present(names, self.model)
            if not self._available:
                logging.warning(
                    f"Ollama is running but model '{self.model}' was not found. "
                    f"Available: {names}. Pull or create it first, or pick another "
                    f"model in NOVA's Settings page."
                )
            return self._available

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
        if resp.status_code >= 400:
            raise RuntimeError(f"Ollama chat failed ({resp.status_code}): {_ollama_error(resp)}")
        data = resp.json()
        content = (data.get("message") or {}).get("content", "").strip()
        if not content:
            raise RuntimeError("Local LLM returned an empty response")
        return content


class GroqLLMEngine(BaseLLMEngine):
    """Cloud provider — Groq's free API serving hosted instruct models."""

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


class NovaLLMEngine(BaseLLMEngine):
    """
    Stable facade over the active provider.

    The object identity never changes, so components that captured it once
    (ResponsePlanner, report generator) always talk to the current provider
    even after the user switches models in the Settings page.
    """

    def __init__(self, settings: dict = None):
        self._lock = threading.RLock()
        self._settings = settings or _load_settings()
        self._active: BaseLLMEngine = None
        self._rebuild()

    # -- configuration ------------------------------------------------- #
    @property
    def settings(self) -> dict:
        with self._lock:
            return dict(self._settings)

    def _ollama_engine(self) -> OllamaLLMEngine:
        return OllamaLLMEngine(host=self._settings["ollama_host"],
                               model=self._settings["model"])

    def _rebuild(self):
        with self._lock:
            provider = (self._settings.get("provider") or "auto").lower()
            if provider == "groq":
                self._active = GroqLLMEngine()
            elif provider == "ollama":
                self._active = self._ollama_engine()
            else:  # auto
                ollama = self._ollama_engine()
                if ollama.is_available(force_check=True):
                    logging.info("Auto-detected provider: ollama (local)")
                    self._active = ollama
                else:
                    groq = GroqLLMEngine()
                    if groq.is_available():
                        logging.info("Auto-detected provider: groq (cloud fallback)")
                        self._active = groq
                    else:
                        logging.warning(
                            "No LLM provider available: Ollama unreachable and "
                            "GROQ_API_KEY not set. Chat will use fallback responses."
                        )
                        self._active = ollama  # fails per-call; planner degrades gracefully
            logging.info(f"Active LLM provider: {self._active.provider} — model: {self._active.model}")

    def configure(self, provider: str = None, model: str = None,
                  ollama_host: str = None) -> dict:
        """Apply new settings at runtime, persist them and return the new status."""
        with self._lock:
            if provider is not None:
                provider = str(provider).strip().lower()
                if provider not in VALID_PROVIDERS:
                    raise ValueError(f"provider must be one of {VALID_PROVIDERS}")
                self._settings["provider"] = provider
            if model is not None:
                model = str(model).strip()
                if not model:
                    raise ValueError("model must be a non-empty string")
                self._settings["model"] = model
            if ollama_host is not None:
                host = str(ollama_host).strip().rstrip("/")
                if not re.match(r"^https?://[^\s]+$", host):
                    raise ValueError("ollama_host must be an http(s) URL")
                self._settings["ollama_host"] = host
            _save_settings(self._settings)
            logging.info(f"LLM settings updated: {self._settings}")
            self._rebuild()
        return self.status()

    # -- provider interface (delegated to the active engine) ------------ #
    @property
    def provider(self) -> str:
        return self._active.provider

    @property
    def model(self) -> str:
        return self._active.model

    def is_available(self, force_check: bool = False) -> bool:
        return self._active.is_available(force_check=force_check)

    def chat(self, messages, temperature: float = 0.7, max_tokens: int = 220) -> str:
        return self._active.chat(messages, temperature=temperature, max_tokens=max_tokens)

    def test(self) -> dict:
        """Round-trip a tiny prompt to prove the active provider actually chats."""
        started = time.time()
        try:
            reply = self.chat(
                [{"role": "user", "content": "Reply with the single word: ready"}],
                temperature=0.0,
                max_tokens=16,
            )
            return {
                "ok": True,
                "reply": reply[:120],
                "latency_ms": int((time.time() - started) * 1000),
                "provider": self.provider,
                "model": self.model,
            }
        except Exception as e:
            return {
                "ok": False,
                "error": str(e)[:300],
                "latency_ms": int((time.time() - started) * 1000),
                "provider": self.provider,
                "model": self.model,
            }

    # -- status ---------------------------------------------------------- #
    def status(self) -> dict:
        """Everything the Settings page needs to render provider/model state."""
        with self._lock:
            settings = dict(self._settings)
            active_provider = self._active.provider
            active_model = self._active.model

        ollama = self._ollama_engine()
        models = ollama.list_models()
        ollama_state = {
            "host": ollama.host,
            "running": models is not None,
            "models": models or [],
            "model_present": _model_present([m["name"] for m in models], settings["model"])
                            if models is not None else False,
        }
        return {
            "provider": active_provider,
            "model": active_model,
            "available": self._active.is_available(),
            "settings": settings,
            "ollama": ollama_state,
            "groq": {
                "configured": bool(GROQ_API_KEY),
                "model": GROQ_MODEL,
            },
        }


# --- Settings persistence ------------------------------------------------- #

_DEFAULT_SETTINGS = {
    "provider": LLM_PROVIDER or "auto",
    "model": NOVA_LLM_MODEL,
    "ollama_host": OLLAMA_HOST,
}


def _load_settings() -> dict:
    settings = dict(_DEFAULT_SETTINGS)
    try:
        if os.path.exists(SETTINGS_PATH):
            with open(SETTINGS_PATH, "r", encoding="utf-8") as fh:
                stored = json.load(fh)
            if isinstance(stored, dict):
                for key in settings:
                    if isinstance(stored.get(key), str) and stored[key].strip():
                        settings[key] = stored[key].strip()
                logging.info(f"Loaded LLM settings from {SETTINGS_PATH}: {settings}")
    except Exception as e:
        logging.warning(f"Could not read {SETTINGS_PATH} ({e}); using defaults.")
    if settings["provider"].lower() not in VALID_PROVIDERS:
        settings["provider"] = "auto"
    return settings


def _save_settings(settings: dict) -> None:
    try:
        with open(SETTINGS_PATH, "w", encoding="utf-8") as fh:
            json.dump(settings, fh, indent=2)
    except Exception as e:
        logging.error(f"Could not persist LLM settings to {SETTINGS_PATH}: {e}")


# --- Module-level singleton --- #
_engine = None
_engine_lock = threading.Lock()


def get_llm_engine() -> NovaLLMEngine:
    global _engine
    if _engine is None:
        with _engine_lock:
            if _engine is None:
                _engine = NovaLLMEngine()
    return _engine


if __name__ == "__main__":
    engine = get_llm_engine()
    print(json.dumps(engine.status(), indent=2))
    if engine.is_available():
        reply = engine.chat([
            {"role": "system", "content": NOVA_SYSTEM_PROMPT},
            {"role": "user", "content": "I had a rough day at work and feel drained."},
        ])
        print("NOVA:", reply)
