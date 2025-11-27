import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import ExerciseTable from "./ExerciseTable";
import ExerciseForm from "./ExerciseForm";
import RoutineTable from "./RoutineTable";
import RoutineBuilder from "./RoutineBuilder";
import ChallengeTable from "./ChallengeTable";
import ChallengeForm from "./ChallengeForm";
import UserTable from "./UserTable";
import UserProfileModal from "./UserProfileModal";
import UnassignRoutineDialog from "./UnassignRoutineDialog";
import StatisticsSection from "./StatisticsSection";

const AdminDashboardPage = () => {
  const { section } = useParams();
  const [currentSection, setCurrentSection] = useState(section || "exercises");
  const [loading, setLoading] = useState(false);

  // Update currentSection when URL param changes
  useEffect(() => {
    if (section) {
      setCurrentSection(section);
    }
  }, [section]);

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

  // Unassign Routine Dialog state
  const [unassignDialogOpen, setUnassignDialogOpen] = useState(false);

  // User Profile Modal state
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState(null);

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
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setUsers(list);
    } catch (e) {
      console.error("Error fetching users", e);
      showSnackbar("Error al cargar usuarios", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch based on section
  useEffect(() => {
    if (currentSection === "exercises") fetchExercises();
    if (currentSection === "routines") {
      fetchRoutines();
      fetchUsers();
      fetchExercises(); // Ensure exercises are always loaded for RoutineBuilder
    }
    if (currentSection === "challenges") {
      fetchChallenges();
      fetchUsers();
    }
    if (currentSection === "users") {
      fetchUsers();
    }
    if (currentSection === "statistics") {
      fetchUsers();
      fetchRoutines();
      fetchChallenges();
      fetchExercises();
    }
  }, [
    currentSection,
    fetchExercises,
    fetchRoutines,
    fetchChallenges,
    fetchUsers,
  ]);

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

  const handleOpenUnassignDialog = () => {
    setUnassignDialogOpen(true);
  };

  const handleCloseUnassignDialog = () => {
    setUnassignDialogOpen(false);
  };

  const handleOpenUserProfile = (user) => {
    setSelectedUserForProfile(user);
    setProfileModalOpen(true);
  };

  const handleCloseUserProfile = () => {
    setSelectedUserForProfile(null);
    setProfileModalOpen(false);
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

  const getTitle = () => {
    switch (currentSection) {
      case "exercises":
        return "Gestión de Ejercicios";
      case "routines":
        return "Gestión de Rutinas";
      case "challenges":
        return "Gestión de Retos";
      case "users":
        return "Gestión de Usuarios";
      case "statistics":
        return "Estadísticas del Sistema";
      default:
        return "Panel de Administración";
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: "bold", color: "primary.main", mb: 4 }}
      >
        {getTitle()}
      </Typography>

      {loading &&
      view === "table" &&
      routineView === "table" &&
      challengeView === "table" ? (
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

          {currentSection === "users" && (
            <UserTable
              users={users}
              onRefresh={fetchUsers}
              showSnackbar={showSnackbar}
              onOpenUserProfile={handleOpenUserProfile}
            />
          )}

          {currentSection === "statistics" && (
            <StatisticsSection
              users={users}
              routines={routines}
              challenges={challenges}
              exercises={exercises}
            />
          )}
        </>
      )}
      <UnassignRoutineDialog
        open={unassignDialogOpen}
        onClose={handleCloseUnassignDialog}
        onSuccess={fetchUsers}
        showSnackbar={showSnackbar}
        users={users}
      />
      <UserProfileModal
        open={profileModalOpen}
        onClose={handleCloseUserProfile}
        user={selectedUserForProfile}
        availableRoutines={routines}
        showSnackbar={showSnackbar}
        onDataUpdate={fetchUsers}
      />
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
