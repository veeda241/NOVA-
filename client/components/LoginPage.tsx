import React, { useState } from 'react';
import { Mail, Lock, User } from 'lucide-react';
import GooeyNav from './GooeyNav';

interface LoginPageProps {
  onLogin: () => void;
  onSignup: () => void;
  isSignup?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onSignup, isSignup = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock authentication - logic moved to GooeyNav click for consistency if desired,
    // but keeping form submit for Enter key support is good practice.
    if (isSignup) {
        onSignup();
    } else {
        onLogin();
    }
  };

  const handleGooeyClick = (item: any) => {
      // Programmatically trigger form submission logic
      if (isSignup) {
          onSignup();
      } else {
          onLogin();
      }
  };

  const navItems = [
      { label: isSignup ? 'Sign Up' : 'Log In', href: '#' }
  ];

  return (
    <div className="flex h-full w-full items-center justify-center text-slate-200 p-4 relative z-10">
      <div className="w-full max-w-md bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/20 border border-slate-700/50">
             <img src="/nova-logo.svg" alt="NOVA" className="w-full h-full object-contain p-3" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {isSignup ? 'Create an Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400 text-sm">
            {isSignup ? 'Join NOVA to start your journey.' : 'Sign in to continue your emotional journey.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400 ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div className="space-y-1">
             <label className="text-xs font-medium text-slate-400 ml-1">Password</label>
             <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="••••••••"
                />
             </div>
          </div>

          <div className="flex justify-center mt-6">
            <GooeyNav 
                items={navItems}
                onItemClick={handleGooeyClick}
                particleCount={15}
                particleDistances={[40, 10]} // Adjusted for smaller button area
                particleR={50}
                initialActiveIndex={-1} // No active state initially
                animationTime={600}
                timeVariance={300}
                colors={[1, 2, 3, 1, 2, 3, 1, 4]}
            />
          </div>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button 
              type="button"
              onClick={isSignup ? onLogin : onSignup}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {isSignup ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};