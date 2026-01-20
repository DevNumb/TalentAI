
export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
export type AppStatus = 'applied' | 'screening' | 'interview' | 'offered' | 'rejected';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface UserPreferences {
  roles: string[];
  locations: string[];
  industries: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: JobType;
  description: string;
  requirements: string[];
  posted_at?: string;
  category?: string;
  matchScore?: number;
}

export interface Application {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  status: AppStatus;
  applied_at: string;
  match_score: number;
  ai_feedback: string;
}
