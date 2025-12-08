import React, { useEffect, useState } from 'react';
import { ChatSession } from '../types';
import { MessageSquarePlus, MessageSquare, Trash2, Clock, LogOut, UserCircle } from 'lucide-react';
import { getUserProfile, UserProfile } from '../services/userProfileService';

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectChat: (session: ChatSession) => void;
  onDeleteChat: (e: React.MouseEvent, id: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed?: boolean;
  onViewProfile: () => void; // New prop
}

const getAvatarSrc = (gender: 'male' | 'female' | 'other' | undefined): string => {
  switch (gender) {
    case 'male': return '/avatar-male.svg';
    case 'female': return '/avatar-female.svg';
    case 'other': return '/avatar-other.svg';
    default: return ''; // Fallback, will be handled by UserCircle
  }
};

export const Sidebar: React.FC<SidebarProps> = ({ 
  sessions, 
  currentSessionId, 
  onNewChat, 
  onSelectChat, 
  onDeleteChat,
  onLogout,
  isOpen,
  toggleSidebar,
  isCollapsed = false,
  onViewProfile // New prop
}) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    setUserProfile(getUserProfile());
  }, []);

  const displayName = userProfile?.name || 'User';
  const displayAvatar = userProfile?.gender ? getAvatarSrc(userProfile.gender) : '';

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40
        bg-slate-900 border-r border-slate-800 
        transform transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-72'}
        w-72
        flex flex-col h-full
      `}>
        
        {/* Header */}
        <div className={`p-4 border-b border-slate-800 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden shadow-lg shadow-rose-500/20 shrink-0">
                <img src="/nova-logo.svg" alt="NOVA" className="w-full h-full object-cover" />
              </div>
              {!isCollapsed && <span className="font-bold text-slate-200 tracking-tight transition-opacity duration-300">NOVA</span>}
            </div>
        </div>

        {/* New Chat Button */}
        <div className="p-4">
          <button 
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) toggleSidebar();
            }}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-center gap-2'} px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40`}
            title={isCollapsed ? "New Chat" : ""}
          >
            <MessageSquarePlus size={20} />
            {!isCollapsed && <span>New Chat</span>}
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 px-3 py-2">
          {!isCollapsed && (
            <div className="flex items-center gap-2 mb-3 px-2 transition-opacity duration-300">
              <Clock size={14} className="text-slate-500" />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">History</span>
            </div>
          )}

          <div className="space-y-1">
            {sessions.length === 0 ? (
              !isCollapsed && (
                <div className="text-center py-8 px-4 border border-dashed border-slate-800 rounded-lg">
                  <p className="text-xs text-slate-500">No conversations yet.</p>
                </div>
              )
            ) : (
              sessions.map(session => (
                <div 
                  key={session.id}
                  onClick={() => {
                    onSelectChat(session);
                    if (window.innerWidth < 768) toggleSidebar();
                  }}
                  className={`
                    group flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-3 rounded-lg cursor-pointer transition-all
                    ${currentSessionId === session.id 
                      ? 'bg-slate-800 text-white shadow-md' 
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'}
                  `}
                  title={isCollapsed ? session.preview : ""}
                >
                  <div className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}>
                    <MessageSquare size={16} className={`shrink-0 ${currentSessionId === session.id ? 'text-indigo-400' : 'text-slate-600 group-hover:text-indigo-400/70'}`} />
                    {!isCollapsed && (
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium truncate">
                          {session.preview || "New Conversation"}
                        </span>
                        <span className="text-[10px] opacity-60">
                           {new Date(session.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {!isCollapsed && (
                    <button 
                      onClick={(e) => onDeleteChat(e, session.id)}
                      className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer / User Profile */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
            <button 
                onClick={onViewProfile} 
                className={`flex items-center gap-3 group focus:outline-none ${isCollapsed ? 'justify-center' : ''} ${isCollapsed ? 'w-full' : ''}`}
                title={isCollapsed ? displayName : ''}
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs shrink-0 overflow-hidden">
                {displayAvatar ? (
                    <img src={displayAvatar} alt="User Avatar" className="w-full h-full object-cover" />
                ) : (
                    <UserCircle size={20} />
                )}
              </div>
              {!isCollapsed && (
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium text-slate-300">{displayName}</span>
                  <span className="text-xs text-slate-500">Online</span>
                </div>
              )}
            </button>
            <button 
              onClick={onLogout}
              className={`text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ${isCollapsed ? 'p-0' : 'p-2'}`}
              title="Log Out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>

      </div>
    </>
  );
};

