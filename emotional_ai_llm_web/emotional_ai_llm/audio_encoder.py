# emotional_ai_llm/audio_encoder.py

import tensorflow as tf
from tensorflow.keras import layers, Model
from sklearn.model_selection import train_test_split
import numpy as np
import os
from .utils import extract_mel_spectrogram

# Define constants for audio CNN
INPUT_SHAPE = (128, 44, 1)  # Example: 128 Mel bands, 44 frames (for approx 1 sec audio), 1 channel
FILTERS = 64
KERNEL_SIZE = (3, 3)
POOL_SIZE = (2, 2)
BATCH_SIZE = 32
EPOCHS = 3

def build_audio_cnn_encoder(num_labels):
    """
    Builds a small Convolutional Neural Network (CNN) for audio emotion classification
    using mel-spectrograms as input.
    """
    model = tf.keras.Sequential([
        layers.Input(shape=INPUT_SHAPE),
        layers.Conv2D(FILTERS, KERNEL_SIZE, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(POOL_SIZE),
        layers.Conv2D(FILTERS * 2, KERNEL_SIZE, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling2D(POOL_SIZE),
        layers.Flatten(),
        layers.Dense(128, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(num_labels, activation='sigmoid') # Sigmoid for multi-label classification
    ])
    print("Small audio CNN encoder built.")
    model.summary()
    return model

def train_audio_encoder(model, train_mel_spectrograms, train_labels, val_mel_spectrograms, val_labels, output_dir="models/audio_cnn_encoder"):
    """
    Trains the audio CNN encoder model.
    """
    model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])

    print("Starting training of audio CNN encoder...")
    model.fit(
        train_mel_spectrograms, train_labels,
        batch_size=BATCH_SIZE,
        epochs=EPOCHS,
        validation_data=(val_mel_spectrograms, val_labels)
    )
    print("Training complete.")

    os.makedirs(output_dir, exist_ok=True)
    model.save(output_dir + ".keras") # Save as Keras Native format
    print(f"Audio CNN encoder model saved to {output_dir}.keras")

def get_audio_embeddings_cnn_model(model, mel_spectrograms):
    """
    Generates embeddings for input mel-spectrograms using the CNN model.
    We'll use the output of the last Dense layer before the classification head as embeddings.
    """
    # Create a sub-model that outputs the layer before the classification head
    # (i.e., the Dense layer with 128 units)
    embedding_model = Model(inputs=model.inputs, outputs=model.layers[-2].output) # -2 for the Dense(128) layer
    embeddings = embedding_model.predict(mel_spectrograms)
    print(f"Generated audio embeddings from CNN model. Shape: {embeddings.shape}")
    return embeddings

if __name__ == "__main__":
    print("Running audio encoder development example:")

    # Placeholder for dummy audio data and labels
    # In a real scenario, you would load preprocessed RAVDESS/CREMA-D data.
    # The dummy data needs to match INPUT_SHAPE
    print("Creating dummy mel-spectrogram data for testing...")
    
    # Simulating multiple audio samples, each producing a mel-spectrogram of INPUT_SHAPE
    num_dummy_samples = 10
    dummy_mel_spectrograms = np.random.rand(num_dummy_samples, INPUT_SHAPE[0], INPUT_SHAPE[1], INPUT_SHAPE[2]).astype(np.float32)
    
    # Simulating multi-label emotion labels (e.g., 5 emotions)
    num_emotion_labels = 5 # Example: based on common emotion datasets
    dummy_labels = np.random.randint(0, 2, size=(num_dummy_samples, num_emotion_labels)).astype(np.float32)

    # Split data for training and validation
    train_mel_specs, val_mel_specs, train_labels, val_labels = train_test_split(
        dummy_mel_spectrograms, dummy_labels, test_size=0.3, random_state=42
    )

    num_labels = num_emotion_labels
    model = build_audio_cnn_encoder(num_labels)
    train_audio_encoder(model, train_mel_specs, train_labels, val_mel_specs, val_labels)

    # Test embedding generation
    sample_mel_specs = np.random.rand(2, INPUT_SHAPE[0], INPUT_SHAPE[1], INPUT_SHAPE[2]).astype(np.float32)
    embeddings = get_audio_embeddings_cnn_model(model, sample_mel_specs)
    print(f"Sample embeddings shape: {embeddings.shape}")
