import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
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
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const ExerciseTable = ({ onEdit, onAddNew, showSnackbar }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "exercises"));
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

  const handleDeleteClick = (id) => {
    setDeleteDialog({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDoc(doc(db, "exercises", deleteDialog.id));
      fetchExercises();
      if (showSnackbar) showSnackbar("Ejercicio eliminado", "success");
    } catch (error) {
      console.error("Error deleting exercise: ", error);
      if (showSnackbar) showSnackbar("Error al eliminar ejercicio", "error");
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null });
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Ejercicios</Typography>
        <Button variant="contained" onClick={onAddNew}>
          Añadir Nuevo Ejercicio
        </Button>
      </Box>
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: "65vh" }}>
          <Table stickyHeader>
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
                    <IconButton
                      onClick={() => onEdit(exercise)}
                      aria-label="edit"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteClick(exercise.id)}
                      aria-label="delete"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
        <DialogTitle>Eliminar Ejercicio</DialogTitle>
        <DialogContent>
          ¿Estás seguro de que deseas eliminar este ejercicio?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancelar</Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ExerciseTable;
