import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import RegistroPage from './pages/RegistroPage';
import EstadisticasPage from './pages/EstadisticasPage';
import FuerzaPage from './pages/FuerzaPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import Sidebar from './components/dashboard/Sidebar';
import { auth } from './firebase.js';
import ReloadPrompt from './ReloadPrompt';
import PWABadge from './PWABadge';
import './App.css';
import Analitics from './pages/Analitics.jsx';

// Componente de layout principal para rutas autenticadas
const MainLayout = ({ onLogout }) => (
  <div className="dashboard-container">
    <div className="content-area"><Outlet /></div>
    <Sidebar onLogout={onLogout} />
  </div>
);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      const item = window.localStorage.getItem('isAuthenticated');
      return item === 'true';
    } catch (e) {
      return false;
    }
  });

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        if (!isAuthenticated) setIsAuthenticated(true);
        try {
          window.localStorage.setItem('isAuthenticated', 'true');
        } catch (e) {
          console.warn('Failed to set isAuthenticated in localStorage:', e);
        }
      } else {
        setCurrentUser(null);
        if (isAuthenticated) setIsAuthenticated(false);
        try {
          window.localStorage.removeItem('isAuthenticated');
        } catch (e) {
          console.warn('Failed to remove isAuthenticated from localStorage:', e);
        }
      }
    });
    return () => unsubscribe();
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      window.localStorage.removeItem('isAuthenticated');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <>
      <ReloadPrompt />
      <PWABadge />
      <Router>
        <Routes>
          {isAuthenticated ? (
            <Route path="/" element={<MainLayout onLogout={handleLogout} />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="registro" element={<RegistroPage />} />
              <Route path="estadisticas" element={<EstadisticasPage />} />
              <Route path="fuerza" element={<FuerzaPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="admin/:section?" element={<AdminDashboardPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              <Route path="analitics" element={<Analitics />} />
            </Route>
          ) : (
            <>
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </>
          )}
        </Routes>
      </Router>
    </>
  );
}

export default App;