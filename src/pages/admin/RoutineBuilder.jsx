import React, { useEffect, useState, useRef } from "react";
import { db, auth } from "../../firebase";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  setDoc,
  query,
  where,
  deleteDoc,
} from "firebase/firestore";
import {
  Box,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Paper,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const RoutineBuilder = ({ routineToEdit, onSave, onCancel, showSnackbar }) => {
  const [exercisesLibrary, setExercisesLibrary] = useState([]);
  const [steps, setSteps] = useState([]);
  const [nombre, setNombre] = useState("");
  const nameRef = useRef(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const q = collection(db, "exercises");
        const snap = await getDocs(q);
        setExercisesLibrary(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Error loading exercises library", e);
      }
    };
    fetchExercises();
  }, []);

  useEffect(() => {
    if (routineToEdit) {
      setNombre(routineToEdit.nombre || "");
      // Load routine_exercises if needed
      const fetchRoutineExercises = async () => {
        try {
          const sourceRoutineID = routineToEdit.routineID || routineToEdit.id;
          const q = query(
            collection(db, "routine_exercises"),
            where("routineID", "==", sourceRoutineID)
          );
          const snap = await getDocs(q);
          const loaded = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
          // Map to step format expected
          setSteps(
            loaded.map((item) => ({
              exerciseID: item.exerciseID,
              exerciseNombre: item.exerciseNombre,
              exerciseMediaURL: item.exerciseMediaURL,
              series: item.series != null ? String(item.series) : "",
              repeticiones:
                item.repeticiones != null ? String(item.repeticiones) : "",
              // normalize to string for the input; if backend stored number, convert to string
              tiempoDescansoSegundos:
                item.tiempoDescansoSegundos != null
                  ? String(item.tiempoDescansoSegundos)
                  : "",
            }))
          );
        } catch (e) {
          console.error("Error loading routine exercises", e);
        }
      };
      fetchRoutineExercises();
    }
  }, [routineToEdit]);

  const handleAddExercise = (exercise) => {
    setSteps((prev) => [
      ...prev,
      {
        exerciseID: exercise.id,
        exerciseNombre: exercise.nombre,
        exerciseMediaURL: exercise.mediaURL || "",
        series: "",
        repeticiones: "",
        tiempoDescansoSegundos: "",
      },
    ]);
    // If the routine name is empty, focus the name input so user can fill it
    if (!nombre || !nombre.trim()) {
      if (nameRef.current && nameRef.current.focus) {
        nameRef.current.focus();
        // also scroll into view to ensure it's visible
        nameRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const handleRemoveStep = (index) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const move = (from, to) => {
    if (to < 0 || to >= steps.length) return;
    const copy = [...steps];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    setSteps(copy);
  };

  const handleChangeStep = (index, field, value) => {
    setSteps((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      alert("El nombre de la rutina es requerido");
      return;
    }
    setSaving(true);
    try {
      const userID = auth.currentUser?.uid || "";
      let routineRef;
      if (routineToEdit && routineToEdit.id) {
        routineRef = doc(db, "routines", routineToEdit.id);
        // ensure routineID field is present and points to the routine doc id or existing routineID
        const routineIdField = routineToEdit.routineID || routineToEdit.id;
        await setDoc(
          routineRef,
          { nombre, tipo: "predefinida", userID, routineID: routineIdField },
          { merge: true }
        );
        // delete existing routine_exercises for this routine (match by routineID field or doc id)
        const sourceRoutineID = routineToEdit.routineID || routineToEdit.id;
        const q = query(
          collection(db, "routine_exercises"),
          where("routineID", "==", sourceRoutineID)
        );
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await deleteDoc(doc(db, "routine_exercises", d.id));
        }
      } else {
        // create new routine doc with explicit routineID field equal to doc id
        const newRoutineRef = doc(collection(db, "routines"));
        const newRoutineID = newRoutineRef.id;
        await setDoc(
          newRoutineRef,
          { nombre, tipo: "predefinida", userID, routineID: newRoutineID },
          { merge: true }
        );
        routineRef = newRoutineRef;
      }

      const routineID =
        routineToEdit && (routineToEdit.routineID || routineToEdit.id)
          ? routineToEdit.routineID || routineToEdit.id
          : routineRef.id;

      // Add routine_exercises
      for (let i = 0; i < steps.length; i++) {
        const s = steps[i];
        // series and repeticiones must be saved as STRING (empty string if missing)
        const seriesStr =
          s.series == null || s.series === "" ? "" : String(s.series);
        const repeticionesStr =
          s.repeticiones == null || s.repeticiones === ""
            ? ""
            : String(s.repeticiones);
        // tiempoDescansoSegundos must be saved as NUMBER (use 0 if empty)
        const descansoNum =
          s.tiempoDescansoSegundos === "" || s.tiempoDescansoSegundos == null
            ? 0
            : parseInt(String(s.tiempoDescansoSegundos), 10);
        await addDoc(collection(db, "routine_exercises"), {
          routineID,
          exerciseID: s.exerciseID,
          exerciseNombre: s.exerciseNombre,
          exerciseMediaURL: s.exerciseMediaURL || "",
          orden: i,
          series: seriesStr,
          repeticiones: repeticionesStr,
          tiempoDescansoSegundos: descansoNum,
        });
      }

      if (onSave) onSave();
      if (showSnackbar)
        showSnackbar("Rutina guardada correctamente", "success");
    } catch (e) {
      console.error("Error saving routine", e);
      if (showSnackbar) showSnackbar("Error guardando rutina", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {routineToEdit ? "Editar Rutina" : "Crear Nueva Rutina"}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <TextField
          inputRef={nameRef}
          label="Nombre de la rutina"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          fullWidth
        />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "60vh", overflow: "auto" }}>
            <Typography variant="subtitle1" gutterBottom>
              Biblioteca de Ejercicios
            </Typography>
            <List>
              {exercisesLibrary.map((ex) => (
                <ListItem
                  key={ex.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleAddExercise(ex)}
                      aria-label="add"
                    >
                      <AddIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={ex.nombre}
                    secondary={ex.grupoMuscular}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: "60vh", overflow: "auto" }}>
            <Typography variant="subtitle1" gutterBottom>
              Rutina en Creación
            </Typography>
            <List>
              {steps.map((s, idx) => (
                <ListItem
                  key={idx}
                  sx={{ flexDirection: "column", alignItems: "stretch" }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <ListItemText primary={`${idx + 1}. ${s.exerciseNombre}`} />
                    <Box>
                      <IconButton
                        onClick={() => move(idx, idx - 1)}
                        aria-label="up"
                      >
                        <ArrowUpwardIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => move(idx, idx + 1)}
                        aria-label="down"
                      >
                        <ArrowDownwardIcon />
                      </IconButton>
                      <IconButton
                        onClick={() => handleRemoveStep(idx)}
                        aria-label="remove"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                    <TextField
                      label="Series"
                      value={s.series}
                      onChange={(e) =>
                        handleChangeStep(idx, "series", e.target.value)
                      }
                      size="small"
                    />
                    <TextField
                      label="Repeticiones"
                      value={s.repeticiones}
                      onChange={(e) =>
                        handleChangeStep(idx, "repeticiones", e.target.value)
                      }
                      size="small"
                    />
                    <TextField
                      label="Descanso (s)"
                      value={s.tiempoDescansoSegundos}
                      onChange={(e) =>
                        handleChangeStep(
                          idx,
                          "tiempoDescansoSegundos",
                          e.target.value
                        )
                      }
                      size="small"
                    />
                  </Box>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
        <Button onClick={onCancel} sx={{ mr: 1 }}>
          Cancelar
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando..." : "Guardar Rutina"}
        </Button>
      </Box>
    </Paper>
  );
};

export default RoutineBuilder;
