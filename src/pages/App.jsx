import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './DashboardPage';
import LoginPage from './LoginPage';
import AdminDashboardPage from './admin/AdminDashboardPage';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import './App.css';

function App() {
  // Revisa sessionStorage para mantener el estado de autenticación
  const [isAuthenticated, setIsAuthenticated] = useState(
    sessionStorage.getItem('isAuthenticated') === 'true'
  );

  // Actualiza sessionStorage cuando el estado de autenticación cambia
  useEffect(() => {
    sessionStorage.setItem('isAuthenticated', isAuthenticated);
  }, [isAuthenticated]);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <DashboardPage />
            </ProtectedRoute>
          } />
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute isAuthenticated={isAuthenticated}>
              <AdminDashboardPage />
            </ProtectedRoute>
          } />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;