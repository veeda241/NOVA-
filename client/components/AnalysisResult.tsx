import React from 'react';
import { AnalysisReport } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Download, AlertTriangle, CheckCircle, BrainCircuit, Calendar, ArrowLeft } from 'lucide-react';

interface AnalysisResultProps {
  report: AnalysisReport;
  onBack: () => void;
}

export const AnalysisResult: React.FC<AnalysisResultProps> = ({ report, onBack }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-fade-in p-4 md:p-8 bg-slate-50/5 md:bg-transparent min-h-full">
      {/* Header Section */}
      <div className="bg-white/10 backdrop-blur-md rounded-xl shadow-2xl border border-white/10 p-8 flex flex-col md:flex-row justify-between items-start gap-4 text-white">
        <div>
          <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 transition-colors">
             <ArrowLeft size={16} /> Back to Chat
          </button>
          <div className="flex items-center gap-2 mb-3">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold uppercase tracking-wide">
              Confidential Report
            </span>
            <span className="flex items-center gap-1 text-slate-400 text-sm">
              <Calendar className="w-3 h-3" />
              {new Date(report.timestamp).toLocaleString()}
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white">Psychological Assessment</h2>
          <p className="text-slate-400 text-sm mt-1">Subject: <span className="font-semibold text-white">{report.patientName}</span></p>
        </div>
        <button 
          onClick={handlePrint}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg transition-all shadow-lg shadow-indigo-600/20 no-print"
        >
          <Download className="w-4 h-4" />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Visuals */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-2">Emotional Profile</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={report.emotionalProfile} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="emotion" type="category" width={90} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{borderRadius: '8px', border: '1px solid #475569', backgroundColor: '#1e293b', color: '#f1f5f9'}}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24}>
                    {report.emotionalProfile.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-800 p-6">
            <h3 className="text-lg font-bold text-white mb-4 border-b border-slate-800 pb-2">Stress Indicator</h3>
            <div className="relative pt-2 pb-2">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-bold inline-block py-1 px-2 uppercase rounded-md text-indigo-300 bg-indigo-900/30 border border-indigo-500/30">
                    Calculated Level
                  </span>
                </div>
                <div className="text-right">
                  <span className={`text-lg font-bold ${report.stressLevel > 60 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {report.stressLevel}%
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-800">
                <div 
                  style={{ width: `${report.stressLevel}%` }} 
                  className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000 ease-out ${
                    report.stressLevel > 70 ? 'bg-red-500' : report.stressLevel > 40 ? 'bg-orange-400' : 'bg-emerald-500'
                  }`}
                ></div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed bg-slate-800/50 p-3 rounded-md border border-slate-700/50">
                {report.stressLevel > 70 
                  ? "Status: Critical. High stress levels detected. Immediate grounding techniques recommended." 
                  : report.stressLevel > 40 
                  ? "Status: Elevated. Moderate stress levels. Recommend monitoring triggers." 
                  : "Status: Nominal. Emotional state appears stable."}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Text Analysis */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-800 p-8">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-900/30 rounded-lg border border-indigo-500/30">
                   <BrainCircuit className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Clinical Analysis</h3>
             </div>
             
             <div className="prose prose-invert max-w-none">
               <div className="mb-8">
                 <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Root Cause Analysis</h4>
                 <p className="text-slate-300 leading-relaxed text-base border-l-4 border-indigo-500 pl-4 py-1">
                   {report.rootCauseAnalysis}
                 </p>
               </div>
               
               <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Long Term Strategy</h4>
                  <p className="text-slate-300 leading-relaxed text-base bg-slate-800/50 p-5 rounded-lg border border-slate-700/50">
                    {report.longTermStrategy}
                  </p>
               </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                   <AlertTriangle className="w-5 h-5 text-amber-500" />
                   <h3 className="text-md font-bold text-white">Key Observations</h3>
                </div>
                <p className="text-sm text-slate-300 italic bg-amber-900/10 p-4 rounded-lg border border-amber-500/20 text-amber-200/80">
                  "{report.inputSummary}"
                </p>
             </div>

             <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-lg border border-slate-800 p-6">
                <div className="flex items-center gap-2 mb-4">
                   <CheckCircle className="w-5 h-5 text-emerald-500" />
                   <h3 className="text-md font-bold text-white">Recommended Actions</h3>
                </div>
                <ul className="space-y-3">
                  {report.suggestedInterventions.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 bg-emerald-900/10 p-2 rounded-md border border-emerald-500/20">
                      <span className="flex-shrink-0 w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5"></span>
                      {item}
                    </li>
                  ))}
                </ul>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};