import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { io } from 'socket.io-client';
import {
  CalendarDays, Settings, Users, CheckCircle2, Clock, SkipForward,
  PhoneCall, Loader2, AlertTriangle, PauseCircle, PlayCircle,
  CalendarOff, CalendarCheck, ChevronRight, Stethoscope
} from 'lucide-react';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_STYLES = {
  Scheduled: 'bg-blue-50 text-blue-700',
  Serving:   'bg-emerald-50 text-emerald-700',
  Completed: 'bg-slate-100 text-slate-400',
  Skipped:   'bg-amber-50 text-amber-700',
  Cancelled: 'bg-red-50 text-red-600',
};

function DoctorDashboard() {
  const [profile, setProfile]         = useState(null);
  const [liveState, setLiveState]     = useState(null);
  const [dateStr, setDateStr]         = useState(new Date().toISOString().split('T')[0]);
  const [tab, setTab]                 = useState('queue');
  const [weekAppts, setWeekAppts]     = useState([]);
  const [diagnosisMap, setDiagnosisMap] = useState({});
  const [savingId, setSavingId]       = useState(null);
  const [availForm, setAvailForm]     = useState({ workingDays: [], maxPatientsPerDay: 30, slotPreference: 'Full Day' });
  const [availSaving, setAvailSaving] = useState(false);

  useEffect(() => { loadProfileAndQueue(); }, [dateStr]);
  useEffect(() => { if (tab === 'week') loadWeekSchedule(); }, [tab]);

  useEffect(() => {
    if (!profile) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
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
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day].sort()
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
        <Loader2 size={20} className="animate-spin text-slate-300" />
      </div>
    );
  }

  const tabs = [
    { id: 'queue',    label: "Today's Queue", icon: Users },
    { id: 'week',     label: 'This Week',     icon: CalendarDays },
    { id: 'settings', label: 'Availability',  icon: Settings },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4 pt-2">
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1">Doctor Dashboard</p>
          <h1 className="page-title">Dr. {profile.user?.name}</h1>
          <p className="text-xs text-slate-400 mt-1">{profile.specialization} · {profile.department?.name} · {profile.hospital?.name}</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
            <span className="text-sm font-semibold text-slate-800">{liveState.stats?.waiting || 0}</span>
            <span className="text-xs text-slate-400">waiting</span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 shadow-sm">
            <CheckCircle2 size={13} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-800">{liveState.stats?.served || 0}</span>
            <span className="text-xs text-slate-400">done</span>
          </div>
        </div>
      </div>

      {/* Status banners */}
      {profile.isOnLeave && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm font-medium text-red-700 animate-fade-in">
          <CalendarOff size={15} />
          You are on leave. Today's appointments have been cancelled and patients notified.
        </div>
      )}
      {profile.queuePaused && !profile.isOnLeave && (
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm font-medium text-amber-700 animate-fade-in">
          <PauseCircle size={15} />
          Queue is paused. Patients are being asked to wait.
        </div>
      )}

      {/* Tabs */}
      <div className="tab-bar w-fit">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={tab === t.id ? 'tab-item-active' : 'tab-item'}>
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Queue Tab ── */}
      {tab === 'queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in">
          <div className="lg:col-span-2 space-y-4">

            {/* Date picker */}
            <div className="card p-4 flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-slate-700">Queue for</p>
              <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} className="input w-auto" />
            </div>

            {/* Now Serving */}
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-dot" />
                <span className="text-xs font-medium text-slate-500">Now Serving</span>
              </div>
              <div className="p-6 text-center">
                {liveState.currentPatient ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center mx-auto mb-3">
                      <span className="text-white text-2xl font-semibold">#{liveState.currentPatient.tokenNumber}</span>
                    </div>
                    <p className="text-lg font-semibold text-slate-800">{liveState.currentPatient.name}</p>
                    {liveState.currentPatient.isEmergency && (
                      <span className="inline-flex items-center gap-1 mt-2 bg-red-50 text-red-600 text-xs font-medium px-2.5 py-1 rounded-lg border border-red-100">
                        <AlertTriangle size={11} /> Emergency
                      </span>
                    )}
                    {liveState.currentPatient.symptoms && (
                      <p className="text-xs text-slate-400 mt-2 italic max-w-xs mx-auto">"{liveState.currentPatient.symptoms}"</p>
                    )}
                    <button
                      onClick={() => executeAction('COMPLETE', liveState.currentPatient.appointmentId)}
                      className="btn-primary mt-5 mx-auto"
                    >
                      <CheckCircle2 size={14} /> Mark done & call next
                    </button>
                  </>
                ) : (
                  <div className="py-6">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                      <Stethoscope size={20} className="text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-400">No patient being seen right now</p>
                    <p className="text-xs text-slate-300 mt-1">Press "Call in" on a patient below to start</p>
                  </div>
                )}
              </div>
            </div>

            {/* Waiting list */}
            <div className="card">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="section-title">Waiting Queue</h3>
                <span className="badge bg-slate-100 text-slate-600">{liveState.stats?.waiting || 0} waiting</span>
              </div>
              <div className="p-4">
                {liveState.waitingList.length === 0 ? (
                  <div className="text-center py-10">
                    <CheckCircle2 size={28} className="text-slate-200 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Queue is empty</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {liveState.waitingList.map((item, index) => (
                      <div key={item.appointmentId}
                        className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-150
                          ${item.isEmergency ? 'border-red-200 bg-red-50/50' : index === 0 ? 'border-blue-200 bg-blue-50/40' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-semibold text-sm shrink-0
                            ${item.isEmergency ? 'bg-red-500 text-white' : index === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>
                            {item.tokenNumber}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-400">
                              {item.isEmergency
                                ? <span className="text-red-500 font-medium">Emergency</span>
                                : `~${item.estimatedWaitMinutes} min wait`}
                              {item.status === 'Skipped' && <span className="ml-2 text-amber-600 font-medium">· Skipped</span>}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => executeAction('CALL_NEXT', item.appointmentId)}
                            className="btn-primary text-xs py-1.5 px-3">
                            <PhoneCall size={12} /> Call in
                          </button>
                          {item.status !== 'Skipped' && (
                            <button onClick={() => executeAction('SKIP', item.appointmentId)}
                              className="btn-secondary text-xs py-1.5 px-3">
                              <SkipForward size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="section-title mb-4">Quick Controls</h3>
              <div className="space-y-2">
                <button onClick={handleTogglePause}
                  className={`w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl border transition-all duration-150
                    ${profile.queuePaused
                      ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                  {profile.queuePaused ? <><PlayCircle size={15} /> Resume Queue</> : <><PauseCircle size={15} /> Pause Queue</>}
                </button>
                <button onClick={handleToggleLeave}
                  className={`w-full flex items-center justify-center gap-2 text-sm font-medium py-2.5 rounded-xl border transition-all duration-150
                    ${profile.isOnLeave
                      ? 'bg-slate-900 text-white border-slate-900 hover:bg-slate-700'
                      : 'bg-white text-red-600 border-red-200 hover:bg-red-50'}`}>
                  {profile.isOnLeave ? <><CalendarCheck size={15} /> Back from Leave</> : <><CalendarOff size={15} /> Mark as On Leave</>}
                </button>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="section-title mb-4">Today's Stats</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Total',     value: liveState.stats?.total || 0,   color: 'text-slate-900' },
                  { label: 'Completed', value: liveState.stats?.served || 0,  color: 'text-emerald-600' },
                  { label: 'Waiting',   value: liveState.stats?.waiting || 0, color: 'text-blue-600' },
                  { label: 'Avg Time',  value: `${liveState.stats?.avgTime || 15}m`, color: 'text-slate-700' },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[10px] text-slate-400 font-medium mb-1">{s.label}</p>
                    <p className={`text-xl font-semibold ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Week Tab ── */}
      {tab === 'week' && (
        <div className="space-y-4 animate-fade-in">
          {Object.keys(groupedByDay).length === 0 ? (
            <div className="card p-16 text-center">
              <CalendarDays size={32} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm text-slate-400">No appointments this week</p>
            </div>
          ) : Object.keys(groupedByDay).sort().map(dayKey => {
            const d = new Date(dayKey);
            const isToday = dayKey === new Date().toISOString().split('T')[0];
            return (
              <div key={dayKey} className="card overflow-hidden">
                <div className={`px-5 py-3 border-b border-slate-100 flex items-center gap-3 ${isToday ? 'bg-slate-900' : 'bg-slate-50'}`}>
                  <span className={`text-sm font-medium ${isToday ? 'text-white' : 'text-slate-700'}`}>
                    {DAY_LABELS[d.getDay()]}, {d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                  {isToday && <span className="text-[10px] bg-white/20 text-white font-semibold px-2 py-0.5 rounded-md">Today</span>}
                  <span className={`ml-auto text-xs ${isToday ? 'text-slate-400' : 'text-slate-400'}`}>
                    {groupedByDay[dayKey].length} appointment{groupedByDay[dayKey].length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div>
                  {groupedByDay[dayKey].map((apt, i) => (
                    <div key={apt._id}
                      className={`p-4 flex flex-col md:flex-row md:items-center gap-4 hover:bg-slate-50/60 transition-colors duration-100
                        ${i < groupedByDay[dayKey].length - 1 ? 'border-b border-slate-50' : ''}`}>
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-semibold text-slate-700 text-sm shrink-0">
                          #{apt.tokenNumber}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-800">{apt.patient?.user?.name}</p>
                          <p className="text-xs text-slate-400">{apt.patient?.user?.phone}</p>
                          {apt.symptoms && <p className="text-xs text-slate-400 mt-0.5 italic truncate">"{apt.symptoms}"</p>}
                        </div>
                        <span className={`badge ${STATUS_STYLES[apt.status] || 'bg-slate-100 text-slate-500'} shrink-0`}>{apt.status}</span>
                      </div>
                      <div className="flex gap-2 items-start md:w-72 shrink-0">
                        <textarea rows={2} placeholder="Diagnosis notes..."
                          value={diagnosisMap[apt._id] || ''}
                          onChange={e => setDiagnosisMap(prev => ({ ...prev, [apt._id]: e.target.value }))}
                          className="input flex-1 resize-none text-xs" />
                        <button onClick={() => handleSaveDiagnosis(apt._id)} disabled={savingId === apt._id}
                          className="btn-secondary text-xs px-3 py-2 disabled:opacity-50 shrink-0">
                          {savingId === apt._id ? <Loader2 size={12} className="animate-spin" /> : 'Save'}
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

      {/* ── Settings Tab ── */}
      {tab === 'settings' && (
        <div className="max-w-lg animate-fade-in">
          <div className="card p-6">
            <h3 className="section-title mb-6">Availability Settings</h3>
            <form onSubmit={handleSaveAvailability} className="space-y-6">
              <div>
                <label className="label mb-3">Working days</label>
                <div className="flex gap-2 flex-wrap">
                  {DAY_LABELS.map((label, val) => (
                    <button key={val} type="button" onClick={() => toggleWorkingDay(val)}
                      className={`text-xs font-medium px-3.5 py-2 rounded-xl border transition-all duration-150
                        ${availForm.workingDays.includes(val)
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Max patients per day</label>
                <input type="number" min="1" max="200" value={availForm.maxPatientsPerDay}
                  onChange={e => setAvailForm(prev => ({ ...prev, maxPatientsPerDay: e.target.value }))}
                  className="input" />
              </div>
              <div>
                <label className="label">Slot preference</label>
                <select value={availForm.slotPreference}
                  onChange={e => setAvailForm(prev => ({ ...prev, slotPreference: e.target.value }))}
                  className="input">
                  {['Morning', 'Afternoon', 'Evening', 'Full Day'].map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <button type="submit" disabled={availSaving} className="btn-primary disabled:opacity-50">
                {availSaving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : 'Save settings'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorDashboard;
