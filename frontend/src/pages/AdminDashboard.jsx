import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  BarChart2, Users, Stethoscope, Building2, CalendarDays,
  TrendingUp, CheckCircle2, Clock, XCircle, AlertTriangle,
  Plus, ChevronRight, Loader2, AlertCircle
} from 'lucide-react';

function StatCard({ label, value, icon: Icon, color = 'text-slate-900' }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <span className="stat-label">{label}</span>
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center">
          <Icon size={15} className="text-slate-400" />
        </div>
      </div>
      <p className={`stat-value ${color}`}>{value ?? 0}</p>
    </div>
  );
}

function FormMessage({ msg }) {
  if (!msg.text) return null;
  const isSuccess = msg.type === 'success';
  return (
    <div className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-medium border animate-fade-in
      ${isSuccess ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
      {isSuccess ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
      {msg.text}
    </div>
  );
}

function AdminDashboard() {
  const [metrics, setMetrics]           = useState(null);
  const [hospital, setHospital]         = useState(null);
  const [departments, setDepartments]   = useState([]);
  const [doctors, setDoctors]           = useState([]);
  const [receptionists, setReceptionists] = useState([]);
  const [activeTab, setActiveTab]       = useState('analytics');
  const [loading, setLoading]           = useState(true);

  const [deptForm, setDeptForm]   = useState({ name: '', description: '' });
  const [docForm, setDocForm]     = useState({ name: '', email: '', password: '', phone: '', departmentId: '', specialization: '', avgConsultationTimeMinutes: '' });
  const [recepForm, setRecepForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [formMsg, setFormMsg]     = useState({ type: '', text: '' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  const showMsg = (type, text) => {
    setFormMsg({ type, text });
    setTimeout(() => setFormMsg({ type: '', text: '' }), 3500);
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/departments', { ...deptForm, hospitalId: hospital._id });
      setDeptForm({ name: '', description: '' });
      loadAll();
      showMsg('success', 'Department created successfully.');
    } catch (e) {
      const msg = e.response?.data?.error || '';
      showMsg('error', msg.includes('duplicate') ? 'Department already exists.' : 'Failed to create department.');
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
    { id: 'analytics', label: 'Analytics',    icon: BarChart2 },
    { id: 'manage',    label: 'Manage Staff',  icon: Users },
    { id: 'doctors',   label: 'Doctors',       icon: Stethoscope },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin text-slate-300" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-4 pt-2">
        <div>
          <p className="text-xs font-medium text-slate-400 mb-1">Admin Dashboard</p>
          <h1 className="page-title">{hospital?.name || 'Hospital'}</h1>
          {hospital && (
            <p className="text-xs text-slate-400 mt-1">{hospital.address} · {hospital.phone}</p>
          )}
        </div>
        {metrics && (
          <div className="flex gap-2 flex-wrap">
            {[
              { label: 'Doctors',      value: metrics.counts?.totalDoctors,      icon: Stethoscope },
              { label: 'Patients',     value: metrics.counts?.totalPatients,     icon: Users },
              { label: 'Appointments', value: metrics.counts?.totalAppointments, icon: CalendarDays },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-3.5 py-2.5 shadow-sm">
                <s.icon size={13} className="text-slate-400" />
                <span className="text-sm font-semibold text-slate-800">{s.value}</span>
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form message */}
      <FormMessage msg={formMsg} />

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

      {/* ── Analytics Tab ── */}
      {activeTab === 'analytics' && metrics && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Completed"   value={metrics.queueMetrics?.servedCount}    icon={CheckCircle2}   color="text-emerald-600" />
            <StatCard label="Pending"     value={metrics.queueMetrics?.pendingCount}   icon={Clock}          color="text-blue-600" />
            <StatCard label="Cancelled"   value={metrics.queueMetrics?.cancelledCount} icon={XCircle}        color="text-red-500" />
            <StatCard label="Emergencies" value={metrics.queueMetrics?.emergencyCount} icon={AlertTriangle}  color="text-amber-600" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Daily volume */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="section-title">Daily Appointments</h3>
                <span className="text-xs text-slate-400">Last 7 days</span>
              </div>
              {metrics.dailyVolume?.length > 0 ? (() => {
                const maxVal = Math.max(...metrics.dailyVolume.map(d => d.count), 1);
                return (
                  <div className="flex items-end gap-2 h-32">
                    {metrics.dailyVolume.map(d => (
                      <div key={d._id} className="flex-1 flex flex-col items-center gap-1.5">
                        <span className="text-[10px] font-medium text-slate-400">{d.count}</span>
                        <div
                          className="w-full rounded-t-md bg-slate-900 transition-all duration-300"
                          style={{ height: `${Math.max((d.count / maxVal) * 100, 4)}%` }}
                        />
                        <span className="text-[9px] text-slate-400">{d._id.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                );
              })() : (
                <div className="flex items-center justify-center h-32 text-sm text-slate-300">No data yet</div>
              )}
            </div>

            {/* Busiest departments */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="section-title">Busiest Departments</h3>
                <TrendingUp size={14} className="text-slate-300" />
              </div>
              {metrics.busiestDepartments?.length > 0 ? (() => {
                const maxVal = Math.max(...metrics.busiestDepartments.map(d => d.count), 1);
                return (
                  <div className="space-y-4">
                    {metrics.busiestDepartments.map((d) => (
                      <div key={d._id}>
                        <div className="flex justify-between text-xs mb-1.5">
                          <span className="font-medium text-slate-700">{d.name}</span>
                          <span className="text-slate-400">{d.count} appointments</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-slate-800 transition-all duration-500"
                            style={{ width: `${(d.count / maxVal) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })() : (
                <div className="flex items-center justify-center h-32 text-sm text-slate-300">No data yet</div>
              )}
            </div>

            {/* System overview */}
            <div className="card p-6 lg:col-span-2">
              <h3 className="section-title mb-5">System Overview</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Patients',      value: metrics.counts?.totalPatients },
                  { label: 'Total Appointments',  value: metrics.counts?.totalAppointments },
                  { label: 'Departments',         value: metrics.counts?.totalDepartments },
                  { label: 'Receptionists',       value: metrics.counts?.totalReceptionists },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-400 mb-1">{s.label}</p>
                    <p className="text-2xl font-semibold text-slate-900">{s.value ?? 0}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Manage Staff Tab ── */}
      {activeTab === 'manage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in">

          {/* Add Department */}
          <div className="card p-6">
            <h3 className="section-title mb-5">Add Department</h3>
            <form onSubmit={handleCreateDept} className="space-y-4">
              <div>
                <label className="label">Department name</label>
                <input type="text" required value={deptForm.name}
                  onChange={e => setDeptForm(p => ({ ...p, name: e.target.value }))}
                  className="input" placeholder="e.g. Cardiology" />
              </div>
              <div>
                <label className="label">Description <span className="text-slate-300">(optional)</span></label>
                <input type="text" value={deptForm.description}
                  onChange={e => setDeptForm(p => ({ ...p, description: e.target.value }))}
                  className="input" placeholder="Brief description" />
              </div>
              <button type="submit" className="btn-primary">
                <Plus size={14} /> Add Department
              </button>
            </form>

            {departments.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 mb-3">Existing departments</p>
                <div className="space-y-1.5">
                  {departments.map(d => (
                    <div key={d._id} className="flex justify-between items-center px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-sm font-medium text-slate-800">{d.name}</span>
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
              <div>
                <label className="label">Full name</label>
                <input type="text" required value={recepForm.name}
                  onChange={e => setRecepForm(p => ({ ...p, name: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" required value={recepForm.email}
                  onChange={e => setRecepForm(p => ({ ...p, email: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" required value={recepForm.password}
                  onChange={e => setRecepForm(p => ({ ...p, password: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="text" required value={recepForm.phone}
                  onChange={e => setRecepForm(p => ({ ...p, phone: e.target.value }))} className="input" />
              </div>
              <button type="submit" className="btn-primary">
                <Plus size={14} /> Add Receptionist
              </button>
            </form>

            {receptionists.length > 0 && (
              <div className="mt-6 pt-5 border-t border-slate-100">
                <p className="text-xs font-medium text-slate-400 mb-3">Existing receptionists</p>
                <div className="space-y-1.5">
                  {receptionists.map(r => (
                    <div key={r._id} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs shrink-0">
                        {r.user?.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{r.user?.name}</p>
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
                <select required value={docForm.departmentId}
                  onChange={e => setDocForm(p => ({ ...p, departmentId: e.target.value }))} className="input">
                  <option value="">Select department</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Full name</label>
                <input type="text" required value={docForm.name}
                  onChange={e => setDocForm(p => ({ ...p, name: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" required value={docForm.email}
                  onChange={e => setDocForm(p => ({ ...p, email: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" required value={docForm.password}
                  onChange={e => setDocForm(p => ({ ...p, password: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="text" required value={docForm.phone}
                  onChange={e => setDocForm(p => ({ ...p, phone: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Specialization</label>
                <input type="text" required value={docForm.specialization}
                  onChange={e => setDocForm(p => ({ ...p, specialization: e.target.value }))} className="input" />
              </div>
              <div>
                <label className="label">Avg. minutes per patient</label>
                <input type="number" required value={docForm.avgConsultationTimeMinutes}
                  onChange={e => setDocForm(p => ({ ...p, avgConsultationTimeMinutes: e.target.value }))}
                  className="input" placeholder="15" />
              </div>
              <div className="md:col-span-2">
                <button type="submit" className="btn-primary">
                  <Plus size={14} /> Add Doctor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Doctors Tab ── */}
      {activeTab === 'doctors' && (
        <div className="card animate-fade-in">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="section-title">All Doctors</h3>
            <span className="text-xs text-slate-400">{doctors.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  {['Doctor', 'Department', 'Specialization', 'Avg. Time', 'Status'].map(h => (
                    <th key={h} className="py-3 px-5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {doctors.map(d => (
                  <tr key={d._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors duration-100">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs shrink-0">
                          {d.user?.name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{d.user?.name}</p>
                          <p className="text-xs text-slate-400">{d.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-600 text-xs">{d.department?.name}</td>
                    <td className="py-3.5 px-5 text-slate-500 text-xs">{d.specialization}</td>
                    <td className="py-3.5 px-5">
                      <span className="badge bg-slate-100 text-slate-600">{d.avgConsultationTimeMinutes} min</span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span className={`badge ${
                        d.isOnLeave
                          ? 'bg-red-50 text-red-600'
                          : d.isAvailable
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {d.isOnLeave ? 'On Leave' : d.isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {doctors.length === 0 && (
              <div className="text-center py-16 text-sm text-slate-300">No doctors added yet</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
