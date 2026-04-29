
import React from 'react';
import { Box, Typography, Grid, Paper, useTheme } from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Legend
} from 'recharts';
import { Globe, TrendingUp, DollarSign, Zap } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';

const formatValue = (val: any) => {
  if (typeof val !== 'number') return val;
  return Number(val.toFixed(1));
};

const ExecutiveView: React.FC = () => {
  const theme = useTheme();
  const { startDate, endDate } = useAuth();
  
  // Nudge factor based on dates
  const seed = startDate.unix() + endDate.unix();
  const nudge = (val: number) => {
    const v = Math.sin(seed + val) * 0.1;
    return val + (val * v);
  };

  const clientData = [
    { name: 'Stellantis', CAC: nudge(400), Fleet: nudge(300), Premium: nudge(200) },
    { name: 'Pepsico', CAC: nudge(800) },
  ];

  const revenueTrend = [
    { month: 'Jan', revenue: nudge(4000) },
    { month: 'Feb', revenue: nudge(4500) },
    { month: 'Mar', revenue: nudge(5100) },
    { month: 'Apr', revenue: nudge(5900) },
    { month: 'May', revenue: nudge(6800) },
    { month: 'Jun', revenue: nudge(7500) },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(185, 224, 77, 0.2)', pb: 1, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 300, fontSize: 18 }}>
          Executive Indicators - <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>Alta MX</Box>
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        <Grid size={3}>
          <Paper elevation={0} sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${theme.palette.primary.main}1A`, color: theme.palette.primary.main }}>
              <Globe size={20} />
            </Box>
            <Box>
              <Typography variant="h5" color="secondary.main">2</Typography>
              <Typography variant="caption" sx={{ opacity: 0.6, fontSize: 10 }}>CORE CLIENTS</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper elevation={0} sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${theme.palette.secondary.main}1A`, color: theme.palette.secondary.main }}>
              <Zap size={20} />
            </Box>
            <Box>
              <Typography variant="h5" color="secondary.main">3</Typography>
              <Typography variant="caption" sx={{ opacity: 0.6, fontSize: 10 }}>SERVICE DESKS</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper elevation={0} sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: '#4caf501A', color: '#4caf50' }}>
              <TrendingUp size={20} />
            </Box>
            <Box>
              <Typography variant="h5" color="secondary.main">+12%</Typography>
              <Typography variant="caption" sx={{ opacity: 0.6, fontSize: 10 }}>GROWTH Q o Q</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={3}>
          <Paper elevation={0} sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2.5 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${theme.palette.secondary.main}1A`, color: theme.palette.secondary.main }}>
              <DollarSign size={20} />
            </Box>
            <Box>
              <Typography variant="h5" color="primary.main">$1.2M</Typography>
              <Typography variant="caption" sx={{ opacity: 0.6, fontSize: 10 }}>REV PROJECTION</Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid size={7}>
          <Paper elevation={0} sx={{ p: 3, height: 400 }}>
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, mb: 3, display: 'block' }}>
              Service Desk Distribution by Client
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={clientData} layout="vertical" margin={{ left: 60, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={theme.palette.divider} />
                <XAxis type="number" tick={{ fontSize: 10, opacity: 0.5 }} stroke="rgba(11, 160, 175, 0.2)" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fontWeight: 700 }} stroke="rgba(11, 160, 175, 0.2)" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 8, 20, 0.9)', 
                    border: '1px solid #0ba0af33',
                    borderRadius: 4,
                    fontSize: 18,
                    fontWeight: 600
                  }} 
                  itemStyle={{ fontSize: 16 }}
                  labelStyle={{ fontSize: 16, marginBottom: 4, fontWeight: 700 }}
                  formatter={formatValue}
                />
                <Legend iconType="rect" formatter={(value) => <span style={{ fontSize: 10, opacity: 0.6 }}>{value}</span>} />
                <Bar dataKey="CAC" fill={theme.palette.primary.main} stackId="a" barSize={12} radius={[0, 2, 2, 0]} />
                <Bar dataKey="Fleet" fill={`${theme.palette.primary.main}44`} stackId="a" />
                <Bar dataKey="Premium" fill={theme.palette.secondary.main} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={5}>
          <Paper elevation={0} sx={{ p: 3, height: 400 }}>
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, mb: 3, display: 'block' }}>
              Financial Performance Index
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <LineChart data={revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="rgba(11, 160, 175, 0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, opacity: 0.5 }} stroke="rgba(11, 160, 175, 0.2)" minTickGap={10} />
                <YAxis tick={{ fontSize: 10, opacity: 0.5 }} stroke="rgba(11, 160, 175, 0.2)" domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(0, 8, 20, 0.9)', 
                    border: '1px solid #0ba0af33',
                    borderRadius: 4,
                    fontSize: 18,
                    fontWeight: 600
                  }} 
                  itemStyle={{ fontSize: 16 }}
                  labelStyle={{ fontSize: 16, marginBottom: 4, fontWeight: 700 }}
                  formatter={formatValue}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke={theme.palette.primary.main} 
                  strokeWidth={2} 
                  dot={{ r: 3, fill: theme.palette.primary.main, strokeWidth: 0 }} 
                  activeDot={{ r: 5, fill: '#fff', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ExecutiveView;
