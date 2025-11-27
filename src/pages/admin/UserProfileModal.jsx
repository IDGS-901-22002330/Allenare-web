import { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Autocomplete,
  TextField,
  IconButton,
  Divider,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SportsIcon from "@mui/icons-material/Sports";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import HistoryIcon from "@mui/icons-material/History";
import { db } from "../../firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
  addDoc,
  Timestamp,
} from "firebase/firestore";

// Tab Panel Component
function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

const UserProfileModal = ({
  open,
  onClose,
  user,
  showSnackbar,
  onDataUpdate,
  availableRoutines = [],
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [userRoutines, setUserRoutines] = useState([]);
  const [userStats, setUserStats] = useState({
    completedRoutines: 0,
    activeWorkouts: 0,
  });
  const [recentExercises, setRecentExercises] = useState([]);
  const [activeChallenges, setActiveChallenges] = useState([]);
  const [selectedRoutineToAssign, setSelectedRoutineToAssign] = useState(null);
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState(false);

  // Load user's complete profile data
  const loadUserProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Load assigned routines
      const routinesQ = query(
        collection(db, "routines"),
        where("userID", "==", user.id),
        where("tipo", "==", "personal")
      );
      const routinesSnap = await getDocs(routinesQ);
      const routines = routinesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setUserRoutines(routines);

      // Load active challenges
      const challengesQ = query(
        collection(db, "user_challenges"),
        where("userID", "==", user.id),
        where("status", "==", "active")
      );
      const challengesSnap = await getDocs(challengesQ);
      const challenges = challengesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setActiveChallenges(challenges);

      // Load recent exercises (last 5)
      const exercisesQ = query(
        collection(db, "user_exercises"),
        where("userID", "==", user.id)
      );
      const exercisesSnap = await getDocs(exercisesQ);
      const exercises = exercisesSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.date?.toDate?.() || 0) - (a.date?.toDate?.() || 0))
        .slice(0, 5);
      setRecentExercises(exercises);

      // Calculate stats
      const completedQ = query(
        collection(db, "user_routines_completed"),
        where("userID", "==", user.id)
      );
      const completedSnap = await getDocs(completedQ);
      setUserStats((prev) => ({
        ...prev,
        completedRoutines: completedSnap.size,
        activeWorkouts: routines.length,
      }));
    } catch (error) {
      console.error("Error loading user profile:", error);
      if (showSnackbar)
        showSnackbar(`❌ Error al cargar perfil: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  }, [user, showSnackbar]);

  useEffect(() => {
    if (open) {
      loadUserProfile();
    }
  }, [open, loadUserProfile]);

  const handleAssignRoutine = async () => {
    if (!selectedRoutineToAssign || !user?.id) {
      if (showSnackbar)
        showSnackbar("⚠️ Selecciona una rutina válida", "warning");
      return;
    }

    setAssigning(true);
    try {
      // Check if routine is already assigned
      const existingQ = query(
        collection(db, "routines"),
        where("userID", "==", user.id),
        where("nombre", "==", selectedRoutineToAssign.nombre),
        where("tipo", "==", "personal")
      );
      const existingSnap = await getDocs(existingQ);

      if (!existingSnap.empty) {
        if (showSnackbar)
          showSnackbar(
            `⚠️ ${user.nombre || user.email} ya tiene asignada "${
              selectedRoutineToAssign.nombre
            }"`,
            "warning"
          );
        setAssigning(false);
        return;
      }

      // Clone the routine for this user
      const originalData = selectedRoutineToAssign;

      // Get routine exercises
      const exercisesQ = query(
        collection(db, "routine_exercises"),
        where("routineID", "==", selectedRoutineToAssign.id)
      );
      const exercisesSnap = await getDocs(exercisesQ);

      // Create new routine for user
      const newRoutineRef = await addDoc(collection(db, "routines"), {
        nombre: originalData.nombre,
        descripcion: originalData.descripcion || "",
        userID: user.id,
        tipo: "personal",
        routineID: selectedRoutineToAssign.id,
        createdAt: Timestamp.now(),
      });

      // Clone exercises
      for (const exerciseDoc of exercisesSnap.docs) {
        const exerciseData = exerciseDoc.data();
        await addDoc(collection(db, "routine_exercises"), {
          ...exerciseData,
          routineID: newRoutineRef.id,
        });
      }

      if (showSnackbar)
        showSnackbar(
          `✅ Rutina "${selectedRoutineToAssign.nombre}" asignada a ${
            user.nombre || user.email
          }`,
          "success"
        );

      setSelectedRoutineToAssign(null);
      await loadUserProfile();
      if (onDataUpdate) onDataUpdate();
    } catch (error) {
      console.error("Error assigning routine:", error);
      if (showSnackbar)
        showSnackbar(`❌ Error al asignar rutina: ${error.message}`, "error");
    } finally {
      setAssigning(false);
    }
  };

  const handleUnassignRoutine = async (routineId, routineName) => {
    if (!routineId || !user?.id) {
      if (showSnackbar) showSnackbar("⚠️ Datos inválidos", "warning");
      return;
    }

    setUnassigning(true);
    try {
      // Delete routine exercises
      const exercisesQ = query(
        collection(db, "routine_exercises"),
        where("routineID", "==", routineId)
      );
      const exercisesSnap = await getDocs(exercisesQ);

      for (const doc_ref of exercisesSnap.docs) {
        await deleteDoc(doc(db, "routine_exercises", doc_ref.id));
      }

      // Delete routine
      await deleteDoc(doc(db, "routines", routineId));

      if (showSnackbar)
        showSnackbar(
          `✅ Rutina "${routineName}" removida correctamente`,
          "success"
        );

      await loadUserProfile();
      if (onDataUpdate) onDataUpdate();
    } catch (error) {
      console.error("Error unassigning routine:", error);
      if (showSnackbar)
        showSnackbar(`❌ Error al remover rutina: ${error.message}`, "error");
    } finally {
      setUnassigning(false);
    }
  };

  const getRoleIcon = (role) => {
    if (role === "admin") return <AdminPanelSettingsIcon color="error" />;
    if (role === "entrenador") return <SportsIcon color="warning" />;
    return <PersonIcon color="action" />;
  };

  const getRoleColor = (role) => {
    if (role === "admin") return "error";
    if (role === "entrenador") return "warning";
    return "default";
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxHeight: "90vh",
        },
      }}
    >
      {/* Header with User Info */}
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          pb: 1,
          borderBottom: "1px solid #e0e0e0",
        }}
      >
        <Avatar
          src={user.photoURL}
          sx={{
            width: 48,
            height: 48,
            bgcolor: "primary.main",
          }}
        >
          {user.nombre ? user.nombre[0].toUpperCase() : "U"}
        </Avatar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            Perfil de {user.nombre || user.email}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user.email}
          </Typography>
        </Box>
        <Chip
          icon={getRoleIcon(user.tipo)}
          label={user.tipo?.toUpperCase() || "USUARIO"}
          color={getRoleColor(user.tipo)}
          variant="outlined"
          sx={{ fontWeight: "bold" }}
        />
      </DialogTitle>

      {/* Tabs */}
      <Box
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "background.default",
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          aria-label="user profile tabs"
          sx={{
            px: 3,
            "& .MuiTab-root": {
              textTransform: "none",
              fontSize: "0.95rem",
              fontWeight: 500,
            },
          }}
        >
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <FitnessCenterIcon fontSize="small" />
                Rutinas Activas
              </Box>
            }
            id="profile-tab-0"
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <EmojiEventsIcon fontSize="small" />
                Estadísticas
              </Box>
            }
            id="profile-tab-1"
          />
          <Tab
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <HistoryIcon fontSize="small" />
                Historial
              </Box>
            }
            id="profile-tab-2"
          />
        </Tabs>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Tab 1: Rutinas Activas */}
            <TabPanel value={tabValue} index={0}>
              <Box>
                {/* Asignar Nueva Rutina */}
                <Paper
                  sx={{
                    p: 2.5,
                    mb: 3,
                    bgcolor: "primary.dark",
                    color: "common.white",
                    borderRadius: 2,
                    border: "1px solid",
                    borderColor: "primary.dark",
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    fontWeight="bold"
                    sx={{ mb: 2, color: "common.white" }}
                  >
                    Asignar Nueva Rutina
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Autocomplete
                      options={availableRoutines}
                      getOptionLabel={(r) => r.nombre || ""}
                      value={selectedRoutineToAssign}
                      onChange={(e, newVal) =>
                        setSelectedRoutineToAssign(newVal)
                      }
                      filterOptions={(options, state) => {
                        const input = state.inputValue.toLowerCase();
                        return options.filter((opt) =>
                          opt.nombre.toLowerCase().includes(input)
                        );
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Selecciona una rutina"
                          size="small"
                          fullWidth
                          InputLabelProps={{ style: { color: "#ffffffcc" } }}
                          InputProps={{
                            ...params.InputProps,
                            style: { color: "#ffffff" },
                          }}
                          sx={{
                            flexGrow: 1,
                            "& .MuiInputBase-root": { color: "#ffffff" },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(255,255,255,0.12)",
                            },
                            background: "transparent",
                          }}
                        />
                      )}
                      isOptionEqualToValue={(option, value) =>
                        option.id === value?.id
                      }
                      noOptionsText="No hay rutinas disponibles"
                      sx={{ flexGrow: 1 }}
                    />
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      onClick={handleAssignRoutine}
                      disabled={!selectedRoutineToAssign || assigning}
                      sx={{
                        borderRadius: 1,
                        bgcolor: "secondary.main",
                        color: "#fff",
                        "&:hover": { bgcolor: "secondary.dark" },
                      }}
                    >
                      {assigning ? "Asignando..." : "Asignar"}
                    </Button>
                  </Box>
                </Paper>

                {/* Lista de Rutinas Activas */}
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  sx={{ mb: 2 }}
                >
                  Rutinas Asignadas ({userRoutines.length})
                </Typography>

                {userRoutines.length === 0 ? (
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: "center",
                      bgcolor: "background.default",
                    }}
                  >
                    <Typography color="text.secondary">
                      Sin rutinas asignadas actualmente
                    </Typography>
                  </Paper>
                ) : (
                  <List
                    disablePadding
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {userRoutines.map((routine) => (
                      <Paper
                        key={routine.id}
                        sx={{
                          p: 2,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          borderRadius: 2,
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Box>
                          <Typography fontWeight="600">
                            {routine.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {routine.id}
                          </Typography>
                        </Box>
                        <IconButton
                          edge="end"
                          color="error"
                          size="small"
                          onClick={() =>
                            handleUnassignRoutine(routine.id, routine.nombre)
                          }
                          disabled={unassigning}
                          title="Remover rutina"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Paper>
                    ))}
                  </List>
                )}
              </Box>
            </TabPanel>

            {/* Tab 2: Estadísticas */}
            <TabPanel value={tabValue} index={1}>
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  sx={{ mb: 2 }}
                >
                  Resumen de Progreso
                </Typography>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Rutinas Completadas
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {userStats.completedRoutines}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Typography color="text.secondary" gutterBottom>
                          Rutinas Activas
                        </Typography>
                        <Typography variant="h4" fontWeight="bold">
                          {userStats.activeWorkouts}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  sx={{ mb: 2, mt: 2 }}
                >
                  Retos Activos ({activeChallenges.length})
                </Typography>

                {activeChallenges.length === 0 ? (
                  <Paper
                    sx={{
                      p: 2,
                      textAlign: "center",
                      bgcolor: "background.default",
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No hay retos activos
                    </Typography>
                  </Paper>
                ) : (
                  <List disablePadding>
                    {activeChallenges.map((challenge) => (
                      <ListItem
                        key={challenge.id}
                        sx={{
                          mb: 1,
                          border: "1px solid #e0e0e0",
                          borderRadius: 1,
                          bgcolor: "background.paper",
                        }}
                      >
                        <ListItemText
                          primary={challenge.name}
                          secondary={`Estado: ${challenge.status}`}
                          primaryTypographyProps={{ fontWeight: 500 }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </Box>
            </TabPanel>

            {/* Tab 3: Historial Reciente */}
            <TabPanel value={tabValue} index={2}>
              <Box>
                <Typography
                  variant="subtitle2"
                  fontWeight="bold"
                  sx={{ mb: 2 }}
                >
                  Últimos Ejercicios ({recentExercises.length})
                </Typography>

                {recentExercises.length === 0 ? (
                  <Paper
                    sx={{
                      p: 3,
                      textAlign: "center",
                      bgcolor: "background.default",
                    }}
                  >
                    <Typography color="text.secondary">
                      Sin historial de ejercicios
                    </Typography>
                  </Paper>
                ) : (
                  <List
                    disablePadding
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {recentExercises.map((exercise) => (
                      <Paper
                        key={exercise.id}
                        sx={{
                          p: 2,
                          borderRadius: 1,
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <Box>
                            <Typography fontWeight="600">
                              {exercise.exerciseName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {exercise.series} series × {exercise.reps}{" "}
                              repeticiones
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            color="primary"
                            sx={{ fontWeight: 600 }}
                          >
                            {exercise.date
                              ?.toDate?.()
                              .toLocaleDateString("es-ES") || "N/A"}
                          </Typography>
                        </Box>
                      </Paper>
                    ))}
                  </List>
                )}
              </Box>
            </TabPanel>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: "1px solid #e0e0e0" }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

UserProfileModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  user: PropTypes.object,
  showSnackbar: PropTypes.func.isRequired,
  onDataUpdate: PropTypes.func,
  availableRoutines: PropTypes.array,
};

export default UserProfileModal;
