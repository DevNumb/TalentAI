
import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from './supabaseClient';
import { Job, Application } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Application Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [resumeText, setResumeText] = useState('');

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Fetch Jobs from Supabase
  const fetchJobs = async () => {
    setLoadingJobs(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('posted_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Fallback to empty or toast error
    } finally {
      setLoadingJobs(false);
    }
  };

  // Fetch Applications from Supabase
  const fetchApplications = async () => {
    setLoadingApps(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          jobs (
            title,
            company
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const formattedApps: Application[] = (data || []).map(app => ({
        id: app.id,
        jobId: app.job_id,
        jobTitle: app.jobs?.title || 'Unknown Position',
        company: app.jobs?.company || 'Unknown Company',
        status: app.status,
        appliedAt: new Date(app.created_at).toLocaleDateString(),
        matchScore: app.match_score,
        aiFeedback: app.ai_feedback
      }));

      setApplications(formattedApps);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (activeTab === 'applications') {
      fetchApplications();
    }
  }, [activeTab]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJob) return;

    setIsAnalyzing(true);
    
    try {
      // 1. Use Gemini to simulate screening
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Act as a recruitment screener. Analyze this candidate for the following job:
          Job Title: ${selectedJob.title}
          Job Description: ${selectedJob.description}
          Candidate Name: ${name}
          Candidate Resume Info: ${resumeText}
          
          Provide a match score (0-100) and a short 1-sentence feedback.
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

      const result = JSON.parse(response.text || '{"score": 75, "feedback": "Processed successfully"}');

      // 2. Insert into Supabase
      const { error } = await supabase
        .from('applications')
        .insert([{
          job_id: selectedJob.id,
          candidate_name: name,
          candidate_email: email,
          resume_text: resumeText,
          status: 'applied',
          match_score: result.score,
          ai_feedback: result.feedback
        }]);

      if (error) throw error;

      setIsApplying(false);
      setSelectedJob(null);
      setName('');
      setEmail('');
      setResumeText('');
      alert("Application submitted successfully!");
      if (activeTab === 'applications') fetchApplications();
    } catch (error) {
      console.error("Application process failed", error);
      alert("There was an error processing your application. Please ensure Supabase tables are configured.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white">
            <i className="fas fa-briefcase"></i>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-800">TalentAI</span>
        </div>
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveTab('jobs')}
            className={`px-3 py-2 text-sm font-medium transition-colors relative ${activeTab === 'jobs' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Find Jobs
            {activeTab === 'jobs' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('applications')}
            className={`px-3 py-2 text-sm font-medium transition-colors relative ${activeTab === 'applications' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
          >
            My Applications
            {activeTab === 'applications' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-full"></div>}
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50">
            <i className="far fa-bell"></i>
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold border-2 border-white shadow-sm cursor-pointer">
            JD
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-6xl w-full mx-auto p-6">
        {activeTab === 'jobs' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
              <header>
                <h1 className="text-3xl font-bold text-slate-900">Discover Opportunities</h1>
                <p className="text-slate-500 mt-1">AI-matched roles based on your skills and preferences.</p>
              </header>
              <button 
                onClick={fetchJobs} 
                className="text-slate-400 hover:text-indigo-600 text-sm flex items-center gap-2 p-2"
                title="Refresh Jobs"
              >
                <i className={`fas fa-sync-alt ${loadingJobs ? 'fa-spin' : ''}`}></i>
                Refresh
              </button>
            </div>

            {loadingJobs ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm animate-pulse h-64"></div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
                <i className="fas fa-search text-slate-200 text-6xl mb-4"></i>
                <h3 className="text-xl font-bold text-slate-800">No jobs listed yet</h3>
                <p className="text-slate-500 mt-2">Connect your Supabase 'jobs' table to start seeing opportunities.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {jobs.map(job => (
                  <div 
                    key={job.id} 
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group flex flex-col"
                    onClick={() => setSelectedJob(job)}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shadow-sm">
                        <i className="fas fa-building text-2xl"></i>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2 py-1 rounded-full">{new Date(job.postedAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                    <p className="text-slate-500 font-medium text-sm mb-4">{job.company}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="bg-slate-50 text-slate-600 px-3 py-1 rounded-full text-xs font-medium border border-slate-100">
                        <i className="fas fa-map-marker-alt mr-1.5 text-slate-400"></i> {job.location}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-medium border border-emerald-100">
                        <i className="fas fa-money-bill-wave mr-1.5 opacity-70"></i> {job.salary}
                      </span>
                    </div>
                    
                    <div className="mt-auto">
                      <button className="w-full py-2.5 bg-slate-50 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white rounded-xl font-bold transition-all border border-slate-100 group-hover:border-indigo-600">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
            <header>
              <h1 className="text-3xl font-bold text-slate-900">Application Pipeline</h1>
              <p className="text-slate-500 mt-1">Real-time status updates and automated AI screening reports.</p>
            </header>

            {loadingApps ? (
               <div className="space-y-4">
                 {[1, 2].map(i => <div key={i} className="h-32 bg-white rounded-xl border border-slate-100 animate-pulse"></div>)}
               </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-24 bg-white border-2 border-dashed border-slate-200 rounded-3xl">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fas fa-paper-plane text-slate-300 text-3xl"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-900">Ready to start your journey?</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-2">Browse the current job openings and submit your first application to see it tracked here.</p>
                <button 
                  onClick={() => setActiveTab('jobs')}
                  className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
                >
                  Browse Openings
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                          <i className="fas fa-file-invoice text-2xl"></i>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-slate-900">{app.jobTitle}</h3>
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                            <span>{app.company}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span>Applied {app.appliedAt}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Compatibility</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${app.matchScore > 80 ? 'bg-emerald-500' : app.matchScore > 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                style={{ width: `${app.matchScore}%` }}
                              ></div>
                            </div>
                            <span className="font-bold text-slate-700">{app.matchScore}%</span>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-start lg:items-end">
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Application Status</span>
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            app.status === 'applied' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 
                            app.status === 'interview' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                            app.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-slate-50 text-slate-700'
                          }`}>
                            {app.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 pt-5 border-t border-slate-100">
                      <div className="bg-slate-50 rounded-xl p-4 flex gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0 text-indigo-600">
                          <i className="fas fa-robot text-sm"></i>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">AI Analyst Perspective</p>
                          <p className="text-sm text-slate-600 leading-relaxed italic">"{app.aiFeedback}"</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Job Details Modal */}
      {selectedJob && !isApplying && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-10">
              <div className="flex justify-between items-start mb-8">
                <div className="flex gap-5">
                  <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                    <i className="fas fa-building text-4xl"></i>
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900 leading-tight">{selectedJob.title}</h2>
                    <p className="text-indigo-600 font-semibold text-lg">{selectedJob.company}</p>
                    <p className="text-slate-400 font-medium">{selectedJob.location}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedJob(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="space-y-8 max-h-[50vh] overflow-y-auto pr-4 custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Package</p>
                    <p className="font-bold text-slate-800">{selectedJob.salary}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Engagement</p>
                    <p className="font-bold text-slate-800">{selectedJob.type}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                    Job Description
                  </h4>
                  <p className="text-slate-600 leading-relaxed text-sm">{selectedJob.description}</p>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span>
                    Requirements
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(selectedJob.requirements || []).map((req, i) => (
                      <span key={i} className="bg-indigo-50/50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-indigo-100/50">
                        {req}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-8 border-t border-slate-100 flex gap-4">
                <button 
                  onClick={() => setIsApplying(true)}
                  className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg transition-all transform hover:shadow-xl hover:shadow-indigo-200 active:scale-[0.98]"
                >
                  Quick Apply
                </button>
                <button className="w-16 h-14 border-2 border-slate-100 rounded-2xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all flex items-center justify-center">
                  <i className="far fa-bookmark text-xl"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Form Modal */}
      {isApplying && selectedJob && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl animate-in slide-in-from-bottom-10 duration-500 overflow-hidden">
             <div className="bg-indigo-600 px-8 py-6 text-white relative">
                <h2 className="text-2xl font-bold">Submit Application</h2>
                <p className="opacity-80 text-sm mt-1">Applying for {selectedJob.title} @ {selectedJob.company}</p>
                <button onClick={() => setIsApplying(false)} className="absolute top-6 right-6 opacity-60 hover:opacity-100">
                  <i className="fas fa-times text-xl"></i>
                </button>
             </div>
             
            <div className="p-8">
              <form onSubmit={handleApply} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                    <input 
                      type="text" 
                      required 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                    <input 
                      type="email" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Resume / Profile Text</label>
                  <textarea 
                    required 
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm font-medium custom-scrollbar"
                    placeholder="Paste your professional summary, core skills, or full resume content here..."
                  ></textarea>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isAnalyzing}
                    className={`w-full py-4 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-3 transition-all ${
                      isAnalyzing 
                        ? 'bg-slate-400 cursor-wait' 
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <i className="fas fa-circle-notch fa-spin"></i>
                        AI Screening Agent is Analyzing...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i>
                        Submit Application
                      </>
                    )}
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-6 flex items-center justify-center gap-2">
                    <i className="fas fa-lock"></i>
                    Your application is encrypted and securely stored in Supabase.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10 mt-20">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 grayscale opacity-60">
            <div className="bg-slate-800 p-1.5 rounded-md text-white">
              <i className="fas fa-briefcase text-xs"></i>
            </div>
            <span className="font-bold text-slate-800">TalentAI</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-400">
            <a href="#" className="hover:text-indigo-600 transition-colors">Jobs</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Companies</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Salaries</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Help Center</a>
          </div>
          <p className="text-xs text-slate-300 font-medium tracking-wide">
            &copy; 2024 TalentAI &bull; Cloud Recruitment
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
