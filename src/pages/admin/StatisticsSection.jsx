import React, { useMemo, useState } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    useTheme,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Avatar,
    Divider
} from '@mui/material';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line
} from 'recharts';
import PeopleIcon from '@mui/icons-material/People';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';

const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
            <Box sx={{
                p: 2,
                borderRadius: '50%',
                bgcolor: `${color}15`,
                color: color,
                mr: 3,
                display: 'flex'
            }}>
                {icon}
            </Box>
            <Box>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {title}
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#2d3748' }}>
                    {value}
                </Typography>
            </Box>
        </CardContent>
    </Card>
);

const StatisticsSection = ({ users = [], routines = [], challenges = [], exercises = [] }) => {
    const theme = useTheme();
    const [selectedUserId, setSelectedUserId] = useState('');

    // Global Stats
    const stats = useMemo(() => {
        const userRoles = users.reduce((acc, user) => {
            const role = user.tipo || 'user';
            acc[role] = (acc[role] || 0) + 1;
            return acc;
        }, {});

        const roleData = [
            { name: 'Usuarios', value: userRoles.user || 0, color: '#4FD1C5' },
            { name: 'Entrenadores', value: userRoles.entrenador || 0, color: '#F6AD55' },
            { name: 'Admins', value: userRoles.admin || 0, color: '#FC8181' },
        ];

        const contentData = [
            { name: 'Ejercicios', cantidad: exercises.length },
            { name: 'Rutinas', cantidad: routines.length },
            { name: 'Retos', cantidad: challenges.length },
        ];

        return { roleData, contentData };
    }, [users, routines, challenges, exercises]);

    // User Specific Stats
    const selectedUser = useMemo(() =>
        users.find(u => u.id === selectedUserId),
        [users, selectedUserId]);

    // Mock data for user progress (since we don't have real history yet)
    const userProgressData = useMemo(() => {
        if (!selectedUser) return [];
        return [
            { name: 'Sem 1', peso: selectedUser.weight ? parseFloat(selectedUser.weight) + 2 : 70, actividad: 3 },
            { name: 'Sem 2', peso: selectedUser.weight ? parseFloat(selectedUser.weight) + 1 : 69, actividad: 4 },
            { name: 'Sem 3', peso: selectedUser.weight ? parseFloat(selectedUser.weight) + 0.5 : 68.5, actividad: 2 },
            { name: 'Actual', peso: selectedUser.weight ? parseFloat(selectedUser.weight) : 68, actividad: 5 },
        ];
    }, [selectedUser]);

    return (
        <Box sx={{ p: 1 }}>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <StatCard
                        title="Total Usuarios"
                        value={users.length}
                        icon={<PeopleIcon fontSize="large" />}
                        color="#4299E1"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard
                        title="Rutinas Activas"
                        value={routines.length}
                        icon={<FitnessCenterIcon fontSize="large" />}
                        color="#48BB78"
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <StatCard
                        title="Retos Disponibles"
                        value={challenges.length}
                        icon={<EmojiEventsIcon fontSize="large" />}
                        color="#ECC94B"
                    />
                </Grid>
            </Grid>

            {/* Global Charts */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '400px' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Distribución de Usuarios</Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <PieChart>
                                <Pie
                                    data={stats.roleData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {stats.roleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '400px' }}>
                        <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Contenido del Sistema</Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={stats.contentData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="cantidad" fill="#667EEA" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>

            {/* User Specific Stats */}
            <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Estadísticas Individuales</Typography>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Seleccionar Usuario</InputLabel>
                        <Select
                            value={selectedUserId}
                            label="Seleccionar Usuario"
                            onChange={(e) => setSelectedUserId(e.target.value)}
                        >
                            {users.map(user => (
                                <MenuItem key={user.id} value={user.id}>
                                    {user.nombre || user.email}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {selectedUser ? (
                    <Box>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={4}>
                                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                                        <Avatar
                                            src={selectedUser.photoURL}
                                            sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: 'primary.main' }}
                                        >
                                            {selectedUser.nombre ? selectedUser.nombre[0].toUpperCase() : 'U'}
                                        </Avatar>
                                        <Typography variant="h6" gutterBottom>{selectedUser.nombre || 'Usuario'}</Typography>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>{selectedUser.email}</Typography>
                                        <Divider sx={{ my: 2 }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Peso</Typography>
                                                <Typography variant="body1" fontWeight="bold">{selectedUser.weight || '-'} kg</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Altura</Typography>
                                                <Typography variant="body1" fontWeight="bold">{selectedUser.height || '-'} cm</Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} md={8}>
                                <Box sx={{ height: 300 }}>
                                    <Typography variant="subtitle2" sx={{ mb: 2 }}>Progreso Estimado (Peso)</Typography>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={userProgressData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                            <YAxis domain={['dataMin - 5', 'dataMax + 5']} axisLine={false} tickLine={false} />
                                            <Tooltip />
                                            <Line
                                                type="monotone"
                                                dataKey="peso"
                                                stroke="#ED8936"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: '#ED8936' }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </Box>
                            </Grid>
                        </Grid>
                    </Box>
                ) : (
                    <Box sx={{ py: 8, textAlign: 'center', color: 'text.secondary' }}>
                        <Typography>Selecciona un usuario para ver sus estadísticas detalladas</Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default StatisticsSection;
