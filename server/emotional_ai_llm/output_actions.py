# emotional_ai_llm/output_actions.py

import pyttsx3
import random
import numpy as np

class OutputActions:
    def __init__(self):
        """
        Initializes the OutputActions module, including the TTS engine.
        """
        try:
            self.tts_engine = pyttsx3.init()
            # Optional: Configure TTS properties (e.g., speed, voice)
            # self.tts_engine.setProperty('rate', 150) # Speed
            # voices = self.tts_engine.getProperty('voices')
            # self.tts_engine.setProperty('voice', voices[0].id) # Select a voice
            print("pyttsx3 TTS engine initialized.")
        except Exception as e:
            self.tts_engine = None
            print(f"Warning: pyttsx3 initialization failed: {e}. TTS output will be unavailable.")
        
        # Define some generic actions based on emotional states
        self.action_suggestions = {
            "sad": ["Suggest taking a break.", "Recommend talking to a friend or family member.", "Suggest listening to calming music."],
            "angry": ["Suggest deep breathing exercises.", "Recommend stepping away from the situation.", "Encourage identifying the source of frustration."],
            "fear": ["Suggest focusing on grounding techniques.", "Recommend seeking reassurance.", "Encourage understanding the source of fear."],
            "happy": ["Encourage sharing the joy.", "Suggest reflecting on what made them happy.", "Recommend continuing positive activities."],
            "neutral": ["Suggest exploring thoughts further.", "Offer open-ended questions to encourage expression.", "Maintain a supportive presence."]
        }
        print("OutputActions module initialized.")

    def generate_text_response(self, text):
        """
        Simply returns the generated text response.
        """
        print(f"Text Response Generated: '{text}'")
        return text

    def generate_tts_output(self, text):
        """
        Converts the given text to speech using pyttsx3.
        """
        if self.tts_engine:
            try:
                print(f"Generating TTS output: '{text}'")
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
                return True
            except Exception as e:
                print(f"Error generating TTS output: {e}")
                return False
        else:
            print("TTS engine not initialized. Cannot generate speech output.")
            return False

    def suggest_actions(self, emotion_probabilities, emotion_labels, conversation_context=None):
        """
        Suggests actions based on the detected emotion probabilities and conversation context.
        """
        dominant_emotion_index = np.argmax(emotion_probabilities)
        dominant_emotion = emotion_labels[dominant_emotion_index]
        
        suggestions = self.action_suggestions.get(dominant_emotion.lower(), self.action_suggestions["neutral"])
        
        print(f"Suggested Actions (based on dominant emotion '{dominant_emotion}'):")
        for suggestion in suggestions:
            print(f"- {suggestion}")
        
        return suggestions

    def escalate_to_human(self, reason, text_to_escalate=None):
        """
        Placeholder method for escalating to a human agent.
        This would typically involve logging, creating a ticket, etc.
        """
        print("\n--- HUMAN ESCALATION TRIGGERED ---")
        print(f"Reason: {reason}")
        if text_to_escalate:
            print(f"Text: '{text_to_escalate}'")
        print("Action: Notifying human agent for review.")
        print("--- END ESCALATION ---\n")
        return True

if __name__ == "__main__":
    print("Running OutputActions module development example:")

    output_handler = OutputActions()

    # --- Test 1: Text Response ---
    print("\n--- Test Case 1: Text Response ---")
    text_to_respond = "I understand you\'re feeling a bit overwhelmed, but remember to take things one step at a time."
    output_handler.generate_text_response(text_to_respond)

    # --- Test 2: TTS Output ---
    print("\n--- Test Case 2: TTS Output ---")
    # This will only work if pyttsx3 initialized successfully
    output_handler.generate_tts_output("This is a test of the text-to-speech functionality.")

    # --- Test 3: Action Suggestions ---
    print("\n--- Test Case 3: Action Suggestions ---")
    # Dummy emotion probabilities and labels (matching ResponsePlanner's example)
    EMOTION_LABELS = ['anger', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral']
    emotion_probs_sad = np.array([0.1, 0.05, 0.05, 0.1, 0.8, 0.05, 0.1]) # Dominant: sad
    output_handler.suggest_actions(emotion_probs_sad, EMOTION_LABELS)

    emotion_probs_happy = np.array([0.05, 0.05, 0.05, 0.8, 0.1, 0.05, 0.1]) # Dominant: happy
    output_handler.suggest_actions(emotion_probs_happy, EMOTION_LABELS)

    # --- Test 4: Human Escalation ---
    print("\n--- Test Case 4: Human Escalation ---")
    output_handler.escalate_to_human(reason="Crisis language detected", text_to_escalate="I want to end it all.")

    print("\nOutputActions module development example finished.")
