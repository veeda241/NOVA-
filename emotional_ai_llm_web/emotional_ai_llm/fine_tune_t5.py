import os
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, DataCollatorForSeq2Seq
from transformers.training_args import TrainingArguments
from transformers.trainer import Trainer
from datasets import load_dataset, Dataset
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Configuration ---
MODEL_NAME = "pixelsandpointers/t5-empatheticdialogues"
DATASET_NAME = "empathetic_dialogues"
OUTPUT_DIR = "./fine_tuned_empathetic_t5"
BATCH_SIZE = 8
LEARNING_RATE = 2e-5
NUM_TRAIN_EPOCHS = 3
MAX_INPUT_LENGTH = 128
MAX_TARGET_LENGTH = 64

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

logging.info(f"Loading tokenizer and model for {MODEL_NAME}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)
logging.info("Tokenizer and model loaded.")

logging.info(f"Loading dataset: {DATASET_NAME}...")
# The 'empathetic_dialogues' dataset needs some processing to get the right format.
# We'll focus on the 'train' and 'validation' splits.
raw_datasets = load_dataset(DATASET_NAME, revision="main", trust_remote_code=True)

def preprocess_function(examples):
    """
    Preprocesses the raw dataset into input-target pairs suitable for T5.
    The goal is to create prompts that lead to empathetic responses.
    """
    inputs = [f"dialogue: {context.strip()} ||| emotion: {prompt.strip()}"
              for context, prompt in zip(examples["context"], examples["prompt"])]
    targets = [response.strip() for response in examples["utterance"]]

    model_inputs = tokenizer(inputs, max_length=MAX_INPUT_LENGTH, truncation=True)
    
    # Setup the tokenizer for targets
    with tokenizer.as_target_tokenizer():
        labels = tokenizer(targets, max_length=MAX_TARGET_LENGTH, truncation=True)

    model_inputs["labels"] = labels["input_ids"]
    return model_inputs

logging.info("Preprocessing dataset...")
# Filter out test and other splits, focus on train and validation
train_dataset = raw_datasets["train"].map(
    preprocess_function,
    batched=True,
    remove_columns=['speaker_idx', 'conv_id', 'context', 'prompt', 'utterance']
)
eval_dataset = raw_datasets["validation"].map(
    preprocess_function,
    batched=True,
    remove_columns=['speaker_idx', 'conv_id', 'context', 'prompt', 'utterance']
)
logging.info("Dataset preprocessed.")
logging.info(f"Train dataset size: {len(train_dataset)}")
logging.info(f"Validation dataset size: {len(eval_dataset)}")

# Check if CUDA is available
if torch.cuda.is_available():
    device = torch.device("cuda")
    logging.info("CUDA is available. Using GPU for training.")
else:
    device = torch.device("cpu")
    logging.warning("CUDA not available. Training will be slow on CPU.")

model.to(device)

logging.info("Setting up TrainingArguments...")
training_args = TrainingArguments(
    output_dir=OUTPUT_DIR,
    per_device_train_batch_size=BATCH_SIZE,
    per_device_eval_batch_size=BATCH_SIZE,
    learning_rate=LEARNING_RATE,
    num_train_epochs=NUM_TRAIN_EPOCHS,
    eval_strategy="epoch",
    save_strategy="epoch",
    save_total_limit=1, # Only save the best model
    load_best_model_at_end=True,
    metric_for_best_model="eval_loss",
    greater_is_better=False,
    logging_dir=f"{OUTPUT_DIR}/logs",
    logging_steps=100,
    report_to="none", # Disable reporting to services like Weights & Biases
    # Use fp16 for faster training if GPU supports it
    fp16=torch.cuda.is_available(), 
)
logging.info("TrainingArguments set up.")

logging.info("Initializing Trainer...")
data_collator = DataCollatorForSeq2Seq(tokenizer=tokenizer, model=model)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=train_dataset,
    eval_dataset=eval_dataset,
    tokenizer=tokenizer,
    data_collator=data_collator,
)
logging.info("Trainer initialized.")

logging.info("Starting model training...")
trainer.train()
logging.info("Training complete.")

# Save the fine-tuned model and tokenizer
final_model_path = os.path.join(OUTPUT_DIR, "final_model")
trainer.save_model(final_model_path)
tokenizer.save_pretrained(final_model_path)
logging.info(f"Fine-tuned model and tokenizer saved to {final_model_path}")

print(f"\nFine-tuning script finished. Your model is saved to: {final_model_path}")
print("To use this model, update the 'hf_model_name' in response_planner.py to this path.")
