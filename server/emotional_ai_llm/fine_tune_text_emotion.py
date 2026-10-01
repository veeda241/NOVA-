# emotional_ai_llm/fine_tune_text_emotion.py
"""
Fine-tune the text emotion classifier on the dair-ai/emotion dataset (CARER).

  Base checkpoint : j-hartmann/emotion-english-distilroberta-base (7-label head)
  Dataset         : dair-ai/emotion, downloaded from the Hugging Face Hub via
                    `datasets`. Two configs:
                      "split"   -> 16k train / 2k validation / 2k test
                      "unsplit" -> ~417k rows, train only (GPU recommended)

The checkpoint's original 7-label head is kept, so the fine-tuned model is a
drop-in replacement for the one loaded in emotion_detectors.py.

Run from anywhere with the project venv:
    .venv/Scripts/python.exe server/emotional_ai_llm/fine_tune_text_emotion.py

Caveats:
  - dair-ai/emotion has no "disgust"/"neutral" examples, so those head labels
    get no training signal (the pretrained prior for them drifts slightly;
    a low learning rate + few epochs keeps that drift small).
  - After training, point TEXT_EMOTION_MODEL in config.py at OUTPUT_DIR.
"""

import logging
import os

import numpy as np
import torch
from datasets import load_dataset
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
MODEL_NAME = "j-hartmann/emotion-english-distilroberta-base"
DATASET_NAME = "dair-ai/emotion"
DATASET_CONFIG = "split"  # "split" = 16k/2k/2k | "unsplit" = ~417k rows, train only
HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT_DIR = os.path.normpath(os.path.join(HERE, "..", "models", "text_emotion_distilroberta_ft"))
MAX_LENGTH = 64  # tweets are short; 64 tokens covers almost all of them
BATCH_SIZE = 16
LEARNING_RATE = 2e-5
NUM_TRAIN_EPOCHS = 2

# dair-ai/emotion label -> checkpoint head label.
# "love" has no head label of its own; joy is the closest match
# (the app maps joy -> happy via _TEXT_LABEL_MAP in emotion_detectors.py).
DATASET_TO_MODEL_LABEL = {
    "sadness": "sadness",
    "joy": "joy",
    "love": "joy",
    "anger": "anger",
    "fear": "fear",
    "surprise": "surprise",
}

SAMPLES = [
    "I can't believe you did this to me. I'm furious.",
    "I miss my family so much, everything feels empty.",
    "Just got the internship offer, I'm over the moon!",
    "thanks for the update, i'll take a look tomorrow",
]

# --- Tokenizer + model (keeps the 7-label head and its id2label order) ---
logging.info(f"Loading tokenizer and model: {MODEL_NAME}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
label2id = model.config.label2id
logging.info(f"Head labels: {model.config.id2label}")

covered = set(DATASET_TO_MODEL_LABEL.values())
missing = [name for name in label2id if name not in covered]
if missing:
    logging.warning(f"Head labels with no training examples: {missing} "
                    "(pretrained prior for these drifts slightly during training)")

# --- Dataset ---
logging.info(f"Loading dataset: {DATASET_NAME} [{DATASET_CONFIG}]...")
raw = load_dataset(DATASET_NAME, DATASET_CONFIG)
if "validation" in raw:
    train_split, eval_split = raw["train"], raw["validation"]
else:
    split = raw["train"].train_test_split(test_size=0.05, seed=42)
    train_split, eval_split = split["train"], split["test"]

label_feature = raw["train"].features["label"]
logging.info(f"Train size: {len(train_split)} | Eval size: {len(eval_split)}")
logging.info(f"Train label counts: {dict(zip(*np.unique(train_split['label'], return_counts=True)))}")


def preprocess(examples):
    enc = tokenizer(examples["text"], truncation=True, max_length=MAX_LENGTH)
    enc["labels"] = [
        label2id[DATASET_TO_MODEL_LABEL[name]]
        for name in label_feature.int2str(examples["label"])
    ]
    return enc


logging.info("Tokenizing...")
train_dataset = train_split.map(preprocess, batched=True, remove_columns=train_split.column_names)
eval_dataset = eval_split.map(preprocess, batched=True, remove_columns=eval_split.column_names)


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
    logging.warning("CUDA not available. Training on CPU will be slow.")

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
    logging_steps=100,
    report_to="none",
    fp16=torch.cuda.is_available(),
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    data_collator=DataCollatorWithPadding(tokenizer=tokenizer),
    compute_metrics=compute_metrics,
    processing_class=tokenizer,
)

logging.info("Starting training...")
trainer.train()
logging.info(f"Training metrics: {trainer.evaluate()}")

trainer.save_model(OUTPUT_DIR)
tokenizer.save_pretrained(OUTPUT_DIR)
logging.info(f"Fine-tuned model saved to {OUTPUT_DIR}")

# --- Quick base-vs-fine-tuned comparison ---
logging.info("Comparing base model vs fine-tuned model on sample utterances...")


def top_label(m, text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=MAX_LENGTH)
    with torch.no_grad():
        probs = torch.softmax(m(**inputs).logits, dim=-1)[0]
    idx = int(torch.argmax(probs))
    return m.config.id2label[idx], float(probs[idx])


base_model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
base_model.eval()
model.eval()
print("\n--- base vs fine-tuned ---")
for text in SAMPLES:
    b_label, b_score = top_label(base_model, text)
    f_label, f_score = top_label(model, text)
    print(f"  {text!r}")
    print(f"    base:       {b_label} ({b_score:.2f})")
    print(f"    fine-tuned: {f_label} ({f_score:.2f})")

print(f"\nDone. Model saved to: {OUTPUT_DIR}")
print("To use it in the app, set TEXT_EMOTION_MODEL in config.py to OUTPUT_DIR.")
