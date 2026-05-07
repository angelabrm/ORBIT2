import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  Divider,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Button,
  Menu,
} from '@mui/material';
import { IconButton, Tooltip as MuiTooltip } from '@mui/material';
import {
  Activity,
  Trophy,
  Target,
  CheckCircle2,
  AlertCircle,
  Info,
  Calendar as CalendarIcon,
  Layers,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LabelList,
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────

type PhaseStatus = 'Completed' | 'In Progress' | 'Pending' | 'Delayed';

interface Task {
  id: string;
  name: string;
  status: PhaseStatus;
}

interface Phase {
  id: string;
  number: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: PhaseStatus;
  tasks: Task[];
}

interface Campaign {
  id: string;
  name: string;
  brand: string;
  category: 'Biscuit' | 'Savory';
  startDate: Date;
  endDate: Date;
  phases: Phase[];
}

// ─── ManagementIndicator (exact match to AgentView) ──────────────────────────

interface IndicatorProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  formula: string;
  color?: string;
  description?: string;
  quartile?: string;
}

const ManagementIndicator: React.FC<IndicatorProps> = ({
  title,
  value,
  icon,
  formula,
  color = 'primary.main',
  description,
  quartile,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const qColor =
    quartile === 'Q1'
      ? '#b9e04d'
      : quartile === 'Q2'
      ? '#ffcc00'
      : quartile === 'Q3'
      ? '#ff9900'
      : '#ea5713';

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        bgcolor: isDark ? 'transparent' : 'rgba(11, 160, 175, 0.05)',
        border: isDark
          ? '1px solid rgba(11, 160, 175, 0.3)'
          : '1px solid rgba(0,0,0,0.05)',
        transition: 'all 0.2s',
      }}
    >
      {quartile && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bgcolor: qColor,
            py: 0.5,
            textAlign: 'center',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            zIndex: 2,
          }}
        >
          <Typography
            variant="caption"
            sx={{ color: '#000', fontWeight: 900, fontSize: 10, letterSpacing: 0.5 }}
          >
            YOU ARE POSITIONED IN PERFORMANCE QUARTILE {quartile}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          mb: 2,
          mt: quartile ? 2 : 0,
        }}
      >
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: `${color}1A`,
            color: color,
            display: 'flex',
          }}
        >
          {icon}
        </Box>
        <MuiTooltip
          title={
            <Box sx={{ p: 1 }}>
              <Typography
                variant="caption"
                sx={{ fontWeight: 800, display: 'block', mb: 0.5, color: '#fff' }}
              >
                HOW IS IT CALCULATED?
              </Typography>
              <Typography
                variant="caption"
                sx={{ fontFamily: '"JetBrains Mono", monospace', display: 'block', mb: 1 }}
              >
                {formula}
              </Typography>
              {description && (
                <>
                  <Divider sx={{ my: 1, bgcolor: 'rgba(255,255,255,0.1)' }} />
                  <Typography variant="caption" sx={{ opacity: 0.9, lineHeight: 1.4 }}>
                    {description}
                  </Typography>
                </>
              )}
            </Box>
          }
          arrow
          placement="top"
        >
          <IconButton
            size="small"
            sx={{ opacity: 0.5, '&:hover': { opacity: 1, color: 'primary.main' } }}
          >
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
          fontSize: '1.2rem',
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="h3"
        sx={{
          fontWeight: 900,
          color: color,
          fontFamily: isDark ? '"JetBrains Mono", monospace' : 'inherit',
          textShadow: isDark ? `0 0 20px ${color}33` : 'none',
          fontSize: '3rem',
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1',
    name: 'Chokis_Switch_25_Oct16_Dic10_B_PMF',
    brand: 'CHOKIS',
    category: 'Biscuit',
    startDate: new Date('2025-10-16'),
    endDate: new Date('2025-12-10'),
    phases: [
      { id: 'c1p1', number: 1, name: 'Brief', startDate: new Date('2025-10-16'), endDate: new Date('2025-10-22'), status: 'Completed', tasks: [{ id: 't1', name: 'Kickoff meeting', status: 'Completed' }, { id: 't2', name: 'Brief document', status: 'Completed' }] },
      { id: 'c1p2', number: 2, name: 'Big Idea', startDate: new Date('2025-10-23'), endDate: new Date('2025-11-01'), status: 'Completed', tasks: [{ id: 't3', name: 'Concept development', status: 'Completed' }] },
      { id: 'c1p3', number: 3, name: 'Media Plan', startDate: new Date('2025-11-02'), endDate: new Date('2025-11-10'), status: 'Completed', tasks: [{ id: 't4', name: 'Channel selection', status: 'Completed' }] },
      { id: 'c1p4', number: 4, name: 'Content Grid', startDate: new Date('2025-11-11'), endDate: new Date('2025-11-18'), status: 'Completed', tasks: [{ id: 't5', name: 'Content calendar', status: 'Completed' }] },
      { id: 'c1p5', number: 5, name: 'Content Production', startDate: new Date('2025-11-19'), endDate: new Date('2025-11-28'), status: 'In Progress', tasks: [{ id: 't6', name: 'Video production', status: 'In Progress' }, { id: 't7', name: 'Design assets', status: 'Pending' }] },
      { id: 'c1p6', number: 6, name: 'Go Live', startDate: new Date('2025-11-29'), endDate: new Date('2025-12-03'), status: 'Pending', tasks: [{ id: 't8', name: 'Platform publish', status: 'Pending' }] },
      { id: 'c1p7', number: 7, name: 'Final Report', startDate: new Date('2025-12-04'), endDate: new Date('2025-12-08'), status: 'Pending', tasks: [{ id: 't9', name: 'Performance report', status: 'Pending' }] },
      { id: 'c1p8', number: 8, name: 'Closing Campaign', startDate: new Date('2025-12-09'), endDate: new Date('2025-12-10'), status: 'Pending', tasks: [{ id: 't10', name: 'Archive assets', status: 'Pending' }] },
    ],
  },
  {
    id: 'c2',
    name: 'Doritos_Dinamita_25_Sep08_Oct24_S_PMF',
    brand: 'DORITOS',
    category: 'Savory',
    startDate: new Date('2025-09-08'),
    endDate: new Date('2025-10-24'),
    phases: [
      { id: 'c2p1', number: 1, name: 'Brief', startDate: new Date('2025-09-08'), endDate: new Date('2025-09-12'), status: 'Completed', tasks: [{ id: 't11', name: 'Brief document', status: 'Completed' }] },
      { id: 'c2p2', number: 2, name: 'Big Idea', startDate: new Date('2025-09-13'), endDate: new Date('2025-09-20'), status: 'Completed', tasks: [{ id: 't12', name: 'Concept development', status: 'Completed' }] },
      { id: 'c2p3', number: 3, name: 'Media Plan', startDate: new Date('2025-09-21'), endDate: new Date('2025-09-27'), status: 'Completed', tasks: [{ id: 't13', name: 'Channel selection', status: 'Completed' }] },
      { id: 'c2p4', number: 4, name: 'Content Grid', startDate: new Date('2025-09-28'), endDate: new Date('2025-10-04'), status: 'Completed', tasks: [{ id: 't14', name: 'Content calendar', status: 'Completed' }] },
      { id: 'c2p5', number: 5, name: 'Content Production', startDate: new Date('2025-10-05'), endDate: new Date('2025-10-12'), status: 'Completed', tasks: [{ id: 't15', name: 'Video production', status: 'Completed' }] },
      { id: 'c2p6', number: 6, name: 'Go Live', startDate: new Date('2025-10-13'), endDate: new Date('2025-10-17'), status: 'Completed', tasks: [{ id: 't16', name: 'Platform publish', status: 'Completed' }] },
      { id: 'c2p7', number: 7, name: 'Final Report', startDate: new Date('2025-10-18'), endDate: new Date('2025-10-22'), status: 'Completed', tasks: [{ id: 't17', name: 'Performance report', status: 'Completed' }] },
      { id: 'c2p8', number: 8, name: 'Closing Campaign', startDate: new Date('2025-10-23'), endDate: new Date('2025-10-24'), status: 'Completed', tasks: [{ id: 't18', name: 'Archive assets', status: 'Completed' }] },
    ],
  },
  {
    id: 'c3',
    name: 'Emperador_Rafiki_26_Ene10_Jul31_B_PMF',
    brand: 'EMPERADOR',
    category: 'Biscuit',
    startDate: new Date('2026-01-10'),
    endDate: new Date('2026-07-31'),
    phases: [
      { id: 'c3p1', number: 1, name: 'Brief', startDate: new Date('2026-01-10'), endDate: new Date('2026-01-20'), status: 'In Progress', tasks: [{ id: 't19', name: 'Kickoff meeting', status: 'Completed' }, { id: 't20', name: 'Brief document', status: 'In Progress' }] },
      { id: 'c3p2', number: 2, name: 'Big Idea', startDate: new Date('2026-01-21'), endDate: new Date('2026-02-10'), status: 'Pending', tasks: [{ id: 't21', name: 'Concept development', status: 'Pending' }] },
      { id: 'c3p3', number: 3, name: 'Media Plan', startDate: new Date('2026-02-11'), endDate: new Date('2026-03-01'), status: 'Pending', tasks: [{ id: 't22', name: 'Channel selection', status: 'Pending' }] },
      { id: 'c3p4', number: 4, name: 'Content Grid', startDate: new Date('2026-03-02'), endDate: new Date('2026-03-20'), status: 'Pending', tasks: [{ id: 't23', name: 'Content calendar', status: 'Pending' }] },
      { id: 'c3p5', number: 5, name: 'Content Production', startDate: new Date('2026-03-21'), endDate: new Date('2026-05-01'), status: 'Pending', tasks: [{ id: 't24', name: 'Video production', status: 'Pending' }] },
      { id: 'c3p6', number: 6, name: 'Go Live', startDate: new Date('2026-05-02'), endDate: new Date('2026-06-01'), status: 'Pending', tasks: [{ id: 't25', name: 'Platform publish', status: 'Pending' }] },
      { id: 'c3p7', number: 7, name: 'Final Report', startDate: new Date('2026-06-02'), endDate: new Date('2026-07-15'), status: 'Pending', tasks: [{ id: 't26', name: 'Performance report', status: 'Pending' }] },
      { id: 'c3p8', number: 8, name: 'Closing Campaign', startDate: new Date('2026-07-16'), endDate: new Date('2026-07-31'), status: 'Pending', tasks: [{ id: 't27', name: 'Archive assets', status: 'Pending' }] },
    ],
  },
  {
    id: 'c4',
    name: 'Cheetos_Flamin_25_Nov01_Ene15_S_PMF',
    brand: 'CHEETOS',
    category: 'Savory',
    startDate: new Date('2025-11-01'),
    endDate: new Date('2026-01-15'),
    phases: [
      { id: 'c4p1', number: 1, name: 'Brief', startDate: new Date('2025-11-01'), endDate: new Date('2025-11-07'), status: 'Completed', tasks: [{ id: 't28', name: 'Brief document', status: 'Completed' }] },
      { id: 'c4p2', number: 2, name: 'Big Idea', startDate: new Date('2025-11-08'), endDate: new Date('2025-11-18'), status: 'Completed', tasks: [{ id: 't29', name: 'Concept development', status: 'Completed' }] },
      { id: 'c4p3', number: 3, name: 'Media Plan', startDate: new Date('2025-11-19'), endDate: new Date('2025-11-28'), status: 'Completed', tasks: [{ id: 't30', name: 'Channel selection', status: 'Completed' }] },
      { id: 'c4p4', number: 4, name: 'Content Grid', startDate: new Date('2025-11-29'), endDate: new Date('2025-12-08'), status: 'Delayed', tasks: [{ id: 't31', name: 'Content calendar', status: 'Delayed' }] },
      { id: 'c4p5', number: 5, name: 'Content Production', startDate: new Date('2025-12-09'), endDate: new Date('2025-12-28'), status: 'Pending', tasks: [{ id: 't32', name: 'Video production', status: 'Pending' }] },
      { id: 'c4p6', number: 6, name: 'Go Live', startDate: new Date('2025-12-29'), endDate: new Date('2026-01-05'), status: 'Pending', tasks: [{ id: 't33', name: 'Platform publish', status: 'Pending' }] },
      { id: 'c4p7', number: 7, name: 'Final Report', startDate: new Date('2026-01-06'), endDate: new Date('2026-01-12'), status: 'Pending', tasks: [{ id: 't34', name: 'Performance report', status: 'Pending' }] },
      { id: 'c4p8', number: 8, name: 'Closing Campaign', startDate: new Date('2026-01-13'), endDate: new Date('2026-01-15'), status: 'Pending', tasks: [{ id: 't35', name: 'Archive assets', status: 'Pending' }] },
    ],
  },
];

const TREND_DATA_BY_MONTH = [
  { name: 'Jan', fullDate: '2025-01-15', 'On-Time Rate': 85, 'Campaign Count': 2, 'Completion Rate': 60 },
  { name: 'Feb', fullDate: '2025-02-15', 'On-Time Rate': 78, 'Campaign Count': 3, 'Completion Rate': 55 },
  { name: 'Mar', fullDate: '2025-03-15', 'On-Time Rate': 90, 'Campaign Count': 2, 'Completion Rate': 80 },
  { name: 'Apr', fullDate: '2025-04-15', 'On-Time Rate': 88, 'Campaign Count': 4, 'Completion Rate': 75 },
  { name: 'May', fullDate: '2025-05-15', 'On-Time Rate': 92, 'Campaign Count': 3, 'Completion Rate': 85 },
  { name: 'Jun', fullDate: '2025-06-15', 'On-Time Rate': 75, 'Campaign Count': 2, 'Completion Rate': 50 },
  { name: 'Jul', fullDate: '2025-07-15', 'On-Time Rate': 83, 'Campaign Count': 3, 'Completion Rate': 70 },
];

const TREND_DATA_BY_WEEK = [
  { name: 'W18', fullDate: '2025-05-05', 'On-Time Rate': 90, 'Campaign Count': 1, 'Completion Rate': 80 },
  { name: 'W19', fullDate: '2025-05-12', 'On-Time Rate': 85, 'Campaign Count': 2, 'Completion Rate': 75 },
  { name: 'W20', fullDate: '2025-05-19', 'On-Time Rate': 92, 'Campaign Count': 2, 'Completion Rate': 88 },
  { name: 'W21', fullDate: '2025-05-26', 'On-Time Rate': 78, 'Campaign Count': 1, 'Completion Rate': 65 },
  { name: 'W22', fullDate: '2025-06-02', 'On-Time Rate': 95, 'Campaign Count': 3, 'Completion Rate': 90 },
];

const TREND_DATA_BY_QUARTER = [
  { name: 'Q1 25', fullDate: '2025-01-01', 'On-Time Rate': 84, 'Campaign Count': 7, 'Completion Rate': 65 },
  { name: 'Q2 25', fullDate: '2025-04-01', 'On-Time Rate': 88, 'Campaign Count': 9, 'Completion Rate': 72 },
  { name: 'Q3 25', fullDate: '2025-07-01', 'On-Time Rate': 91, 'Campaign Count': 8, 'Completion Rate': 80 },
  { name: 'Q4 25', fullDate: '2025-10-01', 'On-Time Rate': 79, 'Campaign Count': 10, 'Completion Rate': 60 },
];

const PHASE_COLORS: Record<PhaseStatus, string> = {
  Completed: '#22c55e',
  'In Progress': '#0ba0af',
  Pending: '#94a3b8',
  Delayed: '#ef4444',
};

// ─── Gantt helpers ────────────────────────────────────────────────────────────

function ganttRange(campaigns: Campaign[]) {
  const all = campaigns.flatMap(c => [c.startDate, c.endDate, ...c.phases.flatMap(p => [p.startDate, p.endDate])]);
  return {
    min: Math.min(...all.map(d => d.getTime())),
    max: Math.max(...all.map(d => d.getTime())),
  };
}

function barStyle(start: Date, end: Date, rangeMin: number, rangeMax: number, color: string) {
  const total = rangeMax - rangeMin;
  const left = ((start.getTime() - rangeMin) / total) * 100;
  const width = ((end.getTime() - start.getTime()) / total) * 100;
  return { left: `${left}%`, width: `${Math.max(width, 0.5)}%`, bgcolor: color };
}

function monthLabels(rangeMin: number, rangeMax: number) {
  const labels: { label: string; left: string }[] = [];
  const total = rangeMax - rangeMin;
  const cur = new Date(new Date(rangeMin).getFullYear(), new Date(rangeMin).getMonth(), 1);
  while (cur.getTime() <= rangeMax) {
    const left = ((cur.getTime() - rangeMin) / total) * 100;
    if (left >= 0 && left <= 100) {
      labels.push({
        label: cur.toLocaleString('default', { month: 'short', year: '2-digit' }),
        left: `${left}%`,
      });
    }
    cur.setMonth(cur.getMonth() + 1);
  }
  return labels;
}

// ─── Gantt component ──────────────────────────────────────────────────────────

const ROW_HEIGHT = 30;

interface GanttProps {
  campaigns: Campaign[];
  brandFilter: string;
  categoryFilter: string;
}

const GanttChart: React.FC<GanttProps> = ({ campaigns, brandFilter, categoryFilter }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const filtered = campaigns.filter(c => {
    if (brandFilter !== 'All' && c.brand !== brandFilter) return false;
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    return true;
  });

  const source = filtered.length > 0 ? filtered : campaigns;
  const { min, max } = ganttRange(source);
  const months = monthLabels(min, max);

  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const brands = Array.from(new Set(filtered.map(c => c.brand)));

  const toggleBrand = (b: string) =>
    setExpandedBrands(p => { const s = new Set(p); s.has(b) ? s.delete(b) : s.add(b); return s; });
  const toggleCampaign = (id: string) =>
    setExpandedCampaigns(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const togglePhase = (id: string) =>
    setExpandedPhases(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const rowBg = (i: number) =>
    i % 2 === 0
      ? isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
      : 'transparent';

  let rowIndex = 0;
  const rows: React.ReactNode[] = [];

  brands.forEach(brand => {
    const brandCampaigns = filtered.filter(c => c.brand === brand);
    const isExpandedBrand = expandedBrands.has(brand);
    const ri = rowIndex++;

    rows.push(
      <Box
        key={`brand-${brand}`}
        sx={{ display: 'flex', height: ROW_HEIGHT, alignItems: 'center', bgcolor: rowBg(ri), cursor: 'pointer' }}
        onClick={() => toggleBrand(brand)}
      >
        <Box sx={{ width: '32%', minWidth: 160, flexShrink: 0, px: 1.5, display: 'flex', alignItems: 'center', gap: 0.5, borderRight: `1px solid ${theme.palette.divider}` }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, color: theme.palette.primary.main, userSelect: 'none', letterSpacing: 0.5 }}>
            {isExpandedBrand ? '▼' : '▶'} {brand}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, position: 'relative', height: '100%' }} />
      </Box>
    );

    if (!isExpandedBrand) return;

    brandCampaigns.forEach(campaign => {
      const isExpandedCampaign = expandedCampaigns.has(campaign.id);
      const cri = rowIndex++;
      const bs = barStyle(campaign.startDate, campaign.endDate, min, max, theme.palette.primary.main);

      rows.push(
        <Box
          key={`campaign-${campaign.id}`}
          sx={{ display: 'flex', height: ROW_HEIGHT, alignItems: 'center', bgcolor: rowBg(cri), cursor: 'pointer' }}
          onClick={() => toggleCampaign(campaign.id)}
        >
          <Box sx={{ width: '32%', minWidth: 160, flexShrink: 0, pl: 2.5, pr: 1, display: 'flex', alignItems: 'center', gap: 0.5, borderRight: `1px solid ${theme.palette.divider}` }}>
            <Typography sx={{ fontSize: 10, fontWeight: 600, userSelect: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isExpandedCampaign ? '▼' : '▶'} {campaign.name.split('_').slice(0, 2).join(' ')}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, position: 'relative', height: '100%' }}>
            <Box sx={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', height: 12, borderRadius: 1, ...bs }} />
          </Box>
        </Box>
      );

      if (!isExpandedCampaign) return;

      campaign.phases.forEach(phase => {
        const isExpandedPhase = expandedPhases.has(phase.id);
        const pri = rowIndex++;
        const phaseColor = PHASE_COLORS[phase.status];
        const pbs = barStyle(phase.startDate, phase.endDate, min, max, phaseColor);

        rows.push(
          <Box
            key={`phase-${phase.id}`}
            sx={{ display: 'flex', height: ROW_HEIGHT, alignItems: 'center', bgcolor: rowBg(pri), cursor: 'pointer' }}
            onClick={() => togglePhase(phase.id)}
          >
            <Box sx={{ width: '32%', minWidth: 160, flexShrink: 0, pl: 4, pr: 1, display: 'flex', alignItems: 'center', gap: 0.5, borderRight: `1px solid ${theme.palette.divider}` }}>
              <Typography sx={{ fontSize: 9, opacity: 0.7, userSelect: 'none', flexShrink: 0 }}>
                {isExpandedPhase ? '▼' : '▶'} {String(phase.number).padStart(2, '0')} — {phase.name}
              </Typography>
              <Box sx={{ ml: 0.5, px: 0.5, py: 0.1, borderRadius: 0.4, bgcolor: phaseColor + '22', border: `1px solid ${phaseColor}66`, flexShrink: 0 }}>
                <Typography sx={{ fontSize: 7, color: phaseColor, fontWeight: 700 }}>{phase.status}</Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1, position: 'relative', height: '100%' }}>
              <Box sx={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', height: 8, borderRadius: 1, opacity: 0.9, ...pbs }} />
            </Box>
          </Box>
        );

        if (!isExpandedPhase) return;

        phase.tasks.forEach(task => {
          const tri = rowIndex++;
          rows.push(
            <Box key={`task-${task.id}`} sx={{ display: 'flex', height: ROW_HEIGHT, alignItems: 'center', bgcolor: rowBg(tri) }}>
              <Box sx={{ width: '32%', minWidth: 160, flexShrink: 0, pl: 5.5, pr: 1, display: 'flex', alignItems: 'center', gap: 0.5, borderRight: `1px solid ${theme.palette.divider}` }}>
                <Typography sx={{ fontSize: 9, opacity: 0.45, userSelect: 'none' }}>• {task.name}</Typography>
              </Box>
              <Box sx={{ flex: 1, position: 'relative', height: '100%' }} />
            </Box>
          );
        });
      });
    });
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', height: 26, borderBottom: `1px solid ${theme.palette.divider}`, flexShrink: 0, bgcolor: isDark ? 'rgba(11,160,175,0.06)' : 'rgba(11,160,175,0.04)' }}>
        <Box sx={{ width: '32%', minWidth: 160, flexShrink: 0, px: 1.5, display: 'flex', alignItems: 'center', borderRight: `1px solid ${theme.palette.divider}` }}>
          <Typography sx={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: theme.palette.primary.main, opacity: 0.7 }}>
            Campaign / Phase
          </Typography>
        </Box>
        <Box sx={{ flex: 1, position: 'relative' }}>
          {months.map((m, i) => (
            <Box key={i} sx={{ position: 'absolute', left: m.left, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 1, height: '100%', bgcolor: theme.palette.divider, opacity: 0.4 }} />
              <Typography sx={{ fontSize: 9, opacity: 0.5, ml: 0.3, whiteSpace: 'nowrap', fontWeight: 700 }}>{m.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
      {/* Rows */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {rows.length > 0 ? rows : (
          <Box sx={{ p: 3, textAlign: 'center', opacity: 0.4 }}>
            <Typography variant="caption">No campaigns match the current filters</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// ─── Main PMView ──────────────────────────────────────────────────────────────

const INDICATOR_OPTIONS = ['On-Time Rate', 'Campaign Count', 'Completion Rate'];
const INDICATOR_COLORS: Record<string, string> = {
  'On-Time Rate': '#0ba0af',
  'Campaign Count': '#B018D9',
  'Completion Rate': '#b9e04d',
};

type HierarchyKey = 'month' | 'week' | 'quarter';
const HIERARCHY_DATA: Record<HierarchyKey, typeof TREND_DATA_BY_MONTH> = {
  month: TREND_DATA_BY_MONTH,
  week: TREND_DATA_BY_WEEK,
  quarter: TREND_DATA_BY_QUARTER,
};

const CATEGORY_OPTIONS = ['All', 'Biscuit', 'Savory'];

const getOnTimeColor = (val: number) => {
  if (val >= 85) return '#b9e04d';
  if (val >= 70) return '#ffcc00';
  return '#ea5713';
};
const getRankingColor = (rank: number) => {
  if (rank <= 15) return '#b9e04d';
  if (rank <= 40) return '#ffcc00';
  return '#ea5713';
};

const PMView: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [hierarchy, setHierarchy] = useState<HierarchyKey>('month');
  const [hierarchyAnchor, setHierarchyAnchor] = useState<null | HTMLElement>(null);
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['On-Time Rate', 'Completion Rate']);
  const [brandFilter, setBrandFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const allBrands = Array.from(new Set(MOCK_CAMPAIGNS.map(c => c.brand)));

  const totalCampaigns = MOCK_CAMPAIGNS.length;
  const activeCampaigns = MOCK_CAMPAIGNS.filter(c => c.phases.some(p => p.status === 'In Progress')).length;
  const delayedCampaigns = MOCK_CAMPAIGNS.filter(c => c.phases.some(p => p.status === 'Delayed')).length;
  const completedCampaigns = MOCK_CAMPAIGNS.filter(c => c.phases.every(p => p.status === 'Completed')).length;
  const onTimeRate = Math.round(((totalCampaigns - delayedCampaigns) / totalCampaigns) * 100);
  const completionRate = Math.round((completedCampaigns / totalCampaigns) * 100);
  const rankingPercentile = 18;
  const myQuartile = 'Q1';

  const phaseStatusCounts = (['Completed', 'In Progress', 'Pending', 'Delayed'] as PhaseStatus[]).map(status => ({
    name: status,
    value: MOCK_CAMPAIGNS.flatMap(c => c.phases).filter(p => p.status === status).length,
    color: PHASE_COLORS[status],
  }));

  const campaignsByBrand = allBrands.map(brand => ({
    brand,
    count: MOCK_CAMPAIGNS.filter(c => c.brand === brand).length,
  }));

  const trendData = HIERARCHY_DATA[hierarchy];

  const handleIndicatorChange = (event: any) => {
    const value = event.target.value;
    const newSel = typeof value === 'string' ? value.split(',') : value;
    if (newSel.length <= 2) setSelectedIndicators(newSel);
  };

  const tooltipStyle = {
    contentStyle: {
      backgroundColor: isDark ? 'rgba(0, 8, 20, 0.95)' : '#fff',
      border: `2px solid ${theme.palette.primary.main}`,
      borderRadius: 8,
      fontSize: 16,
      fontWeight: 800,
      boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    },
    itemStyle: { fontSize: 14, padding: '4px 0' },
    labelStyle: { fontSize: 14, marginBottom: 8, fontWeight: 800, color: theme.palette.primary.main, borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 4 },
  };

  const barTooltipStyle = {
    contentStyle: {
      backgroundColor: isDark ? 'rgba(0, 8, 20, 0.95)' : '#fff',
      border: `1px solid ${theme.palette.primary.main}33`,
      borderRadius: 4,
      fontSize: 14,
      fontWeight: 600,
    },
    itemStyle: { fontSize: 13 },
    labelStyle: { fontSize: 13, marginBottom: 4, fontWeight: 700 },
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2, overflow: 'hidden' }}>

      {/* ── Level 1: KPI Indicators (22%) ─────────────────────────────────── */}
      <Box sx={{ height: '22%', display: 'flex', gap: 2, flexShrink: 0 }}>

        {/* My Performance — 4 ManagementIndicator cards */}
        <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1 }}>
            <ManagementIndicator
              title="My Performance"
              value={`${onTimeRate}%`}
              icon={<Activity size={24} />}
              formula="(Campaigns without delayed phases / Total campaigns) × 100"
              color={getOnTimeColor(onTimeRate)}
              description="Your overall on-time delivery rate across all assigned campaigns. 100% means every campaign phase was completed on schedule."
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <ManagementIndicator
              title="Completion Rate"
              value={`${completionRate}%`}
              icon={<CheckCircle2 size={24} />}
              formula="(Fully completed campaigns / Total campaigns) × 100"
              color={getOnTimeColor(completionRate)}
              description="Percentage of campaigns where all 8 phases have been marked as Completed."
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <ManagementIndicator
              title="Active Campaigns"
              value={`${activeCampaigns}`}
              icon={<Layers size={24} />}
              formula="Count of campaigns with at least one phase In Progress"
              color={theme.palette.primary.main}
              description="Number of campaigns currently in execution — at least one phase is actively In Progress."
            />
          </Box>
          <Box sx={{ flex: 1 }}>
            <ManagementIndicator
              title="Delayed"
              value={`${delayedCampaigns}`}
              icon={<AlertCircle size={24} />}
              formula="Count of campaigns with at least one phase marked as Delayed"
              color={delayedCampaigns > 0 ? '#ea5713' : '#b9e04d'}
              description="Campaigns where at least one phase is behind schedule. Requires immediate attention."
            />
          </Box>
        </Box>

        {/* My Ranking */}
        <Box sx={{ width: 220, flexShrink: 0 }}>
          <ManagementIndicator
            title="My Ranking"
            value={`TOP ${rankingPercentile}%`}
            icon={<Trophy size={24} />}
            formula="Comparison of your On-Time Rate and Completion Rate against all PMs in the Pepsico team."
            color={getRankingColor(rankingPercentile)}
            description={`You are in the top ${rankingPercentile}% of the Pepsico PM team. This means your campaign delivery performance exceeds ${100 - rankingPercentile}% of your peers.`}
            quartile={myQuartile}
          />
        </Box>

      </Box>

      {/* ── Level 2: Trend Line Chart (28%) ────────────────────────────────── */}
      <Box sx={{ height: '28%', flexShrink: 0 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: isDark ? 'transparent' : 'rgba(11, 160, 175, 0.05)',
            border: isDark ? '1px solid rgba(11, 160, 175, 0.3)' : '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: theme.palette.primary.main, mb: 0.5 }}>
                {selectedIndicators.length > 0 ? `${selectedIndicators.join(' and ')} Over Time` : 'Campaign Trends'}
              </Typography>
              <FormControl sx={{ minWidth: 280 }} size="small">
                <Select
                  multiple
                  value={selectedIndicators}
                  onChange={handleIndicatorChange}
                  input={<OutlinedInput />}
                  renderValue={selected => (selected as string[]).join(', ')}
                  sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white', fontSize: 13 }}
                >
                  {INDICATOR_OPTIONS.map(opt => (
                    <MenuItem key={opt} value={opt}>
                      <Checkbox checked={selectedIndicators.includes(opt)} size="small" />
                      <ListItemText primary={<Typography sx={{ fontSize: 13, fontWeight: selectedIndicators.includes(opt) ? 700 : 400 }}>{opt}</Typography>} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5, fontSize: 10, letterSpacing: 1 }}>TIME_SCALE</Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={e => setHierarchyAnchor(e.currentTarget)}
                startIcon={<CalendarIcon size={14} />}
                sx={{ fontSize: 11, fontWeight: 800, color: 'primary.main', borderColor: 'rgba(11, 160, 175, 0.3)', height: 36, px: 2, bgcolor: isDark ? 'rgba(11, 160, 175, 0.05)' : 'transparent', '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(11, 160, 175, 0.1)' } }}
              >
                {hierarchy.toUpperCase()}S
              </Button>
              <Menu
                anchorEl={hierarchyAnchor}
                open={Boolean(hierarchyAnchor)}
                onClose={() => setHierarchyAnchor(null)}
                slotProps={{ paper: { sx: { bgcolor: isDark ? '#000A1A' : '#fff', border: '1px solid rgba(11, 160, 175, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', '& .MuiMenuItem-root': { fontSize: 12, fontWeight: 700, py: 1, '&:hover': { bgcolor: 'rgba(11, 160, 175, 0.1)' } } } } }}
              >
                <MenuItem onClick={() => { setHierarchy('month'); setHierarchyAnchor(null); }}>MONTHS</MenuItem>
                <MenuItem onClick={() => { setHierarchy('week'); setHierarchyAnchor(null); }}>WEEKS</MenuItem>
                <MenuItem onClick={() => { setHierarchy('quarter'); setHierarchyAnchor(null); }}>QUARTERS</MenuItem>
              </Menu>
            </Box>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fontWeight: 700, fill: '#0ba0af' }}
                  stroke="rgba(11, 160, 175, 0.4)"
                  dy={6}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fontSize: 12, opacity: 0.9, fontWeight: 800 }}
                  stroke={theme.palette.primary.main}
                  width={45}
                  domain={[0, 'auto']}
                />
                {selectedIndicators.length > 1 && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12, opacity: 0.9, fontWeight: 800 }}
                    stroke="#B018D9"
                    width={45}
                    domain={[0, 'auto']}
                  />
                )}
                <Tooltip
                  contentStyle={tooltipStyle.contentStyle}
                  itemStyle={tooltipStyle.itemStyle}
                  labelStyle={tooltipStyle.labelStyle}
                />
                <Legend verticalAlign="bottom" height={28} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, fontWeight: 800 }} />
                {selectedIndicators.map((ind, idx) => (
                  <Line
                    key={ind}
                    yAxisId={idx === 0 ? 'left' : 'right'}
                    type="monotone"
                    dataKey={ind}
                    stroke={idx === 0 ? theme.palette.primary.main : '#B018D9'}
                    strokeWidth={4}
                    dot={{ r: 5, strokeWidth: 3, fill: isDark ? '#000A1A' : '#fff' }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                    animationDuration={1200}
                  >
                    {trendData.length <= 12 && (
                      <LabelList
                        dataKey={ind}
                        position={idx === 0 ? 'top' : 'bottom'}
                        offset={10}
                        style={{ fontSize: 11, fontWeight: 800, fill: idx === 0 ? theme.palette.primary.main : '#B018D9' }}
                      />
                    )}
                  </Line>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>

      {/* ── Level 3: Gantt + Charts (remaining) ────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0 }}>

        {/* Filter strip */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 }}>Total:</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 900, color: theme.palette.primary.main, fontFamily: isDark ? '"JetBrains Mono", monospace' : 'inherit' }}>{totalCampaigns} campaigns</Typography>
          </Box>
          <FormControl size="small">
            <Select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} sx={{ fontSize: 12, height: 30, minWidth: 120, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }}>
              <MenuItem value="All" sx={{ fontSize: 12 }}>All Brands</MenuItem>
              {allBrands.map(b => <MenuItem key={b} value={b} sx={{ fontSize: 12 }}>{b}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} sx={{ fontSize: 12, height: 30, minWidth: 120, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }}>
              {CATEGORY_OPTIONS.map(c => <MenuItem key={c} value={c} sx={{ fontSize: 12 }}>{c === 'All' ? 'All Categories' : c}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {/* Gantt + side charts */}
        <Box sx={{ flex: 1, display: 'flex', gap: 2, minHeight: 0 }}>

          {/* Gantt — 55% */}
          <Paper
            elevation={0}
            sx={{
              width: '55%',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              bgcolor: isDark ? 'transparent' : 'rgba(11, 160, 175, 0.05)',
              border: isDark ? '1px solid rgba(11, 160, 175, 0.3)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ px: 1.5, pt: 1.5, pb: 0.5, flexShrink: 0, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800 }}>
                Campaign Gantt
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <GanttChart campaigns={MOCK_CAMPAIGNS} brandFilter={brandFilter} categoryFilter={categoryFilter} />
            </Box>
          </Paper>

          {/* Side charts — 45% */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minHeight: 0 }}>

            {/* Pie: phase status distribution */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                bgcolor: isDark ? 'transparent' : 'rgba(11, 160, 175, 0.05)',
                border: isDark ? '1px solid rgba(11, 160, 175, 0.3)' : '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, mb: 0.5, display: 'block' }}>
                Phase Status Distribution
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={phaseStatusCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius="30%"
                    outerRadius="60%"
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={2}
                  >
                    {phaseStatusCounts.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={barTooltipStyle.contentStyle}
                    itemStyle={barTooltipStyle.itemStyle}
                    labelStyle={barTooltipStyle.labelStyle}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} iconType="circle" iconSize={9} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>

            {/* Bar: campaigns by brand */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                bgcolor: isDark ? 'transparent' : 'rgba(11, 160, 175, 0.05)',
                border: isDark ? '1px solid rgba(11, 160, 175, 0.3)' : '1px solid rgba(0,0,0,0.05)',
              }}
            >
              <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, mb: 0.5, display: 'block' }}>
                Campaigns by Brand
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignsByBrand} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                  <XAxis
                    dataKey="brand"
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#0ba0af' }}
                    stroke="rgba(11, 160, 175, 0.4)"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fontWeight: 800 }}
                    stroke={theme.palette.primary.main}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={barTooltipStyle.contentStyle}
                    itemStyle={barTooltipStyle.itemStyle}
                    labelStyle={barTooltipStyle.labelStyle}
                    formatter={(val: any) => [val, 'Campaigns']}
                  />
                  <Bar dataKey="count" name="Campaigns" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>

          </Box>
        </Box>
      </Box>

    </Box>
  );
};

export default PMView;
