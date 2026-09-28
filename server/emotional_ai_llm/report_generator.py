# emotional_ai_llm/report_generator.py
"""
Psychological Assessment Report generator.

Previously this ran in the browser via the paid Google Gemini API. It now runs
locally: the conversation history is sent to the local Unsloth LLM which
returns a structured JSON report matching the client's AnalysisReport schema.
"""

import datetime
import logging

from emotional_ai_llm.llm_engine import get_llm_engine

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

REPORT_SYSTEM_PROMPT = """You are NOVA's Analytical Engine, a psychology-savvy report writer.
You digest a conversation between a user and the NOVA emotional AI companion and
produce a structured psychological assessment.

Return ONLY a valid JSON object (no markdown, no commentary) with exactly these keys:
{
  "timestamp": "ISO 8601 date string",
  "patientName": "inferred first name or 'Subject'",
  "stressLevel": number 0-100,
  "emotionalProfile": [ {"emotion": "...", "score": 0-100, "color": "#hex"}, ... 5 items ],
  "rootCauseAnalysis": "detailed paragraph on the underlying causes of the user's state",
  "longTermStrategy": "strategic paragraph for emotional improvement",
  "inputSummary": "concise summary of the user's key inputs and concerns",
  "suggestedInterventions": ["actionable step", ...] (3-5 items)
}

Rules:
- Base every field strictly on the conversation content. Do not invent facts.
- Keep the tone clinical but compassionate.
- Output raw JSON only."""

_FALLBACK_REPORT = {
    "timestamp": "",
    "patientName": "Subject",
    "stressLevel": 50,
    "emotionalProfile": [
        {"emotion": "Neutral", "score": 50, "color": "#6366f1"},
        {"emotion": "Unknown", "score": 25, "color": "#8b5cf6"},
        {"emotion": "Unknown", "score": 15, "color": "#a855f7"},
        {"emotion": "Unknown", "score": 10, "color": "#d946ef"},
        {"emotion": "Unknown", "score": 5, "color": "#ec4899"},
    ],
    "rootCauseAnalysis": "The report engine could not analyze this conversation. "
                         "Please ensure the local LLM service (Ollama) is running and try again.",
    "longTermStrategy": "No strategy could be generated for this conversation.",
    "inputSummary": "No summary available.",
    "suggestedInterventions": ["Ensure the local model service is running",
                               "Retry the report generation"],
}


def generate_analysis_report(history) -> dict:
    """
    Build the report from a conversation history list of
    {'role': 'user'|'assistant', 'content': str} dicts.
    """
    engine = get_llm_engine()

    turns = []
    for msg in history:
        role = "User" if msg.get("role") == "user" else "NOVA"
        content = (msg.get("content") or "").strip()
        if content:
            turns.append(f"{role}: {content}")
    conversation_text = "\n".join(turns)

    if not conversation_text.strip():
        raise ValueError("Conversation is empty — nothing to analyze.")

    if len(turns) < 2:
        raise ValueError("Not enough conversation to analyze yet.")

    # Cap history so the prompt stays within the local model's context window
    if len(conversation_text) > 12000:
        conversation_text = conversation_text[-12000:]

    user_prompt = (
        "Analyze the following conversation and generate the psychological "
        f"assessment report. Today is {datetime.date.today().isoformat()}.\n\n"
        f"{conversation_text}"
    )

    report = engine.generate_json(
        system_prompt=REPORT_SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.3,
        max_tokens=1600,
    )

    # --- Validate / repair the structure so the client never breaks ---
    fallback = dict(_FALLBACK_REPORT)
    fallback["timestamp"] = datetime.datetime.now().isoformat()

    if not isinstance(report, dict):
        return fallback

    merged = {**fallback, **{k: v for k, v in report.items() if v not in (None, "")}}

    profile = merged.get("emotionalProfile")
    if not isinstance(profile, list) or not profile:
        merged["emotionalProfile"] = fallback["emotionalProfile"]
    else:
        cleaned = []
        for item in profile[:5]:
            if isinstance(item, dict) and "emotion" in item:
                cleaned.append({
                    "emotion": str(item.get("emotion", "Unknown")),
                    "score": _clamp_num(item.get("score", 0), 0, 100),
                    "color": item.get("color") if isinstance(item.get("color"), str) else "#6366f1",
                })
        merged["emotionalProfile"] = cleaned or fallback["emotionalProfile"]

    interventions = merged.get("suggestedInterventions")
    if not isinstance(interventions, list) or not interventions:
        merged["suggestedInterventions"] = fallback["suggestedInterventions"]
    else:
        merged["suggestedInterventions"] = [str(x) for x in interventions][:5]

    merged["stressLevel"] = _clamp_num(merged.get("stressLevel", 50), 0, 100)

    for key in ("rootCauseAnalysis", "longTermStrategy", "inputSummary", "patientName"):
        merged[key] = str(merged.get(key, fallback[key]))

    return merged


def _clamp_num(value, lo, hi) -> float:
    try:
        return max(lo, min(hi, float(value)))
    except (TypeError, ValueError):
        return float(lo)


if __name__ == "__main__":
    demo_history = [
        {"role": "user", "content": "I've been so stressed about exams lately."},
        {"role": "assistant", "content": "That sounds heavy. What's weighing on you most?"},
        {"role": "user", "content": "I feel like I'll disappoint my parents if I fail."},
    ]
    print(generate_analysis_report(demo_history))
