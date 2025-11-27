import { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  CircularProgress,
  Box,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import PropTypes from "prop-types";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from "firebase/firestore";
import DeleteIcon from "@mui/icons-material/Delete";

const UnassignRoutineDialog = ({
  open,
  onClose,
  onSuccess,
  showSnackbar,
  users = [],
}) => {
  const [selectedUser, setSelectedUser] = useState(null);
  const [userRoutines, setUserRoutines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  const loadUserRoutines = useCallback(
    async (userID) => {
      setLoading(true);
      try {
        const q = query(
          collection(db, "routines"),
          where("userID", "==", userID),
          where("tipo", "==", "personal")
        );
        const snap = await getDocs(q);
        const routines = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setUserRoutines(routines);
      } catch (error) {
        console.error("Error loading user routines:", error);
        if (showSnackbar)
          showSnackbar(`❌ Error al cargar rutinas: ${error.message}`, "error");
      } finally {
        setLoading(false);
      }
    },
    [showSnackbar]
  );

  // Cargar rutinas del usuario cuando se selecciona
  useEffect(() => {
    if (selectedUser) {
      loadUserRoutines(selectedUser.id);
    } else {
      setUserRoutines([]);
    }
  }, [selectedUser, loadUserRoutines]);

  const handleUnassign = async (routineId, routineName) => {
    if (!selectedUser || !routineId) {
      if (showSnackbar)
        showSnackbar("⚠️ Selecciona un usuario y una rutina válida", "warning");
      return;
    }

    setUnassigning(true);
    try {
      // Obtener los ejercicios asociados a esta rutina
      const q = query(
        collection(db, "routine_exercises"),
        where("routineID", "==", routineId)
      );
      const snap = await getDocs(q);

      // Eliminar todos los ejercicios
      for (const d of snap.docs) {
        await deleteDoc(doc(db, "routine_exercises", d.id));
      }

      // Eliminar la rutina
      await deleteDoc(doc(db, "routines", routineId));

      if (showSnackbar) {
        showSnackbar(
          `✅ Rutina "${routineName}" removida correctamente de ${
            selectedUser.nombre || selectedUser.email
          }`,
          "success"
        );
      }

      // Recargar la lista de rutinas
      await loadUserRoutines(selectedUser.id);

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error removing routine:", error);
      if (showSnackbar)
        showSnackbar(
          `❌ Error al remover la rutina: ${error.message}`,
          "error"
        );
    } finally {
      setUnassigning(false);
    }
  };

  const handleClose = () => {
    setSelectedUser(null);
    setUserRoutines([]);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Remover Rutina de Usuario</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Box sx={{ mb: 2 }}>
          <Autocomplete
            options={users}
            getOptionLabel={(u) =>
              u?.email ? `${u.email} ${u.nombre ? `- ${u.nombre}` : ""}` : u.id
            }
            value={selectedUser}
            onChange={(e, newVal) => setSelectedUser(newVal)}
            filterOptions={(options, state) => {
              const input = state.inputValue.toLowerCase();
              return options.filter(
                (opt) =>
                  (opt.email && opt.email.toLowerCase().includes(input)) ||
                  (opt.nombre && opt.nombre.toLowerCase().includes(input))
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Usuario"
                placeholder="Buscar por email o nombre"
                fullWidth
              />
            )}
            isOptionEqualToValue={(option, value) => option.id === value?.id}
            noOptionsText="No se encontraron usuarios"
          />
        </Box>

        {selectedUser && (
          <Box>
            <TextField
              label="Rutinas Asignadas"
              fullWidth
              value={selectedUser.nombre || selectedUser.email}
              disabled
              size="small"
              sx={{ mb: 2 }}
            />

            {loading ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : userRoutines.length === 0 ? (
              <Box sx={{ textAlign: "center", py: 2, color: "text.secondary" }}>
                Este usuario no tiene rutinas asignadas.
              </Box>
            ) : (
              <List disablePadding>
                {userRoutines.map((routine) => (
                  <ListItem
                    key={routine.id}
                    secondaryAction={
                      <Button
                        edge="end"
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() =>
                          handleUnassign(routine.id, routine.nombre)
                        }
                        disabled={unassigning}
                      >
                        Remover
                      </Button>
                    }
                    sx={{
                      mb: 1,
                      border: "1px solid #e0e0e0",
                      borderRadius: 1,
                      pr: 1,
                    }}
                  >
                    <ListItemText
                      primary={routine.nombre}
                      secondary={`ID: ${routine.id}`}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={unassigning}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

UnassignRoutineDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  showSnackbar: PropTypes.func.isRequired,
  users: PropTypes.array.isRequired,
};

export default UnassignRoutineDialog;
