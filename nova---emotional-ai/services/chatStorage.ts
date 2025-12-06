import { ChatSession, Message } from '../types';

const STORAGE_KEY = 'nova_chat_history';

export const saveSession = (session: ChatSession): void => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const getSessions = (): ChatSession[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  
  try {
    const sessions = JSON.parse(stored);
    // Revive dates
    return sessions.map((session: any) => ({
      ...session,
      messages: session.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    })).sort((a: ChatSession, b: ChatSession) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error("Failed to parse chat history", e);
    return [];
  }
};

export const deleteSession = (id: string): void => {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const createNewSession = (): ChatSession => {
  return {
    id: Date.now().toString(),
    timestamp: Date.now(),
    preview: "New Conversation",
    messages: []
  };
};
