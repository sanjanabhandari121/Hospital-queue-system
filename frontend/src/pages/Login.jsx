import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../App';
import { Activity, Mail, Lock, AlertCircle, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';

const QUICK_LOGINS = [
  { label: 'Admin',              role: 'Admin',        email: 'admin@hospital.com',    password: 'adminpassword123',  color: 'hover:border-violet-300 hover:bg-violet-50/60', dot: 'bg-violet-500' },
  { label: 'Receptionist',       role: 'Reception',    email: 'suresh@hospital.com',   password: 'receppassword123',  color: 'hover:border-amber-300 hover:bg-amber-50/60',  dot: 'bg-amber-500' },
  { label: 'Dr. Cardiology',     role: 'Doctor',       email: 'khushi@hospital.com',   password: 'doctorpassword123', color: 'hover:border-emerald-300 hover:bg-emerald-50/60', dot: 'bg-emerald-500' },
  { label: 'Dr. Neurology',      role: 'Doctor',       email: 'siddharth@hospital.com',password: 'doctorpassword123', color: 'hover:border-emerald-300 hover:bg-emerald-50/60', dot: 'bg-emerald-500' },
  { label: 'Patient — Sanjana',  role: 'Patient',      email: 'sanjana@patient.com',   password: 'patientpassword123',color: 'hover:border-blue-300 hover:bg-blue-50/60',    dot: 'bg-blue-500' },
];

function Login() {
  const { setUser } = useContext(AuthContext);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [filled, setFilled]     = useState(null);
  const navigate = useNavigate();

  const handleQuickLogin = (q) => {
    setEmail(q.email);
    setPassword(q.password);
    setFilled(q.email);
    setError('');
  };

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
      setError(err.response?.data?.error || 'Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-5 rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.10)] border border-slate-100 animate-fade-in">

        {/* Left panel */}
        <div className="hidden lg:flex lg:col-span-2 bg-slate-900 p-10 flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-8">
              <Activity size={20} className="text-white" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-semibold text-white leading-snug mb-3">
              Smarter queues.<br />Better care.
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Real-time queue management and smart alerts — so patients spend less time waiting.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Real-time queue updates',
              'Smart turn alerts via SMS',
              'Emergency priority handling',
              'Doctor availability tracking',
            ].map(f => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                <span className="text-slate-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="lg:col-span-3 bg-white p-8 lg:p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-900">Welcome back</h2>
            <p className="text-sm text-slate-400 mt-1">Sign in to your account to continue</p>
          </div>

          {/* Quick logins */}
          <div className="mb-7">
            <p className="text-xs font-medium text-slate-400 mb-3">Demo accounts — click to fill</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {QUICK_LOGINS.map((q) => (
                <button
                  key={q.email}
                  type="button"
                  onClick={() => handleQuickLogin(q)}
                  className={`text-left px-3 py-2.5 border rounded-xl transition-all duration-150 group
                    ${filled === q.email ? 'border-slate-300 bg-slate-50' : 'border-slate-200 bg-white'}
                    ${q.color}`}
                >
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${q.dot}`} />
                    <span className="text-xs font-medium text-slate-700 truncate">{q.label}</span>
                    {filled === q.email && <CheckCircle2 size={11} className="text-emerald-500 ml-auto shrink-0" />}
                  </div>
                  <span className="text-[10px] text-slate-400 block truncate pl-3.5">{q.role}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-7">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 p-3 rounded-xl text-xs font-medium mb-5">
                <AlertCircle size={14} className="shrink-0 mt-px" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pl-9"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                  <input
                    type="password" required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input pl-9"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? <><Loader2 size={14} className="animate-spin" /> Signing in...</>
                  : <><span>Sign in</span><ArrowRight size={14} /></>
                }
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-slate-400">
            New patient?{' '}
            <Link to="/register" className="text-slate-700 font-medium hover:text-slate-900 underline underline-offset-2 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
