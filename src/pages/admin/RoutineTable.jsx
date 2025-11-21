import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
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
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AssignRoutineDialog from "./AssignRoutineDialog";

const RoutineTable = ({ routines = [], onEdit, onAddNew, showSnackbar, onRefresh, users = [] }) => {
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });
  const [assignDialog, setAssignDialog] = useState({
    open: false,
    routine: null,
  });

  // Internal fetching removed in favor of props from parent


  const handleDeleteClick = (id) => {
    setDeleteDialog({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    try {
      // Delete related routine_exercises first
      const q2 = query(
        collection(db, "routine_exercises"),
        where("routineID", "==", deleteDialog.id)
      );
      const snap2 = await getDocs(q2);
      for (const d of snap2.docs) {
        await deleteDoc(doc(db, "routine_exercises", d.id));
      }
      await deleteDoc(doc(db, "routines", deleteDialog.id));
      if (onRefresh) onRefresh();
      if (showSnackbar)
        showSnackbar("Rutina eliminada correctamente", "success");
    } catch (error) {
      console.error("Error deleting routine:", error);
      if (showSnackbar) showSnackbar("Error al eliminar la rutina", "error");
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null });
  };

  const handleAssignClick = (routine) => {
    setAssignDialog({ open: true, routine });
  };

  const handleAssignClose = () => {
    setAssignDialog({ open: false, routine: null });
  };

  const handleAssignSuccess = () => {
    if (onRefresh) onRefresh();
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Rutinas Predefinidas</Typography>
        <Button variant="contained" onClick={onAddNew}>
          Añadir Nueva Rutina
        </Button>
      </Box>

      <TableContainer sx={{ maxHeight: "65vh" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {routines.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.nombre}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onEdit(r)} aria-label="edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleAssignClick(r)}
                    aria-label="assign"
                    title="Asignar a Usuario"
                  >
                    <PersonAddIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteClick(r.id)}
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
      <Dialog open={deleteDialog.open} onClose={handleDeleteCancel}>
        <DialogTitle>Eliminar Rutina</DialogTitle>
        <DialogContent>
          ¿Estás seguro de que deseas eliminar esta rutina? También se
          eliminarán sus ejercicios asociados.
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
      <AssignRoutineDialog
        open={assignDialog.open}
        routine={assignDialog.routine}
        onClose={handleAssignClose}
        onSuccess={handleAssignSuccess}
        showSnackbar={showSnackbar}
        users={users}
      />
    </Paper>
  );
};

export default RoutineTable;
