import { useState, useEffect } from "react";
import { collection, query, onSnapshot, where } from "firebase/firestore";
import { db, auth } from "../../firebase.js";
import "./AnaliticsCard.css";

const AnaliticsCard = () => {
  const [userCount, setUserCount] = useState(0);
  const [popularSports, setPopularSports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros por fecha
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    // Verificar administrador
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        loadUserCount();
        loadPopularSports();
      } else {
        setError("Debes iniciar sesión como admin.");
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Obtener total de usuarios registrados
  const loadUserCount = () => {
    const usersRef = collection(db, "users");

    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      setUserCount(snapshot.size);
      setLoading(false);
    });

    return unsubscribe;
  };

  // Cargar deportes populares con filtros opcionales
  const loadPopularSports = () => {
    let exerciseRef = collection(db, "exercise_logs");

    let filters = [];

    if (startDate) {
      filters.push(where("timestamp", ">=", new Date(startDate)));
    }
    if (endDate) {
      filters.push(where("timestamp", "<=", new Date(endDate + "T23:59:59")));
    }

    const q = filters.length > 0 ? query(exerciseRef, ...filters) : exerciseRef;

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const counter = {};

      snapshot.forEach((doc) => {
        const data = doc.data();
        const name = data.exerciseName;

        if (!counter[name]) {
          counter[name] = 0;
        }

        counter[name] += 1; // Contar cuántas veces aparece el ejercicio
      });

      // Convertir a arreglo para render
      const formatted = Object.keys(counter).map((key) => ({
        name: key,
        count: counter[key],
      }));

      setPopularSports(formatted);
    });

    return unsubscribe;
  };

  if (loading)
    return <div className="analytics-card">Cargando analíticas...</div>;
  if (error)
    return (
      <div className="analytics-card" style={{ color: "red" }}>
        {error}
      </div>
    );

  return (
    <div className="analytics-card">
      <h2>Dashboard de Analíticas (Admin)</h2>

      {/* Filtros por fecha */}
      <div className="filters">
        <label>
          Desde:
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label>
          Hasta:
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>

        <button onClick={loadPopularSports}>Aplicar filtros</button>
      </div>

      <div className="cards">
        {/* Total de usuarios */}
        <div className="metric-box">
          <h3>Usuarios registrados</h3>
          <p className="metric-number">{userCount}</p>
        </div>

        {/* Deportes populares */}
        <div className="metric-box">
          <h3>Deportes / Ejercicios más populares</h3>

          {popularSports.length === 0 ? (
            <p>No hay actividades registradas en este rango.</p>
          ) : (
            <ul>
              {popularSports.map((sport, index) => (
                <li key={index}>
                  <strong>{sport.name}</strong>: {sport.count} registros
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnaliticsCard;
