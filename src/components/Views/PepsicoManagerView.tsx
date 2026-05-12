import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  useTheme,
  Select,
  MenuItem,
  FormControl,
  Divider,
  Button,
  Menu,
} from '@mui/material';
import { IconButton, Tooltip as MuiTooltip } from '@mui/material';
import {
  Activity,
  Info,
  Calendar as CalendarIcon,
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
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import {
  Campaign,
  PHASE_DEFS,
  PHASE_COLORS,
  HierarchyKey,
  generateCampaignsForPM,
  generatePMMetrics,
  buildPMTrendData,
  buildTeamAvgTrendData,
} from '../../data/pepsicoMockData';

// ─── ManagementIndicator (tighter copy for narrower card) ────────────────────

interface IndicatorProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  formula: string;
  color?: string;
  description?: string;
}

const ManagementIndicator: React.FC<IndicatorProps> = ({
  title,
  value,
  icon,
  formula,
  color = 'primary.main',
  description,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

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
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}1A`, color, display: 'flex' }}>{icon}</Box>
        <MuiTooltip
          title={
            <Box sx={{ p: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, display: 'block', mb: 0.5, color: '#fff' }}>
                HOW IS IT CALCULATED?
              </Typography>
              <Typography variant="caption" sx={{ fontFamily: '"JetBrains Mono", monospace', display: 'block', mb: 1 }}>
                {formula}
              </Typography>
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
          fontSize: '1.2rem',
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="h3"
        sx={{
          fontWeight: 900,
          color,
          fontFamily: isDark ? '"JetBrains Mono", monospace' : 'inherit',
          textShadow: isDark ? `0 0 20px ${color}33` : 'none',
          fontSize: '2.5rem',
          whiteSpace: 'nowrap',
          lineHeight: 1.1,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
};

// ─── Gantt helpers ────────────────────────────────────────────────────────────

function ganttRange(campaigns: Campaign[]) {
  const all = campaigns.flatMap(c => [c.startDate, c.endDate, ...c.phases.flatMap(p => [p.startDate, p.endDate])]);
  return { min: Math.min(...all.map(d => d.getTime())), max: Math.max(...all.map(d => d.getTime())) };
}

function barStyle(start: Date, end: Date, rangeMin: number, rangeMax: number, color: string) {
  const total = rangeMax - rangeMin;
  const left  = ((start.getTime() - rangeMin) / total) * 100;
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
      labels.push({ label: cur.toLocaleString('default', { month: 'short', year: '2-digit' }), left: `${left}%` });
    }
    cur.setMonth(cur.getMonth() + 1);
  }
  return labels;
}

// ─── Gantt component ──────────────────────────────────────────────────────────

const ROW_HEIGHT = 34;

interface GanttProps {
  campaigns: Campaign[];
  brandFilter: string;
  categoryFilter: string;
  statusFilter: number | 'All';
}

const GanttChart: React.FC<GanttProps> = ({ campaigns, brandFilter, categoryFilter, statusFilter }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const currentPhaseOf = (c: Campaign) =>
    c.phases.find(p => p.status !== 'Completed') || c.phases[c.phases.length - 1];

  const filtered = campaigns.filter(c => {
    if (brandFilter !== 'All' && c.brand !== brandFilter) return false;
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (statusFilter !== 'All' && currentPhaseOf(c).number !== statusFilter) return false;
    return true;
  });

  const source = filtered.length > 0 ? filtered : campaigns;
  if (source.length === 0) return (
    <Box sx={{ p: 3, textAlign: 'center', opacity: 0.4 }}>
      <Typography variant="caption">No campaigns to display</Typography>
    </Box>
  );

  const { min, max } = ganttRange(source);
  const months = monthLabels(min, max);

  const [expandedBrands, setExpandedBrands]       = useState<Set<string>>(new Set());
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedPhases, setExpandedPhases]       = useState<Set<string>>(new Set());

  const brands = Array.from(new Set(filtered.map(c => c.brand)));

  const toggleBrand    = (b: string)  => setExpandedBrands(p    => { const s = new Set(p); s.has(b)  ? s.delete(b)  : s.add(b);  return s; });
  const toggleCampaign = (id: string) => setExpandedCampaigns(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const togglePhase    = (id: string) => setExpandedPhases(p    => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });

  const rowBg = (i: number) => i % 2 === 0 ? (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)') : 'transparent';

  let rowIndex = 0;
  const rows: React.ReactNode[] = [];

  brands.forEach(brand => {
    const brandCampaigns   = filtered.filter(c => c.brand === brand);
    const isExpandedBrand  = expandedBrands.has(brand);
    const ri               = rowIndex++;

    rows.push(
      <Box key={`brand-${brand}`} sx={{ display: 'flex', height: ROW_HEIGHT, alignItems: 'center', bgcolor: rowBg(ri), cursor: 'pointer' }} onClick={() => toggleBrand(brand)}>
        <Box sx={{ width: '32%', minWidth: 160, flexShrink: 0, px: 1.5, display: 'flex', alignItems: 'center', gap: 0.5, borderRight: `1px solid ${theme.palette.divider}` }}>
          <Typography sx={{ fontSize: 13, fontWeight: 800, color: theme.palette.primary.main, userSelect: 'none', letterSpacing: 0.5 }}>
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
      const bs  = barStyle(campaign.startDate, campaign.endDate, min, max, theme.palette.primary.main);

      rows.push(
        <Box key={`campaign-${campaign.id}`} sx={{ display: 'flex', height: ROW_HEIGHT, alignItems: 'center', bgcolor: rowBg(cri), cursor: 'pointer' }} onClick={() => toggleCampaign(campaign.id)}>
          <Box sx={{ width: '32%', minWidth: 160, flexShrink: 0, pl: 2.5, pr: 1, display: 'flex', alignItems: 'center', gap: 0.5, borderRight: `1px solid ${theme.palette.divider}` }}>
            <Typography sx={{ fontSize: 12, fontWeight: 600, userSelect: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
          <Box key={`phase-${phase.id}`} sx={{ display: 'flex', height: ROW_HEIGHT, alignItems: 'center', bgcolor: rowBg(pri), cursor: 'pointer' }} onClick={() => togglePhase(phase.id)}>
            <Box sx={{ width: '32%', minWidth: 160, flexShrink: 0, pl: 4, pr: 1, display: 'flex', alignItems: 'center', gap: 0.5, borderRight: `1px solid ${theme.palette.divider}` }}>
              <Typography sx={{ fontSize: 11, opacity: 0.8, userSelect: 'none', flexShrink: 0 }}>
                {isExpandedPhase ? '▼' : '▶'} {String(phase.number).padStart(2, '0')} — {phase.name}
              </Typography>
              <Box sx={{ ml: 0.5, px: 0.6, py: 0.2, borderRadius: 0.4, bgcolor: phaseColor + '22', border: `1px solid ${phaseColor}66`, flexShrink: 0 }}>
                <Typography sx={{ fontSize: 9, color: phaseColor, fontWeight: 700 }}>{phase.status}</Typography>
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
                <Typography sx={{ fontSize: 11, opacity: 0.6, userSelect: 'none' }}>• {task.name}</Typography>
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
      <Box sx={{ display: 'flex', height: 30, borderBottom: `1px solid ${theme.palette.divider}`, flexShrink: 0, bgcolor: isDark ? 'rgba(11,160,175,0.06)' : 'rgba(11,160,175,0.04)' }}>
        <Box sx={{ width: '32%', minWidth: 160, flexShrink: 0, px: 1.5, display: 'flex', alignItems: 'center', borderRight: `1px solid ${theme.palette.divider}` }}>
          <Typography sx={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: theme.palette.primary.main, opacity: 0.85 }}>
            Campaign / Phase
          </Typography>
        </Box>
        <Box sx={{ flex: 1, position: 'relative' }}>
          {months.map((m, i) => (
            <Box key={i} sx={{ position: 'absolute', left: m.left, top: 0, bottom: 0, display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 1, height: '100%', bgcolor: theme.palette.divider, opacity: 0.4 }} />
              <Typography sx={{ fontSize: 11, opacity: 0.7, ml: 0.4, whiteSpace: 'nowrap', fontWeight: 700 }}>{m.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
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

// ─── Constants ────────────────────────────────────────────────────────────────

const HIERARCHY_LABELS: Record<HierarchyKey, string> = {
  day: 'DAYS', week: 'WEEKS', month: 'MONTHS', quarter: 'QUARTERS', year: 'YEARS',
};

const TREND_INDICATORS = ['Performance', 'On Time Rate', 'QA Rate'] as const;
const CATEGORY_OPTIONS = ['All', 'Biscuit', 'Savory'];

const getKpiColor = (val: number) => {
  if (val >= 85) return '#b9e04d';
  if (val >= 70) return '#ffcc00';
  return '#ea5713';
};

// ─── Main PepsicoManagerView ──────────────────────────────────────────────────

const PepsicoManagerView: React.FC = () => {
  const theme   = useTheme();
  const isDark  = theme.palette.mode === 'dark';
  const { users, startDate, endDate } = useAuth();

  const [hierarchy, setHierarchy]             = useState<HierarchyKey>('day');
  const [hierarchyAnchor, setHierarchyAnchor] = useState<null | HTMLElement>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<string>('Performance');
  const [brandFilter, setBrandFilter]         = useState('All');
  const [categoryFilter, setCategoryFilter]   = useState('All');
  const [statusFilter, setStatusFilter]       = useState<number | 'All'>('All');
  const [selectedPM, setSelectedPM]           = useState<string | null>(null);

  // ── Team: all PMs with client=Pepsico ─────────────────────────────────────
  const teamPMs = useMemo(
    () => Object.values(users).filter(u => u.role === 'PM' && u.client === 'Pepsico'),
    [users],
  );
  const teamRfcs = useMemo(() => teamPMs.map(u => u.rfc), [teamPMs]);

  // ── Per-PM metrics (same values each PM sees in their own PMView) ─────────
  const teamMetrics = useMemo(
    () => teamPMs.map(pm => ({ rfc: pm.rfc, name: pm.name, ...generatePMMetrics(pm.rfc) })),
    [teamPMs],
  );

  const avgPerformance = useMemo(() =>
    teamMetrics.length > 0
      ? Math.round(teamMetrics.reduce((s, m) => s + m.performance, 0) / teamMetrics.length)
      : 0,
    [teamMetrics],
  );

  // ── Ranking (sorted desc by performance, grouped into quartiles) ──────────
  const quartileData = useMemo(() => {
    const sorted = [...teamMetrics].sort((a, b) => b.performance - a.performance);
    return sorted.map((m, i) => {
      const pct     = sorted.length > 1 ? (i / (sorted.length - 1)) * 100 : 0;
      const quartile = pct >= 75 ? 'Q4' : pct >= 50 ? 'Q3' : pct >= 25 ? 'Q2' : 'Q1';
      return { ...m, quartile };
    });
  }, [teamMetrics]);

  // ── All campaigns aggregated from team ───────────────────────────────────
  const allCampaigns = useMemo(
    () => teamRfcs.flatMap(rfc => generateCampaignsForPM(rfc)),
    [teamRfcs],
  );

  // ── Campaigns for selected PM only (drives Pie / Gantt / Bar when active) ─
  const selectedPMCampaigns = useMemo(
    () => selectedPM ? generateCampaignsForPM(selectedPM) : null,
    [selectedPM],
  );

  // displayCampaigns = single PM when selected, otherwise full team
  const displayCampaigns = selectedPMCampaigns ?? allCampaigns;

  const currentPhaseOf = (c: Campaign) =>
    c.phases.find(p => p.status !== 'Completed') || c.phases[c.phases.length - 1];

  const filteredCampaigns = useMemo(() =>
    displayCampaigns.filter(c => {
      if (brandFilter !== 'All' && c.brand !== brandFilter) return false;
      if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
      if (statusFilter !== 'All' && currentPhaseOf(c).number !== statusFilter) return false;
      return true;
    }),
    [displayCampaigns, brandFilter, categoryFilter, statusFilter],
  );

  const totalCampaigns  = displayCampaigns.length;
  const filteredTotal   = filteredCampaigns.length;
  const allBrands       = useMemo(() => Array.from(new Set(displayCampaigns.map(c => c.brand))), [displayCampaigns]);

  // ── Pie: phase distribution (display scope) ───────────────────────────────
  const campaignsByPhase = useMemo(() =>
    PHASE_DEFS.map(def => ({
      name:  `${String(def.number).padStart(2, '0')} ${def.name}`,
      value: displayCampaigns.filter(c => currentPhaseOf(c).number === def.number).length,
      color: def.color,
    })),
    [displayCampaigns],
  );

  // ── Bar: filtered campaigns by brand (display scope) ─────────────────────
  const campaignsByBrand = useMemo(() =>
    allBrands
      .map(brand => ({ brand, count: filteredCampaigns.filter(c => c.brand === brand).length }))
      .filter(x => x.count > 0),
    [allBrands, filteredCampaigns],
  );

  // ── Team average trend data ───────────────────────────────────────────────
  const teamAvgTrend = useMemo(
    () => buildTeamAvgTrendData(startDate, endDate, hierarchy, teamRfcs),
    [startDate, endDate, hierarchy, teamRfcs],
  );

  // ── Selected PM individual trend ─────────────────────────────────────────
  const memberTrend = useMemo(
    () => selectedPM ? buildPMTrendData(startDate, endDate, hierarchy, selectedPM) : null,
    [selectedPM, startDate, endDate, hierarchy],
  );

  // ── Merged chart data (team avg + optional member line) ──────────────────
  const chartData = useMemo(() =>
    teamAvgTrend.map((point, i) => ({
      name:          point.name,
      'Team Average': (point as any)[selectedIndicator] as number,
      ...(memberTrend
        ? { 'Member': (memberTrend[i]?.[selectedIndicator as keyof typeof memberTrend[0]] as number) ?? 0 }
        : {}),
    })),
    [teamAvgTrend, memberTrend, selectedIndicator],
  );

  // ── Tooltip styles ────────────────────────────────────────────────────────
  const tooltipStyle = {
    contentStyle: {
      backgroundColor: isDark ? 'rgba(0, 8, 20, 0.95)' : '#fff',
      border: `2px solid ${theme.palette.primary.main}`,
      borderRadius: 8, fontSize: 16, fontWeight: 800, boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
    },
    itemStyle: { fontSize: 14, padding: '4px 0' },
    labelStyle: { fontSize: 14, marginBottom: 8, fontWeight: 800, color: theme.palette.primary.main, borderBottom: '1px solid rgba(0,0,0,0.1)', paddingBottom: 4 },
  };

  const barTooltipStyle = {
    contentStyle: {
      backgroundColor: isDark ? 'rgba(0, 8, 20, 0.95)' : '#fff',
      border: `1px solid ${theme.palette.primary.main}33`,
      borderRadius: 4, fontSize: 14, fontWeight: 600,
    },
    itemStyle: { fontSize: 13 },
    labelStyle: { fontSize: 13, marginBottom: 4, fontWeight: 700 },
  };

  const selectedPMName = selectedPM ? teamPMs.find(u => u.rfc === selectedPM)?.name.split(' ')[0] ?? selectedPM : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 2, overflow: 'hidden' }}>

      {/* ── Row 1: Avg Performance KPI (30%) + Team Ranking (70%) ─ 30% height */}
      <Box sx={{ height: '30%', display: 'flex', gap: 2, flexShrink: 0 }}>

        {/* KPI */}
        <Box sx={{ width: '30%', flexShrink: 0 }}>
          <ManagementIndicator
            title="Avg. Performance Team"
            value={teamMetrics.length > 0 ? `${avgPerformance}%` : '—'}
            icon={<Activity size={24} />}
            formula="AVG of all PMs: (On Time Rate × 50%) + (QA Rate × 50%)"
            color={getKpiColor(avgPerformance)}
            description="Average performance score of all Pepsico PM team members. Computed as the mean of each PM's individual performance."
          />
        </Box>

        {/* Team Members Ranking */}
        <Paper
          elevation={0}
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            bgcolor: isDark ? 'transparent' : 'rgba(11, 160, 175, 0.05)',
            border: isDark ? '1px solid rgba(11, 160, 175, 0.3)' : '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ px: 2, pt: 1.5, pb: 1, flexShrink: 0, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800 }}>
              Team Members Ranking (Performance)
            </Typography>
            {selectedPMName && (
              <Typography variant="caption" sx={{ ml: 1.5, opacity: 0.6, fontSize: 11 }}>
                — showing {selectedPMName} in chart
              </Typography>
            )}
          </Box>

          <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1 }}>
            {teamMetrics.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 3, opacity: 0.4 }}>
                <Typography variant="caption">No team members loaded</Typography>
              </Box>
            ) : (
              ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
                const items = quartileData.filter(d => d.quartile === q);
                if (items.length === 0) return null;
                const qColor = q === 'Q1' ? '#b9e04d' : q === 'Q2' ? '#ffcc00' : q === 'Q3' ? '#ff9900' : '#ea5713';
                return (
                  <Box key={q} sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, fontSize: 10, bgcolor: qColor, color: '#000', px: 1, borderRadius: 0.5 }}>
                        {q}
                      </Typography>
                      <Divider sx={{ flex: 1, opacity: 0.2 }} />
                    </Box>
                    {items.map(member => (
                      <Box
                        key={member.rfc}
                        onClick={() => setSelectedPM(selectedPM === member.rfc ? null : member.rfc)}
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          p: 0.8,
                          mb: 0.4,
                          borderRadius: 1,
                          cursor: 'pointer',
                          bgcolor: selectedPM === member.rfc ? 'rgba(11, 160, 175, 0.15)' : 'transparent',
                          border: selectedPM === member.rfc
                            ? `1px solid ${theme.palette.primary.main}`
                            : '1px solid transparent',
                          '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: getKpiColor(member.performance), flexShrink: 0 }} />
                          <Typography sx={{ fontSize: 13, fontWeight: selectedPM === member.rfc ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                            {member.name}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontSize: 12, fontWeight: 900, fontFamily: '"JetBrains Mono", monospace', opacity: 0.8, flexShrink: 0 }}>
                          {member.performance}%
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                );
              })
            )}
          </Box>
        </Paper>
      </Box>

      {/* ── Row 2: Line chart (60%) + Pie chart (40%) ─── 28% height ───────── */}
      <Box sx={{ height: '28%', display: 'flex', gap: 2, flexShrink: 0 }}>

        {/* Line chart — team avg + optional member */}
        <Paper
          elevation={0}
          sx={{
            flex: 3,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            bgcolor: isDark ? 'transparent' : 'rgba(11, 160, 175, 0.05)',
            border: isDark ? '1px solid rgba(11, 160, 175, 0.3)' : '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1, flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: theme.palette.primary.main, whiteSpace: 'nowrap', fontSize: 11 }}>
                Team Trends
              </Typography>
              <FormControl size="small" sx={{ minWidth: 160 }}>
                <Select
                  value={selectedIndicator}
                  onChange={e => setSelectedIndicator(e.target.value)}
                  sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white', fontSize: 12, height: 30 }}
                >
                  {TREND_INDICATORS.map(opt => (
                    <MenuItem key={opt} value={opt} sx={{ fontSize: 12 }}>{opt}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, opacity: 0.5, fontSize: 10, letterSpacing: 1 }}>TIME_SCALE</Typography>
              <Button
                size="small"
                variant="outlined"
                onClick={e => setHierarchyAnchor(e.currentTarget)}
                startIcon={<CalendarIcon size={13} />}
                sx={{ fontSize: 11, fontWeight: 800, color: 'primary.main', borderColor: 'rgba(11, 160, 175, 0.3)', height: 30, px: 1.5, bgcolor: isDark ? 'rgba(11, 160, 175, 0.05)' : 'transparent', '&:hover': { borderColor: 'primary.main', bgcolor: 'rgba(11, 160, 175, 0.1)' } }}
              >
                {HIERARCHY_LABELS[hierarchy]}
              </Button>
              <Menu
                anchorEl={hierarchyAnchor}
                open={Boolean(hierarchyAnchor)}
                onClose={() => setHierarchyAnchor(null)}
                slotProps={{ paper: { sx: { bgcolor: isDark ? '#000A1A' : '#fff', border: '1px solid rgba(11, 160, 175, 0.3)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', '& .MuiMenuItem-root': { fontSize: 12, fontWeight: 700, py: 1, '&:hover': { bgcolor: 'rgba(11, 160, 175, 0.1)' } } } } }}
              >
                {(['day', 'week', 'month', 'quarter', 'year'] as HierarchyKey[]).map(h => (
                  <MenuItem key={h} onClick={() => { setHierarchy(h); setHierarchyAnchor(null); }}>
                    {HIERARCHY_LABELS[h]}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 8, right: 24, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fontWeight: 700, fill: '#0ba0af' }} stroke="rgba(11, 160, 175, 0.4)" dy={4} />
                <YAxis tick={{ fontSize: 12, fontWeight: 800 }} stroke={theme.palette.primary.main} width={40} domain={[0, 100]} />
                <Tooltip contentStyle={tooltipStyle.contentStyle} itemStyle={tooltipStyle.itemStyle} labelStyle={tooltipStyle.labelStyle} />
                <Legend verticalAlign="bottom" height={24} iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12, fontWeight: 800 }} />
                <Line
                  type="monotone"
                  dataKey="Team Average"
                  stroke={theme.palette.primary.main}
                  strokeWidth={4}
                  dot={{ r: 4, strokeWidth: 3, fill: isDark ? '#000A1A' : '#fff' }}
                  activeDot={{ r: 8, strokeWidth: 0 }}
                  animationDuration={1200}
                />
                {memberTrend && (
                  <Line
                    type="monotone"
                    dataKey="Member"
                    name={selectedPMName ?? 'Member'}
                    stroke="#B018D9"
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ r: 4 }}
                    activeDot={{ r: 7, strokeWidth: 0 }}
                    animationDuration={800}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Pie chart */}
        <Paper
          elevation={0}
          sx={{
            flex: 2,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            minWidth: 0,
            bgcolor: isDark ? 'transparent' : 'rgba(11, 160, 175, 0.05)',
            border: isDark ? '1px solid rgba(11, 160, 175, 0.3)' : '1px solid rgba(0,0,0,0.05)',
          }}
        >
          <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, mb: 0.5, display: 'block' }}>
            Campaign Distribution by Status
          </Typography>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={campaignsByPhase} cx="50%" cy="48%" innerRadius={0} outerRadius="68%" dataKey="value" nameKey="name" paddingAngle={1}>
                {campaignsByPhase.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={barTooltipStyle.contentStyle} itemStyle={barTooltipStyle.itemStyle} labelStyle={barTooltipStyle.labelStyle} />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} iconType="circle" iconSize={9} />
            </PieChart>
          </ResponsiveContainer>
        </Paper>
      </Box>

      {/* ── Row 3: Filters + Gantt + Bar ─────────────────────────────────── */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minHeight: 0 }}>

        {/* Filter strip */}
        <Box sx={{ display: 'flex', alignItems: 'stretch', gap: 2, flexShrink: 0 }}>

          {/* Total campaigns KPI tile */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 0.8, borderRadius: 1.5,
            bgcolor: isDark ? 'rgba(11, 160, 175, 0.12)' : 'rgba(11, 160, 175, 0.1)',
            border: `1.5px solid ${theme.palette.primary.main}`,
            boxShadow: isDark ? `0 0 12px ${theme.palette.primary.main}33` : 'none',
          }}>
            <Typography sx={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: theme.palette.primary.main, opacity: 0.85, lineHeight: 1.1 }}>
              Total<br />Campaigns
            </Typography>
            <Typography sx={{ fontSize: 28, fontWeight: 900, color: theme.palette.primary.main, fontFamily: isDark ? '"JetBrains Mono", monospace' : 'inherit', textShadow: isDark ? `0 0 12px ${theme.palette.primary.main}66` : 'none', lineHeight: 1 }}>
              {filteredTotal}
            </Typography>
            {filteredTotal !== totalCampaigns && (
              <Typography sx={{ fontSize: 10, opacity: 0.5, fontWeight: 700, alignSelf: 'flex-end' }}>
                / {totalCampaigns}
              </Typography>
            )}
          </Box>

          <FormControl size="small">
            <Select value={brandFilter} onChange={e => setBrandFilter(e.target.value)} sx={{ fontSize: 12, height: 36, minWidth: 130, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }}>
              <MenuItem value="All" sx={{ fontSize: 12 }}>All Brands</MenuItem>
              {allBrands.map(b => <MenuItem key={b} value={b} sx={{ fontSize: 12 }}>{b}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small">
            <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} sx={{ fontSize: 12, height: 36, minWidth: 130, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }}>
              {CATEGORY_OPTIONS.map(c => <MenuItem key={c} value={c} sx={{ fontSize: 12 }}>{c === 'All' ? 'All Categories' : c}</MenuItem>)}
            </Select>
          </FormControl>

          <FormControl size="small">
            <Select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as number | 'All')}
              sx={{ fontSize: 12, height: 36, minWidth: 180, bgcolor: isDark ? 'rgba(255,255,255,0.05)' : 'white' }}
              renderValue={val => {
                if (val === 'All') return 'All Status';
                const def = PHASE_DEFS.find(p => p.number === val);
                return def ? `${String(def.number).padStart(2, '0')} ${def.name}` : 'All Status';
              }}
            >
              <MenuItem value="All" sx={{ fontSize: 12 }}>All Status</MenuItem>
              {PHASE_DEFS.map(def => (
                <MenuItem key={def.number} value={def.number} sx={{ fontSize: 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: def.color }} />
                    {String(def.number).padStart(2, '0')} {def.name}
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Gantt + Bar side by side */}
        <Box sx={{ flex: 1, display: 'flex', gap: 2, minHeight: 0 }}>

          {/* Gantt */}
          <Paper
            elevation={0}
            sx={{
              flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 0,
              bgcolor: isDark ? 'transparent' : 'rgba(11, 160, 175, 0.05)',
              border: isDark ? '1px solid rgba(11, 160, 175, 0.3)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <Box sx={{ px: 2, pt: 1.5, pb: 0.5, flexShrink: 0, borderBottom: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800 }}>
                Campaign Gantt{selectedPMName ? ` — ${selectedPMName}` : ' — Full Team'}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <GanttChart campaigns={displayCampaigns} brandFilter={brandFilter} categoryFilter={categoryFilter} statusFilter={statusFilter} />
            </Box>
          </Paper>

          {/* Bar chart */}
          <Paper
            elevation={0}
            sx={{
              flex: 1, p: 2, display: 'flex', flexDirection: 'column', minHeight: 0,
              bgcolor: isDark ? 'transparent' : 'rgba(11, 160, 175, 0.05)',
              border: isDark ? '1px solid rgba(11, 160, 175, 0.3)' : '1px solid rgba(0,0,0,0.05)',
            }}
          >
            <Typography variant="caption" sx={{ color: theme.palette.primary.main, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 800, mb: 0.5, display: 'block' }}>
              Campaigns by Brand{selectedPMName ? ` — ${selectedPMName}` : ' — Full Team'}
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignsByBrand} margin={{ top: 8, right: 12, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
                <XAxis dataKey="brand" tick={{ fontSize: 11, fontWeight: 700, fill: '#0ba0af' }} stroke="rgba(11, 160, 175, 0.4)" />
                <YAxis tick={{ fontSize: 12, fontWeight: 800 }} stroke={theme.palette.primary.main} allowDecimals={false} />
                <Tooltip contentStyle={barTooltipStyle.contentStyle} itemStyle={barTooltipStyle.itemStyle} labelStyle={barTooltipStyle.labelStyle} formatter={(val: any) => [val, 'Campaigns']} />
                <Bar dataKey="count" name="Campaigns" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Box>
      </Box>

    </Box>
  );
};

export default PepsicoManagerView;
