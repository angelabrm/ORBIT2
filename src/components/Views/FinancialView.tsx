
import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  useTheme 
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LabelList
} from 'recharts';
import { TrendingUp, DollarSign, PieChart } from 'lucide-react';

const FinancialView: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const data = [
    { department: 'CAC', income: 1050000, cost: 820000, profitability: 21.9 },
    { department: 'Fleet', income: 1280000, cost: 910000, profitability: 28.9 },
    { department: 'Premium', income: 1550000, cost: 1050000, profitability: 32.3 },
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 1.5, border: '1px solid rgba(11, 160, 175, 0.2)', bgcolor: isDark ? '#1a1a1a' : '#fff' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, mb: 1, display: 'block', color: 'primary.main' }}>
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>{entry.name}:</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800 }}>
                {entry.name === 'Profitability' ? `${entry.value}%` : formatCurrency(entry.value)}
              </Typography>
            </Box>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: 'primary.main', mb: 1 }}>
          FINANCIAL PERFORMANCE
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.6 }}>
          Global profitability and cost analysis across all operational departments.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Main Chart: Profitability */}
        <Grid size={12}>
          <Paper sx={{ p: 3, borderRadius: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(185, 224, 77, 0.15)', color: '#b9e04d' }}>
                <TrendingUp size={24} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 16 }}>
                Profitability by Department (%)
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                  <XAxis 
                    dataKey="department" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: isDark ? '#fff' : '#001e60', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: isDark ? '#fff' : '#001e60', fontSize: 11, opacity: 0.5 }}
                    unit="%"
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(11, 160, 175, 0.05)' }} />
                  <Bar dataKey="profitability" name="Profitability" radius={[4, 4, 0, 0]} barSize={60}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#b9e04d' : index === 1 ? '#0ba0af' : '#001e60'} />
                    ))}
                    <LabelList 
                      dataKey="profitability" 
                      position="top" 
                      formatter={(val: number) => `${val}%`}
                      style={{ fill: isDark ? '#fff' : '#001e60', fontSize: 12, fontWeight: 800 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Secondary Chart: Income */}
        <Grid size={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: 350, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(11, 160, 175, 0.15)', color: '#0ba0af' }}>
                <DollarSign size={24} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 16 }}>
                Income by Department
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                  <XAxis 
                    dataKey="department" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: isDark ? '#fff' : '#001e60', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(11, 160, 175, 0.05)' }} />
                  <Bar dataKey="income" name="Income" fill="#0ba0af" radius={[4, 4, 0, 0]} barSize={40}>
                    <LabelList 
                      dataKey="income" 
                      position="top" 
                      formatter={(val: number) => `$${(val / 1000000).toFixed(1)}M`}
                      style={{ fill: isDark ? '#fff' : '#001e60', fontSize: 11, fontWeight: 800 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Secondary Chart: Cost */}
        <Grid size={6}>
          <Paper sx={{ p: 3, borderRadius: 2, height: 350, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
              <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(234, 87, 19, 0.15)', color: '#ea5713' }}>
                <PieChart size={24} />
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 16 }}>
                Cost by Department
              </Typography>
            </Box>
            
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                  <XAxis 
                    dataKey="department" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: isDark ? '#fff' : '#001e60', fontSize: 12, fontWeight: 700 }}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(11, 160, 175, 0.05)' }} />
                  <Bar dataKey="cost" name="Cost" fill="#ea5713" radius={[4, 4, 0, 0]} barSize={40}>
                    <LabelList 
                      dataKey="cost" 
                      position="top" 
                      formatter={(val: number) => `$${(val / 1000000).toFixed(1)}M`}
                      style={{ fill: isDark ? '#fff' : '#001e60', fontSize: 11, fontWeight: 800 }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default FinancialView;
