import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { ChatInterface } from './components/ChatInterface';
import { AnalysisResult } from './components/AnalysisResult';
import { ReportList } from './components/ReportList';
import { Profile } from './components/Profile';
import { Settings } from './components/Settings';
import { LandingPage } from './components/LandingPage';
import { Auth } from './components/Auth';
import { User, AnalysisReport } from './types';

const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<'landing' | 'login' | 'signup' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [reports, setReports] = useState<AnalysisReport[]>([]);
  const [currentReport, setCurrentReport] = useState<AnalysisReport | null>(null);

  // Auth Handlers
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setView('app');
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if(confirm("Are you sure you want to log out?")) {
      setCurrentUser(null);
      setView('landing');
      setReports([]); // Optional: clear session data
    }
  };

  // Profile Update Handler
  const handleUpdateUser = (updatedData: Partial<User>) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, ...updatedData });
    }
  };

  // App Content Handlers
  const handleAnalysisComplete = (report: AnalysisReport) => {
    setReports(prev => [report, ...prev]);
    setCurrentReport(report);
    setActiveTab('result'); 
  };

  const handleViewReport = (report: AnalysisReport) => {
    setCurrentReport(report);
    setActiveTab('result');
  };

  // Render Logic
  if (view === 'landing') {
    return <LandingPage onLogin={() => setView('login')} onSignup={() => setView('signup')} />;
  }

  if (view === 'login' || view === 'signup') {
    return (
      <Auth 
        mode={view} 
        onSwitchMode={(mode) => setView(mode)} 
        onSuccess={handleLoginSuccess} 
      />
    );
  }

  // Main Authenticated App
  if (currentUser && view === 'app') {
    const renderContent = () => {
      switch (activeTab) {
        case 'dashboard':
          return (
            <Dashboard 
              reports={reports} 
              onNavigate={setActiveTab} 
              onViewReport={handleViewReport} 
            />
          );
        case 'chat':
          return <ChatInterface user={currentUser} onAnalysisComplete={handleAnalysisComplete} />;
        case 'reports':
          return <ReportList reports={reports} onViewReport={handleViewReport} />;
        case 'result':
          return currentReport ? (
            <div className="animate-fade-in">
               <div className="mb-6 flex items-center justify-between no-print">
                  <button 
                    onClick={() => setActiveTab('reports')}
                    className="text-sm font-medium text-slate-500 hover:text-indigo-900 flex items-center gap-2 transition-colors"
                  >
                    &larr; Back to History
                  </button>
               </div>
              <AnalysisResult report={currentReport} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
              <p>No report selected.</p>
              <button onClick={() => setActiveTab('dashboard')} className="text-indigo-700 font-medium hover:underline mt-2">
                Return to Dashboard
              </button>
            </div>
          );
        case 'profile':
          return (
            <Profile 
              user={currentUser} 
              stats={{ total: reports.length }} 
              onUpdateUser={handleUpdateUser}
            />
          );
        case 'settings':
          return <Settings />;
        default:
          return <Dashboard reports={reports} onNavigate={setActiveTab} onViewReport={handleViewReport} />;
      }
    };

    return (
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
        <div className="no-print sticky top-0 z-50">
           <Navbar 
            user={currentUser} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            onLogout={handleLogout} 
          />
        </div>

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb / Title Area */}
          <div className="mb-8 border-b border-slate-200 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight capitalize">
                {activeTab === 'result' ? 'Clinical Analysis Report' : 
                 activeTab === 'chat' ? 'NOVA Chat Support' :
                 activeTab === 'reports' ? 'History & Archives' :
                 activeTab === 'profile' ? 'Student Profile' :
                 activeTab === 'settings' ? 'System Settings' :
                 'Student Dashboard'}
              </h1>
              <p className="text-slate-500 mt-1">
                {activeTab === 'chat' ? 'Speak freely with NOVA. Your conversation is secure.' : 'Department of Emotional Intelligence & Psychology'}
              </p>
            </div>
            <div className="text-sm text-slate-500 font-medium bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm no-print">
               {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>

          <div className="min-h-[500px]">
            {renderContent()}
          </div>
        </main>

        <footer className="bg-white border-t border-slate-200 py-8 mt-12 no-print">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <p className="text-slate-400 text-sm">
              &copy; {new Date().getFullYear()} NOVA AI Academic System. Institutional Use Only.
            </p>
            <div className="flex justify-center gap-6 mt-4 text-xs text-slate-400">
              <span className="hover:text-slate-600 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-600 cursor-pointer">Terms of Service</span>
              <span className="hover:text-slate-600 cursor-pointer">Support</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Fallback (should typically not reach here)
  return <div>Loading...</div>;
};

export default App;