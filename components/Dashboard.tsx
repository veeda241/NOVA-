import React from 'react';
import { AnalysisReport } from '../types';
import { BookOpen, Activity, ArrowRight, BrainCircuit, MessageSquareHeart } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';

interface DashboardProps {
  reports: AnalysisReport[];
  onNavigate: (tab: string) => void;
  onViewReport: (report: AnalysisReport) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ reports, onNavigate, onViewReport }) => {
  const recentReports = [...reports].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
  
  // Prepare data for the graph
  const activityData = reports.length > 0 
    ? reports.map((r, i) => ({ 
        date: new Date(r.timestamp).toLocaleDateString(undefined, {month: 'short', day: 'numeric'}), 
        stress: r.stressLevel 
      })).reverse()
    : [
        { date: 'Mon', stress: 30 },
        { date: 'Tue', stress: 45 },
        { date: 'Wed', stress: 25 },
        { date: 'Thu', stress: 60 },
        { date: 'Fri', stress: 40 },
        { date: 'Sat', stress: 35 },
        { date: 'Sun', stress: 20 },
      ];

  const averageStress = reports.length > 0 
    ? Math.round(reports.reduce((acc, curr) => acc + curr.stressLevel, 0) / reports.length) 
    : 0;

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Welcome Banner */}
      <div className="bg-white rounded-xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Welcome back, Alex</h2>
          <p className="text-slate-500 max-w-xl">
            Your emotional well-being is important. Chat with NOVA or review your previous analysis reports.
          </p>
        </div>
        <button 
          onClick={() => onNavigate('chat')}
          className="whitespace-nowrap px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
        >
          <MessageSquareHeart className="w-5 h-5" />
          Chat with NOVA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Journal Entries</span>
          </div>
          <div className="flex items-end gap-2">
            <h3 className="text-3xl font-bold text-slate-800">{reports.length}</h3>
            <span className="text-xs text-slate-400 mb-1">Total Logs</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Avg. Stress Level</span>
          </div>
          <div className="flex items-end gap-2">
             <h3 className={`text-3xl font-bold ${averageStress > 50 ? 'text-orange-500' : 'text-emerald-600'}`}>
              {reports.length > 0 ? `${averageStress}%` : '-'}
            </h3>
            <span className="text-xs text-slate-400 mb-1">Last 30 Days</span>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 border-dashed flex items-center justify-center">
           <div className="text-center">
              <p className="text-sm text-slate-500 font-medium">Next Recommended Check-in</p>
              <p className="text-lg font-bold text-slate-700 mt-1">Tomorrow, 9:00 AM</p>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-lg font-bold text-slate-800">Emotional Trends</h3>
             <select className="text-xs border-slate-200 rounded-md text-slate-500 focus:ring-indigo-500 focus:border-indigo-500">
                <option>Last 7 Days</option>
                <option>Last Month</option>
             </select>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area 
                  type="monotone" 
                  dataKey="stress" 
                  stroke="#6366f1" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorStress)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent History List */}
        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Recent History</h3>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[300px] lg:max-h-none custom-scrollbar">
            {recentReports.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-slate-400 text-sm">No analysis history found.</p>
                <button 
                  onClick={() => onNavigate('chat')}
                  className="mt-2 text-indigo-600 text-xs font-semibold hover:underline"
                >
                  Start a Chat
                </button>
              </div>
            ) : (
              recentReports.map((report) => (
                <div 
                  key={report.id} 
                  onClick={() => onViewReport(report)}
                  className="group p-4 rounded-lg border border-slate-100 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-100 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-1 rounded border border-slate-100">
                      {new Date(report.timestamp).toLocaleDateString()}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                  </div>
                  <h4 className="font-semibold text-slate-900 group-hover:text-indigo-700 line-clamp-1">{report.primaryEmotion}</h4>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{report.inputSummary}</p>
                </div>
              ))
            )}
          </div>
          
          {reports.length > 0 && (
            <button 
              onClick={() => onNavigate('reports')}
              className="mt-6 w-full py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors"
            >
              View Full History
            </button>
          )}
        </div>
      </div>
    </div>
  );
};