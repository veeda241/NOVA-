import React, { useEffect, useState } from 'react';
import { getUserProfile, UserProfile } from '../services/userProfileService';
import { User, Target, Heart, ArrowLeft, Settings, Shield } from 'lucide-react';

interface ProfilePageProps {
  onBack: () => void;
}

const getAvatarSrc = (gender: 'male' | 'female' | 'other'): string => {
  switch (gender) {
    case 'male': return '/avatar-male.svg';
    case 'female': return '/avatar-female.svg';
    case 'other': return '/avatar-other.svg';
    default: return '/avatar-other.svg';
  }
};

export const ProfilePage: React.FC<ProfilePageProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const data = getUserProfile();
    setProfile(data);
  }, []);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
        <p>No profile data found.</p>
        <button onClick={onBack} className="mt-4 text-indigo-400 hover:underline">Go Back</button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-2xl font-bold text-white">Your Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 mb-8 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <User size={200} />
           </div>
           
           <div className="flex items-center gap-6 mb-8 relative z-10">
             <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-indigo-500/20">
               <img src={getAvatarSrc(profile.gender)} alt="User Avatar" className="w-full h-full object-cover" />
             </div>
             <div>
               <h2 className="text-3xl font-bold text-white mb-1">{profile.name}</h2>
               <p className="text-slate-400">Member since {new Date().toLocaleDateString()}</p>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
             <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
               <div className="flex items-center gap-3 mb-2 text-rose-400">
                 <Target size={20} />
                 <span className="font-semibold">Primary Goal</span>
               </div>
               <p className="text-slate-200 text-lg">{profile.goal}</p>
             </div>

             <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/50">
               <div className="flex items-center gap-3 mb-2 text-emerald-400">
                 <Heart size={20} />
                 <span className="font-semibold">Current State</span>
               </div>
               <p className="text-slate-200 text-lg capitalize">{profile.feeling}</p>
             </div>
           </div>
        </div>

        {/* AI Behavior / Insights Section */}
        <div className="mb-8">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield size={20} className="text-indigo-400" />
                AI Persona Adaptation
            </h3>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <p className="text-slate-400 mb-4">
                    Based on your profile, NOVA has adapted its behavior to better suit your needs.
                </p>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <span className="text-slate-300">Empathy Level</span>
                        <div className="flex gap-1">
                            {[1,2,3,4,5].map(i => <div key={i} className={`w-8 h-2 rounded-full ${i <= 4 ? 'bg-indigo-500' : 'bg-slate-700'}`}></div>)}
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg">
                        <span className="text-slate-300">Response Tone</span>
                        <span className="text-xs font-bold px-2 py-1 bg-indigo-500/20 text-indigo-300 rounded uppercase">Supportive & Gentle</span>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
