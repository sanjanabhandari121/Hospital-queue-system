import React, { createContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import api from './utils/api';

import Login from './pages/Login';
import RegisterPatient from './pages/RegisterPatient';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Navbar from './components/Navbar';

export const AuthContext = createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.user);
        } else {
          localStorage.removeItem('token');
        }
      } catch (e) {
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const loginContextValue = {
    user,
    setUser,
    logout: () => {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  if (loading) {
    return (
      <div class="min-h-screen flex items-center justify-center bg-slate-50">
        <div class="text-sm font-medium text-slate-500 tracking-wider">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={loginContextValue}>
      <BrowserRouter>
        <div class="min-h-screen flex flex-col bg-slate-50">
          <Navbar />
          <main class="flex-1 w-full max-w-7xl mx-auto p-4">
            <Routes>
              <Route path="/login" element={!user ? <Login /> : <Navigate to={`/${user.role.toLowerCase()}-dashboard`} />} />
              <Route path="/register" element={!user ? <RegisterPatient /> : <Navigate to={`/${user.role.toLowerCase()}-dashboard`} />} />
              
              <Route path="/patient-dashboard" element={user && user.role === 'Patient' ? <PatientDashboard /> : <Navigate to="/login" />} />
              <Route path="/doctor-dashboard" element={user && user.role === 'Doctor' ? <DoctorDashboard /> : <Navigate to="/login" />} />
              <Route path="/receptionist-dashboard" element={user && user.role === 'Receptionist' ? <ReceptionistDashboard /> : <Navigate to="/login" />} />
              <Route path="/admin-dashboard" element={user && user.role === 'Admin' ? <AdminDashboard /> : <Navigate to="/login" />} />

              <Route path="*" element={<Navigate to={user ? `/${user.role.toLowerCase()}-dashboard` : "/login"} />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthContext.Provider>
  );
}

export default App;