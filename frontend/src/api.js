export const sendMessage = async (message) => {
  try {
    const response = await fetch(`/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    const data = await response.json();
    return data.message;
  } catch (error) {
    console.error('Error sending message:', error);
    return "I'm sorry, I couldn't connect to the AI. Please try again later.";
  }
};
