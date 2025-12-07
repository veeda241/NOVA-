# emotional_ai_llm/data_ingestion.py

import os
import requests
import tarfile
import zipfile
import pandas as pd

# Define paths for raw and processed data
RAW_DATA_DIR = "data/raw"
PROCESSED_DATA_DIR = "data/processed"

def _ensure_dirs():
    """Ensures that the necessary data directories exist."""
    os.makedirs(RAW_DATA_DIR, exist_ok=True)
    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
    print(f"Ensured data directories: {RAW_DATA_DIR}, {PROCESSED_DATA_DIR}")

def download_goemotions(url="https://github.com/google-research/goemotions/raw/master/data/goemotions_1.csv"):
    """
    Downloads the GoEmotions dataset.
    """
    _ensure_dirs()
    print("GoEmotions dataset can be downloaded from the official Google Research GitHub repository.")
    print("Please visit: https://github.com/google-research/goemotions and download 'goemotions_1.csv' manually.")
    print(f"Place the downloaded file in the '{RAW_DATA_DIR}' directory.")
    # The direct download URL previously used:
    # url="https://github.com/google-research/goemotions/raw/master/data/goemotions_1.csv"
    # was not found (404 error).
    #
    # file_path = os.path.join(RAW_DATA_DIR, "goemotions_1.csv")
    # if os.path.exists(file_path):
    #     print(f"GoEmotions dataset already exists at {file_path}")
    #     return
    #
    # print(f"Downloading GoEmotions dataset from {url}...")
    # response = requests.get(url)
    # response.raise_for_status() # Raise an HTTPError for bad responses (4xx or 5xx)
    #
    # with open(file_path, 'wb') as f:
    #     f.write(response.content)
    # print(f"GoEmotions dataset downloaded to {file_path}")

def preprocess_goemotions():
    """
    Placeholder for preprocessing the GoEmotions dataset.
    """
    print("Preprocessing GoEmotions dataset (placeholder)...")
    # TODO: Implement actual preprocessing logic
    file_path = os.path.join(RAW_DATA_DIR, "goemotions_1.csv")
    if not os.path.exists(file_path):
        print("GoEmotions raw data not found. Please download first.")
        return

    df = pd.read_csv(file_path)
    # Example: select relevant columns, handle multi-label
    # For now, just save a sample
    processed_file_path = os.path.join(PROCESSED_DATA_DIR, "goemotions_processed_sample.csv")
    df.head().to_csv(processed_file_path, index=False)
    print(f"GoEmotions sample processed and saved to {processed_file_path}")

def download_meld_dataset():
    """
    Placeholder for downloading the MELD dataset.
    MELD requires registration/download from their official site.
    This function will provide instructions.
    """
    print("Downloading MELD dataset (instructions only):")
    print("MELD dataset usually requires downloading from the official website after registration.")
    print("Please visit: https://affective-meld.github.io/")
    print(f"Once downloaded, place the files in the '{RAW_DATA_DIR}/MELD' directory.")

def download_isear_dataset(url="https://www.unige.ch/cisa/research/materials-and-lab/materials-for-research/isear/"):
    """
    Downloads the ISEAR dataset (or provides instructions).
    """
    print(f"Downloading ISEAR dataset (manual download required from {url})")
    print(f"Please manually download the 'ISEAR-final.csv' or similar file and place it in '{RAW_DATA_DIR}/ISEAR'.")
    # Direct download link is not always stable, often behind forms.
    # Placeholder for direct download if a stable URL is found.

def download_ravdess_dataset():
    """
    Placeholder for downloading the RAVDESS dataset.
    RAVDESS requires downloading from their official site.
    """
    print("Downloading RAVDESS dataset (instructions only):")
    print("RAVDESS dataset requires downloading from the official website after agreeing to terms.")
    print("Please visit: https://smartlab.csc.fi/ravdess/")
    print(f"Once downloaded, place the files in the '{RAW_DATA_DIR}/RAVDESS' directory.")

def download_crema_d_dataset():
    """
    Placeholder for downloading the CREMA-D dataset.
    CREMA-D requires downloading from their official site.
    """
    print("Downloading CREMA-D dataset (instructions only):")
    print("CREMA-D dataset requires downloading from their official website after agreeing to terms.")
    print("Please visit: https://crema-d.net/")
    print(f"Once downloaded, place the files in the '{RAW_DATA_DIR}/CREMA-D' directory.")

def download_fer2013_dataset():
    """
    Placeholder for downloading the FER2013 dataset.
    FER2013 is often found on Kaggle.
    """
    print("Downloading FER2013 dataset (instructions only):")
    print("FER2013 dataset is commonly found on Kaggle. You may need a Kaggle API key or manual download.")
    print("Please visit: https://www.kaggle.com/datasets/msambare/fer2013")
    print(f"Once downloaded, place the files in the '{RAW_DATA_DIR}/FER2013' directory.")

def main():
    _ensure_dirs()
    # download_goemotions()
    # preprocess_goemotions()
    download_meld_dataset()
    download_isear_dataset()
    download_ravdess_dataset()
    download_crema_d_dataset()
    download_fer2013_dataset()

if __name__ == "__main__":
    main()
