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

const ChallengeTable = ({ challenges = [], onEdit, onAddNew, showSnackbar, onRefresh }) => {
  const [usersMap, setUsersMap] = useState({});
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null });

  // Internal fetching removed in favor of props from parent

  useEffect(() => {
    // load users map to display assigned users
    const fetchUsers = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        const map = {};
        snap.docs.forEach((d) => {
          map[d.id] = { id: d.id, ...d.data() };
        });
        setUsersMap(map);
      } catch (e) {
        console.error("Error loading users for challenges table", e);
      }
    };
    fetchUsers();
  }, []);

  const handleDeleteClick = (id) => {
    setDeleteDialog({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteDoc(doc(db, "challenges", deleteDialog.id));
      if (onRefresh) onRefresh();
      if (showSnackbar) showSnackbar("Reto eliminado", "success");
    } catch (e) {
      console.error("Error deleting challenge", e);
      if (showSnackbar) showSnackbar("Error al eliminar reto", "error");
    } finally {
      setDeleteDialog({ open: false, id: null });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialog({ open: false, id: null });
  };

  const formatDate = (value) => {
    if (!value) return "";
    try {
      let d;
      // Firestore Timestamp has toDate()
      if (value.toDate && typeof value.toDate === "function") {
        d = value.toDate();
      } else if (value.seconds) {
        // another possible form
        d = new Date(value.seconds * 1000);
      } else {
        d = new Date(value);
      }
      if (isNaN(d.getTime())) return "";
      return d.toLocaleDateString();
    } catch (e) {
      return "";
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Retos</Typography>
        <Button variant="contained" onClick={onAddNew}>
          Crear Nuevo Reto
        </Button>
      </Box>

      <TableContainer sx={{ maxHeight: "65vh" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Tipo</TableCell>
              <TableCell>Fecha Inicio</TableCell>
              <TableCell>Fecha Fin</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {challenges.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.nombre}</TableCell>
                <TableCell>
                  {c.tipo === "asignado" ? "Asignado" : "Comunitario"}
                  {c.tipo === "asignado" && c.assignedUserID
                    ? ` (${usersMap[c.assignedUserID]?.email || c.assignedUserID
                    })`
                    : ""}
                </TableCell>
                <TableCell>{formatDate(c.fechaInicio)}</TableCell>
                <TableCell>{formatDate(c.fechaFin)}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => onEdit(c)} aria-label="edit">
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteClick(c.id)}
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
        <DialogTitle>Eliminar Reto</DialogTitle>
        <DialogContent>
          ¿Estás seguro de que deseas eliminar este reto?
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

export default ChallengeTable;
