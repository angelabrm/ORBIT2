
import React from 'react';
import { Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, useTheme, Button } from '@mui/material';
import { Users, TrendingUp, Award, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { MOCK_USERS, METRICS_DATA, getFilteredMetrics } from '../../data/mockData';

const formatValue = (val: any) => {
  if (typeof val !== 'number') return val;
  return Number(val.toFixed(1));
};

const LeaderView: React.FC = () => {
  const { user, setSelectedMember, startDate, endDate } = useAuth();
  const theme = useTheme();

  if (!user || !user.team) return null;

  const teamMembers = user.team.map(rfc => MOCK_USERS[rfc]);
  
  const teamStats = teamMembers.map(member => {
    const m = getFilteredMetrics(member.rfc, startDate, endDate);
    return {
      name: member.name.split(' ')[0],
      rfc: member.rfc,
      qa: formatValue(m.qa || 0),
      productivity: formatValue(m.productivity || 0),
      cases: formatValue(m.closedCases || 0),
      adherence: formatValue(m.adherence || 0)
    };
  });

  const avgQa = teamStats.reduce((acc, curr) => acc + curr.qa, 0) / teamStats.length;
  const avgProductivity = teamStats.reduce((acc, curr) => acc + curr.productivity, 0) / teamStats.length;
  const avgAdherence = teamStats.reduce((acc, curr) => acc + curr.adherence, 0) / teamStats.length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(185, 224, 77, 0.2)', pb: 1, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 300, fontSize: 18 }}>
          Leadership Dashboard - <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>{user.serviceDesk}</Box>
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {/* Team Summary Cards */}
        <Grid size={3}>
          <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center', transition: 'all 0.3s', '&:hover': { transform: 'scale(1.02)' } }}>
            <Users size={32} color={theme.palette.primary.main} style={{ marginBottom: 12 }} />
            <Typography variant="h4">{teamMembers.length}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', display: 'block' }}>ACTIVE MEMBERS</Typography>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center', transition: 'all 0.3s', '&:hover': { transform: 'scale(1.02)' } }}>
            <Award size={32} color={theme.palette.primary.main} style={{ marginBottom: 12 }} />
            <Typography variant="h4">{formatValue(avgQa)}%</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', display: 'block' }}>AVERAGE QA</Typography>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center', transition: 'all 0.3s', '&:hover': { transform: 'scale(1.02)' } }}>
            <TrendingUp size={32} color={theme.palette.primary.main} style={{ marginBottom: 12 }} />
            <Typography variant="h4">{formatValue(avgProductivity)}%</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', display: 'block' }}>PRODUCTIVITY</Typography>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center', transition: 'all 0.3s', '&:hover': { transform: 'scale(1.02)' } }}>
            <Clock size={32} color={theme.palette.primary.main} style={{ marginBottom: 12 }} />
            <Typography variant="h4">{formatValue(avgAdherence)}%</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8, textTransform: 'uppercase', display: 'block' }}>ADHERENCE</Typography>
          </Paper>
        </Grid>

        <Grid size={12}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, mb: 3, display: 'block' }}>
              Agent Performance
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.primary.main}33`, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>[ AGENT_ID ]</TableCell>
                  <TableCell align="center" sx={{ color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.primary.main}33`, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>[ QA_INDEX ]</TableCell>
                  <TableCell align="center" sx={{ color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.primary.main}33`, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>[ UNIT_COUNT ]</TableCell>
                  <TableCell align="right" sx={{ color: theme.palette.primary.main, borderBottom: `1px solid ${theme.palette.primary.main}33`, fontSize: 10, fontWeight: 800, letterSpacing: 1 }}>[ ACT_EXEC ]</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {teamStats.map((row) => (
                  <TableRow 
                    key={row.rfc} 
                    sx={{ 
                      '& td': { borderBottom: '1px solid rgba(11, 160, 175, 0.05)' },
                      '&:hover': { bgcolor: 'rgba(11, 160, 175, 0.02)' } 
                    }}
                  >
                    <TableCell sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5 }}>
                      <Box component="span" sx={{ width: 4, height: 4, bgcolor: theme.palette.primary.main, borderRadius: '50%', boxShadow: theme.palette.mode === 'dark' ? '0 0 5px #0ba0af' : 'none' }} />
                      <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{row.name}</Typography>
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, fontFamily: theme.palette.mode === 'dark' ? '"JetBrains Mono", monospace' : 'inherit', color: 'primary.main' }}>{row.qa}%</TableCell>
                    <TableCell align="center" sx={{ opacity: 0.8, fontSize: 12 }}>{row.cases}</TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="outlined"
                        onClick={() => setSelectedMember(MOCK_USERS[row.rfc])}
                        sx={{ 
                          fontSize: 9, 
                          borderColor: 'rgba(11, 160, 175, 0.3)', 
                          color: 'primary.main',
                          borderRadius: 1,
                          height: 24,
                          '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(11, 160, 175, 0.1)' }
                        }}
                      >
                        ANALYZE
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default LeaderView;
