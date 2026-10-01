# NOVA backend as a Hugging Face Space.
#
# The Space repo holds only this file and README.md; the application code is
# cloned from GitHub at build time so there is a single source of truth. After
# pushing a code change, trigger "Factory rebuild" in the Space settings.
#
# Free Space hardware is 2 vCPU / 16GB RAM / no GPU, so every model runs on CPU
# and torch is installed from the CPU wheel index (the CUDA wheel is ~2.5GB).

FROM python:3.11-slim

ARG NOVA_REPO=https://github.com/veeda241/NOVA-.git
ARG NOVA_REF=main

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 --branch ${NOVA_REF} ${NOVA_REPO} /app

WORKDIR /app/server

# Install torch first from the CPU index; requirements.txt asks for
# torch>=2.5,<2.6, which the pre-installed 2.5.1 already satisfies.
RUN pip install --index-url https://download.pytorch.org/whl/cpu torch==2.5.1 \
    && pip install -r requirements.txt

# Non-secret runtime config. GROQ_API_KEY is the only value that must be set in
# the Space dashboard (Settings -> Variables and secrets) as a Secret.
ENV LLM_PROVIDER=groq \
    GROQ_MODEL=llama-3.1-8b-instant \
    ENABLE_TEXT_EMOTION=true \
    ENABLE_VISION_EMOTION=true \
    ENABLE_AUDIO_EMOTION=true \
    TEXT_EMOTION_MODEL=veeda241/nova-text-emotion-ft \
    FACIAL_EMOTION_MODEL=veeda241/nova-face-emotion-ft \
    SPEECH_EMOTION_MODEL=veeda241/nova-voice-emotion-ft

EXPOSE 7860

CMD ["uvicorn", "fastapi_app:app", "--host", "0.0.0.0", "--port", "7860"]
