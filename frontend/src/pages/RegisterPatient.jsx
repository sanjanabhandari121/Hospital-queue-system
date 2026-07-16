import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../App';

function RegisterPatient() {
  const { setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', gender: 'Male', age: '', bloodGroup: 'O+' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/auth/register-patient', form);
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
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-blue-200">🏥</div>
          <h2 className="text-2xl font-extrabold text-slate-900">Create your account</h2>
          <p className="text-sm text-slate-400 mt-1">Join MediQueue and skip the waiting room</p>
        </div>

        <div className="card p-8">
          {error && (
            <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-medium mb-5 flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input type="text" name="name" required value={form.name} onChange={handleChange} className="input" placeholder="John Doe" />
              </div>
              <div>
                <label className="label">Phone</label>
                <input type="text" name="phone" required value={form.phone} onChange={handleChange} className="input" placeholder="+91 98765 43210" />
              </div>
            </div>

            <div>
              <label className="label">Email Address</label>
              <input type="email" name="email" required value={form.email} onChange={handleChange} className="input" placeholder="you@example.com" />
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" name="password" required value={form.password} onChange={handleChange} className="input" placeholder="••••••••" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Age</label>
                <input type="number" name="age" required value={form.age} onChange={handleChange} className="input" placeholder="25" />
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
                <label className="label">Blood Type</label>
                <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="input">
                  {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-5 text-center text-xs text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPatient;
