"""
Quick offline tests for the LLM provider abstraction.
Run:  python -m tests.test_llm_engines   (from server/)
or:   python tests/test_llm_engines.py   (from server/)
"""

import sys
import os
import unittest
from unittest import mock

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from emotional_ai_llm.llm_engine import GroqLLMEngine, OllamaLLMEngine


class FakeResponse:
    def __init__(self, payload, status_code=200):
        self._payload = payload
        self.status_code = status_code
        self.text = str(payload)

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            raise RuntimeError(f"HTTP {self.status_code}")


class TestGroqEngine(unittest.TestCase):
    def test_chat_parses_openai_style_response(self):
        engine = GroqLLMEngine(api_key="test-key")
        fake = {
            "choices": [{"message": {"role": "assistant", "content": "Hello there!"}}]
        }
        with mock.patch("emotional_ai_llm.llm_engine.requests.post",
                        return_value=FakeResponse(fake)) as mocked:
            out = engine.chat([{"role": "user", "content": "hi"}])
        self.assertEqual(out, "Hello there!")
        # Verify request shape
        _, kwargs = mocked.call_args
        payload = kwargs["json"]
        self.assertEqual(payload["model"], "llama-3.1-8b-instant")
        self.assertEqual(payload["messages"][0]["content"], "hi")
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer test-key")

    def test_missing_key_raises(self):
        engine = GroqLLMEngine(api_key="")
        with self.assertRaises(RuntimeError):
            engine.chat([{"role": "user", "content": "hi"}])

    def test_available_requires_key(self):
        self.assertFalse(GroqLLMEngine(api_key="").is_available())
        self.assertTrue(GroqLLMEngine(api_key="k").is_available())

    def test_generate_json_handles_fenced_output(self):
        engine = GroqLLMEngine(api_key="test-key")
        fenced = '```json\n{"stressLevel": 72, "patientName": "Alex"}\n```'
        with mock.patch("emotional_ai_llm.llm_engine.requests.post",
                        return_value=FakeResponse(
                            {"choices": [{"message": {"content": fenced}}]})):
            data = engine.generate_json("sys", "user")
        self.assertEqual(data["stressLevel"], 72)


class TestOllamaEngine(unittest.TestCase):
    def test_unreachable_host_is_not_available(self):
        engine = OllamaLLMEngine(host="http://localhost:1", model="nova-llama3.2-3b")
        self.assertFalse(engine.is_available(force_check=True))

    def test_chat_parses_ollama_response(self):
        engine = OllamaLLMEngine(host="http://fake", model="nova-llama3.2-3b")
        fake = {"message": {"role": "assistant", "content": "Local hello"}}
        with mock.patch("emotional_ai_llm.llm_engine.requests.post",
                        return_value=FakeResponse(fake)):
            out = engine.chat([{"role": "user", "content": "hi"}])
        self.assertEqual(out, "Local hello")


if __name__ == "__main__":
    unittest.main(verbosity=2)
