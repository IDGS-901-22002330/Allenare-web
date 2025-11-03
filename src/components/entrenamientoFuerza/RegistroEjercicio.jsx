import React, { useState, useEffect } from 'react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase.js'; // Asegúrate de que la ruta sea correcta
import './RegistroEjercicio.css';

const RegistroEjercicio = () => { // Ya no recibe onAddWorkout, interactúa directamente con Firebase
  const [type, setType] = useState('');
  const [duration, setDuration] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => { // Marca la función como async
    e.preventDefault();

    if (!currentUser) {
      alert('Debes iniciar sesión para registrar un entrenamiento.');
      return;
    }
    // Validación básica
    if (!type || !duration) {
      alert('Por favor, completa los campos de tipo y duración.');
      return;
    }

    const now = new Date();
    const newWorkout = {
      userId: currentUser.uid,
      type: type,
      // Convertir la duración a número. Asumimos que el usuario introduce solo el número de minutos.
      duration: parseInt(duration, 10) || 0,
      date: Timestamp.fromDate(now) // El campo 'date' ahora es el timestamp
    };

    try {
      await addDoc(collection(db, 'gym_workouts'), newWorkout); // Cambiado a gym_workouts
      alert('Entrenamiento registrado con éxito!');
      // Limpiar los campos del formulario
      setType('');
      setDuration('');
    } catch (error) {
      console.error("Error al añadir el entrenamiento: ", error);
      alert('Hubo un error al registrar el entrenamiento.');
    }
  };

  return (
    <div className="registro-card">
      <h3>Registrar ejercicio</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Tipo de rutina"
          value={type}
          onChange={(e) => setType(e.target.value)}
          disabled={!currentUser}
        />
        <input
          type="number"
          placeholder="Duración (en minutos)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          disabled={!currentUser}
        />
        <button type="submit" disabled={!currentUser}>
          <span>+</span>
        </button>
        {!currentUser && <p style={{color: 'red', fontSize: '0.8em'}}>Inicia sesión para registrar entrenamientos.</p>}
      </form>
    </div>
  );
};
export default RegistroEjercicio;