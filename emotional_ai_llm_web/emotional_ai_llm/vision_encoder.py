# emotional_ai_llm/vision_encoder.py

import tensorflow as tf
from tensorflow.keras import layers, Model
from tensorflow.keras.applications import MobileNetV2
from sklearn.model_selection import train_test_split
import numpy as np
import os
# from utils import preprocess_image (Placeholder if needed later for actual image loading)

# Define constants for vision encoder
IMG_HEIGHT = 128
IMG_WIDTH = 128
IMG_CHANNELS = 3
INPUT_SHAPE = (IMG_HEIGHT, IMG_WIDTH, IMG_CHANNELS)
BATCH_SIZE = 32
EPOCHS = 3

def build_mobilenet_vision_encoder(num_labels):
    """
    Builds a vision encoder using MobileNetV2 as a base and adds a custom classification head.
    Attempts to load ImageNet weights, falls back to random initialization if weights cannot be loaded.
    """
    try:
        base_model = MobileNetV2(
            input_shape=INPUT_SHAPE,
            include_top=False, # Don't include the ImageNet classifier at the top
            weights='imagenet' # Try to load pre-trained ImageNet weights
        )
        print("MobileNetV2 base model loaded with ImageNet weights.")
    except Exception as e:
        print(f"Warning: Could not load MobileNetV2 with ImageNet weights due to: {e}")
        print("Initializing MobileNetV2 base model with random weights.")
        base_model = MobileNetV2(
            input_shape=INPUT_SHAPE,
            include_top=False,
            weights=None # Fallback to random initialization
        )

    base_model.trainable = False # Freeze the base model for feature extraction

    inputs = tf.keras.Input(shape=INPUT_SHAPE)
    x = tf.keras.applications.mobilenet_v2.preprocess_input(inputs) # Standard MobileNetV2 preprocessing
    x = base_model(x, training=False) # Ensure base model runs in inference mode
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dropout(0.5)(x)
    x = layers.Dense(128, activation='relu')(x) # Embedding layer
    x = layers.Dropout(0.5)(x)
    outputs = layers.Dense(num_labels, activation='sigmoid')(x) # Sigmoid for multi-label classification

    model = Model(inputs, outputs)
    print("MobileNetV2-based vision encoder built.")
    model.summary()
    return model

def train_vision_encoder(model, train_images, train_labels, val_images, val_labels, output_dir="models/vision_mobilenet_encoder"):
    """
    Trains the vision encoder model.
    """
    model.compile(optimizer="adam", loss="binary_crossentropy", metrics=["accuracy"])

    print("Starting training of vision encoder...")
    model.fit(
        train_images, train_labels,
        batch_size=BATCH_SIZE,
        epochs=EPOCHS,
        validation_data=(val_images, val_labels)
    )
    print("Training complete.")

    os.makedirs(output_dir, exist_ok=True)
    model.save(output_dir + ".keras") # Save as Keras Native format
    print(f"Vision encoder model saved to {output_dir}.keras")

def get_vision_embeddings(model, images):
    """
    Generates embeddings for input images using the vision encoder model.
    We'll use the output of the Dense layer before the classification head as embeddings.
    """
    # Create a sub-model that outputs the Dense(128) layer's output
    embedding_model = Model(inputs=model.inputs, outputs=model.layers[-2].output) # -2 for the Dense(128) layer
    embeddings = embedding_model.predict(images)
    print(f"Generated vision embeddings. Shape: {embeddings.shape}")
    return embeddings

if __name__ == "__main__":
    print("Running vision encoder development example:")

    # Generate dummy image data and labels
    print("Creating dummy image data for testing...")
    num_dummy_samples = 10
    dummy_images = np.random.rand(num_dummy_samples, IMG_HEIGHT, IMG_WIDTH, IMG_CHANNELS).astype(np.float32)
    
    # Simulating multi-label emotion labels (e.g., 7 facial expressions for FER2013)
    num_emotion_labels = 7 # Example: angry, disgust, fear, happy, sad, surprise, neutral
    dummy_labels = np.random.randint(0, 2, size=(num_dummy_samples, num_emotion_labels)).astype(np.float32)

    # Split data for training and validation
    train_images, val_images, train_labels, val_labels = train_test_split(
        dummy_images, dummy_labels, test_size=0.3, random_state=42
    )

    num_labels = num_emotion_labels
    model = build_mobilenet_vision_encoder(num_labels)
    train_vision_encoder(model, train_images, train_labels, val_images, val_labels)

    # Test embedding generation
    sample_images = np.random.rand(2, IMG_HEIGHT, IMG_WIDTH, IMG_CHANNELS).astype(np.float32)
    embeddings = get_vision_embeddings(model, sample_images)
    print(f"Sample embeddings shape: {embeddings.shape}")
