import { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  where,
  getDocs,
} from "firebase/firestore";
import { db, auth } from "../../firebase.js";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

import "./AnaliticsCard.css";

const toISODate = (value) => {
  // Acepta: Firestore Timestamp (obj con toDate), Date, o string parseable.
  if (!value) return null;
  try {
    if (typeof value.toDate === "function") {
      return value.toDate().toISOString().split("T")[0];
    }
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split("T")[0];
  } catch {
    return null;
  }
};

const AnaliticsCard = () => {
  const [userCount, setUserCount] = useState(0);

  // Ejercicios
  const [popularSports, setPopularSports] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Challenges
  const [challengeData, setChallengeData] = useState({});
  // challengeList: [{ id: challengeId, nombre }]
  const [challengeList, setChallengeList] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState("");

  const [activeChart, setActiveChart] = useState("sports");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar usuarios + ejercicios
  useEffect(() => {
    let unsubscribeUsers = null;
    let unsubscribeSports = null;

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setError("Debes iniciar sesión como admin.");
        setLoading(false);
        return;
      }

      // Contar usuarios
      unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        setUserCount(snapshot.size);
      });

      // Ejercicios con filtros
      let ref = collection(db, "exercise_logs");
      let conditions = [];

      if (startDate)
        conditions.push(where("timestamp", ">=", new Date(startDate)));
      if (endDate)
        conditions.push(
          where("timestamp", "<=", new Date(endDate + "T23:59:59"))
        );

      const q = conditions.length ? query(ref, ...conditions) : ref;

      unsubscribeSports = onSnapshot(q, (snapshot) => {
        const counter = {};

        snapshot.forEach((doc) => {
          const data = doc.data();
          if (!data || !data.exerciseName) return;

          if (!counter[data.exerciseName]) counter[data.exerciseName] = 0;
          counter[data.exerciseName] += 1;
        });

        const formatted = Object.keys(counter).map((key) => ({
          name: key,
          count: counter[key],
        }));

        setPopularSports(formatted);
        setLoading(false);
      });
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeSports) unsubscribeSports();
    };
  }, [startDate, endDate]);

  // Cargar estadísticas por challenge (agrupando por fecha
  useEffect(() => {
    const loadChallengeStats = async () => {
      try {
        const snap = await getDocs(collection(db, "challenges"));

        const dataPorChallenge = {};
        const list = [];

        snap.forEach((doc) => {
          const c = doc.data();
          // prioridad: campo challengeID (si existe), si no usar doc.id
          const id = c.challengeID || doc.id;
          const nombre = c.nombre || doc.data?.nombre || doc.nombre || doc.id || id;

          // añadir al listado (para mostrar nombres)
          list.push({ id, nombre });

          // asegurarnos de que haya fechas
          const fInicio = toISODate(c.fechaInicio);
          const fFin = toISODate(c.fechaFin);

          // si no hay fechas, igual creamos la entrada pero sin conteos
          if (!dataPorChallenge[id]) {
            dataPorChallenge[id] = { inicios: {}, terminados: {} };
          }

          if (fInicio) {
            dataPorChallenge[id].inicios[fInicio] =
              (dataPorChallenge[id].inicios[fInicio] || 0) + 1;
          }

          if (fFin) {
            dataPorChallenge[id].terminados[fFin] =
              (dataPorChallenge[id].terminados[fFin] || 0) + 1;
          }
        });

        // Convertir a listas ordenadas por fecha
        const finalData = {};
        Object.keys(dataPorChallenge).forEach((id) => {
          const grupo = dataPorChallenge[id];

          const fechas = new Set([
            ...Object.keys(grupo.inicios),
            ...Object.keys(grupo.terminados),
          ]);

          const lista = [...fechas].map((fecha) => ({
            date: fecha,
            inicios: grupo.inicios[fecha] ?? 0,
            terminados: grupo.terminados[fecha] ?? 0,
          }));

          lista.sort((a, b) => new Date(a.date) - new Date(b.date));
          finalData[id] = lista;
        });

        // Ordenar challengeList por nombre para UX
        list.sort((a, b) => {
          const na = (a.nombre || "").toString().toLowerCase();
          const nb = (b.nombre || "").toString().toLowerCase();
          return na.localeCompare(nb);
        });

        setChallengeList(list);
        setChallengeData(finalData);

        // Si no hay selection y hay challenges, seleccionar el primero automáticamente
        if (!selectedChallenge && list.length > 0) {
          setSelectedChallenge(list[0].id);
        }
      } catch (err) {
        console.error("Error cargando stats de challenges:", err);
      }
    };

    loadChallengeStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo al montar

  if (loading) return <div className="analytics-card">Cargando analíticas...</div>;
  if (error) return <div className="analytics-card" style={{ color: "red" }}>{error}</div>;

  return (
    <div className="analytics-card">
      <h2>Dashboard de Analíticas (Admin)</h2>

      {/* Selector de tipo de gráfica */}
      <div className="chart-selector">
        <button
          className={activeChart === "sports" ? "active" : ""}
          onClick={() => setActiveChart("sports")}
        >
          Ejercicios populares
        </button>

        <button
          className={activeChart === "challenges" ? "active" : ""}
          onClick={() => setActiveChart("challenges")}
        >
          Estadísticas de challenges
        </button>
      </div>

      <div className="cards">
        {/* TOTAL USUARIOS */}
        <div className="metric-box">
          <h3>Usuarios registrados</h3>
          <p className="metric-number">{userCount}</p>
        </div>

        {/* ===========================
            GRÁFICA EJERCICIOS
        ============================ */}
        {activeChart === "sports" && (
          <div className="metric-box">
            <h3>Ejercicios más populares</h3>

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
            </div>

            {popularSports.length === 0 ? (
              <p>No hay actividades registradas.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={popularSports}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4F46E5" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {/* ===========================
            GRÁFICA CHALLENGES
        ============================ */}
        {activeChart === "challenges" && (
          <div className="metric-box">
            <h3>Estadísticas de challenges</h3>

            {/* Selector de challenge con nombre visible */}
            <select
              value={selectedChallenge}
              onChange={(e) => setSelectedChallenge(e.target.value)}
              className="challenge-select"
            >
              <option value="">Seleccione un challenge</option>
              {challengeList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre || c.id}
                </option>
              ))}
            </select>

            {/* Mensaje si no hay datos o si no hay challenge seleccionado */}
            {!selectedChallenge || !challengeData[selectedChallenge] || challengeData[selectedChallenge].length === 0 ? (
              <p style={{ marginTop: 12 }}>Seleccione un challenge para ver la gráfica (o no hay datos para ese challenge).</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={challengeData[selectedChallenge]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="inicios" stroke="#4F46E5" />
                  <Line type="monotone" dataKey="terminados" stroke="#10B981" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnaliticsCard;
