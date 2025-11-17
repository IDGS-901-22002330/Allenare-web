import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { db } from "../../firebase";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";

const AssignRoutineDialog = ({
  open,
  routine,
  onClose,
  onSuccess,
  showSnackbar,
}) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (open) {
      const fetchUsers = async () => {
        setLoading(true);
        try {
          const snap = await getDocs(collection(db, "users"));
          const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setUsers(list);
        } catch (e) {
          console.error("Error loading users:", e);
          if (showSnackbar) showSnackbar("Error al cargar usuarios", "error");
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
      setSelectedUser(null);
    }
  }, [open, showSnackbar]);

  const handleAssign = async () => {
    if (!selectedUser || !routine) {
      if (showSnackbar)
        showSnackbar("Por favor selecciona un usuario", "error");
      return;
    }

    setAssigning(true);
    try {
      // Clone the routine with tipo "personal" and new userID
      const newRoutineData = {
        nombre: routine.nombre,
        tipo: "personal",
        userID: selectedUser.id,
      };
      const routineRef = await addDoc(
        collection(db, "routines"),
        newRoutineData
      );
      const newRoutineID = routineRef.id;

      // Clone all routine_exercises
      const q = query(
        collection(db, "routine_exercises"),
        where("routineID", "==", routine.id)
      );
      const snap = await getDocs(q);
      for (const doc of snap.docs) {
        const exerciseData = doc.data();
        // Ensure numeric fields are stored as numbers
        const seriesNum =
          exerciseData.series == null
            ? null
            : parseInt(String(exerciseData.series), 10);
        const repeticionesNum =
          exerciseData.repeticiones == null
            ? null
            : parseInt(String(exerciseData.repeticiones), 10);
        const descansoNum =
          exerciseData.tiempoDescansoSegundos == null
            ? null
            : parseInt(String(exerciseData.tiempoDescansoSegundos), 10);

        await addDoc(collection(db, "routine_exercises"), {
          routineID: newRoutineID,
          exerciseID: exerciseData.exerciseID,
          exerciseNombre: exerciseData.exerciseNombre,
          exerciseMediaURL: exerciseData.exerciseMediaURL || "",
          orden: exerciseData.orden,
          series: seriesNum,
          repeticiones: repeticionesNum,
          tiempoDescansoSegundos: descansoNum,
        });
      }

      if (showSnackbar)
        showSnackbar(
          `Rutina asignada a ${selectedUser.email || selectedUser.nombre}`,
          "success"
        );
      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      console.error("Error assigning routine:", e);
      if (showSnackbar) showSnackbar("Error al asignar rutina", "error");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Asignar Rutina a Usuario</DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
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
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={assigning}>
          Cancelar
        </Button>
        <Button
          onClick={handleAssign}
          variant="contained"
          disabled={!selectedUser || assigning}
        >
          {assigning ? "Asignando..." : "Asignar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AssignRoutineDialog;
