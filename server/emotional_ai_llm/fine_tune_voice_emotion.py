# emotional_ai_llm/fine_tune_voice_emotion.py
"""
Fine-tune the speech emotion classifier on RAVDESS + CREMA-D.

  Base checkpoint : superb/wav2vec2-base-superb-er (4-label head: neu/hap/ang/sad)
  Datasets        : already on disk under server/data/raw/
                      RAVDESS/audio_speech_actors_01-24/   1,440 speech clips, 48 kHz
                      CREMA-D/AudioWAV/                    7,442 clips, 16 kHz

Unlike the text/face scripts, this one REBUILDS the head for the app's canonical
7 labels (config.EMOTION_LABELS order), so the fine-tuned model plugs straight
into analyze_voice() in emotion_detectors.py with no label remapping needed.

Run from anywhere with the project venv:
    .venv/Scripts/python.exe server/emotional_ai_llm/fine_tune_voice_emotion.py

Quick end-to-end check (tiny subset, ~1 min):
    SMOKE_TEST=1 .venv/Scripts/python.exe server/emotional_ai_llm/fine_tune_voice_emotion.py

Caveats:
  - CPU-friendly default: the wav2vec2 encoder is frozen and only the
    classification head is trained (FREEZE_ENCODER=True). Set it to False for
    a full fine-tune — worth it on a GPU, very slow on CPU.
  - RAVDESS "calm" (code 02, 2 clips per actor) is folded into neutral.
  - CREMA-D has no "surprise" clips, so that head label is trained only on
    RAVDESS (~192 clips) — expect weak recall there.
  - Audio is read with soundfile (no torchaudio in this venv) and resampled
    manually: 48k -> 16k is a clean 3:1 block-average decimation.
  - After training, point SPEECH_EMOTION_MODEL in config.py at OUTPUT_DIR.
"""

import logging
import os
import random
from dataclasses import dataclass
from typing import Any, Dict, List

import numpy as np
import soundfile as sf
import torch
from torch.utils.data import Dataset
from transformers import (
    AutoFeatureExtractor,
    AutoModelForAudioClassification,
    Trainer,
    TrainingArguments,
)

from config import EMOTION_LABELS

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
MODEL_NAME = "superb/wav2vec2-base-superb-er"
HERE = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.normpath(os.path.join(HERE, "..", "data", "raw"))
OUTPUT_DIR = os.path.normpath(os.path.join(HERE, "..", "models", "voice_emotion_wav2vec2_ft"))

SMOKE_TEST = os.environ.get("SMOKE_TEST", "") == "1"
MAX_TRAIN_SAMPLES = 32 if SMOKE_TEST else 3000      # full train pool would be ~7,550
MAX_EVAL_SAMPLES = 16 if SMOKE_TEST else 600        # full eval pool would be ~1,330
NUM_TRAIN_EPOCHS = 1 if SMOKE_TEST else 2
FREEZE_ENCODER = True
BATCH_SIZE = 8
LEARNING_RATE = 1e-3 if FREEZE_ENCODER else 3e-5
TARGET_SAMPLE_RATE = 16000
MAX_SECONDS = 4.0
EVAL_FRACTION = 0.15
SEED = 42
if SMOKE_TEST:
    OUTPUT_DIR += "_smoke"

random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

# --- Label mapping ---
# RAVDESS filename: 03-01-EE-II-SS-RR-AA.wav  (EE = emotion code)
RAVDESS_CODES = {"01": "neutral", "02": "neutral", "03": "happy", "04": "sad",
                 "05": "anger", "06": "fear", "07": "disgust", "08": "surprise"}
# CREMA-D filename: {actor}_{sentence}_{EMO}_{level}.wav  e.g. 1001_DFA_ANG_XX.wav
CREMA_CODES = {"ANG": "anger", "DIS": "disgust", "FEA": "fear", "HAP": "happy",
               "NEU": "neutral", "SAD": "sad"}


def collect_clips():
    """Walk both datasets and return [(wav_path, label_name), ...]."""
    clips = []

    ravdess_root = os.path.join(RAW_DIR, "RAVDESS", "audio_speech_actors_01-24")
    ravdess_count = 0
    for actor in sorted(os.listdir(ravdess_root)):
        actor_dir = os.path.join(ravdess_root, actor)
        if not os.path.isdir(actor_dir):
            continue
        for fname in sorted(os.listdir(actor_dir)):
            if not fname.lower().endswith(".wav"):
                continue
            parts = fname.split("-")
            if len(parts) < 3:
                continue
            label = RAVDESS_CODES.get(parts[2])
            if label:
                clips.append((os.path.join(actor_dir, fname), label))
                ravdess_count += 1
    logging.info(f"RAVDESS clips: {ravdess_count}")

    crema_root = os.path.join(RAW_DIR, "CREMA-D", "AudioWAV")
    crema_count = 0
    for fname in sorted(os.listdir(crema_root)):
        if not fname.lower().endswith(".wav"):
            continue
        parts = os.path.splitext(fname)[0].split("_")
        if len(parts) < 4:
            continue
        label = CREMA_CODES.get(parts[2].upper())
        if label:
            clips.append((os.path.join(crema_root, fname), label))
            crema_count += 1
    logging.info(f"CREMA-D clips: {crema_count}")

    return clips


def load_audio(path):
    """Read a wav, downmix to mono, resample to TARGET_SAMPLE_RATE, truncate."""
    audio, sr = sf.read(path, dtype="float32")
    if audio.ndim > 1:
        audio = audio.mean(axis=1)
    if sr != TARGET_SAMPLE_RATE:
        if sr % TARGET_SAMPLE_RATE == 0:
            # clean integer decimation (48k -> 16k): average each block of `factor` samples
            factor = sr // TARGET_SAMPLE_RATE
            usable = len(audio) - (len(audio) % factor)
            audio = audio[:usable].reshape(-1, factor).mean(axis=1)
        else:
            n = int(round(len(audio) * TARGET_SAMPLE_RATE / sr))
            audio = np.interp(np.linspace(0, len(audio) - 1, n),
                              np.arange(len(audio)), audio).astype(np.float32)
    return audio[:int(MAX_SECONDS * TARGET_SAMPLE_RATE)]


class EmotionAudioDataset(Dataset):
    def __init__(self, clips, feature_extractor):
        self.clips = clips
        self.feature_extractor = feature_extractor

    def __len__(self):
        return len(self.clips)

    def __getitem__(self, idx):
        path, label_name = self.clips[idx]
        audio = load_audio(path)
        input_values = self.feature_extractor(
            audio, sampling_rate=TARGET_SAMPLE_RATE
        )["input_values"][0]
        return {"input_values": input_values, "label": label_name}


@dataclass
class DataCollatorAudioClassification:
    """Pad variable-length clips; turn label names into ids for the loss."""
    feature_extractor: Any
    label2id: Dict[str, int]

    def __call__(self, features: List[Dict[str, Any]]) -> Dict[str, Any]:
        input_features = [{"input_values": f["input_values"]} for f in features]
        batch = self.feature_extractor.pad(input_features, padding=True, return_tensors="pt")
        batch["labels"] = torch.tensor([self.label2id[f["label"]] for f in features], dtype=torch.long)
        return batch


def stratified_split(clips, eval_fraction, seed):
    """Split per label so every emotion appears in both halves."""
    by_label = {}
    for clip in clips:
        by_label.setdefault(clip[1], []).append(clip)
    rng = random.Random(seed)
    train, eval_ = [], []
    for items in by_label.values():
        rng.shuffle(items)
        n_eval = max(1, int(len(items) * eval_fraction))
        eval_.extend(items[:n_eval])
        train.extend(items[n_eval:])
    rng.shuffle(train)
    rng.shuffle(eval_)
    return train, eval_


def compute_metrics(eval_pred):
    logits, labels = eval_pred
    if isinstance(logits, (list, tuple)):
        # superb-er uses weighted layer sum, so the head also returns
        # hidden_states; logits are the first entry of that output tuple.
        logits = logits[0]
    preds = np.argmax(logits, axis=-1)
    labels = np.asarray(labels)
    accuracy = float((preds == labels).mean())
    f1s = []
    for cls in np.unique(labels):
        tp = np.sum((preds == cls) & (labels == cls))
        fp = np.sum((preds == cls) & (labels != cls))
        fn = np.sum((preds != cls) & (labels == cls))
        precision = tp / (tp + fp) if tp + fp else 0.0
        recall = tp / (tp + fn) if tp + fn else 0.0
        f1s.append(2 * precision * recall / (precision + recall) if precision + recall else 0.0)
    return {"accuracy": accuracy, "f1_macro": float(np.mean(f1s))}


# --- Feature extractor + model (head rebuilt for the canonical 7 labels) ---
logging.info(f"Loading feature extractor and model: {MODEL_NAME}...")
feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_NAME)
label2id = {name: i for i, name in enumerate(EMOTION_LABELS)}
id2label = {i: name for i, name in enumerate(EMOTION_LABELS)}
model = AutoModelForAudioClassification.from_pretrained(
    MODEL_NAME,
    num_labels=len(EMOTION_LABELS),
    ignore_mismatched_sizes=True,
    id2label=id2label,
    label2id=label2id,
)
logging.info(f"Head rebuilt for labels: {EMOTION_LABELS}")

if FREEZE_ENCODER:
    for param in model.wav2vec2.parameters():
        param.requires_grad = False
else:
    # full fine-tune: the CNN front-end is still kept frozen (standard practice)
    for param in model.wav2vec2.feature_extractor.parameters():
        param.requires_grad = False
trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
total = sum(p.numel() for p in model.parameters())
logging.info(f"Trainable parameters: {trainable:,} / {total:,}")

# --- Dataset ---
logging.info(f"Collecting clips from {RAW_DIR}...")
clips = collect_clips()
train_clips, eval_clips = stratified_split(clips, EVAL_FRACTION, SEED)
train_clips = train_clips[:MAX_TRAIN_SAMPLES]
eval_clips = eval_clips[:MAX_EVAL_SAMPLES]
logging.info(f"Train size: {len(train_clips)} | Eval size: {len(eval_clips)}")

# Grab a few eval clips for the base-vs-fine-tuned comparison at the end.
sample_clips = eval_clips[:4]
sample_audio = [load_audio(path) for path, _ in sample_clips]
sample_true = [label for _, label in sample_clips]


if torch.cuda.is_available():
    logging.info("CUDA available, training on GPU.")
else:
    logging.info("Training on CPU (encoder frozen, so this is head-only and fast).")

training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    learning_rate=LEARNING_RATE,
    num_train_epochs=NUM_TRAIN_EPOCHS,
    eval_strategy="epoch",
    save_strategy="epoch",
    save_total_limit=1,
    load_best_model_at_end=True,
    metric_for_best_model="accuracy",
    greater_is_better=True,
    logging_dir=os.path.join(OUTPUT_DIR, "logs"),
    logging_steps=50,
    report_to="none",
    fp16=torch.cuda.is_available(),
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=EmotionAudioDataset(train_clips, feature_extractor),
    eval_dataset=EmotionAudioDataset(eval_clips, feature_extractor),
    data_collator=DataCollatorAudioClassification(feature_extractor, label2id),
    compute_metrics=compute_metrics,
    processing_class=feature_extractor,
)

logging.info("Starting training...")
trainer.train()
logging.info(f"Training metrics: {trainer.evaluate()}")

trainer.save_model(OUTPUT_DIR)
feature_extractor.save_pretrained(OUTPUT_DIR)
logging.info(f"Fine-tuned model saved to {OUTPUT_DIR}")

# --- Quick base-vs-fine-tuned comparison ---
logging.info("Comparing base model vs fine-tuned model on sample clips...")


def top_label(m, audio):
    inputs = feature_extractor(audio, sampling_rate=TARGET_SAMPLE_RATE, return_tensors="pt")
    # After fp16 training the fine-tuned model sits on CUDA in half precision;
    # inputs must follow the model's device/dtype.
    param = next(m.parameters())
    inputs = {k: v.to(device=param.device, dtype=param.dtype) for k, v in inputs.items()}
    with torch.no_grad():
        probs = torch.softmax(m(**inputs).logits, dim=-1)[0]
    idx = int(torch.argmax(probs))
    return m.config.id2label[idx], float(probs[idx])


base_model = AutoModelForAudioClassification.from_pretrained(MODEL_NAME)
base_model.eval()
model.eval()
print("\n--- base vs fine-tuned ---")
for audio, true_label in zip(sample_audio, sample_true):
    b_label, b_score = top_label(base_model, audio)
    f_label, f_score = top_label(model, audio)
    print(f"  true: {true_label}")
    print(f"    base:       {b_label} ({b_score:.2f})")
    print(f"    fine-tuned: {f_label} ({f_score:.2f})")

if SMOKE_TEST:
    print("\nSMOKE_TEST=1: tiny subset, model is NOT a real training result.")
print(f"\nDone. Model saved to: {OUTPUT_DIR}")
print("To use it in the app, set SPEECH_EMOTION_MODEL in config.py to OUTPUT_DIR.")
