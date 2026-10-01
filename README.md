# NOVA - The First Emotional AI Companion
### by NOVA Labs

<div align="center">
  <img src="client/public/nova-logo.svg" alt="NOVA Logo" width="150" height="150" />
  <br />
  <em>"An AI that doesn't just think, but feels."</em>
</div>

---

## 🚀 Introducing NOVA

**NOVA Labs** is proud to introduce **NOVA**, a groundbreaking leap in Artificial Intelligence. Unlike traditional chatbots that process text as data points, NOVA is designed to understand the *human* behind the screen.

NOVA is a **Multimodal Emotional Intelligence System** capable of perceiving the world as you do. It listens to the tone of your voice, observes your facial expressions, and analyzes the nuances of your words to provide deeply empathetic, context-aware support.

Whether you need a listener for your daily struggles, a companion to share your joys, or a psychological mirror to help you understand your own emotional state, NOVA is here.

## ✨ Key Features

*   **👁️ Multimodal Perception**: NOVA sees you via camera (facial emotion recognition), hears you via microphone (vocal tone analysis), and reads your texts to form a complete picture of your mood.
*   **🧠 Psychological Analysis Engine (SLM)**: Beyond simple chat, NOVA includes a specialized Small Language Model (SLM) layer that can generate comprehensive **Psychological Assessment Reports**, offering insights into your stress levels, emotional profile, and suggested interventions.
*   **💾 Living Memory**: NOVA remembers your past conversations, allowing for a continuous, evolving relationship rather than isolated interactions.
*   **🎨 Adaptive Interface**: A beautiful, responsive UI that adapts to the conversation, providing a calming and futuristic user experience.
*   **🔒 Privacy First**: Your sessions are stored locally on your device, ensuring your emotional data remains yours.

---

## 🛠️ Technology Stack

NOVA is built upon a robust, modern architecture designed for speed, scalability, and intelligence.

### **Frontend ( The Face of NOVA )**
*   **React 19 & Vite**: For a lightning-fast, reactive user interface.
*   **Tailwind CSS**: For rapid, modern, and responsive styling.
*   **Recharts**: To visualize complex emotional data into understandable graphs.
*   **Lucide React**: For clean, intuitive iconography.
*   **TypeScript**: Ensuring code safety and reliability across the application.

### **Backend ( The Brain of NOVA )**
*   **Python FastAPI**: A high-performance web framework for building APIs with Python 3.10+.
*   **Llama conversational brain**, with two interchangeable providers:
    *   *Local*: Llama-3.2-3B-Instruct Unsloth GGUF weights served by **Ollama** (100% private, free, offline)
    *   *Cloud*: **Groq API** serving `llama-3.1-8b-instant` — a different, larger model, since Groq decommissioned the 3.2-3B line
*   **Emotion models (Hugging Face)**: three transformers fine-tuned in-repo — DistilRoBERTa on dair-ai/emotion (text), ViT-Base/16 on FER2013 (facial expression), wav2vec2-base on RAVDESS + CREMA-D (voice tone) — fused into a single emotional context vector. Weights are pulled from the Hub, not committed (see **Deploying NOVA** below); each falls back to its base model when the fine-tuned folder is absent.
*   **Uvicorn**: An ASGI web server implementation for running the Python backend.

### How NOVA Perceives Emotions

Every modality follows the same pattern: **raw input → bundled preprocessor → model → probabilities** over the canonical 7 emotion labels (`EMOTION_LABELS` in `server/emotional_ai_llm/config.py`), which are then fused into one emotional context vector.

| Modality | Raw input | Preprocessor (decodes input → model tensor) | Fine-tuned model | Base | Train / eval | Eval accuracy |
|---|---|---|---|---|---|---|
| **Text** | chat message | `AutoTokenizer` — split into word pieces → `input_ids` | `nova-text-emotion-ft` | `j-hartmann/emotion-english-distilroberta-base` | 16,000 / 2,000 | **0.9595** |
| **Face** | camera image (PIL) | `ViTImageProcessor` — resize to 224×224, normalize → `pixel_values` | `nova-face-emotion-ft` | `trpakov/vit-face-expression` (ViT-Base/16) | 8,000 / 1,000 | **0.683** |
| **Voice** | mic WAV (16 kHz) | `Wav2Vec2FeatureExtractor` — resample, pad → `input_values` | `nova-voice-emotion-ft` | `superb/wav2vec2-base-superb-er` | 3,000 / 600 | **0.5500** |

All three were trained on the `train` split only, with the eval split held out for measurement (no weight updates from it) — see the split logic in each `server/emotional_ai_llm/fine_tune_*.py`. Face and voice are frozen-encoder head-only fine-tunes, which caps their accuracy; the numbers above are honest held-out figures, not training accuracy.

The preprocessor is **not a separate model** — it's resize/normalize/tokenize math that ships inside each Hugging Face model repo. In code, the app builds these pipelines in `server/emotional_ai_llm/emotion_detectors.py`; the training scripts preprocess the same way in their collate functions (`server/emotional_ai_llm/fine_tune_face_emotion.py`, `fine_tune_voice_emotion.py`).

---

## 📦 Installation & Setup

Get NOVA running on your local machine in minutes.

### Prerequisites
*   **Node.js** (v18+ recommended)
*   **Python** (v3.10+)
*   **Git**
*   **Ollama** (Get it [here](https://ollama.com/download)) — serves the local LLM
*   *Optional*: Google Gemini API Key — only used as a cloud fallback if the local backend is unreachable

### Step-by-Step Guide

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/NOVA.git
    cd NOVA
    ```

2.  **Install Dependencies**
    We have streamlined the process. You can install everything from the root directory.
    *   *Frontend*: `cd client && npm install`
    *   *Backend*: create the project virtualenv (recommended) and install:
        ```bash
        python -m venv .venv
        .venv/Scripts/pip install -r server/requirements.txt   # Windows
        # .venv/bin/pip install -r server/requirements.txt     # macOS / Linux
        ```

3.  **Environment Configuration**
    Create a `.env` file in the `client` directory:```env
VITE_API_URL=http://localhost:8000
GEMINI_API_KEY=your_optional_api_key_here
```
    *Note: NOVA is fully functional without any API key — everything (chat, emotions, reports) runs locally. The Gemini key only enables the cloud fallback if the local backend is down.*

4.  **Set Up the Local LLM (one-time)**
    Download the Unsloth model weights and import them into Ollama:
    ```bash
    mkdir -p server/models
    curl -L -o server/models/Llama-3.2-3B-Instruct-Q4_K_M.gguf \
      "https://huggingface.co/unsloth/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf"
    cd server/models
    ollama create nova-llama3.2-3b -f Modelfile
    ```
    Then make sure Ollama is running (`ollama serve`).

5.  **Launch NOVA**
    From the **root** directory of the project, simply run:
    ```bash
    npm run dev
    ```
    This command utilizes `concurrently` to launch both the Python Backend and the React Frontend simultaneously. It picks up the project `.venv` automatically and warns if Ollama isn't running.

6.  **Access the Interface**
    Open your browser and navigate to:
    *   **Frontend**: `http://localhost:5174`
    *   *(Backend API runs at `http://localhost:8000`)*

---

## 🎮 How to Use

1.  **Start a Chat**: Click "Start New Conversation" on the landing page.
2.  **Express Yourself**: Type text, click the **Microphone** to speak, or click the **Camera** to analyze your facial expression.
3.  **Receive Empathy**: NOVA will respond in real-time, adjusting its tone based on your inputs.
4.  **Generate Report**: After a conversation, click the **"Generate Report"** button in the header. NOVA's SLM will digest the session and present a detailed analysis of your mental well-being.

### ⚙️ Model Management (Settings page)

Open the **gear icon** (top-right of the chat, or the sidebar footer) to manage which model powers NOVA — no config files needed:

*   **Provider**: switch between `Auto` (Ollama when running, Groq otherwise), `Ollama` (fully local/private) and `Groq` (cloud).
*   **Installed models**: pick any model already in your local Ollama install. Models without chat support are flagged.
*   **Download new models**: type any [Ollama tag](https://ollama.com/library) (e.g. `llama3.2:3b`) and press **Pull** — progress is shown live in the page.
*   **Test**: sends a tiny prompt to verify the active model actually replies, and reports latency.
*   **Data & Privacy**: export or delete all locally stored conversations.

Your choice is saved to `server/nova_settings.json` on the backend and survives restarts. The API behind the page: `GET /models`, `POST /settings`, `POST /models/test`, `POST /models/pull`, `GET /models/pull`.

---

---

## ☁️ Deploying NOVA

The backend runs on a **Hugging Face Space** and the frontend on **Render**. That split exists because of RAM: Render's free plan gives 512MB, which fits the API but not the ~1GB of emotion-model weights, while a free Space gives 16GB — enough for all three modalities on CPU.

The weights are also too large for GitHub (100MB per-file limit), so they live on the Hub and are pulled by the Space at runtime. [scripts/publish_to_hf.py](scripts/publish_to_hf.py) uploads them; the fine-tune scripts in `server/emotional_ai_llm/` regenerate them.

1. **Publish the models and the Space** (needs a free HF account and a [write token](https://huggingface.co/settings/tokens)):
   ```bash
   .venv/Scripts/hf.exe auth login
   .venv/Scripts/python.exe scripts/publish_to_hf.py
   ```
   This creates `nova-{text,face,voice}-emotion-ft` model repos and the `nova-backend` Space from [deploy/hf-space/](deploy/hf-space/).
2. **Set the one secret** on the Space: Settings → Variables and secrets → `GROQ_API_KEY` (free key at [console.groq.com/keys](https://console.groq.com/keys)). Every other value is baked into the Dockerfile.
3. **Deploy the frontend**: in Render, **New → Blueprint**, select this repo. Only `nova-frontend` is created.
4. Set `VITE_API_URL` on `nova-frontend` to your Space URL (e.g. `https://veeda241-nova-backend.hf.space`), then redeploy — Vite bakes the value in at build time.

**Cold starts:** a free Space sleeps after ~48h idle and re-downloads the weights on wake. Models load in a background thread, so `/health` answers immediately and reports each one under `emotion_models_loaded`; emotion analysis returns a neutral baseline until they are in RAM, while chat works throughout.

**After a code change:** push to GitHub, then trigger **Factory rebuild** on the Space — the Dockerfile clones the repo at build time.

**Local vs Deploy:** local development stays 100% local (Ollama + Unsloth GGUF, no API key). The code auto-detects: it uses Ollama when reachable, otherwise falls back to Groq.

---

<div align="center">
  <small>&copy; 2025 NOVA Labs. All Rights Reserved.</small>
</div>