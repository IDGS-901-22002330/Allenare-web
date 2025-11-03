import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import './RecentWorkouts.css';

const RecentWorkouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        const userId = user.uid;
        const workoutsCollectionRef = collection(db, 'running_workouts');
        const q = query(
          workoutsCollectionRef,
          where('userId', '==', userId),
          orderBy('date', 'desc') // Cambiado a 'date' para coincidir con el modelo de datos
        );

        const unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          const fetchedWorkouts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setWorkouts(fetchedWorkouts);
          setLoading(false);
        }, (err) => {
          console.error("Error fetching workouts: ", err);
          setError("No se pudieron cargar los entrenamientos.");
          setLoading(false);
        });

        // Limpiar el listener de Firestore cuando el componente se desmonte o el usuario cambie
        return () => unsubscribeFirestore();
      } else {
        // No hay usuario autenticado, limpiar entrenamientos
        setWorkouts([]);
        setLoading(false);
        setError("Inicia sesión para ver tus entrenamientos.");
      }
    });

    // Limpiar el listener de Auth cuando el componente se desmonte
    return () => unsubscribeAuth();
  }, []); // Se ejecuta una vez al montar el componente

  if (loading) {
    return <div className="recent-workouts-card">Cargando entrenamientos...</div>;
  }

  if (error) {
    return <div className="recent-workouts-card" style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div className="recent-workouts-card">
      <h3>Entrenamientos recientes</h3>
      {workouts.length === 0 ? (
        <p>No hay entrenamientos registrados aún.</p>
      ) : (
        <ul>
          {workouts.map((workout) => (
            <li key={workout.id}> {/* Usa workout.id como key */}
              <span>🏃‍♂️</span>
              {/* Ahora usamos el campo 'date' (timestamp) para mostrar la fecha */}
              <span>
                {workout.distance} km – {workout.duration} min – 
                {workout.date && workout.date.toDate().toLocaleDateString('es-ES')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentWorkouts;