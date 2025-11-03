import React from 'react';
import Header from '../components/dashboard/Header';
import CombinedRecentWorkouts from '../components/dashboard/CombinedRecentWorkouts';
import RegistroEjercicio from '../components/entrenamientoFuerza/RegistroEjercicio';
import StatsSection from '../components/dashboard/StatsSection';

const RegistroPage = () => {
  return (
    <div className="registro-content">
      <Header />
      <div> {/* Aquí hemos eliminado la clase "registro-grid" */}
        <StatsSection title="Días de entrenamiento" content="workouts" className="inline-stats" />
      </div>
      <div className="registro-bottom-sections">
        <CombinedRecentWorkouts /> {/* Componente unificado para ambas listas */}
        <RegistroEjercicio /> {/* Mantenemos el formulario de fuerza */}
      </div>
    </div>
  );
};

export default RegistroPage;