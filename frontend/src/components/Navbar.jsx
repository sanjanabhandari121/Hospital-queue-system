import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import { Activity, LogOut, ChevronDown } from 'lucide-react';

const ROLE_BADGE = {
  Admin:        'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  Doctor:       'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Receptionist: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  Patient:      'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
};

function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center transition-all duration-150 group-hover:bg-slate-700">
              <Activity size={15} className="text-white" strokeWidth={2.5} />
            </div>
            <span className="text-sm font-semibold text-slate-900">MediQueue</span>
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* User pill */}
                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs font-medium text-slate-800 leading-none">{user.name}</p>
                    <span className={`text-[10px] font-semibold rounded px-1 py-px mt-0.5 inline-block ${ROLE_BADGE[user.role] || 'bg-slate-100 text-slate-500'}`}>
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-xl transition-all duration-150"
                >
                  <LogOut size={13} />
                  <span className="hidden sm:inline">Sign out</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors px-3 py-2">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary text-xs py-2">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
