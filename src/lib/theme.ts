'use client';

import { createTheme } from '@mui/material/styles';

// Define Parkit's color palette
const primaryCeleste = '#00B4D8';
const primaryAzul = '#0077B6';
const secondaryAzul = '#023E8A';
const accentCeleste = '#90E0EF';

const parkitTheme = createTheme({
  palette: {
    primary: {
      main: primaryAzul,
      light: primaryCeleste,
      dark: secondaryAzul,
      contrastText: '#fff',
    },
    secondary: {
      main: accentCeleste,
      contrastText: '#000',
    },
    error: {
      main: '#D32F2F',
    },
    warning: {
      main: '#FFA000',
    },
    info: {
      main: '#2196F3',
    },
    success: {
      main: '#4CAF50',
    },
    background: {
      default: '#F4F6F8',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#212B36',
      secondary: '#637381',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: { fontSize: '2.5rem', fontWeight: 700 },
    h2: { fontSize: '2rem', fontWeight: 700 },
    h3: { fontSize: '1.75rem', fontWeight: 700 },
    h4: { fontSize: '1.5rem', fontWeight: 600 },
    h5: { fontSize: '1.25rem', fontWeight: 600 },
    h6: { fontSize: '1rem', fontWeight: 600 },
    body1: { fontSize: '0.9375rem' },
    body2: { fontSize: '0.8125rem' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
        },
        containedPrimary: {
          '&:hover': {
            backgroundColor: primaryCeleste,
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: primaryAzul,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined' as const,
        size: 'small' as const,
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'none' as const,
      },
      styleOverrides: {
        root: {
          color: primaryAzul,
          '&:hover': {
            color: primaryCeleste,
            textDecoration: 'underline',
          },
        },
      },
    },
  },
});

export default parkitTheme;
