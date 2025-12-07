# emotional_ai_llm/safety_layer.py

import re

class SafetyLayer:
    def __init__(self, crisis_keywords=None):
        """
        Initializes the SafetyLayer with a list of crisis-related keywords.

        Args:
            crisis_keywords (list, optional): A list of keywords/phrases to detect crisis language.
                                             If None, a default list will be used.
        """
        if crisis_keywords is None:
            self.crisis_keywords = [
                "kill myself", "end my life", "suicide", "self-harm", "hurt myself",
                "want to die", "can't go on", "goodbye world", "no reason to live",
                "take my own life", "cut myself", "starve myself", "overdose"
            ]
        else:
            self.crisis_keywords = crisis_keywords
        
        # Compile regex patterns for faster matching (case-insensitive)
        self.crisis_patterns = [re.compile(r'\b' + re.escape(kw) + r'\b', re.IGNORECASE) for kw in self.crisis_keywords]
        
        print(f"SafetyLayer initialized with {len(self.crisis_keywords)} crisis keywords.")

    def check_for_crisis_language(self, text):
        """
        Checks the input text for the presence of crisis-related language.

        Args:
            text (str): The input text (e.g., user input or generated response).

        Returns:
            tuple: (is_crisis, detected_keywords)
                   is_crisis (bool): True if crisis language is detected, False otherwise.
                   detected_keywords (list): A list of crisis keywords found in the text.
        """
        detected_keywords = []
        for pattern, keyword in zip(self.crisis_patterns, self.crisis_keywords):
            if pattern.search(text):
                detected_keywords.append(keyword)
        
        if detected_keywords:
            self._escalate_to_human(text, detected_keywords)
            return True, detected_keywords
        return False, []

    def _escalate_to_human(self, text, reason):
        """
        Placeholder method to simulate escalation to a human agent.
        In a real application, this would trigger an alert, create a support ticket, etc.

        Args:
            text (str): The text that triggered the crisis detection.
            reason (list): The detected crisis keywords.
        """
        print("\n--- CRISIS LANGUAGE DETECTED ---")
        print(f"Text: '{text}'")
        print(f"Reason (detected keywords): {', '.join(reason)}")
        print("ACTION: Escalating to human agent for immediate intervention.")
        print("--- END CRISIS ALERT ---\n")

if __name__ == "__main__":
    print("Running SafetyLayer module development example:")

    safety_checker = SafetyLayer()

    # Test cases
    test_texts = [
        "I'm feeling a bit down today.",
        "I just want to end my life, I can't take it anymore.",
        "I need help with self-harm, I don't know what to do.",
        "This is a lovely day, I'm so happy.",
        "Sometimes I feel like I want to die.",
        "I'm going to hurt myself if things don't change soon.",
        "I feel so overwhelmed, I wish I could disappear.", # No direct crisis keyword
        "I'm thinking about suicide."
    ]

    for i, text in enumerate(test_texts):
        print(f"\n--- Test Case {i+1} ---")
        print(f"Input text: '{text}'")
        is_crisis, keywords = safety_checker.check_for_crisis_language(text)
        if is_crisis:
            print(f"Result: CRISIS DETECTED. Keywords: {', '.join(keywords)}")
        else:
            print("Result: No crisis language detected.")
    
    print("\nSafetyLayer module development example finished.")
