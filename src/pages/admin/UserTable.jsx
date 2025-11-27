import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Avatar,
    Chip,
    Tooltip,
    Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SportsIcon from '@mui/icons-material/Sports';
import PersonIcon from '@mui/icons-material/Person';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';

const UserTable = ({ users, onRefresh, showSnackbar }) => {
    const [editUser, setEditUser] = useState(null);
    const [tipo, setTipo] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const handleEditClick = (user) => {
        setEditUser(user);
        setTipo(user.tipo || 'user');
    };

    const handleClose = () => {
        setEditUser(null);
    };

    const handleSave = async () => {
        if (!editUser) return;
        try {
            const userRef = doc(db, 'users', editUser.id);
            await updateDoc(userRef, { tipo: tipo });
            showSnackbar('Rol de usuario actualizado', 'success');
            onRefresh();
            handleClose();
        } catch (error) {
            console.error(error);
            showSnackbar('Error al actualizar usuario', 'error');
        }
    };

    const filteredUsers = users.filter(user =>
        (user.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const staffUsers = filteredUsers.filter(u => u.tipo === 'admin' || u.tipo === 'entrenador');
    const regularUsers = filteredUsers.filter(u => !u.tipo || u.tipo === 'user');

    const getRoleIcon = (role) => {
        if (role === 'admin') return <AdminPanelSettingsIcon color="error" />;
        if (role === 'entrenador') return <SportsIcon color="warning" />;
        return <PersonIcon color="action" />;
    };

    const getRoleColor = (role) => {
        if (role === 'admin') return 'error';
        if (role === 'entrenador') return 'warning';
        return 'default';
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
                    sx={{ bgcolor: 'background.paper', borderRadius: 1 }}
                />
            </Box>

            {/* Section 1: Staff (Admins & Trainers) */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AdminPanelSettingsIcon color="primary" />
                    Equipo de Gestión
                </Typography>
                <Grid container spacing={3}>
                    {staffUsers.map((user) => (
                        <Grid item xs={12} sm={6} md={4} key={user.id}>
                            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', position: 'relative', overflow: 'visible' }}>
                                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar
                                        src={user.photoURL}
                                        sx={{ width: 56, height: 56, bgcolor: 'primary.main', boxShadow: 2 }}
                                    >
                                        {user.nombre ? user.nombre[0].toUpperCase() : 'U'}
                                    </Avatar>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {user.nombre || 'Sin nombre'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {user.email}
                                        </Typography>
                                        <Chip
                                            icon={getRoleIcon(user.tipo)}
                                            label={user.tipo?.toUpperCase()}
                                            size="small"
                                            color={getRoleColor(user.tipo)}
                                            variant="outlined"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </Box>
                                    <IconButton onClick={() => handleEditClick(user)} size="small" sx={{ bgcolor: 'action.hover' }}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                    {staffUsers.length === 0 && (
                        <Grid item xs={12}>
                            <Typography color="text.secondary" fontStyle="italic">No hay administradores o entrenadores.</Typography>
                        </Grid>
                    )}
                </Grid>
            </Box>

            <Divider sx={{ mb: 6 }} />

            {/* Section 2: Regular Users */}
            <Box>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon color="primary" />
                    Usuarios Registrados
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <Table>
                        <TableHead sx={{ bgcolor: 'background.default' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Usuario</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }} align="right">Acciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {regularUsers.map((user) => (
                                <TableRow key={user.id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar src={user.photoURL} sx={{ width: 32, height: 32 }}>
                                                {user.nombre ? user.nombre[0].toUpperCase() : 'U'}
                                            </Avatar>
                                            <Typography variant="body2" fontWeight="500">
                                                {user.nombre || 'Sin nombre'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getRoleIcon(user.tipo)}
                                            label="Usuario"
                                            size="small"
                                            variant="outlined"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Editar Rol">
                                            <IconButton onClick={() => handleEditClick(user)} size="small">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {regularUsers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                                        <Typography color="text.secondary">No se encontraron usuarios.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            {/* Edit Dialog */}
            <Dialog open={!!editUser} onClose={handleClose} PaperProps={{ sx: { borderRadius: 3, minWidth: 350 } }}>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Editar Rol de Usuario</DialogTitle>
                <DialogContent sx={{ mt: 1 }}>
                    <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar src={editUser?.photoURL} sx={{ width: 48, height: 48 }}>
                            {editUser?.nombre ? editUser.nombre[0] : 'U'}
                        </Avatar>
                        <Box>
                            <Typography variant="subtitle2">{editUser?.nombre}</Typography>
                            <Typography variant="caption" color="text.secondary">{editUser?.email}</Typography>
                        </Box>
                    </Box>
                    <FormControl fullWidth>
                        <InputLabel>Rol Asignado</InputLabel>
                        <Select
                            value={tipo}
                            label="Rol Asignado"
                            onChange={(e) => setTipo(e.target.value)}
                        >
                            <MenuItem value="user">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PersonIcon fontSize="small" color="action" /> Usuario
                                </Box>
                            </MenuItem>
                            <MenuItem value="entrenador">
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <SportsIcon fontSize="small" color="warning" /> Entrenador
                                </Box>
                            </MenuItem>
                            {/* Restriction: If user is currently 'user', disable 'admin' option or show warning */}
                            <MenuItem
                                value="admin"
                                disabled={editUser?.tipo === 'user' || !editUser?.tipo}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <AdminPanelSettingsIcon fontSize="small" color={editUser?.tipo === 'user' || !editUser?.tipo ? 'disabled' : 'error'} />
                                    Administrador
                                    {(editUser?.tipo === 'user' || !editUser?.tipo) && " (Restringido)"}
                                </Box>
                            </MenuItem>
                        </Select>
                    </FormControl>
                    {(editUser?.tipo === 'user' || !editUser?.tipo) && (
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                            * Los usuarios normales no pueden ser ascendidos directamente a Administrador.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={handleClose} color="inherit">Cancelar</Button>
                    <Button onClick={handleSave} variant="contained" sx={{ borderRadius: 2, px: 3 }}>
                        Guardar Cambios
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

UserTable.propTypes = {
    users: PropTypes.array.isRequired,
    onRefresh: PropTypes.func.isRequired,
    showSnackbar: PropTypes.func.isRequired,
};

export default UserTable;
