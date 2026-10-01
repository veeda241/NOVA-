---
title: NOVA Emotional AI Backend
emoji: 🧠
colorFrom: indigo
colorTo: purple
sdk: docker
app_port: 7860
pinned: false
short_description: Multimodal emotion analysis + empathetic chat backend for NOVA
---

# NOVA backend

FastAPI backend for [NOVA](https://github.com/veeda241/NOVA-): multimodal emotion
analysis (text, face, voice) fused into one emotional context vector, plus an
empathetic chat brain and session reports.

Hosted here rather than on Render because the free Space tier provides 16GB of RAM,
which is enough to hold all three emotion models on CPU. Render's free tier gives
512MB, which fits the API but not the weights.

## Models

Fine-tuned weights are pulled from the Hub at first request (they are too large for
GitHub, and the Space filesystem is wiped on every rebuild):

| Modality | Repo | Base | Fine-tuned on | Eval accuracy |
|---|---|---|---|---|
| Text | `veeda241/nova-text-emotion-ft` | `j-hartmann/emotion-english-distilroberta-base` | dair-ai/emotion (16k train / 2k val) | 0.9595 |
| Face | `veeda241/nova-face-emotion-ft` | `trpakov/vit-face-expression` | FER2013 (8k train / 1k eval) | 0.683 |
| Voice | `veeda241/nova-voice-emotion-ft` | `superb/wav2vec2-base-superb-er` | RAVDESS + CREMA-D (3k train / 600 eval) | 0.5500 |

Chat uses the Groq API (`llama-3.1-8b-instant`); the local Ollama path is for
development only and is unreachable from the cloud.

## Required secret

`GROQ_API_KEY` — set it under **Settings → Variables and secrets**. Everything else
is baked into the Dockerfile as an `ENV` default.

## Cold starts

A free Space sleeps after ~48h idle. On wake it re-downloads ~1GB of weights and
loads them in a background thread, so `/health` answers immediately while
`emotion_models_loaded` reports `false` until each model is in RAM. Emotion
analysis returns a neutral baseline during that window; chat works throughout.

## Endpoints

- `GET /health` — provider status and per-modality model load state
- `POST /chat` — the main call: `text` plus optional base64 `image` and `audio`.
  Runs whichever modalities are present, fuses them into one emotion
  distribution, and returns the reply plus that analysis.
- `POST /report` — session report generated from a `history` of messages
- `GET /reports` — previously generated reports
- `GET /models`, `POST /settings`, `POST /models/test` — LLM provider state and
  runtime switching for the Settings page
- `GET /docs` — interactive OpenAPI docs

`POST /models/pull` and the Ollama half of `/settings` are local-development only;
there is no Ollama server in the cloud. Note that `/settings` writes
`server/nova_settings.json`, which lives on the Space's ephemeral disk — a switch
made through the UI survives until the next rebuild, then reverts to the
`LLM_PROVIDER=groq` default baked into the Dockerfile.
