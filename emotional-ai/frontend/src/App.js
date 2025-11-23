import React, { useRef, useEffect, useState } from 'react';
import * as faceapi from 'face-api.js';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [currentEmotion, setCurrentEmotion] = useState("Neutral");
  const [message, setMessage] = useState("");
  const [aiResponse, setAiResponse] = useState("");

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
      ]);
      startVideo();
    };

    const startVideo = () => {
      navigator.mediaDevices.getUserMedia({ video: {} })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error(err));
    };

    const handleVideoOnPlay = () => {
      const video = videoRef.current;
      if (!video) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const displaySize = { width: video.width, height: video.height };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
        if (detections && detections.length > 0) {
          const expressions = detections[0].expressions;
          const maxExpression = Object.keys(expressions).reduce((a, b) => expressions[a] > expressions[b] ? a : b);
          setCurrentEmotion(maxExpression);
        }

        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);
      }, 100);
    };

    loadModels();

    const video = videoRef.current;
    if (video) {
      video.addEventListener('play', handleVideoOnPlay);
    }

    return () => {
      if (video) {
        video.removeEventListener('play', handleVideoOnPlay);
      }
    };
  }, []);

  const handleSendMessage = async () => {
    const response = await fetch('/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, emotion: currentEmotion }),
    });
    const reportData = await response.json();
    setAiResponse(reportData.fullReport); // Display the combined full report

    // For debugging, you might want to log the full report object
    console.log("Personal Analysis Report:", reportData); 
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Emotional AI Assistant</h1>
        <div style={{ position: 'relative', width: '720px', height: '560px' }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            width="720"
            height="560"
            style={{ position: 'absolute' }}
          />
          <canvas ref={canvasRef} style={{ position: 'absolute' }} />
        </div>
        <h2>Current Emotion: {currentEmotion}</h2>
        <div className="chat-container">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Talk to the AI..."
          />
          <button onClick={handleSendMessage}>Send</button>
          {aiResponse && (
            <div className="analysis-report">
              <h3>Personal Analysis Report:</h3>
              <p>{aiResponse}</p>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
