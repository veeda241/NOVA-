import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToLocalNova, generateAnalysisReport } from './services/geminiService';
import { Message, EmotionAnalysis, NovaResponse, AnalysisReport, ChatSession } from './types';
import { saveSession, createNewSession, getSessions, deleteSession } from './services/chatStorage';
import { getUserProfile } from './services/userProfileService'; // Import profile service
import { MessageBubble } from './components/MessageBubble';
import { InputArea } from './components/InputArea';
import { EmotionPanel } from './components/EmotionPanel';
import { CameraCapture } from './components/CameraCapture';
import { AnalysisResult } from './components/AnalysisResult';
import { LandingPage } from './components/LandingPage';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { OnboardingPage } from './components/OnboardingPage'; // Import Onboarding
import { ProfilePage } from './components/ProfilePage'; // Import Profile
import DarkVeil from './components/DarkVeil';
import { Info, FileText, Menu, UserCircle } from 'lucide-react';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<EmotionAnalysis | undefined>(undefined);
  const [showCamera, setShowCamera] = useState(false);
  // Updated view type
  const [view, setView] = useState<'landing' | 'login' | 'signup' | 'chat' | 'analysis' | 'onboarding' | 'profile'>('landing');
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  
  // Sidebar State
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Load sessions on mount
    setSessions(getSessions());
  }, []);

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
    setSessions(getSessions()); // Update sidebar list
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
    setSessions(getSessions()); // Update sidebar list
    
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

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this conversation?')) {
      // Optimistically update UI first, then persist to localStorage
      const updatedSessions = sessions.filter(session => session.id !== id);
      setSessions(updatedSessions);
      deleteSession(id); // Persist to localStorage

      // If deleted current session, clear it but stay in chat view or go to new chat
      if (currentSessionId === id) {
        setCurrentSessionId(null);
        setMessages([]);
        startNewChat(); 
      } else if (updatedSessions.length > 0) {
        // If current session was not deleted, but there are other sessions, load the most recent one
        loadChat(updatedSessions[0]);
      } else {
        // If no sessions left after deletion, start a new chat
        startNewChat();
      }
    }
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

  const handleLogin = () => {
    setUserLoggedIn(true);
    
    // Check if user has a profile
    const profile = getUserProfile();
    if (!profile) {
        setView('onboarding');
        return;
    }

    // Normal flow
    if (!currentSessionId && sessions.length === 0) {
        startNewChat();
    } else if (sessions.length > 0) {
        // Load most recent session
        loadChat(sessions[0]);
    } else {
        startNewChat();
    }
    setView('chat');
  };

  const handleLogout = () => {
    setUserLoggedIn(false);
    setView('landing');
    setCurrentSessionId(null);
  };

  const handleOnboardingComplete = () => {
      startNewChat();
  };

  // --- Render Logic ---

  if (!userLoggedIn) {
    return (
      <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
         <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
          <DarkVeil />
        </div>
        
        {view === 'landing' && (
          <LandingPage onGetStarted={() => setView('login')} />
        )}
        
        {(view === 'login' || view === 'signup') && (
          <LoginPage 
             isSignup={view === 'signup'}
             onLogin={handleLogin}
             onSignup={() => setView('signup')} // Allow navigation to signup form
          />
        )}
      </div>
    );
  }

  // Determine header title
  let headerTitle = 'Conversation';
  if (view === 'analysis') headerTitle = 'Analysis Report';
  if (view === 'onboarding') headerTitle = 'Welcome';
  if (view === 'profile') headerTitle = 'User Profile';

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans relative">
      
      {/* Sidebar - Hide on onboarding */}
      {view !== 'onboarding' && (
        <Sidebar 
            sessions={sessions}
            currentSessionId={currentSessionId}
            onNewChat={startNewChat}
            onSelectChat={loadChat}
            onDeleteChat={handleDeleteSession}
            onLogout={handleLogout}
            isOpen={isSidebarOpen}
            toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
            isCollapsed={isSidebarCollapsed}
            onViewProfile={() => setView('profile')}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full relative w-full">
        
        {/* Mobile Header Toggle - Hide on onboarding */}
        {view !== 'onboarding' && (
            <div className="md:hidden p-4 border-b border-slate-800 bg-slate-900 flex items-center justify-between z-10">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-slate-400">
                <Menu size={24} />
            </button>
            <span className="font-bold">NOVA</span>
            <div className="w-8" /> {/* Spacer */}
            </div>
        )}

        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
             {/* Chat Header - Hide on onboarding */}
             {view !== 'onboarding' && (
                 <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md z-10 hidden md:flex">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 -ml-2 text-slate-400 hover:text-white transition-colors">
                    <Menu size={24} />
                    </button>
                    <div>
                    <h1 className="font-bold text-lg tracking-tight text-white">{headerTitle}</h1>
                    <p className="text-[10px] text-slate-400 font-medium">
                        {view === 'chat' ? (currentSessionId ? 'Active Session' : 'New Session') : 
                         view === 'profile' ? 'Your Personal Space' : 'Insights'}
                    </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {view === 'chat' && (
                        <button 
                            onClick={handleGenerateReport}
                            disabled={isAnalyzing}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${isAnalyzing ? 'bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'}`}
                        >
                            {isAnalyzing ? <span className="animate-pulse">Analyzing...</span> : <><FileText size={14} /> Generate Report</>}
                        </button>
                    )}
                    <button className="text-slate-500 hover:text-slate-300">
                    <Info size={20} />
                    </button>
                    
                    {/* Profile Icon */}
                    <button 
                        onClick={() => setView('profile')}
                        className="ml-4 w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 hover:bg-slate-700 hover:border-indigo-500/50 transition-all shadow-lg overflow-hidden"
                        title="Profile"
                    >
                         {(() => {
                            const p = getUserProfile();
                            return p ? (
                                <span className="font-bold text-sm">{p.name.charAt(0).toUpperCase()}</span>
                            ) : (
                                <UserCircle size={20} />
                            );
                         })()}
                    </button>
                </div>
                </header>
             )}

            {/* Content Body */}
            {view === 'analysis' && report ? (
              <div className="flex-1 overflow-y-auto bg-slate-900 scrollbar-hide p-4">
                <AnalysisResult report={report} onBack={() => setView('chat')} />
              </div>
            ) : view === 'onboarding' ? (
                <div className="flex-1 overflow-y-auto bg-slate-950 scrollbar-hide">
                    <OnboardingPage onComplete={handleOnboardingComplete} />
                </div>
            ) : view === 'profile' ? (
                 <div className="flex-1 overflow-y-auto bg-slate-950 scrollbar-hide">
                    <ProfilePage onBack={() => setView('chat')} />
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
                <div className="z-10 p-4 bg-transparent">
                  <InputArea 
                    onSendMessage={handleSendMessage} 
                    isLoading={isLoading} 
                    onCameraClick={() => setShowCamera(true)}
                  />
                </div>
              </>
            )}
        </div>
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