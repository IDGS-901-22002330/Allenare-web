import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import './StatsSection.css';

const StatsSection = ({ title, value, icon, description, className }) => {
  return (
    <Paper
      elevation={3}
      className={`stats-card ${className || ''}`}
      sx={{
        p: 3,
        borderRadius: 4,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        background: 'linear-gradient(135deg, #172a45 0%, #102035 100%)',
        border: '1px solid rgba(56, 166, 255, 0.1)',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
        }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 'medium', fontSize: '1rem', color: 'text.secondary' }}>
          {title}
        </Typography>
        <Box sx={{
          bgcolor: 'rgba(56, 166, 255, 0.1)',
          color: '#38a6ff',
          p: 1,
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </Box>
      </Box>

      <Box>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, color: 'text.primary' }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {description}
        </Typography>
      </Box>
    </Paper>
  );
};

export default StatsSection;