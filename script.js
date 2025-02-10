const video = document.getElementById('video');

// Request camera access
navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        video.play();  // Ensure the video starts playing
    })
    .catch(err => {
        console.error("Camera access denied:", err);
        alert("Please allow camera access for this app to work.");
    });
    
function captureFrame() {
    if (!video.srcObject) {
        console.error("No video stream found.");
        return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const imageData = canvas.toDataURL('image/png');

    fetch('http://localhost:5000/detect_emotion', { 
        method: 'POST',
        body: JSON.stringify({ image: imageData }),
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('result').innerText = `Detected Emotion: ${data.emotion}`;
        speakEmotion(data.emotion);
    })
    .catch(error => console.error('Error:', error));
}

// Automatically capture frames every 3 seconds
setInterval(captureFrame, 3000);

function speakEmotion(emotion) {
    let speech = new SpeechSynthesisUtterance(`You are feeling ${emotion}`);
    speech.lang = "en-US";
    speech.volume = 1;
    speech.rate = 1;
    speech.pitch = 1;
    window.speechSynthesis.speak(speech);
}
