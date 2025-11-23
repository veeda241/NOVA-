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
  const sentimentResult = sentiment.analyze(message);
  
  let emotionalAnalysis = "";
  if (sentimentResult.score < 0) {
    emotionalAnalysis += "Your message conveyed a negative sentiment. ";
  } else if (sentimentResult.score > 0) {
    emotionalAnalysis += "Your message conveyed a positive sentiment. ";
  } else {
    emotionalAnalysis += "Your message conveyed a neutral sentiment. ";
  }

  emotionalAnalysis += `Your detected facial emotion was: ${emotion}. `;

  let advice = "";
  // More comprehensive rule-based advice
  if (sentimentResult.score < 0 && (emotion === 'sad' || emotion === 'angry' || emotion === 'fearful')) {
    advice = "It seems you're going through a tough time. Remember that it's okay to feel this way, and seeking support can be very helpful. Perhaps try to identify the source of these feelings.";
  } else if (sentimentResult.score > 0 && (emotion === 'happy' || emotion === 'surprised')) {
    advice = "That's wonderful! Your positive sentiment and emotion suggest you're in a great place. Keep cherishing these moments!";
  } else if (sentimentResult.score === 0 && emotion === 'neutral') {
    advice = "You seem to be in a calm and balanced state. This can be a good time for reflection or simply enjoying the present moment.";
  } else {
    advice = "There's a mix of feelings here, or perhaps your message and facial emotion tell different stories. It might be worth exploring these feelings further.";
  }

  const report = {
    messageSentiment: {
      score: sentimentResult.score,
      comparative: sentimentResult.comparative,
      words: sentimentResult.words,
      positive: sentimentResult.positive,
      negative: sentimentResult.negative,
    },
    detectedEmotion: emotion,
    emotionalAnalysis: emotionalAnalysis,
    advice: advice,
    fullReport: `${emotionalAnalysis}${advice}` // Combine for a full textual report
  };

  res.json(report);
});

// Handles any requests that don't match the ones above
app.get('*', (req,res) =>{
    res.sendFile(path.join(__dirname+'/build/index.html'));
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
