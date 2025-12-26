import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1565c0', // Corporate Navy Blue
    },
    secondary: {
      main: '#ffb74d', // Soft Orange/Gold for highlights
    },
    background: {
      default: '#f4f6f8', // Soft Grey
      paper: '#ffffff',
    },
    text: {
      primary: '#2b3445',
      secondary: '#6b778c'
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 600 },
    button: { fontWeight: 600 }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', 
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
        }
      }
    },
    // This styles the Sidebar (Drawer) specifically
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid #e0e0e0',
        }
      }
    }
  },
});

export default theme;