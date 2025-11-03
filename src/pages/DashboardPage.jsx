import React from 'react';
import Header from '../components/dashboard/Header';
import StatsSection from '../components/dashboard/StatsSection';
import RouteMap from '../components/dashboard/RouteMap';
import CombinedRecentWorkouts from '../components/dashboard/CombinedRecentWorkouts';
const DashboardPage = () => {
  return (
    <div className="dashboard-page-content">
      <Header />
      <div className="stats-grid">
        <StatsSection title="Días de entrenamiento" content="workouts" />
        <StatsSection title="Total de km recorridos" content="distance" />
        <StatsSection title="Metas" content="goals" />
      </div>
      <div className="bottom-sections">
        <CombinedRecentWorkouts /> {/* Usa el nuevo componente unificado */}
        <RouteMap />
      </div>
    </div>
  );
};

export default DashboardPage;