# emotional_ai_llm/fusion_module.py

import tensorflow as tf
from tensorflow.keras import layers, Model
from sklearn.model_selection import train_test_split
import numpy as np
import os

# Define constants for fusion model
TEXT_EMBEDDING_DIM = 128
AUDIO_EMBEDDING_DIM = 128
VISION_EMBEDDING_DIM = 128
NUM_EMOTION_LABELS = 7 # Example: based on common emotion datasets (e.g., happy, sad, angry, etc.)
BATCH_SIZE = 32
EPOCHS = 3

def build_fusion_model(num_emotion_labels):
    """
    Builds a multimodal fusion model that concatenates embeddings from different modalities
    and passes them through a Multi-Layer Perceptron (MLP) for emotion prediction.
    """
    # Input layers for each modality's embeddings
    text_input = layers.Input(shape=(TEXT_EMBEDDING_DIM,), name="text_embedding_input")
    audio_input = layers.Input(shape=(AUDIO_EMBEDDING_DIM,), name="audio_embedding_input")
    vision_input = layers.Input(shape=(VISION_EMBEDDING_DIM,), name="vision_embedding_input")

    # Concatenate the embeddings
    concatenated_embeddings = layers.concatenate([text_input, audio_input, vision_input], axis=-1)

    # MLP layers for fusion and prediction
    x = layers.Dense(256, activation='relu')(concatenated_embeddings)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.5)(x)
    outputs = layers.Dense(num_emotion_labels, activation='sigmoid', name="emotion_output")(x) # Sigmoid for multi-label

    model = Model(inputs=[text_input, audio_input, vision_input], outputs=outputs, name="multimodal_fusion_model")
    print("Multimodal fusion model built.")
    model.summary()
    return model

def train_fusion_model(model, train_embeddings, train_labels, val_embeddings, val_labels, output_dir="models/fusion_mlp_model"):
    """
    Trains the multimodal fusion model.
    """
    model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])

    print("Starting training of multimodal fusion model...")
    model.fit(
        train_embeddings, train_labels,
        batch_size=BATCH_SIZE,
        epochs=EPOCHS,
        validation_data=(val_embeddings, val_labels)
    )
    print("Training complete.")

    os.makedirs(output_dir, exist_ok=True)
    model.save(output_dir + ".keras") # Save as Keras Native format
    print(f"Multimodal fusion model saved to {output_dir}.keras")

if __name__ == "__main__":
    print("Running multimodal fusion module development example:")

    # Generate dummy embeddings and labels
    print("Creating dummy multimodal embeddings and labels for testing...")
    num_dummy_samples = 100 # More samples for fusion model
    
    dummy_text_embeddings = np.random.rand(num_dummy_samples, TEXT_EMBEDDING_DIM).astype(np.float32)
    dummy_audio_embeddings = np.random.rand(num_dummy_samples, AUDIO_EMBEDDING_DIM).astype(np.float32)
    dummy_vision_embeddings = np.random.rand(num_dummy_samples, VISION_EMBEDDING_DIM).astype(np.float32)
    
    dummy_labels = np.random.randint(0, 2, size=(num_dummy_samples, NUM_EMOTION_LABELS)).astype(np.float32)

    # Combine embeddings for training/validation split
    combined_embeddings = (dummy_text_embeddings, dummy_audio_embeddings, dummy_vision_embeddings)

    # Split data for training and validation
    (train_text_emb, val_text_emb,
     train_audio_emb, val_audio_emb,
     train_vision_emb, val_vision_emb,
     train_labels, val_labels) = train_test_split(
        dummy_text_embeddings, dummy_audio_embeddings, dummy_vision_embeddings, dummy_labels,
        test_size=0.3, random_state=42
    )

    # Prepare inputs for the model.fit function
    train_inputs = {"text_embedding_input": train_text_emb,
                    "audio_embedding_input": train_audio_emb,
                    "vision_embedding_input": train_vision_emb}
    val_inputs = {"text_embedding_input": val_text_emb,
                  "audio_embedding_input": val_audio_emb,
                  "vision_embedding_input": val_vision_emb}

    model = build_fusion_model(NUM_EMOTION_LABELS)
    train_fusion_model(model, train_inputs, train_labels, val_inputs, val_labels)

    print("Multimodal fusion module development example finished.")