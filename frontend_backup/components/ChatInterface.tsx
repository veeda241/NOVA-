import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToBackend } from '../services/geminiService';
import { AnalysisReport, ChatMessage, User } from '../types';
import { Send, Loader2, Bot, User as UserIcon, FileText, Sparkles, StopCircle } from 'lucide-react';

interface ChatInterfaceProps {
  user: User;
  onAnalysisComplete: (report: AnalysisReport) => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ user, onAnalysisComplete }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [latestReport, setLatestReport] = useState<AnalysisReport | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize chat session on mount
  useEffect(() => {
    // Initial greeting
    setMessages([
      {
        id: 'init-1',
        role: 'model',
        text: `Hello ${user.name}. I am NOVA. I'm here to listen and support you. How are you feeling right now?`,
        timestamp: new Date()
      }
    ]);
  }, [user.name]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    try {
      const { text, reportData } = await sendMessageToBackend(userMsg.text, user.name);
      
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'model',
        text: text || "I'm listening...",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
      setLatestReport(reportData);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'model',
        text: "I'm having trouble connecting to my inner self right now. Please ensure the backend is running.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleEndSession = async () => {
    if (messages.length < 3) {
      alert("Please share a bit more with NOVA before generating a report.");
      return;
    }

    if(!confirm("Are you ready to end the session and generate your emotional analysis report?")) return;

    setIsAnalyzing(true);
    
    try {
      if (latestReport) {
        onAnalysisComplete(latestReport);
      } else {
        alert("No analysis data available yet. Please continue chatting.");
      }
    } catch (error) {
      alert("Failed to generate report.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[600px] flex flex-col bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="bg-slate-900 p-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse"></div>
          </div>
          <div>
            <h2 className="text-white font-bold text-lg leading-none">NOVA Chat</h2>
            <p className="text-indigo-300 text-xs font-medium mt-1">AI Emotional Support Assistant</p>
          </div>
        </div>
        <button
          onClick={handleEndSession}
          disabled={isAnalyzing || messages.length < 2 || !latestReport}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-all shadow-lg hover:shadow-indigo-500/20"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <FileText className="w-4 h-4" />
              End & Analyze
            </>
          )}
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 scroll-smooth">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div className={`flex gap-3 max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${isUser ? 'bg-indigo-100' : 'bg-white border border-purple-100'}`}>
                  {isUser ? (
                    <UserIcon className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Bot className="w-4 h-4 text-purple-600" />
                  )}
                </div>
                
                {/* Bubble */}
                <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${isUser ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'}`}>
                  {msg.text}
                  <div className={`text-[10px] mt-2 opacity-70 ${isUser ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
             <div className="flex gap-3 max-w-[80%]">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white border border-purple-100 flex items-center justify-center shadow-sm">
                   <Bot className="w-4 h-4 text-purple-600" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-slate-200 shadow-sm flex items-center gap-1">
                   <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                   <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                   <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message to NOVA..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm text-slate-900 placeholder-slate-400"
            disabled={isTyping || isAnalyzing}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping || isAnalyzing}
            className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <p className="text-center text-xs text-slate-400 mt-2">
           NOVA is an AI assistant. For emergencies, please contact campus security or local authorities.
        </p>
      </div>
    </div>
  );
};
