# Setup Instructions

To run the NOVA application, please follow these steps:

1.  **Configure Environment Variables:**
    - Go to the `client/` directory.
    - Copy `.env.example` to `.env`.
    - Open `.env` and set your `GEMINI_API_KEY`.
      ```bash
      cd client
      cp .env.example .env
      # Edit .env
      ```

2.  **Install Dependencies:**
    - **Server:** Ensure you have Python installed. It is recommended to use a virtual environment.
      ```bash
      # In root directory
      python -m venv .venv
      # Windows:
      .venv\Scripts\activate
      # Linux/Mac:
      source .venv/bin/activate
      
      pip install -r server/requirements.txt
      ```
    - **Client:** Ensure you have Node.js installed.
      ```bash
      cd client
      npm install
      ```

3.  **Start the Application:**
    - You can use the provided PowerShell script from the root directory:
      ```powershell
      .\start_all_services.ps1
      ```
    - Or start them manually:
      - **Server:** `cd server; uvicorn fastapi_app:app --reload --port 8000`
      - **Client:** `cd client; npm run dev`

**Note:** The app needs the local LLM imported into Ollama as `nova-llama3.2-3b`. One-time setup:
```bash
# 1. Download the Unsloth GGUF weights (~2 GB)
curl -L -o server/models/Llama-3.2-3B-Instruct-Q4_K_M.gguf ^
  "https://huggingface.co/unsloth/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf"

# 2. Import into Ollama
cd server/models
ollama create nova-llama3.2-3b -f Modelfile

# 3. Make sure Ollama is running
ollama serve
```
The Hugging Face emotion models (text/face/voice) download automatically on first run.
