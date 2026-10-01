#!/usr/bin/env python
"""Publish NOVA's fine-tuned weights and the HF Space to the Hugging Face Hub.

GitHub cannot hold these files: its 100MB per-file limit rejects every
model.safetensors, and the three models total ~1GB. The Hub is where the
deployed Space fetches them from (see the *_EMOTION_MODEL env defaults in
deploy/hf-space/Dockerfile). Re-run this after each retrain.

    .venv/Scripts/hf.exe auth login                 # once; needs a write token
    .venv/Scripts/python.exe scripts/publish_to_hf.py

Use --models-only or --space-only to publish one half.

The model repos are created PUBLIC: a private repo could not be pulled by the
Space without a token, and public weights are what make the paper reproducible.
"""

import argparse
import os
import sys

from huggingface_hub import create_repo, upload_folder, whoami

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODELS_DIR = os.path.join(REPO_ROOT, "server", "models")
SPACE_DIR = os.path.join(REPO_ROOT, "deploy", "hf-space")

SPACE_NAME = "nova-backend"

# (folder under server/models/, Hub repo name) — the Hub names must match the
# *_EMOTION_MODEL defaults in deploy/hf-space/Dockerfile.
MODELS = [
    ("text_emotion_distilroberta_ft", "nova-text-emotion-ft"),
    ("face_emotion_vit_ft", "nova-face-emotion-ft"),
    ("voice_emotion_wav2vec2_ft", "nova-voice-emotion-ft"),
]

# Trainer checkpoints duplicate the final weights and add optimizer state;
# training_args.bin only matters for resuming a run.
IGNORE = ["checkpoint-*", "*.bin", "*.pt", "*.pth", "*.msgpack", "*.h5"]


def current_user() -> str:
    try:
        return whoami()["name"]
    except Exception:
        sys.exit(
            "Not logged in to the Hub (or the token expired).\n"
            "Create a write token at https://huggingface.co/settings/tokens, then:\n"
            "  .venv/Scripts/hf.exe auth login"
        )


def publish_models(user: str) -> None:
    for folder, name in MODELS:
        path = os.path.join(MODELS_DIR, folder)
        if not os.path.isdir(path):
            sys.exit(f"{path} is missing — run the fine-tune script for it first.")
        repo_id = f"{user}/{name}"
        create_repo(repo_id, repo_type="model", private=False, exist_ok=True)
        print(f"\nUploading {folder} -> {repo_id}", flush=True)
        upload_folder(folder_path=path, repo_id=repo_id, ignore_patterns=IGNORE)
        print(f"  https://huggingface.co/{repo_id}")


def publish_space(user: str) -> None:
    repo_id = f"{user}/{SPACE_NAME}"
    create_repo(repo_id, repo_type="space", space_sdk="docker",
                private=False, exist_ok=True)
    print(f"\nUploading deploy/hf-space -> {repo_id}", flush=True)
    upload_folder(folder_path=SPACE_DIR, repo_id=repo_id, repo_type="space")
    print(f"  https://huggingface.co/spaces/{repo_id}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Publish NOVA models and Space to the Hub.")
    parser.add_argument("--models-only", action="store_true")
    parser.add_argument("--space-only", action="store_true")
    args = parser.parse_args()

    user = current_user()
    print(f"Publishing as {user}", flush=True)

    if not args.space_only:
        publish_models(user)
    if not args.models_only:
        publish_space(user)

    print(
        "\nDone. Before the Space can chat, add GROQ_API_KEY under\n"
        f"  https://huggingface.co/spaces/{user}/{SPACE_NAME}/settings -> Variables and secrets\n"
        "The Space URL is what VITE_API_URL on the Render frontend must point at."
    )


if __name__ == "__main__":
    main()
