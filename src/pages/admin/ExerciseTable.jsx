import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, getDocs, doc, deleteDoc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const ExerciseTable = ({ onEdit, onAddNew }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, 'exercises'));
      const exercisesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExercises(exercisesList);
    } catch (error) {
      console.error("Error fetching exercises: ", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que quieres borrar este ejercicio?')) {
      try {
        await deleteDoc(doc(db, 'exercises', id));
        // Refresh the list after deletion
        fetchExercises();
      } catch (error) {
        console.error("Error deleting exercise: ", error);
      }
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Ejercicios</Typography>
        <Button variant="contained" onClick={onAddNew}>
          Añadir Nuevo Ejercicio
        </Button>
      </Box>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre</TableCell>
                <TableCell>Grupo Muscular</TableCell>
                <TableCell align="right">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {exercises.map((exercise) => (
                <TableRow key={exercise.id}>
                  <TableCell>{exercise.nombre}</TableCell>
                  <TableCell>{exercise.grupoMuscular}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => onEdit(exercise)} aria-label="edit">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(exercise.id)} aria-label="delete">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default ExerciseTable;
