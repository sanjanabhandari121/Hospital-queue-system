import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../App';

const QUICK_LOGINS = [
  { label: 'Admin', icon: '⚙️', email: 'admin@hospital.com', password: 'adminpassword123', color: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50' },
  { label: 'Receptionist', icon: '🗂️', email: 'suresh@hospital.com', password: 'receppassword123', color: 'border-amber-200 hover:border-amber-400 hover:bg-amber-50' },
  { label: 'Doctor (Cardiology)', icon: '🫀', email: 'khushi@hospital.com', password: 'doctorpassword123', color: 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50' },
  { label: 'Doctor (Neurology)', icon: '🧠', email: 'siddharth@hospital.com', password: 'doctorpassword123', color: 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50' },
  { label: 'Patient (Sanjana)', icon: '👤', email: 'sanjana@patient.com', password: 'patientpassword123', color: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50' },
];

function Login() {
  const { setUser } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);
        navigate(`/${response.data.user.role.toLowerCase()}-dashboard`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl shadow-blue-100/50">

        {/* Left panel */}
        <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-10 flex flex-col justify-between hidden lg:flex">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl mb-8">🏥</div>
            <h1 className="text-3xl font-extrabold text-white leading-tight mb-3">
              Queue-Free<br />Hospital Care
            </h1>
            <p className="text-blue-200 text-sm leading-relaxed">
              Real-time queue management, token tracking, and smart alerts — so patients spend less time waiting and more time healing.
            </p>
          </div>
          <div className="space-y-3">
            {['Real-time queue updates', 'Smart turn alerts', 'Emergency priority handling', 'Doctor availability tracking'].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-[10px]">✓</span>
                </div>
                <span className="text-blue-100 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="bg-white p-8 lg:p-10 flex flex-col justify-center">
          <div className="mb-7">
            <h2 className="text-2xl font-extrabold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-400 mt-1">Sign in to your account</p>
          </div>

          {/* Demo quick logins */}
          <div className="mb-6">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">🎭 Demo — click to fill</p>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LOGINS.map((q) => (
                <button
                  key={q.email}
                  type="button"
                  onClick={() => { setEmail(q.email); setPassword(q.password); }}
                  className={`text-left text-xs px-3 py-2.5 border rounded-xl transition-all ${q.color}`}
                >
                  <span className="font-bold text-slate-700 flex items-center gap-1.5">{q.icon} {q.label}</span>
                  <span className="text-slate-400 text-[10px] block mt-0.5 truncate">{q.email}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-6">
            {error && (
              <div className="bg-red-50 text-red-600 border border-red-200 p-3 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email Address</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input" placeholder="you@example.com" />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="input" placeholder="••••••••" />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center flex items-center gap-2 disabled:opacity-60">
                {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-xs text-slate-400">
            New patient?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
