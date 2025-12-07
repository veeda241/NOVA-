import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToLocalNova, generateAnalysisReport } from './services/geminiService';
import { Message, EmotionAnalysis, NovaResponse, AnalysisReport, ChatSession } from './types';
import { saveSession, createNewSession, getSessions } from './services/chatStorage';
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { EmotionPanel } from './components/EmotionPanel';
import { CameraCapture } from './components/CameraCapture';
import { AnalysisResult } from './components/AnalysisResult';
import { LandingPage } from './components/LandingPage';
import { Sparkles, Info, FileText, Home, ArrowLeft } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<EmotionAnalysis | undefined>(undefined);
  const [showCamera, setShowCamera] = useState(false);
  const [view, setView] = useState<'landing' | 'chat' | 'analysis'>('landing');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (view === 'chat') {
      scrollToBottom();
    }
  }, [messages, view]);

  // Helper to save current state to storage
  const saveCurrentSession = (currentMessages: Message[]) => {
    if (!currentSessionId) return;
    
    const lastMsg = currentMessages[currentMessages.length - 1];
    const preview = lastMsg ? (lastMsg.text.substring(0, 40) + (lastMsg.text.length > 40 ? '...' : '')) : 'New Conversation';

    const session: ChatSession = {
      id: currentSessionId,
      timestamp: Date.now(),
      preview: preview,
      messages: currentMessages
    };
    saveSession(session);
  };

  const startNewChat = () => {
    const newSession = createNewSession();
    setCurrentSessionId(newSession.id);
    
    // Initial welcome message
    const welcome: Message = {
      id: 'welcome',
      role: 'model',
      text: "Hello, I'm NOVA. I'm here to listen and understand how you're feeling. I can analyze your text, voice, or facial expressions to provide the best support. What's on your mind today?",
      timestamp: new Date(),
      emotionAnalysis: {
        detected_emotion: 'Caring',
        confidence: 1.0,
        reasoning: 'Initial greeting protocol: Establish empathetic rapport.'
      }
    };
    
    const initialMessages = [welcome];
    setMessages(initialMessages);
    setLastAnalysis(welcome.emotionAnalysis);
    
    // Save immediately so it appears in list
    const sessionToSave = { ...newSession, messages: initialMessages, preview: "New Conversation" };
    saveSession(sessionToSave);
    
    setView('chat');
  };

  const loadChat = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    
    // Find last analysis
    const reversedMsgs = [...session.messages].reverse();
    const lastAnalysisMsg = reversedMsgs.find(m => m.emotionAnalysis);
    if (lastAnalysisMsg) {
      setLastAnalysis(lastAnalysisMsg.emotionAnalysis);
    } else {
      setLastAnalysis(undefined);
    }
    
    setView('chat');
  };

  const handleSendMessage = async (text: string, image?: string, audio?: string) => {
    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
      image: image ? `data:image/jpeg;base64,${image}` : undefined,
      audio: !!audio
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    saveCurrentSession(updatedMessages); // Save user message
    setIsLoading(true);

    try {
      // Use Local Backend (Multimodal) first, with automatic fallback to Gemini handled in service
      const data: NovaResponse = await sendMessageToLocalNova(text, image, audio);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: data.response,
        timestamp: new Date(),
        emotionAnalysis: data.analysis
      };

      const finalMessages = [...updatedMessages, botMsg];
      setMessages(finalMessages);
      setLastAnalysis(data.analysis);
      saveCurrentSession(finalMessages); // Save bot response
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
         id: (Date.now() + 1).toString(),
         role: 'model',
         text: "I'm having trouble sensing your emotions right now. Please check your connection.",
         timestamp: new Date()
      };
      const errorMessages = [...updatedMessages, errorMsg];
      setMessages(errorMessages);
      saveCurrentSession(errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCameraCapture = (base64: string) => {
    handleSendMessage("I'm sharing my facial expression with you.", base64);
  };

  const handleGenerateReport = async () => {
    if (messages.length <= 1) {
      alert("Please have a conversation with NOVA first.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const newReport = await generateAnalysisReport(messages);
      setReport(newReport);
      setView('analysis');
    } catch (err) {
      console.error(err);
      alert("Failed to generate report. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (view === 'landing') {
    return <LandingPage onNewChat={startNewChat} onSelectChat={loadChat} />;
  }

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-10">
           <div className="flex items-center gap-4">
             <button 
               onClick={() => setView('landing')}
               className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
               title="Back to Home"
             >
               <ArrowLeft size={20} />
             </button>
             <div className="flex items-center gap-3">
                                         <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shadow-lg shadow-rose-500/20">
                                           <img src="/logo.png" alt="NOVA Logo" className="w-full h-full object-cover" />
                                         </div>               <div>
                 <h1 className="font-bold text-lg tracking-tight text-white">NOVA</h1>
                 <p className="text-[10px] text-slate-400 font-medium">EMOTIONAL INTELLIGENCE SYSTEM</p>
               </div>
             </div>
           </div>
           <div className="flex gap-2">
             <button 
                onClick={handleGenerateReport}
                disabled={isAnalyzing || view !== 'chat'}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isAnalyzing ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}`}
             >
               {isAnalyzing ? <span className="animate-pulse">Analyzing...</span> : <><FileText size={14} /> Generate Report</>}
             </button>
             <button className="text-slate-500 hover:text-slate-300">
               <Info size={20} />
             </button>
           </div>
        </header>

        {/* Content Area */}
        {view === 'analysis' && report ? (
          <div className="flex-1 overflow-y-auto bg-slate-900 scrollbar-hide">
            <AnalysisResult report={report} onBack={() => setView('chat')} />
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-hide">
              <div className="max-w-3xl mx-auto">
                {messages.map(msg => (
                  <MessageBubble key={msg.id} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-slate-500 text-sm ml-12 animate-pulse">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></span>
                    Processing Emotion...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input */}
            <div className="z-10">
              <InputArea 
                onSendMessage={handleSendMessage} 
                isLoading={isLoading} 
                onCameraClick={() => setShowCamera(true)}
              />
            </div>
          </>
        )}
      </div>

      {/* Side Panel - Desktop Only for now (Analysis) */}
      <div className="hidden lg:block w-80 h-full border-l border-slate-800 bg-slate-900 shadow-2xl z-20">
        <EmotionPanel analysis={lastAnalysis} />
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture 
          onCapture={handleCameraCapture} 
          onClose={() => setShowCamera(false)} 
        />
      )}
    </div>
  );
};

export default App;