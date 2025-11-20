const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post('/chat', (req, res) => {
  const userMessage = req.body.message;
  const lowerCaseMessage = userMessage.toLowerCase();
  let aiResponse;

  if (lowerCaseMessage.includes('sad') || lowerCaseMessage.includes('unhappy') || lowerCaseMessage.includes('down')) {
    aiResponse = "I'm sorry to hear you're feeling that way. It's okay to feel sad, and I'm here to listen whenever you need to talk.";
  } else if (lowerCaseMessage.includes('happy') || lowerCaseMessage.includes('joyful') || lowerCaseMessage.includes('great') || lowerCaseMessage.includes('good')) {
    aiResponse = "That's wonderful to hear! I'm glad you're feeling happy. What's making you feel this way?";
  } else if (lowerCaseMessage.includes('anxious') || lowerCaseMessage.includes('stressed') || lowerCaseMessage.includes('worried')) {
    aiResponse = "It sounds like you're going through a stressful time. Remember to be kind to yourself. Let's talk through what's on your mind.";
  } else if (lowerCaseMessage.includes('angry') || lowerCaseMessage.includes('frustrated') || lowerCaseMessage.includes('mad')) {
    aiResponse = "It's completely valid to feel angry. Your feelings are important. What's causing this frustration?";
  } else if (lowerCaseMessage.includes('not well') || lowerCaseMessage.includes('bad') || lowerCaseMessage.includes('not good')) {
    aiResponse = "I'm sorry to hear you're not feeling well. Can you tell me a bit more about what's happening?";
  } else if (lowerCaseMessage.includes('hi') || lowerCaseMessage.includes('hello') || lowerCaseMessage.includes('hey')) {
    aiResponse = "Hello there! How are you feeling today?";
  } else {
    aiResponse = "Thank you for sharing that with me. Can you tell me more about what's on your mind?";
  }

  res.json({ message: aiResponse });
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
