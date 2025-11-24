import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#38a6ff', // --accent-color
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8892b0', // --text-secondary
    },
    background: {
      default: '#0a192f', // --bg-primary
      paper: '#172a45',   // --bg-secondary
    },
    text: {
      primary: '#ccd6f6', // --text-primary
      secondary: '#8892b0', // --text-secondary
    },
    error: {
      main: '#cf6679', // --error-color
    },
  },
  typography: {
    fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
    h4: {
      fontWeight: 600,
      letterSpacing: '0.5px',
    },
    h6: {
      fontWeight: 600,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(56, 166, 255, 0.2)',
          },
        },
        contained: {
          background: 'linear-gradient(45deg, #38a6ff 30%, #58c6ff 90%)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none', // Remove default MUI overlay
          borderRadius: 12,
          border: '1px solid rgba(255, 255, 255, 0.05)',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        },
        head: {
          fontWeight: 600,
          backgroundColor: '#172a45',
          color: '#38a6ff',
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(56, 166, 255, 0.05) !important',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
          },
        },
      },
    },
  },
});

export default theme;
