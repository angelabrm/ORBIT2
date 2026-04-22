
import React, { useState, useMemo } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { GlobalStyles } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { getTheme, globalStyles } from './theme/ThemeConfig';
import { AspectRatioWrapper } from './components/Layout/AspectRatioWrapper';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

const AppContent = () => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const theme = useMemo(() => getTheme(mode), [mode]);

  const toggleTheme = () => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles styles={globalStyles(mode) as any} />
      <AspectRatioWrapper>
        {!user ? (
          <Login mode={mode} toggleTheme={toggleTheme} />
        ) : (
          <Dashboard mode={mode} toggleTheme={toggleTheme} />
        )}
      </AspectRatioWrapper>
    </ThemeProvider>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
