import React, { useState } from 'react';
import { User } from '../types';
import { UserCircle, Mail, Phone, MapPin, Building, Calendar, Award, Edit2, Check, X } from 'lucide-react';

interface ProfileProps {
  user: User;
  stats: {
    total: number;
  };
  onUpdateUser: (updatedData: Partial<User>) => void;
}

export const Profile: React.FC<ProfileProps> = ({ user, stats, onUpdateUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: user.email || '',
    phone: user.phone || '',
    location: user.location || '',
    department: user.department || '',
    year: user.year || '',
    advisor: user.advisor || ''
  });

  const handleSave = () => {
    onUpdateUser(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      email: user.email || '',
      phone: user.phone || '',
      location: user.location || '',
      department: user.department || '',
      year: user.year || '',
      advisor: user.advisor || ''
    });
    setIsEditing(false);
  };

  const InputField = ({ value, onChange, icon: Icon, placeholder }: any) => (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-slate-400 flex-shrink-0" />
      <input 
        type="text" 
        value={value} 
        onChange={onChange}
        className="w-full px-3 py-1.5 border border-indigo-200 rounded-md text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-indigo-50/30"
        placeholder={placeholder}
      />
    </div>
  );

  return (
    <div className="animate-fade-in space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-indigo-600 to-blue-500 relative">
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)}
              className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
            >
              <Edit2 className="w-3 h-3" />
              Edit Profile
            </button>
          ) : (
            <div className="absolute top-4 right-4 flex gap-2">
              <button 
                onClick={handleSave}
                className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <Check className="w-3 h-3" />
                Save
              </button>
              <button 
                onClick={handleCancel}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg backdrop-blur-sm text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <X className="w-3 h-3" />
                Cancel
              </button>
            </div>
          )}
        </div>
        
        <div className="px-8 pb-8">
          <div className="relative flex items-end -mt-12 mb-6">
            <div className="p-1.5 bg-white rounded-full">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-32 h-32 rounded-full object-cover border border-slate-200" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-slate-200 flex items-center justify-center">
                  <UserCircle className="w-16 h-16 text-slate-400" />
                </div>
              )}
            </div>
            <div className="ml-6 mb-2">
              <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 mt-1">
                {user.role}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                   <UserCircle className="w-5 h-5 text-indigo-500" />
                   Personal Information
                </h3>
                <div className="space-y-4">
                  {isEditing ? (
                    <>
                      <InputField 
                        icon={Mail} 
                        value={formData.email} 
                        onChange={(e: any) => setFormData({...formData, email: e.target.value})} 
                        placeholder="Email Address"
                      />
                      <InputField 
                        icon={Phone} 
                        value={formData.phone} 
                        onChange={(e: any) => setFormData({...formData, phone: e.target.value})} 
                        placeholder="Phone Number"
                      />
                      <InputField 
                        icon={MapPin} 
                        value={formData.location} 
                        onChange={(e: any) => setFormData({...formData, location: e.target.value})} 
                        placeholder="Campus Location"
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span>{user.email || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{user.phone || 'Not provided'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>{user.location || 'Not provided'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                   <Building className="w-5 h-5 text-indigo-500" />
                   Academic Details
                </h3>
                <div className="space-y-4">
                  {isEditing ? (
                     <>
                      <div className="flex items-center gap-3 text-slate-600">
                        <span className="font-medium text-slate-700 w-24 shrink-0">Department:</span>
                        <input 
                          type="text" 
                          value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          className="w-full px-3 py-1.5 border border-indigo-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <span className="font-medium text-slate-700 w-24 shrink-0">Year:</span>
                         <input 
                          type="text" 
                          value={formData.year}
                          onChange={(e) => setFormData({...formData, year: e.target.value})}
                          className="w-full px-3 py-1.5 border border-indigo-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <span className="font-medium text-slate-700 w-24 shrink-0">Advisor:</span>
                         <input 
                          type="text" 
                          value={formData.advisor}
                          onChange={(e) => setFormData({...formData, advisor: e.target.value})}
                          className="w-full px-3 py-1.5 border border-indigo-200 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                     </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 text-slate-600">
                        <span className="font-medium text-slate-700 w-24">Department:</span>
                        <span>{user.department || 'Not assigned'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <span className="font-medium text-slate-700 w-24">Year:</span>
                        <span>{user.year || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <span className="font-medium text-slate-700 w-24">Advisor:</span>
                        <span>{user.advisor || 'Not assigned'}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 h-fit">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Assessment Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">Total Reports</span>
                  </div>
                  <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Award className="w-4 h-4" />
                    <span className="text-xs font-semibold uppercase">Status</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600">Active</p>
                </div>
              </div>
              
              <div className="mt-6">
                 <h4 className="text-sm font-semibold text-slate-700 mb-2">Recent Activity</h4>
                 <div className="relative pl-4 border-l-2 border-slate-200 space-y-4">
                    <div className="relative">
                       <div className="absolute -left-[21px] top-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white"></div>
                       <p className="text-sm text-slate-800 font-medium">Profile Updated</p>
                       <p className="text-xs text-slate-500">Just now</p>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
