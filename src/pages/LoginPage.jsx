import React from 'react';
import { Container, Paper, Typography, Box } from '@mui/material';
import LoginForm from './LoginForm';

const LoginPage = ({ onLogin }) => {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 4,
            bgcolor: 'background.paper',
          }}
        >
          <Typography component="h1" variant="h4" sx={{ mb: 1, fontWeight: 'bold', color: 'primary.main' }}>
            Allenare
          </Typography>
          <Typography variant="subtitle1" sx={{ mb: 3, color: 'text.secondary' }}>
            Bienvenido de nuevo
          </Typography>
          <LoginForm onLogin={onLogin} />
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;