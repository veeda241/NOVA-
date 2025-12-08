import React from 'react';
import TextType from './TextType';
import GradientText from './GradientText';
import GooeyNav from './GooeyNav';
import { Brain, Heart, Shield, MessageSquare, Zap, Eye, Mic, Camera } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  
  const navItems = [
    { label: 'Get Started', href: '#' }
  ];

  return (
    <div className="relative flex-1 h-full w-full bg-transparent text-slate-200 overflow-y-auto overflow-x-hidden font-sans scroll-smooth">
      
      {/* Hero Section */}
      <div className="min-h-screen relative z-10 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        
        <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shadow-2xl shadow-rose-500/20 mb-8 border border-slate-700/50">
          <img src="/nova-logo.svg" alt="NOVA Logo" className="w-full h-full object-contain p-4" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
          <GradientText
            colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
            animationSpeed={3}
            showBorder={false}
            className="text-transparent bg-clip-text"
          >
            Welcome to NOVA
          </GradientText>
        </h1>
        <TextType 
          text={[
            "Your empathetic AI companion.", 
            "I'm here to listen, understand, and provide support.",
            "Let's explore your emotions together."
          ]}
          typingSpeed={75}
          pauseDuration={1500}
          showCursor={true}
          cursorCharacter="_"
          className="text-slate-400 text-xl max-w-xl leading-relaxed mb-10 h-20"
        />
        
        <div className="mt-4">
          <GooeyNav 
            items={navItems}
            onItemClick={onGetStarted}
            particleCount={15}
            particleDistances={[50, 15]}
            particleR={60}
            initialActiveIndex={-1}
            animationTime={600}
            timeVariance={300}
            colors={[1, 2, 3, 1, 2, 3, 1, 4]}
          />
        </div>

        <div className="absolute bottom-10 animate-bounce text-slate-500">
            <p className="text-sm mb-2">Scroll to learn more</p>
            <div className="w-6 h-10 border-2 border-slate-500 rounded-full flex justify-center mx-auto">
                <div className="w-1 h-2 bg-slate-500 rounded-full mt-2"></div>
            </div>
        </div>
      </div>

      {/* About Section */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-white"><span className="text-indigo-400">Empathy</span> Meets Intelligence</h2>
            <p className="text-lg text-slate-400 leading-relaxed mb-12 max-w-3xl mx-auto">
                NOVA isn't just a chatbot. It's an advanced emotional AI designed to understand not just what you say, but how you feel. 
                Using multimodal analysis, NOVA perceives the nuances in your voice, facial expressions, and text to provide truly personalized and supportive interactions.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-colors">
                    <div className="w-12 h-12 bg-indigo-500/20 rounded-lg flex items-center justify-center mb-4 text-indigo-400">
                        <Heart size={24} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Emotional Intelligence</h3>
                    <p className="text-slate-400">Detects subtle emotional cues to respond with genuine empathy and understanding.</p>
                </div>
                <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-colors">
                    <div className="w-12 h-12 bg-rose-500/20 rounded-lg flex items-center justify-center mb-4 text-rose-400">
                        <Brain size={24} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Adaptive Learning</h3>
                    <p className="text-slate-400">Learns from your interactions to better tailor its support to your unique needs over time.</p>
                </div>
                <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-colors">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center mb-4 text-emerald-400">
                        <Shield size={24} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-white">Private & Secure</h3>
                    <p className="text-slate-400">Your conversations and emotional data are processed securely, prioritizing your privacy.</p>
                </div>
            </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section className="py-24 px-6 bg-slate-900/40 backdrop-blur-sm border-y border-slate-800 relative z-10">
        <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-16 text-center text-white">Multimodal Capabilities</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
                <div className="order-2 md:order-1">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400"><MessageSquare size={24} /></div>
                        <h3 className="text-2xl font-bold text-white">Deep Text Analysis</h3>
                    </div>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        NOVA goes beyond keywords. It analyzes the sentiment, tone, and context of your messages to grasp the underlying meaning. Whether you're venting, celebrating, or seeking advice, NOVA gets it.
                    </p>
                </div>
                <div className="order-1 md:order-2 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-8 rounded-2xl border border-slate-700/50 flex items-center justify-center h-64">
                    {/* Placeholder for feature visual */}
                    <div className="space-y-3 w-full max-w-sm">
                        <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-700 shrink-0"></div>
                            <div className="bg-slate-800 p-3 rounded-tr-xl rounded-b-xl text-xs text-slate-300">I'm feeling a bit overwhelmed today...</div>
                        </div>
                        <div className="flex gap-3 justify-end">
                             <div className="bg-indigo-600/20 border border-indigo-500/30 p-3 rounded-tl-xl rounded-b-xl text-xs text-indigo-200">I hear you. It's completely okay to feel that way. Want to talk about what's causing it?</div>
                             <div className="w-8 h-8 rounded-full bg-indigo-500 shrink-0"></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
                 <div className="bg-gradient-to-br from-rose-500/10 to-orange-500/10 p-8 rounded-2xl border border-slate-700/50 flex items-center justify-center h-64">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full border-4 border-rose-500/30 flex items-center justify-center">
                            <Eye size={48} className="text-rose-400" />
                        </div>
                        <div className="absolute -top-2 -right-2 bg-slate-900 border border-slate-700 px-3 py-1 rounded-full text-xs text-rose-300 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> Joy Detected
                        </div>
                    </div>
                </div>
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-rose-500/20 rounded-lg text-rose-400"><Camera size={24} /></div>
                        <h3 className="text-2xl font-bold text-white">Visual Emotion Recognition</h3>
                    </div>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        Sometimes words aren't enough. With your permission, NOVA can use your camera to detect facial micro-expressions, allowing it to respond to your non-verbal cues just like a real friend would.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                <div className="order-2 md:order-1">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-500/20 rounded-lg text-amber-400"><Mic size={24} /></div>
                        <h3 className="text-2xl font-bold text-white">Voice Intonation Analysis</h3>
                    </div>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        The way you say something matters as much as what you say. NOVA listens to the pitch, pace, and tone of your voice to accurately interpret your emotional state.
                    </p>
                </div>
                 <div className="order-1 md:order-2 bg-gradient-to-br from-amber-500/10 to-yellow-500/10 p-8 rounded-2xl border border-slate-700/50 flex items-center justify-center h-64">
                    <div className="flex items-center gap-1 h-32">
                        {[40, 70, 45, 90, 60, 30, 80, 50, 70, 40].map((h, i) => (
                            <div key={i} className="w-3 bg-amber-500/50 rounded-full animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}></div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* How it Works / CTA */}
      <section className="py-24 px-6 relative z-10 text-center">
        <div className="max-w-4xl mx-auto">
             <h2 className="text-3xl md:text-4xl font-bold mb-12 text-white">Ready to be heard?</h2>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                 <div className="flex flex-col items-center">
                     <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold text-white mb-4 shadow-lg shadow-indigo-500/20">1</div>
                     <h4 className="text-lg font-medium text-slate-200 mb-2">Sign Up</h4>
                     <p className="text-sm text-slate-500">Create a secure account to save your journey.</p>
                 </div>
                 <div className="flex flex-col items-center">
                     <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold text-white mb-4 shadow-lg shadow-indigo-500/20">2</div>
                     <h4 className="text-lg font-medium text-slate-200 mb-2">Chat Naturally</h4>
                     <p className="text-sm text-slate-500">Text, talk, or show how you feel.</p>
                 </div>
                 <div className="flex flex-col items-center">
                     <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold text-white mb-4 shadow-lg shadow-indigo-500/20">3</div>
                     <h4 className="text-lg font-medium text-slate-200 mb-2">Grow Together</h4>
                     <p className="text-sm text-slate-500">Receive insights and support as you go.</p>
                 </div>
             </div>
             
             <button 
                onClick={onGetStarted}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold text-lg shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
             >
                 Start Your Journey with NOVA
             </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-slate-800/50 text-center text-slate-600 text-sm relative z-10 bg-slate-950/50 backdrop-blur-md">
        <div className="flex items-center justify-center gap-2 mb-4 opacity-50">
             <img src="/nova-logo.svg" alt="Logo" className="w-6 h-6 grayscale" />
             <span className="font-bold tracking-widest">NOVA</span>
        </div>
        <p>&copy; {new Date().getFullYear()} NOVA AI. All rights reserved.</p>
      </footer>

    </div>
  );
};
