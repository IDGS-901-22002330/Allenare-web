import React, { useState, useEffect } from 'react';
import { auth, db, storage } from '../firebase';
import { updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
    Container,
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    Alert,
    Avatar,
    Grid,
    IconButton
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import Header from '../components/dashboard/Header';

const ProfilePage = () => {
    const [user, setUser] = useState(auth.currentUser);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        weight: '',
        height: '',
        photoURL: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                try {
                    const docRef = doc(db, 'users', user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        setFormData({
                            displayName: user.displayName || '',
                            email: user.email || '',
                            weight: data.weight || '',
                            height: data.height || '',
                            photoURL: user.photoURL || ''
                        });
                    } else {
                        // Fallback if no firestore doc exists yet
                        setFormData({
                            displayName: user.displayName || '',
                            email: user.email || '',
                            weight: '',
                            height: '',
                            photoURL: user.photoURL || ''
                        });
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                    setError("Error al cargar datos del perfil.");
                } finally {
                    setLoading(false);
                }
            }
        };

        fetchUserData();
    }, [user]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setSaving(true);
            const storageRef = ref(storage, `profile_images/${user.uid}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            await updateProfile(user, { photoURL: downloadURL });
            await updateDoc(doc(db, 'users', user.uid), { photoURL: downloadURL });

            setFormData(prev => ({ ...prev, photoURL: downloadURL }));
            setSuccess('Foto de perfil actualizada.');
        } catch (err) {
            console.error(err);
            setError('Error al subir la imagen.');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess('');
        setError('');
        setSaving(true);

        try {
            // Update Auth Profile
            if (user.displayName !== formData.displayName) {
                await updateProfile(user, { displayName: formData.displayName });
            }

            // Update Firestore
            const userRef = doc(db, 'users', user.uid);
            await updateDoc(userRef, {
                displayName: formData.displayName,
                weight: formData.weight,
                height: formData.height
            });

            setSuccess('Perfil actualizado correctamente.');
        } catch (err) {
            console.error(err);
            setError('Error al actualizar el perfil.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Typography>Cargando perfil...</Typography>;

    return (
        <div className="dashboard-content">
            <Header />
            <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Mi Perfil
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

                    <Box component="form" onSubmit={handleSubmit}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
                            <Box sx={{ position: 'relative' }}>
                                <Avatar
                                    src={formData.photoURL}
                                    alt={formData.displayName}
                                    sx={{ width: 100, height: 100, mb: 1 }}
                                />
                                <IconButton
                                    color="primary"
                                    aria-label="upload picture"
                                    component="label"
                                    sx={{ position: 'absolute', bottom: 0, right: -10, bgcolor: 'background.paper' }}
                                >
                                    <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
                                    <PhotoCamera />
                                </IconButton>
                            </Box>
                            <Typography variant="subtitle1" color="text.secondary">
                                {formData.email}
                            </Typography>
                        </Box>

                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Nombre Completo"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Peso (kg)"
                                    name="weight"
                                    type="number"
                                    value={formData.weight}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Altura (cm)"
                                    name="height"
                                    type="number"
                                    value={formData.height}
                                    onChange={handleChange}
                                />
                            </Grid>
                        </Grid>

                        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type="submit"
                                variant="contained"
                                disabled={saving}
                                size="large"
                            >
                                {saving ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>
        </div>
    );
};

export default ProfilePage;
