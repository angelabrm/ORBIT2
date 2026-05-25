
import React from 'react';
import { Box, Typography, Avatar, useTheme, Chip, Divider } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { User, ShieldCheck, Briefcase } from 'lucide-react';

const Header: React.FC = () => {
  const { user, startDate, endDate } = useAuth();
  const theme = useTheme();

  return (
    <Box
      component={motion.header}
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      sx={{
        height: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        px: 4,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(0, 8, 20, 0.85)' : 'background.paper',
        backdropFilter: 'blur(15px)',
        borderBottom: `2px solid ${theme.palette.mode === 'dark' ? 'rgba(11, 160, 175, 0.3)' : 'rgba(0,0,0,0.08)'}`,
        zIndex: 10,
        transition: 'all 0.5s ease-in-out',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', gap: 3 }}>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" sx={{ fontSize: 9, opacity: 0.5, display: 'block', mb: -0.5, letterSpacing: 1.5, fontWeight: 700 }}>PERIOD_RANGE</Typography>
            <Typography variant="caption" sx={{ fontSize: 11, fontFamily: '"JetBrains Mono", monospace', opacity: 0.8, fontWeight: 600, color: 'primary.main' }}>
              {startDate.format('DD MMM YYYY')} - {endDate.format('DD MMM YYYY')}
            </Typography>
          </Box>
          <Divider orientation="vertical" flexItem sx={{ height: 32, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)', my: 'auto' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', animation: 'pulse-subtle 2s infinite' }} />
            <Typography variant="caption" sx={{ fontSize: 10, letterSpacing: 1.5, fontWeight: 700, opacity: 0.8 }}>SYSTEM_ONLINE</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="h6" sx={{ fontSize: 16, fontWeight: 800, lineHeight: 1, color: theme.palette.mode === 'dark' ? '#fff' : 'inherit' }}>{user?.name}</Typography>
              {user?.serviceDesk === 'CAC' && user?.subNivel && user.subNivel !== 'NA' && (
                <Chip
                  label={user.subNivel}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: 9,
                    fontWeight: 800,
                    letterSpacing: 0.8,
                    bgcolor: user.subNivel === 'Calls' ? 'rgba(11,160,175,0.15)' : 'rgba(176,24,217,0.15)',
                    color: user.subNivel === 'Calls' ? 'primary.main' : '#B018D9',
                    border: `1px solid ${user.subNivel === 'Calls' ? 'rgba(11,160,175,0.4)' : 'rgba(176,24,217,0.4)'}`,
                    '& .MuiChip-label': { px: 0.8 },
                  }}
                />
              )}
            </Box>
            <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.7, letterSpacing: 1.5 }}>{user?.role.toUpperCase()} // AC_ID_{user?.rfc}</Typography>
          </Box>
          <Avatar 
            sx={{ 
              width: 48, 
              height: 48, 
              fontSize: 20,
              bgcolor: 'secondary.main',
              border: `2px solid ${theme.palette.primary.main}66`,
              boxShadow: theme.palette.mode === 'dark' ? '0 0 15px rgba(11, 160, 175, 0.3)' : 'none'
            }}
          >
            {user?.name.charAt(0)}
          </Avatar>
        </Box>
      </Box>
    </Box>
  );
};

export default Header;
