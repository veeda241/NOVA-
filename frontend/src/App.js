import React, { useState } from 'react';
import { sendMessage } from './api';
import './App.css';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const handleSendMessage = async () => {
    if (input.trim()) {
      const userMessage = { text: input, sender: 'user' };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setInput('');

      try {
        const aiResponse = await sendMessage(input);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: aiResponse, sender: 'ai' },
        ]);
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
          { text: "I'm sorry, there was an error connecting to the AI.", sender: 'ai' },
        ]);
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Emotional Support AI</h1>
      </header>
      <div className="chat-container">
        <div className="messages-display">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              {msg.text}
            </div>
          ))}
        </div>
        <div className="message-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
            placeholder="Express your feelings..."
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}

export default App;
