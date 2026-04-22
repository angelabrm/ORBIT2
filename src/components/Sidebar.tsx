
import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  IconButton, 
  useTheme,
  Switch,
  FormControlLabel,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Orbit as OrbitIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { MOCK_USERS } from '../data/mockData';

interface SidebarProps {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mode, toggleTheme }) => {
  const theme = useTheme();
  const { user, logout, setSelectedMember, startDate, setStartDate, endDate, setEndDate } = useAuth();

  const isLeader = user?.role === 'Leader';
  const { managementTab, setManagementTab } = useAuth();

  const showManagementTabs = user && (
    ["Leader", "Manager", "Executive", "Project Manager"].includes(user.role) || 
    user.serviceDesk === 'CAC' || 
    user.serviceDesk === 'Fleet' || 
    user.serviceDesk === 'Premium'
  );

  return (
    <Box
      sx={{
        width: 240,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'secondary.main',
        color: 'white',
        zIndex: 20,
        p: 2.5,
        gap: 2,
        borderRight: mode === 'dark' ? '1px solid rgba(11, 160, 175, 0.4)' : 'none',
        boxShadow: mode === 'dark' 
          ? '10px 0 30px rgba(0,0,0,0.5)' 
          : '0 0 10px rgba(0,30,96,0.2)',
        transition: 'all 0.5s ease-in-out',
      }}
    >
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
          <Box
            sx={{
              animation: 'spin 20s linear infinite',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            <OrbitIcon size={48} color={theme.palette.primary.main} />
          </Box>
        </Box>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800, 
            letterSpacing: 3,
            color: 'primary.main',
            lineHeight: 1,
            mb: 1,
            fontFamily: '"Inter", sans-serif'
          }}
        >
          ORBIT
        </Typography>
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: 8, 
            opacity: 0.6, 
            display: 'block',
            lineHeight: 1.4,
            textTransform: 'uppercase',
            fontWeight: 700,
            letterSpacing: 1,
            px: 1
          }}
        >
          Organizational Report of Business Insights and Trends
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Typography 
          variant="caption" 
          sx={{ 
            fontSize: 10, 
            textTransform: 'uppercase', 
            color: '#ffffff88', 
            letterSpacing: 1, 
            fontWeight: 700 
          }}
        >
          Analysis Period
        </Typography>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <DatePicker
              label={<Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>START DATE</Typography>}
              value={startDate}
              onChange={(newValue) => setStartDate(newValue || dayjs().startOf('month'))}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  sx: { 
                    '& .MuiOutlinedInput-root': { 
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 12,
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' }
                  }
                }
              }}
            />
            <DatePicker
              label={<Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: 700 }}>END DATE</Typography>}
              value={endDate}
              onChange={(newValue) => setEndDate(newValue || dayjs())}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  sx: { 
                    '& .MuiOutlinedInput-root': { 
                      bgcolor: 'rgba(255,255,255,0.1)',
                      color: '#fff',
                      fontSize: 12,
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' }
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' }
                  }
                }
              }}
            />
          </Box>
        </LocalizationProvider>
      </Box>

      {showManagementTabs && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: 10, 
              textTransform: 'uppercase', 
              color: '#ffffff88', 
              letterSpacing: 1, 
              fontWeight: 700 
            }}
          >
            Management
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            bgcolor: 'rgba(255,255,255,0.05)', 
            borderRadius: 1, 
            p: 0.5,
            border: '1px solid rgba(255,255,255,0.1)' 
          }}>
            <Box 
              onClick={() => setManagementTab('Operational')}
              sx={{ 
                flex: 1, 
                textAlign: 'center', 
                py: 0.8, 
                fontSize: 11, 
                fontWeight: 700, 
                cursor: 'pointer',
                borderRadius: 0.5,
                bgcolor: managementTab === 'Operational' ? 'primary.main' : 'transparent',
                color: managementTab === 'Operational' ? 'white' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.3s ease'
              }}
            >
              Operational
            </Box>
            <Box 
              onClick={() => setManagementTab('Administrative')}
              sx={{ 
                flex: 1, 
                textAlign: 'center', 
                py: 0.8, 
                fontSize: 11, 
                fontWeight: 700, 
                cursor: 'pointer',
                borderRadius: 0.5,
                bgcolor: managementTab === 'Administrative' ? 'primary.main' : 'transparent',
                color: managementTab === 'Administrative' ? 'white' : 'rgba(255,255,255,0.6)',
                transition: 'all 0.3s ease'
              }}
            >
              Administrative
            </Box>
          </Box>
        </Box>
      )}

      {isLeader && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography 
            variant="caption" 
            sx={{ 
              fontSize: 10, 
              textTransform: 'uppercase', 
              color: '#ffffff88', 
              letterSpacing: 1, 
              fontWeight: 700 
            }}
          >
            Team Member
          </Typography>
          <FormControl fullWidth size="small">
            <Select
              defaultValue=""
              displayEmpty
              onChange={(e) => {
                const memberRfc = e.target.value as string;
                if (memberRfc) {
                  setSelectedMember(MOCK_USERS[memberRfc]);
                }
              }}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 13,
                height: 40,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' }
              }}
            >
              <MenuItem value=""><em>View All</em></MenuItem>
              {user.team?.map((rfc) => (
                <MenuItem key={rfc} value={rfc}>
                  {MOCK_USERS[rfc]?.name || rfc}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      <Box sx={{ mt: 'auto', p: 1, pt: 3, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Box sx={{ mt: 0, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
            <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.6 }}>MODE</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Sun size={12} opacity={mode === 'light' ? 1 : 0.3} />
              <Switch
                checked={mode === 'dark'}
                onChange={toggleTheme}
                color="secondary"
                size="small"
                sx={{
                  scale: '0.7',
                  '& .MuiSwitch-switchBase.Mui-checked': { color: 'primary.main' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'primary.main' },
                }}
              />
              <Moon size={12} opacity={mode === 'dark' ? 1 : 0.3} />
            </Box>
          </Box>

          <ListItemButton 
            onClick={logout} 
            sx={{ 
              borderRadius: 1, 
              color: 'rgba(255,255,255,0.6)', 
              py: 1, 
              mt: 1, 
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.05)',
              '&:hover': {
                color: '#fff',
                bgcolor: 'rgba(255,0,0,0.1)',
                borderColor: 'rgba(255,0,0,0.2)',
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: 28, color: 'inherit' }}>
              <LogOut size={16} />
            </ListItemIcon>
            <ListItemText primary="Sign Out" slotProps={{ primary: { sx: { fontSize: 11, fontWeight: 700, letterSpacing: 1 } } }} />
          </ListItemButton>
        </Box>
      </Box>
    </Box>
  );
};

export default Sidebar;
