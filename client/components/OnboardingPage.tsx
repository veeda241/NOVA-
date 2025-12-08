import React, { useState } from 'react';
import Stepper, { Step } from './Stepper';
import { saveUserProfile, UserProfile } from '../services/userProfileService';
import { User, Target, Heart, Sparkles, UserCircle } from 'lucide-react';

interface OnboardingPageProps {
  onComplete: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');
  const [goal, setGoal] = useState('');
  const [feeling, setFeeling] = useState('');

  const handleFinish = () => {
    const profile: UserProfile = {
      name: name || 'User',
      gender: gender,
      goal: goal || 'Emotional Support',
      feeling: feeling || 'Neutral',
      interests: []
    };
    saveUserProfile(profile);
    onComplete();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-slate-200">
      <div className="w-full max-w-4xl">
        <Stepper
          initialStep={1}
          onFinalStepCompleted={handleFinish}
          backButtonText="Previous"
          nextButtonText="Continue"
        >
          {/* Step 1: Introduction / Name */}
          <Step>
            <div className="flex flex-col items-center text-center space-y-6 py-8">
              <div className="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
                <User size={40} />
              </div>
              <h2 className="text-3xl font-bold text-white">Let's get to know you</h2>
              <p className="text-slate-400 max-w-md">
                I'm NOVA, your AI companion. To provide the best support, I'd love to know what to call you.
              </p>
              <div className="w-full max-w-sm">
                <label className="block text-sm font-medium text-slate-400 mb-2 text-left">Your Name</label>
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
            </div>
          </Step>

          {/* Step 2: Gender */}
          <Step>
            <div className="flex flex-col items-center text-center space-y-6 py-8">
               <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                <UserCircle size={40} />
              </div>
              <h2 className="text-3xl font-bold text-white">How do you identify?</h2>
              <p className="text-slate-400 max-w-md">
                This helps me personalize my visual representation for you.
              </p>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-2xl mt-4">
                  {[
                    { id: 'male', label: 'Male', img: '/avatar-male.svg' },
                    { id: 'female', label: 'Female', img: '/avatar-female.svg' },
                    { id: 'other', label: 'Other / Neutral', img: '/avatar-other.svg' }
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setGender(opt.id as any)}
                      className={`relative group p-6 rounded-2xl border transition-all flex flex-col items-center gap-4 ${
                        gender === opt.id 
                          ? 'bg-indigo-600/20 border-indigo-500 ring-2 ring-indigo-500/50' 
                          : 'bg-slate-800 border-slate-700 hover:border-indigo-400'
                      }`}
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-700 border-2 border-slate-600 group-hover:scale-110 transition-transform">
                          <img src={opt.img} alt={opt.label} className="w-full h-full object-cover" />
                      </div>
                      <span className={`font-bold text-lg ${gender === opt.id ? 'text-white' : 'text-slate-400'}`}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
               </div>
            </div>
          </Step>

          {/* Step 3: Goals */}
          <Step>
            <div className="flex flex-col items-center text-center space-y-6 py-8">
              <div className="w-20 h-20 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 mb-4">
                <Target size={40} />
              </div>
              <h2 className="text-3xl font-bold text-white">What brings you here?</h2>
              <p className="text-slate-400 max-w-md">
                Understanding your primary goal helps me tailor our conversations.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-lg mt-4">
                {['Emotional Support', 'Personal Growth', 'Just Chatting', 'Venting', 'Advice', 'Loneliness'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setGoal(opt)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      goal === opt 
                        ? 'bg-rose-500/20 border-rose-500 text-white' 
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          </Step>

          {/* Step 4: Current Feeling */}
          <Step>
            <div className="flex flex-col items-center text-center space-y-6 py-8">
               <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4">
                <Heart size={40} />
              </div>
              <h2 className="text-3xl font-bold text-white">How are you feeling lately?</h2>
              <p className="text-slate-400 max-w-md">
                This gives me a baseline to start our journey. You can be honest.
              </p>
               <div className="w-full max-w-sm">
                <label className="block text-sm font-medium text-slate-400 mb-2 text-left">I'm feeling...</label>
                <textarea 
                  value={feeling}
                  onChange={(e) => setFeeling(e.target.value)}
                  placeholder="e.g., Anxious, Excited, Overwhelmed, Calm..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all h-32 resize-none"
                />
              </div>
            </div>
          </Step>

          {/* Step 5: Final */}
          <Step>
            <div className="flex flex-col items-center text-center space-y-6 py-8">
               <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 mb-4 animate-pulse">
                <Sparkles size={40} />
              </div>
              <h2 className="text-3xl font-bold text-white">You're all set!</h2>
              <p className="text-slate-400 max-w-md">
                Thanks for sharing, {name || 'Friend'}. I've customized my responses based on your profile. Let's start talking.
              </p>
            </div>
          </Step>
        </Stepper>
      </div>
    </div>
  );
};
