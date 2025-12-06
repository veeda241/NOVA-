import React, { useState } from 'react';
import { AnalysisReport } from '../types';
import { Search, FileText, ChevronRight } from 'lucide-react';

interface ReportListProps {
  reports: AnalysisReport[];
  onViewReport: (report: AnalysisReport) => void;
}

export const ReportList: React.FC<ReportListProps> = ({ reports, onViewReport }) => {
  const [search, setSearch] = useState('');

  const filteredReports = reports.filter(r => 
    r.patientName.toLowerCase().includes(search.toLowerCase()) ||
    r.primaryEmotion.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-slate-800">All Patient Reports</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search patients..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64 text-slate-900 placeholder-slate-400"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold">
            <tr>
              <th className="px-6 py-4">Patient Name</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Primary Emotion</th>
              <th className="px-6 py-4">Stress Level</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No reports found matching your criteria.
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr 
                  key={report.id} 
                  onClick={() => onViewReport(report)}
                  className="hover:bg-indigo-50/50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                      {report.patientName.charAt(0)}
                    </div>
                    {report.patientName}
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    {new Date(report.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      {report.primaryEmotion}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                           <div 
                              className={`h-full rounded-full ${report.stressLevel > 60 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${report.stressLevel}%`}} 
                           />
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{report.stressLevel}%</span>
                     </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 group-hover:text-indigo-600">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
