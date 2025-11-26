import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import RegistroPage from './pages/RegistroPage';
import EstadisticasPage from './pages/EstadisticasPage';
import FuerzaPage from './pages/FuerzaPage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
// import ProtectedRoute from './components/auth/ProtectedRoute.jsx'; // No lo estás usando aquí, lo cual está bien
import Sidebar from './components/dashboard/Sidebar';
import { auth } from './firebase.js'; // Importa tu instancia de auth
import ReloadPrompt from './ReloadPrompt';
import PWABadge from './PWABadge';
import './App.css';
import Analitics from './pages/Analitics.jsx';

// Componente de layout principal para rutas autenticadas
// 1. Recibe 'onLogout' como prop
const MainLayout = ({ onLogout }) => (
  <div className="dashboard-container">
    <div className="content-area"><Outlet /></div> {/* Área para el contenido de la página */}
    {/* 2. Pasa 'onLogout' al Sidebar */}
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

  const [currentUser, setCurrentUser] = useState(null); // Para almacenar el objeto de usuario de Firebase

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        if (!isAuthenticated) setIsAuthenticated(true);
        try {
          window.localStorage.setItem('isAuthenticated', 'true'); // Mantener localStorage actualizado
        } catch (e) {
          console.warn('Failed to set isAuthenticated in localStorage:', e);
        }
      } else {
        setCurrentUser(null);
        if (isAuthenticated) setIsAuthenticated(false);
        try {
          window.localStorage.removeItem('isAuthenticated'); // Limpiar localStorage
        } catch (e) {
          console.warn('Failed to remove isAuthenticated from localStorage:', e);
        }
      }
    });
    return () => unsubscribe(); // Limpiar el listener
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // 3. Crea la función handleLogout
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <>
      <ReloadPrompt />
      <PWABadge />
      <Router>
        <Routes>
          {isAuthenticated ? (
            // 4. Pasa 'handleLogout' a MainLayout
            <Route path="/" element={<MainLayout onLogout={handleLogout} />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="registro" element={<RegistroPage />} />
              <Route path="estadisticas" element={<EstadisticasPage />} />
              <Route path="fuerza" element={<FuerzaPage />} />
              <Route path="admin" element={<AdminDashboardPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
              <Route path="analitics" element={<Analitics />} />
            </Route>
          ) : (
            // Rutas públicas (solo login)
            <Route path="*" element={<LoginPage onLogin={handleLogin} />} />
          )}
        </Routes>
      </Router>
    </>
  );
}
export default App;