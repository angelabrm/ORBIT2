
import React, { useState } from 'react';
import { Box, useTheme, Typography, IconButton } from '@mui/material';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import AgentView from './Views/AgentView';
import LeaderView from './Views/LeaderView';
import ProjectManagerView from './Views/ProjectManagerView';
import ExecutiveView from './Views/ExecutiveView';
import { useAuth } from '../context/AuthContext';
import { Role } from '../data/mockData';

interface DashboardProps {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ mode, toggleTheme }) => {
  const theme = useTheme();
  const { user, selectedMember, setSelectedMember } = useAuth();

  const renderView = (role: Role, isMemberView: boolean = false) => {
    switch (role) {
      case 'Agent':
      case 'Staff':
      case 'Leader':
      case 'Manager':
      case 'Project Manager':
      case 'Executive':
        return <AgentView member={isMemberView ? selectedMember : null} />;
      default:
        return <AgentView />;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', width: '100%', overflow: 'hidden' }}>
      <Sidebar mode={mode} toggleTheme={toggleTheme} />
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'all 0.5s ease-in-out' }}>
        <Header />
        <Box sx={{ flex: 1, p: 3, overflowY: 'auto', bgcolor: 'background.default', transition: 'all 0.5s ease-in-out' }}>
          {selectedMember ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Member View Banner */}
              <Box 
                sx={{ 
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
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: 1 }}>
                    You're seeing {selectedMember.name} Dashboard
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.6 }}>
                    Direct Support: {selectedMember.rfc} | {selectedMember.serviceDesk}
                  </Typography>
                </Box>
              </Box>
              
              {renderView(selectedMember.role, true)}
            </Box>
          ) : (
            user && renderView(user.role)
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
