# emotional_ai_llm/emotional_ai_llm/reporter.py

import os
import json
import datetime

class Reporter:
    def __init__(self, log_dir="logs", log_file="interactions.json"):
        """
        Initializes the Reporter for logging interaction data to a JSON file.

        Args:
            log_dir (str): Directory to store log files.
            log_file (str): Name of the JSON log file.
        """
        self.log_dir = log_dir
        self.log_file_path = os.path.join(log_dir, log_file)
        os.makedirs(log_dir, exist_ok=True)
        
        # Ensure the log file exists and is a valid JSON array
        if not os.path.exists(self.log_file_path):
            with open(self.log_file_path, 'w') as f:
                json.dump([], f)
        print(f"Reporter initialized. Logs will be stored in: {self.log_file_path}")

    def log_interaction(self, interaction_data):
        """
        Logs a single interaction to the JSON file.

        Args:
            interaction_data (dict): A dictionary containing details of the interaction, e.g.:
                                     {
                                         "timestamp": "ISO_FORMAT_DATETIME",
                                         "user_input": "...",
                                         "ai_response": "...",
                                         "dominant_emotions": "...",
                                         "suggested_actions": ["..."],
                                         "safety_flag_user_input": False,
                                         "safety_flag_ai_response": False,
                                         "crisis_keywords_user": ["..."],
                                         "crisis_keywords_ai": ["..."]
                                     }
        """
        # Add timestamp if not already present
        if "timestamp" not in interaction_data:
            interaction_data["timestamp"] = datetime.datetime.now().isoformat()

        try:
            with open(self.log_file_path, 'r+') as f:
                logs = json.load(f)
                logs.append(interaction_data)
                f.seek(0) # Rewind to the beginning
                json.dump(logs, f, indent=4)
                f.truncate() # Truncate any remaining old content
            print("Interaction logged successfully.")
        except Exception as e:
            print(f"Error logging interaction: {e}")

    def get_all_logs(self):
        """
        Retrieves all logged interactions.

        Returns:
            list: A list of dictionaries, each representing an interaction.
        """
        try:
            with open(self.log_file_path, 'r') as f:
                logs = json.load(f)
            return logs
        except FileNotFoundError:
            return []
        except Exception as e:
            print(f"Error retrieving logs: {e}")
            return []

    def clear_logs(self):
        """
        Clears all interaction logs.
        """
        try:
            with open(self.log_file_path, 'w') as f:
                json.dump([], f)
            print("All interaction logs cleared.")
        except Exception as e:
            print(f"Error clearing logs: {e}")

if __name__ == "__main__":
    print("Running Reporter module development example:")

    reporter = Reporter(log_file="test_interactions.json")

    # Log some dummy interactions
    reporter.log_interaction({
        "user_input": "I am feeling very happy today!",
        "ai_response": "That's wonderful to hear!",
        "dominant_emotions": "happy",
        "suggested_actions": ["Share your joy"],
        "safety_flag_user_input": False,
        "safety_flag_ai_response": False
    })

    reporter.log_interaction({
        "user_input": "I just want to end my life.",
        "ai_response": "I'm here for you. Please hold while I connect you to a human expert.",
        "dominant_emotions": "sad, suicidal",
        "suggested_actions": ["Human escalation triggered"],
        "safety_flag_user_input": True,
        "safety_flag_ai_response": False
    })

    # Retrieve and print logs
    print("\nAll Logs:")
    all_logs = reporter.get_all_logs()
    for log in all_logs:
        print(json.dumps(log, indent=2))

    # Clear logs and verify
    print("\nClearing logs:")
    reporter.clear_logs()
    print(f"Logs after clearing: {reporter.get_all_logs()}")

    print("\nReporter module development example finished.")
