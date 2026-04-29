
import React from 'react';
import { Box, Typography, Grid, Paper, LinearProgress, useTheme, Divider } from '@mui/material';
import { 
  CheckCircle2, 
  Inbox, 
  Clock, 
  Smile, 
  AlertCircle, 
  Briefcase, 
  Calendar as CalendarIcon,
  TrendingUp,
  Award,
  Info,
  Layers,
  Activity,
  Trophy,
  DollarSign
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, Legend, LabelList } from 'recharts';
import { useAuth } from '../../context/AuthContext';
import { METRICS_DATA, User, UserMetrics, getFilteredMetrics, generateHistoricalData, MOCK_USERS } from '../../data/mockData';
import { fetchOpenedCases } from '../../services/apiService';
import { Tooltip as MuiTooltip, IconButton, Select, MenuItem, FormControl, InputLabel, Checkbox, ListItemText, ListSubheader, ToggleButton, ToggleButtonGroup, Button, Menu } from '@mui/material';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isBetween);

const formatValue = (val: any, isInteger: boolean = false) => {
  if (typeof val !== 'number') return val;
  return isInteger ? Math.round(val) : Number(val.toFixed(1));
};

interface IndicatorProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  formula: string;
  color?: string;
  description?: string;
  onClick?: () => void;
  isSelected?: boolean;
  largeFonts?: boolean;
  quartile?: string;
}

const ManagementIndicator: React.FC<IndicatorProps> = ({ title, value, icon, formula, color = 'primary.main', description, onClick, isSelected, largeFonts, quartile }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const qColor = quartile === 'Q1' ? '#b9e04d' : quartile === 'Q2' ? '#ffcc00' : quartile === 'Q3' ? '#ff9900' : '#ea5713';

  return (
    <Paper 
      elevation={0}
      onClick={onClick}
      sx={{ 
        p: 3, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: largeFonts ? 'center' : 'stretch',
        textAlign: largeFonts ? 'center' : 'left',
        position: 'relative',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        bgcolor: isSelected ? `${theme.palette.primary.main}1A` : (isDark ? 'transparent' : 'rgba(11, 160, 175, 0.05)'),
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : (isDark ? '1px solid rgba(11, 160, 175, 0.3)' : '1px solid rgba(0,0,0,0.05)'),
        boxShadow: isSelected ? `0 0 10px ${theme.palette.primary.main}22` : 'none',
        transition: 'all 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-1px)', bgcolor: isDark ? 'rgba(11, 160, 175, 0.1)' : 'rgba(11, 160, 175, 0.05)' } : {}
      }}
    >
      {quartile && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bgcolor: qColor, 
          py: 0.5, 
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          zIndex: 2
        }}>
          <Typography variant="caption" sx={{ color: '#000', fontWeight: 900, fontSize: 10, letterSpacing: 0.5 }}>
            YOU ARE POSITIONED IN PERFORMANCE QUARTILE {quartile}
          </Typography>
        </Box>
      )}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, mt: quartile ? 2 : 0 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}1A`, color: color, display: 'flex' }}>
          {icon}
        </Box>
        <MuiTooltip 
          title={
            <Box sx={{ p: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.5, color: '#fff' }}>HOW IS IT CALCULATED?</Typography>
              <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', display: 'block', mb: 1 }}>{formula}</Typography>
              {description && (
                <>
                  <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                  <Typography variant="caption" sx={{ opacity: 0.9, lineHeight: 1.4 }}>{description}</Typography>
                </>
              )}
            </Box>
          }
          arrow
          placement="top"
        >
          <IconButton size="small" sx={{ opacity: 0.5, '&:hover': { opacity: 1, color: 'primary.main' } }}>
            <Info size={14} />
          </IconButton>
        </MuiTooltip>
      </Box>

      <Typography 
        variant="h6" 
        sx={{ 
          opacity: 0.9, 
          fontWeight: 800, 
          letterSpacing: 2, 
          textTransform: 'uppercase', 
          mb: 1.5,
          color: theme.palette.primary.main,
          fontSize: largeFonts ? '1.4rem' : '1.2rem'
        }}
      >
        {title}
      </Typography>
      
      <Typography variant="h3" sx={{ 
        fontWeight: 900, 
        color: color,
        fontFamily: isDark ? '"JetBrains Mono", monospace' : 'inherit',
        textShadow: isDark ? `0 0 20px ${color}33` : 'none',
        fontSize: largeFonts ? '3.5rem' : '3rem'
      }}>
        {value}
      </Typography>
    </Paper>
  );
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 2.5, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 0.5,
        bgcolor: isDark ? 'transparent' : 'rgba(11, 160, 175, 0.05)',
        position: 'relative',
        overflow: 'hidden',
        // Cyber scan line
        '&::after': isDark ? {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          height: '100px',
          background: 'linear-gradient(to bottom, transparent, rgba(11, 160, 175, 0.2), transparent)',
          animation: 'scan 4s linear infinite',
          pointerEvents: 'none',
          zIndex: 1,
        } : {},
      }}
    >
      <Typography 
        variant="caption" 
        sx={{ 
          fontSize: 9, 
          fontWeight: 800,
          color: isDark ? 'primary.main' : 'secondary.main',
          textTransform: 'uppercase',
          letterSpacing: 2,
          opacity: 0.8
        }}
      >
        [ {title} ]
      </Typography>
      <Typography 
        variant="h4" 
        sx={{ 
          color: isDark ? '#fff' : 'secondary.main',
          fontFamily: isDark ? '"JetBrains Mono", monospace' : 'inherit',
          fontSize: '1.8rem',
          my: 1
        }}
      >
        {value}
      </Typography>
      <Box sx={{ mt: 'auto', display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box 
          sx={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            bgcolor: 'primary.main',
            boxShadow: isDark ? '0 0 8px #0ba0af' : 'none',
            animation: 'pulse-subtle 2s infinite'
          }} 
        />
        <Typography variant="caption" sx={{ fontSize: 8, opacity: 0.4, letterSpacing: 1.5, fontWeight: 600 }}>
          SYSTEM_NODE_0x{Math.floor(Math.random() * 1000).toString(16).toUpperCase()}
        </Typography>
      </Box>
    </Paper>
  );
};

const MiniCard: React.FC<{ 
  title: string; 
  value: string | number; 
  subtext: string; 
  color: string; 
  bgColor?: string;
  showIndicator?: boolean;
  largeFonts?: boolean;
}> = ({ title, value, subtext, color, bgColor, showIndicator, largeFonts }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Box sx={{ 
      flex: 1, 
      bgcolor: bgColor || (isDark ? 'rgba(0, 30, 96, 0.2)' : 'rgba(0,0,0,0.02)'), 
      borderLeft: `2px solid ${color}`, 
      p: 1.5, 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center',
      borderRadius: 0.5,
      border: isDark ? '1px solid rgba(11, 160, 175, 0.2)' : '1px solid rgba(0,0,0,0.05)',
      position: 'relative',
      backdropFilter: isDark ? 'blur(5px)' : 'none',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        {showIndicator && (
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
        )}
        <Typography 
          variant="caption" 
          sx={{ 
            color: color, 
            textTransform: 'uppercase', 
            fontSize: largeFonts ? 14 : 9, 
            fontWeight: 800, 
            letterSpacing: 1.5, 
            opacity: 0.7 
          }}
        >
          {title}
        </Typography>
      </Box>
      <Typography 
        variant="h5" 
        sx={{ 
          color: isDark ? '#fff' : 'secondary.main', 
          fontFamily: isDark ? '"JetBrains Mono", monospace' : 'inherit', 
          fontSize: largeFonts ? '1.8rem' : '1.2rem', 
          my: 0.5,
          fontWeight: 800
        }}
      >
        {value}
      </Typography>
      <Typography 
        variant="caption" 
        sx={{ 
          opacity: 0.4, 
          fontSize: largeFonts ? 13 : 9, 
          fontWeight: 500 
        }}
      >
        {subtext}
      </Typography>
    </Box>
  );
};

const AdherenceTooltip: React.FC<{ day: dayjs.Dayjs; rfc: string; isComplete: boolean }> = ({ day, rfc, isComplete }) => {
  const theme = useTheme();
  
  // Day range: 9:00 AM to 6:00 PM (540 minutes)
  const totalRange = 540;

  const minsToTime = (mins: number) => {
    const totalMins = mins + 9 * 60;
    const h = Math.floor(totalMins / 60);
    const m = Math.floor(totalMins % 60);
    const ampm = h >= 12 ? 'pm' : 'am';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Scheduled Blocks (relative to 9:00 AM)
  const scheduled = [
    { start: 0, end: 240, type: 'work', label: 'Shift Start' }, // 9:00 - 1:00
    { start: 240, end: 300, type: 'lunch', label: 'Lunch' },    // 1:00 - 2:00
    { start: 300, end: 540, type: 'work', label: 'Shift End' },   // 2:00 - 6:00
  ];
  
  // Add breaks to scheduled for visual representation
  const scheduledWithBreaks = [
    { start: 0, end: 90, type: 'work', label: 'Shift Start 9:00 am' },
    { start: 90, end: 105, type: 'break', label: 'Break' },
    { start: 105, end: 240, type: 'work', label: '' },
    { start: 240, end: 300, type: 'lunch', label: 'Lunch 1:00-2:00 pm' },
    { start: 300, end: 420, type: 'work', label: '' },
    { start: 420, end: 435, type: 'break', label: 'Break' },
    { start: 435, end: 540, type: 'work', label: 'Shift End 6:00 pm' },
  ];

  // Simulating Logged Blocks
  const seed = day.unix() + rfc.length;
  const rand = (s: number) => {
    const x = Math.sin(seed + s) * 10000;
    return x - Math.floor(x);
  };

  const offset = Math.floor(rand(1) * 12) - 3; // Shift Start Variation
  const endVar = Math.floor(rand(11) * 15) - 10;
  const break1At = 90 + Math.floor(rand(3) * 20) - 10;
  const lunchAt = 240 + Math.floor(rand(2) * 15) - 5;
  const break2At = 420 + Math.floor(rand(4) * 20) - 10;

  const gap = isComplete ? 0 : Math.floor(rand(5) * 35) + 15;

  const loggedBlocks = [
    { start: offset, end: break1At, type: 'work', label: `In ${minsToTime(offset)}` },
    { start: break1At, end: break1At + 18, type: 'break', label: 'Brk' },
    { start: break1At + 18, end: lunchAt, type: 'work', label: '' },
    { start: lunchAt, end: lunchAt + 65, type: 'lunch', label: `Lch ${minsToTime(lunchAt)}` },
    { start: lunchAt + 65, end: break2At, type: 'work', label: '' },
    { start: break2At, end: break2At + 20, type: 'break', label: 'Brk' },
    { start: break2At + 20, end: 540 + endVar - gap, type: 'work', label: `Out ${minsToTime(540 + endVar - gap)}` },
  ];

  const totalSchedMins = 480; // 9 hours - 1 hour lunch
  const totalLoggedMins = loggedBlocks.reduce((acc, b) => acc + Math.max(0, b.end - b.start), 0);
  const adherence = Math.min(100, (totalLoggedMins / totalSchedMins) * 100);

  const VerticalBlock = ({ start, end, type, label, isScheduled }: { start: number; end: number; type: string; label: string; isScheduled?: boolean }) => {
    const color = type === 'work' ? (isScheduled ? 'rgba(11, 160, 175, 0.4)' : '#0ba0af') : 
                  type === 'lunch' ? '#B018D9' : 
                  type === 'break' ? '#ffcc00' : '#666';
    
    const top = (Math.max(0, start) / totalRange) * 100;
    const height = (Math.min(totalRange, end - Math.max(0, start)) / totalRange) * 100;

    if (height <= 0) return null;

    return (
      <Box sx={{ 
        position: 'absolute', 
        top: `${top}%`, 
        width: '100%', 
        height: `${height}%`, 
        bgcolor: color,
        borderRadius: 0.5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 1,
        border: '1px solid rgba(255,255,255,0.2)',
        boxShadow: 'inset 0 0 10px rgba(0,0,0,0.2)'
      }}>
        {label && (
          <Typography variant="caption" sx={{ 
            fontSize: 9, 
            fontWeight: 800, 
            color: '#fff', 
            textAlign: 'center',
            lineHeight: 1.1,
            zIndex: 10,
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            userSelect: 'none'
          }}>
            {label}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <Paper sx={{ 
      p: 1.5, 
      width: '100%', 
      maxWidth: 340, 
      bgcolor: 'rgba(0,10,26,0.98)', 
      border: '1px solid rgba(11, 160, 175, 0.4)', 
      color: '#fff', 
      boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
      display: 'flex',
      flexDirection: 'column',
      pointerEvents: 'auto'
    }}>
      <Typography variant="subtitle2" sx={{ mb: 1, color: '#0ba0af', fontWeight: 900, textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase', fontSize: 9 }}>
         {day.format('MMM DD, YYYY')}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1.5, height: 220, position: 'relative', mb: 1.5 }}>
        {/* Time Labels */}
        <Box sx={{ width: 35, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', opacity: 0.6, py: 0.5 }}>
          <Typography sx={{ fontSize: 8, fontWeight: 800 }}>9 AM</Typography>
          <Typography sx={{ fontSize: 8, fontWeight: 800 }}>12 PM</Typography>
          <Typography sx={{ fontSize: 8, fontWeight: 800 }}>3 PM</Typography>
          <Typography sx={{ fontSize: 8, fontWeight: 800 }}>6 PM</Typography>
        </Box>

        {/* Scheduled Column */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="caption" sx={{ textAlign: 'center', mb: 1, fontWeight: 900, opacity: 0.6, fontSize: 8 }}>PROGRAM</Typography>
          <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.02)', position: 'relative', borderRadius: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
            {scheduledWithBreaks.map((b, i) => <VerticalBlock key={i} {...b} isScheduled />)}
          </Box>
        </Box>

        {/* Logged Column */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Typography variant="caption" sx={{ textAlign: 'center', mb: 1, fontWeight: 900, color: '#0ba0af', fontSize: 8 }}>LOG</Typography>
          <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.02)', position: 'relative', borderRadius: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
            {loggedBlocks.map((b, i) => <VerticalBlock key={i} {...b} />)}
          </Box>
        </Box>
      </Box>

      <Box sx={{ 
        bgcolor: 'rgba(11, 160, 175, 0.1)', 
        px: 1.5,
        py: 0.8, 
        borderRadius: 1, 
        border: '1px solid rgba(11, 160, 175, 0.2)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 800, fontSize: 10 }}>ADHERENCE:</Typography>
          <Typography variant="caption" sx={{ fontWeight: 900, color: adherence >= 90 ? '#b9e04d' : '#ffcc00', fontSize: 11 }}>
            {adherence.toFixed(1)}%
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="caption" sx={{ opacity: 0.6, fontWeight: 800, fontSize: 10 }}>DURATION:</Typography>
          <Typography variant="caption" sx={{ fontWeight: 900, fontSize: 11 }}>
            {Math.floor(totalLoggedMins / 60)}h {Math.floor(totalLoggedMins % 60)}m
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
};

interface AgentViewProps {
  member?: User | null;
}

const AgentView: React.FC<AgentViewProps> = ({ member }) => {
  const { user, managementTab, startDate, endDate } = useAuth();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  
  const currentUser = member || user;
  const isManagement = currentUser ? ["Leader", "Manager", "Executive"].includes(currentUser.role) : false;
  const isStandardAgent = currentUser ? ["CAC", "Fleet", "Premium"].includes(currentUser.serviceDesk) : false;
  
  // State for Trend Chart selections
  const [selectedIndicators, setSelectedIndicators] = React.useState<string[]>(['Performance']);
  const [hierarchy, setHierarchy] = React.useState<'day' | 'week' | 'month' | 'year'>('day');
  const [hierarchyAnchor, setHierarchyAnchor] = React.useState<null | HTMLElement>(null);
  const [activeAdminTab, setActiveAdminTab] = React.useState<'homeOffice' | 'attendance' | 'adherence' | null>(null);
  const [selectedTeamMember, setSelectedTeamMember] = React.useState<string | null>(null);
  const [adminViewType, setAdminViewType] = React.useState<'personal' | 'team'>(
    currentUser?.role === 'Executive' ? 'team' : 'personal'
  );
  const [dbOpenedCases, setDbOpenedCases] = React.useState<number | null>(null);

  const handleHierarchyClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setHierarchyAnchor(event.currentTarget);
  };

  const handleHierarchyClose = (val?: 'day' | 'week' | 'month' | 'year') => {
    if (val) setHierarchy(val);
    setHierarchyAnchor(null);
  };

  React.useEffect(() => {
    const loadDbData = async () => {
      if (!currentUser) return;
      
      let rfcsToFetch: string[] = [];
      if (currentUser.role === "Agent") {
        rfcsToFetch = [currentUser.rfc];
      } else if (currentUser.role === "Leader") {
        // Sum of all Agents in their department
        rfcsToFetch = Object.values(MOCK_USERS)
          .filter(u => u.role === "Agent" && u.serviceDesk === currentUser.serviceDesk)
          .map(u => u.rfc);
      } else if (currentUser.role === "Manager" || currentUser.role === "Executive") {
        // Sum of all Agents and Leaders in the complete team
        rfcsToFetch = Object.values(MOCK_USERS)
          .filter(u => u.role === "Agent" || u.role === "Leader")
          .map(u => u.rfc);
      }

      if (rfcsToFetch.length > 0) {
        const cases = await fetchOpenedCases(undefined, startDate, endDate);
        const filteredCases = cases.filter(c => rfcsToFetch.includes(c.case_owner));
        setDbOpenedCases(filteredCases.length);
      } else {
        setDbOpenedCases(null);
      }
    };
    loadDbData();
  }, [currentUser, startDate, endDate]);

  const stats = React.useMemo(() => {
    if (!currentUser) return null;
    
    let baseStats: UserMetrics;
    
    if (currentUser.role === 'Leader' || currentUser.role === 'Manager' || currentUser.role === 'Executive') {
      let rfcsToAggregate: string[] = [];
      if (currentUser.role === 'Leader') {
        rfcsToAggregate = Object.values(MOCK_USERS)
          .filter(u => u.role === "Agent" && u.serviceDesk === currentUser.serviceDesk)
          .map(u => u.rfc);
      } else {
        rfcsToAggregate = Object.values(MOCK_USERS)
          .filter(u => u.role === "Agent" || u.role === "Leader")
          .map(u => u.rfc);
      }
      
      if (rfcsToAggregate.length > 0) {
        baseStats = { ...(getFilteredMetrics(rfcsToAggregate[0], startDate, endDate) as UserMetrics) };
        // Reset numeric fields
        (Object.keys(baseStats) as Array<keyof UserMetrics>).forEach(key => {
          if (typeof baseStats[key] === 'number') (baseStats as any)[key] = 0;
        });

        rfcsToAggregate.forEach(rfc => {
          const s = getFilteredMetrics(rfc, startDate, endDate) as UserMetrics;
          baseStats.closedCases += s.closedCases;
          baseStats.qa += s.qa;
          baseStats.nsatInfo += s.nsatInfo;
          baseStats.nsatClaims += s.nsatClaims;
          baseStats.slaCompliance += s.slaCompliance;
          baseStats.callsPerHour += s.callsPerHour;
          baseStats.closedCasesPerHour += s.closedCasesPerHour;
          baseStats.fcr += s.fcr;
          baseStats.teamBacklog += s.teamBacklog;
          baseStats.incomingCalls += s.incomingCalls;
          baseStats.outgoingCalls += s.outgoingCalls;
          baseStats.adherence += s.adherence;
        });

        // Averages for percentage/rate fields
        baseStats.qa /= rfcsToAggregate.length;
        baseStats.nsatInfo /= rfcsToAggregate.length;
        baseStats.nsatClaims /= rfcsToAggregate.length;
        baseStats.slaCompliance /= rfcsToAggregate.length;
        baseStats.callsPerHour /= rfcsToAggregate.length;
        baseStats.closedCasesPerHour /= rfcsToAggregate.length;
        baseStats.fcr /= rfcsToAggregate.length;
        baseStats.adherence /= rfcsToAggregate.length;
      } else {
        baseStats = { ...(getFilteredMetrics(currentUser.rfc, startDate, endDate) as UserMetrics) };
      }
    } else {
      baseStats = { ...(getFilteredMetrics(currentUser.rfc, startDate, endDate) as UserMetrics) };
    }

    if (dbOpenedCases !== null) {
      baseStats.openedCases = dbOpenedCases;
    }
    return baseStats;
  }, [currentUser, startDate, endDate, dbOpenedCases]);

  // Derived calculations for standard agent (move to top level hooks)
  const calcResults = React.useMemo(() => {
    if (!stats) return { productivity: 0, performance: 0, bonus: 0, rankingPercentile: 100 };
    const closedPerHourScore = (stats.closedCasesPerHour / 1) * 100;
    const callsPerHourScore = (stats.callsPerHour / 6) * 100;
    const fcrScore = stats.fcr;
    
    // Use DB opened cases if available for the rate calculation
    const openedCases = stats.openedCases || 1; // Prevent division by zero
    const closedCasesRate = (stats.closedCases / openedCases) * 100;
    const closedRateScore = Math.min(100, closedCasesRate);
    
    const productivity = (closedPerHourScore * 0.25) + (callsPerHourScore * 0.25) + (fcrScore * 0.25) + (closedRateScore * 0.25);
    const performance = (stats.qa * 0.25) + (stats.nsatInfo * 0.125) + (stats.nsatClaims * 0.125) + (productivity * 0.25) + (stats.slaCompliance * 0.25);
    const empathyLevel = 100 - (stats.empathyPenalty || 0);
    const surveyLevel = 100 - (stats.surveyPenalty || 0);
    const bonus = (stats.qa * 0.15) + (stats.nsatInfo * 0.2) + (stats.nsatClaims * 0.2) + (stats.teamBacklog * 0.15) + (empathyLevel * 0.15) + (surveyLevel * 0.15);
    const rankingPercentile = Math.max(1, Math.min(100, Math.floor(105 - performance)));
    return { productivity, performance, bonus, rankingPercentile };
  }, [stats]);

  const { productivity, performance, bonus, rankingPercentile } = calcResults;

  const myPerformanceQuartile = React.useMemo(() => {
    if (!currentUser || currentUser.role !== 'Agent') return null;
    
    // Find my leader's team to ensure consistency with Leader's view
    const myLeader = Object.values(MOCK_USERS).find(u => u.role === 'Leader' && u.serviceDesk === currentUser.serviceDesk);
    if (!myLeader || !myLeader.team) return null;
    
    // Calculate performance for each team member
    const teamMetrics = myLeader.team.map(rfc => {
      const s = getFilteredMetrics(rfc, startDate, endDate) as UserMetrics;
      const closedPerHourScore = (s.closedCasesPerHour / 1) * 100;
      const callsPerHourScore = (s.callsPerHour / 6) * 100;
      const fcrScore = s.fcr;
      const closedRateScore = s.closedCasesRate;
      const prod = (closedPerHourScore * 0.25) + (callsPerHourScore * 0.25) + (fcrScore * 0.25) + (closedRateScore * 0.25);
      const perf = (s.qa * 0.25) + (s.nsatInfo * 0.125) + (s.nsatClaims * 0.125) + (prod * 0.25) + (s.slaCompliance * 0.25);
      return { rfc, performance: perf };
    });
    
    // Sort by performance descending (highest first) as in Leader view
    const sortedMembers = [...teamMetrics].sort((a, b) => b.performance - a.performance);
    
    // Find my index
    const myIndex = sortedMembers.findIndex(p => p.rfc === currentUser.rfc);
    if (myIndex === -1) return null;
    
    const percentile = (myIndex / sortedMembers.length) * 100;
    if (percentile >= 75) return 'Q4';
    if (percentile >= 50) return 'Q3';
    if (percentile >= 25) return 'Q2';
    return 'Q1';
  }, [currentUser, startDate, endDate]);

  // Historical data for this user
  const rawHistoricalData = React.useMemo(() => currentUser ? generateHistoricalData(currentUser.rfc) : [], [currentUser]);

  const trendData = React.useMemo(() => {
    if (rawHistoricalData.length === 0) return [];
    // 1. Filter by start and end date
    const filtered = rawHistoricalData.filter(d => 
      dayjs(d.date).isBetween(startDate, endDate, 'day', '[]')
    );

    if (filtered.length === 0) return [];

    // 2. Aggregate by hierarchy
    const groups: Record<string, any[]> = {};
    const formatStr = hierarchy === 'day' ? 'YYYY-MM-DD' : 
                     hierarchy === 'week' ? 'YYYY-ww' : 
                     hierarchy === 'month' ? 'YYYY-MM' : 'YYYY';

    filtered.forEach(d => {
      const key = dayjs(d.date).format(formatStr);
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });

    return Object.entries(groups).map(([key, items]) => {
      const entry: any = { 
        name: key, 
        fullDate: items[0].date,
        count: items.length 
      };
      
      selectedIndicators.forEach(indicator => {
        const sum = items.reduce((acc, item) => acc + (item[indicator] || 0), 0);
        const isInt = ['Opened Cases', 'Closed Cases', 'NSAT Information', 'NSAT Claims', 'Incoming Calls', 'Outgoing Calls'].includes(indicator);
        entry[indicator] = isInt ? Math.round(sum / items.length) : Number((sum / items.length).toFixed(1));
      });
      
      return entry;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [rawHistoricalData, startDate, endDate, hierarchy, selectedIndicators]);

  // Administrative Management Logic
  const allDays = React.useMemo(() => {
    const days = [];
    let curr = startDate.clone().startOf('day');
    while (curr.isBefore(endDate) || curr.isSame(endDate, 'day')) {
      days.push(curr);
      curr = curr.add(1, 'day');
    }
    return days;
  }, [startDate, endDate]);

  const businessDays = allDays.filter(d => d.day() !== 0 && d.day() !== 6);
  const totalBusinessDays = businessDays.length;
  
  // Universal Simulation logic to determine day types for each tab
  const daySchedules = React.useMemo(() => {
    if (!currentUser || !stats) return [];
    const rfcNum = currentUser.rfc.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const today = dayjs().startOf('day');
    
    // Base assignments for past days
    const schedules = businessDays.map((d) => {
      const isPast = d.isBefore(today);
      if (!isPast) return { date: d, isFuture: true, homeType: null, attType: null, adhType: null };
      
      const rand = Math.sin(rfcNum + d.unix()) * 10000;
      const val = rand - Math.floor(rand);
      
      // Home Office Logic
      const homeType = val < 0.35 ? 'home' : 'office';
      
      // Attendance Logic
      const pastCount = businessDays.filter(day => day.isBefore(today)).length;
      const absenceProb = pastCount > 0 ? (stats.absences || 0) / pastCount : 0;
      const attType = val < absenceProb ? 'absence' : 'attendance';

      // Adherence Logic
      const adhProb = (stats.adherence || 0) / 100;
      const adhType = val < adhProb ? 'complete' : 'incomplete';

      return {
        date: d,
        isFuture: false,
        homeType,
        attType,
        adhType
      };
    });

    // Pass 2: Future assignments for Home Office "Available"
    const homeTaken = schedules.filter(s => s.homeType === 'home').length;
    const maxHome = Math.floor(totalBusinessDays * 0.4);
    let homeAvail = Math.max(0, maxHome - homeTaken);

    return schedules.map(s => {
      if (s.isFuture && homeAvail > 0) {
        homeAvail--;
        return { ...s, homeType: 'available' };
      }
      return s;
    });
  }, [businessDays, currentUser, totalBusinessDays, stats]);

  const homeDaysTaken = daySchedules.filter(s => s.homeType === 'home').length;
  const officeDaysTaken = daySchedules.filter(s => s.homeType === 'office').length;
  const homeDaysAvailableTotal = daySchedules.filter(s => s.homeType === 'available').length;
  
  const attendanceDaysCount = daySchedules.filter(s => s.attType === 'attendance').length;
  const absenceDaysCount = daySchedules.filter(s => s.attType === 'absence').length;

  const adherenceCompleteCount = daySchedules.filter(s => s.adhType === 'complete').length;
  const adherenceIncompleteCount = daySchedules.filter(s => s.adhType === 'incomplete').length;

  const pastBusinessDaysCount = daySchedules.filter(s => !s.isFuture).length;
  
  const homeOfficeRate = totalBusinessDays > 0 ? (homeDaysTaken / totalBusinessDays) * 100 : 0;
  const attendanceRate = pastBusinessDaysCount > 0 ? ((attendanceDaysCount) / pastBusinessDaysCount) * 100 : 100;
  const adherenceRate = stats?.adherence || 0;

  // Destructure calcResults for easier access in JSX
  const { closedPerHourScore, callsPerHourScore, fcrScore, closedRateScore } = React.useMemo(() => {
    if (!stats) return { closedPerHourScore: 0, callsPerHourScore: 0, fcrScore: 0, closedRateScore: 0 };
    return {
      closedPerHourScore: (stats.closedCasesPerHour / 1) * 100,
      callsPerHourScore: (stats.callsPerHour / 6) * 100,
      fcrScore: stats.fcr,
      closedRateScore: stats.closedCasesRate
    };
  }, [stats]);
  
  const currentIndicator = selectedIndicators[0] || 'Performance';
  const indicatorMap: Record<string, string> = {
    'Performance': 'performance',
    'Productivity': 'productivity',
    'Ranking': 'ranking',
    'Bonus': 'bonus',
    'Opened Cases': 'opened',
    'Closed Cases': 'closed',
    'Closed Cases Rate': 'closedRate',
    'NSAT Information': 'nsatInfo',
    'NSAT Claims': 'nsatClaims',
    'Incoming Calls': 'incCalls',
    'Outgoing Calls': 'outCalls',
    '% First Contact Resolution': 'fcr',
    'Backlog Team': 'backlog'
  };
  
  const historicalIndicatorMap: Record<string, string> = {
    'Performance': 'Performance',
    'Productivity': 'Productivity',
    'Ranking': 'Ranking',
    'Bonus': 'Bonus',
    'Opened Cases': 'openedCases',
    'Closed Cases': 'closedCases',
    'Closed Cases Rate': 'closedCasesRate',
    'NSAT Information': 'nsatInfo',
    'NSAT Claims': 'nsatClaims',
    'Incoming Calls': 'incomingCalls',
    'Outgoing Calls': 'outgoingCalls',
    '% First Contact Resolution': 'fcr',
    'Backlog Team': 'teamBacklog'
  };

  // Team calculations for Management
  const teamRfcs = React.useMemo(() => {
    if (currentUser?.role === 'Manager' || currentUser?.role === 'Executive') {
      return Object.values(MOCK_USERS)
        .filter(u => u.role === 'Agent' || u.role === 'Leader')
        .map(u => u.rfc);
    }
    return currentUser?.team || [];
  }, [currentUser]);

  const teamStats = React.useMemo(() => {
    if (!isManagement) return [];
    return teamRfcs.map(rfc => {
      const s = getFilteredMetrics(rfc, startDate, endDate) as UserMetrics;
      const closedPerHourScore = (s.closedCasesPerHour / 1) * 100;
      const callsPerHourScore = (s.callsPerHour / 6) * 100;
      const fcrScore = s.fcr;
      const closedRateScore = s.closedCasesRate;
      const prod = (closedPerHourScore * 0.25) + (callsPerHourScore * 0.25) + (fcrScore * 0.25) + (closedRateScore * 0.25);
      const perf = (s.qa * 0.25) + (s.nsatInfo * 0.125) + (s.nsatClaims * 0.125) + (prod * 0.25) + (s.slaCompliance * 0.25);
      const ranking = Math.max(1, Math.min(100, Math.floor(105 - perf)));
      const empathyLevel = 100 - (s.empathyPenalty || 0);
      const surveyLevel = 100 - (s.surveyPenalty || 0);
      const bonus_val = (s.qa * 0.15) + (s.nsatInfo * 0.2) + (s.nsatClaims * 0.2) + (s.teamBacklog * 0.15) + (empathyLevel * 0.15) + (surveyLevel * 0.15);

      return {
        rfc,
        name: MOCK_USERS[rfc]?.name.split(' ')[0] || rfc,
        fullName: MOCK_USERS[rfc]?.name || rfc,
        stats: s,
        performance: perf,
        productivity: prod,
        ranking,
        bonus: bonus_val,
        opened: s.openedCases,
        closed: s.closedCases,
        closedRate: s.closedCasesRate,
        nsatInfo: s.nsatInfo,
        nsatClaims: s.nsatClaims,
        incCalls: s.incomingCalls,
        outCalls: s.outgoingCalls,
        fcr: s.fcr,
        backlog: s.teamBacklog
      };
    });
  }, [isManagement, teamRfcs, startDate, endDate]);

  const avgPerformance = teamStats.length > 0 ? teamStats.reduce((acc, s) => acc + s.performance, 0) / teamStats.length : 0;
  const avgProductivity = teamStats.length > 0 ? teamStats.reduce((acc, s) => acc + s.productivity, 0) / teamStats.length : 0;

  const aggregatedTrendData = React.useMemo(() => {
    if (!isManagement) return [];
    const dateMap: Record<string, any[]> = {};
    teamRfcs.forEach(rfc => {
      const memberData = generateHistoricalData(rfc);
      memberData.forEach(d => {
        if (dayjs(d.date).isBetween(startDate, endDate, 'day', '[]')) {
          const key = dayjs(d.date).format(hierarchy === 'day' ? 'YYYY-MM-DD' : 
                                          hierarchy === 'week' ? 'YYYY-ww' : 
                                          hierarchy === 'month' ? 'YYYY-MM' : 'YYYY');
          if (!dateMap[key]) dateMap[key] = [];
          dateMap[key].push(d);
        }
      });
    });

    return Object.entries(dateMap).map(([key, items]) => {
      const entry: any = { name: key, fullDate: items[0].date };
      const dataKey = historicalIndicatorMap[currentIndicator] || currentIndicator;
      const sum = items.reduce((acc, item) => acc + (item[dataKey] || 0), 0);
      entry['Team Average'] = sum / items.length;

      if (selectedTeamMember) {
        const mData = generateHistoricalData(selectedTeamMember);
        const mItem = mData.find(d => {
           const mKey = dayjs(d.date).format(hierarchy === 'day' ? 'YYYY-MM-DD' : 
                                          hierarchy === 'week' ? 'YYYY-ww' : 
                                          hierarchy === 'month' ? 'YYYY-MM' : 'YYYY');
           return mKey === key;
        });
        if (mItem) {
          entry['Member Individual'] = mItem[dataKey] || 0;
        }
      }
      return entry;
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [isManagement, teamRfcs, startDate, endDate, hierarchy, currentIndicator, selectedTeamMember]);

  const dataKeyManagement = indicatorMap[currentIndicator];
  const sortedTeam = React.useMemo(() => {
    return [...teamStats].sort((a, b) => {
      const valA = (a as any)[dataKeyManagement] || 0;
      const valB = (b as any)[dataKeyManagement] || 0;
      return valB - valA;
    });
  }, [teamStats, dataKeyManagement]);

  const quartileData = React.useMemo(() => {
    return sortedTeam.map((member, index) => {
      const percentile = (index / sortedTeam.length) * 100;
      let quartile = 'Q1';
      if (percentile >= 75) quartile = 'Q4';
      else if (percentile >= 50) quartile = 'Q3';
      else if (percentile >= 25) quartile = 'Q2';

      return {
        ...member,
        quartile,
        value: (member as any)[dataKeyManagement]
      };
    });
  }, [sortedTeam, dataKeyManagement]);

  // Team Admin Stats Calculation
  const teamAdminStats = React.useMemo(() => {
    if (!isManagement || !teamRfcs.length) return null;

    const allMemberSchedules = teamRfcs.map(rfc => {
      const mStats = getFilteredMetrics(rfc, startDate, endDate) as UserMetrics;
      const rfcNum = rfc.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const today = dayjs().startOf('day');
      
      const schedules = businessDays.map((d) => {
        const isPast = d.isBefore(today);
        if (!isPast) return { date: d, isFuture: true, homeType: null, attType: null, adhType: null };
        
        const rand = Math.sin(rfcNum + d.unix()) * 10000;
        const val = rand - Math.floor(rand);
        const homeType = val < 0.35 ? 'home' : 'office';
        const pastCount = businessDays.filter(day => day.isBefore(today)).length;
        const absenceProb = pastCount > 0 ? (mStats.absences || 0) / pastCount : 0;
        const attType = val < absenceProb ? 'absence' : 'attendance';
        const adhProb = (mStats.adherence || 0) / 100;
        const adhType = val < adhProb ? 'complete' : 'incomplete';

        return { date: d, isFuture: false, homeType, attType, adhType };
      });

      const homeTaken = schedules.filter(s => s.homeType === 'home').length;
      const maxHome = Math.floor(totalBusinessDays * 0.4);
      let homeAvail = Math.max(0, maxHome - homeTaken);

      return schedules.map(s => {
        if (s.isFuture && homeAvail > 0) {
          homeAvail--;
          return { ...s, homeType: 'available' };
        }
        return s;
      });
    });

    const daySummaries = businessDays.map(d => {
        const dateSchedules = allMemberSchedules.map(sch => sch.find(s => s.date.isSame(d, 'day'))!);
        return {
            date: d,
            home: dateSchedules.filter(s => s.homeType === 'home').length,
            office: dateSchedules.filter(s => s.homeType === 'office').length,
            available: dateSchedules.filter(s => s.homeType === 'available').length,
            attendance: dateSchedules.filter(s => s.attType === 'attendance').length,
            absence: dateSchedules.filter(s => s.attType === 'absence').length,
            complete: dateSchedules.filter(s => s.adhType === 'complete').length,
            incomplete: dateSchedules.filter(s => s.adhType === 'incomplete').length,
            isFuture: d.isAfter(dayjs().startOf('day'), 'day') || d.isSame(dayjs().startOf('day'), 'day') && false // simplify
        };
    });

    const totalBusinessDaysAll = totalBusinessDays * teamRfcs.length;
    const homeDaysTakenAll = allMemberSchedules.flat().filter(s => s.homeType === 'home').length;
    const officeDaysTakenAll = allMemberSchedules.flat().filter(s => s.homeType === 'office').length;
    const homeDaysAvailAll = allMemberSchedules.flat().filter(s => s.homeType === 'available').length;
    
    const pastBusinessDaysTotal = allMemberSchedules.flat().filter(s => s.date.isBefore(dayjs().startOf('day'))).length;
    const attDaysAll = allMemberSchedules.flat().filter(s => s.attType === 'attendance').length;
    const absDaysAll = allMemberSchedules.flat().filter(s => s.attType === 'absence').length;
    
    const adhCompAll = allMemberSchedules.flat().filter(s => s.adhType === 'complete').length;
    const adhIncompAll = allMemberSchedules.flat().filter(s => s.adhType === 'incomplete').length;

    const homeRate = totalBusinessDaysAll > 0 ? (homeDaysTakenAll / totalBusinessDaysAll) * 100 : 0;
    const attRate = pastBusinessDaysTotal > 0 ? (attDaysAll / pastBusinessDaysTotal) * 100 : 100;
    
    // Average Adherence
    const teamAdherenceAvg = teamRfcs.reduce((acc, rfc) => {
        const s = getFilteredMetrics(rfc, startDate, endDate) as UserMetrics;
        return acc + (s.adherence || 0);
    }, 0) / teamRfcs.length;

    return {
        daySummaries,
        homeRate,
        attRate,
        adhRate: teamAdherenceAvg,
        totalBusinessDays: totalBusinessDays, // keeping single business days count per member for "My Team Data" labeling
        totalBusinessDaysTeam: totalBusinessDaysAll,
        homeDaysTaken: homeDaysTakenAll,
        officeDaysTaken: officeDaysTakenAll,
        homeDaysAvailable: homeDaysAvailAll,
        attDays: attDaysAll,
        absDays: absDaysAll,
        adhComp: adhCompAll,
        adhIncomp: adhIncompAll
    };
  }, [isManagement, teamRfcs, startDate, endDate, businessDays, totalBusinessDays]);

  const handleIndicatorChange = (event: any) => {
    const value = event.target.value;
    const newSelection = typeof value === 'string' ? value.split(',') : value;
    if (newSelection.length <= 2) {
      setSelectedIndicators(newSelection);
    }
  };

  const indicatorOptions = [
    { group: 'KPIs', options: ['Performance', 'Productivity', 'Ranking', 'Bonus'] },
    { group: 'Indicators', options: ['Opened Cases', 'Closed Cases', 'Closed Cases Rate', 'NSAT Information', 'NSAT Claims', 'Incoming Calls', 'Outgoing Calls', '% First Contact Resolution', 'Backlog Team'] }
  ];

  const getKpiColor = (val: number) => {
    if (val >= 85) return '#b9e04d';
    if (val >= 70) return '#ffcc00';
    return '#ea5713';
  };

  const getRankingColor = (val: number) => {
    if (val <= 15) return '#b9e04d';
    if (val <= 40) return '#ffcc00';
    return '#ea5713';
  };

  if (!currentUser || !stats) return null;

  if (isManagement && managementTab === 'Operational') {
    return (
      <Box sx={{ animate: 'fade-in 0.5s' }}>
        <Box sx={{ borderBottom: '1px solid rgba(185, 224, 77, 0.2)', pb: 1, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 300, fontSize: 18 }}>
            Operational Management - <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>Leader Overview</Box>
          </Typography>
        </Box>

        {/* Top 2 Averages */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={6}>
            <ManagementIndicator 
              title="Average Performance" 
              value={`${avgPerformance.toFixed(1)}%`} 
              icon={<Activity size={24} />} 
              formula="Σ(Team Performance) / Team Size"
              color={getKpiColor(avgPerformance)}
              description="The overall average efficiency of your team. This metric summarizes the collective performance of all your direct reports."
            />
          </Grid>
          <Grid size={6}>
            <ManagementIndicator 
              title="Average Productivity" 
              value={`${avgProductivity.toFixed(1)}%`} 
              icon={<Layers size={24} />} 
              formula="Σ(Team Productivity) / Team Size"
              color={getKpiColor(avgProductivity)}
              description="The average work output per person in your team. Tracks how efficiently your team is handling their daily workload."
            />
          </Grid>
        </Grid>

        {/* Chart Header / Segmenter */}
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5, fontSize: 10, letterSpacing: 1, display: 'block', mb: 1 }}>SELECT METRIC FOR ANALYSIS</Typography>
            <FormControl fullWidth size="small">
              <Select
                value={selectedIndicators}
                onChange={handleIndicatorChange}
                renderValue={(selected) => (selected as string[]).join(', ')}
                sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }}
              >
                {indicatorOptions.map((group) => [
                  <ListSubheader key={group.group} sx={{ fontWeight: 800, color: 'primary.main', fontSize: 10, bgcolor: isDark ? '#000A1A' : '#fff' }}>{group.group}</ListSubheader>,
                  ...group.options.map((option) => (
                    <MenuItem key={option} value={option}>
                      <Checkbox checked={selectedIndicators.indexOf(option) > -1} size="small" />
                      <ListItemText primary={option} />
                    </MenuItem>
                  ))
                ])}
              </Select>
            </FormControl>
          </Box>
          <Box>
            <Button
              size="small"
              variant="outlined"
              onClick={handleHierarchyClick}
              startIcon={<CalendarIcon size={14} />}
              sx={{ height: 40, px: 2 }}
            >
              {hierarchy.toUpperCase()}
            </Button>
          </Box>
        </Box>

        {/* Charts Grid */}
        <Grid container spacing={3}>
          {/* Over Time Chart */}
          <Grid size={8}>
            <Paper sx={{ p: 3, height: 450 }}>
              <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, mb: 1, display: 'block' }}>
                {currentIndicator} Over Time (Average vs {selectedTeamMember ? MOCK_USERS[selectedTeamMember].name : 'Individual'})
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={aggregatedTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  {selectedTeamMember && (
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, color: '#B018D9' }} domain={['auto', 'auto']} />
                  )}
                  <Tooltip 
                    contentStyle={{ backgroundColor: isDark ? '#000A1A' : '#fff', borderRadius: 8, border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                    formatter={(val: number) => val.toFixed(1)}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="Team Average" 
                    stroke={theme.palette.primary.main} 
                    strokeWidth={4} 
                    dot={{ r: 4 }} 
                    activeDot={{ r: 8 }}
                  />
                  {selectedTeamMember && (
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="Member Individual" 
                      stroke="#B018D9" 
                      strokeWidth={3} 
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          {/* Quartile / Ranking Chart */}
          <Grid size={4}>
            <Paper sx={{ p: 3, height: 450, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <Typography variant="caption" sx={{ color: theme.palette.secondary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, mb: 2, display: 'block' }}>
                Team Members Ranking ({currentIndicator})
              </Typography>
              <Box sx={{ flex: 1, overflowY: 'auto', pr: 1 }}>
                {['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                  const items = quartileData.filter(d => d.quartile === q);
                  if (items.length === 0) return null;
                  return (
                    <Box key={q} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, fontSize: 10, bgcolor: q === 'Q1' ? '#b9e04d' : q === 'Q2' ? '#ffcc00' : q === 'Q3' ? '#ff9900' : '#ea5713', color: '#000', px: 1, borderRadius: 0.5 }}>
                          {q}
                        </Typography>
                        <Divider sx={{ flex: 1, opacity: 0.2 }} />
                      </Box>
                      {items.map(member => (
                        <Box 
                          key={member.rfc}
                          onClick={() => setSelectedTeamMember(selectedTeamMember === member.rfc ? null : member.rfc)}
                          sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            p: 1, 
                            mb: 0.5,
                            borderRadius: 1,
                            cursor: 'pointer',
                            bgcolor: selectedTeamMember === member.rfc ? 'rgba(11, 160, 175, 0.15)' : 'transparent',
                            border: selectedTeamMember === member.rfc ? `1px solid ${theme.palette.primary.main}` : '1px solid transparent',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getKpiColor(Number(member.value)) }} />
                            <Typography sx={{ fontSize: 13, fontWeight: selectedTeamMember === member.rfc ? 700 : 500 }}>{member.fullName}</Typography>
                          </Box>
                          <Typography sx={{ fontSize: 12, fontWeight: 900, fontFamily: '"JetBrains Mono", monospace', opacity: 0.8 }}>
                            {formatValue(member.value, ['Opened Cases', 'Closed Cases', 'NSAT Information', 'NSAT Claims', 'Incoming Calls', 'Outgoing Calls'].includes(currentIndicator))}{currentIndicator.includes('%') || ['Performance', 'Productivity', 'Bonus', 'Closed Cases Rate'].includes(currentIndicator) ? '%' : ''}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  );
                })}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (isStandardAgent && managementTab === 'Operational') {
    return (
      <Box>
        <Box sx={{ borderBottom: '1px solid rgba(185, 224, 77, 0.2)', pb: 1, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 300, fontSize: 18 }}>
            Management: <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>Operational Management</Box>
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={3}>
            <ManagementIndicator 
              title="My Performance" 
              value={`${performance.toFixed(1)}%`} 
              icon={<Activity size={24} />} 
              formula="(QA: 25%) + (NSAT Info: 12.5%) + (NSAT Claims: 12.5%) + (Productivity: 25%) + (SLA Compliance: 25%)"
              color={getKpiColor(performance)}
              description="Your total efficiency score. It combines your quality (25%), customer satisfaction (25%), speed of work (25%), and on-time service (25%)."
            />
          </Grid>
          <Grid size={3}>
            <ManagementIndicator 
              title="My Productivity" 
              value={`${productivity.toFixed(1)}%`} 
              icon={<Layers size={24} />} 
              formula="(Cases Efficiency: 25%) + (Calls Efficiency: 25%) + (First Connection Resolution: 25%) + (Total Closed Cases: 25%)"
              color={getKpiColor(productivity)}
              description="A measurement of your daily work output. 100% means you are meeting all targets for cases handled, calls taken, and resolutions provided."
            />
          </Grid>
          <Grid size={3}>
            <ManagementIndicator 
              title="My Ranking" 
              value={`TOP ${rankingPercentile}%`} 
              icon={<Trophy size={24} />} 
              formula="Comparison of your Performance score against your entire team."
              color={getRankingColor(rankingPercentile)}
              description={`Congratulations! You are in the top ${rankingPercentile}% of the organization. This means you are performing better than ${100 - rankingPercentile}% of your peers.`}
              quartile={myPerformanceQuartile || undefined}
            />
          </Grid>
          <Grid size={3}>
            <ManagementIndicator 
              title="My Bonus" 
              value={`${bonus.toFixed(1)}%`} 
              icon={<DollarSign size={24} />} 
              formula="(QA: 15%) + (NSAT INFO: 20%) + (NSAT CLAIMS: 20%) + (Team Backlog: 15%) + (Quality Empathy: 15%) + (Quality Survey: 15%)"
              color={getKpiColor(bonus)}
              description="Your projected monthly incentive. Achieving 100% means you've met all qualitative and quantitative goals for the bonus period."
            />
          </Grid>

          {/* Trend Indicator Selection and Chart */}
          <Grid size={12}>
            <Paper sx={{ p: 3, mt: 1, border: isDark ? '1px solid rgba(11, 160, 175, 0.2)' : '1px solid rgba(0,0,0,0.05)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', mb: 1.5, color: theme.palette.primary.main }}>
                    {selectedIndicators.length > 0 ? `${selectedIndicators.join(' and ')} Over Time` : 'Trend Analysis'}
                  </Typography>
                  <FormControl sx={{ minWidth: 350 }}>
                    <InputLabel id="indicator-select-label" sx={{ fontSize: 13 }}>Select Indicators (Max 2)</InputLabel>
                    <Select
                      labelId="indicator-select-label"
                      multiple
                      value={selectedIndicators}
                      onChange={handleIndicatorChange}
                      renderValue={(selected) => (selected as string[]).join(', ')}
                      label="Select Indicators (Max 2)"
                      size="small"
                      sx={{ 
                        bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
                        fontSize: 13
                      }}
                    >
                      {indicatorOptions.map((group) => [
                        <ListSubheader key={group.group} sx={{ fontWeight: 800, color: 'primary.main', fontSize: 10, bgcolor: isDark ? '#000A1A' : '#fff' }}>{group.group}</ListSubheader>,
                        ...group.options.map((option) => (
                          <MenuItem key={option} value={option}>
                            <Checkbox checked={selectedIndicators.indexOf(option) > -1} size="small" />
                            <ListItemText 
                              primary={
                                <Typography sx={{ fontSize: 13, fontWeight: selectedIndicators.indexOf(option) > -1 ? 700 : 400 }}>
                                  {option}
                                </Typography>
                              } 
                            />
                          </MenuItem>
                        ))
                      ])}
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5, fontSize: 10, letterSpacing: 1 }}>TIME_SCALE</Typography>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={handleHierarchyClick}
                    startIcon={<CalendarIcon size={14} />}
                    sx={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: 'primary.main',
                      borderColor: 'rgba(11, 160, 175, 0.3)',
                      height: 36,
                      px: 2,
                      bgcolor: isDark ? 'rgba(11, 160, 175, 0.05)' : 'transparent',
                      '&:hover': {
                        borderColor: 'primary.main',
                        bgcolor: 'rgba(11, 160, 175, 0.1)'
                      }
                    }}
                  >
                    {hierarchy.toUpperCase()}S
                  </Button>
                  <Menu
                    anchorEl={hierarchyAnchor}
                    open={Boolean(hierarchyAnchor)}
                    onClose={() => handleHierarchyClose()}
                    slotProps={{
                      paper: {
                        sx: {
                          bgcolor: isDark ? '#000A1A' : '#fff',
                          border: '1px solid rgba(11, 160, 175, 0.3)',
                          boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                          '& .MuiMenuItem-root': {
                            fontSize: 12,
                            fontWeight: 700,
                            py: 1,
                            '&:hover': { bgcolor: 'rgba(11, 160, 175, 0.1)' }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem onClick={() => handleHierarchyClose('day')}>DAYS</MenuItem>
                    <MenuItem onClick={() => handleHierarchyClose('week')}>WEEKS</MenuItem>
                    <MenuItem onClick={() => handleHierarchyClose('month')}>MONTHS</MenuItem>
                    <MenuItem onClick={() => handleHierarchyClose('year')}>YEARS</MenuItem>
                  </Menu>
                </Box>
              </Box>

              <Box sx={{ height: 450, width: '100%' }}>
                <ResponsiveContainer>
                  <LineChart data={trendData} margin={{ top: 40, right: 40, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12, opacity: 1, fontWeight: 700, fill: '#0ba0af' }} 
                      stroke="rgba(11, 160, 175, 0.4)" 
                      dy={10}
                      minTickGap={30}
                      padding={{ left: 20, right: 20 }}
                    />
                    <YAxis 
                      yAxisId="left" 
                      tick={{ fontSize: 14, opacity: 0.9, fontWeight: 800 }} 
                      stroke={theme.palette.primary.main}
                      width={60}
                      domain={[0, 'auto']}
                    />
                    {selectedIndicators.length > 1 && (
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tick={{ fontSize: 14, opacity: 0.9, fontWeight: 800 }} 
                        stroke="#B018D9"
                        width={60}
                        domain={[0, 'auto']}
                      />
                    )}
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? 'rgba(0, 8, 20, 0.95)' : '#fff',
                        border: `2px solid ${theme.palette.primary.main}`,
                        borderRadius: 8,
                        fontSize: 20,
                        fontWeight: 800,
                        zIndex: 1000,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                      }}
                      itemStyle={{ fontSize: 18, padding: '4px 0' }}
                      labelStyle={{ fontSize: 18, marginBottom: 8, fontWeight: 800, color: theme.palette.primary.main, borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 4 }}
                      formatter={(val: any, name: string) => [formatValue(val, ['Opened Cases', 'Closed Cases', 'NSAT Information', 'NSAT Claims', 'Incoming Calls', 'Outgoing Calls'].includes(name) || selectedIndicators.some(si => ['Opened Cases', 'Closed Cases', 'NSAT Information', 'NSAT Claims', 'Incoming Calls', 'Outgoing Calls'].includes(si))), name]}
                      labelFormatter={(label, payload) => {
                        if (payload && payload[0]) {
                          const date = payload[0].payload.fullDate;
                          return dayjs(date).format(hierarchy === 'day' ? 'DD MMMM YYYY' : 
                                                   hierarchy === 'week' ? '[Week] ww, YYYY' :
                                                   hierarchy === 'month' ? 'MMMM YYYY' : 'YYYY');
                        }
                        return label;
                      }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={12} wrapperStyle={{ fontSize: 14, fontWeight: 800, paddingTop: 25 }} />
                    {selectedIndicators.map((indicator, index) => (
                        <Line
                          key={indicator}
                          yAxisId={index === 0 ? 'left' : 'right'}
                          type="monotone"
                          dataKey={indicator}
                          stroke={index === 0 ? theme.palette.primary.main : "#B018D9"}
                          strokeWidth={4}
                          dot={{ r: 6, strokeWidth: 3, fill: isDark ? '#000A1A' : '#fff' }}
                          activeDot={{ r: 10, strokeWidth: 0 }}
                          animationDuration={1500}
                        >
                          {trendData.length <= 25 && (
                            <LabelList 
                              dataKey={indicator} 
                              position={index === 0 ? "top" : "bottom"} 
                              offset={15} 
                              style={{ 
                                fontSize: 13, 
                                fontWeight: 800, 
                                fill: index === 0 ? theme.palette.primary.main : "#B018D9", 
                                opacity: 1 
                              }} 
                              formatter={formatValue}
                            />
                          )}
                        </Line>
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Expanded charts for operative view */}
          <Grid size={6}>
            <Paper sx={{ p: 3, height: 350 }}>
              <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 2, display: 'block' }}>
                PERFORMANCE BREAKDOWN
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={[
                  { name: 'QA', score: stats.qa },
                  { name: 'SLA', score: stats.slaCompliance },
                  { name: 'NSAT I', score: stats.nsatInfo },
                  { name: 'NSAT C', score: stats.nsatClaims },
                  { name: 'PROD', score: productivity },
                ]}>
                  <XAxis dataKey="name" stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
                  <YAxis domain={[0, 100]} stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? 'rgba(0, 8, 20, 0.95)' : '#fff',
                      border: `1px solid ${theme.palette.primary.main}33`,
                      borderRadius: 4,
                      fontSize: 18,
                      fontWeight: 600,
                      zIndex: 100
                    }}
                    itemStyle={{ fontSize: 16 }}
                    labelStyle={{ fontSize: 16, marginBottom: 4, fontWeight: 700 }}
                    formatter={(val: any, name: string) => [formatValue(val, ['NSAT I', 'NSAT C'].includes(name)), name]}
                  />
                  <Bar dataKey="score" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid size={6}>
            <Paper sx={{ p: 3, height: 350 }}>
              <Typography variant="caption" sx={{ color: theme.palette.primary.main, fontWeight: 700, mb: 2, display: 'block' }}>
                PRODUCTIVITY BREAKDOWN
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={[
                  { name: 'Cases', val: closedPerHourScore },
                  { name: 'Calls', val: callsPerHourScore },
                  { name: 'FCR', val: fcrScore },
                  { name: 'Rate', val: closedRateScore },
                ]}>
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 120]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? 'rgba(0, 8, 20, 0.95)' : '#fff',
                      border: `1px solid ${theme.palette.primary.main}33`,
                      borderRadius: 4,
                      fontSize: 18,
                      fontWeight: 600,
                      zIndex: 100
                    }}
                    itemStyle={{ fontSize: 16 }}
                    labelStyle={{ fontSize: 16, marginBottom: 4, fontWeight: 700 }}
                    formatter={(val: any, name: string) => [formatValue(val, ['Cases', 'Calls'].includes(name)), name]}
                  />
                  <Bar dataKey="val" fill={theme.palette.secondary.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  const isStandardOrManagementAdmin = (isStandardAgent || isManagement) && managementTab === 'Administrative';

  if (isStandardOrManagementAdmin) {
    const isTeamView = isManagement && adminViewType === 'team';
    const colors = {
      home: '#B018D9',
      office: '#0ba0af',
      available: '#b9e04d',
      attendance: '#0ba0af',
      absence: '#B018D9',
      complete: '#0ba0af',
      incomplete: '#B018D9',
      total: '#666',
      future: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      weekend: 'transparent'
    };

    const displayStats = isTeamView && teamAdminStats ? {
      homeOfficeRate: teamAdminStats.homeRate,
      attendanceRate: teamAdminStats.attRate,
      adherenceRate: teamAdminStats.adhRate,
      totalBusinessDays: teamAdminStats.totalBusinessDays,
      homeDaysTaken: teamAdminStats.homeDaysTaken,
      officeDaysTaken: teamAdminStats.officeDaysTaken,
      homeDaysAvailableTotal: teamAdminStats.homeDaysAvailable,
      attendanceDaysCount: teamAdminStats.attDays,
      absenceDaysCount: teamAdminStats.absDays,
      adherenceCompleteCount: teamAdminStats.adhComp,
      adherenceIncompleteCount: teamAdminStats.adhIncomp
    } : {
      homeOfficeRate,
      attendanceRate,
      adherenceRate,
      totalBusinessDays,
      homeDaysTaken,
      officeDaysTaken,
      homeDaysAvailableTotal,
      attendanceDaysCount,
      absenceDaysCount,
      adherenceCompleteCount,
      adherenceIncompleteCount
    };

    return (
      <Box sx={{ animate: 'fade-in 0.5s' }}>
        <Box sx={{ borderBottom: '1px solid rgba(185, 224, 77, 0.2)', pb: 0.5, mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ fontWeight: 300, fontSize: 16 }}>
            Management: <Box component="span" sx={{ color: theme.palette.secondary.main, fontWeight: 600 }}>Administrative {isTeamView ? '(Team)' : ''}</Box>
          </Typography>
          
          {isManagement && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              {currentUser?.role !== 'Executive' && (
                <Button 
                  variant={adminViewType === 'personal' ? 'contained' : 'outlined'} 
                  size="small" 
                  onClick={() => setAdminViewType('personal')}
                  sx={{ borderRadius: 2 }}
                >
                  My Data
                </Button>
              )}
              <Button 
                variant={adminViewType === 'team' ? 'contained' : 'outlined'} 
                size="small" 
                onClick={() => setAdminViewType('team')}
                sx={{ borderRadius: 2 }}
              >
                My Team Data
              </Button>
            </Box>
          )}
        </Box>

        {/* 1. Top 3 KPIs */}
        <Grid container spacing={1.5} sx={{ mb: activeAdminTab ? 1.5 : 2.5 }}>
          <Grid size={4}>
            <ManagementIndicator 
              title={isTeamView ? "Avg. Home Office Rate" : "Home Office Rate"} 
              value={`${displayStats.homeOfficeRate.toFixed(1)}%`} 
              icon={<Briefcase size={24} />} 
              formula={isTeamView ? "(Σ Home Days / Σ Business Days) * 100" : "(Home Days / Total Business Days) * 100"}
              color={displayStats.homeOfficeRate <= 40 ? '#b9e04d' : '#ea5713'}
              description={isTeamView ? "The collective average percentage of business days spent working from home by your team." : "The percentage of your business days spent working from home. Goal: Max 40%."}
              onClick={() => setActiveAdminTab(activeAdminTab === 'homeOffice' ? null : 'homeOffice')}
              isSelected={activeAdminTab === 'homeOffice'}
              largeFonts
            />
          </Grid>
          <Grid size={4}>
            <ManagementIndicator 
              title={isTeamView ? "Avg. Attendance Rate" : "Attendance Rate"} 
              value={`${displayStats.attendanceRate.toFixed(1)}%`} 
              icon={<CheckCircle2 size={24} />} 
              formula={isTeamView ? "(Σ Attendance / Σ Past Business Days) * 100" : "(Attendance Days / Total Past Business Days) * 100"}
              color={getKpiColor(displayStats.attendanceRate)}
              description={isTeamView ? "The collective average percentage of days team members were present at work." : "The percentage of days you were present at work during the selected period."}
              onClick={() => setActiveAdminTab(activeAdminTab === 'attendance' ? null : 'attendance')}
              isSelected={activeAdminTab === 'attendance'}
              largeFonts
            />
          </Grid>
          <Grid size={4}>
            <ManagementIndicator 
              title={isTeamView ? "Avg. Adherence Rate" : "Adherence Rate"} 
              value={`${displayStats.adherenceRate.toFixed(1)}%`} 
              icon={<Clock size={24} />} 
              formula={isTeamView ? "Σ(Members Adherence) / Team Size" : "(Logged Time / Scheduled Time) * 100"}
              color={getKpiColor(displayStats.adherenceRate)}
              description={isTeamView ? "Average adherence across all team members." : "Measures how consistently you followed your scheduled shifts, lunches, and breaks."}
              onClick={() => setActiveAdminTab(activeAdminTab === 'adherence' ? null : 'adherence')}
              isSelected={activeAdminTab === 'adherence'}
              largeFonts
            />
          </Grid>
        </Grid>

        {/* 4. Conditional Sub-metrics */}
        {activeAdminTab === 'homeOffice' && (
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid size={3}><MiniCard title="Total Business Days" value={displayStats.totalBusinessDays} subtext={isTeamView ? "Per Member (Avg)" : "Mon-Fri"} color={colors.total} showIndicator largeFonts /></Grid>
            <Grid size={3}><MiniCard title={isTeamView ? "Team Home Days" : "Home Days Taken"} value={displayStats.homeDaysTaken} subtext="Usage" color={colors.home} showIndicator largeFonts /></Grid>
            <Grid size={3}><MiniCard title={isTeamView ? "Team Office Days" : "Office Days Taken"} value={displayStats.officeDaysTaken} subtext="Office" color={colors.office} showIndicator largeFonts /></Grid>
            <Grid size={3}><MiniCard title={isTeamView ? "Team Home Available" : "Home Available"} value={displayStats.homeDaysAvailableTotal} subtext="Remaining" color={colors.available} showIndicator largeFonts /></Grid>
          </Grid>
        )}

        {activeAdminTab === 'attendance' && (
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid size={4}><MiniCard title="Total Business Days" value={displayStats.totalBusinessDays} subtext={isTeamView ? "Per Member (Avg)" : "Mon-Fri"} color={colors.total} showIndicator largeFonts /></Grid>
            <Grid size={4}><MiniCard title={isTeamView ? "Team Attendance" : "Attendance Days"} value={displayStats.attendanceDaysCount} subtext="Days Present" color={colors.attendance} showIndicator largeFonts /></Grid>
            <Grid size={4}><MiniCard title={isTeamView ? "Team Absences" : "Absence Days"} value={displayStats.absenceDaysCount} subtext="Days Absent" color={colors.absence} showIndicator largeFonts /></Grid>
          </Grid>
        )}

        {activeAdminTab === 'adherence' && (
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            <Grid size={4}><MiniCard title="Total Business Days" value={displayStats.totalBusinessDays} subtext={isTeamView ? "Per Member (Avg)" : "Mon-Fri"} color={colors.total} showIndicator largeFonts /></Grid>
            <Grid size={4}><MiniCard title={isTeamView ? "Team Adherence Met" : "Adherence Complete"} value={displayStats.adherenceCompleteCount} subtext="Goal Met" color={colors.complete} showIndicator largeFonts /></Grid>
            <Grid size={4}><MiniCard title={isTeamView ? "Team Adherence Miss" : "Adherence Incomplete"} value={displayStats.adherenceIncompleteCount} subtext="Below Target" color={colors.incomplete} showIndicator largeFonts /></Grid>
          </Grid>
        )}

        {/* 2. Calendar Section */}
        <Paper sx={{ p: 1.5, mb: 2.5, bgcolor: isDark ? 'rgba(0,0,0,0.2)' : '#fff', border: isDark ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <Typography key={day} variant="caption" align="center" sx={{ fontSize: 9, fontWeight: 900, opacity: 0.5, pb: 0.5 }}>{day}</Typography>
            ))}
            
            {Array.from({ length: allDays[0]?.day() || 0 }).map((_, i) => (
              <Box key={`empty-${i}`} />
            ))}

            {allDays.map((d) => {
              const isBusiness = d.day() !== 0 && d.day() !== 6;
              const schedule = daySchedules.find(s => s.date.isSame(d, 'day'));
              const teamSummary = teamAdminStats?.daySummaries.find(s => s.date.isSame(d, 'day'));
              const isToday = d.isSame(dayjs(), 'day');
              
              let circleColor = 'transparent';
              let textColor = isDark ? '#fff' : '#333';
              let dayBg = 'transparent';
              let teamLabel = null;

              if (!isBusiness) {
                textColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)';
              } else if (schedule?.isFuture && !isTeamView) {
                dayBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)';
                textColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)';
                if (activeAdminTab === 'homeOffice' && schedule?.homeType === 'available') {
                  circleColor = colors.available;
                  textColor = '#000';
                }
              } else if (isTeamView && teamSummary) {
                 dayBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)';
                 if (activeAdminTab === 'homeOffice') {
                    circleColor = teamSummary.home > teamSummary.office ? colors.home : colors.office;
                    teamLabel = `${teamSummary.home}/${teamRfcs.length}`;
                 } else if (activeAdminTab === 'attendance') {
                    circleColor = teamSummary.attendance > teamSummary.absence ? colors.attendance : colors.absence;
                    teamLabel = `${teamSummary.attendance}/${teamRfcs.length}`;
                 } else if (activeAdminTab === 'adherence') {
                    circleColor = teamSummary.complete > teamSummary.incomplete ? colors.complete : colors.incomplete;
                    teamLabel = `${teamSummary.complete}/${teamRfcs.length}`;
                 }
                 textColor = '#fff';
              } else {
                // Past/Current day shading based on active tab
                if (activeAdminTab === 'homeOffice') {
                  if (schedule?.homeType === 'home') circleColor = colors.home;
                  if (schedule?.homeType === 'office') circleColor = colors.office;
                } else if (activeAdminTab === 'attendance') {
                  if (schedule?.attType === 'attendance') circleColor = colors.attendance;
                  if (schedule?.attType === 'absence') circleColor = colors.absence;
                } else if (activeAdminTab === 'adherence') {
                  if (schedule?.adhType === 'complete') circleColor = colors.complete;
                  if (schedule?.adhType === 'incomplete') circleColor = colors.incomplete;
                }
              }

              const dayContent = (
                <Box 
                  sx={{ 
                    height: 44,
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center',
                    bgcolor: dayBg,
                    borderRadius: 1,
                    border: isToday ? `1px solid ${theme.palette.primary.main}` : 'none',
                    position: 'relative'
                  }}
                >
                  <Box 
                    sx={{ 
                      width: 28, 
                      height: 28, 
                      borderRadius: '50%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      bgcolor: circleColor,
                      color: circleColor !== 'transparent' ? (circleColor === '#b9e04d' ? '#000' : '#fff') : textColor,
                      fontSize: 11,
                      fontWeight: 900,
                      zIndex: 2,
                      mb: teamLabel ? 0.2 : 0
                    }}
                  >
                    {d.date()}
                  </Box>
                  {teamLabel && (
                    <Typography variant="caption" sx={{ fontSize: 8, fontWeight: 900, opacity: 0.8 }}>
                        {teamLabel}
                    </Typography>
                  )}
                  {isToday && !teamLabel && (
                    <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: theme.palette.primary.main, position: 'absolute', bottom: 2 }} />
                  )}
                </Box>
              );

              return (
                <React.Fragment key={d.toISOString()}>
                  {(activeAdminTab === 'adherence' && isBusiness && !schedule?.isFuture && !isTeamView) ? (
                    <MuiTooltip 
                      title={<AdherenceTooltip day={d} rfc={currentUser.rfc} isComplete={schedule?.adhType === 'complete'} />}
                      arrow
                      placement="top"
                      slotProps={{
                        popper: {
                          modifiers: [
                            {
                              name: 'flip',
                              options: {
                                fallbackPlacements: ['bottom', 'right', 'left'],
                              },
                            },
                            {
                              name: 'preventOverflow',
                              options: {
                                boundary: 'viewport',
                              },
                            },
                          ],
                        },
                        tooltip: {
                          sx: {
                            bgcolor: 'transparent',
                            p: 0,
                            boxShadow: 'none',
                            maxWidth: 'none'
                          }
                        }
                      }}
                    >
                      {dayContent}
                    </MuiTooltip>
                  ) : dayContent}
                </React.Fragment>
              );
            })}
          </Box>
        </Paper>

        {/* 3. Bottom Small Indicators */}
        <Box sx={{ display: 'flex', gap: 1.5, minHeight: 80 }}>
          <MiniCard 
            title="Tenure" 
            value={stats.tenure} 
            subtext="Company Time" 
            color={theme.palette.primary.main} 
            largeFonts
          />
          <MiniCard 
            title="Vacation Bal" 
            value={`${formatValue(stats.vacationDays)}d`} 
            subtext="Available" 
            color={theme.palette.secondary.main} 
            largeFonts
          />
          <MiniCard 
            title="AI Projects" 
            value={Math.floor((dayjs().unix() % 10) + 1)} 
            subtext="Implementation" 
            color="#B9E04D" 
            largeFonts
          />
        </Box>
      </Box>
    );
  }

  // Fallback for other roles or non-standard agents
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid rgba(185, 224, 77, 0.2)', pb: 1, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 300, fontSize: 18 }}>
          Operational KPIs - <Box component="span" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>{currentUser.serviceDesk} Team</Box>
        </Typography>
      </Box>

      <Grid container spacing={2.5}>
        {/* Row 1: Primary KPIs */}
        <Grid size={3}><MetricCard title="Global QA" value={`${formatValue(stats.qa)}%`} icon={<Award size={24} />} color="secondary.main" /></Grid>
        <Grid size={3}><MetricCard title="Closed Rate" value={`${formatValue((stats.closedCases/stats.openedCases)*100)}%`} icon={<TrendingUp size={24} />} color="primary.main" /></Grid>
        <Grid size={3}><MetricCard title="NSAT Info" value={formatValue(stats.nsatInfo, true)} icon={<Smile size={24} />} color="primary.main" /></Grid>
        <Grid size={3}><MetricCard title="Adherence" value={`${formatValue(stats.adherence)}%`} icon={<AlertCircle size={24} />} color="secondary.main" /></Grid>

        {/* Row 2: Main Data Grid + Side Stats */}
        <Grid size={9}>
          <Paper sx={{ p: 3, height: 400 }}>
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, mb: 2, display: 'block' }}>
              Historical Performance
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
              <BarChart data={[
                { name: 'Opened', val: stats.openedCases },
                { name: 'Closed', val: stats.closedCases },
                { name: 'Target', val: 100 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.palette.divider} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDark ? 'rgba(0, 8, 20, 0.95)' : '#fff',
                    border: `1px solid ${theme.palette.primary.main}33`,
                    borderRadius: 4,
                    fontSize: 18,
                    fontWeight: 600,
                    zIndex: 100
                  }}
                  itemStyle={{ fontSize: 16 }}
                  labelStyle={{ fontSize: 16, marginBottom: 4, fontWeight: 700 }}
                  formatter={(val: any, name: string) => [formatValue(val, ['Opened', 'Closed'].includes(name)), name]}
                />
                <Bar dataKey="val" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} barSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid size={3}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: 400 }}>
            <MiniCard 
              title="Home Office" 
              value={`${formatValue((stats.homeOffice.workedHome / (stats.homeOffice.workedHome + stats.homeOffice.workedOffice)) * 100)}%`} 
              subtext="Days Worked from Home" 
              color={theme.palette.primary.main} 
              bgColor="rgba(11, 160, 175, 0.1)"
            />
            <MiniCard 
              title="Attendance" 
              value={stats.absences.toString().padStart(2, '0')} 
              subtext="Current Month" 
              color={theme.palette.primary.main} 
              bgColor="rgba(11, 160, 175, 0.05)"
            />
            <MiniCard 
              title="Vacations" 
              value={`${stats.vacationDays}d`} 
              subtext="Available Days" 
              color={theme.palette.secondary.main} 
              bgColor="rgba(0, 30, 96, 0.1)"
            />
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

const Chip: React.FC<{ label: string; component?: any; sx?: any }> = ({ label, component, sx }) => {
  const theme = useTheme();
  return (
    <Box component={component} sx={{ 
      px: 1.5, py: 0.5, borderRadius: 10, fontSize: '0.75rem', fontWeight: 700,
      bgcolor: theme.palette.primary.main, color: '#fff', ...sx 
    }}>
      {label}
    </Box>
  );
}

export default AgentView;
