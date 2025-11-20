const express = require('express');
const Sentiment = require('sentiment');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;
const sentiment = new Sentiment();

app.use(express.json());

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

app.post('/message', (req, res) => {
  const { message, emotion } = req.body;
  const result = sentiment.analyze(message);
  
  let reply = "I'm not sure how to respond to that.";

  // Simple rule-based responses
  if (result.score < 0 || emotion === 'sad' || emotion === 'angry' || emotion === 'fearful') {
    reply = "I'm sorry to hear that you're feeling this way. Sometimes talking about it can help. What's on your mind?";
  } else if (result.score > 0 || emotion === 'happy' || emotion === 'surprised') {
    reply = "That's great to hear! Tell me more.";
  } else {
    reply = "I see. How does that make you feel?";
  }

  res.json({ reply });
});

// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname+'/build/index.html'));
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
