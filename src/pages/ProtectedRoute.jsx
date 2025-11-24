import React, { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase'; // Asegúrate que la ruta a firebase.js es correcta

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null, true, or false

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  if (isAuthenticated === null) return <div>Loading...</div>; // O un spinner de carga
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;