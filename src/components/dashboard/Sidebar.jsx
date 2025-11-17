import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = ({ onLogout }) => {
  const location = useLocation();

  const handleLogoutClick = () => {
    onLogout();
  };

  return (
    <div className="sidebar">
           {" "}
      <Link
        to="/registro"
        className={location.pathname === "/registro" ? "active" : ""}
      >
        <div className="sidebar-icon">📋</div>
      </Link>
           {" "}
      <Link
        to="/estadisticas"
        className={location.pathname === "/estadisticas" ? "active" : ""}
      >
        <div className="sidebar-icon">📈</div>
      </Link>
      <Link
        to="/fuerza"
        className={location.pathname === "/fuerza" ? "active" : ""}
      >
        <div className="sidebar-icon">🏋️‍♂️</div>
      </Link>
      <Link
        to="/dashboard"
        className={
          location.pathname === "/dashboard" || location.pathname === "/"
            ? "active"
            : ""
        }
      >
        <div className="sidebar-icon">🏃‍♂️</div>
      </Link>
      <Link
        to="/admin"
        className={location.pathname === "/admin" ? "active" : ""}
      >
        <div className="sidebar-icon">⚙️</div>
      </Link>
      <button onClick={handleLogoutClick} className="sidebar-logout-button">
                <div className="sidebar-icon">📍</div>     {" "}
      </button>
         {" "}
    </div>
  );
};

export default Sidebar;
