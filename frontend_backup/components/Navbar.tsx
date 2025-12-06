import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { 
  User as UserIcon, 
  Settings, 
  LogOut, 
  ChevronDown,
  LayoutDashboard,
  FileText,
  MessageSquareHeart
} from 'lucide-react';

interface NavbarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

const CustomLogo = () => (
  <svg viewBox="0 0 100 100" className="w-10 h-10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#818cf8" /> {/* Indigo-400 */}
        <stop offset="50%" stopColor="#6366f1" /> {/* Indigo-500 */}
        <stop offset="100%" stopColor="#4f46e5" /> {/* Indigo-600 */}
      </linearGradient>
      <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <g filter="url(#glow)">
      {/* Abstract 4-loop knot simulation */}
      <path 
        d="M50 50 
           C 50 20, 80 20, 80 50 
           C 80 80, 50 80, 50 50 
           C 50 80, 20 80, 20 50 
           C 20 20, 50 20, 50 50 Z" 
        stroke="url(#logoGradient)" 
        strokeWidth="8" 
        strokeLinecap="round" 
        strokeOpacity="0.3"
      />
      <path 
        d="M50 50 
           C 30 30, 30 70, 50 90
           C 70 70, 70 30, 50 10
           C 30 30, 30 70, 50 50 Z" 
        stroke="url(#logoGradient)" 
        strokeWidth="6" 
        strokeLinecap="round"
        transform="rotate(45 50 50)"
      />
       <path 
        d="M30 30 Q 50 50 70 70" 
        stroke="white" 
        strokeWidth="1" 
        strokeOpacity="0.5"
      />
       <circle cx="50" cy="50" r="10" fill="url(#logoGradient)" fillOpacity="0.2" />
    </g>
  </svg>
);

export const Navbar: React.FC<NavbarProps> = ({ user, activeTab, setActiveTab, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'chat', label: 'AI Support Chat', icon: MessageSquareHeart },
    { id: 'reports', label: 'Report History', icon: FileText },
  ];

  return (
    <nav className="bg-slate-900 text-white shadow-lg border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20"> 
          
          {/* Logo Section */}
          <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActiveTab('dashboard')}>
            <div className="bg-slate-800 p-2 rounded-xl group-hover:bg-slate-700 transition-colors border border-slate-700 shadow-inner">
              <CustomLogo />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight leading-none text-white group-hover:text-indigo-200 transition-colors">
                NOVA AI
              </span>
              <span className="text-[11px] text-slate-400 uppercase tracking-[0.2em] font-medium mt-1">
                Academic Portal
              </span>
            </div>
          </div>

          {/* Center Navigation Links */}
          <div className="hidden md:flex items-center space-x-2 bg-slate-800/50 p-1.5 rounded-full border border-slate-700/50">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id || (link.id === 'reports' && activeTab === 'result');
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`px-5 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md transform scale-105'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </div>

          {/* Right Profile Section */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-3 pl-4 py-2 rounded-xl hover:bg-slate-800 transition-all focus:outline-none border border-transparent hover:border-slate-700"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-white leading-tight">{user.name}</p>
                <p className="text-xs text-indigo-400 font-medium">{user.role}</p>
              </div>
              <div className="relative">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full border-2 border-slate-600 shadow-sm" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border-2 border-slate-600">
                    <UserIcon className="w-5 h-5 text-slate-400" />
                  </div>
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 py-2 z-50 transform origin-top-right transition-all animate-fade-in-down border border-slate-100">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 block sm:hidden">
                   <p className="text-sm font-bold text-slate-900">{user.name}</p>
                   <p className="text-xs text-slate-500 font-medium">{user.role}</p>
                </div>
                
                <div className="px-2 pt-2">
                  <button
                    onClick={() => { setActiveTab('profile'); setIsProfileOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-3 transition-colors"
                  >
                    <div className="bg-indigo-100 p-1.5 rounded-md">
                      <UserIcon className="w-4 h-4 text-indigo-600" />
                    </div>
                    Student Profile
                  </button>
                  
                  <button
                    onClick={() => { setActiveTab('settings'); setIsProfileOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg flex items-center gap-3 transition-colors"
                  >
                    <div className="bg-slate-100 p-1.5 rounded-md">
                      <Settings className="w-4 h-4 text-slate-600" />
                    </div>
                    System Settings
                  </button>
                </div>
                
                <div className="border-t border-slate-100 my-2 mx-4"></div>
                
                <div className="px-2 pb-2">
                  <button
                    onClick={() => { onLogout(); setIsProfileOpen(false); }}
                    className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-3 transition-colors"
                  >
                    <div className="bg-red-100 p-1.5 rounded-md">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Nav Links (sub-header) */}
      <div className="md:hidden border-t border-slate-800 bg-slate-900 p-2 flex justify-around">
          {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id || (link.id === 'reports' && activeTab === 'result');
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`p-2 rounded-lg flex flex-col items-center gap-1 w-full transition-colors ${
                    isActive ? 'text-indigo-400 bg-slate-800' : 'text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium">{link.label}</span>
                </button>
              );
            })}
      </div>
    </nav>
  );
};
