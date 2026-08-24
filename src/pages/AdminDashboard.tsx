import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'doctors' | 'leaves' | 'appointments'>('doctors');
  
  const [doctors, setDoctors] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  // Doctor form state
  const [showDocForm, setShowDocForm] = useState(false);
  const [docForm, setDocForm] = useState({ name: '', email: '', password: '', specialisation: '', workingHoursStart: '09:00', workingHoursEnd: '17:00', slotDurationMinutes: 30 });
  const [error, setError] = useState('');

  // Leave form state
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ doctorId: '', date: '', reason: '' });
  const [leaveConflict, setLeaveConflict] = useState<any>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (activeTab === 'doctors') loadDoctors();
    if (activeTab === 'leaves') loadLeaves();
    if (activeTab === 'appointments') loadAppointments();
  }, [activeTab]);

  const loadDoctors = async () => {
    try {
      const res = await fetch('/api/admin/doctors', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setDoctors(data);
    } catch (e) { console.error(e); }
  };

  const loadLeaves = async () => {
    try {
      const res = await fetch('/api/admin/leaves', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setLeaves(data);
    } catch (e) { console.error(e); }
  };

  const loadAppointments = async () => {
    try {
      const res = await fetch('/api/admin/appointments', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setAppointments(data);
    } catch (e) { console.error(e); }
  };

  const handleCreateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/admin/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(docForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowDocForm(false);
      setDocForm({ name: '', email: '', password: '', specialisation: '', workingHoursStart: '09:00', workingHoursEnd: '17:00', slotDurationMinutes: 30 });
      loadDoctors();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleDoctorActive = async (doc: any) => {
    try {
      const res = await fetch(`/api/admin/doctors/${doc.profile.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...doc.profile, isActive: !doc.profile.isActive })
      });
      if (res.ok) loadDoctors();
    } catch (e) { console.error(e); }
  };

  const handleCreateLeave = async (e: React.FormEvent, confirm: boolean = false) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/admin/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...leaveForm, confirm })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          setLeaveConflict(data);
          return;
        }
        throw new Error(data.error);
      }
      setShowLeaveForm(false);
      setLeaveConflict(null);
      setLeaveForm({ doctorId: '', date: '', reason: '' });
      loadLeaves();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filteredAppointments = appointments.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="flex h-screen bg-[#0F172A] text-slate-200 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-[#0F172A] flex flex-col p-6">
        <div className="mb-10">
          <div className="text-sky-400 font-serif italic text-2xl tracking-tight">MediFlow</div>
          <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">System Admin</div>
        </div>
        
        <nav className="space-y-6 flex-1">
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-bold">Management</div>
            <div 
              onClick={() => setActiveTab('doctors')}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer ${activeTab === 'doctors' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === 'doctors' ? 'bg-sky-400' : 'bg-slate-700'}`}></div>
              <span className="text-sm font-medium">Doctors</span>
            </div>
            <div 
              onClick={() => setActiveTab('leaves')}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer ${activeTab === 'leaves' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === 'leaves' ? 'bg-sky-400' : 'bg-slate-700'}`}></div>
              <span className="text-sm font-medium">Leaves</span>
            </div>
            <div 
              onClick={() => setActiveTab('appointments')}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg cursor-pointer ${activeTab === 'appointments' ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <div className={`w-2 h-2 rounded-full ${activeTab === 'appointments' ? 'bg-sky-400' : 'bg-slate-700'}`}></div>
              <span className="text-sm font-medium">Appointments</span>
            </div>
          </div>
        </nav>
        
        <div className="pt-6 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-100">{user?.name}</div>
              <div className="text-[10px] text-slate-500">Administrator</div>
            </div>
            <button onClick={logout} className="text-[10px] uppercase text-rose-400 hover:text-rose-300 font-bold">Logout</button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0F172A]/50 backdrop-blur-md">
          <h1 className="text-xl font-serif text-slate-100 italic capitalize">{activeTab}</h1>
        </header>

        <div className="p-8 h-full overflow-y-auto">
          
          {/* Doctors Tab */}
          {activeTab === 'doctors' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold">Doctor Management</div>
                <button onClick={() => setShowDocForm(!showDocForm)} className="bg-sky-500 text-slate-900 px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-sky-500/20">
                  {showDocForm ? 'Cancel' : '+ Add Doctor'}
                </button>
              </div>

              {showDocForm && (
                <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-6 shadow-inner mb-6">
                  <h3 className="text-lg text-slate-100 font-serif italic mb-4">New Doctor Profile</h3>
                  {error && <div className="bg-rose-500/20 text-rose-400 p-2 rounded text-xs mb-4">{error}</div>}
                  <form onSubmit={handleCreateDoctor} className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Name</label>
                      <input required className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" value={docForm.name} onChange={e => setDocForm({...docForm, name: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Email</label>
                      <input required type="email" className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" value={docForm.email} onChange={e => setDocForm({...docForm, email: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Password</label>
                      <input required type="password" className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" value={docForm.password} onChange={e => setDocForm({...docForm, password: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Specialisation</label>
                      <input required className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" value={docForm.specialisation} onChange={e => setDocForm({...docForm, specialisation: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Working Hours Start</label>
                      <input required type="time" className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" value={docForm.workingHoursStart} onChange={e => setDocForm({...docForm, workingHoursStart: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Working Hours End</label>
                      <input required type="time" className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" value={docForm.workingHoursEnd} onChange={e => setDocForm({...docForm, workingHoursEnd: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Slot Duration (mins)</label>
                      <input required type="number" className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" value={docForm.slotDurationMinutes} onChange={e => setDocForm({...docForm, slotDurationMinutes: parseInt(e.target.value)})} />
                    </div>
                    <div className="col-span-2 mt-2">
                      <button type="submit" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-xs font-bold">Create Profile</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {doctors.map(doc => (
                  <div key={doc.id} className={`bg-[#1E293B] border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3 ${!doc.profile.isActive ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-bold text-slate-100">{doc.name}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-bold ${doc.profile.isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'}`}>
                        {doc.profile.isActive ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">{doc.profile.specialisation}</div>
                      <div className="text-xs text-slate-500 mt-1 font-mono">{doc.profile.workingHoursStart} - {doc.profile.workingHoursEnd} ({doc.profile.slotDurationMinutes}m slots)</div>
                    </div>
                    <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
                      <button onClick={() => toggleDoctorActive(doc)} className="text-xs font-bold text-sky-400 hover:text-sky-300">
                        {doc.profile.isActive ? 'Deactivate' : 'Reactivate'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaves Tab */}
          {activeTab === 'leaves' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold">Leave Management</div>
                <button onClick={() => setShowLeaveForm(!showLeaveForm)} className="bg-sky-500 text-slate-900 px-4 py-2 rounded-full text-xs font-bold shadow-lg shadow-sky-500/20">
                  {showLeaveForm ? 'Cancel' : '+ Add Leave'}
                </button>
              </div>

              {showLeaveForm && (
                <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-6 shadow-inner mb-6">
                  <h3 className="text-lg text-slate-100 font-serif italic mb-4">Mark Leave Day</h3>
                  {error && <div className="bg-rose-500/20 text-rose-400 p-2 rounded text-xs mb-4">{error}</div>}
                  
                  {leaveConflict ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mb-4">
                      <h4 className="text-amber-400 font-bold text-sm mb-2">{leaveConflict.error}</h4>
                      <p className="text-xs text-amber-200/70 mb-4">{leaveConflict.message}</p>
                      <div className="flex space-x-3">
                        <button onClick={(e) => handleCreateLeave(e, true)} className="bg-amber-500 text-slate-900 px-4 py-1.5 rounded font-bold text-xs">Confirm & Cancel Appointments</button>
                        <button onClick={() => setLeaveConflict(null)} className="text-xs text-slate-400 hover:text-slate-200">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateLeave} className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Doctor</label>
                        <select required className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" value={leaveForm.doctorId} onChange={e => setLeaveForm({...leaveForm, doctorId: e.target.value})}>
                          <option value="">Select Doctor...</option>
                          {doctors.map(d => <option key={d.profile.id} value={d.profile.id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Date</label>
                        <input required type="date" className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" value={leaveForm.date} onChange={e => setLeaveForm({...leaveForm, date: e.target.value})} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Reason (Optional)</label>
                        <input className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
                      </div>
                      <div className="col-span-2 mt-2">
                        <button type="submit" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg text-xs font-bold">Check & Save</button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              <div className="bg-[#1E293B] border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {leaves.map(l => (
                      <tr key={l.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-mono">{l.date}</td>
                        <td className="px-4 py-3 text-slate-300">{l.doctorName}</td>
                        <td className="px-4 py-3 text-slate-400">{l.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold">System Appointments</div>
                <select className="bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm text-slate-200" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div className="bg-[#1E293B] border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Patient</th>
                      <th className="px-4 py-3">Doctor</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredAppointments.map(a => (
                      <tr key={a.id} className="hover:bg-slate-800/30">
                        <td className="px-4 py-3 font-mono text-sky-400">{new Date(a.slotStart).toLocaleString()}</td>
                        <td className="px-4 py-3 text-slate-200">{a.patientName}</td>
                        <td className="px-4 py-3 text-slate-400">{a.doctorName} ({a.doctorSpecialisation})</td>
                        <td className="px-4 py-3">
                          <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                            a.status === 'scheduled' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                            a.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
