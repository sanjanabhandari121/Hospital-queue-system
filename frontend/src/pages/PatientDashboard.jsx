import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../App';
import { io } from 'socket.io-client';
import {
  Ticket, CalendarPlus, ClipboardList, Bell, AlertCircle,
  CheckCircle2, Clock, Users, XCircle, Loader2, ArrowRight, Stethoscope
} from 'lucide-react';

function PatientDashboard() {
  const { user } = useContext(AuthContext);
  const [liveTokens, setLiveTokens]       = useState([]);
  const [history, setHistory]             = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [hospitals, setHospitals]         = useState([]);
  const [departments, setDepartments]     = useState([]);
  const [doctors, setDoctors]             = useState([]);
  const [bookingForm, setBookingForm]     = useState({
    hospitalId: '', departmentId: '', doctorId: '',
    dateStr: new Date().toISOString().split('T')[0], symptoms: ''
  });
  const [uiError, setUiError]     = useState('');
  const [uiSuccess, setUiSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('queue');
  const [booking, setBooking]     = useState(false);

  // Doctor availability state
  const [availDoctors, setAvailDoctors]   = useState([]);
  const [availDate, setAvailDate]         = useState(new Date().toISOString().split('T')[0]);
  const [availDeptFilter, setAvailDeptFilter] = useState('');
  const [availLoading, setAvailLoading]   = useState(false);

  useEffect(() => {
    loadDashboard();
    loadTopology();
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    socket.emit('joinUserRoom', user.id);
    socket.on('notificationReceived', () => { loadDashboard(); });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (liveTokens.length === 0) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000');
    liveTokens.forEach(t => { if (t.liveMetrics?.doctorId) socket.emit('joinDoctorRoom', t.liveMetrics.doctorId); });
    socket.on('queueUpdated', () => loadDashboard());
    return () => socket.disconnect();
  }, [liveTokens.length]);

  const loadDashboard = async () => {
    try {
      const [liveRes, histRes, notifRes] = await Promise.all([
        api.get('/patient/appointments/live'),
        api.get('/patient/appointments/history'),
        api.get('/patient/notifications'),
      ]);
      setLiveTokens(liveRes.data.data);
      setHistory(histRes.data.data);
      setNotifications(notifRes.data.data);
    } catch (e) {}
  };

  const loadTopology = async () => {
    try {
      const hRes = await api.get('/admin/hospitals');
      const hospitalList = hRes.data.data;
      setHospitals(hospitalList);
      const dRes = await api.get('/admin/doctors');
      setDoctors(dRes.data.data);
      if (hospitalList.length === 1) {
        setBookingForm(prev => ({ ...prev, hospitalId: hospitalList[0]._id }));
        const deptRes = await api.get(`/admin/departments/${hospitalList[0]._id}`);
        setDepartments(deptRes.data.data);
      }
    } catch (e) {}
  };

  const loadAvailability = async (date, deptId) => {
    setAvailLoading(true);
    try {
      const params = new URLSearchParams({ dateStr: date });
      if (deptId) params.append('departmentId', deptId);
      const res = await api.get(`/patient/doctors/availability?${params}`);
      setAvailDoctors(res.data.data);
    } catch (e) {}
    setAvailLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'doctors') loadAvailability(availDate, availDeptFilter);
  }, [activeTab, availDate, availDeptFilter]);

  const handleHospitalChange = async (e) => {
    const id = e.target.value;
    setBookingForm({ ...bookingForm, hospitalId: id, departmentId: '', doctorId: '' });
    if (!id) { setDepartments([]); return; }
    const res = await api.get(`/admin/departments/${id}`);
    setDepartments(res.data.data);
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setUiError(''); setUiSuccess('');
    setBooking(true);
    try {
      const res = await api.post('/patient/appointments', bookingForm);
      if (res.data.success) {
        setUiSuccess(`Booked! Your token is #${res.data.data.tokenNumber}`);
        setBookingForm({ hospitalId: '', departmentId: '', doctorId: '', dateStr: new Date().toISOString().split('T')[0], symptoms: '' });
        loadDashboard();
        setTimeout(() => setActiveTab('queue'), 1500);
      }
    } catch (err) {
      setUiError(err.response?.data?.error || 'Failed to book appointment.');
    }
    setBooking(false);
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    await api.delete(`/patient/appointments/${id}`);
    loadDashboard();
  };

  const filteredDoctors = doctors.filter(d =>
    d.hospital?._id === bookingForm.hospitalId && d.department?._id === bookingForm.departmentId
  );

  const STATUS_CONFIG = {
    Serving:   { bar: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', label: "It's your turn", dot: 'bg-emerald-500' },
    Scheduled: { bar: 'bg-blue-500',    badge: 'bg-blue-50 text-blue-700',       label: 'In queue',       dot: 'bg-blue-500' },
    Skipped:   { bar: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700',     label: 'Skipped',        dot: 'bg-amber-500' },
  };

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const tabs = [
    { id: 'queue',   label: 'My Queue',         icon: Ticket },
    { id: 'book',    label: 'Book Appointment',  icon: CalendarPlus },
    { id: 'history', label: 'History',           icon: ClipboardList },
    { id: 'doctors', label: 'Doctor Availability', icon: Stethoscope },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4 pt-2">
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1">Patient Portal</p>
          <h1 className="page-title">Welcome back, {user?.name?.split(' ')[0]}</h1>
        </div>
        <div className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 shadow-sm">
          <Ticket size={13} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-800">{liveTokens.length}</span>
          <span className="text-xs text-slate-400">active appointment{liveTokens.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">

          {/* Tabs */}
          <div className="tab-bar w-fit">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={activeTab === t.id ? 'tab-item-active' : 'tab-item'}>
                <t.icon size={13} />
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Queue Tab ── */}
          {activeTab === 'queue' && (
            <div className="space-y-3 animate-fade-in">
              {liveTokens.length === 0 ? (
                <div className="card p-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Ticket size={20} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-medium text-slate-700">No active appointments</p>
                  <p className="text-xs text-slate-400 mt-1">Book an appointment to join a queue</p>
                  <button onClick={() => setActiveTab('book')} className="btn-primary mt-5 mx-auto">
                    Book now <ArrowRight size={13} />
                  </button>
                </div>
              ) : liveTokens.map(token => {
                const cfg = STATUS_CONFIG[token.status] || STATUS_CONFIG.Scheduled;
                return (
                  <div key={token.appointmentId} className="card overflow-hidden">
                    <div className={`h-1 ${cfg.bar}`} />
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{token.doctorName}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{token.hospitalName} · {token.departmentName}</p>
                        </div>
                        <span className={`badge ${cfg.badge} flex items-center gap-1.5`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${token.status === 'Serving' ? 'live-dot' : ''}`} />
                          {cfg.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: 'Your Token',    value: `#${token.tokenNumber}`,                                                                    color: 'text-slate-900' },
                          { label: 'People Ahead',  value: token.status === 'Serving' ? '0' : token.queuePosition > 0 ? token.queuePosition - 1 : '—', color: 'text-blue-600' },
                          { label: 'Est. Wait',     value: token.status === 'Serving' ? 'Now!' : `${token.estimatedWaitMinutes}m`,                     color: 'text-slate-700' },
                        ].map(s => (
                          <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                            <p className="text-[10px] text-slate-400 font-medium mb-1">{s.label}</p>
                            <p className={`text-lg font-semibold ${s.color}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-400">{token.liveMetrics?.waiting || 0} patient(s) in queue</p>
                        <button onClick={() => handleCancel(token.appointmentId)}
                          className="text-xs font-medium text-red-500 hover:bg-red-50 border border-red-100 px-3 py-1.5 rounded-lg transition-all duration-150">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Book Tab ── */}
          {activeTab === 'book' && (
            <div className="card p-6 animate-fade-in">
              <h3 className="section-title mb-5">Book an Appointment</h3>

              {uiError && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs font-medium mb-4">
                  <AlertCircle size={13} className="shrink-0 mt-px" /> {uiError}
                </div>
              )}
              {uiSuccess && (
                <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl text-xs font-medium mb-4">
                  <CheckCircle2 size={13} className="shrink-0 mt-px" /> {uiSuccess}
                </div>
              )}

              <form onSubmit={handleBook} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Hospital</label>
                    <select required value={bookingForm.hospitalId} onChange={handleHospitalChange} className="input">
                      <option value="">Select hospital</option>
                      {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <select required value={bookingForm.departmentId}
                      onChange={e => setBookingForm({ ...bookingForm, departmentId: e.target.value, doctorId: '' })}
                      disabled={!bookingForm.hospitalId} className="input disabled:opacity-50">
                      <option value="">Select department</option>
                      {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Doctor</label>
                    <select required value={bookingForm.doctorId}
                      onChange={e => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                      disabled={!bookingForm.departmentId} className="input disabled:opacity-50">
                      <option value="">Select doctor</option>
                      {filteredDoctors.map(doc => (
                        <option key={doc._id} value={doc._id}>
                          {doc.user?.name} ({doc.specialization}){doc.isOnLeave ? ' — On Leave' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Date</label>
                    <input type="date" required value={bookingForm.dateStr}
                      onChange={e => setBookingForm({ ...bookingForm, dateStr: e.target.value })}
                      className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Symptoms <span className="text-slate-300">(optional)</span></label>
                  <textarea value={bookingForm.symptoms}
                    onChange={e => setBookingForm({ ...bookingForm, symptoms: e.target.value })}
                    className="input h-20 resize-none" placeholder="Briefly describe your symptoms..." />
                </div>
                <button type="submit" disabled={booking} className="btn-primary disabled:opacity-50">
                  {booking ? <><Loader2 size={14} className="animate-spin" /> Booking...</> : <>Book Appointment <ArrowRight size={13} /></>}
                </button>
              </form>
            </div>
          )}

          {/* ── Doctors Availability Tab ── */}
          {activeTab === 'doctors' && (
            <div className="space-y-4 animate-fade-in">
              <div className="card p-4 flex flex-wrap gap-3 items-end">
                <div>
                  <label className="label">Date</label>
                  <input type="date" value={availDate} onChange={e => setAvailDate(e.target.value)} className="input w-auto" />
                </div>
                <div>
                  <label className="label">Department</label>
                  <select value={availDeptFilter} onChange={e => setAvailDeptFilter(e.target.value)} className="input w-auto">
                    <option value="">All Departments</option>
                    {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
              </div>

              {availLoading ? (
                <div className="card p-12 flex items-center justify-center gap-2 text-slate-400">
                  <Loader2 size={16} className="animate-spin" /> Loading...
                </div>
              ) : availDoctors.length === 0 ? (
                <div className="card p-12 text-center">
                  <Stethoscope size={28} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No doctors found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availDoctors.map(doc => (
                    <div key={doc.doctorId} className="card p-5">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0">
                            {doc.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800">{doc.name}</p>
                            <p className="text-xs text-slate-400">{doc.specialization} · {doc.department}</p>
                          </div>
                        </div>
                        <span className={`badge ${
                          doc.isOnLeave        ? 'bg-red-50 text-red-600' :
                          !doc.worksOnDate     ? 'bg-slate-100 text-slate-500' :
                          doc.slotsLeft === 0  ? 'bg-amber-50 text-amber-700' :
                                                 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {doc.isOnLeave ? 'On Leave' : !doc.worksOnDate ? 'Not Working' : doc.slotsLeft === 0 ? 'Fully Booked' : 'Available'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mt-4">
                        {[
                          { label: 'Slots Left', value: doc.worksOnDate && !doc.isOnLeave ? doc.slotsLeft : '—', color: doc.slotsLeft === 0 ? 'text-red-500' : doc.slotsLeft <= 5 ? 'text-amber-600' : 'text-emerald-600' },
                          { label: 'Avg. Time',  value: `${doc.avgConsultationTimeMinutes}m`,                    color: 'text-slate-700' },
                          { label: 'Session',    value: doc.slotPreference,                                      color: 'text-slate-700' },
                        ].map(s => (
                          <div key={s.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-center">
                            <p className="text-[10px] text-slate-400 font-medium mb-1">{s.label}</p>
                            <p className={`text-sm font-semibold ${s.color}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
                        <div className="flex gap-1">
                          {DAY_NAMES.map((d, i) => (
                            <span key={i} className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                              doc.workingDays.includes(i) ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-300'
                            }`}>{d}</span>
                          ))}
                        </div>
                        {doc.isAvailable && (
                          <button onClick={() => { setBookingForm(prev => ({ ...prev, doctorId: doc.doctorId, dateStr: availDate })); setActiveTab('book'); }}
                            className="btn-primary text-xs py-1.5">
                            Book <ArrowRight size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Notifications sidebar */}
        <div>
          <div className="card">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="section-title">Notifications</h3>
              {notifications.length > 0 && (
                <span className="w-5 h-5 bg-slate-900 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </div>
            <div className="p-4 space-y-2 max-h-[480px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10">
                  <Bell size={24} className="text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">No notifications yet</p>
                </div>
              ) : notifications.map((n, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/60 transition-colors duration-100">
                  <p className="text-xs font-medium text-slate-800">{n.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-slate-400 mt-1.5">{new Date(n.createdAt).toLocaleTimeString()}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;
