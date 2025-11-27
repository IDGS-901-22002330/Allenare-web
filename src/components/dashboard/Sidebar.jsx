import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Box, IconButton, Tooltip, useTheme, Divider } from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import LogoutIcon from "@mui/icons-material/Logout";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ListAltIcon from "@mui/icons-material/ListAlt";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import GroupIcon from "@mui/icons-material/Group";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import { Timeline } from "@mui/icons-material";
import BarChartIcon from "@mui/icons-material/BarChart";

const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  const theme = useTheme();

  const generalItems = [
    { path: "/dashboard", icon: <DashboardIcon />, label: "Dashboard" },
    { path: "/estadisticas", icon: <AssessmentIcon />, label: "Estadísticas" },
    { path: "/analitics", icon: <Timeline />, label: "Analiticas" }
  ];

  const adminItems = [
    { path: "/admin/exercises", icon: <DirectionsRunIcon />, label: "Ejercicios" },
    { path: "/admin/routines", icon: <ListAltIcon />, label: "Rutinas" },
    { path: "/admin/challenges", icon: <EmojiEventsIcon />, label: "Retos" },
    { path: "/admin/users", icon: <GroupIcon />, label: "Usuarios" },
    { path: "/admin/statistics", icon: <BarChartIcon />, label: "Estadísticas Admin" },
  ];

  const renderItem = (item) => {
    const isActive = location.pathname === item.path || (item.path === "/dashboard" && location.pathname === "/");
    return (
      <Tooltip key={item.path} title={item.label} placement="right">
        <Link to={item.path}>
          <IconButton
            sx={{
              width: 80,
              height: 80,
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
  };

  return (
    <Box
      sx={{
        width: 120,
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: 2,
        py: 2,
        height: "80%", // Increased height to fit more items
        borderRadius: 4,
        boxShadow: 3,
        overflowY: "auto", // Add scroll if needed on small screens
        "&::-webkit-scrollbar": { display: "none" }, // Hide scrollbar
      }}
    >
      {generalItems.map(renderItem)}

      <Divider sx={{ width: '70%', my: 1 }} />

      {adminItems.map(renderItem)}

      <Box sx={{ flexGrow: 1 }} /> {/* Spacer to push logout to bottom */}

      <Tooltip title="Cerrar Sesión" placement="right">
        <IconButton
          onClick={onLogout}
          sx={{
            width: 60,
            height: 60,
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
