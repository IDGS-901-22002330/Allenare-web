import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebase.js';
import { Box, TextField, Button, Alert, Link, Divider, Typography } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';

const LoginForm = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setError('');
      onLogin();
      navigate('/dashboard');
    } catch (err) {
      setError('Email o contraseña incorrectos. ' + err.message);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      setError('');
      onLogin();
      navigate('/dashboard');
    } catch (err) {
      setError('Error al iniciar sesión con Google: ' + err.message);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Correo Electrónico"
        name="email"
        autoComplete="email"
        autoFocus
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Contraseña"
        type="password"
        id="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
        <Link component={RouterLink} to="/forgot-password" variant="body2">
          ¿Olvidaste tu contraseña?
        </Link>
      </Box>

      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
      >
        Ingresar
      </Button>

      <Divider sx={{ my: 2 }}>o</Divider>

      <Button
        fullWidth
        variant="outlined"
        startIcon={<GoogleIcon />}
        onClick={handleGoogleLogin}
        sx={{ mb: 2 }}
      >
        Ingresar con Google
      </Button>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
          ¿No tienes una cuenta?
        </Typography>
        <Link component={RouterLink} to="/signup" variant="body2">
          Regístrate
        </Link>
      </Box>
    </Box>
  );
};

export default LoginForm;