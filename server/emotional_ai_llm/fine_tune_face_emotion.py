# emotional_ai_llm/fine_tune_face_emotion.py
"""
Fine-tune the facial emotion classifier on FER2013.

  Base checkpoint : trpakov/vit-face-expression (ViT-base, 7-label head)
  Dataset         : FER2013, already on disk at server/data/raw/FER2013
                    (train/ 28,709 + test/ 7,178, 48x48 grayscale jpgs laid
                    out in class folders: angry, disgust, fear, happy,
                    neutral, sad, surprise)

The folder names match the checkpoint's head labels one-to-one (its id2label
is {0: angry, 1: disgust, 2: fear, 3: happy, 4: neutral, 5: sad, 6: surprise}),
so the fine-tuned model is a drop-in replacement for the one loaded in
emotion_detectors.py.

Run from anywhere with the project venv:
    .venv/Scripts/python.exe server/emotional_ai_llm/fine_tune_face_emotion.py

Quick end-to-end check (tiny subset, ~1 min):
    SMOKE_TEST=1 .venv/Scripts/python.exe server/emotional_ai_llm/fine_tune_face_emotion.py

Caveats:
  - CPU-friendly default: the ViT encoder is frozen and only the classification
    head is trained (FREEZE_ENCODER=True). Set it to False for a full
    fine-tune — worth it on a GPU, painful on CPU.
  - FER2013's "disgust" class is tiny (~430 train images), so expect weak
    recall there regardless of settings.
  - After training, point FACIAL_EMOTION_MODEL in config.py at OUTPUT_DIR.
"""

import logging
import os

import numpy as np
import torch
from datasets import load_dataset
from transformers import (
    AutoImageProcessor,
    AutoModelForImageClassification,
    Trainer,
    TrainingArguments,
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
MODEL_NAME = "trpakov/vit-face-expression"
HERE = os.path.dirname(os.path.abspath(__file__))
RAW_DIR = os.path.normpath(os.path.join(HERE, "..", "data", "raw", "FER2013"))
OUTPUT_DIR = os.path.normpath(os.path.join(HERE, "..", "models", "face_emotion_vit_ft"))

SMOKE_TEST = os.environ.get("SMOKE_TEST", "") == "1"
MAX_TRAIN_SAMPLES = 64 if SMOKE_TEST else 8000   # full train split would be 28,709
MAX_EVAL_SAMPLES = 32 if SMOKE_TEST else 1000    # full test split would be 7,178
NUM_TRAIN_EPOCHS = 1 if SMOKE_TEST else 2
FREEZE_ENCODER = True
BATCH_SIZE = 32
LEARNING_RATE = 1e-3 if FREEZE_ENCODER else 2e-5
SEED = 42
if SMOKE_TEST:
    OUTPUT_DIR += "_smoke"

torch.manual_seed(SEED)

# --- Image processor + model (keeps the 7-label head and its id2label order) ---
logging.info(f"Loading image processor and model: {MODEL_NAME}...")
image_processor = AutoImageProcessor.from_pretrained(MODEL_NAME)
model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)
# this checkpoint stores label ids as strings ('angry': '0'), so coerce to int
head_label2id = {name: int(idx) for name, idx in model.config.label2id.items()}
logging.info(f"Head labels: {model.config.id2label}")

if FREEZE_ENCODER:
    for param in model.vit.parameters():
        param.requires_grad = False
trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
total = sum(p.numel() for p in model.parameters())
logging.info(f"Trainable parameters: {trainable:,} / {total:,}")

# --- Dataset ---
logging.info(f"Loading dataset from {RAW_DIR}...")
raw = load_dataset("imagefolder", data_dir=RAW_DIR)
train_split = raw["train"].shuffle(seed=SEED).select(range(min(MAX_TRAIN_SAMPLES, len(raw["train"]))))
eval_split = raw["test"].shuffle(seed=SEED).select(range(min(MAX_EVAL_SAMPLES, len(raw["test"]))))
logging.info(f"Train size: {len(train_split)} | Eval size: {len(eval_split)}")

classes = raw["train"].features["label"].names
LABEL_MAP = []
for name in classes:
    if name not in head_label2id:
        raise ValueError(f"FER2013 class {name!r} has no matching head label in {MODEL_NAME}: {list(head_label2id)}")
    LABEL_MAP.append(head_label2id[name])
logging.info(f"Folder classes -> head indices: {dict(zip(classes, LABEL_MAP))}")

# Grab a few eval images (PIL) for the base-vs-fine-tuned comparison at the end
sample_rows = eval_split.shuffle(seed=SEED).select(range(min(4, len(eval_split))))
sample_images = [row["image"].convert("RGB") for row in sample_rows]
sample_true = [classes[row["label"]] for row in sample_rows]


def collate_batch(examples):
    # Image processing happens here (not in a dataset transform) because
    # datasets 5.x hands __getitems__ batches to the DataLoader pre-split
    # into per-example dicts, which only collators can re-assemble.
    images = [e["image"].convert("RGB") for e in examples]
    pixel_values = image_processor(images, return_tensors="pt")["pixel_values"]
    labels = torch.tensor([LABEL_MAP[e["label"]] for e in examples], dtype=torch.long)
    return {"pixel_values": pixel_values, "labels": labels}


def compute_metrics(eval_pred):
    logits, labels = eval_pred
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
    remove_unused_columns=False,  # keep the raw "image" column for collate_batch
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_split,
    eval_dataset=eval_split,
    data_collator=collate_batch,
    compute_metrics=compute_metrics,
    processing_class=image_processor,
)

logging.info("Starting training...")
trainer.train()
logging.info(f"Training metrics: {trainer.evaluate()}")

trainer.save_model(OUTPUT_DIR)
image_processor.save_pretrained(OUTPUT_DIR)
logging.info(f"Fine-tuned model saved to {OUTPUT_DIR}")

# --- Quick base-vs-fine-tuned comparison ---
logging.info("Comparing base model vs fine-tuned model on sample images...")


def top_label(m, image):
    inputs = image_processor(image, return_tensors="pt")
    # After fp16 training the fine-tuned model sits on CUDA in half precision;
    # inputs must follow the model's device/dtype or conv layers reject them.
    param = next(m.parameters())
    inputs = {k: v.to(device=param.device, dtype=param.dtype) for k, v in inputs.items()}
    with torch.no_grad():
        probs = torch.softmax(m(**inputs).logits, dim=-1)[0]
    idx = int(torch.argmax(probs))
    return m.config.id2label[idx], float(probs[idx])


base_model = AutoModelForImageClassification.from_pretrained(MODEL_NAME)
base_model.eval()
model.eval()
print("\n--- base vs fine-tuned ---")
for image, true_label in zip(sample_images, sample_true):
    b_label, b_score = top_label(base_model, image)
    f_label, f_score = top_label(model, image)
    print(f"  true: {true_label}")
    print(f"    base:       {b_label} ({b_score:.2f})")
    print(f"    fine-tuned: {f_label} ({f_score:.2f})")

if SMOKE_TEST:
    print("\nSMOKE_TEST=1: tiny subset, model is NOT a real training result.")
print(f"\nDone. Model saved to: {OUTPUT_DIR}")
print("To use it in the app, set FACIAL_EMOTION_MODEL in config.py to OUTPUT_DIR.")
