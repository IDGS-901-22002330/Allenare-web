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
    Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
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
        user.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box>
            <Box sx={{ mb: 2 }}>
                <TextField
                    label="Buscar usuario"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nombre</TableCell>
                            <TableCell>Email</TableCell>
                            <TableCell>Rol</TableCell>
                            <TableCell>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>{user.nombre || 'Sin nombre'}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.tipo || 'user'}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEditClick(user)}>
                                        <EditIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={!!editUser} onClose={handleClose}>
                <DialogTitle>Editar Usuario</DialogTitle>
                <DialogContent sx={{ minWidth: 300, mt: 2 }}>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Rol</InputLabel>
                        <Select
                            value={tipo}
                            label="Rol"
                            onChange={(e) => setTipo(e.target.value)}
                        >
                            <MenuItem value="user">usuario</MenuItem>
                            <MenuItem value="admin">admin</MenuItem>
                            <MenuItem value="entrenador">entrenador</MenuItem>
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancelar</Button>
                    <Button onClick={handleSave} variant="contained">Guardar</Button>
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
