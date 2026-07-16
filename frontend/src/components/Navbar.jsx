import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';

const ROLE_COLORS = {
  Admin: 'bg-purple-100 text-purple-700',
  Doctor: 'bg-emerald-100 text-emerald-700',
  Receptionist: 'bg-amber-100 text-amber-700',
  Patient: 'bg-blue-100 text-blue-700',
};

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-200 group-hover:shadow-blue-300 transition-all">
              <span className="text-white text-lg">🏥</span>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 leading-none">MediQueue</p>
              <p className="text-[10px] text-slate-400 font-medium">Hospital Queue System</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 leading-none">{user.name}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wide ${ROLE_COLORS[user.role] || 'text-slate-500'}`}>
                      {user.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 px-3 py-2 rounded-xl transition-all"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Login</Link>
                <Link to="/register" className="btn-primary text-xs">Register as Patient</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
