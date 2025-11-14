import React, { useState } from 'react';
import ExerciseTable from './ExerciseTable';
import ExerciseForm from './ExerciseForm';
import { Box, Typography } from '@mui/material';

const AdminDashboardPage = () => {
  const [view, setView] = useState('table'); // 'table' or 'form'
  const [currentExercise, setCurrentExercise] = useState(null);

  const handleEdit = (exercise) => {
    setCurrentExercise(exercise);
    setView('form');
  };

  const handleAddNew = () => {
    setCurrentExercise(null);
    setView('form');
  };

  const handleFormSave = () => {
    setView('table');
    setCurrentExercise(null);
  };

  const handleFormCancel = () => {
    setView('table');
    setCurrentExercise(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Contenido
      </Typography>
      {view === 'table' ? (
        <ExerciseTable onEdit={handleEdit} onAddNew={handleAddNew} />
      ) : (
        <ExerciseForm
          exerciseToEdit={currentExercise}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      )}
    </Box>
  );
};

export default AdminDashboardPage;
