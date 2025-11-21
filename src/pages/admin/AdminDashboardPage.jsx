import React, { useState, useEffect, useCallback } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import ExerciseTable from "./ExerciseTable";
import ExerciseForm from "./ExerciseForm";
import RoutineTable from "./RoutineTable";
import RoutineBuilder from "./RoutineBuilder";
import ChallengeTable from "./ChallengeTable";
import ChallengeForm from "./ChallengeForm";
import {
  Box,
  Typography,
  Button,
  ButtonGroup,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";

const AdminDashboardPage = () => {
  const [currentSection, setCurrentSection] = useState("exercises"); // 'exercises' | 'routines' | 'challenges'
  const [loading, setLoading] = useState(false);

  // Data state
  const [exercises, setExercises] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [users, setUsers] = useState([]);

  // Exercises UI state
  const [view, setView] = useState("table"); // 'table' or 'form'
  const [currentExercise, setCurrentExercise] = useState(null);

  // Routines UI state
  const [routineView, setRoutineView] = useState("table"); // 'table' or 'builder'
  const [currentRoutine, setCurrentRoutine] = useState(null);

  // Challenges UI state
  const [challengeView, setChallengeView] = useState("table"); // 'table' or 'form'
  const [currentChallenge, setCurrentChallenge] = useState(null);

  // Fetching functions
  const fetchExercises = useCallback(async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "exercises"));
      const list = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setExercises(list);
    } catch (error) {
      console.error("Error fetching exercises: ", error);
      showSnackbar("Error al cargar ejercicios", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRoutines = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "routines"),
        where("tipo", "==", "predefinida")
      );
      const querySnapshot = await getDocs(q);
      const list = querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setRoutines(list);
    } catch (error) {
      console.error("Error fetching routines:", error);
      showSnackbar("Error al cargar rutinas", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "challenges"));
      setChallenges(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error fetching challenges", e);
      showSnackbar("Error al cargar retos", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    } catch (e) {
      console.error("Error fetching users", e);
    }
  }, []);

  // Initial fetch based on section
  useEffect(() => {
    if (currentSection === "exercises") fetchExercises();
    if (currentSection === "routines") {
      fetchRoutines();
      fetchUsers();
    }
    if (currentSection === "challenges") {
      fetchChallenges();
      fetchUsers();
    }
  }, [currentSection, fetchExercises, fetchRoutines, fetchChallenges, fetchUsers]);

  // Exercises handlers
  const handleEdit = (exercise) => {
    setCurrentExercise(exercise);
    setView("form");
  };

  const handleAddNew = () => {
    setCurrentExercise(null);
    setView("form");
  };

  const handleFormSave = () => {
    setView("table");
    setCurrentExercise(null);
    fetchExercises();
  };

  const handleFormCancel = () => {
    setView("table");
    setCurrentExercise(null);
  };

  // Routines handlers
  const handleEditRoutine = (routine) => {
    setCurrentRoutine(routine);
    setRoutineView("builder");
  };

  const handleAddRoutine = () => {
    setCurrentRoutine(null);
    setRoutineView("builder");
  };

  const handleRoutineSave = () => {
    setRoutineView("table");
    setCurrentRoutine(null);
    fetchRoutines();
  };

  const handleRoutineCancel = () => {
    setRoutineView("table");
    setCurrentRoutine(null);
  };

  // Challenges handlers
  const handleEditChallenge = (c) => {
    setCurrentChallenge(c);
    setChallengeView("form");
  };

  const handleAddChallenge = () => {
    setCurrentChallenge(null);
    setChallengeView("form");
  };

  const handleChallengeSave = () => {
    setChallengeView("table");
    setCurrentChallenge(null);
    fetchChallenges();
  };

  const handleChallengeCancel = () => {
    setChallengeView("table");
    setCurrentChallenge(null);
  };

  // Snackbar for notifications
  const [snack, setSnack] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const showSnackbar = (message, severity = "success") => {
    setSnack({ open: true, message, severity });
  };
  const handleSnackClose = () => setSnack((s) => ({ ...s, open: false }));

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Contenido
      </Typography>

      <Box sx={{ mb: 2 }}>
        <ButtonGroup variant="outlined">
          <Button
            onClick={() => setCurrentSection("exercises")}
            variant={currentSection === "exercises" ? "contained" : "outlined"}
          >
            Ejercicios
          </Button>
          <Button
            onClick={() => setCurrentSection("routines")}
            variant={currentSection === "routines" ? "contained" : "outlined"}
          >
            Rutinas
          </Button>
          <Button
            onClick={() => setCurrentSection("challenges")}
            variant={currentSection === "challenges" ? "contained" : "outlined"}
          >
            Retos
          </Button>
        </ButtonGroup>
      </Box>

      {loading && (view === "table" && routineView === "table" && challengeView === "table") ? (
        <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {currentSection === "exercises" && (
            <>
              {view === "table" ? (
                <ExerciseTable
                  exercises={exercises}
                  onEdit={handleEdit}
                  onAddNew={handleAddNew}
                  showSnackbar={showSnackbar}
                  onRefresh={fetchExercises}
                />
              ) : (
                <ExerciseForm
                  exerciseToEdit={currentExercise}
                  onSave={handleFormSave}
                  onCancel={handleFormCancel}
                  showSnackbar={showSnackbar}
                />
              )}
            </>
          )}

          {currentSection === "routines" && (
            <>
              {routineView === "table" ? (
                <RoutineTable
                  routines={routines}
                  onEdit={handleEditRoutine}
                  onAddNew={handleAddRoutine}
                  showSnackbar={showSnackbar}
                  onRefresh={fetchRoutines}
                  users={users}
                />
              ) : (
                <RoutineBuilder
                  routineToEdit={currentRoutine}
                  onSave={handleRoutineSave}
                  onCancel={handleRoutineCancel}
                  showSnackbar={showSnackbar}
                  exercises={exercises}
                />
              )}
            </>
          )}

          {currentSection === "challenges" && (
            <>
              {challengeView === "table" ? (
                <ChallengeTable
                  challenges={challenges}
                  users={users}
                  onEdit={handleEditChallenge}
                  onAddNew={handleAddChallenge}
                  showSnackbar={showSnackbar}
                  onRefresh={fetchChallenges}
                />
              ) : (
                <ChallengeForm
                  challengeToEdit={currentChallenge}
                  users={users}
                  onSave={handleChallengeSave}
                  onCancel={handleChallengeCancel}
                  showSnackbar={showSnackbar}
                />
              )}
            </>
          )}
        </>
      )}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={handleSnackClose}
      >
        <Alert
          onClose={handleSnackClose}
          severity={snack.severity}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminDashboardPage;
