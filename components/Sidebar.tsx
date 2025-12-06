import React from 'react';
import { User, UserRole } from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  Activity, 
  Settings, 
  LogOut, 
  UserCircle 
} from 'lucide-react';

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ user, activeTab, setActiveTab, onLogout }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assessment', label: 'New Assessment', icon: Activity },
    { id: 'reports', label: 'Patient Reports', icon: FileText },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-full shadow-xl">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">EmpathAI</h1>
        </div>
        <p className="text-xs text-slate-400 mt-2 ml-1">Professional Edition</p>
      </div>

      <div className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-slate-700">
        <div className="flex items-center gap-3 mb-4 px-2">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full border-2 border-slate-500" />
          ) : (
            <UserCircle className="w-10 h-10 text-slate-400" />
          )}
          <div className="overflow-hidden">
            <p className="text-sm font-semibold truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate">{user.role}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 text-slate-300 hover:text-white hover:bg-red-500/20 py-2 rounded-lg transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};