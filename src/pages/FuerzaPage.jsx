import React from 'react';
import Header from '../components/dashboard/Header';
import StatsSection from '../components/entrenamientoFuerza/StatsFuerza';
import RecentStrengthWorkouts from '../components/entrenamientoFuerza/RecentStrengthWorkouts';
import RegistroEjercicio from '../components/entrenamientoFuerza/RegistroEjercicio';

const FuerzaPage = () => {
  return (
    <div className="fuerza-content">
      <Header showIcons={true} />
      <div className="registro-grid">
        <StatsSection title="Días de entrenamiento (fuerza)" content="workouts" className="inline-stats" />
      </div>
      <div className="registro-bottom-sections">
        <RecentStrengthWorkouts /> {/* Ahora RecentStrengthWorkouts carga sus propios datos de Firebase */}
        <RegistroEjercicio /> {/* Ahora RegistroEjercicio guarda directamente en Firebase */}
      </div>
    </div>
  );
};

export default FuerzaPage;