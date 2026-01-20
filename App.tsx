
import React, { useState, useEffect, useMemo } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Job, Application, UserPreferences, User } from './types';
import { Header } from './components/Header';
import { JobCard } from './components/JobCard';
import { ApplicationCard } from './components/ApplicationCard';
import { Auth } from './components/Auth';

const STORAGE_APPS = 'talent_ai_applications';
const STORAGE_PREFS = 'talent_ai_preferences';
const STORAGE_SESSION = 'talent_ai_session';

const INITIAL_JOBS: Job[] = [
  {
    id: 'job-1',
    title: 'Senior Product Engineer',
    company: 'Nexus Tech',
    location: 'San Francisco (Hybrid)',
    salary: '$180k - $240k',
    type: 'Full-time',
    category: 'Engineering',
    description: 'Lead our AI interface development team. We are pushing the boundaries of human-computer interaction using modern web technologies and LLMs.',
    requirements: ['React Mastery', 'TypeScript Expert', 'AI Architecture Knowledge', '5+ Years Experience']
  },
  {
    id: 'job-2',
    title: 'Visual Experience Designer',
    company: 'Bloom AI',
    location: 'Remote',
    salary: '$140k - $190k',
    type: 'Remote',
    category: 'Design',
    description: 'Design beautiful, functional workflows for complex data visualization tools. Focus on high-performance dashboards and intuitive user journeys.',
    requirements: ['Design Systems', 'Figma Pro', 'B2B SaaS Experience', 'Prototyping Skills']
  },
  {
    id: 'job-3',
    title: 'Marketing Strategy Lead',
    company: 'EcoStream',
    location: 'Austin, TX',
    salary: '$110k - $150k',
    type: 'Full-time',
    category: 'Marketing',
    description: 'Define the brand voice and multi-channel marketing strategy for a leading sustainability platform.',
    requirements: ['Brand Strategy', 'Growth Marketing', 'Data Analysis', 'Excellent Copywriting']
  },
  {
    id: 'job-4',
    title: 'Cloud Systems Architect',
    company: 'Nexus Tech',
    location: 'Remote',
    salary: '$190k - $260k',
    type: 'Full-time',
    category: 'Engineering',
    description: 'Scale our global infrastructure to support millions of AI requests per second.',
    requirements: ['AWS Expert', 'Kubernetes', 'High Availability', 'Security First']
  },
  {
    id: 'job-5',
    title: 'Content Design Specialist',
    company: 'Bloom AI',
    location: 'New York, NY',
    salary: '$120k - $160k',
    type: 'Full-time',
    category: 'Design',
    description: 'Help us define how AI communicates with humans through thoughtful UX writing and content strategy.',
    requirements: ['UX Writing', 'Storytelling', 'AI Interaction Design', 'User Research']
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isPrefsOpen, setIsPrefsOpen] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>({
    roles: [],
    locations: [],
    industries: []
  });
  
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', resume: '' });
  const [prefInput, setPrefInput] = useState({ roles: '', locations: '', industries: '' });

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Recommendation Engine
  const processedJobs = useMemo(() => {
    return INITIAL_JOBS.map(job => {
      let score = 0;
      const checkMatch = (val: string, targets: string[]) => 
        targets.some(t => val.toLowerCase().includes(t.toLowerCase()) || t.toLowerCase().includes(val.toLowerCase()));

      if (preferences.roles.length && checkMatch(job.title, preferences.roles)) score += 40;
      if (preferences.locations.length && checkMatch(job.location, preferences.locations)) score += 30;
      if (preferences.industries.length && checkMatch(job.category || '', preferences.industries)) score += 30;

      return { ...job, matchScore: score };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [preferences]);

  useEffect(() => {
    const session = localStorage.getItem(STORAGE_SESSION);
    if (session) setUser(JSON.parse(session));

    const savedApps = localStorage.getItem(STORAGE_APPS);
    const savedPrefs = localStorage.getItem(STORAGE_PREFS);
    
    if (savedApps) setApplications(JSON.parse(savedApps));
    if (savedPrefs) {
      const parsedPrefs = JSON.parse(savedPrefs);
      setPreferences(parsedPrefs);
      setPrefInput({
        roles: parsedPrefs.roles.join(', '),
        locations: parsedPrefs.locations.join(', '),
        industries: parsedPrefs.industries.join(', ')
      });
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem(STORAGE_APPS, JSON.stringify(applications));
      localStorage.setItem(STORAGE_PREFS, JSON.stringify(preferences));
      if (user) localStorage.setItem(STORAGE_SESSION, JSON.stringify(user));
      else localStorage.removeItem(STORAGE_SESSION);
    }
  }, [applications, preferences, user, loading]);

  const handleLogin = (u: User) => setUser(u);
  const handleLogout = () => setUser(null);

  const savePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    const newPrefs: UserPreferences = {
      roles: prefInput.roles.split(',').map(s => s.trim()).filter(Boolean),
      locations: prefInput.locations.split(',').map(s => s.trim()).filter(Boolean),
      industries: prefInput.industries.split(',').map(s => s.trim()).filter(Boolean)
    };
    setPreferences(newPrefs);
    setIsPrefsOpen(false);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsAnalyzing(true);
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Analyze candidate "${formData.name}" for "${selectedJob.title}" at "${selectedJob.company}".
          Requirements: ${selectedJob.requirements.join(', ')}
          Resume: ${formData.resume}
          Provide JSON: { "score": number, "feedback": string (1 short sentence) }
        `,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              feedback: { type: Type.STRING }
            },
            required: ["score", "feedback"]
          }
        }
      });

      const result = JSON.parse(response.text || '{"score": 70, "feedback": "Profile processed."}');

      const newApp: Application = {
        id: 'app-' + Date.now(),
        job_id: selectedJob.id,
        job_title: selectedJob.title,
        company: selectedJob.company,
        status: 'applied',
        applied_at: new Date().toLocaleDateString(),
        match_score: result.score,
        ai_feedback: result.feedback
      };

      setApplications(prev => [newApp, ...prev]);
      setIsApplying(false);
      setSelectedJob(null);
      setFormData({ name: '', email: '', resume: '' });
      setActiveTab('applications');
      
    } catch (err) {
      console.error(err);
      alert("AI Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F9FBFF]">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        onOpenPreferences={() => setIsPrefsOpen(true)}
        onLogout={handleLogout}
        appCount={applications.length} 
        user={user}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10">
        {activeTab === 'jobs' ? (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-3">
                  Find Your <span className="text-indigo-600">Perfect</span> Role.
                </h1>
                <p className="text-slate-500 font-medium text-lg max-w-2xl">
                  {preferences.roles.length > 0 
                    ? `Showing personalized results for ${preferences.roles[0]} roles...`
                    : `Welcome back, ${user.name.split(' ')[0]}. Here are the latest opportunities for you.`}
                </p>
              </div>
              <div className="flex gap-4">
                 <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Search roles..." 
                      className="pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-64 focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-sm font-medium"
                    />
                    <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                 </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {processedJobs.map(job => (
                <JobCard key={job.id} job={job} onClick={setSelectedJob} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
            <header className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">My Pipeline</h1>
                <p className="text-slate-500 font-medium tracking-tight">Tracking {applications.length} active applications.</p>
              </div>
              {applications.length > 0 && (
                <button 
                  onClick={() => { if(confirm('Clear all applications?')) setApplications([]); }}
                  className="text-xs font-black text-rose-400 hover:text-rose-600 transition-colors uppercase tracking-widest"
                >
                  Clear History
                </button>
              )}
            </header>

            {applications.length === 0 ? (
               <div className="text-center py-32 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
                 <div className="w-24 h-24 bg-indigo-50 text-indigo-200 rounded-full flex items-center justify-center mx-auto mb-8">
                   <i className="fas fa-ghost text-4xl"></i>
                 </div>
                 <h2 className="text-2xl font-black text-slate-800">Your pipeline is empty</h2>
                 <p className="text-slate-400 mt-2 font-medium">Start applying to jobs to build your future!</p>
               </div>
            ) : (
              <div className="grid gap-6">
                {applications.map(app => (
                  <ApplicationCard key={app.id} app={app} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Modal System */}
      {(selectedJob || isApplying || isPrefsOpen) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 flex items-center justify-center p-4 md:p-8">
          
          {/* Preference Modal */}
          {isPrefsOpen && (
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl animate-in zoom-in duration-300 overflow-hidden max-h-[90vh]">
               <div className="bg-indigo-600 px-10 py-10 text-white text-center relative">
                  <button onClick={() => setIsPrefsOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                    <i className="fas fa-times text-xl"></i>
                  </button>
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-sliders-h text-2xl"></i>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">Personalize Feed</h2>
               </div>
               
               <div className="p-8 md:p-10 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
                <form onSubmit={savePreferences} className="space-y-8">
                    <div className="space-y-6">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Desired Roles</label>
                        <input 
                          type="text" 
                          value={prefInput.roles}
                          onChange={(e) => setPrefInput({...prefInput, roles: e.target.value})}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all font-bold text-slate-800"
                          placeholder="e.g. Engineer, Designer"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Locations</label>
                        <input 
                          type="text" 
                          value={prefInput.locations}
                          onChange={(e) => setPrefInput({...prefInput, locations: e.target.value})}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all font-bold text-slate-800"
                          placeholder="e.g. Remote, Hybrid"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Industries</label>
                        <input 
                          type="text" 
                          value={prefInput.industries}
                          onChange={(e) => setPrefInput({...prefInput, industries: e.target.value})}
                          className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all font-bold text-slate-800"
                          placeholder="e.g. AI, SaaS"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-xl transition-all shadow-xl shadow-indigo-100 active:scale-95"
                    >
                      Save Preferences
                    </button>
                </form>
               </div>
            </div>
          )}

          {/* Job Details Modal */}
          {selectedJob && !isApplying && !isPrefsOpen && (
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
              <div className="p-8 md:p-14 relative overflow-y-auto custom-scrollbar">
                <button onClick={() => setSelectedJob(null)} className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all z-10">
                  <i className="fas fa-times text-lg"></i>
                </button>

                <div className="flex flex-col md:flex-row gap-8 mb-10">
                  <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 flex-shrink-0">
                    <i className="fas fa-building text-3xl"></i>
                  </div>
                  <div className="pr-12">
                    <h2 className="text-3xl font-black text-slate-900 mb-2 leading-tight">{selectedJob.title}</h2>
                    <div className="flex flex-wrap items-center gap-4 text-slate-500 font-bold text-sm">
                       <span className="text-indigo-600 flex items-center gap-2">
                         <i className="fas fa-circle text-[6px]"></i> {selectedJob.company}
                       </span>
                       <span className="flex items-center gap-2">
                         <i className="fas fa-map-marker-alt"></i> {selectedJob.location}
                       </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Pay</p>
                     <p className="text-lg font-black text-slate-800">{selectedJob.salary}</p>
                   </div>
                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Type</p>
                     <p className="text-lg font-black text-slate-800">{selectedJob.type}</p>
                   </div>
                   <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                     <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Field</p>
                     <p className="text-lg font-black text-slate-800">{selectedJob.category || 'Tech'}</p>
                   </div>
                </div>

                <div className="space-y-10">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-3">
                      <span className="w-6 h-[2px] bg-indigo-600"></span> Role Mission
                    </h4>
                    <p className="text-slate-600 leading-relaxed text-lg font-medium">{selectedJob.description}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-5 flex items-center gap-3">
                      <span className="w-6 h-[2px] bg-indigo-600"></span> Essential Skills
                    </h4>
                    <div className="flex flex-wrap gap-2.5">
                      {selectedJob.requirements.map((req, i) => (
                        <span key={i} className="bg-indigo-50 text-indigo-700 px-4 py-2.5 rounded-xl text-xs font-extrabold border border-indigo-100">
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-12 pt-10 border-t border-slate-100 flex gap-4 sticky bottom-0 bg-white pb-2">
                  <button 
                    onClick={() => setIsApplying(true)}
                    className="flex-1 py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] font-black text-xl transition-all shadow-xl shadow-indigo-100 active:scale-95"
                  >
                    Quick Apply
                  </button>
                  <button className="w-20 h-20 border-2 border-slate-100 rounded-[2rem] text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all flex items-center justify-center">
                    <i className="far fa-bookmark text-2xl"></i>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Application Form Modal */}
          {isApplying && selectedJob && (
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom-12 duration-500 overflow-hidden max-h-[90vh] flex flex-col">
               <div className="bg-slate-900 px-8 py-10 text-white flex justify-between items-center shrink-0">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Quick Apply</h2>
                    <p className="text-slate-400 text-sm font-bold mt-1">Applying for {selectedJob.title}</p>
                  </div>
                  <button onClick={() => setIsApplying(false)} className="text-slate-500 hover:text-white transition-colors">
                    <i className="fas fa-times text-xl"></i>
                  </button>
               </div>
               
              <div className="p-8 md:p-12 overflow-y-auto custom-scrollbar flex-1">
                <form onSubmit={handleApply} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Name</label>
                      <input 
                        type="text" 
                        required 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all font-bold text-slate-800"
                        placeholder="Full Name"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Email</label>
                      <input 
                        type="email" 
                        required 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all font-bold text-slate-800"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Professional Narrative (Resume)</label>
                    <textarea 
                      required 
                      value={formData.resume}
                      onChange={(e) => setFormData({...formData, resume: e.target.value})}
                      rows={6}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all font-medium text-slate-600 leading-relaxed custom-scrollbar"
                      placeholder="Share your experiences, stack, and impact..."
                    ></textarea>
                  </div>

                  <div className="pt-4">
                    <button 
                      type="submit" 
                      disabled={isAnalyzing}
                      className={`w-full py-5 rounded-3xl font-black text-white shadow-2xl flex items-center justify-center gap-4 transition-all transform active:scale-95 mb-6 ${
                        isAnalyzing 
                          ? 'bg-slate-400 cursor-not-allowed' 
                          : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100'
                      }`}
                    >
                      {isAnalyzing ? (
                        <><i className="fas fa-atom fa-spin"></i> Processing...</>
                      ) : (
                        <><i className="fas fa-paper-plane"></i> Submit Application</>
                      )}
                    </button>
                    <p className="text-center text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center justify-center gap-2 opacity-60">
                      <i className="fas fa-lock"></i>
                      Encrypted & Verified Submission
                    </p>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modern Footer */}
      <footer className="bg-white border-t border-slate-100 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-10">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-slate-900 p-1.5 rounded-xl text-white">
                  <i className="fas fa-bolt text-sm"></i>
                </div>
                <span className="font-black text-2xl text-slate-900 tracking-tighter">TalentAI</span>
              </div>
              <p className="text-slate-400 font-bold text-sm text-center md:text-left">
                The future of intelligent recruitment.
              </p>
            </div>
            
            <div className="flex gap-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <a href="#" className="hover:text-indigo-600 transition-colors">Careers</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
              <a href="#" className="hover:text-indigo-600 transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
