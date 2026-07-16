import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../App';
import { io } from 'socket.io-client';

function PatientDashboard() {
  const { user } = useContext(AuthContext);
  const [liveTokens, setLiveTokens] = useState([]);
  const [history, setHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [bookingForm, setBookingForm] = useState({ hospitalId: '', departmentId: '', doctorId: '', dateStr: new Date().toISOString().split('T')[0], symptoms: '' });
  const [uiError, setUiError] = useState('');
  const [uiSuccess, setUiSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('queue');

  useEffect(() => {
    loadDashboard();
    loadTopology();
    const socket = io('http://localhost:5000');
    socket.emit('joinUserRoom', user.id);
    socket.on('notificationReceived', () => { loadDashboard(); });
    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    if (liveTokens.length === 0) return;
    const socket = io('http://localhost:5000');
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
    try {
      const res = await api.post('/patient/appointments', bookingForm);
      if (res.data.success) {
        setUiSuccess(`Booked! Your token is #${res.data.data.tokenNumber}`);
        setBookingForm({ hospitalId: '', departmentId: '', doctorId: '', dateStr: new Date().toISOString().split('T')[0], symptoms: '' });
        loadDashboard();
      }
    } catch (err) {
      setUiError(err.response?.data?.error || 'Failed to book appointment.');
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    await api.delete(`/patient/appointments/${id}`);
    loadDashboard();
  };

  const filteredDoctors = doctors.filter(d => d.hospital?._id === bookingForm.hospitalId && d.department?._id === bookingForm.departmentId);

  const statusConfig = {
    Serving: { bg: 'from-emerald-500 to-teal-500', badge: 'bg-emerald-100 text-emerald-700', label: "🟢 It's Your Turn!", icon: '🔔' },
    Scheduled: { bg: 'from-blue-500 to-indigo-500', badge: 'bg-blue-100 text-blue-700', label: '🔵 In Queue', icon: '⏳' },
    Skipped: { bg: 'from-amber-500 to-orange-500', badge: 'bg-amber-100 text-amber-700', label: '🟡 Skipped', icon: '⚠️' },
  };

  const tabs = [
    { id: 'queue', label: 'My Queue', icon: '🎫' },
    { id: 'book', label: 'Book Appointment', icon: '📅' },
    { id: 'history', label: 'History', icon: '📋' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-sm font-medium">Welcome back,</p>
            <h1 className="text-2xl font-extrabold mt-0.5">{user?.name}</h1>
          </div>
          <div className="text-right">
            <div className="text-3xl font-extrabold">{liveTokens.length}</div>
            <div className="text-blue-200 text-xs font-medium">Active Appointment{liveTokens.length !== 1 ? 's' : ''}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {/* Tabs */}
          <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl transition-all ${activeTab === t.id ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                <span>{t.icon}</span> {t.label}
              </button>
            ))}
          </div>

          {/* Queue Tab */}
          {activeTab === 'queue' && (
            <div className="space-y-4">
              {liveTokens.length === 0 ? (
                <div className="card p-10 text-center">
                  <div className="text-5xl mb-4">🎫</div>
                  <p className="font-bold text-slate-700">No active appointments</p>
                  <p className="text-sm text-slate-400 mt-1">Book one to join a queue</p>
                  <button onClick={() => setActiveTab('book')} className="btn-primary mt-4 inline-flex">Book Now</button>
                </div>
              ) : liveTokens.map(token => {
                const cfg = statusConfig[token.status] || statusConfig.Scheduled;
                return (
                  <div key={token.appointmentId} className="card overflow-hidden">
                    <div className={`bg-gradient-to-r ${cfg.bg} p-5 text-white`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white/70 text-xs font-medium">Doctor</p>
                          <p className="font-bold text-lg leading-tight">{token.doctorName}</p>
                          <p className="text-white/70 text-xs mt-0.5">{token.hospitalName} · {token.departmentName}</p>
                        </div>
                        <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full">{cfg.label}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {[
                          { label: 'Your Token', value: `#${token.tokenNumber}`, color: 'text-slate-800' },
                          { label: 'People Ahead', value: token.status === 'Serving' ? '0' : token.queuePosition > 0 ? token.queuePosition - 1 : '-', color: 'text-blue-600' },
                          { label: 'Est. Wait', value: token.status === 'Serving' ? 'Now!' : `${token.estimatedWaitMinutes}m`, color: 'text-indigo-600' },
                        ].map(s => (
                          <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                            <p className="text-[10px] uppercase text-slate-400 font-bold mb-1">{s.label}</p>
                            <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-slate-400">{token.liveMetrics?.waiting || 0} patient(s) in queue</p>
                        <button onClick={() => handleCancel(token.appointmentId)} className="text-xs font-semibold text-red-500 hover:bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg transition-all">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Book Tab */}
          {activeTab === 'book' && (
            <div className="card p-6">
              <h3 className="section-title mb-5">Book an Appointment</h3>
              {uiError && <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-medium mb-4 flex gap-2"><span>⚠️</span>{uiError}</div>}
              {uiSuccess && <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 p-3 rounded-xl text-xs font-medium mb-4 flex gap-2"><span>✅</span>{uiSuccess}</div>}
              <form onSubmit={handleBook} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Hospital</label>
                    <select required value={bookingForm.hospitalId} onChange={handleHospitalChange} className="input">
                      <option value="">Select Hospital</option>
                      {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <select required value={bookingForm.departmentId} onChange={e => setBookingForm({ ...bookingForm, departmentId: e.target.value, doctorId: '' })} disabled={!bookingForm.hospitalId} className="input disabled:bg-slate-50 disabled:text-slate-400">
                      <option value="">Select Department</option>
                      {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Doctor</label>
                    <select required value={bookingForm.doctorId} onChange={e => setBookingForm({ ...bookingForm, doctorId: e.target.value })} disabled={!bookingForm.departmentId} className="input disabled:bg-slate-50 disabled:text-slate-400">
                      <option value="">Select Doctor</option>
                      {filteredDoctors.map(doc => (
                        <option key={doc._id} value={doc._id}>
                          {doc.user?.name} ({doc.specialization}) — {doc.slotPreference || 'Full Day'}{doc.isOnLeave ? ' ⚠ On Leave' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Date</label>
                    <input type="date" required value={bookingForm.dateStr} onChange={e => setBookingForm({ ...bookingForm, dateStr: e.target.value })} className="input" />
                  </div>
                </div>
                <div>
                  <label className="label">Symptoms</label>
                  <textarea value={bookingForm.symptoms} onChange={e => setBookingForm({ ...bookingForm, symptoms: e.target.value })} className="input h-20 resize-none" placeholder="Briefly describe your symptoms..." />
                </div>
                <button type="submit" className="btn-primary">Book Appointment</button>
              </form>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="card p-6">
              <h3 className="section-title mb-5">Appointment History</h3>
              {history.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No past appointments.</p>
              ) : (
                <div className="space-y-3">
                  {history.map(h => (
                    <div key={h._id} className="border border-slate-100 rounded-xl p-4 hover:bg-slate-50 transition-all">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">{h.doctor?.user?.name}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{h.department?.name} · {new Date(h.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-500">#{h.tokenNumber}</span>
                          <span className={`badge ${h.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : h.status === 'Cancelled' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{h.status}</span>
                        </div>
                      </div>
                      {h.diagnosis && (
                        <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">Doctor's Notes</p>
                          <p className="text-xs text-blue-800">{h.diagnosis}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications sidebar */}
        <div className="space-y-5">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="section-title">Notifications</h3>
              {notifications.length > 0 && (
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{notifications.length}</span>
              )}
            </div>
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🔔</div>
                  <p className="text-xs text-slate-400">No notifications yet</p>
                </div>
              ) : notifications.map((n, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                  <p className="text-xs font-bold text-slate-800">{n.title}</p>
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
