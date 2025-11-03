import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase.js'; // Asegúrate de que la ruta sea correcta
import './RecentStrengthWorkouts.css';

const RecentStrengthWorkouts = () => { // Ya no recibe 'workouts' como prop, los carga de Firebase
  const [strengthWorkouts, setStrengthWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        const userId = user.uid;
        const workoutsCollectionRef = collection(db, 'gym_workouts'); // Consulta la colección 'gym_workouts'
        // Consulta para obtener solo los entrenamientos del usuario actual, ordenados por fecha/hora
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
          setStrengthWorkouts(fetchedWorkouts);
          setLoading(false);
        }, (err) => {
          console.error("Error fetching strength workouts: ", err);
          setError("No se pudieron cargar los entrenamientos de fuerza.");
          setLoading(false);
        });

        return () => unsubscribeFirestore();
      } else {
        setStrengthWorkouts([]);
        setLoading(false);
        setError("Inicia sesión para ver tus entrenamientos de fuerza.");
      }
    });
    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return <div className="recent-workouts-card">Cargando entrenamientos de fuerza...</div>;
  }

  if (error) {
    return <div className="recent-workouts-card" style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div className="recent-workouts-card">
      <h3>Entrenamientos recientes</h3>
      {strengthWorkouts.length === 0 ? (
        <p>No hay entrenamientos de fuerza registrados aún.</p>
      ) : (
        <ul>
          {strengthWorkouts.map((workout) => (
            <li key={workout.id}> {/* Usa workout.id como key */}
              <span>🏋️‍♂️</span>
              {/* Ahora usamos el campo 'date' (timestamp) para mostrar la fecha */}
              <span>
                {workout.type} – {workout.duration} min – 
                {workout.date && workout.date.toDate().toLocaleDateString('es-ES')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default RecentStrengthWorkouts;