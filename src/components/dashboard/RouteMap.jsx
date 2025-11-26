import React, { useState, useEffect } from 'react';
import { Paper, Typography, Box, Chip, Avatar } from '@mui/material';
import { MapContainer, TileLayer, Polyline, Popup, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const RouteMap = ({ users }) => {
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'running_workouts'),
      orderBy('date', 'desc'),
      limit(10) // Limit to 5 to avoid clutter
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const routesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })).filter(doc => doc.route && doc.route.length > 0); // Only keep docs with route data
      setRoutes(routesData);
    });

    return () => unsubscribe();
  }, []);

  const getUserData = (userId) => {
    return users.find(u => u.id === userId) || {};
  };

  // Center map on the first point of the most recent route, or a default
  const defaultCenter = [21.1619, -101.6869]; // León, Gto (approx)
  const center = routes.length > 0 && routes[0].route[0]
    ? [routes[0].route[0].lat, routes[0].route[0].lng]
    : defaultCenter;

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        height: '500px',
        width: '450px',
        borderRadius: 4,
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', color: 'text.primary' }}>
        Rutas Recientes
      </Typography>

      <Box sx={{ flexGrow: 1, width: '100%', height: '100%', borderRadius: 2, overflow: 'hidden' }}>
        <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%', minHeight: '500px' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {routes.map((workout, index) => {
            const user = getUserData(workout.userId);
            const positions = workout.route.map(p => [p.lat, p.lng]);
            const color = getRandomColor(); // You might want consistent colors per user

            return (
              <React.Fragment key={workout.id}>
                <Polyline
                  positions={positions}
                  pathOptions={{ color: color, weight: 5, opacity: 0.7 }}
                >
                  <Popup>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="subtitle2" fontWeight="bold">{user.nombre || 'Usuario'}</Typography>
                      <Typography variant="caption">{workout.name}</Typography>
                      <br />
                      <Typography variant="caption">{workout.distance} km - {workout.duration} min</Typography>
                    </Box>
                  </Popup>
                </Polyline>
                {/* Marker at start */}
                <Marker position={positions[0]}>
                  <Popup>
                    Inicio: {workout.name} <br /> Por: {user.nombre}
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </Box>
    </Paper>
  );
};

export default RouteMap;