import React, { useState, useEffect } from 'react';
import api from '../utils/api';

function AdminDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [receptionists, setReceptionists] = useState([]);
  const [activeTab, setActiveTab] = useState('analytics');

  const [deptForm, setDeptForm] = useState({ name: '', description: '' });
  const [docForm, setDocForm] = useState({ name: '', email: '', password: '', phone: '', departmentId: '', specialization: '', avgConsultationTimeMinutes: '' });
  const [recepForm, setRecepForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [formMsg, setFormMsg] = useState({ type: '', text: '' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    try {
      const [mRes, hRes, dRes, rRes] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/hospitals'),
        api.get('/admin/doctors'),
        api.get('/admin/receptionists'),
      ]);
      setMetrics(mRes.data.data);
      const hosp = hRes.data.data[0];
      setHospital(hosp);
      setDoctors(dRes.data.data);
      setReceptionists(rRes.data.data);
      if (hosp) {
        const deptRes = await api.get(`/admin/departments/${hosp._id}`);
        setDepartments(deptRes.data.data);
      }
    } catch (e) {}
  };

  const showMsg = (type, text) => { setFormMsg({ type, text }); setTimeout(() => setFormMsg({ type: '', text: '' }), 3000); };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/departments', { ...deptForm, hospitalId: hospital._id });
      setDeptForm({ name: '', description: '' });
      loadAll();
      showMsg('success', 'Department added.');
    } catch (e) {
      const msg = e.response?.data?.error || '';
      showMsg('error', msg.includes('duplicate') ? 'Department already exists.' : 'Failed to add department.');
    }
  };

  const handleCreateDoctor = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/doctors', { ...docForm, hospitalId: hospital._id });
      setDocForm({ name: '', email: '', password: '', phone: '', departmentId: '', specialization: '', avgConsultationTimeMinutes: '' });
      loadAll();
      showMsg('success', 'Doctor added successfully.');
    } catch (e) { showMsg('error', 'Failed to add doctor.'); }
  };

  const handleCreateReceptionist = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/receptionists', { ...recepForm, hospitalId: hospital._id });
      setRecepForm({ name: '', email: '', password: '', phone: '' });
      loadAll();
      showMsg('success', 'Receptionist added successfully.');
    } catch (e) { showMsg('error', 'Failed to add receptionist.'); }
  };

  const tabs = [
    { id: 'analytics', label: 'Analytics', icon: '📊' },
    { id: 'manage', label: 'Manage Staff', icon: '👥' },
    { id: 'doctors', label: 'Doctors', icon: '👨‍⚕️' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-purple-200">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            {hospital && (
              <>
                <p className="text-purple-200 text-sm font-medium">Managing</p>
                <h1 className="text-2xl font-extrabold mt-0.5">{hospital.name}</h1>
                <p className="text-purple-200 text-xs mt-1">{hospital.address} · {hospital.phone}</p>
              </>
            )}
          </div>
          {metrics && (
            <div className="flex gap-3 flex-wrap">
              {[
                { label: 'Doctors', value: metrics.counts?.totalDoctors, icon: '👨‍⚕️' },
                { label: 'Patients', value: metrics.counts?.totalPatients, icon: '👤' },
                { label: 'Appointments', value: metrics.counts?.totalAppointments, icon: '📅' },
              ].map(s => (
                <div key={s.label} className="bg-white/20 rounded-xl px-4 py-2 text-center">
                  <p className="text-xl font-extrabold">{s.value}</p>
                  <p className="text-purple-200 text-[10px] font-medium">{s.icon} {s.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {formMsg.text && (
        <div className={`p-3 rounded-xl text-sm font-medium flex gap-2 ${formMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
          <span>{formMsg.type === 'success' ? '✅' : '⚠️'}</span> {formMsg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl p-1.5 border border-slate-100 shadow-sm">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold py-2.5 rounded-xl transition-all ${activeTab === t.id ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && metrics && (
        <div className="space-y-5">
          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Completed', value: metrics.queueMetrics?.servedCount, color: 'from-emerald-500 to-teal-500', icon: '✅' },
              { label: 'Pending', value: metrics.queueMetrics?.pendingCount, color: 'from-blue-500 to-indigo-500', icon: '⏳' },
              { label: 'Cancelled', value: metrics.queueMetrics?.cancelledCount, color: 'from-red-400 to-rose-500', icon: '❌' },
              { label: 'Emergencies', value: metrics.queueMetrics?.emergencyCount, color: 'from-orange-500 to-amber-500', icon: '🚨' },
            ].map(s => (
              <div key={s.label} className={`bg-gradient-to-br ${s.color} rounded-2xl p-5 text-white shadow-md`}>
                <p className="text-white/70 text-xs font-medium">{s.icon} {s.label}</p>
                <p className="text-3xl font-extrabold mt-1">{s.value ?? 0}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Daily volume bar chart */}
            <div className="card p-6">
              <h3 className="section-title mb-5">Daily Appointments — Last 7 Days</h3>
              {metrics.dailyVolume?.length > 0 ? (() => {
                const maxVal = Math.max(...metrics.dailyVolume.map(d => d.count), 1);
                return (
                  <div className="flex items-end gap-2 h-36">
                    {metrics.dailyVolume.map(d => (
                      <div key={d._id} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500">{d.count}</span>
                        <div className="w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-indigo-400 transition-all" style={{ height: `${Math.max((d.count / maxVal) * 100, 4)}%` }} />
                        <span className="text-[9px] text-slate-400 font-medium">{d._id.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                );
              })() : <p className="text-sm text-slate-400 text-center py-8">No data yet.</p>}
            </div>

            {/* Busiest departments */}
            <div className="card p-6">
              <h3 className="section-title mb-5">Busiest Departments</h3>
              {metrics.busiestDepartments?.length > 0 ? (() => {
                const maxVal = Math.max(...metrics.busiestDepartments.map(d => d.count), 1);
                return (
                  <div className="space-y-4">
                    {metrics.busiestDepartments.map((d, i) => (
                      <div key={d._id}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="font-semibold text-slate-700">{d.name}</span>
                          <span className="text-slate-400 font-bold text-xs">{d.count} appointments</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all" style={{ width: `${(d.count / maxVal) * 100}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })() : <p className="text-sm text-slate-400 text-center py-8">No data yet.</p>}
            </div>

            {/* System overview */}
            <div className="card p-6 lg:col-span-2">
              <h3 className="section-title mb-5">System Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Patients', value: metrics.counts?.totalPatients },
                  { label: 'Total Appointments', value: metrics.counts?.totalAppointments },
                  { label: 'Departments', value: metrics.counts?.totalDepartments },
                  { label: 'Receptionists', value: metrics.counts?.totalReceptionists },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                    <p className="text-[10px] uppercase text-slate-400 font-bold">{s.label}</p>
                    <p className="text-2xl font-extrabold text-slate-800 mt-1">{s.value ?? 0}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Staff Tab */}
      {activeTab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Add Department */}
          <div className="card p-6">
            <h3 className="section-title mb-5">Add Department</h3>
            <form onSubmit={handleCreateDept} className="space-y-4">
              <div><label className="label">Department Name</label><input type="text" required value={deptForm.name} onChange={e => setDeptForm(p => ({...p, name: e.target.value}))} className="input" placeholder="e.g. Cardiology" /></div>
              <div><label className="label">Description</label><input type="text" value={deptForm.description} onChange={e => setDeptForm(p => ({...p, description: e.target.value}))} className="input" placeholder="Optional" /></div>
              <button type="submit" className="btn-primary w-full justify-center flex">Add Department</button>
            </form>
            {departments.length > 0 && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Existing Departments</p>
                <div className="space-y-2">
                  {departments.map(d => (
                    <div key={d._id} className="flex justify-between items-center px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-800 text-sm">{d.name}</span>
                      <span className="text-xs text-slate-400">{d.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add Receptionist */}
          <div className="card p-6">
            <h3 className="section-title mb-5">Add Receptionist</h3>
            <form onSubmit={handleCreateReceptionist} className="space-y-4">
              <div><label className="label">Full Name</label><input type="text" required value={recepForm.name} onChange={e => setRecepForm(p => ({...p, name: e.target.value}))} className="input" /></div>
              <div><label className="label">Email</label><input type="email" required value={recepForm.email} onChange={e => setRecepForm(p => ({...p, email: e.target.value}))} className="input" /></div>
              <div><label className="label">Password</label><input type="password" required value={recepForm.password} onChange={e => setRecepForm(p => ({...p, password: e.target.value}))} className="input" /></div>
              <div><label className="label">Phone</label><input type="text" required value={recepForm.phone} onChange={e => setRecepForm(p => ({...p, phone: e.target.value}))} className="input" /></div>
              <button type="submit" className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all shadow-md shadow-emerald-100 active:scale-95">
                Add Receptionist
              </button>
            </form>
            {receptionists.length > 0 && (
              <div className="mt-5 pt-5 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">Existing Receptionists</p>
                <div className="space-y-2">
                  {receptionists.map(r => (
                    <div key={r._id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center text-amber-700 font-bold text-xs">{r.user?.name?.charAt(0)}</div>
                      <div>
                        <p className="font-semibold text-slate-800 text-sm">{r.user?.name}</p>
                        <p className="text-xs text-slate-400">{r.user?.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Add Doctor */}
          <div className="card p-6 lg:col-span-2">
            <h3 className="section-title mb-5">Add Doctor</h3>
            <form onSubmit={handleCreateDoctor} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Department</label>
                <select required value={docForm.departmentId} onChange={e => setDocForm(p => ({...p, departmentId: e.target.value}))} className="input">
                  <option value="">Select Department</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div><label className="label">Full Name</label><input type="text" required value={docForm.name} onChange={e => setDocForm(p => ({...p, name: e.target.value}))} className="input" /></div>
              <div><label className="label">Email</label><input type="email" required value={docForm.email} onChange={e => setDocForm(p => ({...p, email: e.target.value}))} className="input" /></div>
              <div><label className="label">Password</label><input type="password" required value={docForm.password} onChange={e => setDocForm(p => ({...p, password: e.target.value}))} className="input" /></div>
              <div><label className="label">Phone</label><input type="text" required value={docForm.phone} onChange={e => setDocForm(p => ({...p, phone: e.target.value}))} className="input" /></div>
              <div><label className="label">Specialization</label><input type="text" required value={docForm.specialization} onChange={e => setDocForm(p => ({...p, specialization: e.target.value}))} className="input" /></div>
              <div><label className="label">Avg. Minutes / Patient</label><input type="number" required value={docForm.avgConsultationTimeMinutes} onChange={e => setDocForm(p => ({...p, avgConsultationTimeMinutes: e.target.value}))} className="input" placeholder="15" /></div>
              <div className="md:col-span-2">
                <button type="submit" className="btn-primary">Add Doctor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Doctors Tab */}
      {activeTab === 'doctors' && (
        <div className="card p-6">
          <h3 className="section-title mb-5">All Doctors ({doctors.length})</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Doctor', 'Department', 'Specialization', 'Avg. Time', 'Status'].map(h => (
                    <th key={h} className="py-3 px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {doctors.map(d => (
                  <tr key={d._id} className="hover:bg-slate-50 transition-all">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                          {d.user?.name?.charAt(0)}
                        </div>
                        <span className="font-semibold text-slate-800">{d.user?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-slate-600">{d.department?.name}</td>
                    <td className="py-3 px-2 text-slate-500">{d.specialization}</td>
                    <td className="py-3 px-2"><span className="badge bg-blue-50 text-blue-700">{d.avgConsultationTimeMinutes} min</span></td>
                    <td className="py-3 px-2">
                      <span className={`badge ${d.isOnLeave ? 'bg-red-100 text-red-600' : d.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {d.isOnLeave ? 'On Leave' : d.isAvailable ? 'Available' : 'Unavailable'}
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
  );
}

export default AdminDashboard;
