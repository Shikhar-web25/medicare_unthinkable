import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';

export default function Dashboard() {
  const { user, logout, token } = useAuth();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [slotsByDoctor, setSlotsByDoctor] = useState<{
    [docId: number]: { slots: string[]; onLeave: boolean; loading: boolean; error: string | null }
  }>({});
  const [bookingModal, setBookingModal] = useState<{ holdId: number } | null>(null);
  const [symptoms, setSymptoms] = useState('');
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [consultationForm, setConsultationForm] = useState({ clinicalNotes: '', prescriptionRaw: '', followUpInstructions: '' });

  const fetchAppointments = async () => {
    try {
      const res = await fetch('/api/appointments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setAppointments(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAvailability = async (date: string, docList: any[] = doctors) => {
    if (!date || !token || !docList || docList.length === 0) return;

    setSlotsByDoctor(prev => {
      const next = { ...prev };
      docList.forEach(d => {
        const id = d.profile?.id;
        if (id) {
          next[id] = { slots: next[id]?.slots || [], onLeave: false, loading: true, error: null };
        }
      });
      return next;
    });

    await Promise.all(docList.map(async (doc) => {
      const docId = doc.profile?.id;
      if (!docId) return;
      try {
        const res = await fetch(`/api/doctors/${docId}/available?date=${date}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) {
          setSlotsByDoctor(prev => ({
            ...prev,
            [docId]: { slots: [], onLeave: false, loading: false, error: 'Unable to load available slots. Please try again.' }
          }));
          return;
        }
        const isOnLeave = res.headers.get('x-doctor-on-leave') === 'true';
        const data = await res.json();
        const slots = Array.isArray(data) ? data : (data.slots || []);
        const onLeave = isOnLeave || Boolean(data.onLeave);

        setSlotsByDoctor(prev => ({
          ...prev,
          [docId]: { slots, onLeave, loading: false, error: null }
        }));
      } catch (e) {
        setSlotsByDoctor(prev => ({
          ...prev,
          [docId]: { slots: [], onLeave: false, loading: false, error: 'Unable to load available slots. Please try again.' }
        }));
      }
    }));
  };

  const openAppointment = async (id: number) => {
    try {
      const res = await fetch(`/api/appointments/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedAppointment(data);
      if (data.status !== 'completed') {
        setConsultationForm({ clinicalNotes: '', prescriptionRaw: '', followUpInstructions: '' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const completeConsultation = async () => {
    try {
      const res = await fetch(`/api/appointments/${selectedAppointment.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(consultationForm)
      });
      if (!res.ok) throw new Error(await res.text());
      alert('Consultation completed successfully!');
      setSelectedAppointment(null);
      fetchAppointments();
    } catch (e: any) {
      alert(e.message);
    }
  };

  useEffect(() => {
    if (user?.role === 'patient') {
      fetch('/api/doctors', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setDoctors(data);
        if (Array.isArray(data) && data.length > 0) {
          fetchAvailability(selectedDate, data);
        }
      })
      .catch(console.error);
      
      fetchAppointments();
    } else if (user?.role === 'doctor') {
      fetchAppointments();
    }
  }, [user, token]);

  const startBooking = async (doctorId: number, slotStart: string) => {
    try {
      const res = await fetch('/api/appointments/hold', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ doctorId, slotStart })
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 409) {
          alert('This slot was just booked by another patient. Please choose another slot.');
          fetchAvailability(selectedDate, doctors);
          return;
        }
        throw new Error(data.error);
      }
      
      setSymptoms('');
      setBookingModal({ holdId: data.hold.id });
    } catch (e: any) {
      alert(e.message);
    }
  };

  const confirmBooking = async () => {
    if (!bookingModal) return;
    try {
      const bookRes = await fetch('/api/appointments/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ holdId: bookingModal.holdId, rawSymptoms: symptoms || 'None provided' })
      });
      const bookData = await bookRes.json();
      if (!bookRes.ok) throw new Error(bookData.error);
      
      alert('Appointment booked successfully!');
      setBookingModal(null);
      fetchAppointments();
      fetchAvailability(selectedDate, doctors);
    } catch (e: any) {
      alert(e.message);
      setBookingModal(null);
      fetchAvailability(selectedDate, doctors);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-200 font-sans flex flex-col">
      <header className="h-16 border-b border-slate-800 bg-[#0F172A]/50 backdrop-blur-md flex items-center px-4 sm:px-8 justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-serif text-sky-400 italic tracking-tight">MediFlow</h1>
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold hidden sm:inline-block">Clinical Workspace</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm text-slate-400">Welcome, <span className="font-bold text-slate-200">{user?.name}</span> ({user?.role})</span>
          <button onClick={logout} className="text-sm text-rose-400 hover:text-rose-300 transition-colors">Log out</button>
        </div>
      </header>
      
      {bookingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold text-slate-100 mb-4">Enter Symptoms</h2>
            <textarea 
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Please describe your symptoms..."
              className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-slate-200 mb-6 focus:outline-none focus:border-sky-500"
            />
            <div className="flex justify-end space-x-3">
              <button 
                onClick={() => {
                  setBookingModal(null);
                  alert('Booking cancelled.');
                }}
                className="px-6 py-2 rounded-full text-sm font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button 
                onClick={confirmBooking}
                className="px-6 py-2 rounded-full text-sm font-semibold bg-sky-500 text-white hover:bg-sky-400"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-[#1E293B] border border-slate-700 rounded-3xl p-6 w-full max-w-2xl shadow-2xl my-8 relative">
            <button onClick={() => setSelectedAppointment(null)} className="absolute top-6 right-6 text-slate-400 hover:text-white">✕</button>
            
            <h2 className="text-2xl font-bold text-slate-100 mb-2">Appointment Details</h2>
            <div className="text-sm text-sky-400 font-semibold mb-6">
              {new Date(selectedAppointment.slotStart).toLocaleString()}
            </div>

            {/* Doctor View: Pre-visit summary and Consultation Form */}
            {user?.role === 'doctor' && (
              <div className="space-y-6">
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Patient Symptoms</h3>
                  <p className="text-slate-400 italic mb-4">"{selectedAppointment.symptomForm?.rawSymptoms}"</p>
                  
                  {selectedAppointment.symptomForm?.aiStatus === 'COMPLETED' ? (
                    <div className="bg-sky-900/20 border border-sky-800/50 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-sky-400">AI Pre-Visit Summary</span>
                        <span className={`text-[10px] uppercase px-2 py-1 rounded-full font-bold ${
                          selectedAppointment.symptomForm.urgency === 'High' ? 'bg-rose-500/20 text-rose-400' :
                          selectedAppointment.symptomForm.urgency === 'Medium' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {selectedAppointment.symptomForm.urgency} Urgency
                        </span>
                      </div>
                      <p className="text-slate-200 font-medium mb-3">{selectedAppointment.symptomForm.chiefComplaint}</p>
                      
                      {selectedAppointment.symptomForm.suggestedQuestions && (
                        <div>
                          <p className="text-xs text-slate-400 mb-1">Suggested areas to explore:</p>
                          <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                            {JSON.parse(selectedAppointment.symptomForm.suggestedQuestions).map((q: string, i: number) => (
                              <li key={i}>{q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-500 mt-4 italic">AI-generated summary for clinician review. This is not a diagnosis.</p>
                    </div>
                  ) : selectedAppointment.symptomForm?.aiStatus === 'UNAVAILABLE' ? (
                    <div className="text-xs text-rose-400 bg-rose-400/10 p-3 rounded-lg border border-rose-400/20">
                      AI summary unavailable
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">Generating AI summary...</div>
                  )}
                </div>

                {selectedAppointment.status === 'scheduled' ? (
                  <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">Consultation Form</h3>
                    <textarea 
                      placeholder="Clinical Notes"
                      value={consultationForm.clinicalNotes}
                      onChange={e => setConsultationForm({...consultationForm, clinicalNotes: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:border-sky-500 focus:outline-none min-h-[100px]"
                    />
                    <textarea 
                      placeholder="Prescription (optional)"
                      value={consultationForm.prescriptionRaw}
                      onChange={e => setConsultationForm({...consultationForm, prescriptionRaw: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:border-sky-500 focus:outline-none min-h-[80px]"
                    />
                    <textarea 
                      placeholder="Follow-up Instructions"
                      value={consultationForm.followUpInstructions}
                      onChange={e => setConsultationForm({...consultationForm, followUpInstructions: e.target.value})}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-slate-200 text-sm focus:border-sky-500 focus:outline-none min-h-[80px]"
                    />
                    <button 
                      onClick={completeConsultation}
                      className="w-full bg-sky-500 text-white font-semibold py-3 rounded-lg hover:bg-sky-400 transition-colors"
                    >
                      Complete Consultation
                    </button>
                  </div>
                ) : (
                  <div className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl p-4 text-emerald-400 text-sm font-semibold text-center">
                    Consultation Completed
                  </div>
                )}
              </div>
            )}

            {/* Patient View: Post-visit summary */}
            {user?.role === 'patient' && (
              <div className="space-y-6">
                <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                  <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Your Symptoms</h3>
                  <p className="text-slate-400 italic">"{selectedAppointment.symptomForm?.rawSymptoms}"</p>
                </div>
                
                {selectedAppointment.status === 'completed' && (
                  <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest mb-3">Consultation Summary</h3>
                    
                    {selectedAppointment.visitNote?.aiStatus === 'COMPLETED' ? (
                      <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                        <div dangerouslySetInnerHTML={{ __html: selectedAppointment.visitNote.patientSummary.replace(/\n/g, '<br/>') }} />
                      </div>
                    ) : selectedAppointment.visitNote?.aiStatus === 'UNAVAILABLE' ? (
                      <div className="text-xs text-rose-400 bg-rose-400/10 p-3 rounded-lg border border-rose-400/20">
                        Patient-friendly summary unavailable. Please check with your doctor.
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500">Generating your patient-friendly summary...</div>
                    )}
                  </div>
                )}
                
                {selectedAppointment.status === 'scheduled' && (
                  <div className="bg-sky-900/20 border border-sky-800/50 rounded-xl p-4 text-sky-400 text-sm font-semibold text-center">
                    Upcoming Appointment
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 py-8 flex flex-col space-y-12">
        {user?.role === 'patient' && (
          <>
            <div className="flex flex-col">
              <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">My Appointments</div>
              {appointments.length === 0 ? (
                <div className="bg-[#1E293B] border border-slate-800 rounded-3xl p-8 shadow-inner text-slate-400">
                  You have no upcoming appointments.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {appointments.map(apt => (
                    <div 
                      key={apt.id} 
                      onClick={() => openAppointment(apt.id)}
                      className="bg-[#1E293B] border border-slate-700 rounded-2xl p-5 shadow-sm cursor-pointer hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-semibold text-sky-400">{new Date(apt.slotStart).toLocaleDateString()}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300 capitalize">{apt.status}</span>
                      </div>
                      <p className="text-slate-200 font-medium">{new Date(apt.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-sm text-slate-400 mt-2">{apt.doctor_name} • {apt.specialisation}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 font-bold">Book an Appointment</div>
                <div className="flex items-center gap-2">
                  <label htmlFor="appointment-date" className="text-xs text-slate-400 font-medium">Select Date:</label>
                  <input
                    id="appointment-date"
                    type="date"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setSelectedDate(newDate);
                      if (newDate) {
                        fetchAvailability(newDate, doctors);
                      }
                    }}
                    className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {doctors.map(doc => {
                  const docAvailability = slotsByDoctor[doc.profile.id];
                  return (
                    <div key={doc.id} className="bg-[#1E293B] border border-slate-800 rounded-3xl p-6 flex flex-col space-y-4 shadow-inner">
                      <div>
                        <h3 className="font-bold text-lg text-slate-100">{doc.name}</h3>
                        <p className="text-xs text-slate-400">{doc.profile.specialisation}</p>
                      </div>
                      
                      <div className="space-y-3 mt-4 border-t border-slate-800/50 pt-4">
                        <p className="text-[10px] uppercase tracking-widest text-sky-400 font-bold mb-2">Available Slots</p>
                        {docAvailability?.loading ? (
                          <div className="text-xs text-slate-400 py-2">Loading available slots...</div>
                        ) : docAvailability?.error ? (
                          <div className="text-xs text-rose-400 py-2">{docAvailability.error}</div>
                        ) : docAvailability?.onLeave ? (
                          <div className="text-xs text-amber-400/80 py-2 italic">Doctor is on leave on this date.</div>
                        ) : docAvailability?.slots && docAvailability.slots.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                            {docAvailability.slots.map((slotIso: string) => {
                              const slotDate = new Date(slotIso);
                              const timeStr = slotDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              return (
                                <button
                                  key={slotIso}
                                  onClick={() => startBooking(doc.profile.id, slotIso)}
                                  className="w-full bg-slate-900/50 text-sky-400 py-2 px-3 rounded-xl border border-slate-700 hover:border-sky-500/50 hover:bg-sky-500/10 transition-colors text-xs font-semibold text-center"
                                >
                                  {timeStr}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 py-2 italic">No available slots for this date.</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {user?.role === 'doctor' && (
          <div className="flex-1 flex flex-col h-full">
            <div className="text-[11px] uppercase tracking-[0.2em] text-slate-500 mb-4 font-bold">Doctor Dashboard</div>
            <div className="flex-1 bg-[#1E293B] border border-slate-800 rounded-3xl p-8 shadow-inner">
              <h3 className="font-bold text-lg text-slate-100 mb-6">Upcoming Appointments</h3>
              {appointments.length === 0 ? (
                <p className="text-slate-400">No upcoming appointments.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {appointments.map(apt => (
                    <div 
                      key={apt.id} 
                      onClick={() => openAppointment(apt.id)}
                      className="bg-[#0F172A] border border-slate-700 rounded-2xl p-5 shadow-sm cursor-pointer hover:bg-slate-900 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-semibold text-sky-400">{new Date(apt.slotStart).toLocaleDateString()}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-300 capitalize">{apt.status}</span>
                      </div>
                      <p className="text-slate-200 font-medium">{new Date(apt.slotStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      <p className="text-sm text-slate-400 mt-2">Patient: {apt.patient_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
