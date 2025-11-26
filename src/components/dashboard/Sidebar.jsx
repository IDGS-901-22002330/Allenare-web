import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Box, IconButton, Tooltip, useTheme } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import LogoutIcon from "@mui/icons-material/Logout";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { Timeline } from "@mui/icons-material";

const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  const theme = useTheme();

  const menuItems = [
    { path: "/registro", icon: <AssignmentIcon />, label: "Registro" },
    { path: "/estadisticas", icon: <AssessmentIcon />, label: "Estadísticas" },
    { path: "/analitics", icon: <Timeline />, label: "Analiticas"},
    { path: "/fuerza", icon: <FitnessCenterIcon />, label: "Fuerza" },
    { path: "/dashboard", icon: <DashboardIcon />, label: "Dashboard" },
    { path: "/admin", icon: <AdminPanelSettingsIcon />, label: "Admin" },
  ];

  return (
    <Box
      sx={{
        width: 80,
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-around",
        py: 4,
        height: "70%",
        borderRadius: 4,
        boxShadow: 3,
      }}
    >
      {menuItems.map((item) => {
        const isActive = location.pathname === item.path || (item.path === "/dashboard" && location.pathname === "/");
        return (
          <Tooltip key={item.path} title={item.label} placement="right">
            <Link to={item.path}>
              <IconButton
                sx={{
                  width: 50,
                  height: 50,
                  bgcolor: isActive ? "primary.main" : "action.hover",
                  color: isActive ? "primary.contrastText" : "text.secondary",
                  borderRadius: 2,
                  "&:hover": {
                    bgcolor: isActive ? "primary.dark" : "action.selected",
                    transform: "scale(1.1)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                {item.icon}
              </IconButton>
            </Link>
          </Tooltip>
        );
      })}

      <Tooltip title="Cerrar Sesión" placement="right">
        <IconButton
          onClick={onLogout}
          sx={{
            width: 50,
            height: 50,
            bgcolor: "error.main",
            color: "white",
            borderRadius: 2,
            "&:hover": {
              bgcolor: "error.dark",
              transform: "scale(1.1)",
            },
            transition: "all 0.2s ease-in-out",
            mt: 2,
          }}
        >
          <LogoutIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default Sidebar;
