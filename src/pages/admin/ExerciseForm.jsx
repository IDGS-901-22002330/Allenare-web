import React, { useState, useEffect } from 'react';
import { db, storage } from '../../firebase';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Paper,
} from '@mui/material';

const ExerciseForm = ({ exerciseToEdit, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    nombre: '',
    grupoMuscular: '',
    descripcion: '',
  });
  const [mediaFile, setMediaFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exerciseToEdit) {
      setFormData({
        nombre: exerciseToEdit.nombre || '',
        grupoMuscular: exerciseToEdit.grupoMuscular || '',
        descripcion: exerciseToEdit.descripcion || '',
      });
    }
  }, [exerciseToEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setMediaFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let mediaURL = exerciseToEdit?.mediaURL || '';

      if (mediaFile) {
        const storageRef = ref(storage, `exercise_media/${mediaFile.name}`);
        const uploadTask = await uploadBytes(storageRef, mediaFile);
        mediaURL = await getDownloadURL(uploadTask.ref);
      }

      const exerciseData = {
        ...formData,
        mediaURL,
      };

      if (exerciseToEdit) {
        // Update existing document
        const docRef = doc(db, 'exercises', exerciseToEdit.id);
        await setDoc(docRef, exerciseData, { merge: true });
      } else {
        // Create new document
        const docRef = await addDoc(collection(db, 'exercises'), exerciseData);
        // Add the generated ID to the document
        await setDoc(docRef, { exerciseID: docRef.id }, { merge: true });
      }

      onSave();
    } catch (error) {
      console.error("Error saving exercise: ", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {exerciseToEdit ? 'Editar Ejercicio' : 'Crear Nuevo Ejercicio'}
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
          <Button variant="contained" component="label">
            Subir Media
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
          {mediaFile && <Typography sx={{ ml: 2, display: 'inline' }}>{mediaFile.name}</Typography>}
        </Box>
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel} sx={{ mr: 1 }}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Guardar'}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ExerciseForm;
