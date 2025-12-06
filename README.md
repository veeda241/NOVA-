# NOVA - The First Emotional AI Companion
### by NOVA Labs

<div align="center">
  <img src="nova---emotional-ai/public/logo.png" alt="NOVA Logo" width="150" height="150" />
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
*   **TensorFlow / Keras**: Powers the custom deep learning models for:
    *   *Vision Encoder*: Detecting facial micro-expressions.
    *   *Audio Encoder*: Analyzing voice pitch, tone, and rhythm.
    *   *Fusion Module*: Combining text, audio, and visual data into a single emotional context vector.
*   **Google Gemini API**: Acts as the advanced linguistic core for generating natural, human-like responses and complex psychological reports.
*   **Uvicorn**: An ASGI web server implementation for running the Python backend.

---

## 📦 Installation & Setup

Get NOVA running on your local machine in minutes.

### Prerequisites
*   **Node.js** (v18+ recommended)
*   **Python** (v3.10+)
*   **Git**
*   **Google Gemini API Key** (Get one [here](https://aistudio.google.com/))

### Step-by-Step Guide

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/NOVA.git
    cd NOVA
    ```

2.  **Install Dependencies**
    We have streamlined the process. You can install everything from the root directory.
    *   *Frontend*: `cd nova---emotional-ai && npm install`
    *   *Backend*: `cd emotional_ai_llm_web && pip install -r requirements.txt`

3.  **Environment Configuration**
    Create a `.env` file in the `nova---emotional-ai` directory:
    ```env
    VITE_API_URL=http://localhost:8000
    GEMINI_API_KEY=your_actual_api_key_here
    ```
    *Note: The backend (`emotional_ai_llm_web`) generally runs without extra env vars for local dev, but ensure your Python environment can access the necessary libraries.*

4.  **Launch NOVA**
    From the **root** directory of the project, simply run:
    ```bash
    npm run dev
    ```
    This command utilizes `concurrently` to launch both the Python Backend and the React Frontend simultaneously.

5.  **Access the Interface**
    Open your browser and navigate to:
    *   **Frontend**: `http://localhost:3000`
    *   *(Backend API runs at `http://localhost:8000`)*

---

## 🎮 How to Use

1.  **Start a Chat**: Click "Start New Conversation" on the landing page.
2.  **Express Yourself**: Type text, click the **Microphone** to speak, or click the **Camera** to analyze your facial expression.
3.  **Receive Empathy**: NOVA will respond in real-time, adjusting its tone based on your inputs.
4.  **Generate Report**: After a conversation, click the **"Generate Report"** button in the header. NOVA's SLM will digest the session and present a detailed analysis of your mental well-being.

---

<div align="center">
  <small>&copy; 2025 NOVA Labs. All Rights Reserved.</small>
</div>