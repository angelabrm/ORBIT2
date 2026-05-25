
import React, { useState } from 'react';
import { Box, useTheme, Typography, IconButton, Chip } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import AgentView from './Views/AgentView';
import ProjectManagerView from './Views/ProjectManagerView';
import FinancialView from './Views/FinancialView';
import PMView from './Views/PMView';
import PepsicoManagerView from './Views/PepsicoManagerView';
import { useAuth } from '../context/AuthContext';
import { Role } from '../data/mockData';

interface DashboardProps {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ mode, toggleTheme }) => {
  const theme = useTheme();
  const { user, selectedMember, setSelectedMember, managementTab } = useAuth();

  const renderView = (role: Role, member?: any) => {
    // Main dashboard view by role
    switch (role) {
      case 'Manager':
      case 'Executive': {
        const effectiveUser = member || user;
        if (role === 'Manager' && effectiveUser?.client === 'Pepsico') {
          return <PepsicoManagerView />;
        }
        if (managementTab === 'Administrative') {
          return <AgentView member={member} />;
        }
        if (managementTab === 'Financial') {
          return <FinancialView />;
        }
        return <ProjectManagerView member={member} />;
      }
      case 'Leader':
        return <AgentView member={member} />;
      case 'PM':
        return <PMView member={member} />;
      default:
        return <AgentView member={member} />;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      <Sidebar mode={mode} toggleTheme={toggleTheme} />
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.5s ease-in-out' }}>
        <Header />
        <Box sx={{ flex: 1, p: 3, overflow: 'hidden', bgcolor: 'background.default', transition: 'all 0.5s ease-in-out', display: 'flex', flexDirection: 'column' }}>
          {selectedMember ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Member View Banner */}
              <Box
                sx={{
                  flexShrink: 0,
                  mb: 2,
                  p: 2,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(11, 160, 175, 0.1)' : 'rgba(11, 160, 175, 0.05)',
                  border: `1px solid ${theme.palette.primary.main}33`,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  animation: 'slide-down 0.4s ease-out'
                }}
              >
                <IconButton
                  onClick={() => setSelectedMember(null)}
                  sx={{
                    color: 'primary.main',
                    bgcolor: 'rgba(11, 160, 175, 0.1)',
                    '&:hover': { bgcolor: 'rgba(11, 160, 175, 0.2)' }
                  }}
                >
                  <ArrowLeft size={20} />
                </IconButton>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
                      You're seeing {selectedMember.role === 'Leader' ? `Leader ${selectedMember.serviceDesk}` : selectedMember.name} Dashboard
                    </Typography>
                    {selectedMember.serviceDesk === 'CAC' && selectedMember.subNivel && selectedMember.subNivel !== 'NA' && (
                      <Chip
                        label={selectedMember.subNivel}
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: 9,
                          fontWeight: 800,
                          letterSpacing: 0.8,
                          bgcolor: selectedMember.subNivel === 'Calls' ? 'rgba(11,160,175,0.15)' : 'rgba(176,24,217,0.15)',
                          color: selectedMember.subNivel === 'Calls' ? 'primary.main' : '#B018D9',
                          border: `1px solid ${selectedMember.subNivel === 'Calls' ? 'rgba(11,160,175,0.4)' : 'rgba(176,24,217,0.4)'}`,
                          '& .MuiChip-label': { px: 0.8 },
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>
                    Direct Support: {selectedMember.rfc} | {selectedMember.serviceDesk}
                    {selectedMember.serviceDesk === 'CAC' && selectedMember.subNivel && selectedMember.subNivel !== 'NA'
                      ? ` | ${selectedMember.subNivel}`
                      : ''}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {renderView(selectedMember.role, selectedMember)}
              </Box>
            </Box>
          ) : (
            <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', height: '100%' }}>
              {user && renderView(user.role)}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
