
import React from 'react';
import { Application } from '../types';

export const ApplicationCard: React.FC<{ app: Application }> = ({ app }) => {
  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'applied': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'interview': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case 'rejected': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'offered': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-lg transition-all overflow-hidden relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 shadow-inner">
            <i className="fas fa-file-contract text-3xl"></i>
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">{app.job_title}</h3>
            <div className="flex items-center gap-3 text-slate-500 text-sm mt-1">
              <span className="font-bold text-indigo-600">{app.company}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
              <span className="font-medium">Applied {app.applied_at}</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-10">
          <div className="flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Match Strength</span>
              <span className="font-black text-slate-800 text-sm ml-4">{app.match_score}%</span>
            </div>
            <div className="w-40 h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-50">
              <div 
                className={`h-full transition-all duration-1000 ${app.match_score > 80 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : app.match_score > 60 ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]'}`}
                style={{ width: `${app.match_score}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex flex-col items-start lg:items-end">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">Process Stage</span>
            <span className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border ${getStatusStyles(app.status)} shadow-sm`}>
              {app.status}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 pt-6 border-t border-dashed border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 flex gap-4">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-600 shadow-sm">
            <i className="fas fa-robot"></i>
          </div>
          <div>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">AI Selection Insight</p>
            <p className="text-sm text-slate-600 leading-relaxed font-medium italic">"{app.ai_feedback}"</p>
          </div>
        </div>
      </div>
    </div>
  );
};
