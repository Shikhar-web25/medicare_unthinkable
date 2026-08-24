import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { Link } from 'react-router';

export default function Register() {
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, name, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      login(data.user, data.token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0F172A] p-4 font-sans text-slate-200">
      <div className="max-w-md w-full bg-[#1E293B] rounded-3xl shadow-2xl p-8 border border-slate-800">
        <h2 className="text-3xl font-serif italic text-slate-100 mb-6 text-center">Join MediFlow</h2>
        {error && <div className="bg-rose-500/20 text-rose-400 p-3 rounded-lg mb-4 text-sm border border-rose-500/30">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">I am a...</label>
            <select className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors" value={role} onChange={e => setRole(e.target.value as any)}>
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Full Name</label>
            <input type="text" required className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Email</label>
            <input type="email" required className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Password</label>
            <input type="password" required className="w-full bg-slate-900/50 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none focus:border-sky-500/50 transition-colors" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="w-full bg-sky-500 text-slate-900 rounded-full py-3 text-sm font-bold shadow-lg shadow-sky-500/20 hover:bg-sky-400 transition-colors mt-6">Create Account</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account? <Link to="/login" className="text-sky-400 hover:text-sky-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
