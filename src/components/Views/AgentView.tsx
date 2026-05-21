
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
import { METRICS_DATA, User, UserMetrics, getFilteredMetrics, generateHistoricalData } from '../../data/mockData';
import { fetchOpenedCases, fetchIncomingCalls, IncomingCallRow, fetchQA, QARow, fetchNSAT, NSATRow, fetchStillOpenCases, StillOpenRow, fetchClosedCases, ClosedCaseRow } from '../../services/apiService';
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

// ─── Custom tooltip for Opened Cases / Closed Cases breakdown ────────────────
// Shows Information & Complaint sub-counts beneath the main value.
// Works for both the single-indicator chart (agent/leader) and the management
// chart (Team Average + Member Individual).
const CasesTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: any;
  // Which indicators are relevant (one or two for agent, or the currentIndicator for management)
  indicators: string[];
  // management=true means the lines are keyed "Team Average" / "Member Individual"
  isManagement?: boolean;
  currentIndicator?: string;
  selectedTeamMember?: string | null;
  isDark?: boolean;
  primaryColor?: string;
  hierarchy?: string;
}> = ({ active, payload, indicators, isManagement, currentIndicator, selectedTeamMember, isDark, primaryColor, hierarchy }) => {
  const theme = useTheme();
  const primary = primaryColor || theme.palette.primary.main;
  if (!active || !payload || payload.length === 0) return null;

  const pt = payload[0].payload;
  const dateLabel = (() => {
    const d = dayjs(pt.fullDate || pt.name);
    if (!d.isValid()) return pt.name;
    if (hierarchy === 'day')   return d.format('DD MMMM YYYY');
    if (hierarchy === 'week')  return d.format('[Week] ww, YYYY');
    if (hierarchy === 'month') return d.format('MMMM YYYY');
    return d.format('YYYY');
  })();

  const containerStyle: React.CSSProperties = {
    backgroundColor: isDark ? 'rgba(0, 8, 20, 0.95)' : '#fff',
    border: `2px solid ${primary}`,
    borderRadius: 8,
    padding: '10px 14px',
    fontSize: 14,
    fontWeight: 700,
    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    minWidth: 200,
  };
  const labelStyle: React.CSSProperties = {
    color: primary,
    fontWeight: 800,
    fontSize: 15,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: '1px solid rgba(128,128,128,0.2)',
  };
  const rowStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 16, padding: '2px 0' };
  const subRowStyle: React.CSSProperties = { ...rowStyle, opacity: 0.7, fontSize: 12, paddingLeft: 10 };
  const valStyle: React.CSSProperties = { fontFamily: '"JetBrains Mono", monospace', fontWeight: 900 };

  const formatVal = (v: any) => (v == null ? '—' : String(Number(v.toFixed ? v.toFixed(1) : v)));

  // Determine which indicators to show breakdown for
  const showOpenedBreakdown = (isManagement ? currentIndicator === 'Opened Cases' : indicators.includes('Opened Cases'));
  const showClosedBreakdown = (isManagement ? currentIndicator === 'Closed Cases' : indicators.includes('Closed Cases'));

  return (
    <div style={containerStyle}>
      <div style={labelStyle}>{dateLabel}</div>
      {payload.map((p: any, i: number) => {
        const color = p.color || primary;
        const name  = p.name as string;
        const val   = p.value;

        // For management chart: determine if this line carries an Opened or Closed breakdown
        const lineIsOpened = isManagement ? showOpenedBreakdown : name === 'Opened Cases';
        const lineIsClosed = isManagement ? showClosedBreakdown : name === 'Closed Cases';
        const isMember = name === 'Member Individual';

        // Select the right breakdown fields
        const infoKey      = isMember ? '_mOpenedInfo'      : '_openedInfo';
        const complaintKey = isMember ? '_mOpenedComplaint' : '_openedComplaint';
        const cInfoKey     = isMember ? '_mClosedInfo'      : '_closedInfo';
        const cComplaintKey= isMember ? '_mClosedComplaint' : '_closedComplaint';

        return (
          <React.Fragment key={i}>
            <div style={rowStyle}>
              <span style={{ color }}>{name}</span>
              <span style={{ ...valStyle, color }}>{formatVal(val)}</span>
            </div>
            {(lineIsOpened) && (
              <>
                <div style={subRowStyle}>
                  <span>↳ Information</span>
                  <span style={valStyle}>{pt[infoKey] ?? 0}</span>
                </div>
                <div style={subRowStyle}>
                  <span>↳ Complaint</span>
                  <span style={valStyle}>{pt[complaintKey] ?? 0}</span>
                </div>
              </>
            )}
            {(lineIsClosed) && (
              <>
                <div style={subRowStyle}>
                  <span>↳ Information</span>
                  <span style={valStyle}>{pt[cInfoKey] ?? 0}</span>
                </div>
                <div style={subRowStyle}>
                  <span>↳ Complaint</span>
                  <span style={valStyle}>{pt[cComplaintKey] ?? 0}</span>
                </div>
              </>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface AgentViewProps {
  member?: User | null;
}

const AgentView: React.FC<AgentViewProps> = ({ member }) => {
  const { user, users, managementTab, startDate, endDate } = useAuth();
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
  // Real cases from Neon (filtered to this user/team's compass IDs)
  const [dbCases, setDbCases] = React.useState<any[] | null>(null);
  const dbOpenedCases = dbCases?.length ?? null;

  // Real Actividad rows from Neon, filtered to this user/team's CallPicker IDs
  const [dbActivity, setDbActivity] = React.useState<IncomingCallRow[] | null>(null);

  // Real QA rows from Neon, filtered to this user/team's QA IDs
  const [dbQA, setDbQA] = React.useState<QARow[] | null>(null);

  // Real NSAT rows from Neon, joined on this user/team's Compass IDs
  const [dbNSAT, setDbNSAT] = React.useState<NSATRow[] | null>(null);

  // Real closed cases from Cerrados (case_closed_by ↔ Compass)
  const [dbClosedCases, setDbClosedCases] = React.useState<ClosedCaseRow[] | null>(null);

  // Still Open Cases — team-wide CAC indicator. Same number for everyone in CAC.
  const [dbStillOpen, setDbStillOpen] = React.useState<StillOpenRow[] | null>(null);

  // ALL opened cases (no user filter). Powers the Backlog indicator's
  // denominator (avg opened cases in the last 3 expired months). Loaded
  // only when the scope is CAC.
  const [dbOpenedAll, setDbOpenedAll] = React.useState<any[] | null>(null);
  const [selectedDept, setSelectedDept] = React.useState<string>('All');

  // Team calculations for Management - moved up for dependency access
  const teamRfcs = React.useMemo(() => {
    let baseRfcs: string[] = [];
    if (currentUser?.role === 'Manager' || currentUser?.role === 'Executive') {
      baseRfcs = Object.values(users)
        .filter(u => u.role === 'Agent' || u.role === 'Leader')
        .map(u => u.rfc);
    } else {
      baseRfcs = currentUser?.team || [];
    }

    if (selectedDept !== 'All') {
      return baseRfcs.filter(rfc => users[rfc]?.serviceDesk === selectedDept);
    }
    return baseRfcs;
  }, [currentUser, selectedDept]);

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

      // Four independent joins on the Roster:
      //  - Compass    → Abiertos."case_owner"                  (Opened/Closed cases, NSAT)
      //  - CallPicker → Actividad."User"                        (Incoming calls, source 1)
      //  - Genesys    → Rendimiento_Agente."nombre_del_agente"  (Incoming calls, source 2 — summed)
      //  - QA         → QA."Agente" / QA_Premium."Agent"        (QA records)
      let compassIds: string[] = [];
      let callPickerIds: string[] = [];
      let genesysIds: string[] = [];
      let qaIds: string[] = [];
      if (currentUser.role === 'Agent') {
        if (currentUser.compass)    compassIds    = [currentUser.compass];
        if (currentUser.callPicker) callPickerIds = [currentUser.callPicker];
        if (currentUser.genesys)    genesysIds    = [currentUser.genesys];
        if (currentUser.qa)         qaIds         = [currentUser.qa];
      } else if (isManagement) {
        compassIds    = teamRfcs.map(rfc => users[rfc]?.compass   ).filter((c): c is string => !!c);
        callPickerIds = teamRfcs.map(rfc => users[rfc]?.callPicker).filter((c): c is string => !!c);
        genesysIds    = teamRfcs.map(rfc => users[rfc]?.genesys   ).filter((c): c is string => !!c);
        qaIds         = teamRfcs.map(rfc => users[rfc]?.qa        ).filter((c): c is string => !!c);
      }

      // Opened/Closed cases via Abiertos. Two related needs:
      //  - dbCases   = user-filtered, within the user's selected date range.
      //                Powers per-agent Opened/Closed/Closed Cases Rate.
      //  - dbOpenedAll = team-wide, EXTENDED 3 months before startDate so the
      //                Backlog denominator (avg opened in the 3 expired
      //                months PRIOR to each bucket) has full months to read.
      //                Without the extension, a narrow user range (e.g.
      //                "prev month → current month") would leave the prior
      //                months empty and the ratio would explode.
      const scopeIsCAC =
        currentUser.serviceDesk === 'CAC' ||
        (isManagement && selectedDept === 'CAC');
      const dbOpenedAllStart = startDate.subtract(3, 'month').startOf('month');

      if (scopeIsCAC) {
        // Two parallel fetches: narrow (for the user) + extended (for Backlog).
        const [userCases, allCases] = await Promise.all([
          compassIds.length > 0 ? fetchOpenedCases(undefined, startDate, endDate) : Promise.resolve(null),
          fetchOpenedCases(undefined, dbOpenedAllStart, endDate),
        ]);
        setDbCases(userCases && compassIds.length > 0
          ? userCases.filter(c => compassIds.includes(c.case_owner))
          : null);
        setDbOpenedAll(allCases);
      } else if (compassIds.length > 0) {
        // Non-CAC scope: only the per-user fetch.
        const cases = await fetchOpenedCases(undefined, startDate, endDate);
        setDbCases(cases.filter(c => compassIds.includes(c.case_owner)));
        setDbOpenedAll(null);
      } else {
        setDbCases(null);
        setDbOpenedAll(null);
      }

      // NSAT survey rows via NSAT table (same Compass join as Abiertos)
      if (compassIds.length > 0) {
        const nsat = await fetchNSAT(compassIds, startDate, endDate);
        setDbNSAT(nsat);
      } else {
        setDbNSAT(null);
      }

      // Incoming calls via Actividad + Rendimiento_Agente (summed)
      if (callPickerIds.length > 0 || genesysIds.length > 0) {
        const activity = await fetchIncomingCalls(callPickerIds, startDate, endDate, genesysIds);
        setDbActivity(activity);
      } else {
        setDbActivity(null);
      }

      // QA via QA table
      if (qaIds.length > 0) {
        const qa = await fetchQA(qaIds, startDate, endDate);
        setDbQA(qa);
      } else {
        setDbQA(null);
      }

      // Still Open Cases — CAC team-wide. Same scopeIsCAC computed above.
      if (scopeIsCAC) {
        const stillOpen = await fetchStillOpenCases(startDate, endDate);
        setDbStillOpen(stillOpen);
      } else {
        setDbStillOpen(null);
      }

      // Closed Cases from Cerrados (case_closed_by ↔ Compass).
      // Always fetched whenever we have compass IDs — not CAC-gated.
      if (compassIds.length > 0) {
        const closed = await fetchClosedCases(compassIds, startDate, endDate);
        setDbClosedCases(closed);
      } else {
        setDbClosedCases(null);
      }
    };
    loadDbData();
  }, [currentUser, startDate, endDate, teamRfcs, isManagement, selectedDept]);

  const stats = React.useMemo(() => {
    if (!currentUser) return null;
    
    let baseStats: UserMetrics;
    
    if (isManagement) {
      const rfcsToAggregate = teamRfcs;
      
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
  }, [currentUser, startDate, endDate, dbCases, teamRfcs, isManagement]);

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
    const myLeader = Object.values(users).find(u => u.role === 'Leader' && u.serviceDesk === currentUser.serviceDesk);
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

  // Indicators that are now sourced from the Neon DB instead of mock data.
  // As more tables become available in Neon, add their indicator names here.
  const DB_INDICATORS = React.useMemo(
    () => new Set(['Opened Cases', 'Closed Cases', 'Closed Cases Rate', 'Incoming Calls', 'QA', 'NSAT', 'NSAT Information', 'NSAT Claims', 'Still Open Cases', 'Backlog', '% First Contact Resolution']),
    []
  );

  // Bucket the real cases + activity by the same hierarchy keys used below ('YYYY-MM-DD', 'YYYY-MM', etc.)
  // Cases contribute Opened/Closed/Rate; activity rows contribute Incoming Calls (SUM of "Answered Calls").
  const dbTrendByBucket = React.useMemo(() => {
    type Bucket = {
      'Opened Cases': number;
      'Opened Cases Information': number;
      'Opened Cases Complaint': number;
      'Closed Cases': number;
      'Closed Cases Information': number;
      'Closed Cases Complaint': number;
      'Closed Cases Rate': number;
      'Incoming Calls': number;
      'Still Open Cases': number;
    };
    const out: Record<string, Bucket> = {};
    const formatStr = hierarchy === 'day' ? 'YYYY-MM-DD' :
                     hierarchy === 'week' ? 'YYYY-ww' :
                     hierarchy === 'month' ? 'YYYY-MM' : 'YYYY';
    const FMT = 'M/D/YYYY h:mm A';

    const ensure = (k: string): Bucket => {
      if (!out[k]) out[k] = {
        'Opened Cases': 0, 'Opened Cases Information': 0, 'Opened Cases Complaint': 0,
        'Closed Cases': 0, 'Closed Cases Information': 0, 'Closed Cases Complaint': 0,
        'Closed Cases Rate': 0, 'Incoming Calls': 0, 'Still Open Cases': 0
      };
      return out[k];
    };

    const REASON_INFO      = 'Information & Assistance requests';
    const REASON_COMPLAINT = 'Complaint';

    // Abiertos → Opened Cases counts per bucket (+ Information / Complaint breakdown).
    // Closed Cases now come from the Cerrados table (see block below).
    if (dbCases) {
      dbCases.forEach(c => {
        const reason = c?.contact_reason_1 as string | null | undefined;
        const opened = c?.datetime_opened ? dayjs(c.datetime_opened, FMT) : null;
        if (opened && opened.isValid() && opened.isBetween(startDate, endDate, 'day', '[]')) {
          const k = opened.format(formatStr);
          ensure(k)['Opened Cases']++;
          if (reason === REASON_INFO)      ensure(k)['Opened Cases Information']++;
          if (reason === REASON_COMPLAINT) ensure(k)['Opened Cases Complaint']++;
        }
      });
    }

    // Cerrados → Closed Cases counts per bucket (+ Information / Complaint breakdown).
    // Join: case_closed_by ↔ Roster.Compass.  Date: datetime_closed (varchar M/D/YYYY h:mm A).
    if (dbClosedCases) {
      dbClosedCases.forEach(c => {
        const d = dayjs(c.dateStr); // already YYYY-MM-DD from the backend
        if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
        const k = d.format(formatStr);
        ensure(k)['Closed Cases']++;
        if (c.contactReason1 === REASON_INFO)      ensure(k)['Closed Cases Information']++;
        if (c.contactReason1 === REASON_COMPLAINT) ensure(k)['Closed Cases Complaint']++;
      });
    }

    // Closed Cases Rate = Closed / Opened per bucket (computed after both loops).
    Object.values(out).forEach(b => {
      b['Closed Cases Rate'] = b['Opened Cases'] > 0
        ? Number(((b['Closed Cases'] / b['Opened Cases']) * 100).toFixed(1))
        : 0;
    });

    // % First Contact Resolution: of cases in Cerrados closed in this bucket,
    // what fraction has opened_date on the same calendar day as datetime_closed.
    //   numerator   = count where openedDateStr === dateStr
    //   denominator = total closed in bucket
    // Buckets with no closed cases stay out of fcrByBucket → null on chart.
    const fcrByBucket: Record<string, number> = {};
    if (dbClosedCases) {
      const acc: Record<string, { sameDay: number; total: number }> = {};
      dbClosedCases.forEach(c => {
        const d = dayjs(c.dateStr);
        if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
        const k = d.format(formatStr);
        if (!acc[k]) acc[k] = { sameDay: 0, total: 0 };
        acc[k].total++;
        if (c.openedDateStr && c.openedDateStr === c.dateStr) acc[k].sameDay++;
      });
      Object.entries(acc).forEach(([k, { sameDay, total }]) => {
        if (total > 0) fcrByBucket[k] = Number(((sameDay / total) * 100).toFixed(1));
      });
    }

    // Actividad → SUM of "Answered Calls" per bucket.
    // Use the pre-parsed dateStr ("YYYY-MM-DD") to bucket — parsing dateMs through
    // dayjs would shift by the browser's TZ offset and put e.g. 2026-03-15 into
    // the 2026-03-14 bucket for users west of UTC.
    if (dbActivity) {
      dbActivity.forEach(a => {
        const d = dayjs(a.dateStr); // parses as local-midnight of that calendar day
        if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
        ensure(d.format(formatStr))['Incoming Calls'] += a.answeredCalls;
      });
    }

    // QA → AVERAGE of per-evaluation scores per bucket.
    //   Per-evaluation score (0-100) is computed server-side from the 10
    //   weighted criteria + the Error Crítico all-or-nothing penalty.
    //   Only buckets with at least one record get a QA value; the rest stay
    //   undefined so the line chart skips them (no spurious 0 points).
    const qaByBucket: Record<string, number> = {};
    if (dbQA) {
      const qaAcc: Record<string, { sum: number; count: number }> = {};
      dbQA.forEach(q => {
        const d = dayjs(q.dateStr);
        if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
        const k = d.format(formatStr);
        if (!qaAcc[k]) qaAcc[k] = { sum: 0, count: 0 };
        qaAcc[k].sum += q.score;
        qaAcc[k].count++;
      });
      Object.entries(qaAcc).forEach(([k, { sum, count }]) => {
        qaByBucket[k] = Number((sum / count).toFixed(1));
      });
    }

    // NSAT Index per bucket. NPS-style: per question Q, score = % promoters
    // (responses 9 or 10) minus % detractors (1-6), with 7/8 passive. Then
    // average across the three questions. Each question's denominator counts
    // only rows where THAT question has a numeric answer. If all three
    // questions have zero responses in a bucket, the bucket stays out →
    // line chart shows a gap (same as QA). The integer is in [-100, +100].
    //
    // We compute the same formula three times over different row subsets:
    //   - `nsatByBucket`        — all NSAT rows
    //   - `nsatInfoByBucket`    — only contact_reason_1 = "Information & Assistance requests"
    //   - `nsatClaimsByBucket`  — only contact_reason_1 = "Complaint"
    const buildNsatIndex = (rows: NSATRow[] | null): Record<string, number> => {
      const out: Record<string, number> = {};
      if (!rows || rows.length === 0) return out;
      type Q = { p: number; d: number; t: number };
      const acc: Record<string, [Q, Q, Q]> = {};
      rows.forEach(n => {
        const d = dayjs(n.dateStr);
        if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
        const k = d.format(formatStr);
        if (!acc[k]) acc[k] = [{ p: 0, d: 0, t: 0 }, { p: 0, d: 0, t: 0 }, { p: 0, d: 0, t: 0 }];
        [n.q1, n.q2, n.q3].forEach((v, i) => {
          if (v == null || !Number.isFinite(v)) return;
          acc[k][i].t++;
          if (v >= 9) acc[k][i].p++;
          else if (v <= 6) acc[k][i].d++;
        });
      });
      Object.entries(acc).forEach(([k, qs]) => {
        if (qs.every(q => q.t === 0)) return;
        const perQ = qs.map(q => q.t > 0 ? ((q.p - q.d) / q.t) * 100 : 0);
        out[k] = Math.round((perQ[0] + perQ[1] + perQ[2]) / 3);
      });
      return out;
    };
    const nsatByBucket       = buildNsatIndex(dbNSAT);
    const nsatInfoByBucket   = buildNsatIndex(dbNSAT?.filter(n => n.contactReason1 === 'Information & Assistance requests') ?? null);
    const nsatClaimsByBucket = buildNsatIndex(dbNSAT?.filter(n => n.contactReason1 === 'Complaint') ?? null);

    // Still Open Cases is a SNAPSHOT metric (current backlog), not a flow.
    // Summing across days would be meaningless — a case still open on Mon and
    // Tue would be counted twice. Instead:
    //   1. Count rows per day (daily snapshot size).
    //   2. For each bucket (week/month/year), use the snapshot of the LATEST
    //      day in that bucket that has data. For "day" hierarchy each bucket
    //      is one date so this collapses to the same daily count.
    const stillOpenDaily: Record<string, number> = {};
    const stillOpenLatestPerBucket: Record<string, string> = {};
    if (dbStillOpen) {
      dbStillOpen.forEach(s => {
        const d = dayjs(s.dateStr);
        if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
        stillOpenDaily[s.dateStr] = (stillOpenDaily[s.dateStr] || 0) + 1;
      });
      // Keep the latest dateStr seen per bucket key; lexicographic compare on
      // YYYY-MM-DD is equivalent to date compare so no parsing needed.
      Object.entries(stillOpenDaily).forEach(([dateStr, count]) => {
        const k = dayjs(dateStr).format(formatStr);
        if (!stillOpenLatestPerBucket[k] || dateStr > stillOpenLatestPerBucket[k]) {
          stillOpenLatestPerBucket[k] = dateStr;
          ensure(k)['Still Open Cases'] = count;
        }
      });
    }

    // Backlog = Still Open Cases (snapshot of latest day in bucket) divided
    // by the average monthly Opened Cases of the 3 most recently EXPIRED
    // months (whose last-day is strictly before the snapshot date). Displayed
    // as an integer percentage. If the 3 prior months have no data combined,
    // the bucket stays out of backlogByBucket → null on the chart.
    const backlogByBucket: Record<string, number> = {};
    if (dbStillOpen && dbOpenedAll && dbOpenedAll.length > 0) {
      // Monthly team-wide opened-cases counts (no user filter).
      const openedMonthly: Record<string, number> = {};
      dbOpenedAll.forEach(c => {
        const s: string = c?.datetime_opened || '';
        const parts = s.split(' ')[0].split('/');
        if (parts.length !== 3) return;
        const y = parts[2];
        const m = parts[0].padStart(2, '0');
        const key = `${y}-${m}`;
        openedMonthly[key] = (openedMonthly[key] || 0) + 1;
      });

      const expiredMonthsBefore = (refDateStr: string): string[] => {
        const ref = dayjs(refDateStr);
        if (!ref.isValid()) return [];
        const out: string[] = [];
        let m = ref.startOf('month').subtract(1, 'month');
        let safety = 0;
        while (out.length < 3 && safety < 36) {
          safety++;
          if (m.endOf('month').isBefore(ref, 'day')) out.push(m.format('YYYY-MM'));
          m = m.subtract(1, 'month');
        }
        return out;
      };

      Object.entries(stillOpenLatestPerBucket).forEach(([bucketKey, refDate]) => {
        const so = stillOpenDaily[refDate];
        const priors = expiredMonthsBefore(refDate);
        const sum = priors.reduce((acc, m) => acc + (openedMonthly[m] || 0), 0);
        if (sum <= 0) return; // null → gap
        const avg = sum / 3;
        backlogByBucket[bucketKey] = Math.round((so / avg) * 100);
      });
    }

    return { out, qaByBucket, nsatByBucket, nsatInfoByBucket, nsatClaimsByBucket, backlogByBucket, fcrByBucket };
  }, [dbCases, dbClosedCases, dbActivity, dbQA, dbNSAT, dbStillOpen, dbOpenedAll, hierarchy, startDate, endDate]);

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

    // Merge in any DB buckets that don't have a corresponding mock bucket
    Object.keys(dbTrendByBucket.out).forEach(k => { if (!groups[k]) groups[k] = []; });
    Object.keys(dbTrendByBucket.qaByBucket).forEach(k => { if (!groups[k]) groups[k] = []; });
    Object.keys(dbTrendByBucket.nsatByBucket).forEach(k => { if (!groups[k]) groups[k] = []; });
    Object.keys(dbTrendByBucket.nsatInfoByBucket).forEach(k => { if (!groups[k]) groups[k] = []; });
    Object.keys(dbTrendByBucket.nsatClaimsByBucket).forEach(k => { if (!groups[k]) groups[k] = []; });
    Object.keys(dbTrendByBucket.backlogByBucket).forEach(k => { if (!groups[k]) groups[k] = []; });
    Object.keys(dbTrendByBucket.fcrByBucket).forEach(k => { if (!groups[k]) groups[k] = []; });

    return Object.entries(groups).map(([key, items]) => {
      const entry: any = {
        name: key,
        fullDate: items[0]?.date || key,
        count: items.length
      };

      selectedIndicators.forEach(indicator => {
        // QA, NSAT and Backlog are computed indicators that should leave a
        // gap when there's no source data in the bucket — null lets Recharts
        // skip the point. (These three opt into connectNulls below.)
        if (indicator === 'QA') {
          const v = dbTrendByBucket.qaByBucket[key];
          entry[indicator] = v !== undefined ? v : null;
          return;
        }
        if (indicator === 'NSAT') {
          const v = dbTrendByBucket.nsatByBucket[key];
          entry[indicator] = v !== undefined ? v : null;
          return;
        }
        if (indicator === 'NSAT Information') {
          const v = dbTrendByBucket.nsatInfoByBucket[key];
          entry[indicator] = v !== undefined ? v : null;
          return;
        }
        if (indicator === 'NSAT Claims') {
          const v = dbTrendByBucket.nsatClaimsByBucket[key];
          entry[indicator] = v !== undefined ? v : null;
          return;
        }
        if (indicator === 'Backlog') {
          const v = dbTrendByBucket.backlogByBucket[key];
          entry[indicator] = v !== undefined ? v : null;
          return;
        }
        if (indicator === '% First Contact Resolution') {
          const v = dbTrendByBucket.fcrByBucket[key];
          entry[indicator] = v !== undefined ? v : null;
          return;
        }
        // Other DB-backed indicators: 0 is a legitimate count
        if (DB_INDICATORS.has(indicator)) {
          entry[indicator] = dbTrendByBucket.out[key]?.[indicator as keyof typeof dbTrendByBucket.out[string]] ?? 0;
          return;
        }
        // Mock-backed indicator: same averaging as before
        if (items.length === 0) {
          entry[indicator] = 0;
          return;
        }
        const sum = items.reduce((acc, item) => acc + (item[indicator] || 0), 0);
        const isInt = ['NSAT Information', 'NSAT Claims', 'Incoming Calls', 'Outgoing Calls'].includes(indicator);
        entry[indicator] = isInt ? Math.round(sum / items.length) : Number((sum / items.length).toFixed(1));
      });

      // Always inject Opened/Closed case breakdown so the tooltip can show
      // Information & Complaint sub-counts regardless of which indicator is
      // currently selected (these fields are NOT mapped to any <Line>).
      const ob = dbTrendByBucket.out[key];
      entry['_openedInfo']      = ob?.['Opened Cases Information'] ?? 0;
      entry['_openedComplaint'] = ob?.['Opened Cases Complaint']   ?? 0;
      entry['_closedInfo']      = ob?.['Closed Cases Information'] ?? 0;
      entry['_closedComplaint'] = ob?.['Closed Cases Complaint']   ?? 0;

      return entry;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [rawHistoricalData, startDate, endDate, hierarchy, selectedIndicators, dbTrendByBucket, DB_INDICATORS]);

  // Summary stat shown in the line chart header (one badge per selected indicator).
  //   COUNT  — Opened/Closed Cases, Incoming Calls → SUM of trendData values
  //   NSAT   — NSAT / NSAT Information / NSAT Claims → NPS index over ALL rows in range
  //   AVG    — everything else → average of non-null trendData bucket values
  const indicatorSummary = React.useMemo(() => {
    const COUNT_SET = new Set(['Opened Cases', 'Closed Cases', 'Incoming Calls']);
    const NSAT_SET  = new Set(['NSAT', 'NSAT Information', 'NSAT Claims']);
    const PCT_SET   = new Set(['QA', 'Backlog', '% First Contact Resolution', 'Closed Cases Rate',
                                'Performance', 'Productivity', 'Bonus']);

    return selectedIndicators.map(indicator => {
      if (COUNT_SET.has(indicator)) {
        const sum = trendData.reduce((acc, pt) => {
          const v = pt[indicator];
          return acc + (typeof v === 'number' ? v : 0);
        }, 0);
        return { indicator, value: sum, decimals: 0, suffix: '' };
      }

      if (NSAT_SET.has(indicator)) {
        const reasonFilter =
          indicator === 'NSAT Information' ? 'Information & Assistance requests' :
          indicator === 'NSAT Claims'      ? 'Complaint' : null;
        const rows = (dbNSAT || []).filter(n => {
          const d = dayjs(n.dateStr);
          if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return false;
          return reasonFilter === null || n.contactReason1 === reasonFilter;
        });
        if (rows.length === 0) return { indicator, value: null, decimals: 0, suffix: '' };
        type Q = { p: number; d: number; t: number };
        const qs: [Q, Q, Q] = [{ p:0,d:0,t:0 }, { p:0,d:0,t:0 }, { p:0,d:0,t:0 }];
        rows.forEach(n => {
          [n.q1, n.q2, n.q3].forEach((v, i) => {
            if (v == null || !Number.isFinite(v)) return;
            qs[i].t++;
            if (v >= 9) qs[i].p++;
            else if (v <= 6) qs[i].d++;
          });
        });
        if (qs.every(q => q.t === 0)) return { indicator, value: null, decimals: 0, suffix: '' };
        const perQ = qs.map(q => q.t > 0 ? ((q.p - q.d) / q.t) * 100 : 0);
        return { indicator, value: Math.round((perQ[0] + perQ[1] + perQ[2]) / 3), decimals: 0, suffix: '' };
      }

      // Average of non-null bucket values
      const vals = trendData.map(pt => pt[indicator]).filter((v): v is number => typeof v === 'number');
      if (vals.length === 0) return { indicator, value: null, decimals: 1, suffix: '' };
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const suffix = PCT_SET.has(indicator) || indicator.startsWith('%') ? '%' : '';
      return { indicator, value: avg, decimals: 1, suffix };
    });
  }, [selectedIndicators, trendData, dbNSAT, startDate, endDate]);

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
        name: users[rfc]?.name.split(' ')[0] || rfc,
        fullName: users[rfc]?.name || rfc,
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

  // Per-bucket value of the currently-selected indicator for ONE selected
  // team member. Returns null when not applicable (no member selected, not in
  // a management view, or not a BD-backed indicator). Used as the second
  // line ('Member Individual') in the management line chart.
  // Team-wide indicators (Still Open Cases, Backlog) return null here —
  // aggregatedTrendData mirrors the team value in that case (per spec, the
  // individual line equals the team line for those indicators).
  const memberBuckets = React.useMemo(() => {
    if (!selectedTeamMember || !isManagement) return null;
    if (!DB_INDICATORS.has(currentIndicator)) return null;
    if (currentIndicator === 'Still Open Cases' || currentIndicator === 'Backlog') return null;

    const m = users[selectedTeamMember];
    if (!m) return null;

    const formatStr = hierarchy === 'day' ? 'YYYY-MM-DD' :
                     hierarchy === 'week' ? 'YYYY-ww' :
                     hierarchy === 'month' ? 'YYYY-MM' : 'YYYY';
    const FMT = 'M/D/YYYY h:mm A';
    const result: Record<string, number> = {};

    if (currentIndicator === 'Opened Cases' && dbCases) {
      dbCases.filter(c => c.case_owner === m.compass).forEach(c => {
        const d = c?.datetime_opened ? dayjs(c.datetime_opened, FMT) : null;
        if (d && d.isValid() && d.isBetween(startDate, endDate, 'day', '[]')) {
          const k = d.format(formatStr);
          result[k] = (result[k] || 0) + 1;
        }
      });
    } else if (currentIndicator === 'Closed Cases' && dbClosedCases) {
      dbClosedCases.filter(c => c.caseClosedBy === m.compass).forEach(c => {
        const d = dayjs(c.dateStr);
        if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
        result[d.format(formatStr)] = (result[d.format(formatStr)] || 0) + 1;
      });
    } else if (currentIndicator === 'Closed Cases Rate' && dbCases && dbClosedCases) {
      const op: Record<string, number> = {};
      const cl: Record<string, number> = {};
      dbCases.filter(c => c.case_owner === m.compass).forEach(c => {
        const o = c?.datetime_opened ? dayjs(c.datetime_opened, FMT) : null;
        if (o && o.isValid() && o.isBetween(startDate, endDate, 'day', '[]'))
          op[o.format(formatStr)] = (op[o.format(formatStr)] || 0) + 1;
      });
      dbClosedCases.filter(c => c.caseClosedBy === m.compass).forEach(c => {
        const d = dayjs(c.dateStr);
        if (d.isValid() && d.isBetween(startDate, endDate, 'day', '[]'))
          cl[d.format(formatStr)] = (cl[d.format(formatStr)] || 0) + 1;
      });
      Array.from(new Set([...Object.keys(op), ...Object.keys(cl)])).forEach(k => {
        result[k] = op[k] > 0 ? Number(((cl[k] || 0) / op[k] * 100).toFixed(1)) : 0;
      });
    } else if (currentIndicator === '% First Contact Resolution' && dbClosedCases) {
      const acc: Record<string, { sameDay: number; total: number }> = {};
      dbClosedCases.filter(c => c.caseClosedBy === m.compass).forEach(c => {
        const d = dayjs(c.dateStr);
        if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
        const k = d.format(formatStr);
        if (!acc[k]) acc[k] = { sameDay: 0, total: 0 };
        acc[k].total++;
        if (c.openedDateStr && c.openedDateStr === c.dateStr) acc[k].sameDay++;
      });
      Object.entries(acc).forEach(([k, { sameDay, total }]) => {
        if (total > 0) result[k] = Number(((sameDay / total) * 100).toFixed(1));
      });
    } else if (currentIndicator === 'Incoming Calls' && dbActivity) {
      dbActivity.filter(a => a.user === m.callPicker || a.user === m.genesys).forEach(a => {
        const d = dayjs(a.dateStr);
        if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
        const k = d.format(formatStr);
        result[k] = (result[k] || 0) + a.answeredCalls;
      });
    } else if (currentIndicator === 'QA' && dbQA) {
      const acc: Record<string, { sum: number; count: number }> = {};
      dbQA.filter(q => q.agente === m.qa).forEach(q => {
        const d = dayjs(q.dateStr);
        if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
        const k = d.format(formatStr);
        if (!acc[k]) acc[k] = { sum: 0, count: 0 };
        acc[k].sum += q.score;
        acc[k].count++;
      });
      Object.entries(acc).forEach(([k, { sum, count }]) => {
        result[k] = Number((sum / count).toFixed(1));
      });
    } else if ((currentIndicator === 'NSAT' || currentIndicator === 'NSAT Information' || currentIndicator === 'NSAT Claims') && dbNSAT) {
      const reasonFilter =
        currentIndicator === 'NSAT Information' ? 'Information & Assistance requests' :
        currentIndicator === 'NSAT Claims'      ? 'Complaint' :
        null;
      type Q = { p: number; d: number; t: number };
      const acc: Record<string, [Q, Q, Q]> = {};
      dbNSAT
        .filter(n => n.caseOwner === m.compass && (reasonFilter === null || n.contactReason1 === reasonFilter))
        .forEach(n => {
          const d = dayjs(n.dateStr);
          if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
          const k = d.format(formatStr);
          if (!acc[k]) acc[k] = [{ p: 0, d: 0, t: 0 }, { p: 0, d: 0, t: 0 }, { p: 0, d: 0, t: 0 }];
          [n.q1, n.q2, n.q3].forEach((v, i) => {
            if (v == null || !Number.isFinite(v)) return;
            acc[k][i].t++;
            if (v >= 9) acc[k][i].p++;
            else if (v <= 6) acc[k][i].d++;
          });
        });
      Object.entries(acc).forEach(([k, qs]) => {
        if (qs.every(q => q.t === 0)) return;
        const perQ = qs.map(q => q.t > 0 ? ((q.p - q.d) / q.t) * 100 : 0);
        result[k] = Math.round((perQ[0] + perQ[1] + perQ[2]) / 3);
      });
    }

    return result;
  }, [selectedTeamMember, isManagement, currentIndicator, users, dbCases, dbClosedCases, dbActivity, dbNSAT, dbQA, hierarchy, startDate, endDate, DB_INDICATORS]);

  const aggregatedTrendData = React.useMemo(() => {
    if (!isManagement) return [];
    const formatStr = hierarchy === 'day' ? 'YYYY-MM-DD' :
                     hierarchy === 'week' ? 'YYYY-ww' :
                     hierarchy === 'month' ? 'YYYY-MM' : 'YYYY';

    // BD-backed path: team value comes from dbTrendByBucket (already team-
    // aggregated since management roles fetch ALL team data), member value
    // from memberBuckets. The two team-wide CAC indicators (Still Open Cases
    // and Backlog) have no individual breakdown — when a member is selected
    // we mirror the team value into the individual line so both lines render
    // and the user sees explicitly that the metric is team-wide.
    if (DB_INDICATORS.has(currentIndicator)) {
      const teamValueOf = (key: string): number | null => {
        if (currentIndicator === 'QA')               return dbTrendByBucket.qaByBucket[key]         ?? null;
        if (currentIndicator === 'NSAT')             return dbTrendByBucket.nsatByBucket[key]       ?? null;
        if (currentIndicator === 'NSAT Information') return dbTrendByBucket.nsatInfoByBucket[key]   ?? null;
        if (currentIndicator === 'NSAT Claims')      return dbTrendByBucket.nsatClaimsByBucket[key] ?? null;
        if (currentIndicator === 'Backlog')          return dbTrendByBucket.backlogByBucket[key]    ?? null;
        if (currentIndicator === '% First Contact Resolution') return dbTrendByBucket.fcrByBucket[key] ?? null;
        const v = dbTrendByBucket.out[key]?.[currentIndicator as keyof typeof dbTrendByBucket.out[string]];
        return v !== undefined ? v : null;
      };

      const allKeys = new Set<string>([
        ...Object.keys(dbTrendByBucket.out),
        ...Object.keys(dbTrendByBucket.qaByBucket),
        ...Object.keys(dbTrendByBucket.nsatByBucket),
        ...Object.keys(dbTrendByBucket.nsatInfoByBucket),
        ...Object.keys(dbTrendByBucket.nsatClaimsByBucket),
        ...Object.keys(dbTrendByBucket.backlogByBucket),
        ...Object.keys(dbTrendByBucket.fcrByBucket),
      ]);

      // Pre-compute per-member case breakdown for the tooltip (Opened/Closed only)
      const FMT2 = 'M/D/YYYY h:mm A';
      const memberCompass = selectedTeamMember ? users[selectedTeamMember]?.compass : null;
      const memberBreakdown: Record<string, {
        'Opened Cases Information': number; 'Opened Cases Complaint': number;
        'Closed Cases Information': number; 'Closed Cases Complaint': number;
      }> = {};
      const REASON_INFO2      = 'Information & Assistance requests';
      const REASON_COMPLAINT2 = 'Complaint';
      if (memberCompass && currentIndicator === 'Opened Cases' && dbCases) {
        dbCases.filter(c => c.case_owner === memberCompass).forEach(c => {
          const reason = c?.contact_reason_1 as string | null | undefined;
          const opened = c?.datetime_opened ? dayjs(c.datetime_opened, FMT2) : null;
          if (opened && opened.isValid() && opened.isBetween(startDate, endDate, 'day', '[]')) {
            const k = opened.format(formatStr);
            if (!memberBreakdown[k]) memberBreakdown[k] = { 'Opened Cases Information': 0, 'Opened Cases Complaint': 0, 'Closed Cases Information': 0, 'Closed Cases Complaint': 0 };
            if (reason === REASON_INFO2)      memberBreakdown[k]['Opened Cases Information']++;
            if (reason === REASON_COMPLAINT2) memberBreakdown[k]['Opened Cases Complaint']++;
          }
        });
      }
      if (memberCompass && currentIndicator === 'Closed Cases' && dbClosedCases) {
        dbClosedCases.filter(c => c.caseClosedBy === memberCompass).forEach(c => {
          const d = dayjs(c.dateStr);
          if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
          const k = d.format(formatStr);
          if (!memberBreakdown[k]) memberBreakdown[k] = { 'Opened Cases Information': 0, 'Opened Cases Complaint': 0, 'Closed Cases Information': 0, 'Closed Cases Complaint': 0 };
          if (c.contactReason1 === REASON_INFO2)      memberBreakdown[k]['Closed Cases Information']++;
          if (c.contactReason1 === REASON_COMPLAINT2) memberBreakdown[k]['Closed Cases Complaint']++;
        });
      }

      return Array.from(allKeys).sort().map(key => {
        const teamVal = teamValueOf(key);
        const entry: any = { name: key, fullDate: key, 'Team Average': teamVal };
        if (selectedTeamMember) {
          if (currentIndicator === 'Still Open Cases' || currentIndicator === 'Backlog') {
            entry['Member Individual'] = teamVal;
          } else if (memberBuckets) {
            entry['Member Individual'] = memberBuckets[key] ?? null;
          }
        }
        // Team breakdown (always available from dbTrendByBucket.out)
        const ob = dbTrendByBucket.out[key];
        entry['_openedInfo']      = ob?.['Opened Cases Information'] ?? 0;
        entry['_openedComplaint'] = ob?.['Opened Cases Complaint']   ?? 0;
        entry['_closedInfo']      = ob?.['Closed Cases Information'] ?? 0;
        entry['_closedComplaint'] = ob?.['Closed Cases Complaint']   ?? 0;
        // Member breakdown (only when member selected + relevant indicator)
        const mb = memberBreakdown[key];
        entry['_mOpenedInfo']      = mb?.['Opened Cases Information'] ?? 0;
        entry['_mOpenedComplaint'] = mb?.['Opened Cases Complaint']   ?? 0;
        entry['_mClosedInfo']      = mb?.['Closed Cases Information'] ?? 0;
        entry['_mClosedComplaint'] = mb?.['Closed Cases Complaint']   ?? 0;
        return entry;
      });
    }

    // Mock-backed path (unchanged): average per team-member per bucket.
    const dateMap: Record<string, any[]> = {};
    teamRfcs.forEach(rfc => {
      const memberData = generateHistoricalData(rfc);
      memberData.forEach(d => {
        if (dayjs(d.date).isBetween(startDate, endDate, 'day', '[]')) {
          const key = dayjs(d.date).format(formatStr);
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
           const mKey = dayjs(d.date).format(formatStr);
           return mKey === key;
        });
        if (mItem) {
          entry['Member Individual'] = mItem[dataKey] || 0;
        }
      }
      return entry;
    }).sort((a,b) => a.name.localeCompare(b.name));
  }, [isManagement, teamRfcs, startDate, endDate, hierarchy, currentIndicator, selectedTeamMember, DB_INDICATORS, dbTrendByBucket, memberBuckets, dbCases, dbClosedCases, users]);

  const dataKeyManagement = indicatorMap[currentIndicator];

  // BD-backed per-member value for the selected indicator. Returns null when:
  //   - not in a management view
  //   - the indicator isn't BD-backed (falls back to mock via dataKeyManagement)
  //   - the indicator is team-wide (Backlog / Still Open Cases — same value
  //     for every member, no meaningful ranking; also falls back to mock so
  //     the team isn't randomly tied)
  const memberValuesForRanking = React.useMemo(() => {
    if (!isManagement) return null;
    if (!DB_INDICATORS.has(currentIndicator)) return null;
    if (currentIndicator === 'Still Open Cases' || currentIndicator === 'Backlog') return null;

    const FMT = 'M/D/YYYY h:mm A';
    const result: Record<string, number> = {};

    teamRfcs.forEach(rfc => {
      const m = users[rfc];
      if (!m) return;
      let val = 0;

      if (currentIndicator === 'Opened Cases' && dbCases && m.compass) {
        val = dbCases.filter(c => {
          if (c.case_owner !== m.compass) return false;
          const d = c?.datetime_opened ? dayjs(c.datetime_opened, FMT) : null;
          return d && d.isValid() && d.isBetween(startDate, endDate, 'day', '[]');
        }).length;
      } else if (currentIndicator === 'Closed Cases' && dbClosedCases && m.compass) {
        val = dbClosedCases.filter(c => {
          if (c.caseClosedBy !== m.compass) return false;
          const d = dayjs(c.dateStr);
          return d.isValid() && d.isBetween(startDate, endDate, 'day', '[]');
        }).length;
      } else if (currentIndicator === 'Closed Cases Rate' && dbCases && dbClosedCases && m.compass) {
        let op = 0, cl = 0;
        dbCases.filter(c => c.case_owner === m.compass).forEach(c => {
          const o = c?.datetime_opened ? dayjs(c.datetime_opened, FMT) : null;
          if (o && o.isValid() && o.isBetween(startDate, endDate, 'day', '[]')) op++;
        });
        dbClosedCases.filter(c => c.caseClosedBy === m.compass).forEach(c => {
          const d = dayjs(c.dateStr);
          if (d.isValid() && d.isBetween(startDate, endDate, 'day', '[]')) cl++;
        });
        val = op > 0 ? Number(((cl / op) * 100).toFixed(1)) : 0;
      } else if (currentIndicator === '% First Contact Resolution' && dbClosedCases && m.compass) {
        let sameDay = 0, total = 0;
        dbClosedCases.filter(c => c.caseClosedBy === m.compass).forEach(c => {
          const d = dayjs(c.dateStr);
          if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
          total++;
          if (c.openedDateStr && c.openedDateStr === c.dateStr) sameDay++;
        });
        val = total > 0 ? Number(((sameDay / total) * 100).toFixed(1)) : 0;
      } else if (currentIndicator === 'Incoming Calls' && dbActivity) {
        val = dbActivity.filter(a => {
          if (a.user !== m.callPicker && a.user !== m.genesys) return false;
          const d = dayjs(a.dateStr);
          return d.isValid() && d.isBetween(startDate, endDate, 'day', '[]');
        }).reduce((acc, a) => acc + a.answeredCalls, 0);
      } else if (currentIndicator === 'QA' && dbQA && m.qa) {
        const mine = dbQA.filter(q => {
          if (q.agente !== m.qa) return false;
          const d = dayjs(q.dateStr);
          return d.isValid() && d.isBetween(startDate, endDate, 'day', '[]');
        });
        if (mine.length > 0) {
          val = Number((mine.reduce((acc, q) => acc + q.score, 0) / mine.length).toFixed(1));
        }
      } else if ((currentIndicator === 'NSAT' || currentIndicator === 'NSAT Information' || currentIndicator === 'NSAT Claims') && dbNSAT && m.compass) {
        const reasonFilter =
          currentIndicator === 'NSAT Information' ? 'Information & Assistance requests' :
          currentIndicator === 'NSAT Claims'      ? 'Complaint' :
          null;
        type Q = { p: number; d: number; t: number };
        const qs: [Q, Q, Q] = [{ p: 0, d: 0, t: 0 }, { p: 0, d: 0, t: 0 }, { p: 0, d: 0, t: 0 }];
        dbNSAT
          .filter(n => n.caseOwner === m.compass && (reasonFilter === null || n.contactReason1 === reasonFilter))
          .forEach(n => {
            const d = dayjs(n.dateStr);
            if (!d.isValid() || !d.isBetween(startDate, endDate, 'day', '[]')) return;
            [n.q1, n.q2, n.q3].forEach((v, i) => {
              if (v == null || !Number.isFinite(v)) return;
              qs[i].t++;
              if (v >= 9) qs[i].p++;
              else if (v <= 6) qs[i].d++;
            });
          });
        if (qs.some(q => q.t > 0)) {
          const perQ = qs.map(q => q.t > 0 ? ((q.p - q.d) / q.t) * 100 : 0);
          val = Math.round((perQ[0] + perQ[1] + perQ[2]) / 3);
        }
      }

      result[rfc] = val;
    });
    return result;
  }, [isManagement, currentIndicator, teamRfcs, users, dbCases, dbClosedCases, dbActivity, dbNSAT, dbQA, startDate, endDate, DB_INDICATORS]);

  const sortedTeam = React.useMemo(() => {
    // Each entry gets a uniform `_rankValue` so the rest of the pipeline
    // (quartileData, ranking list display) doesn't need to know whether the
    // source was BD or mock.
    const withValue = teamStats.map(s => ({
      ...s,
      _rankValue: memberValuesForRanking
        ? (memberValuesForRanking[s.rfc] ?? 0)
        : ((s as any)[dataKeyManagement] || 0),
    }));
    return withValue.sort((a, b) => b._rankValue - a._rankValue);
  }, [teamStats, dataKeyManagement, memberValuesForRanking]);

  const quartileData = React.useMemo(() => {
    return sortedTeam.map((member, index) => {
      const percentile = sortedTeam.length > 0 ? (index / sortedTeam.length) * 100 : 0;
      let quartile = 'Q1';
      if (percentile >= 75) quartile = 'Q4';
      else if (percentile >= 50) quartile = 'Q3';
      else if (percentile >= 25) quartile = 'Q2';

      return {
        ...member,
        quartile,
        value: member._rankValue,
      };
    });
  }, [sortedTeam]);

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
    // KPIs are aggregate scores computed from several indicators.
    { group: 'KPIs', options: ['Performance', 'Productivity', 'Ranking', 'Bonus'] },
    // Indicators are values that come directly from a single source table.
    { group: 'Indicators', options: ['Opened Cases', 'Closed Cases', 'Closed Cases Rate', 'Still Open Cases', 'Backlog', 'QA', 'NSAT', 'NSAT Information', 'NSAT Claims', 'Incoming Calls', 'Outgoing Calls', '% First Contact Resolution', 'Backlog Team'] }
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
                {currentIndicator} Over Time (Average vs {selectedTeamMember ? users[selectedTeamMember]?.name ?? selectedTeamMember : 'Individual'})
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={aggregatedTrendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  {/* Single shared axis so Team and Member are directly comparable
                      on the same scale (per spec) — dual axes would distort the
                      ratio between individual contribution and team aggregate. */}
                  <YAxis tick={{ fontSize: 11 }} domain={['auto', 'auto']} />
                  <Tooltip
                    content={(props: any) => {
                      // Use CasesTooltip only when the selected indicator has a breakdown;
                      // otherwise fall back to Recharts' default rendering via the prop.
                      const { active, payload } = props;
                      if (!active || !payload?.length) return null;
                      if (currentIndicator === 'Opened Cases' || currentIndicator === 'Closed Cases') {
                        return (
                          <CasesTooltip
                            {...props}
                            indicators={[currentIndicator]}
                            isManagement
                            currentIndicator={currentIndicator}
                            selectedTeamMember={selectedTeamMember}
                            isDark={isDark}
                            primaryColor={theme.palette.primary.main}
                            hierarchy={hierarchy}
                          />
                        );
                      }
                      // Default: show values with appropriate formatting
                      const pt = payload[0].payload;
                      const dateLabel = (() => {
                        const d = dayjs(pt.fullDate || pt.name);
                        if (!d.isValid()) return pt.name;
                        if (hierarchy === 'day')   return d.format('DD MMMM YYYY');
                        if (hierarchy === 'week')  return d.format('[Week] ww, YYYY');
                        if (hierarchy === 'month') return d.format('MMMM YYYY');
                        return d.format('YYYY');
                      })();
                      return (
                        <div style={{ backgroundColor: isDark ? 'rgba(0,8,20,0.95)' : '#fff', border: `2px solid ${theme.palette.primary.main}`, borderRadius: 8, padding: '10px 14px', fontSize: 14, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                          <div style={{ color: theme.palette.primary.main, fontWeight: 800, marginBottom: 6 }}>{dateLabel}</div>
                          {payload.map((p: any, i: number) => {
                            const raw = p.value;
                            let display: string;
                            if (raw == null) { display = '—'; }
                            else if (currentIndicator === 'QA' || currentIndicator === 'Backlog' || currentIndicator === '% First Contact Resolution') { display = `${formatValue(raw)}%`; }
                            else if (currentIndicator === 'NSAT' || currentIndicator === 'NSAT Information' || currentIndicator === 'NSAT Claims') { display = String(formatValue(raw, true)); }
                            else { display = raw.toFixed(1); }
                            return <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}><span style={{ color: p.color }}>{p.name}</span><span style={{ fontFamily: '"JetBrains Mono", monospace', fontWeight: 900 }}>{display}</span></div>;
                          })}
                        </div>
                      );
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Team Average"
                    stroke={theme.palette.primary.main}
                    strokeWidth={4}
                    dot={{ r: 4 }}
                    activeDot={{ r: 8 }}
                    connectNulls={['QA', 'NSAT', 'NSAT Information', 'NSAT Claims', 'Backlog', '% First Contact Resolution'].includes(currentIndicator)}
                  />
                  {selectedTeamMember && (
                    <Line
                      type="monotone"
                      dataKey="Member Individual"
                      stroke="#B018D9"
                      strokeWidth={3}
                      strokeDasharray="5 5"
                      dot={{ r: 4 }}
                      connectNulls={['QA', 'NSAT', 'NSAT Information', 'NSAT Claims', 'Backlog', '% First Contact Resolution'].includes(currentIndicator)}
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
                            {formatValue(member.value, ['Opened Cases', 'Closed Cases', 'Still Open Cases', 'Backlog', 'NSAT', 'NSAT Information', 'NSAT Claims', 'Incoming Calls', 'Outgoing Calls'].includes(currentIndicator))}{currentIndicator.includes('%') || ['Performance', 'Productivity', 'Bonus', 'Closed Cases Rate', 'QA', 'Backlog'].includes(currentIndicator) ? '%' : ''}
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
                  {indicatorSummary.filter(s => s.value !== null).map((s, idx) => {
                    const color = idx === 0 ? '#0ba0af' : '#B018D9';
                    const label = s.value !== null
                      ? (s.decimals === 0
                          ? `${Math.round(s.value as number)}${s.suffix}`
                          : `${(s.value as number).toFixed(s.decimals)}${s.suffix}`)
                      : '—';
                    return (
                      <Box
                        key={s.indicator}
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          mt: 0.5,
                        }}
                      >
                        <Typography sx={{ fontSize: 9, fontWeight: 700, opacity: 0.45, letterSpacing: 0.8, textTransform: 'uppercase', lineHeight: 1.2 }}>
                          {s.indicator}
                        </Typography>
                        <Typography sx={{ fontSize: 18, fontWeight: 900, color, fontFamily: 'monospace', lineHeight: 1.1 }}>
                          {label}
                        </Typography>
                      </Box>
                    );
                  })}
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
                      content={(props: any) => {
                        const hasBreakdown = selectedIndicators.some(i => i === 'Opened Cases' || i === 'Closed Cases');
                        if (hasBreakdown) {
                          return (
                            <CasesTooltip
                              {...props}
                              indicators={selectedIndicators}
                              isDark={isDark}
                              primaryColor={theme.palette.primary.main}
                              hierarchy={hierarchy}
                            />
                          );
                        }
                        // Default rendering (no breakdown needed)
                        const { active, payload } = props;
                        if (!active || !payload?.length) return null;
                        const pt = payload[0].payload;
                        const dateLabel = (() => {
                          const d = dayjs(pt.fullDate || pt.name);
                          if (!d.isValid()) return pt.name;
                          if (hierarchy === 'day')   return d.format('DD MMMM YYYY');
                          if (hierarchy === 'week')  return d.format('[Week] ww, YYYY');
                          if (hierarchy === 'month') return d.format('MMMM YYYY');
                          return d.format('YYYY');
                        })();
                        return (
                          <div style={{ backgroundColor: isDark ? 'rgba(0,8,20,0.95)' : '#fff', border: `2px solid ${theme.palette.primary.main}`, borderRadius: 8, padding: '12px 16px', fontSize: 20, fontWeight: 800, zIndex: 1000, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                            <div style={{ fontSize: 18, marginBottom: 8, fontWeight: 800, color: theme.palette.primary.main, borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 4 }}>{dateLabel}</div>
                            {payload.map((p: any, i: number) => {
                              const val = p.value; const name = p.name as string;
                              let display: string;
                              if (val == null) { display = '—'; }
                              else if (name === 'QA' || name === 'Backlog') { display = `${formatValue(val)}%`; }
                              else if (name === '% First Contact Resolution') { display = `${formatValue(val)}%`; }
                              else if (['NSAT', 'NSAT Information', 'NSAT Claims'].includes(name)) { display = String(formatValue(val, true)); }
                              else {
                                const isInt = ['Opened Cases', 'Closed Cases', 'Incoming Calls', 'Outgoing Calls'].includes(name) || selectedIndicators.some(si => ['Opened Cases', 'Closed Cases', 'Incoming Calls', 'Outgoing Calls'].includes(si));
                                display = String(formatValue(val, isInt));
                              }
                              return <div key={i} style={{ fontSize: 18, padding: '4px 0', display: 'flex', justifyContent: 'space-between', gap: 20 }}><span style={{ color: p.color }}>{name}</span><span style={{ fontFamily: '"JetBrains Mono", monospace' }}>{display}</span></div>;
                            })}
                          </div>
                        );
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
                          connectNulls={['QA', 'NSAT', 'NSAT Information', 'NSAT Claims', 'Backlog', '% First Contact Resolution'].includes(indicator)}
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
                              formatter={(val: any) => {
                                if (val == null) return '';
                                if (indicator === 'QA')               return `${formatValue(val)}%`;
                                if (indicator === 'NSAT')             return String(formatValue(val, true));
                                if (indicator === 'NSAT Information') return String(formatValue(val, true));
                                if (indicator === 'NSAT Claims')      return String(formatValue(val, true));
                                if (indicator === 'Backlog')          return `${formatValue(val, true)}%`;
                                if (indicator === '% First Contact Resolution') return `${formatValue(val)}%`;
                                return formatValue(val);
                              }}
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
              {adminViewType === 'team' && (
                <FormControl size="small" sx={{ minWidth: 130 }}>
                  <Select
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value as string)}
                    sx={{ 
                      height: 31, 
                      fontSize: 10, 
                      fontWeight: 800,
                      bgcolor: theme.palette.mode === 'dark' ? 'rgba(11, 160, 175, 0.1)' : 'white',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(11, 160, 175, 0.3)' }
                    }}
                  >
                    <MenuItem value="All" sx={{ fontSize: 10, fontWeight: 800 }}>ALL DEPARTMENTS</MenuItem>
                    <MenuItem value="CAC" sx={{ fontSize: 10, fontWeight: 800 }}>CAC</MenuItem>
                    <MenuItem value="Fleet" sx={{ fontSize: 10, fontWeight: 800 }}>FLEET</MenuItem>
                    <MenuItem value="Premium" sx={{ fontSize: 10, fontWeight: 800 }}>PREMIUM</MenuItem>
                  </Select>
                </FormControl>
              )}
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
