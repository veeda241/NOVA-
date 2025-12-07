# emotional_ai_llm/utils.py

import pandas as pd
import librosa
import librosa.display
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.text import Tokenizer
from tensorflow.keras.preprocessing.sequence import pad_sequences
import os

def load_text_data(filepath, text_column, label_columns):
    """
    Loads text data from a CSV file.

    Args:
        filepath (str): Path to the CSV file.
        text_column (str): Name of the column containing text data.
        label_columns (list): List of column names containing emotion labels.

    Returns:
        tuple: (texts, labels_one_hot) where texts is a list of strings
               and labels_one_hot is a numpy array of one-hot encoded labels.
    """
    try:
        df = pd.read_csv(filepath)
        texts = df[text_column].tolist()
        labels_df = df[label_columns]
        labels_one_hot = labels_df.values.astype(float) # Ensure float for Keras
        print(f"Loaded text data from {filepath}. Samples: {len(texts)}")
        return texts, labels_one_hot
    except FileNotFoundError:
        print(f"Error: File not found at {filepath}")
        return None, None
    except KeyError as e:
        print(f"Error: Missing column {e} in {filepath}")
        return None, None

def create_text_tokenizer(texts, num_words=None):
    """
    Creates and fits a Keras Tokenizer on the provided texts.

    Args:
        texts (list): List of text strings.
        num_words (int, optional): The maximum number of words to keep, based on word frequency.
                                   Only the most common `num_words-1` words will be kept.
                                   Defaults to None (all words).

    Returns:
        Tokenizer: Fitted Keras Tokenizer.
    """
    tokenizer = Tokenizer(num_words=num_words, oov_token="<unk>")
    tokenizer.fit_on_texts(texts)
    print(f"Tokenizer fitted. Total unique tokens: {len(tokenizer.word_index)}")
    return tokenizer

def texts_to_sequences_and_pad(tokenizer, texts, max_len):
    """
    Converts texts to sequences and pads them to a fixed length.

    Args:
        tokenizer (Tokenizer): Fitted Keras Tokenizer.
        texts (list): List of text strings.
        max_len (int): Maximum sequence length.

    Returns:
        np.array: Padded sequences.
    """
    sequences = tokenizer.texts_to_sequences(texts)
    padded_sequences = pad_sequences(sequences, maxlen=max_len, padding='post', truncating='post')
    print(f"Texts converted to sequences and padded to length {max_len}.")
    return padded_sequences

def extract_mel_spectrogram(audio_path, sr=22050, n_mels=128, hop_length=512):
    """
    Extracts mel-spectrogram features from an audio file.

    Args:
        audio_path (str): Path to the audio file.
        sr (int): Sampling rate.
        n_mels (int): Number of Mel bands to generate.
        hop_length (int): The number of samples between successive frames.

    Returns:
        np.array: Mel-spectrogram.
    """
    try:
        y, sr = librosa.load(audio_path, sr=sr)
        mel_spectrogram = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=n_mels, hop_length=hop_length)
        mel_spectrogram_db = librosa.power_to_db(mel_spectrogram, ref=np.max)
        print(f"Extracted mel-spectrogram from {os.path.basename(audio_path)}. Shape: {mel_spectrogram_db.shape}")
        return mel_spectrogram_db
    except FileNotFoundError:
        print(f"Error: Audio file not found at {audio_path}")
        return None
    except Exception as e:
        print(f"Error extracting mel-spectrogram from {audio_path}: {e}")
        return None

def extract_facial_embeddings_placeholder(image_path):
    """
    Placeholder for extracting facial expression embeddings from an image.
    This will eventually involve face detection and feature extraction using a pre-trained model.

    Args:
        image_path (str): Path to the image file.

    Returns:
        np.array: Placeholder for facial embeddings (e.g., random vector).
    """
    print(f"Extracting facial embeddings from {os.path.basename(image_path)} (placeholder)...")
    # TODO: Integrate actual face detection and emotion embedding model here
    # For now, return a random vector as a placeholder
    return np.random.rand(128) # Example: 128-dim embedding

if __name__ == "__main__":
    # Example usage (will only work if data is manually placed)
    print("Running utility functions example:")

    # --- Text Data Example (GoEmotions) ---
    goemotions_path = os.path.join("data", "raw", "goemotions_1.csv")
    # Make sure to manually download goemotions_1.csv into data/raw/
    # For now, create a dummy file for testing the load function
    if not os.path.exists(goemotions_path):
        print(f"Creating a dummy GoEmotions CSV for testing: {goemotions_path}")
        dummy_df = pd.DataFrame({
            'text': ["I am happy today.", "This is so sad.", "I feel angry.", "I am surprised!"],
            'admiration': [0, 0, 0, 0],
            'amusement': [1, 0, 0, 0],
            'anger': [0, 0, 1, 0],
            'annoyance': [0, 0, 0, 0],
            'approval': [0, 0, 0, 0],
            'disappointment': [0, 0, 0, 0],
            'disgust': [0, 0, 0, 0],
            'excitement': [0, 0, 0, 1],
            'fear': [0, 0, 0, 0],
            'gratitude': [0, 0, 0, 0],
            'grief': [0, 1, 0, 0],
            'joy': [1, 0, 0, 0],
            'love': [0, 0, 0, 0],
            'optimism': [0, 0, 0, 0],
            'pride': [0, 0, 0, 0],
            'realization': [0, 0, 0, 0],
            'relief': [0, 0, 0, 0],
            'remorse': [0, 0, 0, 0],
            'sadness': [0, 1, 0, 0],
            'surprise': [0, 0, 0, 1],
            'neutral': [0, 0, 0, 0],
        })
        # Add more columns as per actual GoEmotions dataset if needed for full test
        dummy_df.to_csv(goemotions_path, index=False)
        print("Dummy GoEmotions CSV created.")


    goemotions_labels = ['admiration', 'amusement', 'anger', 'annoyance', 'approval',
                         'disappointment', 'disgust', 'excitement', 'fear', 'gratitude',
                         'grief', 'joy', 'love', 'optimism', 'pride', 'realization', 'relief',
                         'remorse', 'sadness', 'surprise', 'neutral'] # Example subset, complete list needed for actual

    texts, labels = load_text_data(goemotions_path, 'text', goemotions_labels)
    if texts is not None:
        tokenizer = create_text_tokenizer(texts, num_words=1000)
        padded_sequences = texts_to_sequences_and_pad(tokenizer, texts, max_len=20)
        print(f"Padded sequences shape: {padded_sequences.shape}")
        print(f"Labels shape: {labels.shape}")

    # --- Audio Data Example ---
    # Requires a dummy audio file. For simplicity, we'll just demonstrate the function call.
    # If you have a .wav file, place it in data/raw/audio_test.wav
    dummy_audio_path = os.path.join("data", "raw", "audio_test.wav")
    if not os.path.exists(os.path.dirname(dummy_audio_path)):
        os.makedirs(os.path.dirname(dummy_audio_path), exist_ok=True)
    if not os.path.exists(dummy_audio_path):
        print(f"Please place a dummy audio file (e.g., audio_test.wav) in {os.path.dirname(dummy_audio_path)} for audio utility testing.")
    else:
        mel_spec = extract_mel_spectrogram(dummy_audio_path)
        if mel_spec is not None:
            print(f"Mel-spectrogram shape: {mel_spec.shape}")

    # --- Vision Data Example ---
    # Requires a dummy image file. For simplicity, demonstrate the function call.
    # If you have a .jpg file, place it in data/raw/image_test.jpg
    dummy_image_path = os.path.join("data", "raw", "image_test.jpg")
    if not os.path.exists(os.path.dirname(dummy_image_path)):
        os.makedirs(os.path.dirname(dummy_image_path), exist_ok=True)
    if not os.path.exists(dummy_image_path):
        print(f"Please place a dummy image file (e.g., image_test.jpg) in {os.path.dirname(dummy_image_path)} for vision utility testing.")
    else:
        facial_embed = extract_facial_embeddings_placeholder(dummy_image_path)
        if facial_embed is not None:
            print(f"Facial embedding shape: {facial_embed.shape}")