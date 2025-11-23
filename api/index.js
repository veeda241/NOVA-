const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  
  try {
    const response = await fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: userMessage }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error from Python backend: ${response.status} - ${errorText}`);
      return res.status(response.status).json({ error: 'Failed to get analysis from LLM backend', details: errorText });
    }

    const data = await response.json();
    // The Python backend already returns structured data, so we can directly send it
    res.json({ message: "Analysis complete", analysisData: data }); 

  } catch (error) {
    console.error('Error communicating with Python LLM backend:', error);
    res.status(500).json({ error: 'Internal server error while communicating with LLM backend' });
  }
});

app.listen(port, () => {
  console.log(`Backend listening at http://localhost:${port}`);
});
