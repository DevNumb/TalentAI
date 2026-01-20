
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote';
  description: string;
  requirements: string[];
  postedAt: string;
  category: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  score: number;
  summary: string;
  matchReasons: string[];
}

export interface Application {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  status: 'applied' | 'screening' | 'interview' | 'offered' | 'rejected';
  appliedAt: string;
  matchScore: number;
  aiFeedback: string;
}
