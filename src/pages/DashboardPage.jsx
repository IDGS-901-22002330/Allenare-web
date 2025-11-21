import React from 'react';
import { Box, Grid, Typography, Paper } from '@mui/material';
import Header from '../components/dashboard/Header';
import StatsSection from '../components/dashboard/StatsSection';
import RouteMap from '../components/dashboard/RouteMap';
import CombinedRecentWorkouts from '../components/dashboard/CombinedRecentWorkouts';

const DashboardPage = () => {
  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
      <Header />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatsSection title="Días de entrenamiento" content="workouts" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsSection title="Total de km recorridos" content="distance" />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsSection title="Metas" content="goals" />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={7}>
          <CombinedRecentWorkouts />
        </Grid>
        <Grid item xs={12} lg={5}>
          <RouteMap />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;