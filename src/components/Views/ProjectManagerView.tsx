
import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper, 
  useTheme, 
  FormControl, 
  Select, 
  MenuItem, 
  Button,
  Menu,
  Stack
} from '@mui/material';
import { 
  Activity, 
  CheckCircle2, 
  Award,
  Layers,
  BarChart as BarChartIcon,
  Calendar as CalendarIcon
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  LabelList
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { METRICS_DATA, getFilteredMetrics, MOCK_USERS, UserMetrics } from '../../data/mockData';
import { fetchOpenedCases } from '../../services/apiService';
import dayjs from 'dayjs';

const formatValue = (val: any) => {
  if (typeof val !== 'number') return val;
  return Number(val.toFixed(1));
};

const ProjectManagerView: React.FC<{ member?: any }> = ({ member }) => {
  const { user: authUser, startDate, endDate, setSelectedMember } = useAuth();
  const theme = useTheme();
  const user = member || authUser;
  
  const [kpi, setKpi] = useState<'performance' | 'productivity'>('performance');

  const [dbCases, setDbCases] = useState<any[]>([]);

  React.useEffect(() => {
    const loadData = async () => {
      // Fetch all cases for the date range
      const cases = await fetchOpenedCases(undefined, startDate, endDate);
      setDbCases(cases);
    };
    loadData();
  }, [startDate, endDate]);

  const getAggregatedMetrics = (memberRfc: string) => {
    const targetUser = MOCK_USERS[memberRfc];
    const isManagerAggregation = targetUser?.role === 'Manager' || targetUser?.role === 'Executive';
    
    let s: UserMetrics;
    
    if (isManagerAggregation) {
      // Sum everything for the manager's view
      const relevantRfcs = Object.values(MOCK_USERS)
        .filter(u => u.role === "Agent" || u.role === "Leader")
        .map(u => u.rfc);
        
      // Initialize with zeros or use first user's structure
      s = { ...(getFilteredMetrics(relevantRfcs[0], startDate, endDate) as UserMetrics) };
      // Reset numeric fields to zero before summing
      (Object.keys(s) as Array<keyof UserMetrics>).forEach(key => {
        if (typeof s[key] === 'number') (s as any)[key] = 0;
      });

      relevantRfcs.forEach(rfc => {
        const memberStats = getFilteredMetrics(rfc, startDate, endDate) as UserMetrics;
        s.closedCases += memberStats.closedCases;
        s.qa += memberStats.qa;
        s.nsatInfo += memberStats.nsatInfo;
        s.nsatClaims += memberStats.nsatClaims;
        s.slaCompliance += memberStats.slaCompliance;
        s.callsPerHour += memberStats.callsPerHour;
        s.closedCasesPerHour += memberStats.closedCasesPerHour;
        s.fcr += memberStats.fcr;
      });

      // Average the percentages/rates
      s.qa /= relevantRfcs.length;
      s.nsatInfo /= relevantRfcs.length;
      s.nsatClaims /= relevantRfcs.length;
      s.slaCompliance /= relevantRfcs.length;
      s.callsPerHour /= relevantRfcs.length;
      s.closedCasesPerHour /= relevantRfcs.length;
      s.fcr /= relevantRfcs.length;

      // Special handling for Opened Cases from DB
      s.openedCases = dbCases.filter(c => relevantRfcs.includes(c.case_owner)).length;
    } else {
      s = { ...(getFilteredMetrics(memberRfc, startDate, endDate) as UserMetrics) };
      s.openedCases = dbCases.filter(c => c.case_owner === memberRfc).length;
    }

    // Recalculate closed cases rate
    const opened = s.openedCases || 1;
    s.closedCasesRate = (s.closedCases / opened) * 100;
    
    return s;
  };

  if (!user) return null;

  const metrics = getAggregatedMetrics(user.rfc);

  const departments = ['CAC', 'Fleet', 'Premium'];
  
  const departmentStats = React.useMemo(() => {
    return departments.map(dept => {
      const members = Object.values(MOCK_USERS).filter(u => u.serviceDesk === dept);
      if (members.length === 0) return { name: dept, value: 0 };
      
      const sum = members.reduce((acc, member) => {
        const s = getAggregatedMetrics(member.rfc);
        
        if (kpi === 'productivity') {
          return acc + (s.productivity || 0);
        }

        // Performance formula
        const prod = ((s.closedCasesPerHour / 1) * 100 * 0.25) + 
                     ((s.callsPerHour / 6) * 100 * 0.25) + 
                     (s.fcr * 0.25) + 
                     (s.closedCasesRate * 0.25);
        const perf = (s.qa * 0.25) + 
                     (s.nsatInfo * 0.125) + 
                     (s.nsatClaims * 0.125) + 
                     (prod * 0.25) + 
                     (s.slaCompliance * 0.25);
        return acc + perf;
      }, 0);
      
      return {
        name: dept,
        value: formatValue(sum / members.length)
      };
    });
  }, [startDate, endDate, kpi]);

  const generalStats = React.useMemo(() => {
    const results = { performance: 0, productivity: 0 };
    
    departments.forEach(dept => {
      const members = Object.values(MOCK_USERS).filter(u => u.serviceDesk === dept);
      if (members.length === 0) return;
      
      const deptSums = members.reduce((acc, member) => {
        const s = getAggregatedMetrics(member.rfc);
        
        // Performance
        const prod = ((s.closedCasesPerHour / 1) * 100 * 0.25) + 
                     ((s.callsPerHour / 6) * 100 * 0.25) + 
                     (s.fcr * 0.25) + 
                     (s.closedCasesRate * 0.25);
        const perf = (s.qa * 0.25) + 
                     (s.nsatInfo * 0.125) + 
                     (s.nsatClaims * 0.125) + 
                     (prod * 0.25) + 
                     (s.slaCompliance * 0.25);
        
        return {
          performance: acc.performance + perf,
          productivity: acc.productivity + (s.productivity || 0)
        };
      }, { performance: 0, productivity: 0 });

      results.performance += (deptSums.performance / members.length);
      results.productivity += (deptSums.productivity / members.length);
    });

    return {
      performance: formatValue(results.performance / departments.length),
      productivity: formatValue(results.productivity / departments.length)
    };
  }, [startDate, endDate]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(185, 224, 77, 0.2)', pb: 1, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 300, fontSize: 18 }}>
          Campaigns Dashboard - <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>{user.serviceDesk}</Box>
        </Typography>
      </Box>

      {/* CHARTS AND INDICATORS */}
      <Grid container spacing={2.5}>
        <Grid size={6}>
          <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center' }}>
            <Award size={32} color={theme.palette.primary.main} style={{ marginBottom: 12 }} />
            <Typography variant="h4" color="secondary.main">{generalStats.performance}%</Typography>
            <Typography variant="caption" sx={{ opacity: 0.6, textTransform: 'uppercase', display: 'block' }}>GENERAL PERFORMANCE</Typography>
          </Paper>
        </Grid>
        <Grid size={6}>
          <Paper elevation={0} sx={{ p: 2.5, textAlign: 'center' }}>
            <Activity size={32} color={theme.palette.secondary.main} style={{ marginBottom: 12 }} />
            <Typography variant="h4" color="secondary.main">{generalStats.productivity}%</Typography>
            <Typography variant="caption" sx={{ opacity: 0.6, textTransform: 'uppercase', display: 'block' }}>GENERAL PRODUCTIVITY</Typography>
          </Paper>
        </Grid>

        <Grid size={12}>
          <Paper elevation={0} sx={{ p: 3, border: theme.palette.mode === 'dark' ? '1px solid rgba(11, 160, 175, 0.2)' : '1px solid rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
              <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, display: 'block' }}>
                Average {kpi.charAt(0).toUpperCase() + kpi.slice(1)} by Department
              </Typography>

              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5, fontSize: 10, letterSpacing: 1 }}>KPI_SELECT</Typography>
                  <Select
                    value={kpi}
                    onChange={(e) => setKpi(e.target.value as any)}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      height: 36, 
                      fontSize: 11, 
                      fontWeight: 800,
                      minWidth: 140,
                      color: 'primary.main',
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(11, 160, 175, 0.05)' : 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(11, 160, 175, 0.3)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main }
                    }}
                  >
                    <MenuItem value="performance" sx={{ fontSize: 12, fontWeight: 700 }}>PERFORMANCE</MenuItem>
                    <MenuItem value="productivity" sx={{ fontSize: 12, fontWeight: 700 }}>PRODUCTIVITY</MenuItem>
                  </Select>
                </Box>
              </Stack>
            </Box>

            <Box sx={{ height: 350 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentStats} margin={{ top: 30, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fontWeight: 700, fill: theme.palette.text.secondary }} 
                    axisLine={{ stroke: theme.palette.divider }}
                    tickLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: theme.palette.text.secondary }} 
                    domain={[0, 100]} 
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 8, 20, 0.95)' : '#fff',
                      border: `1px solid ${theme.palette.primary.main}33`,
                      borderRadius: 4,
                      fontSize: 14,
                      fontWeight: 600,
                      zIndex: 100,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                    }}
                    cursor={{ fill: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)' }}
                    formatter={(val: any) => [`${val}%`, `Average ${kpi}`]}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[4, 4, 0, 0]} 
                    barSize={80}
                  >
                    <LabelList 
                      dataKey="value" 
                      position="top" 
                      style={{ fill: theme.palette.text.primary, fontSize: 14, fontWeight: 700 }}
                      formatter={(val: any) => `${val}%`}
                    />
                    {departmentStats.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index % 2 === 0 ? theme.palette.primary.main : theme.palette.secondary.main} 
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          const leaderMap: Record<string, string> = {
                            'CAC': 'RAMI860812VY4',
                            'Fleet': 'RODR830214MNB',
                            'Premium': 'SANC990301XTR'
                          };
                          const leaderRfc = leaderMap[entry.name];
                          if (leaderRfc) {
                            setSelectedMember(MOCK_USERS[leaderRfc]);
                          }
                        }}
                      />
                    ))}
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

export default ProjectManagerView;
