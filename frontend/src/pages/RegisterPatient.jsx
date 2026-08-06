import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../App';
import { Activity, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

function RegisterPatient() {
  const { setUser } = useContext(AuthContext);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', gender: 'Male', age: '', bloodGroup: 'O+' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register-patient', form);
      if (res.data.success) {
        localStorage.setItem('token', res.data.token);
        setUser(res.data.user);
        navigate('/patient-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md animate-fade-in">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center mx-auto mb-4">
            <Activity size={18} className="text-white" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Create your account</h1>
          <p className="text-sm text-slate-400 mt-1">Register to book appointments and track your queue</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs font-medium mb-6">
              <AlertCircle size={14} className="shrink-0 mt-px" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full name</label>
              <input name="name" type="text" required value={form.name} onChange={handleChange} className="input" placeholder="Your full name" />
            </div>

            <div>
              <label className="label">Email address</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange} className="input" placeholder="you@example.com" />
            </div>

            <div>
              <label className="label">Password</label>
              <input name="password" type="password" required value={form.password} onChange={handleChange} className="input" placeholder="Choose a strong password" />
            </div>

            <div>
              <label className="label">Phone number</label>
              <input name="phone" type="text" required value={form.phone} onChange={handleChange} className="input" placeholder="+91 00000 00000" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label">Age</label>
                <input name="age" type="number" required value={form.age} onChange={handleChange} className="input" placeholder="25" />
              </div>
              <div>
                <label className="label">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange} className="input">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="label">Blood group</label>
                <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="input">
                  {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-2.5 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <><Loader2 size={14} className="animate-spin" /> Creating account...</>
                : <><span>Create account</span><ArrowRight size={14} /></>
              }
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-slate-700 font-medium hover:text-slate-900 underline underline-offset-2 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPatient;
