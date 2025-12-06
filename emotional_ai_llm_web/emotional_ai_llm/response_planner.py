# emotional_ai_llm/response_planner.py

import numpy as np
import random
import logging
from transformers import BlenderbotTokenizer, BlenderbotForConditionalGeneration
import torch
import os

class ResponsePlanner:
    def __init__(self, emotion_labels, detection_threshold=0.5):
        """
        Initializes the ResponsePlanner with a dedicated Chat SLM (BlenderBot).
        """
        self.emotion_labels = emotion_labels
        self.detection_threshold = detection_threshold
        
        # Switch to BlenderBot - a model specifically trained for interactive, friendly chat
        self.model_name = "facebook/blenderbot-400M-distill"

        logging.info(f"Loading Chat SLM: {self.model_name}")
        try:
            self.tokenizer = BlenderbotTokenizer.from_pretrained(self.model_name)
            self.model = BlenderbotForConditionalGeneration.from_pretrained(self.model_name)
            logging.info("Chat SLM loaded successfully.")
        except Exception as e:
            logging.error(f"Failed to load Chat SLM: {e}")
            raise

        # --- Therapist Persona Layers ---
        # We will still use these to wrap the chat model's output, 
        # ensuring the "Patient Stability" goal is met even if the model is just "chatty".
        self.empathetic_intros = {
            'sad': [
                "I hear how heavy things are for you right now.",
                "It's completely understandable that you'd feel this way.",
                "I'm listening, and I care about what you're going through.",
                "Thank you for sharing that with me. It sounds tough.",
            ],
            'anger': [
                "It sounds like you're carrying a lot of frustration.",
                "I can hear the anger in your words, and it's valid.",
                "That sounds incredibly unfair and frustrating.",
                "I'm here to listen to all of that anger.",
            ],
            'fear': [
                "That sounds really scary.",
                "I'm here with you. You're safe to express this fear.",
                "It makes sense to feel anxious about that.",
                "Let's take a moment. I'm listening.",
            ],
            'happy': [
                "It's wonderful to see you feeling this way!",
                "That brings a warmth to our conversation.",
                "I'm so glad to hear some positive news.",
            ],
            'surprise': [
                "That definitely sounds unexpected.",
                "Wow, I can see why that would surprise you.",
            ],
            'neutral': [
                "I'm listening.",
                "I'm here with you.",
                "Go on, I'm ready to hear more.",
            ]
        }
        
        self.supportive_closings = [
            "How does that feel to say out loud?",
            "What do you think would help you most right now?",
            "I'm here. Would you like to tell me more?",
            "We can take this at your own pace. What's on your mind?",
            "How can I support you in this moment?",
        ]

    def _get_dominant_emotions(self, emotion_probabilities):
        """Identifies dominant emotions."""
        dominant_emotions = []
        for i, prob in enumerate(emotion_probabilities):
            if prob > self.detection_threshold:
                dominant_emotions.append(self.emotion_labels[i])
        
        if not dominant_emotions:
            max_prob_idx = np.argmax(emotion_probabilities)
            dominant_emotions.append(self.emotion_labels[max_prob_idx])
        
        return ", ".join(dominant_emotions) if dominant_emotions else "neutral"
    
    def _construct_therapist_response(self, primary_emotion, chat_model_response):
        """
        Wraps the Chat SLM's response in a 'Therapist Persona'.
        """
        # 1. Validation (The Intro)
        intros = self.empathetic_intros.get(primary_emotion, self.empathetic_intros['neutral'])
        intro = random.choice(intros)
        
        # 2. The Chat (The Model's Content)
        # BlenderBot is good, but sometimes we want to soften it or ensure it fits.
        # For now, we trust the model's "chat" ability.
        content = chat_model_response.strip()
        if content and content[0].islower():
            content = content[0].upper() + content[1:]
            
        # 3. The Invitation (The Closing)
        closing = random.choice(self.supportive_closings)
        
        return f"{intro} {content} {closing}"

    def generate_empathetic_response(self, user_input_text, current_emotion_probabilities, conversation_context_vector, user_facial_emotion: str = "neutral"):
        """
        Generates a response using the Chat SLM (BlenderBot), influenced by the Analysis SLM (Emotion Detector).
        """
        # 1. ANALYSIS LAYER (From your other "SLM")
        dominant_emotions_str = self._get_dominant_emotions(current_emotion_probabilities)
        primary_emotion = dominant_emotions_str.split(',')[0].strip() if dominant_emotions_str else "neutral"
        
        logging.info(f"Chat Planner received Analysis: Emotion='{primary_emotion}'")

        # 2. CHAT LAYER (The Interactive SLM)
        try:
            # --- INTERCONNECTION: Analysis SLM -> Chat SLM ---
            # Explicitly tell the Chat SLM about the detected emotion to guide its response.
            # This "mingles" the two models: Analysis sets the context, Chat generates the content.
            augmented_input = user_input_text
            if primary_emotion in ['sad', 'anger', 'fear', 'happy', 'disgust']:
                # Prepend the emotion as a statement so BlenderBot responds to it
                augmented_input = f"I feel {primary_emotion}. {user_input_text}"
                logging.info(f"Augmented Input for Chat SLM: '{augmented_input}'")

            inputs = self.tokenizer([augmented_input], return_tensors="pt")
            
            reply_ids = self.model.generate(
                **inputs,
                max_length=128,
                do_sample=True,
                top_p=0.9,      # Nucleus sampling for more natural text
                temperature=0.8 # Slight creativity
            )
            
            chat_response = self.tokenizer.batch_decode(reply_ids, skip_special_tokens=True)[0]
            logging.info(f"Chat SLM Raw Output: {chat_response}")
            
            # 3. STABILIZATION LAYER (Therapist Wrapper)
            # We take the "friendly chat" from the SLM and wrap it in "emotional stability" logic.
            final_response = self._construct_therapist_response(primary_emotion, chat_response)
            
        except Exception as e:
            logging.error(f"Error in Chat SLM: {e}")
            final_response = "I'm here with you. I'm having a little trouble finding the right words, but I'm listening. Please continue."

        return final_response

if __name__ == "__main__":
    print("Initializing Chat SLM (BlenderBot)...")
    # Dummy labels
    labels = ['anger', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
    planner = ResponsePlanner(labels)
    
    print("\n--- Test Interaction ---")
    user_text = "I lost the game and I feel terrible."
    # Simulate 'sad' emotion detected by Analysis SLM
    probs = np.array([0.05, 0.05, 0.05, 0.05, 0.7, 0.05, 0.05]) 
    
    resp = planner.generate_empathetic_response(user_text, probs, None)
    print(f"User: {user_text}")
    print(f"AI: {resp}")