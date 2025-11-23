# emotional_ai_llm/text_encoder.py

import tensorflow as tf
from tensorflow.keras import layers, Model
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
from sklearn.model_selection import train_test_split
import numpy as np
import os
from .utils import load_text_data, create_text_tokenizer, texts_to_sequences_and_pad

# Define constants
MAX_LEN = 128
VOCAB_SIZE = 10000 # Max number of words to keep in tokenizer
EMBEDDING_DIM = 100 # Reduced embedding dimension for a simpler CNN
FILTERS = 128
KERNEL_SIZE = 5
BATCH_SIZE = 32
EPOCHS = 3

def build_cnn_text_encoder(num_labels):
    """
    Builds a simple Convolutional Neural Network (CNN) for text emotion classification.
    """
    model = tf.keras.Sequential([
        layers.Embedding(VOCAB_SIZE, EMBEDDING_DIM, input_length=MAX_LEN),
        layers.Conv1D(FILTERS, KERNEL_SIZE, activation='relu'),
        layers.GlobalMaxPooling1D(),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.5),
        layers.Dense(num_labels, activation='sigmoid') # Sigmoid for multi-label classification
    ])
    print("Simple CNN text encoder built.")
    model.summary()
    return model

def train_text_encoder(model, train_sequences, train_labels, val_sequences, val_labels, output_dir="models/cnn_text_encoder"):
    """
    Trains the CNN text encoder model.
    """
    model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])

    print("Starting training of CNN text encoder...")
    model.fit(
        train_sequences, train_labels,
        batch_size=BATCH_SIZE,
        epochs=EPOCHS,
        validation_data=(val_sequences, val_labels)
    )
    print("Training complete.")

    os.makedirs(output_dir, exist_ok=True)
    model.save(output_dir + ".keras") # Save as Keras Native format
    print(f"CNN text encoder model saved to {output_dir}")

def get_cnn_text_embeddings(model, sequences):
    """
    Generates embeddings for input sequences using the CNN model.
    We'll use the output of the GlobalMaxPooling1D layer as embeddings.
    """
    # Create a sub-model that outputs the GlobalMaxPooling1D layer's output
    # The GlobalMaxPooling1D layer is at index 2 (0:Embedding, 1:Conv1D, 2:GlobalMaxPooling1D)
    embedding_model = Model(inputs=model.inputs, outputs=model.layers[2].output)
    embeddings = embedding_model.predict(sequences)
    print(f"Generated text embeddings from CNN model. Shape: {embeddings.shape}")
    return embeddings

if __name__ == "__main__":
    print("Running CNN text encoder development example:")

    # Assume dummy goemotions_1.csv is created by utils.py example
    goemotions_path = os.path.join("data", "raw", "goemotions_1.csv")

    # Define GoEmotions labels - make sure this matches the dummy data or actual data
    dummy_goemotions_labels = ['admiration', 'amusement', 'anger', 'annoyance', 'approval',
                               'disappointment', 'disgust', 'excitement', 'fear', 'gratitude',
                               'grief', 'joy', 'love', 'optimism', 'pride', 'realization', 'relief',
                               'remorse', 'sadness', 'surprise', 'neutral']

    texts, labels = load_text_data(goemotions_path, 'text', dummy_goemotions_labels)

    if texts is not None:
        num_labels = labels.shape[1]

        # Tokenize and pad texts
        tokenizer = create_text_tokenizer(texts, num_words=VOCAB_SIZE)
        sequences = texts_to_sequences_and_pad(tokenizer, texts, MAX_LEN)

        # Split data for training and validation
        train_sequences, val_sequences, train_labels, val_labels = train_test_split(
            sequences, labels, test_size=0.2, random_state=42
        )

        model = build_cnn_text_encoder(num_labels)
        train_text_encoder(model, train_sequences, train_labels, val_sequences, val_labels)

        # Test embedding generation
        sample_texts = ["This is a test sentence.", "I am very happy with this result."]
        sample_sequences = texts_to_sequences_and_pad(tokenizer, sample_texts, MAX_LEN)
        embeddings = get_cnn_text_embeddings(model, sample_sequences)
        print(f"Sample embeddings shape: {embeddings.shape}")
