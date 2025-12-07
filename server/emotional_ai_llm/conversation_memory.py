# emotional_ai_llm/conversation_memory.py

import numpy as np
from collections import deque

class ConversationMemory:
    def __init__(self, max_memory_length=10, embedding_dim=384):
        """
        Initializes the conversation memory.

        Args:
            max_memory_length (int): The maximum number of context vectors to store.
            embedding_dim (int): The dimension of the context vectors (multimodal embeddings).
        """
        self.max_memory_length = max_memory_length
        self.embedding_dim = embedding_dim
        self.memory = deque(maxlen=max_memory_length)
        print(f"ConversationMemory initialized with max length {max_memory_length} and embedding dim {embedding_dim}.")

    def add_context(self, context_vector):
        """
        Adds a new context vector to the memory.
        Ensures the context vector has the correct dimension.

        Args:
            context_vector (np.array): A numpy array representing the multimodal embedding
                                       for the current turn.
        """
        if context_vector.shape != (self.embedding_dim,):
            raise ValueError(
                f"Context vector dimension mismatch. Expected {self.embedding_dim}, got {context_vector.shape[0]}"
            )
        self.memory.append(context_vector)
        print(f"Added context to memory. Current size: {len(self.memory)}")

    def get_weighted_context(self, num_recent_turns=None):
        """
        Retrieves a recency-weighted average of past context vectors.
        More recent turns are given higher weights.

        Args:
            num_recent_turns (int, optional): The number of most recent turns to consider.
                                              If None, considers all stored turns.

        Returns:
            np.array: A numpy array representing the recency-weighted average context vector.
                      Returns an array of zeros if memory is empty.
        """
        if not self.memory:
            return np.zeros(self.embedding_dim, dtype=np.float32)

        turns_to_consider = list(self.memory)[-num_recent_turns:] if num_recent_turns is not None else list(self.memory)
        
        if not turns_to_consider: # Edge case if num_recent_turns is 0 or less than available
            return np.zeros(self.embedding_dim, dtype=np.float32)

        weights = np.array([i + 1 for i in range(len(turns_to_consider))])
        weights = weights / np.sum(weights)  # Normalize weights to sum to 1

        weighted_sum = np.zeros(self.embedding_dim, dtype=np.float32)
        for i, vec in enumerate(turns_to_consider):
            weighted_sum += vec * weights[i]
        
        print(f"Retrieved weighted context from {len(turns_to_consider)} turns.")
        return weighted_sum

    def clear_memory(self):
        """
        Clears all context vectors from the memory.
        """
        self.memory.clear()
        print("ConversationMemory cleared.")

if __name__ == "__main__":
    print("Running ConversationMemory module development example:")

    # Define parameters
    EMBED_DIM = 384
    MAX_LEN = 5
    NUM_TURNS = 7 # Number of dummy turns to simulate

    # Initialize memory
    memory = ConversationMemory(max_memory_length=MAX_LEN, embedding_dim=EMBED_DIM)

    # Add dummy context vectors
    print("\nAdding dummy context vectors:")
    for i in range(NUM_TURNS):
        dummy_vector = np.random.rand(EMBED_DIM).astype(np.float32)
        memory.add_context(dummy_vector)
        if i >= MAX_LEN - 1:
            print(f"Memory full, old contexts being removed. Current size: {len(memory.memory)}")
    
    print(f"\nMemory contents (last {len(memory.memory)}):")
    for i, vec in enumerate(memory.memory):
        print(f"  Turn {i+1}: {vec[:5]}...") # Print first 5 elements for brevity

    # Retrieve weighted context (all turns in memory)
    print("\nRetrieving weighted context (all turns in memory):")
    weighted_context_all = memory.get_weighted_context()
    print(f"Weighted context (all): {weighted_context_all[:5]}...")

    # Retrieve weighted context (last 3 turns)
    print("\nRetrieving weighted context (last 3 turns):")
    weighted_context_recent = memory.get_weighted_context(num_recent_turns=3)
    print(f"Weighted context (last 3): {weighted_context_recent[:5]}...")

    # Clear memory
    print("\nClearing memory:")
    memory.clear_memory()
    print(f"Memory empty? {len(memory.memory) == 0}")
    print(f"Attempting to retrieve from empty memory: {memory.get_weighted_context()[:5]}...")
    
    print("\nConversationMemory module development example finished.")
