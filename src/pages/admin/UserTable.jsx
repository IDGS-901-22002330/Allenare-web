import { useState } from "react";
import PropTypes from "prop-types";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Chip,
  Tooltip,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import EditIcon from "@mui/icons-material/Edit";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import SportsIcon from "@mui/icons-material/Sports";
import PersonIcon from "@mui/icons-material/Person";
import { db } from "../../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

const UserTable = ({ users, onOpenUserProfile, onRefresh, showSnackbar }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [processingDelete, setProcessingDelete] = useState(false);
  const [processingRoleChange, setProcessingRoleChange] = useState(null);

  const handleEditClick = (user) => {
    if (onOpenUserProfile) {
      onOpenUserProfile(user);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      (user.nombre?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const normalizeRole = (u) =>
    ((u?.tipo || u?.role || "") + "").toString().toLowerCase();

  const staffUsers = filteredUsers.filter((u) => {
    const role = normalizeRole(u);
    return role === "admin" || role === "entrenador" || role === "trainer";
  });

  const regularUsers = filteredUsers.filter((u) => {
    const role = normalizeRole(u);
    return !role || role === "user" || role === "usuario" || role === "normal";
  });

  const getRoleIcon = (rawRole) => {
    const role = (rawRole || "").toString().toLowerCase();
    if (role === "admin") return <AdminPanelSettingsIcon color="error" />;
    if (role === "entrenador" || role === "trainer")
      return <SportsIcon color="warning" />;
    return <PersonIcon color="action" />;
  };

  const getRoleColor = (rawRole) => {
    const role = (rawRole || "").toString().toLowerCase();
    if (role === "admin") return "error";
    if (role === "entrenador" || role === "trainer") return "warning";
    return "default";
  };

  const roleLabel = (rawRole) => {
    const role = (rawRole || "").toString().toLowerCase();
    if (role === "admin") return "ADMIN";
    if (role === "entrenador" || role === "trainer") return "ENTRENADOR";
    return "USUARIO";
  };

  const handleRequestDelete = (user) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const handleCancelDelete = () => {
    setUserToDelete(null);
    setDeleteDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setProcessingDelete(true);
    try {
      const uid = userToDelete.id;

      // Delete routines and their exercises for the user
      const routinesQ = query(
        collection(db, "routines"),
        where("userID", "==", uid)
      );
      const routinesSnap = await getDocs(routinesQ);
      for (const rDoc of routinesSnap.docs) {
        const rId = rDoc.id;
        const exercisesQ = query(
          collection(db, "routine_exercises"),
          where("routineID", "==", rId)
        );
        const exSnap = await getDocs(exercisesQ);
        for (const exDoc of exSnap.docs) {
          await deleteDoc(doc(db, "routine_exercises", exDoc.id));
        }
        await deleteDoc(doc(db, "routines", rId));
      }

      // Delete user_challenges
      const chalQ = query(
        collection(db, "user_challenges"),
        where("userID", "==", uid)
      );
      const chalSnap = await getDocs(chalQ);
      for (const c of chalSnap.docs) {
        await deleteDoc(doc(db, "user_challenges", c.id));
      }

      // Delete user_exercises
      const ueQ = query(
        collection(db, "user_exercises"),
        where("userID", "==", uid)
      );
      const ueSnap = await getDocs(ueQ);
      for (const e of ueSnap.docs) {
        await deleteDoc(doc(db, "user_exercises", e.id));
      }

      // Delete user_routines_completed
      const rcQ = query(
        collection(db, "user_routines_completed"),
        where("userID", "==", uid)
      );
      const rcSnap = await getDocs(rcQ);
      for (const rc of rcSnap.docs) {
        await deleteDoc(doc(db, "user_routines_completed", rc.id));
      }

      // Finally delete user document
      await deleteDoc(doc(db, "users", uid));

      if (typeof onRefresh === "function") onRefresh();
      if (typeof showSnackbar === "function")
        showSnackbar("Usuario eliminado", "success");
    } catch (err) {
      console.error("Error deleting user:", err);
      if (typeof showSnackbar === "function")
        showSnackbar("Error al eliminar usuario: " + err.message, "error");
    } finally {
      setProcessingDelete(false);
      setUserToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const handleChangeRole = async (user, newRole) => {
    setProcessingRoleChange(user.id);
    try {
      const roleVal =
        newRole === "admin"
          ? "admin"
          : newRole === "entrenador"
          ? "trainer"
          : "user";
      const tipoVal =
        newRole === "admin"
          ? "admin"
          : newRole === "entrenador"
          ? "entrenador"
          : "user";
      await updateDoc(doc(db, "users", user.id), {
        tipo: tipoVal,
        role: roleVal,
      });
      if (typeof onRefresh === "function") onRefresh();
      if (typeof showSnackbar === "function")
        showSnackbar("Rol actualizado", "success");
    } catch (err) {
      console.error("Error updating role", err);
      if (typeof showSnackbar === "function")
        showSnackbar("Error al actualizar rol: " + err.message, "error");
    } finally {
      setProcessingRoleChange(null);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <TextField
          label="Buscar usuario por nombre o email"
          variant="outlined"
          size="small"
          fullWidth
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ bgcolor: "background.paper", borderRadius: 1 }}
        />
      </Box>

      {/* Section 1: Staff (Admins & Trainers) */}
      <Box sx={{ mb: 6 }}>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <AdminPanelSettingsIcon color="primary" />
          Equipo de Gestión
        </Typography>
        <Grid container spacing={3}>
          {staffUsers.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  position: "relative",
                  overflow: "visible",
                }}
              >
                <CardContent
                  sx={{ display: "flex", alignItems: "center", gap: 2 }}
                >
                  <Avatar
                    src={user.photoURL}
                    sx={{
                      width: 56,
                      height: 56,
                      bgcolor: "primary.main",
                      boxShadow: 2,
                    }}
                  >
                    {user.nombre ? user.nombre[0].toUpperCase() : "U"}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {user.nombre || "Sin nombre"}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 1 }}
                    >
                      {user.email}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                      <Chip
                        icon={getRoleIcon(user.tipo || user.role)}
                        label={roleLabel(user.tipo || user.role)}
                        size="small"
                        color={getRoleColor(user.tipo || user.role)}
                        variant="outlined"
                        sx={{ fontWeight: "bold" }}
                      />
                      <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel id={`role-select-label-${user.id}`}>
                          Rol
                        </InputLabel>
                        <Select
                          labelId={`role-select-label-${user.id}`}
                          value={normalizeRole(user) || "user"}
                          label="Rol"
                          onChange={(e) =>
                            handleChangeRole(user, e.target.value)
                          }
                        >
                          <MenuItem value={"admin"}>ADMIN</MenuItem>
                          <MenuItem value={"entrenador"}>ENTRENADOR</MenuItem>
                          <MenuItem value={"user"}>USUARIO</MenuItem>
                        </Select>
                      </FormControl>
                      <IconButton
                        onClick={() => handleRequestDelete(user)}
                        size="small"
                        color="error"
                        title="Eliminar usuario"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <IconButton
                    onClick={() => handleEditClick(user)}
                    size="small"
                    sx={{ bgcolor: "action.hover" }}
                    title="Ver perfil completo"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {staffUsers.length === 0 && (
            <Grid item xs={12}>
              <Typography color="text.secondary" fontStyle="italic">
                No hay administradores o entrenadores.
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>

      <Divider sx={{ mb: 6 }} />

      {/* Section 2: Regular Users */}
      <Box>
        <Typography
          variant="h6"
          sx={{
            mb: 2,
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <PersonIcon color="primary" />
          Usuarios Registrados
        </Typography>
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}
        >
          <Table>
            <TableHead sx={{ bgcolor: "background.default" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>Usuario</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Email</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
                <TableCell sx={{ fontWeight: "bold" }} align="right">
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {regularUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Avatar
                        src={user.photoURL}
                        sx={{ width: 32, height: 32 }}
                      >
                        {user.nombre ? user.nombre[0].toUpperCase() : "U"}
                      </Avatar>
                      <Typography variant="body2" fontWeight="500">
                        {user.nombre || "Sin nombre"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        icon={getRoleIcon(user.tipo || user.role)}
                        label={roleLabel(user.tipo || user.role)}
                        size="small"
                        variant="outlined"
                      />
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={normalizeRole(user) || "user"}
                          onChange={(e) =>
                            handleChangeRole(user, e.target.value)
                          }
                        >
                          <MenuItem value={"admin"}>ADMIN</MenuItem>
                          <MenuItem value={"entrenador"}>ENTRENADOR</MenuItem>
                          <MenuItem value={"user"}>USUARIO</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Ver perfil completo">
                      <IconButton
                        onClick={() => handleEditClick(user)}
                        size="small"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar usuario">
                      <IconButton
                        onClick={() => handleRequestDelete(user)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {regularUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                    <Typography color="text.secondary">
                      No se encontraron usuarios.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
      <Dialog open={deleteDialogOpen} onClose={handleCancelDelete}>
        <DialogTitle>Confirmar eliminación</DialogTitle>
        <DialogContent>
          ¿Estás seguro de que deseas eliminar a{" "}
          {userToDelete?.nombre || userToDelete?.email} ? Esto eliminará su
          perfil y datos asociados (rutinas, ejercicios, retos) de Firestore. La
          cuenta de Auth no será eliminada desde aquí.
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={processingDelete}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            disabled={processingDelete}
          >
            {processingDelete ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

UserTable.propTypes = {
  users: PropTypes.array.isRequired,
  onOpenUserProfile: PropTypes.func,
  onRefresh: PropTypes.func,
  showSnackbar: PropTypes.func,
};

export default UserTable;
