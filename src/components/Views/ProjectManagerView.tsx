
import React from 'react';
import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import { 
  Briefcase, 
  Activity, 
  CheckCircle2, 
  Award,
  Layers,
  Target
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { METRICS_DATA, getFilteredMetrics } from '../../data/mockData';

const formatValue = (val: any) => {
  if (typeof val !== 'number') return val;
  return Number(val.toFixed(1));
};

const ProjectManagerView: React.FC = () => {
  const { user, startDate, endDate } = useAuth();
  const theme = useTheme();
  
  if (!user) return null;
  const metrics = getFilteredMetrics(user.rfc, startDate, endDate);

  const campaignTrend = [
    { month: 'Jan', active: 2, closed: 1 },
    { month: 'Feb', active: 3, closed: 2 },
    { month: 'Mar', active: 4, closed: 3 },
    { month: 'Apr', active: metrics.activeCampaigns, closed: metrics.closedCampaigns },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(185, 224, 77, 0.2)', pb: 1, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 300, fontSize: 18 }}>
          Campaigns Dashboard - <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>{user.serviceDesk}</Box>
        </Typography>
        <Typography variant="caption" sx={{ fontSize: 11, color: theme.palette.primary.main }}>
          Last updated: {new Date().toLocaleTimeString()}
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={3}>
          <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center' }}>
            <Layers size={32} color={theme.palette.primary.main} style={{ marginBottom: 12 }} />
            <Typography variant="h4" color="secondary.main">{formatValue(metrics.assignedCampaigns)}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.6, textTransform: 'uppercase', display: 'block' }}>ASSIGNED CAMPAIGNS</Typography>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center' }}>
            <Activity size={32} color={theme.palette.secondary.main} style={{ marginBottom: 12 }} />
            <Typography variant="h4" color="secondary.main">{formatValue(metrics.activeCampaigns)}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.6, textTransform: 'uppercase', display: 'block' }}>ACTIVE CAMPAIGNS</Typography>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center' }}>
            <CheckCircle2 size={32} color={theme.palette.primary.main} style={{ marginBottom: 12 }} />
            <Typography variant="h4" color="secondary.main">{formatValue(metrics.closedCampaigns)}</Typography>
            <Typography variant="caption" sx={{ opacity: 0.6, textTransform: 'uppercase', display: 'block' }}>CLOSED CAMPAIGNS</Typography>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center' }}>
            <Award size={32} color={theme.palette.primary.main} style={{ marginBottom: 12 }} />
            <Typography variant="h4" color="secondary.main">{formatValue(metrics.qa)}%</Typography>
            <Typography variant="caption" sx={{ opacity: 0.6, textTransform: 'uppercase', display: 'block' }}>QA PMO SCORE</Typography>
          </Paper>
        </Grid>

        <Grid size={12}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, mb: 3, display: 'block' }}>
              Campaign Life Cycle Trend
            </Typography>
            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={campaignTrend}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} minTickGap={20} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 8, 20, 0.95)' : '#fff',
                      border: `1px solid ${theme.palette.primary.main}33`,
                      borderRadius: 4,
                      fontSize: 18,
                      fontWeight: 600,
                      zIndex: 100
                    }}
                    itemStyle={{ fontSize: 16 }}
                    labelStyle={{ fontSize: 16, marginBottom: 4, fontWeight: 700 }}
                    formatter={(val: any) => typeof val === 'number' ? Number(val.toFixed(1)) : val}
                  />
                  <Area type="monotone" dataKey="active" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorActive)" />
                  <Area type="monotone" dataKey="closed" stroke={theme.palette.secondary.main} fill={theme.palette.secondary.main} fillOpacity={0.1} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        <Grid size={6}>
          <Paper elevation={0} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${theme.palette.primary.main}1A`, color: theme.palette.primary.main }}>
              <Target size={24} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Strategic Goals</Typography>
              <Typography variant="caption" color="text.secondary">85% of goals achieved in the current quarter</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={6}>
          <Paper elevation={0} sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${theme.palette.secondary.main}1A`, color: theme.palette.secondary.main }}>
              <Briefcase size={24} />
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Resource Utilization</Typography>
              <Typography variant="caption" color="text.secondary">Optimized workload across all active campaigns</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProjectManagerView;
