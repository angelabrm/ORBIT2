
import React, { useState } from 'react';
import { Box, Typography, TextField, Button, Paper, useTheme, IconButton, Switch } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Orbit as OrbitIcon, Sun, Moon } from 'lucide-react';

interface LoginProps {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

const Login: React.FC<LoginProps> = ({ mode, toggleTheme }) => {
  const [rfc, setRfc] = useState('');
  const [error, setError] = useState(false);
  const { login } = useAuth();
  const theme = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!login(rfc)) {
      setError(true);
    }
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.palette.mode === 'dark' 
          ? 'radial-gradient(circle at 50% 50%, #001e60 0%, #000A1A 100%)'
          : '#f4f6fb',
        position: 'relative'
      }}
    >
      {/* Alta MX Logo in Corner */}
      <Box sx={{ 
        position: 'absolute', 
        top: 32, 
        left: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 2
      }}>
        <Box 
          component="img"
          src="https://lh3.googleusercontent.com/d/1Hi9_A8maaKrAGQQKVDgM2_Hkl5Zada4y"
          alt="Alta Logo"
          referrerPolicy="no-referrer"
          sx={{ 
            height: 80, 
            width: 'auto',
            display: 'block'
          }}
        />
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: 18, 
            color: 'primary.main', 
            textTransform: 'uppercase', 
            fontWeight: 800,
            letterSpacing: 4,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            height: 24
          }}
        >
          ALTA MX
        </Typography>
      </Box>

      {/* Theme Toggle in Corner - Sidebar Style */}
      <Box sx={{ 
        position: 'absolute', 
        bottom: 32, 
        left: 32,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
        px: 2,
        py: 1,
        borderRadius: 2,
        border: `1px solid ${theme.palette.primary.main}22`,
        backdropFilter: 'blur(5px)'
      }}>
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: 10, 
            opacity: 0.8, 
            fontWeight: 800, 
            letterSpacing: 1,
            color: theme.palette.mode === 'dark' ? '#fff' : 'secondary.main'
          }}
        >
          MODE
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Sun size={14} color={theme.palette.primary.main} opacity={theme.palette.mode === 'light' ? 1 : 0.3} />
          <Switch
            checked={theme.palette.mode === 'dark'}
            onChange={toggleTheme}
            color="secondary"
            size="small"
            sx={{
              scale: '0.8',
              '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'primary.main' },
            }}
          />
          <Moon size={14} color={theme.palette.primary.main} opacity={theme.palette.mode === 'dark' ? 1 : 0.3} />
        </Box>
      </Box>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 6,
            width: 500,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${theme.palette.primary.main}44`,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <OrbitIcon size={64} color={theme.palette.primary.main} />
            </motion.div>
          </Box>
          
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, color: theme.palette.primary.main }}>
              ORBIT
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.7, letterSpacing: 2 }}>
              Organizational Report of Business Insights and Trends
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                fullWidth
                label="Enter RFC"
                variant="outlined"
                value={rfc}
                onChange={(e) => {
                  setRfc(e.target.value);
                  setError(false);
                }}
                error={error}
                helperText={error ? "Invalid RFC. Try AGENT01, LEADER01, PM01" : ""}
                slotProps={{
                  input: {
                    sx: { 
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: '1.2rem',
                      letterSpacing: 2
                    }
                  }
                }}
              />
              <Button
                type="submit"
                variant="contained"
                size="large"
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                }}
              >
                Access System
              </Button>
            </Box>
          </form>

          <Typography variant="caption" sx={{ mt: 2, opacity: 0.5 }}>
            Secure Access Gateway v4.2.0
          </Typography>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default Login;
