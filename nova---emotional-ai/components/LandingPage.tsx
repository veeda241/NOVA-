import React, { useEffect, useState } from 'react';
import { ChatSession } from '../types';
import { getSessions, deleteSession } from '../services/chatStorage';
import { MessageSquarePlus, MessageSquare, Trash2, Clock, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onNewChat: () => void;
  onSelectChat: (session: ChatSession) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNewChat, onSelectChat }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  useEffect(() => {
    setSessions(getSessions());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      deleteSession(id);
      setSessions(getSessions());
    }
  };

  return (
    <div className="flex h-full w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <div className="max-w-4xl mx-auto w-full p-6 md:p-12 flex flex-col h-full">
        
        {/* Header / Hero */}
        <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl shadow-rose-500/20 mb-6">
            <img src="/logo.png" alt="NOVA Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-indigo-400">NOVA</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-lg leading-relaxed">
            Your empathetic AI companion. I'm here to listen, understand, and provide support through text, voice, and vision.
          </p>
          
          <button 
            onClick={onNewChat}
            className="mt-8 group relative inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-semibold transition-all shadow-xl shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-1"
          >
            <MessageSquarePlus size={24} />
            <span className="text-lg">Start New Conversation</span>
            <div className="absolute inset-0 rounded-2xl ring-2 ring-white/20 group-hover:ring-white/40 transition-all"></div>
          </button>
        </div>

        {/* Previous Chats */}
        <div className="flex-1 overflow-hidden flex flex-col mt-8">
          <div className="flex items-center gap-2 mb-4 px-2">
            <Clock size={16} className="text-slate-500" />
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Recent Sessions</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-hide -mx-2 px-2 space-y-3 pb-8">
            {sessions.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
                <p className="text-slate-500">No previous conversations found.</p>
              </div>
            ) : (
              sessions.map(session => (
                <div 
                  key={session.id}
                  onClick={() => onSelectChat(session)}
                  className="group flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 rounded-xl cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-indigo-500/20 flex items-center justify-center transition-colors">
                      <MessageSquare size={18} className="text-slate-400 group-hover:text-indigo-400" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h3 className="font-medium text-slate-200 truncate pr-4 group-hover:text-white transition-colors">
                        {session.preview || "Empty Conversation"}
                      </h3>
                      <span className="text-xs text-slate-500">
                        {new Date(session.timestamp).toLocaleDateString()} • {new Date(session.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={(e) => handleDelete(e, session.id)}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    title="Delete Conversation"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
