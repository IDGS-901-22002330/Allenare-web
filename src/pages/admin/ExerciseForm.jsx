import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Paper,
} from "@mui/material";

const ExerciseForm = ({ exerciseToEdit, onSave, onCancel, showSnackbar }) => {
  const [formData, setFormData] = useState({
    nombre: "",
    grupoMuscular: "",
    descripcion: "",
  });
  const [mediaURL, setMediaURL] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exerciseToEdit) {
      setFormData({
        nombre: exerciseToEdit.nombre || "",
        grupoMuscular: exerciseToEdit.grupoMuscular || "",
        descripcion: exerciseToEdit.descripcion || "",
      });
      setMediaURL(exerciseToEdit.mediaURL || "");
    }
  }, [exerciseToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // media is provided as a URL (video/image) to be shown in the app; no file upload here

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const exerciseData = {
        ...formData,
        mediaURL: mediaURL || exerciseToEdit?.mediaURL || "",
      };

      if (exerciseToEdit) {
        // Update existing document
        const docRef = doc(db, "exercises", exerciseToEdit.id);
        await setDoc(docRef, exerciseData, { merge: true });
      } else {
        // Create new document
        const docRef = await addDoc(collection(db, "exercises"), exerciseData);
        // Add the generated ID to the document
        await setDoc(docRef, { exerciseID: docRef.id }, { merge: true });
      }

      if (showSnackbar) showSnackbar("Ejercicio guardado", "success");
      onSave();
    } catch (error) {
      console.error("Error saving exercise: ", error);
      if (showSnackbar) showSnackbar("Error guardando ejercicio", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {exerciseToEdit ? "Editar Ejercicio" : "Crear Nuevo Ejercicio"}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Nombre"
          name="nombre"
          value={formData.nombre}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Grupo Muscular"
          name="grupoMuscular"
          value={formData.grupoMuscular}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Descripción"
          name="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          fullWidth
          multiline
          rows={4}
          margin="normal"
        />
        <Box sx={{ my: 2 }}>
          <TextField
            label="Media URL (video/imagen)"
            value={mediaURL}
            onChange={(e) => setMediaURL(e.target.value)}
            fullWidth
            margin="normal"
            placeholder="https://..."
          />
        </Box>
        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={onCancel} sx={{ mr: 1 }}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Guardar"}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ExerciseForm;
