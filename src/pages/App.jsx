import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase'; // Asegúrate que la ruta a firebase.js es correcta
import DashboardPage from './DashboardPage';
import LoginPage from './LoginPage';
import AdminDashboardPage from './admin/AdminDashboardPage';
import ProtectedRoute from './ProtectedRoute'; // Corregido para apuntar al archivo correcto
import './App.css';
import Analitics from './Analitics';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null, true, o false
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setIsAuthenticated(true);
        setUser(currentUser);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    });
    return () => unsubscribe(); // Cleanup subscription
  }, []);

  const handleLogin = () => {
    // El listener onAuthStateChanged se encargará de actualizar el estado
  };

  if (isAuthenticated === null) {
    return <div>Cargando...</div>; // O un componente de spinner
  }

  return (
    <div className="dark-theme"> {/* Clase para aplicar el tema oscuro globalmente */}
      <Router>
        <Routes>
          <Route path="/login" element={!isAuthenticated ? <LoginPage onLogin={handleLogin} /> : <Navigate to="/dashboard" />} />
          <Route path="/*" element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="admin" element={<AdminDashboardPage />} />
            {/* Agrega aquí otras rutas protegidas */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
            <Route path='/analitics' element={<Analitics/>}/>
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;