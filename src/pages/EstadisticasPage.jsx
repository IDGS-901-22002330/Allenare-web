import React from 'react';
import Header from '../components/dashboard/Header';
import DistanceChart from '../components/estadisticas/DistanceChart';
import RecentRuns from '../components/estadisticas/RecentRuns';
import StatsChart from '../components/estadisticas/StatsChart';

const EstadisticasPage = () => {
  return (
    <div className="estadisticas-content">
      <div className="estadisticas-stats-grid">
        <DistanceChart />
      </div>
      <div className="estadisticas-bottom-sections">
        <RecentRuns />
        <StatsChart />
      </div>
    </div>
  );
};

export default EstadisticasPage;