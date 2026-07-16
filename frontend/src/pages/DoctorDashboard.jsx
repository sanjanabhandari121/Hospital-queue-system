import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { io } from 'socket.io-client';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_STYLES = {
  Scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
  Serving: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Completed: 'bg-slate-50 text-slate-400 border-slate-200',
  Skipped: 'bg-amber-50 text-amber-700 border-amber-200',
  Cancelled: 'bg-red-50 text-red-600 border-red-200',
};

function DoctorDashboard() {
  const [profile, setProfile] = useState(null);
  const [liveState, setLiveState] = useState(null);
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [tab, setTab] = useState('queue');
  const [weekAppts, setWeekAppts] = useState([]);
  const [diagnosisMap, setDiagnosisMap] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [availForm, setAvailForm] = useState({ workingDays: [], maxPatientsPerDay: 30, slotPreference: 'Full Day' });
  const [availSaving, setAvailSaving] = useState(false);

  useEffect(() => { loadProfileAndQueue(); }, [dateStr]);
  useEffect(() => { if (tab === 'week') loadWeekSchedule(); }, [tab]);

  useEffect(() => {
    if (!profile) return;
    const socket = io('http://localhost:5000');
    socket.emit('joinDoctorRoom', profile._id);
    socket.on('queueUpdated', (s) => setLiveState(s));
    return () => socket.disconnect();
  }, [profile]);

  const loadProfileAndQueue = async () => {
    try {
      const pRes = await api.get('/doctor/profile');
      const p = pRes.data.data;
      setProfile(p);
      setAvailForm({ workingDays: p.workingDays || [1,2,3,4,5], maxPatientsPerDay: p.maxPatientsPerDay || 30, slotPreference: p.slotPreference || 'Full Day' });
      const qRes = await api.get(`/doctor/queue/live?dateStr=${dateStr}`);
      setLiveState(qRes.data.data);
    } catch (e) {}
  };

  const loadWeekSchedule = async () => {
    try {
      const res = await api.get('/doctor/schedule/week');
      const appts = res.data.data;
      setWeekAppts(appts);
      const map = {};
      appts.forEach(a => { map[a._id] = a.diagnosis || ''; });
      setDiagnosisMap(map);
    } catch (e) {}
  };

  const executeAction = async (action, appointmentId) => {
    try {
      const res = await api.post('/doctor/queue/action', { action, appointmentId, dateStr });
      setLiveState(res.data.data);
    } catch (e) { alert('Action failed.'); }
  };

  const handleSaveDiagnosis = async (id) => {
    setSavingId(id);
    try { await api.put('/doctor/appointment/diagnosis', { appointmentId: id, diagnosis: diagnosisMap[id] }); }
    catch (e) { alert('Failed to save.'); }
    setSavingId(null);
  };

  const handleToggleLeave = async () => {
    try {
      const res = await api.post('/doctor/config/toggle-leave');
      setProfile(prev => ({ ...prev, isOnLeave: res.data.data.isOnLeave, isAvailable: res.data.data.isAvailable }));
    } catch (e) { alert('Failed.'); }
  };

  const handleTogglePause = async () => {
    try {
      const res = await api.post('/doctor/config/toggle-pause');
      setProfile(prev => ({ ...prev, queuePaused: res.data.data.queuePaused }));
    } catch (e) { alert('Failed.'); }
  };

  const handleSaveAvailability = async (e) => {
    e.preventDefault();
    setAvailSaving(true);
    try { await api.put('/doctor/config/availability', availForm); await loadProfileAndQueue(); }
    catch (e) { alert('Failed to save.'); }
    setAvailSaving(false);
  };

  const toggleWorkingDay = (day) => {
    setAvailForm(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day) ? prev.workingDays.filter(d => d !== day) : [...prev.workingDays, day].sort()
    }));
  };

  const groupedByDay = weekAppts.reduce((acc, apt) => {
    const key = new Date(apt.date).toISOString().split('T')[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(apt);
    return acc;
  }, {});

  if (!profile || !liveState) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-slate-400">
          <span className="w-5 h-5 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'queue', label: "Today's Queue", icon: '🏥' },
    { id: 'week', label: 'This Week', icon: '📅' },
    { id: 'settings', label: 'Availability', icon: '⚙️' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <p className="text-emerald-200 text-sm">Dr. {profile.user?.name}</p>
            <h1 className="text-xl font-extrabold mt-0.5">{profile.department?.name} · {profile.hospital?.name}</h1>
            <p className="text-emerald-200 text-xs mt-1">{profile.specialization}</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-extrabold">{liveState.stats?.waiting || 0}</p>
              <p className="text-emerald-200 text-[10px] font-medium uppercase">Waiting</p>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <p className="text-2xl font-extrabold">{liveState.stats?.served || 0}</p>
              <p className="text-emerald-200 text-[10px] font-medium uppercase">Done</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status banners */}
      {profile.isOnLeave && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm font-semibold text-red-700 flex items-center gap-2">
          🚫 You are on leave. Today's appointments have been cancelled and patients notified.
        </div>
      )}
      {profile.queuePaused && !profile.isOnLeave && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm font-semibold text-amber-700 flex items-center gap-2">
          ⏸ Queue is paused. Patients are being asked to wait.
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl transition-all ${tab === t.id ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Queue Tab */}
      {tab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            {/* Date picker */}
            <div className="card p-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Viewing queue for:</p>
              <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} className="input w-auto" />
            </div>

            {/* Now Serving */}
            <div className={`card overflow-hidden`}>
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-4">
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider">🟢 Now Serving</p>
              </div>
              <div className="p-6 text-center">
                {liveState.currentPatient ? (
                  <>
                    <p className="text-5xl font-extrabold text-slate-800">#{liveState.currentPatient.tokenNumber}</p>
                    <p className="text-lg font-semibold text-slate-600 mt-2">{liveState.currentPatient.name}</p>
                    {liveState.currentPatient.isEmergency && (
                      <span className="inline-block mt-2 bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full">🚨 Emergency</span>
                    )}
                    {liveState.currentPatient.symptoms && (
                      <p className="text-xs text-slate-400 mt-2 italic">"{liveState.currentPatient.symptoms}"</p>
                    )}
                    <button onClick={() => executeAction('COMPLETE', liveState.currentPatient.appointmentId)}
                      className="mt-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm px-8 py-3 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-200 active:scale-95">
                      ✓ Done — Call Next
                    </button>
                  </>
                ) : (
                  <div className="py-4">
                    <div className="text-4xl mb-3">👨‍⚕️</div>
                    <p className="text-slate-400 text-sm">No one is being seen right now.</p>
                    <p className="text-slate-300 text-xs mt-1">Press <strong>Call In</strong> on a patient below to start.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Waiting list */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="section-title">Waiting Queue</h3>
                <span className="badge bg-blue-100 text-blue-700">{liveState.stats?.waiting || 0} waiting</span>
              </div>
              {liveState.waitingList.length === 0 ? (
                <div className="text-center py-10">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-slate-400 text-sm">Queue is empty</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {liveState.waitingList.map((item, index) => (
                    <div key={item.appointmentId}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${item.isEmergency ? 'border-red-200 bg-red-50' : index === 0 ? 'border-blue-200 bg-blue-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-sm ${item.isEmergency ? 'bg-red-500 text-white' : index === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          {item.tokenNumber}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                          <p className="text-xs text-slate-400">
                            {item.isEmergency ? '🚨 Emergency' : `~${item.estimatedWaitMinutes} min wait`}
                            {item.status === 'Skipped' && <span className="ml-2 text-amber-600 font-bold">· Skipped</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => executeAction('CALL_NEXT', item.appointmentId)}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-2 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-sm">
                          Call In
                        </button>
                        {item.status !== 'Skipped' && (
                          <button onClick={() => executeAction('SKIP', item.appointmentId)}
                            className="bg-white border border-slate-200 text-slate-500 text-xs font-medium px-3 py-2 rounded-lg hover:bg-slate-50 transition-all">
                            Skip
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="section-title mb-4">Quick Controls</h3>
              <div className="space-y-2.5">
                <button onClick={handleTogglePause}
                  className={`w-full text-sm font-semibold py-3 rounded-xl border transition-all ${profile.queuePaused ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                  {profile.queuePaused ? '▶ Resume Queue' : '⏸ Pause Queue'}
                </button>
                <button onClick={handleToggleLeave}
                  className={`w-full text-sm font-semibold py-3 rounded-xl border transition-all ${profile.isOnLeave ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}>
                  {profile.isOnLeave ? '✓ Back from Leave' : '🚫 Mark as On Leave'}
                </button>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="section-title mb-4">Today's Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total', value: liveState.stats?.total || 0, color: 'text-slate-800' },
                  { label: 'Completed', value: liveState.stats?.served || 0, color: 'text-emerald-600' },
                  { label: 'Waiting', value: liveState.stats?.waiting || 0, color: 'text-blue-600' },
                  { label: 'Avg Time', value: `${liveState.stats?.avgTime || 15}m`, color: 'text-indigo-600' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] uppercase text-slate-400 font-bold">{s.label}</p>
                    <p className={`text-xl font-extrabold mt-1 ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Week Tab */}
      {tab === 'week' && (
        <div className="space-y-4">
          {Object.keys(groupedByDay).length === 0 ? (
            <div className="card p-12 text-center">
              <div className="text-4xl mb-3">📅</div>
              <p className="text-slate-400">No appointments this week.</p>
            </div>
          ) : Object.keys(groupedByDay).sort().map(dayKey => {
            const d = new Date(dayKey);
            const isToday = dayKey === new Date().toISOString().split('T')[0];
            return (
              <div key={dayKey} className="card overflow-hidden">
                <div className={`px-6 py-3 flex items-center gap-3 ${isToday ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-slate-50 border-b border-slate-100'}`}>
                  <span className={`text-sm font-bold ${isToday ? 'text-white' : 'text-slate-700'}`}>
                    {DAY_LABELS[d.getDay()]}, {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  {isToday && <span className="text-[10px] bg-white text-emerald-700 font-bold px-2 py-0.5 rounded-full">TODAY</span>}
                  <span className={`ml-auto text-xs font-medium ${isToday ? 'text-emerald-100' : 'text-slate-400'}`}>{groupedByDay[dayKey].length} appointment(s)</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {groupedByDay[dayKey].map(apt => (
                    <div key={apt._id} className="p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50 transition-all">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center font-extrabold text-slate-700 text-sm shrink-0">
                          #{apt.tokenNumber}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-slate-800 text-sm">{apt.patient?.user?.name}</p>
                          <p className="text-xs text-slate-400">{apt.patient?.user?.phone}</p>
                          {apt.symptoms && <p className="text-xs text-slate-500 mt-1 italic">"{apt.symptoms}"</p>}
                        </div>
                        <span className={`badge border ${STATUS_STYLES[apt.status] || ''}`}>{apt.status}</span>
                      </div>
                      <div className="flex gap-2 items-start md:w-72 shrink-0">
                        <textarea rows={2} placeholder="Diagnosis notes..."
                          value={diagnosisMap[apt._id] || ''}
                          onChange={e => setDiagnosisMap(prev => ({ ...prev, [apt._id]: e.target.value }))}
                          className="input flex-1 resize-none text-xs" />
                        <button onClick={() => handleSaveDiagnosis(apt._id)} disabled={savingId === apt._id}
                          className="btn-primary text-xs px-3 py-2 disabled:opacity-50 shrink-0">
                          {savingId === apt._id ? '...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Settings Tab */}
      {tab === 'settings' && (
        <div className="max-w-xl">
          <div className="card p-6">
            <h3 className="section-title mb-6">Availability Settings</h3>
            <form onSubmit={handleSaveAvailability} className="space-y-6">
              <div>
                <label className="label mb-3">Working Days</label>
                <div className="flex gap-2 flex-wrap">
                  {DAY_LABELS.map((label, val) => (
                    <button key={val} type="button" onClick={() => toggleWorkingDay(val)}
                      className={`text-xs font-bold px-4 py-2 rounded-xl border transition-all ${availForm.workingDays.includes(val) ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-transparent shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Max Patients Per Day</label>
                <input type="number" min="1" max="200" value={availForm.maxPatientsPerDay}
                  onChange={e => setAvailForm(prev => ({ ...prev, maxPatientsPerDay: e.target.value }))}
                  className="input" />
              </div>
              <div>
                <label className="label">Slot Preference</label>
                <select value={availForm.slotPreference} onChange={e => setAvailForm(prev => ({ ...prev, slotPreference: e.target.value }))} className="input">
                  {['Morning', 'Afternoon', 'Evening', 'Full Day'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" disabled={availSaving} className="btn-primary disabled:opacity-60 flex items-center gap-2">
                {availSaving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {availSaving ? 'Saving...' : 'Save Settings'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
