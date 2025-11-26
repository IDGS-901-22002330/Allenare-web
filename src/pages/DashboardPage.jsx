import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Typography, Paper, Card, CardContent, Avatar, Button, CircularProgress } from '@mui/material';
import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import GroupIcon from '@mui/icons-material/Group';
import Header from '../components/dashboard/Header';
import StatsSection from '../components/dashboard/StatsSection';
import RouteMap from '../components/dashboard/RouteMap';
import CombinedRecentWorkouts from '../components/dashboard/CombinedRecentWorkouts';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(auth.currentUser);
  const [firestoreUser, setFirestoreUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    workouts: 0,
    distance: 0,
    usersCount: 0
  });

  useEffect(() => {
    const checkRoleAndFetchData = async (user) => {
      if (!user) return;

      try {
        setLoading(true);

        // Fetch User Data for Header and Role Check
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          await signOut(auth);
          navigate('/login');
          return;
        }

        const userData = userDocSnap.data();
        setFirestoreUser(userData);

        // Check Admin Role
        const role = userData.role ? userData.role.toLowerCase() : '';
        const tipo = userData.tipo ? userData.tipo.toLowerCase() : '';

        if (role !== 'admin' && tipo !== 'admin') {
          await signOut(auth);
          navigate('/login');
          return;
        }

        // Fetch All Users
        const usersSnap = await getDocs(collection(db, "users"));
        const usersList = usersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(usersList);

        // Fetch ALL Workouts (Global Stats)
        // Running Workouts
        const runningQuery = query(collection(db, 'running_workouts'));
        const runningSnap = await getDocs(runningQuery);
        const runningDocs = runningSnap.docs.map(d => d.data());

        // Gym Workouts
        const gymQuery = query(collection(db, 'gym_workouts'));
        const gymSnap = await getDocs(gymQuery);

        // Calculate Totals
        const totalDistance = runningDocs.reduce((acc, curr) => acc + (parseFloat(curr.distance) || 0), 0);
        const totalWorkouts = runningSnap.size + gymSnap.size;

        setStats({
          workouts: totalWorkouts,
          distance: totalDistance.toFixed(1),
          usersCount: usersSnap.size
        });

        setLoading(false);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        checkRoleAndFetchData(user);
      } else {
        // If no user, we might want to redirect to login or just wait
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, width: '100%', maxWidth: '1600px', margin: '0 auto' }}>
      <Header
        username={firestoreUser?.nombre || firestoreUser?.displayName || currentUser?.displayName || "Usuario"}
        email={currentUser?.email || ""}
        photoURL={firestoreUser?.fotoURL || currentUser?.photoURL}
      />

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <StatsSection
            title="Mis Entrenamientos"
            value={stats.workouts}
            icon={<FitnessCenterIcon fontSize="large" />}
            description="Total de sesiones realizadas"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsSection
            title="Kilómetros Recorridos"
            value={`${stats.distance} km`}
            icon={<DirectionsRunIcon fontSize="large" />}
            description="Distancia total corriendo"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <StatsSection
            title="Usuarios Registrados"
            value={stats.usersCount}
            icon={<GroupIcon fontSize="large" />}
            description="Total de usuarios en la plataforma"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} lg={4}>
          <CombinedRecentWorkouts />
        </Grid>
        <Grid item xs={12} lg={8}>
          <RouteMap users={users} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;