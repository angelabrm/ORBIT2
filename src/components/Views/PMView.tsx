import React, { useState } from 'react';
import {
  Box,
  Typography,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  IconButton,
  Checkbox,
  ListItemText,
  OutlinedInput,
} from '@mui/material';
import { Info } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
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

type GanttLevel = 'brand' | 'campaign' | 'phase' | 'task';

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
    name: 'Emperador_Rafiki_26_Oct10_Jul31_B_PMF',
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

const LINE_CHART_DATA = [
  { period: 'Jan', campaigns: 2, onTime: 1, delayed: 1 },
  { period: 'Feb', campaigns: 3, onTime: 2, delayed: 1 },
  { period: 'Mar', campaigns: 2, onTime: 2, delayed: 0 },
  { period: 'Apr', campaigns: 4, onTime: 3, delayed: 1 },
  { period: 'May', campaigns: 3, onTime: 3, delayed: 0 },
  { period: 'Jun', campaigns: 2, onTime: 1, delayed: 1 },
];

const PHASE_COLORS: Record<PhaseStatus, string> = {
  Completed: '#22c55e',
  'In Progress': '#0ba0af',
  Pending: '#94a3b8',
  Delayed: '#ef4444',
};

const STATUS_LABELS: PhaseStatus[] = ['Completed', 'In Progress', 'Pending', 'Delayed'];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  color?: string;
  tooltip?: string;
  quartile?: string;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, subtitle, color, tooltip, quartile }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 120,
        bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        position: 'relative',
      }}
    >
      {tooltip && (
        <Tooltip title={tooltip} placement="top">
          <IconButton size="small" sx={{ position: 'absolute', top: 6, right: 6, p: 0.3, opacity: 0.4 }}>
            <Info size={13} />
          </IconButton>
        </Tooltip>
      )}
      <Typography variant="caption" sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5, fontWeight: 700 }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 800, color: color || 'text.primary', lineHeight: 1.1 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ fontSize: 10, opacity: 0.6 }}>
          {subtitle}
        </Typography>
      )}
      {quartile && (
        <Box sx={{ mt: 0.5, display: 'flex', gap: 0.4 }}>
          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
            <Box
              key={q}
              sx={{
                flex: 1,
                height: 4,
                borderRadius: 1,
                bgcolor: q === quartile ? (color || 'primary.main') : 'rgba(128,128,128,0.2)',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
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
  const start = new Date(rangeMin);
  const cur = new Date(start.getFullYear(), start.getMonth(), 1);
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

const ROW_HEIGHT = 32;

interface GanttProps {
  campaigns: Campaign[];
  brandFilter: string;
  categoryFilter: string;
}

const GanttChart: React.FC<GanttProps> = ({ campaigns, brandFilter, categoryFilter }) => {
  const theme = useTheme();

  const filtered = campaigns.filter(c => {
    if (brandFilter !== 'All' && c.brand !== brandFilter) return false;
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    return true;
  });

  const { min, max } = ganttRange(filtered.length > 0 ? filtered : campaigns);
  const months = monthLabels(min, max);

  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());

  const brands = Array.from(new Set(filtered.map(c => c.brand)));

  const toggleBrand = (brand: string) => {
    setExpandedBrands(prev => { const s = new Set(prev); s.has(brand) ? s.delete(brand) : s.add(brand); return s; });
  };
  const toggleCampaign = (id: string) => {
    setExpandedCampaigns(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };
  const togglePhase = (id: string) => {
    setExpandedPhases(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  };

  const rowBg = (i: number) =>
    i % 2 === 0
      ? theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'
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
        <Box sx={{ width: '30%', minWidth: 180, flexShrink: 0, px: 1.5, display: 'flex', alignItems: 'center', gap: 0.5, borderRight: `1px solid ${theme.palette.divider}` }}>
          <Typography sx={{ fontSize: 11, fontWeight: 700, userSelect: 'none' }}>
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
          <Box sx={{ width: '30%', minWidth: 180, flexShrink: 0, px: 2, display: 'flex', alignItems: 'center', gap: 0.5, borderRight: `1px solid ${theme.palette.divider}` }}>
            <Typography sx={{ fontSize: 10, fontWeight: 600, userSelect: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isExpandedCampaign ? '▼' : '▶'} {campaign.name.split('_')[1] || campaign.name}
            </Typography>
          </Box>
          <Box sx={{ flex: 1, position: 'relative', height: '100%' }}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                transform: 'translateY(-50%)',
                height: 14,
                borderRadius: 1,
                ...bs,
              }}
            />
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
            <Box sx={{ width: '30%', minWidth: 180, flexShrink: 0, px: 3, display: 'flex', alignItems: 'center', gap: 0.5, borderRight: `1px solid ${theme.palette.divider}` }}>
              <Typography sx={{ fontSize: 9, opacity: 0.6, userSelect: 'none' }}>
                {isExpandedPhase ? '▼' : '▶'} {String(phase.number).padStart(2, '0')} — {phase.name}
              </Typography>
              <Box sx={{ ml: 0.5, px: 0.6, py: 0.1, borderRadius: 0.5, bgcolor: phaseColor + '22', border: `1px solid ${phaseColor}44` }}>
                <Typography sx={{ fontSize: 7, color: phaseColor, fontWeight: 700 }}>{phase.status}</Typography>
              </Box>
            </Box>
            <Box sx={{ flex: 1, position: 'relative', height: '100%' }}>
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  height: 10,
                  borderRadius: 1,
                  opacity: 0.85,
                  ...pbs,
                }}
              />
            </Box>
          </Box>
        );

        if (!isExpandedPhase) return;

        phase.tasks.forEach(task => {
          const tri = rowIndex++;
          rows.push(
            <Box
              key={`task-${task.id}`}
              sx={{ display: 'flex', height: ROW_HEIGHT, alignItems: 'center', bgcolor: rowBg(tri) }}
            >
              <Box sx={{ width: '30%', minWidth: 180, flexShrink: 0, px: 4.5, display: 'flex', alignItems: 'center', gap: 0.5, borderRight: `1px solid ${theme.palette.divider}` }}>
                <Typography sx={{ fontSize: 9, opacity: 0.5, userSelect: 'none' }}>• {task.name}</Typography>
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
      <Box sx={{ display: 'flex', height: 28, borderBottom: `1px solid ${theme.palette.divider}`, flexShrink: 0 }}>
        <Box sx={{ width: '30%', minWidth: 180, flexShrink: 0, px: 1.5, display: 'flex', alignItems: 'center', borderRight: `1px solid ${theme.palette.divider}` }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 }}>Campaign</Typography>
        </Box>
        <Box sx={{ flex: 1, position: 'relative' }}>
          {months.map((m, i) => (
            <Box key={i} sx={{ position: 'absolute', left: m.left, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 1, height: '100%', bgcolor: theme.palette.divider, opacity: 0.5 }} />
              <Typography sx={{ fontSize: 9, opacity: 0.5, ml: 0.3, whiteSpace: 'nowrap' }}>{m.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
      {/* Rows */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {rows.length > 0 ? rows : (
          <Box sx={{ p: 3, textAlign: 'center', opacity: 0.4 }}>
            <Typography variant="caption">No campaigns match current filters</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

// ─── Main PMView ──────────────────────────────────────────────────────────────

const INDICATORS = ['Campaigns', 'On Time', 'Delayed'];
const HIERARCHY_OPTIONS = ['Month', 'Week', 'Quarter'];
const CATEGORY_OPTIONS = ['All', 'Biscuit', 'Savory'];

const PMView: React.FC = () => {
  const theme = useTheme();
  const [hierarchy, setHierarchy] = useState('Month');
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>(['Campaigns', 'On Time']);
  const [brandFilter, setBrandFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const allBrands = Array.from(new Set(MOCK_CAMPAIGNS.map(c => c.brand)));

  const totalCampaigns = MOCK_CAMPAIGNS.length;
  const activeCampaigns = MOCK_CAMPAIGNS.filter(c =>
    c.phases.some(p => p.status === 'In Progress')
  ).length;
  const delayedCampaigns = MOCK_CAMPAIGNS.filter(c =>
    c.phases.some(p => p.status === 'Delayed')
  ).length;
  const completedCampaigns = MOCK_CAMPAIGNS.filter(c =>
    c.phases.every(p => p.status === 'Completed')
  ).length;

  const phaseStatusCounts = STATUS_LABELS.map(status => ({
    name: status,
    value: MOCK_CAMPAIGNS.flatMap(c => c.phases).filter(p => p.status === status).length,
    color: PHASE_COLORS[status],
  }));

  const campaignsByBrand = allBrands.map(brand => ({
    brand,
    count: MOCK_CAMPAIGNS.filter(c => c.brand === brand).length,
  }));

  const lineKeys: Record<string, string> = {
    Campaigns: '#0ba0af',
    'On Time': '#22c55e',
    Delayed: '#ef4444',
  };
  const lineDataKeys: Record<string, string> = {
    Campaigns: 'campaigns',
    'On Time': 'onTime',
    Delayed: 'delayed',
  };

  const divider = theme.palette.divider;
  const cardBg = theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1.5, overflow: 'hidden' }}>

      {/* ── Level 1: KPIs (20%) ─────────────────────────────────────────── */}
      <Box sx={{ height: '20%', display: 'flex', gap: 1.5, flexShrink: 0 }}>

        {/* My Performance */}
        <Box sx={{ flex: 1, border: `1px solid ${divider}`, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: cardBg }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 }}>
            My Performance
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
            <KpiCard
              label="Total Campaigns"
              value={totalCampaigns}
              subtitle="All assigned"
              tooltip="Total number of campaigns currently assigned to you"
            />
            <KpiCard
              label="Active"
              value={activeCampaigns}
              subtitle="In progress"
              color="#0ba0af"
              tooltip="Campaigns with at least one phase currently In Progress"
            />
            <KpiCard
              label="Completed"
              value={completedCampaigns}
              subtitle="All phases done"
              color="#22c55e"
              tooltip="Campaigns where all 8 phases are completed"
            />
            <KpiCard
              label="Delayed"
              value={delayedCampaigns}
              subtitle="Behind schedule"
              color="#ef4444"
              tooltip="Campaigns with at least one phase marked as Delayed"
            />
            <KpiCard
              label="On-Time Rate"
              value={`${Math.round(((totalCampaigns - delayedCampaigns) / totalCampaigns) * 100)}%`}
              subtitle="Of total campaigns"
              color="#22c55e"
              tooltip="Percentage of campaigns without any delayed phase"
            />
          </Box>
        </Box>

        {/* My Ranking */}
        <Box sx={{ width: 280, border: `1px solid ${divider}`, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: cardBg }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 }}>
            My Ranking
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flex: 1 }}>
            <KpiCard
              label="Rank"
              value="#2"
              subtitle="vs team"
              color="#0ba0af"
              quartile="Q1"
              tooltip="Your position among all PMs on the Pepsico team based on on-time rate"
            />
            <KpiCard
              label="Score"
              value="87"
              subtitle="/ 100 pts"
              color="#0ba0af"
              quartile="Q1"
              tooltip="Composite performance score based on campaign completion and timing"
            />
          </Box>
        </Box>

      </Box>

      {/* ── Level 2: Line Chart (30%) ────────────────────────────────────── */}
      <Box sx={{ height: '30%', border: `1px solid ${divider}`, borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1, bgcolor: cardBg, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 }}>
            Campaign Trends
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small">
              <Select
                value={hierarchy}
                onChange={e => setHierarchy(e.target.value)}
                sx={{ fontSize: 11, height: 28, minWidth: 90 }}
              >
                {HIERARCHY_OPTIONS.map(h => <MenuItem key={h} value={h} sx={{ fontSize: 11 }}>{h}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small">
              <Select
                multiple
                value={selectedIndicators}
                onChange={e => setSelectedIndicators(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                input={<OutlinedInput />}
                renderValue={selected => (selected as string[]).join(', ')}
                sx={{ fontSize: 11, height: 28, minWidth: 140 }}
              >
                {INDICATORS.map(ind => (
                  <MenuItem key={ind} value={ind} sx={{ fontSize: 11 }}>
                    <Checkbox checked={selectedIndicators.includes(ind)} size="small" />
                    <ListItemText primary={ind} slotProps={{ primary: { sx: { fontSize: 11 } } }} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={LINE_CHART_DATA} margin={{ top: 4, right: 16, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis dataKey="period" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <RechartsTooltip contentStyle={{ fontSize: 11, background: theme.palette.background.paper }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            {selectedIndicators.map(ind => (
              <Line
                key={ind}
                type="monotone"
                dataKey={lineDataKeys[ind]}
                name={ind}
                stroke={lineKeys[ind]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </Box>

      {/* ── Level 3: Gantt + Charts (50%) ───────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0 }}>

        {/* Strip: filters */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5 }}>Total:</Typography>
            <Typography sx={{ fontSize: 12, fontWeight: 800, color: 'primary.main' }}>{totalCampaigns} campaigns</Typography>
          </Box>
          <FormControl size="small">
            <Select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} sx={{ fontSize: 11, height: 28, minWidth: 110 }}>
              <MenuItem value="All" sx={{ fontSize: 11 }}>All Brands</MenuItem>
              {allBrands.map(b => <MenuItem key={b} value={b} sx={{ fontSize: 11 }}>{b}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small">
            <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} sx={{ fontSize: 11, height: 28, minWidth: 110 }}>
              {CATEGORY_OPTIONS.map(c => <MenuItem key={c} value={c} sx={{ fontSize: 11 }}>{c === 'All' ? 'All Categories' : c}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>

        {/* Gantt + Side charts */}
        <Box sx={{ flex: 1, display: 'flex', gap: 1.5, minHeight: 0 }}>

          {/* Gantt — 55% */}
          <Box sx={{ width: '55%', border: `1px solid ${divider}`, borderRadius: 2, overflow: 'hidden', bgcolor: cardBg }}>
            <GanttChart campaigns={MOCK_CAMPAIGNS} brandFilter={brandFilter} categoryFilter={categoryFilter} />
          </Box>

          {/* Side charts — 45% */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.5, minHeight: 0 }}>

            {/* Pie: status distribution */}
            <Box sx={{ flex: 1, border: `1px solid ${divider}`, borderRadius: 2, p: 1.5, bgcolor: cardBg, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5, mb: 0.5 }}>
                Phase Status
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={phaseStatusCounts} cx="50%" cy="50%" innerRadius="35%" outerRadius="65%" dataKey="value" nameKey="name" paddingAngle={2}>
                    {phaseStatusCounts.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ fontSize: 11 }} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>

            {/* Bar: campaigns by brand */}
            <Box sx={{ flex: 1, border: `1px solid ${divider}`, borderRadius: 2, p: 1.5, bgcolor: cardBg, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Typography sx={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, opacity: 0.5, mb: 0.5 }}>
                Campaigns by Brand
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignsByBrand} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                  <XAxis dataKey="brand" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} allowDecimals={false} />
                  <RechartsTooltip contentStyle={{ fontSize: 11 }} />
                  <Bar dataKey="count" name="Campaigns" fill={theme.palette.primary.main} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>

          </Box>
        </Box>
      </Box>

    </Box>
  );
};

export default PMView;
