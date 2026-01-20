
import React from 'react';
import { Job } from '../types';

interface JobCardProps {
  job: Job;
  onClick: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onClick }) => {
  const isHighMatch = job.matchScore && job.matchScore >= 60;

  return (
    <div 
      className={`bg-white p-6 rounded-3xl border shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full relative ${isHighMatch ? 'border-indigo-200 bg-gradient-to-b from-indigo-50/30 to-white' : 'border-slate-100'}`}
      onClick={() => onClick(job)}
    >
      {isHighMatch && (
        <div className="absolute -top-3 left-6 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-indigo-200 animate-bounce">
          <i className="fas fa-sparkles mr-1"></i> AI Match {job.matchScore}%
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isHighMatch ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-indigo-200'}`}>
          <i className="fas fa-building text-2xl"></i>
        </div>
        <div className="flex flex-col items-end">
          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
            {job.type}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : 'Just now'}
          </span>
        </div>
      </div>

      <h3 className="text-xl font-extrabold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
        {job.title}
      </h3>
      <p className="text-slate-500 font-semibold text-sm mb-6 flex items-center gap-2">
        <span className="text-indigo-400">@</span> {job.company}
      </p>
      
      <div className="flex flex-wrap gap-2 mb-8">
        <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 text-xs text-slate-600 font-medium">
          <i className="fas fa-map-marker-alt text-slate-300"></i>
          {job.location}
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 text-xs text-emerald-700 font-bold">
          <i className="fas fa-coins text-emerald-300"></i>
          {job.salary}
        </div>
      </div>
      
      <div className="mt-auto">
        <button className={`w-full py-3 rounded-2xl font-bold transition-all shadow-sm ${isHighMatch ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white group-hover:bg-indigo-600'}`}>
          Apply Now
        </button>
      </div>
    </div>
  );
};
