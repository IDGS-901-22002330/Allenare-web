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
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  setDoc,
  getDoc,
  writeBatch,
} from "firebase/firestore";

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
      // --------------------
      // Paso 1: Leer los datos originales
      // --------------------
      const originalRef = doc(db, "routines", routine.id);
      const originalSnap = await getDoc(originalRef);
      const originalData =
        originalSnap && originalSnap.exists()
          ? { id: originalSnap.id, ...originalSnap.data() }
          : { id: routine.id, ...routine };

      // determinar posibles ids usados por los routine_exercises (doc id o routineID)
      const sourceIDs = [originalData.id];
      if (
        originalData.routineID &&
        originalData.routineID !== originalData.id
      ) {
        sourceIDs.push(originalData.routineID);
      }

      // obtener los ejercicios originales
      let exercisesSnap;
      if (sourceIDs.length === 1) {
        const q = query(
          collection(db, "routine_exercises"),
          where("routineID", "==", sourceIDs[0])
        );
        exercisesSnap = await getDocs(q);
      } else {
        const q = query(
          collection(db, "routine_exercises"),
          where("routineID", "in", sourceIDs)
        );
        exercisesSnap = await getDocs(q);
      }

      // --------------------
      // Paso 2: Crear la Nueva Rutina (El Padre) y preparar batches seguros
      // --------------------
      const MAX_BATCH_OPS = 500; // Firestore max writes per batch
      // create a new doc ref with a generated id so we can include it in the payload
      const newRoutineRef = doc(collection(db, "routines"));
      const newRoutineID = newRoutineRef.id;
      const newRoutinePayload = {
        nombre: originalData.nombre || "",
        tipo: "personal",
        userID: selectedUser.id,
        routineID: newRoutineID,
      };

      // We'll split writes into multiple batches if needed
      let batch = writeBatch(db);
      let opsInBatch = 0;

      // Add parent write first
      batch.set(newRoutineRef, newRoutinePayload, { merge: true });
      opsInBatch += 1;

      let batchesCommitted = 0;

      // --------------------
      // Paso 3: Clonar los Ejercicios (Los Hijos) dentro de batches con límite
      // --------------------
      for (const exDoc of exercisesSnap.docs) {
        const exerciseData = exDoc.data();
        // --------------------
        // Paso 4: Corrección de Tipos de Dato
        // --------------------
        // series and repeticiones MUST be stored as STRING (use empty string if missing)
        const seriesStr =
          exerciseData.series == null || exerciseData.series === ""
            ? ""
            : String(exerciseData.series);
        const repeticionesStr =
          exerciseData.repeticiones == null || exerciseData.repeticiones === ""
            ? ""
            : String(exerciseData.repeticiones);
        // tiempoDescansoSegundos must be NUMBER (use 0 if empty)
        const ordenNum =
          exerciseData.orden == null || exerciseData.orden === ""
            ? 0
            : parseInt(String(exerciseData.orden), 10);
        const descansoNum =
          exerciseData.tiempoDescansoSegundos == null ||
          exerciseData.tiempoDescansoSegundos === ""
            ? 0
            : parseInt(String(exerciseData.tiempoDescansoSegundos), 10);

        const newExRef = doc(collection(db, "routine_exercises"));
        const newExPayload = {
          routineID: newRoutineID,
          exerciseID: exerciseData.exerciseID,
          exerciseNombre: exerciseData.exerciseNombre,
          exerciseMediaURL: exerciseData.exerciseMediaURL || "",
          orden: ordenNum,
          series: seriesStr,
          repeticiones: repeticionesStr,
          tiempoDescansoSegundos: descansoNum,
        };

        // If batch is full, commit and start a new one
        if (opsInBatch >= MAX_BATCH_OPS) {
          await batch.commit();
          batchesCommitted += 1;
          batch = writeBatch(db);
          opsInBatch = 0;
        }

        batch.set(newExRef, newExPayload, { merge: true });
        opsInBatch += 1;
      }

      // Commit the last batch if it has operations
      if (opsInBatch > 0) {
        await batch.commit();
        batchesCommitted += 1;
      }

      if (batchesCommitted > 1 && showSnackbar) {
        showSnackbar(
          `Asignación completada en ${batchesCommitted} batches (rutina id: ${newRoutineID})`,
          "info"
        );
      }

      if (showSnackbar)
        showSnackbar(
          `Rutina asignada a ${
            selectedUser.email || selectedUser.nombre
          } (id: ${newRoutineID})`,
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
