import React from 'react';
import { EmotionAnalysis } from '../types';
import { Activity, BrainCircuit } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

interface EmotionPanelProps {
  analysis: EmotionAnalysis | undefined;
}

export const EmotionPanel: React.FC<EmotionPanelProps> = ({ analysis }) => {
  if (!analysis) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-500 p-6 text-center border-l border-slate-800 bg-slate-900/50">
        <BrainCircuit size={48} className="mb-4 opacity-20" />
        <p>NOVA is waiting for input...</p>
        <p className="text-xs mt-2 opacity-50">Speak, type, or show your face to begin emotional analysis.</p>
      </div>
    );
  }

  // Prepare data for chart (mocking other emotions to show relative scale if needed, or just showing the one)
  const data = [
    { name: analysis.detected_emotion, value: analysis.confidence * 100 }
  ];

  // Color mapping based on emotion (simplified)
  const getColor = (emotion: string) => {
    const e = emotion.toLowerCase();
    if (['joy', 'admiration', 'love', 'optimism'].includes(e)) return '#4ade80'; // Green
    if (['sadness', 'grief', 'remorse', 'disappointment'].includes(e)) return '#60a5fa'; // Blue
    if (['anger', 'annoyance', 'disapproval', 'rage'].includes(e)) return '#f87171'; // Red
    if (['fear', 'nervousness', 'anxiety'].includes(e)) return '#a78bfa'; // Purple
    return '#94a3b8'; // Slate/Neutral
  };

  const barColor = getColor(analysis.detected_emotion);

  return (
    <div className="h-full flex flex-col p-6 bg-slate-900 border-l border-slate-800 overflow-y-auto w-full">
      <div className="mb-6 flex items-center gap-2">
        <Activity className="text-rose-500" size={20} />
        <h2 className="text-lg font-bold text-white tracking-wider">LIVE ANALYSIS</h2>
      </div>

      <div className="mb-8">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Detected Emotion</h3>
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
              <XAxis type="number" domain={[0, 100]} hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke="#94a3b8" 
                fontSize={12} 
                width={100}
                tick={{fill: '#e2e8f0'}}
              />
              <Tooltip 
                cursor={{fill: 'transparent'}} 
                contentStyle={{backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9'}}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                 <Cell fill={barColor} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex justify-between items-center text-sm">
           <span className="text-slate-400">Confidence Score:</span>
           <span className="font-mono text-white">{(analysis.confidence * 100).toFixed(1)}%</span>
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Internal Reasoning (GoEmotions)</h3>
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
          <p className="text-sm text-slate-300 leading-relaxed italic">
            "{analysis.reasoning}"
          </p>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800">
        <h4 className="text-xs text-slate-500 font-mono mb-2">ACTIVE MODELS</h4>
        <div className="flex flex-wrap gap-2">
          <span className="px-2 py-1 bg-slate-800 rounded text-xs text-rose-300 border border-rose-900/30">EmpatheticDialogues</span>
          <span className="px-2 py-1 bg-slate-800 rounded text-xs text-sky-300 border border-sky-900/30">GoEmotions</span>
          <span className="px-2 py-1 bg-slate-800 rounded text-xs text-indigo-300 border border-indigo-900/30">FER2013 (Sim)</span>
          <span className="px-2 py-1 bg-slate-800 rounded text-xs text-purple-300 border border-purple-900/30">RAVDESS (Sim)</span>
        </div>
      </div>
    </div>
  );
};