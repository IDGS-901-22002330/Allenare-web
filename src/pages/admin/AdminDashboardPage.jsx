import React, { useState } from "react";
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
} from "@mui/material";

const AdminDashboardPage = () => {
  const [currentSection, setCurrentSection] = useState("exercises"); // 'exercises' | 'routines' | 'challenges'

  // Exercises state
  const [view, setView] = useState("table"); // 'table' or 'form'
  const [currentExercise, setCurrentExercise] = useState(null);

  // Routines state
  const [routineView, setRoutineView] = useState("table"); // 'table' or 'builder'
  const [currentRoutine, setCurrentRoutine] = useState(null);

  // Challenges state
  const [challengeView, setChallengeView] = useState("table"); // 'table' or 'form'
  const [currentChallenge, setCurrentChallenge] = useState(null);

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

      {currentSection === "exercises" && (
        <>
          {view === "table" ? (
            <ExerciseTable
              onEdit={handleEdit}
              onAddNew={handleAddNew}
              showSnackbar={showSnackbar}
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
              onEdit={handleEditRoutine}
              onAddNew={handleAddRoutine}
              showSnackbar={showSnackbar}
            />
          ) : (
            <RoutineBuilder
              routineToEdit={currentRoutine}
              onSave={handleRoutineSave}
              onCancel={handleRoutineCancel}
              showSnackbar={showSnackbar}
            />
          )}
        </>
      )}

      {currentSection === "challenges" && (
        <>
          {challengeView === "table" ? (
            <ChallengeTable
              onEdit={handleEditChallenge}
              onAddNew={handleAddChallenge}
              showSnackbar={showSnackbar}
            />
          ) : (
            <ChallengeForm
              challengeToEdit={currentChallenge}
              onSave={handleChallengeSave}
              onCancel={handleChallengeCancel}
              showSnackbar={showSnackbar}
            />
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
