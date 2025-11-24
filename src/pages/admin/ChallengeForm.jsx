import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, addDoc, setDoc, doc, getDocs } from "firebase/firestore";
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Autocomplete,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

const ChallengeForm = ({ challengeToEdit, onSave, onCancel, showSnackbar, users = [] }) => {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    reglas: "",
  });
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [tipo, setTipo] = useState("comunitario");
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (challengeToEdit) {
      setForm({
        nombre: challengeToEdit.nombre || "",
        descripcion: challengeToEdit.descripcion || "",
        reglas: challengeToEdit.reglas || "",
      });
      setTipo(challengeToEdit.tipo || "comunitario");
      if (challengeToEdit.assignedUserID) {
        // Try to find the user in the passed users list, otherwise create a minimal object
        const foundUser = users.find(u => u.id === challengeToEdit.assignedUserID);
        setSelectedUser(foundUser || { id: challengeToEdit.assignedUserID });
      } else {
        setSelectedUser(null);
      }
      // Normalize possible Firestore Timestamp or Date
      if (challengeToEdit.fechaInicio) {
        const s = challengeToEdit.fechaInicio.toDate
          ? dayjs(challengeToEdit.fechaInicio.toDate())
          : dayjs(challengeToEdit.fechaInicio);
        setFechaInicio(s);
      }
      if (challengeToEdit.fechaFin) {
        const f = challengeToEdit.fechaFin.toDate
          ? dayjs(challengeToEdit.fechaFin.toDate())
          : dayjs(challengeToEdit.fechaFin);
        setFechaFin(f);
      }
    }
  }, [challengeToEdit, users]);

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleTipoChange = (e) => {
    setTipo(e.target.value);
    if (e.target.value !== "asignado") setSelectedUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (challengeToEdit && challengeToEdit.id) {
        const ref = doc(db, "challenges", challengeToEdit.id);
        await setDoc(
          ref,
          {
            nombre: form.nombre,
            descripcion: form.descripcion,
            reglas: form.reglas,
            fechaInicio: fechaInicio ? fechaInicio.toDate() : null,
            fechaFin: fechaFin ? fechaFin.toDate() : null,
            tipo: tipo,
            assignedUserID:
              tipo === "asignado" && selectedUser ? selectedUser.id : null,
          },
          { merge: true }
        );
      } else {
        const added = await addDoc(collection(db, "challenges"), {
          nombre: form.nombre,
          descripcion: form.descripcion,
          reglas: form.reglas,
          fechaInicio: fechaInicio ? fechaInicio.toDate() : null,
          fechaFin: fechaFin ? fechaFin.toDate() : null,
          tipo: tipo,
          assignedUserID:
            tipo === "asignado" && selectedUser ? selectedUser.id : null,
        });
        // store challengeID
        await setDoc(
          doc(db, "challenges", added.id),
          { challengeID: added.id },
          { merge: true }
        );
      }
      if (onSave) onSave();
      if (showSnackbar) showSnackbar("Reto guardado", "success");
    } catch (e) {
      console.error("Error saving challenge", e);
      if (showSnackbar) showSnackbar("Error guardando reto", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        {challengeToEdit ? "Editar Reto" : "Crear Nuevo Reto"}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Nombre"
          name="nombre"
          value={form.nombre}
          onChange={handleChange}
          fullWidth
          required
          margin="normal"
        />
        <TextField
          label="Descripción"
          name="descripcion"
          value={form.descripcion}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          margin="normal"
        />
        <TextField
          label="Reglas"
          name="reglas"
          value={form.reglas}
          onChange={handleChange}
          fullWidth
          multiline
          rows={3}
          margin="normal"
        />

        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2">Tipo de Reto</Typography>
          <RadioGroup row value={tipo} onChange={handleTipoChange}>
            <FormControlLabel
              value="comunitario"
              control={<Radio />}
              label="Comunitario"
            />
            <FormControlLabel
              value="asignado"
              control={<Radio />}
              label="Asignado a Usuario"
            />
          </RadioGroup>
        </Box>

        {tipo === "asignado" && (
          <Box sx={{ mt: 1 }}>
            <Autocomplete
              options={users}
              getOptionLabel={(u) =>
                u?.email
                  ? `${u.email} ${u.nombre ? `- ${u.nombre}` : ""}`
                  : u.id
              }
              value={selectedUser}
              onChange={(e, newVal) => setSelectedUser(newVal)}
              filterOptions={(options, state) => {
                // Client-side filtering by email or nombre
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
                  label="Usuario (buscar por email o nombre)"
                  placeholder="ej: usuario@example.com"
                />
              )}
              isOptionEqualToValue={(option, value) => option.id === value?.id}
              noOptionsText="No se encontraron usuarios"
            />
          </Box>
        )}

        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: "flex", gap: 2, mt: 1 }}>
            <DatePicker
              label="Fecha Inicio"
              value={fechaInicio}
              onChange={(newValue) => setFechaInicio(newValue)}
              slotProps={{ textField: { size: "small" } }}
            />
            <DatePicker
              label="Fecha Fin"
              value={fechaFin}
              onChange={(newValue) => setFechaFin(newValue)}
              slotProps={{ textField: { size: "small" } }}
            />
          </Box>
        </LocalizationProvider>

        <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
          <Button onClick={onCancel} sx={{ mr: 1 }}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Guardando..." : "Guardar Reto"}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default ChallengeForm;
