import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase.js';
import './RecentWorkouts.css';

const CombinedRecentWorkouts = () => {
  const [combinedWorkouts, setCombinedWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        let runningData = [];
        let gymData = [];

        const mergeAndSortWorkouts = () => {
          const allWorkouts = [...runningData, ...gymData];
          allWorkouts.sort((a, b) => b.date.toMillis() - a.date.toMillis());
          setCombinedWorkouts(allWorkouts);
          setLoading(false);
        };

        // Listener for running_workouts (ALL users)
        const runningQuery = query(collection(db, 'running_workouts'), orderBy('date', 'desc'));
        const unsubscribeRunning = onSnapshot(runningQuery, (snapshot) => {
          runningData = snapshot.docs.map(doc => ({
            id: doc.id,
            workoutType: 'running',
            ...doc.data()
          }));
          mergeAndSortWorkouts();
        }, (err) => {
          console.error("Error fetching running workouts: ", err);
          setError("No se pudieron cargar las carreras.");
          setLoading(false);
        });

        // Listener for gym_workouts (ALL users)
        const gymQuery = query(collection(db, 'gym_workouts'), orderBy('date', 'desc'));
        const unsubscribeGym = onSnapshot(gymQuery, (snapshot) => {
          gymData = snapshot.docs.map(doc => ({
            id: doc.id,
            workoutType: 'gym',
            ...doc.data()
          }));
          mergeAndSortWorkouts();
        }, (err) => {
          console.error("Error fetching gym workouts: ", err);
          setError("No se pudieron cargar los entrenamientos de fuerza.");
          setLoading(false);
        });

        // Cleanup Firestore listeners
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

    // Cleanup Auth listener
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
                    ? `${parseFloat(workout.distance).toFixed(2)} km – ${workout.duration} min`
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