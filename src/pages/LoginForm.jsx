import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { auth } from '../firebase.js';
import './LoginForm.css';

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await setPersistence(auth, inMemoryPersistence);

      await signInWithEmailAndPassword(auth, email, password);

      setError('');
      onLogin();
      navigate('/dashboard');
    } catch (err) {
      setError('Email o contraseña incorrectos. ' + err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      {error && <p className="error-message">{error}</p>}
      <div className="form-group">
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="form-group">
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <button type="submit" className="login-button">Ingresar</button>
    </form>
  );
};

export default LoginForm;