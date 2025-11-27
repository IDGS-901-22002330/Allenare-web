import React, { useEffect, useState, useRef, useCallback } from "react";
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

const RoutineBuilder = ({
  routineToEdit,
  onSave,
  onCancel,
  showSnackbar,
  exercises = [],
}) => {
  const [steps, setSteps] = useState([]);
  const [nombre, setNombre] = useState("");
  const nameRef = useRef(null);
  const [saving, setSaving] = useState(false);
  const [localExercises, setLocalExercises] = useState(exercises);

  // Load exercises from Firebase if the prop is empty
  const loadExercises = useCallback(async () => {
    try {
      if (exercises.length === 0) {
        const snap = await getDocs(collection(db, "exercises"));
        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLocalExercises(list);
      } else {
        setLocalExercises(exercises);
      }
    } catch (error) {
      console.error("Error loading exercises:", error);
    }
  }, [exercises]);

  // Sync exercises from props or load from Firebase on mount
  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  // Load draft from localStorage on mount if not editing
  useEffect(() => {
    if (!routineToEdit) {
      const savedDraft = localStorage.getItem("routineBuilderDraft");
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setNombre(parsed.nombre || "");
          setSteps(parsed.steps || []);
        } catch (e) {
          console.error("Error parsing draft", e);
        }
      }
    }
  }, [routineToEdit]);

  // Save draft to localStorage whenever state changes (if not editing)
  useEffect(() => {
    if (!routineToEdit) {
      const draft = { nombre, steps };
      localStorage.setItem("routineBuilderDraft", JSON.stringify(draft));
    }
  }, [nombre, steps, routineToEdit]);

  // Clear draft helper
  const clearDraft = () => {
    localStorage.removeItem("routineBuilderDraft");
  };

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

  const handleSaveInternal = async () => {
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

      clearDraft(); // Clear draft on successful save
      if (onSave) onSave();
      if (showSnackbar)
        showSnackbar("Rutina guardada correctamente", "success");
    } catch (error) {
      console.error("Error saving routine", error);
      if (showSnackbar) showSnackbar("Error guardando rutina", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelInternal = () => {
    clearDraft(); // Clear draft on cancel
    if (onCancel) onCancel();
  };

  return (
    <Box
      sx={{
        height: "calc(100vh - 140px)",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        bgcolor: "#0f172a",
        p: 2,
        borderRadius: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 3,
          bgcolor: "#1e293b",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          flexShrink: 0,
          border: "1px solid #334155",
        }}
      >
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#60a5fa" }}
        >
          {routineToEdit ? "Editar Rutina" : "Crear Nueva Rutina"}
        </Typography>
        <TextField
          inputRef={nameRef}
          label="Nombre de la Rutina"
          variant="outlined"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          fullWidth
          placeholder="Ej: Rutina de Hipertrofia - Día 1"
          sx={{
            mt: 1,
            "& .MuiOutlinedInput-root": {
              color: "#f8fafc",
              "& fieldset": { borderColor: "#475569" },
              "&:hover fieldset": { borderColor: "#94a3b8" },
              "&.Mui-focused fieldset": { borderColor: "#60a5fa" },
            },
            "& .MuiInputLabel-root": { color: "#94a3b8" },
            "& .MuiInputLabel-root.Mui-focused": { color: "#60a5fa" },
          }}
        />
      </Paper>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          gap: 3,
          overflow: "hidden",
          flexDirection: { xs: "column", md: "row" },
        }}
      >
        {/* Left Column: Exercises Library */}
        <Paper
          sx={{
            flex: { xs: "none", md: 4 },
            height: { xs: "40%", md: "100%" },
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            border: "1px solid #334155",
            bgcolor: "#1e293b",
          }}
        >
          <Box
            sx={{ p: 2, borderBottom: "1px solid #334155", bgcolor: "#0f172a" }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: "bold", color: "#f8fafc" }}
            >
              Biblioteca de Ejercicios
            </Typography>
            <Typography variant="caption" sx={{ color: "#94a3b8" }}>
              Selecciona para agregar a la rutina
            </Typography>
          </Box>
          <List sx={{ flex: 1, overflowY: "auto", p: 1 }}>
            {localExercises.map((ex) => (
              <ListItem
                key={ex.id}
                sx={{
                  mb: 1,
                  borderRadius: 2,
                  bgcolor: "#334155",
                  border: "1px solid #475569",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "#60a5fa",
                    bgcolor: "#475569",
                    transform: "translateY(-2px)",
                    boxShadow: 2,
                  },
                }}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={() => handleAddExercise(ex)}
                    sx={{
                      bgcolor: "#3b82f6",
                      color: "white",
                      "&:hover": { bgcolor: "#2563eb" },
                      width: 32,
                      height: 32,
                    }}
                  >
                    <AddIcon fontSize="small" />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={ex.nombre}
                  secondary={ex.grupoMuscular}
                  primaryTypographyProps={{
                    fontWeight: 600,
                    fontSize: "0.95rem",
                    color: "#f8fafc",
                  }}
                  secondaryTypographyProps={{
                    fontSize: "0.8rem",
                    color: "#cbd5e1",
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Right Column: Routine Steps */}
        <Paper
          sx={{
            flex: { xs: "none", md: 8 },
            height: { xs: "60%", md: "100%" },
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            borderRadius: 3,
            boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
            bgcolor: "#1e293b",
            border: "1px solid #334155",
          }}
        >
          <Box
            sx={{
              p: 2,
              borderBottom: "1px solid #334155",
              bgcolor: "#0f172a",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: "bold", color: "#f8fafc" }}
              >
                Estructura de la Rutina
              </Typography>
              <Typography variant="caption" sx={{ color: "#94a3b8" }}>
                {steps.length} ejercicios agregados
              </Typography>
            </Box>
            <Box>
              <Button
                onClick={handleCancelInternal}
                sx={{
                  mr: 1,
                  color: "#94a3b8",
                  "&:hover": { color: "#f8fafc" },
                }}
              >
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveInternal}
                disabled={saving}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  boxShadow: 2,
                  bgcolor: "#3b82f6",
                  "&:hover": { bgcolor: "#2563eb" },
                }}
              >
                {saving ? "Guardando..." : "Guardar Rutina"}
              </Button>
            </Box>
          </Box>

          <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
            {steps.length === 0 ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                  color: "#64748b",
                  opacity: 0.7,
                }}
              >
                <AddIcon sx={{ fontSize: 60, mb: 2, color: "#334155" }} />
                <Typography variant="h6" sx={{ color: "#94a3b8" }}>
                  Tu rutina está vacía
                </Typography>
                <Typography variant="body2" sx={{ color: "#64748b" }}>
                  Agrega ejercicios desde el panel izquierdo
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {steps.map((s, idx) => (
                  <Paper
                    key={idx}
                    elevation={0}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      border: "1px solid #334155",
                      bgcolor: "#0f172a",
                      transition: "box-shadow 0.2s",
                      "&:hover": {
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        borderColor: "#475569",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 2,
                        pb: 1,
                        borderBottom: "1px dashed #334155",
                      }}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 2 }}
                      >
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            bgcolor: "#3b82f6",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                            fontSize: "0.85rem",
                          }}
                        >
                          {idx + 1}
                        </Box>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: "bold", color: "#f8fafc" }}
                        >
                          {s.exerciseNombre}
                        </Typography>
                      </Box>

                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <IconButton
                          onClick={() => move(idx, idx - 1)}
                          disabled={idx === 0}
                          size="small"
                          sx={{
                            border: "1px solid #334155",
                            color: "#94a3b8",
                            "&:hover": { color: "#f8fafc", bgcolor: "#334155" },
                            "&.Mui-disabled": { color: "#334155" },
                          }}
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => move(idx, idx + 1)}
                          disabled={idx === steps.length - 1}
                          size="small"
                          sx={{
                            border: "1px solid #334155",
                            color: "#94a3b8",
                            "&:hover": { color: "#f8fafc", bgcolor: "#334155" },
                            "&.Mui-disabled": { color: "#334155" },
                          }}
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          onClick={() => handleRemoveStep(idx)}
                          size="small"
                          sx={{
                            ml: 1,
                            color: "#ef4444",
                            bgcolor: "rgba(239, 68, 68, 0.1)",
                            "&:hover": { bgcolor: "#ef4444", color: "white" },
                            borderRadius: 1,
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                      <TextField
                        label="Series"
                        value={s.series}
                        onChange={(e) =>
                          handleChangeStep(idx, "series", e.target.value)
                        }
                        size="small"
                        sx={{
                          flex: 1,
                          minWidth: "100px",
                          "& .MuiOutlinedInput-root": {
                            color: "#f8fafc",
                            "& fieldset": { borderColor: "#334155" },
                            "&:hover fieldset": { borderColor: "#64748b" },
                            "&.Mui-focused fieldset": {
                              borderColor: "#60a5fa",
                            },
                          },
                          "& .MuiInputLabel-root": { color: "#64748b" },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#60a5fa",
                          },
                        }}
                        InputProps={{ sx: { borderRadius: 2 } }}
                      />
                      <TextField
                        label="Repeticiones"
                        value={s.repeticiones}
                        onChange={(e) =>
                          handleChangeStep(idx, "repeticiones", e.target.value)
                        }
                        size="small"
                        sx={{
                          flex: 1,
                          minWidth: "120px",
                          "& .MuiOutlinedInput-root": {
                            color: "#f8fafc",
                            "& fieldset": { borderColor: "#334155" },
                            "&:hover fieldset": { borderColor: "#64748b" },
                            "&.Mui-focused fieldset": {
                              borderColor: "#60a5fa",
                            },
                          },
                          "& .MuiInputLabel-root": { color: "#64748b" },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#60a5fa",
                          },
                        }}
                        InputProps={{ sx: { borderRadius: 2 } }}
                      />
                      <TextField
                        label="Descanso (seg)"
                        value={s.tiempoDescansoSegundos}
                        onChange={(e) =>
                          handleChangeStep(
                            idx,
                            "tiempoDescansoSegundos",
                            e.target.value
                          )
                        }
                        size="small"
                        sx={{
                          flex: 1,
                          minWidth: "120px",
                          "& .MuiOutlinedInput-root": {
                            color: "#f8fafc",
                            "& fieldset": { borderColor: "#334155" },
                            "&:hover fieldset": { borderColor: "#64748b" },
                            "&.Mui-focused fieldset": {
                              borderColor: "#60a5fa",
                            },
                          },
                          "& .MuiInputLabel-root": { color: "#64748b" },
                          "& .MuiInputLabel-root.Mui-focused": {
                            color: "#60a5fa",
                          },
                        }}
                        InputProps={{ sx: { borderRadius: 2 } }}
                      />
                    </Box>
                  </Paper>
                ))}
              </List>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default RoutineBuilder;
