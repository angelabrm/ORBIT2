
import { createTheme, ThemeOptions } from '@mui/material/styles';

const lightPalette = {
  primary: { main: '#0ba0af' }, // Turquoise
  secondary: { main: '#001e60' }, // Dark Blue
  success: { main: '#b9e04d' },
  info: { main: '#0ba0af' },
  background: { default: '#f8fafc', paper: '#ffffff' },
  text: { primary: '#001e60', secondary: '#0ba0af' },
};

const darkPalette = {
  mode: 'dark' as const,
  primary: { main: '#0ba0af' }, // Electric Cyan
  secondary: { main: '#001e60' }, // Midnight Command
  success: { main: '#b9e04d' },
  info: { main: '#0ba0af' },
  background: { 
    default: '#000b1a', // Slightly lighter Deep Space
    paper: 'rgba(0, 30, 96, 0.6)' // Increased opacity
  },
  text: { 
    primary: '#0ba0af', 
    secondary: '#e2e8f0' // Brighter secondary text
  },
};

export const getTheme = (mode: 'light' | 'dark') => {
  const isDark = mode === 'dark';
  const palette = isDark ? darkPalette : lightPalette;
  
  return createTheme({
    palette: palette as ThemeOptions['palette'],
    typography: {
      fontFamily: '"Inter", "system-ui", sans-serif',
      h4: { 
        fontWeight: 800, 
        letterSpacing: '-0.03em', 
        fontFamily: isDark ? '"JetBrains Mono", monospace' : '"Inter", sans-serif' 
      },
      h5: { 
        fontWeight: 700, 
        fontFamily: isDark ? '"JetBrains Mono", monospace' : '"Inter", sans-serif' 
      },
      h6: { 
        fontWeight: 700, 
        letterSpacing: '0.1em', 
        textTransform: 'uppercase',
        fontSize: '0.9rem'
      },
      caption: { 
        letterSpacing: '0.15em', 
        fontWeight: 700,
        textTransform: 'uppercase',
        fontSize: '0.7rem' 
      },
    },
    shape: {
      borderRadius: 2, // Sharp, technical feel
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap');
        `,
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 0, // More industrial/angular
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            backgroundImage: 'none',
            border: isDark ? '1px solid rgba(11, 160, 175, 0.3)' : '1px solid rgba(0,0,0,0.05)',
            boxShadow: 'none',
            position: 'relative',
            overflow: 'hidden', // Contain the scan inside the card
            background: isDark 
              ? 'radial-gradient(circle at center, rgba(0, 30, 96, 0.6) 0%, rgba(0, 11, 26, 0.9) 100%)' 
              : '#fff',
            backdropFilter: isDark ? 'blur(10px)' : 'none',
            '&:hover': {
              borderColor: isDark ? '#0ba0af' : 'rgba(11, 160, 175, 0.3)',
              boxShadow: isDark ? '0 0 25px rgba(11, 160, 175, 0.2)' : '0 4px 20px rgba(0,0,0,0.05)',
              transform: 'translateY(-2px)',
            },
            // Technical corner accents - 4 Corners (internal)
            '&::before': isDark ? {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
              background: `
                linear-gradient(to right, #0ba0af 2px, transparent 2px) 0 0,
                linear-gradient(to bottom, #0ba0af 2px, transparent 2px) 0 0,
                linear-gradient(to left, #0ba0af 2px, transparent 2px) 100% 0,
                linear-gradient(to bottom, #0ba0af 2px, transparent 2px) 100% 0,
                linear-gradient(to right, #0ba0af 2px, transparent 2px) 0 100%,
                linear-gradient(to top, #0ba0af 2px, transparent 2px) 0 100%,
                linear-gradient(to left, #0ba0af 2px, transparent 2px) 100% 100%,
                linear-gradient(to top, #0ba0af 2px, transparent 2px) 100% 100%
              `,
              backgroundSize: '10px 10px',
              backgroundRepeat: 'no-repeat',
              zIndex: 2,
            } : {},
            '&::after': {}, // Clear the previous after
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          switchBase: {
            '&.Mui-checked': {
              color: '#0ba0af',
              '& + .MuiSwitch-track': {
                backgroundColor: '#0ba0af',
              },
            },
          },
        },
      },
    },
  });
};

export const globalStyles = (mode: 'light' | 'dark') => ({
  '@keyframes scan': {
    '0%': { top: '-20%' },
    '100%': { top: '120%' },
  },
  '@keyframes pulse-subtle': {
    '0%, 100%': { opacity: 0.3 },
    '50%': { opacity: 0.6 },
  },
  '*': {
    boxSizing: 'border-box' as const,
    margin: 0,
    padding: 0,
    '&::-webkit-scrollbar': {
      width: '4px',
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: mode === 'dark' ? 'rgba(11, 160, 175, 0.2)' : 'rgba(0,0,0,0.1)',
      borderRadius: '10px',
    },
  },
  body: {
    margin: 0,
    padding: 0,
    overflow: 'hidden',
    height: '100vh',
    width: '100vw',
    backgroundColor: mode === 'dark' ? '#000b1a' : '#f8fafc',
    color: mode === 'dark' ? '#e2e8f0' : '#001e60',
    transition: 'all 0.5s ease-in-out',
    fontFamily: '"Inter", sans-serif',
  },
  '#root': {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: mode === 'dark' 
      ? `
        radial-gradient(circle at 50% 50%, #00257a 0%, #000b1a 100%),
        url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/v6/svg'%3E%3Cg fill='%230ba0af' fill-opacity='0.05' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")
      `
      : `
        radial-gradient(circle at 50% 50%, #ffffff 0%, #f8fafc 100%),
        url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/v6/svg'%3E%3Cg fill='%230ba0af' fill-opacity='0.02' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")
      `,
    '&::before': {},
  }
});
