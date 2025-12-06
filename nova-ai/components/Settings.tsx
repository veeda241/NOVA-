import React from 'react';
import { Save, Bell, Lock, Eye, Monitor } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto animate-fade-in space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 px-6 py-4">
           <h2 className="text-lg font-semibold text-slate-800">System Preferences</h2>
           <p className="text-sm text-slate-500">Manage your account settings and application preferences.</p>
        </div>
        
        <div className="divide-y divide-slate-100">
           {/* Section 1 */}
           <div className="p-6">
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                 <Bell className="w-4 h-4" /> Notifications
              </h3>
              <div className="space-y-4 pl-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-sm font-medium text-slate-800">Email Alerts</p>
                       <p className="text-xs text-slate-500">Receive analysis reports via email.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                 </div>
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-sm font-medium text-slate-800">Weekly Digest</p>
                       <p className="text-xs text-slate-500">Summary of emotional trends every Monday.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                 </div>
              </div>
           </div>

           {/* Section 2 */}
           <div className="p-6">
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                 <Lock className="w-4 h-4" /> Privacy & Security
              </h3>
              <div className="space-y-4 pl-6">
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-sm font-medium text-slate-800">Data Sharing</p>
                       <p className="text-xs text-slate-500">Allow anonymous data usage for research.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                 </div>
                 <div className="flex items-center justify-between">
                    <div>
                       <p className="text-sm font-medium text-slate-800">Two-Factor Authentication</p>
                       <p className="text-xs text-slate-500">Secure your account with 2FA.</p>
                    </div>
                    <button className="text-sm text-indigo-600 font-medium hover:underline">Enable</button>
                 </div>
              </div>
           </div>
           
           {/* Section 3 */}
           <div className="p-6">
              <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-4 flex items-center gap-2">
                 <Monitor className="w-4 h-4" /> Appearance
              </h3>
              <div className="space-y-4 pl-6">
                 <div className="flex items-center gap-4">
                     <button className="px-4 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-md text-sm font-medium">Light Mode</button>
                     <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-md text-sm font-medium hover:bg-slate-50">Dark Mode</button>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
           <button className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
              <Save className="w-4 h-4" />
              Save Changes
           </button>
        </div>
      </div>
    </div>
  );
};