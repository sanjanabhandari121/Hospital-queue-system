import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  UserPlus, Users, Search, AlertCircle, CheckCircle2,
  X, AlertTriangle, Loader2, ArrowRight, Eye, Trash2
} from 'lucide-react';

function ReceptionistDashboard() {
  const [hospitals, setHospitals]               = useState([]);
  const [departments, setDepartments]           = useState([]);
  const [doctors, setDoctors]                   = useState([]);
  const [searchQuery, setSearchQuery]           = useState('');
  const [searchResults, setSearchResults]       = useState([]);
  const [allPatients, setAllPatients]           = useState([]);
  const [walkInForm, setWalkInForm]             = useState({
    name: '', email: '', phone: '', gender: 'Male', age: '', bloodGroup: 'O+',
    hospitalId: '', departmentId: '', doctorId: '',
    dateStr: new Date().toISOString().split('T')[0],
    symptoms: '', isEmergency: false
  });
  const [uiError, setUiError]                   = useState('');
  const [uiSuccess, setUiSuccess]               = useState('');
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [selectedPatient, setSelectedPatient]   = useState(null);
  const [activeTab, setActiveTab]               = useState('register');
  const [submitting, setSubmitting]             = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const hRes = await api.get('/admin/hospitals');
      const hospitalList = hRes.data.data;
      setHospitals(hospitalList);
      const dRes = await api.get('/admin/doctors');
      setDoctors(dRes.data.data);
      const pRes = await api.get('/admin/patients');
      setAllPatients(pRes.data.data);
      if (hospitalList.length === 1) {
        setWalkInForm(prev => ({ ...prev, hospitalId: hospitalList[0]._id }));
        const deptRes = await api.get(`/admin/departments/${hospitalList[0]._id}`);
        setDepartments(deptRes.data.data);
      }
    } catch (e) {}
  };

  const handleHospitalChange = async (e) => {
    const id = e.target.value;
    setWalkInForm({ ...walkInForm, hospitalId: id, departmentId: '', doctorId: '' });
    if (!id) { setDepartments([]); return; }
    const res = await api.get(`/admin/departments/${id}`);
    setDepartments(res.data.data);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const res = await api.get(`/receptionist/patients/search?query=${searchQuery}`);
    setSearchResults(res.data.data);
  };

  const selectExistingPatient = (p) => {
    setWalkInForm({ ...walkInForm, name: p.user.name, email: p.user.email, phone: p.user.phone, gender: p.gender, age: p.age, bloodGroup: p.bloodGroup });
    setActiveTab('register');
  };

  const viewPatientAppointments = async (p) => {
    setSelectedPatient(p);
    try {
      const res = await api.get(`/admin/appointments?patientId=${p._id}`);
      setPatientAppointments(res.data.data || []);
    } catch (e) { setPatientAppointments([]); }
  };

  const handleCancelAppointment = async (aptId) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.delete(`/receptionist/appointments/${aptId}`);
      setPatientAppointments(prev => prev.map(a => a._id === aptId ? { ...a, status: 'Cancelled' } : a));
      setUiSuccess('Appointment cancelled.');
    } catch (e) { setUiError('Failed to cancel.'); }
  };

  const handleRemovePatient = async (patientId) => {
    if (!confirm('Permanently remove this patient and all their appointments?')) return;
    try {
      await api.delete(`/receptionist/patients/${patientId}`);
      setAllPatients(prev => prev.filter(p => p._id !== patientId));
      setSelectedPatient(null);
      setUiSuccess('Patient removed.');
    } catch (e) { setUiError('Failed to remove patient.'); }
  };

  const handleWalkInSubmit = async (e) => {
    e.preventDefault();
    setUiError(''); setUiSuccess('');
    setSubmitting(true);
    try {
      const res = await api.post('/receptionist/walk-in-booking', walkInForm);
      if (res.data.success) {
        setUiSuccess(`Walk-in registered! Token #${res.data.data.tokenNumber} assigned.`);
        setWalkInForm({ name: '', email: '', phone: '', gender: 'Male', age: '', bloodGroup: 'O+', hospitalId: '', departmentId: '', doctorId: '', dateStr: new Date().toISOString().split('T')[0], symptoms: '', isEmergency: false });
        setSearchResults([]);
        setSearchQuery('');
        loadData();
      }
    } catch (err) { setUiError(err.response?.data?.error || 'Failed to book.'); }
    setSubmitting(false);
  };

  const filteredDoctors = doctors.filter(d =>
    d.hospital?._id === walkInForm.hospitalId && d.department?._id === walkInForm.departmentId
  );

  const tabs = [
    { id: 'register', label: 'Register Walk-in',                    icon: UserPlus },
    { id: 'patients', label: `All Patients (${allPatients.length})`, icon: Users },
  ];

  const STATUS_BADGE = {
    Cancelled: 'bg-red-50 text-red-600',
    Completed: 'bg-emerald-50 text-emerald-700',
    Serving:   'bg-blue-50 text-blue-700',
    Scheduled: 'bg-slate-100 text-slate-600',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">

      {/* Page header */}
      <div className="pt-2">
        <p className="text-xs font-medium text-slate-400 mb-1">Receptionist Dashboard</p>
        <h1 className="page-title">Patient Registration</h1>
        <p className="text-xs text-slate-400 mt-1">Register walk-in patients and manage appointments</p>
      </div>

      {/* Alerts */}
      {uiError && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs font-medium animate-fade-in">
          <AlertCircle size={13} className="shrink-0 mt-px" /> {uiError}
        </div>
      )}
      {uiSuccess && (
        <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-xl text-xs font-medium animate-fade-in">
          <CheckCircle2 size={13} className="shrink-0 mt-px" /> {uiSuccess}
        </div>
      )}

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

      {/* ── Register Tab ── */}
      {activeTab === 'register' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in">

          {/* Walk-in form */}
          <div className="lg:col-span-2 card p-6">
            <h3 className="section-title mb-5">Walk-in Patient Details</h3>
            <form onSubmit={handleWalkInSubmit} className="space-y-6">

              {/* Patient info */}
              <div>
                <p className="text-xs font-medium text-slate-400 mb-3">Personal information</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><label className="label">Full name</label><input type="text" required value={walkInForm.name} onChange={e => setWalkInForm({...walkInForm, name: e.target.value})} className="input" /></div>
                  <div><label className="label">Email</label><input type="email" required value={walkInForm.email} onChange={e => setWalkInForm({...walkInForm, email: e.target.value})} className="input" /></div>
                  <div><label className="label">Phone</label><input type="text" required value={walkInForm.phone} onChange={e => setWalkInForm({...walkInForm, phone: e.target.value})} className="input" /></div>
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div><label className="label">Age</label><input type="number" required value={walkInForm.age} onChange={e => setWalkInForm({...walkInForm, age: e.target.value})} className="input" /></div>
                  <div>
                    <label className="label">Gender</label>
                    <select value={walkInForm.gender} onChange={e => setWalkInForm({...walkInForm, gender: e.target.value})} className="input">
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Blood type</label>
                    <select value={walkInForm.bloodGroup} onChange={e => setWalkInForm({...walkInForm, bloodGroup: e.target.value})} className="input">
                      {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Appointment info */}
              <div className="border-t border-slate-100 pt-5">
                <p className="text-xs font-medium text-slate-400 mb-3">Appointment details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Hospital</label>
                    <select required value={walkInForm.hospitalId} onChange={handleHospitalChange} className="input">
                      <option value="">Select hospital</option>
                      {hospitals.map(h => <option key={h._id} value={h._id}>{h.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Department</label>
                    <select required value={walkInForm.departmentId}
                      onChange={e => setWalkInForm({...walkInForm, departmentId: e.target.value, doctorId: ''})}
                      disabled={!walkInForm.hospitalId} className="input disabled:opacity-50">
                      <option value="">Select department</option>
                      {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Doctor</label>
                    <select required value={walkInForm.doctorId}
                      onChange={e => setWalkInForm({...walkInForm, doctorId: e.target.value})}
                      disabled={!walkInForm.departmentId} className="input disabled:opacity-50">
                      <option value="">Select doctor</option>
                      {filteredDoctors.map(doc => <option key={doc._id} value={doc._id}>{doc.user?.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Date</label>
                    <input type="date" required value={walkInForm.dateStr}
                      onChange={e => setWalkInForm({...walkInForm, dateStr: e.target.value})} className="input" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="label">Symptoms <span className="text-slate-300">(optional)</span></label>
                  <textarea value={walkInForm.symptoms}
                    onChange={e => setWalkInForm({...walkInForm, symptoms: e.target.value})}
                    className="input h-16 resize-none" placeholder="Describe symptoms..." />
                </div>

                {/* Emergency toggle */}
                <label className={`mt-4 flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150
                  ${walkInForm.isEmergency ? 'border-red-300 bg-red-50/60' : 'border-slate-200 hover:border-red-200'}`}>
                  <input type="checkbox" checked={walkInForm.isEmergency}
                    onChange={e => setWalkInForm({...walkInForm, isEmergency: e.target.checked})}
                    className="w-4 h-4 accent-red-600" />
                  <div>
                    <p className="text-sm font-medium text-red-700 flex items-center gap-1.5">
                      <AlertTriangle size={13} /> Mark as Emergency
                    </p>
                    <p className="text-xs text-red-400 mt-0.5">Moves patient to front of queue immediately</p>
                  </div>
                </label>
              </div>

              <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-50">
                {submitting
                  ? <><Loader2 size={14} className="animate-spin" /> Registering...</>
                  : <><UserPlus size={14} /> Register & Book</>
                }
              </button>
            </form>
          </div>

          {/* Search panel */}
          <div className="card p-5 h-fit">
            <h3 className="section-title mb-4">Find Existing Patient</h3>
            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input type="text" placeholder="Name, phone or email..."
                value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="input flex-1" />
              <button type="submit" className="btn-secondary px-3">
                <Search size={14} />
              </button>
            </form>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {searchResults.map(p => (
                <div key={p._id} onClick={() => selectExistingPatient(p)}
                  className="p-3 border border-slate-100 rounded-xl hover:bg-blue-50/60 hover:border-blue-200 cursor-pointer transition-all duration-150">
                  <p className="text-sm font-medium text-slate-800">{p.user?.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{p.user?.phone} · {p.user?.email}</p>
                </div>
              ))}
              {searchQuery && searchResults.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No patients found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Patients Tab ── */}
      {activeTab === 'patients' && (
        <div className="card animate-fade-in">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="section-title">All Registered Patients</h3>
            <span className="text-xs text-slate-400">{allPatients.length} total</span>
          </div>
          {allPatients.length === 0 ? (
            <div className="text-center py-16">
              <Users size={28} className="text-slate-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No patients registered yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Patient', 'Contact', 'Age', 'Gender', 'Blood', 'Actions'].map(h => (
                      <th key={h} className="py-3 px-5 text-[11px] font-medium text-slate-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allPatients.map(p => (
                    <tr key={p._id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors duration-100">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 font-semibold text-xs shrink-0">
                            {p.user?.name?.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-800">{p.user?.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5">
                        <p className="text-xs text-slate-600">{p.user?.phone}</p>
                        <p className="text-xs text-slate-400">{p.user?.email}</p>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-slate-600">{p.age}</td>
                      <td className="py-3.5 px-5 text-xs text-slate-600">{p.gender}</td>
                      <td className="py-3.5 px-5">
                        <span className="badge bg-slate-100 text-slate-600">{p.bloodGroup}</span>
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex gap-2">
                          <button onClick={() => { selectExistingPatient(p); viewPatientAppointments(p); }}
                            className="btn-secondary text-xs py-1.5 px-2.5">
                            <Eye size={12} /> View
                          </button>
                          <button onClick={() => handleRemovePatient(p._id)}
                            className="btn-ghost text-xs py-1.5 px-2.5 text-red-500 hover:bg-red-50">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Appointments Modal ── */}
      {selectedPatient && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400">Appointments for</p>
                <h3 className="text-sm font-semibold text-slate-900 mt-0.5">{selectedPatient.user?.name}</h3>
              </div>
              <button onClick={() => setSelectedPatient(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors duration-150">
                <X size={15} className="text-slate-500" />
              </button>
            </div>
            <div className="p-5">
              {patientAppointments.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-400">No appointments found</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {patientAppointments.map(a => (
                    <div key={a._id} className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50/60 transition-colors duration-100">
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {new Date(a.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{a.doctor?.user?.name || '—'} · Token #{a.tokenNumber}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`badge ${STATUS_BADGE[a.status] || 'bg-slate-100 text-slate-500'}`}>{a.status}</span>
                        {['Scheduled', 'Serving'].includes(a.status) && (
                          <button onClick={() => handleCancelAppointment(a._id)}
                            className="text-xs font-medium text-red-500 hover:bg-red-50 border border-red-100 px-2.5 py-1.5 rounded-lg transition-all duration-150">
                            Cancel
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
      )}
    </div>
  );
}

export default ReceptionistDashboard;
