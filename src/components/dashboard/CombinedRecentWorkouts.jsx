import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import './RecentWorkouts.css'; // Reutilizamos el mismo estilo

const CombinedRecentWorkouts = () => {
  const [combinedWorkouts, setCombinedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        const userId = user.uid;
        let runningData = [];
        let gymData = [];

        const mergeAndSortWorkouts = () => {
          const allWorkouts = [...runningData, ...gymData];
          allWorkouts.sort((a, b) => b.date.toMillis() - a.date.toMillis());
          setCombinedWorkouts(allWorkouts);
          setLoading(false);
        };

        // Listener para running_workouts
        const runningQuery = query(collection(db, 'running_workouts'), where('userId', '==', userId), orderBy('date', 'desc'));
        const unsubscribeRunning = onSnapshot(runningQuery, (snapshot) => {
          runningData = snapshot.docs.map(doc => ({
            id: doc.id,
            workoutType: 'running', // Añadimos un tipo para diferenciarlo en el render
            ...doc.data()
          }));
          mergeAndSortWorkouts();
        }, (err) => {
          console.error("Error fetching running workouts: ", err);
          setError("No se pudieron cargar las carreras.");
          setLoading(false);
        });

        // Listener para gym_workouts
        const gymQuery = query(collection(db, 'gym_workouts'), where('userId', '==', userId), orderBy('date', 'desc'));
        const unsubscribeGym = onSnapshot(gymQuery, (snapshot) => {
          gymData = snapshot.docs.map(doc => ({
            id: doc.id,
            workoutType: 'gym', // Añadimos un tipo para diferenciarlo en el render
            ...doc.data()
          }));
          mergeAndSortWorkouts();
        }, (err) => {
          console.error("Error fetching gym workouts: ", err);
          setError("No se pudieron cargar los entrenamientos de fuerza.");
          setLoading(false);
        });

        // Limpiar listeners de Firestore
        return () => {
          unsubscribeRunning();
          unsubscribeGym();
        };
      } else {
        setCombinedWorkouts([]);
        setLoading(false);
        setError("Inicia sesión para ver tus entrenamientos.");
      }
    });

    // Limpiar listener de Auth
    return () => unsubscribeAuth();
  }, []);

  if (loading) {
    return <div className="recent-workouts-card">Cargando entrenamientos...</div>;
  }

  if (error) {
    return <div className="recent-workouts-card" style={{ color: 'red' }}>{error}</div>;
  }

  return (
    <div className="workouts-card">
      <h3>Entrenamientos Recientes</h3>
      {combinedWorkouts.length === 0 ? (
        <p>No hay entrenamientos registrados aún.</p>
      ) : (
        <div className="workouts-list">
          {combinedWorkouts.map((workout) => (
            <div key={workout.id} className="workout-item">
              <div className="workout-info">
                <span className="workout-icon">
                  {workout.workoutType === 'running' ? '🏃‍♂️' : '🏋️‍♂️'}
                </span>
                <span className="workout-details">
                  {workout.workoutType === 'running'
                    ? `${workout.distance} km – ${workout.duration} min`
                    : `${workout.type} – ${workout.duration} min`}
                </span>
              </div>
              <span className="workout-date">
                {workout.date?.toDate().toLocaleDateString('es-ES')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CombinedRecentWorkouts;