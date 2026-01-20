
import React, { useState } from 'react';
import { User } from '../types';

interface AuthProps {
  onLogin: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const usersDb = JSON.parse(localStorage.getItem('talent_ai_users_db') || '[]');

    if (isLogin) {
      const user = usersDb.find((u: any) => u.email === formData.email && u.password === formData.password);
      if (user) {
        onLogin({ id: user.id, name: user.name, email: user.email });
      } else {
        setError('Invalid credentials. Try: guest@talentai.com / guest');
      }
    } else {
      if (usersDb.some((u: any) => u.email === formData.email)) {
        setError('Email already exists.');
        return;
      }
      const newUser = {
        id: 'u-' + Date.now(),
        name: formData.name,
        email: formData.email,
        password: formData.password
      };
      localStorage.setItem('talent_ai_users_db', JSON.stringify([...usersDb, newUser]));
      onLogin({ id: newUser.id, name: newUser.name, email: newUser.email });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FBFF] p-6 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50"></div>

      <div className="w-full max-w-lg relative z-10">
        <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100 overflow-hidden border border-slate-100">
          <div className="bg-indigo-600 p-12 text-center text-white">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
              <i className="fas fa-bolt text-3xl"></i>
            </div>
            <h1 className="text-4xl font-black tracking-tight mb-2">TalentAI</h1>
            <p className="text-indigo-100 font-medium">Empowering your career with Intelligence.</p>
          </div>

          <div className="p-10 md:p-14">
            <h2 className="text-2xl font-black text-slate-800 mb-8 text-center">
              {isLogin ? 'Welcome Back' : 'Create Your Account'}
            </h2>

            {error && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-2xl text-sm font-bold mb-8 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <i className="fas fa-exclamation-circle"></i>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Full Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all font-bold text-slate-800"
                      placeholder="Alex Rivera"
                    />
                    <i className="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Email Address</label>
                <div className="relative">
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all font-bold text-slate-800"
                    placeholder="name@company.com"
                  />
                  <i className="fas fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Password</label>
                <div className="relative">
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:bg-white outline-none transition-all font-bold text-slate-800"
                    placeholder="••••••••"
                  />
                  <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-3xl font-black text-xl transition-all shadow-xl shadow-indigo-100 active:scale-95"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-50 text-center">
              <p className="text-slate-500 font-bold text-sm">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button 
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-indigo-600 hover:underline font-black"
                >
                  {isLogin ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-10 flex justify-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
          <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Security</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Help</a>
        </div>
      </div>
    </div>
  );
};
