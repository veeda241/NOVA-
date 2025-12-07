from transformers import pipeline
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

class TextEmotionAnalyzer:
    def __init__(self):
        logging.info("Loading NLP-based emotion analysis pipeline...")
        try:
            # Use a small, fast model for emotion detection
            self.nlp_pipeline = pipeline(
                "text-classification", 
                model="j-hartmann/emotion-english-distilroberta-base", 
                top_k=None # Return all scores
            )
            logging.info("NLP emotion pipeline loaded successfully.")
        except Exception as e:
            logging.error(f"Failed to load NLP emotion pipeline: {e}")
            self.nlp_pipeline = None

    def get_emotion_probabilities(self, text):
        """
        Analyzes text and returns a dictionary of emotion probabilities.
        Matches the emotion labels used in the project where possible.
        """
        if not self.nlp_pipeline or not text:
            return {}

        try:
            results = self.nlp_pipeline(text)[0] # List of dicts [{'label': 'joy', 'score': 0.9}, ...]
            
            # Map model labels to our project labels
            # Project labels: anger, disgust, fear, happy, sad, surprise, neutral
            # Model labels: anger, disgust, fear, joy, sadness, surprise, neutral
            label_map = {
                'joy': 'happy',
                'sadness': 'sad'
            }
            
            emotion_probs = {}
            for res in results:
                label = res['label']
                mapped_label = label_map.get(label, label)
                emotion_probs[mapped_label] = res['score']
            
            return emotion_probs
        except Exception as e:
            logging.error(f"Error in NLP emotion analysis: {e}")
            return {}

if __name__ == "__main__":
    analyzer = TextEmotionAnalyzer()
    print(analyzer.get_emotion_probabilities("I lost the hackathon and I feel terrible."))
