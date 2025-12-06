import React, { useState } from 'react';
import { analyzePatientEmotion } from '../services/geminiService';
import { AnalysisReport } from '../types';
import { Loader2, Send, FileText } from 'lucide-react';

interface AssessmentFormProps {
  onAnalysisComplete: (report: AnalysisReport) => void;
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({ onAnalysisComplete }) => {
  const [patientName, setPatientName] = useState('');
  const [inputNote, setInputNote] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !inputNote.trim()) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const report = await analyzePatientEmotion(inputNote, patientName);
      onAnalysisComplete(report);
    } catch (err) {
      setError("Failed to generate analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in-up">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-indigo-600 p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">New Emotional Assessment</h2>
          <p className="text-indigo-100">Enter patient details and observations for AI-driven analysis.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Patient / Student Name
            </label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Observations / Patient Input
            </label>
            <textarea
              value={inputNote}
              onChange={(e) => setInputNote(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all min-h-[200px] resize-y"
              placeholder="Describe the patient's current state, recent events, or paste a transcript of their communication..."
              required
            />
            <p className="text-xs text-slate-400 mt-2 text-right">
              {inputNote.length} characters
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-4">
            <button
              type="button"
              className="px-6 py-3 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition-colors"
              onClick={() => {
                setPatientName('');
                setInputNote('');
              }}
            >
              Clear Form
            </button>
            <button
              type="submit"
              disabled={isAnalyzing || !patientName || !inputNote}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold text-white transition-all transform hover:-translate-y-0.5 shadow-lg ${
                isAnalyzing || !patientName || !inputNote
                  ? 'bg-slate-400 cursor-not-allowed transform-none'
                  : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-500/25'
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Thinking...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Analyze Emotions
                </>
              )}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-500">
         <div className="flex flex-col items-center text-center p-4 bg-white rounded-lg border border-slate-200">
            <div className="bg-indigo-50 p-2 rounded-full mb-3">
               <FileText className="w-6 h-6 text-indigo-500" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Secure Logging</h4>
            <p className="text-xs mt-1">All inputs are processed securely and session-based.</p>
         </div>
         <div className="flex flex-col items-center text-center p-4 bg-white rounded-lg border border-slate-200">
             <div className="bg-indigo-50 p-2 rounded-full mb-3">
               <Loader2 className="w-6 h-6 text-indigo-500" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Real-time Analysis</h4>
            <p className="text-xs mt-1">Advanced AI engine processes emotional context instantly.</p>
         </div>
         <div className="flex flex-col items-center text-center p-4 bg-white rounded-lg border border-slate-200">
             <div className="bg-indigo-50 p-2 rounded-full mb-3">
               <Send className="w-6 h-6 text-indigo-500" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Actionable Plans</h4>
            <p className="text-xs mt-1">Receive immediate intervention strategies.</p>
         </div>
      </div>
    </div>
  );
};
