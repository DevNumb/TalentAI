
import React from 'react';
import { User } from '../types';

interface HeaderProps {
  activeTab: 'jobs' | 'applications';
  onTabChange: (tab: 'jobs' | 'applications') => void;
  onOpenPreferences: () => void;
  onLogout: () => void;
  appCount: number;
  user: User | null;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onOpenPreferences, onLogout, appCount, user }) => {
  return (
    <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
      <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onTabChange('jobs')}>
        <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-indigo-200 shadow-lg group-hover:scale-110 transition-transform">
          <i className="fas fa-bolt text-lg"></i>
        </div>
        <span className="text-xl font-black tracking-tight text-slate-800">TalentAI</span>
      </div>
      
      <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
        <button 
          onClick={() => onTabChange('jobs')}
          className={`px-6 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'jobs' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <i className="fas fa-search mr-2 opacity-70"></i>
          Explore
        </button>
        <button 
          onClick={() => onTabChange('applications')}
          className={`px-6 py-2 text-sm font-bold rounded-lg transition-all relative ${activeTab === 'applications' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <i className="fas fa-layer-group mr-2 opacity-70"></i>
          Pipeline
          {appCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-600 text-[10px] text-white items-center justify-center font-bold">
                {appCount}
              </span>
            </span>
          )}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenPreferences}
          className="hidden lg:flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors"
        >
          <i className="fas fa-sliders-h"></i>
          Personalize
        </button>
        
        <div className="flex items-center gap-3 border-l pl-4 border-slate-100 ml-2">
          <div className="hidden sm:block text-right">
            <p className="text-xs font-black text-slate-800 leading-none mb-1">{user?.name || 'Guest User'}</p>
            <button onClick={onLogout} className="text-[10px] font-black text-rose-400 hover:text-rose-600 uppercase tracking-widest transition-colors">Logout</button>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 border-2 border-white shadow-md overflow-hidden flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
             <i className="fas fa-user text-white text-sm"></i>
          </div>
        </div>
      </div>
    </nav>
  );
};
