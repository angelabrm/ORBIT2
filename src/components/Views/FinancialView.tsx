
import React, { useState, useMemo } from 'react';
import {
  Box, Typography, Paper, useTheme, Button, Menu, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, PieChart, Pie, Cell, LabelList,
} from 'recharts';
import { DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

type HierarchyType    = 'month' | 'quarter' | 'year';
type ClientFilter     = 'All Clients' | 'Stellantis' | 'Pepsico';
type Stellantisdept   = 'All' | 'CAC' | 'Fleet' | 'Premium';
type FinancialIndicator = 'Income' | 'Cost' | 'Revenue';

// ── Mock financials (MXN / month) ──────────────────────────────────────────
const CLIENT_MONTHLY: Record<string, { income: number; cost: number }> = {
  Stellantis: { income: 3_880_000, cost: 2_780_000 },
  Pepsico:    { income: 1_600_000, cost: 1_240_000 },
};

// CAC + Fleet + Premium must sum to Stellantis totals
const DEPT_MONTHLY: Record<string, { income: number; cost: number }> = {
  CAC:     { income: 1_200_000, cost: 870_000  },
  Fleet:   { income: 1_430_000, cost: 1_020_000 },
  Premium: { income: 1_250_000, cost: 890_000  },
};

const COST_CATEGORIES = [
  { category: 'FTE Salary',     pct: 35, color: '#0ba0af' },
  { category: 'Staff Salary',   pct: 20, color: '#001e60' },
  { category: 'Bonus',          pct: 10, color: '#b9e04d' },
  { category: 'Licences',       pct: 15, color: '#ea5713' },
  { category: 'Computers',      pct:  8, color: '#7c4dff' },
  { category: 'Infrastructure', pct: 12, color: '#ff6b6b' },
];

const CLIENT_COLORS: Record<string, string> = {
  Stellantis: '#0ba0af',
  Pepsico:    '#001e60',
};

const DEPT_COLORS: Record<string, string> = {
  CAC:     '#0ba0af',
  Fleet:   '#b9e04d',
  Premium: '#7c4dff',
};

const IND_COLORS: Record<FinancialIndicator, string> = {
  Income:  '#0ba0af',
  Cost:    '#ea5713',
  Revenue: '#b9e04d',
};

const ALL_CLIENTS: ClientFilter[]    = ['All Clients', 'Stellantis', 'Pepsico'];
const STELLANTIS_DEPTS               = ['CAC', 'Fleet', 'Premium'] as const;
const INDICATORS: FinancialIndicator[] = ['Income', 'Cost', 'Revenue'];
const HIER_OPTS: { value: HierarchyType; label: string }[] = [
  { value: 'month',   label: 'MONTHS'   },
  { value: 'quarter', label: 'QUARTERS' },
  { value: 'year',    label: 'YEARS'    },
];

const getQuarterKey = (d: dayjs.Dayjs) => `Q${Math.ceil((d.month() + 1) / 3)} ${d.year()}`;

const FinancialView: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { startDate, endDate } = useAuth();

  const [clientFilter, setClientFilter] = useState<ClientFilter>('All Clients');
  const [stellantisDept, setStellantisDepт] = useState<Stellantisdept>('All');
  const [hierarchy, setHierarchy]       = useState<HierarchyType>('month');
  const [hierAnchor, setHierAnchor]     = useState<null | HTMLElement>(null);
  const [selectedInds, setSelectedInds] = useState<FinancialIndicator[]>(['Income', 'Cost', 'Revenue']);

  const seed  = startDate.unix() + endDate.unix();
  const nudge = (val: number, salt: number) => val * (1 + Math.sin(seed + salt) * 0.1);

  const isStellantis = clientFilter === 'Stellantis';

  // ── Active segments driving ALL charts ──────────────────────────────────
  const segments = useMemo(() => {
    if (isStellantis) {
      const depts = stellantisDept === 'All'
        ? [...STELLANTIS_DEPTS]
        : [stellantisDept as string];
      return depts.map(d => ({ name: d, base: DEPT_MONTHLY[d], color: DEPT_COLORS[d] }));
    }
    return (['Stellantis', 'Pepsico'] as const).map(c => ({
      name: c, base: CLIENT_MONTHLY[c], color: CLIENT_COLORS[c],
    }));
  }, [isStellantis, stellantisDept]);

  // ── Time-series ──────────────────────────────────────────────────────────
  const timeSeriesData = useMemo(() => {
    const groups = new Map<string, { income: number; cost: number }>();
    let curr = startDate.clone().startOf('month');

    while (!curr.isAfter(endDate.endOf('month'))) {
      const key =
        hierarchy === 'month'   ? curr.format('MMM YYYY') :
        hierarchy === 'quarter' ? getQuarterKey(curr)     :
                                  curr.format('YYYY');

      if (!groups.has(key)) groups.set(key, { income: 0, cost: 0 });
      const g = groups.get(key)!;

      segments.forEach((seg, i) => {
        g.income += nudge(seg.base.income, curr.unix() + i * 500);
        g.cost   += nudge(seg.base.cost,   curr.unix() + i * 500 + 1000);
      });
      curr = curr.add(1, 'month');
    }

    return Array.from(groups.entries()).map(([name, v]) => ({
      name,
      Income:  Math.round(v.income),
      Cost:    Math.round(v.cost),
      Revenue: v.cost > 0 ? Number((v.income / v.cost).toFixed(3)) : 0,
    }));
  }, [segments, startDate, endDate, hierarchy, seed]);

  // ── Segment totals for bar charts (full period) ──────────────────────────
  const segmentTotals = useMemo(() => {
    const months = Math.max(1, endDate.diff(startDate, 'month') + 1);
    return segments.map((seg, i) => {
      const n      = 1 + Math.sin(seed + i * 1000) * 0.1;
      const income = Math.round(seg.base.income * months * n);
      const cost   = Math.round(seg.base.cost   * months * n * 0.98);
      return { name: seg.name, color: seg.color, Income: income, Cost: cost, Revenue: Number((income / cost).toFixed(3)) };
    });
  }, [segments, startDate, endDate, seed]);

  const totalIncome   = useMemo(() => segmentTotals.reduce((s, c) => s + c.Income, 0), [segmentTotals]);
  const totalCost     = useMemo(() => segmentTotals.reduce((s, c) => s + c.Cost,   0), [segmentTotals]);
  const revenueMargin = totalIncome > 0 ? ((totalIncome - totalCost) / totalIncome) * 100 : 0;

  // ── Pie data ─────────────────────────────────────────────────────────────
  const incomePie = useMemo(() =>
    segmentTotals.map(s => ({
      name:  s.name,
      value: s.Income,
      pct:   totalIncome > 0 ? Math.round((s.Income / totalIncome) * 100) : 0,
      color: s.color,
    })),
  [segmentTotals, totalIncome]);

  const costData = useMemo(() =>
    COST_CATEGORIES.map(cat => ({ ...cat, value: Math.round(totalCost * cat.pct / 100) })),
  [totalCost]);

  // ── Formatting ───────────────────────────────────────────────────────────
  const fmtMXN   = (v: number) => `$${Math.round(v).toLocaleString('es-MX')}`;
  const fmtShort = (v: number) =>
    v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` :
    v >= 1_000     ? `$${Math.round(v / 1_000)}K`      : `$${v}`;

  const toggleInd = (ind: FinancialIndicator) =>
    setSelectedInds(prev =>
      prev.includes(ind)
        ? prev.length > 1 ? prev.filter(i => i !== ind) : prev
        : [...prev, ind]
    );

  const handleClientClick = (opt: ClientFilter) => {
    if (opt === 'Pepsico') return; // no functionality yet
    setClientFilter(opt);
    setStellantisDepт('All');
  };

  // ── Shared styles ─────────────────────────────────────────────────────────
  const gridStroke = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
  const tickFill   = isDark ? '#fff' : '#001e60';
  const paperSx    = { p: 1.5, height: '100%', display: 'flex', flexDirection: 'column' as const, borderRadius: 2 };
  const capLabel   = {
    color: 'primary.main', textTransform: 'uppercase' as const,
    letterSpacing: 1, fontWeight: 800, fontSize: 10, mb: 1, display: 'block',
  };

  const barGroupLabel = isStellantis ? 'per Department' : 'per Client';

  // ── Tooltips ──────────────────────────────────────────────────────────────
  const LineTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <Paper sx={{ p: 1.5, bgcolor: isDark ? '#000A1A' : '#fff', border: '1px solid rgba(11,160,175,0.2)', minWidth: 140 }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block', mb: 0.5 }}>{label}</Typography>
        {payload.map((e: any, i: number) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="caption" sx={{ color: e.color, opacity: 0.8 }}>{e.name}:</Typography>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              {e.name === 'Revenue' ? `${e.value.toFixed(2)}x` : fmtShort(e.value)}
            </Typography>
          </Box>
        ))}
      </Paper>
    );
  };

  const BarTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <Paper sx={{ p: 1.5, bgcolor: isDark ? '#000A1A' : '#fff', border: '1px solid rgba(11,160,175,0.2)' }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'primary.main', display: 'block', mb: 0.5 }}>{label}</Typography>
        {payload.map((e: any, i: number) => (
          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
            <Typography variant="caption" sx={{ color: e.fill || e.color, opacity: 0.8 }}>{e.name}:</Typography>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>
              {e.name === 'Revenue' ? `${e.value.toFixed(2)}x` : fmtMXN(e.value)}
            </Typography>
          </Box>
        ))}
      </Paper>
    );
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0];
    return (
      <Paper sx={{ p: 1.5, bgcolor: isDark ? '#000A1A' : '#fff', border: '1px solid rgba(11,160,175,0.2)' }}>
        <Typography variant="caption" sx={{ fontWeight: 800, color: d.payload.color, display: 'block' }}>{d.name}</Typography>
        <Typography variant="caption">{fmtMXN(d.value)} · {d.payload.pct}%</Typography>
      </Paper>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', p: 1.5, gap: 1.5 }}>

      {/* ═══ ROW 1 — Top Bar ═══════════════════════════════════════════════ */}
      <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 0.5 }}>

        {/* Revenue KPI */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, borderRadius: 1.5, bgcolor: 'rgba(185,224,77,0.12)', color: '#b9e04d' }}>
            <DollarSign size={22} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ opacity: 0.45, fontSize: 9, letterSpacing: 1.5, textTransform: 'uppercase', display: 'block' }}>
              Revenue
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: '#b9e04d', lineHeight: 1 }}>
              {revenueMargin.toFixed(1)}%
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.4, fontSize: 9 }}>
              Gross Margin · {startDate.format('MMM D')} – {endDate.format('MMM D, YYYY')}
            </Typography>
          </Box>
        </Box>

        {/* Client Filter + Stellantis dept drill-down */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* Client buttons */}
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            {ALL_CLIENTS.map(opt => {
              const isPepsico = opt === 'Pepsico';
              return (
                <Button
                  key={opt}
                  size="small"
                  variant={clientFilter === opt ? 'contained' : 'outlined'}
                  onClick={() => handleClientClick(opt)}
                  disabled={isPepsico}
                  sx={{
                    fontSize: 10, fontWeight: 700, px: 1.5, py: 0.5,
                    ...(isPepsico && { opacity: 0.3, cursor: 'default', pointerEvents: 'none' }),
                    ...(!isPepsico && clientFilter !== opt && { opacity: 0.5 }),
                  }}
                >
                  {opt}
                </Button>
              );
            })}
          </Box>

          {/* Stellantis dept sub-filter (only when Stellantis is selected) */}
          {isStellantis && (
            <>
              <Box sx={{ width: '1px', height: 20, bgcolor: 'rgba(11,160,175,0.3)', mx: 0.5 }} />
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                {(['All', ...STELLANTIS_DEPTS] as Stellantisdept[]).map(dept => (
                  <Button
                    key={dept}
                    size="small"
                    variant={stellantisDept === dept ? 'contained' : 'outlined'}
                    onClick={() => setStellantisDepт(dept)}
                    sx={{
                      fontSize: 9, fontWeight: 700, px: 1.2, py: 0.4,
                      ...(stellantisDept !== dept && { opacity: 0.5 }),
                      ...(stellantisDept === dept && {
                        bgcolor: DEPT_COLORS[dept] ?? 'primary.main',
                        borderColor: DEPT_COLORS[dept] ?? 'primary.main',
                        '&:hover': { bgcolor: DEPT_COLORS[dept] ?? 'primary.main' },
                      }),
                    }}
                  >
                    {dept === 'All' ? 'All Depts' : dept}
                  </Button>
                ))}
              </Box>
            </>
          )}
        </Box>
      </Box>

      {/* ═══ ROW 2 — Line Chart + Bar Charts ══════════════════════════════ */}
      <Box sx={{ flex: 3, minHeight: 0, display: 'flex', gap: 1.5 }}>

        {/* Line Chart */}
        <Paper sx={{ ...paperSx, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexShrink: 0 }}>
            <Typography variant="caption" sx={capLabel}>Financial Trend</Typography>
            <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
              {INDICATORS.map(ind => (
                <Button
                  key={ind}
                  size="small"
                  onClick={() => toggleInd(ind)}
                  sx={{
                    fontSize: 9, fontWeight: 800, px: 1.2, py: 0.3, minWidth: 0,
                    border: `1px solid ${IND_COLORS[ind]}`,
                    ...(selectedInds.includes(ind)
                      ? { bgcolor: IND_COLORS[ind], color: ind === 'Revenue' ? '#000' : '#fff', '&:hover': { bgcolor: IND_COLORS[ind] } }
                      : { color: IND_COLORS[ind], bgcolor: 'transparent', opacity: 0.45, '&:hover': { opacity: 0.75, bgcolor: 'transparent' } }
                    ),
                  }}
                >
                  {ind}
                </Button>
              ))}
              <Button
                size="small"
                variant="outlined"
                onClick={e => setHierAnchor(e.currentTarget)}
                startIcon={<CalendarIcon size={11} />}
                sx={{ fontSize: 9, fontWeight: 800, px: 1.2, py: 0.3, height: 26 }}
              >
                {HIER_OPTS.find(h => h.value === hierarchy)?.label}
              </Button>
              <Menu
                anchorEl={hierAnchor}
                open={Boolean(hierAnchor)}
                onClose={() => setHierAnchor(null)}
                slotProps={{
                  paper: {
                    sx: {
                      bgcolor: isDark ? '#000A1A' : '#fff',
                      border: '1px solid rgba(11,160,175,0.3)',
                      '& .MuiMenuItem-root': { fontSize: 12, fontWeight: 700, py: 0.8, '&:hover': { bgcolor: 'rgba(11,160,175,0.1)' } },
                    }
                  }
                }}
              >
                {HIER_OPTS.map(h => (
                  <MenuItem key={h.value} onClick={() => { setHierarchy(h.value); setHierAnchor(null); }}>
                    {h.label}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData} margin={{ top: 8, right: 50, left: 8, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickFill, opacity: 0.55 }} interval="preserveStartEnd" />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: tickFill, opacity: 0.5 }} tickFormatter={fmtShort} />
                {selectedInds.includes('Revenue') && (
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fill: '#b9e04d', opacity: 0.8 }}
                    tickFormatter={v => `${v.toFixed(2)}x`} domain={['auto', 'auto']}
                  />
                )}
                <Tooltip content={<LineTooltip />} cursor={{ stroke: 'rgba(11,160,175,0.15)', strokeWidth: 1 }} />
                <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 10 }} />
                {selectedInds.includes('Income') && (
                  <Line yAxisId="left"  type="monotone" dataKey="Income"  stroke="#0ba0af" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                )}
                {selectedInds.includes('Cost') && (
                  <Line yAxisId="left"  type="monotone" dataKey="Cost"    stroke="#ea5713" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                )}
                {selectedInds.includes('Revenue') && (
                  <Line yAxisId="right" type="monotone" dataKey="Revenue" stroke="#b9e04d" strokeWidth={2} dot={false} activeDot={{ r: 4 }} strokeDasharray="5 3" />
                )}
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Stacked Bar Charts */}
        <Box sx={{ width: '30%', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 1.5 }}>

          {/* Income vs Cost */}
          <Paper sx={{ ...paperSx, flex: 1 }}>
            <Typography variant="caption" sx={capLabel}>Income vs Cost {barGroupLabel}</Typography>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentTotals} margin={{ top: 14, right: 6, left: -14, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: tickFill, fontWeight: 700 }} />
                  <YAxis hide />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(11,160,175,0.05)' }} />
                  <Legend iconType="rect" iconSize={7} wrapperStyle={{ fontSize: 9 }} />
                  <Bar dataKey="Income" fill="#0ba0af" radius={[3, 3, 0, 0]} barSize={14}>
                    <LabelList dataKey="Income" position="top" formatter={(v: number) => fmtShort(v)} style={{ fontSize: 7.5, fill: tickFill, fontWeight: 700 }} />
                  </Bar>
                  <Bar dataKey="Cost" fill="#ea5713" radius={[3, 3, 0, 0]} barSize={14}>
                    <LabelList dataKey="Cost" position="top" formatter={(v: number) => fmtShort(v)} style={{ fontSize: 7.5, fill: tickFill, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* Revenue */}
          <Paper sx={{ ...paperSx, flex: 1 }}>
            <Typography variant="caption" sx={capLabel}>Revenue {barGroupLabel}</Typography>
            <Box sx={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={segmentTotals} margin={{ top: 14, right: 6, left: -14, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: tickFill, fontWeight: 700 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: tickFill, opacity: 0.5 }} tickFormatter={v => `${v.toFixed(1)}x`} domain={[0, 'auto']} />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(11,160,175,0.05)' }} />
                  <Bar dataKey="Revenue" name="Revenue" radius={[3, 3, 0, 0]} barSize={26}>
                    {segmentTotals.map((s, i) => <Cell key={i} fill={s.color} />)}
                    <LabelList dataKey="Revenue" position="top" formatter={(v: number) => `${v.toFixed(2)}x`} style={{ fontSize: 8, fill: tickFill, fontWeight: 700 }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

        </Box>
      </Box>

      {/* ═══ ROW 3 — Pies + Table ══════════════════════════════════════════ */}
      <Box sx={{ flex: 2, minHeight: 0, display: 'flex', gap: 1.5 }}>

        {/* Pie: Income Source */}
        <Paper sx={{ ...paperSx, flex: 1 }}>
          <Typography variant="caption" sx={capLabel}>
            % Income Source {isStellantis ? '· Stellantis Depts' : '· by Client'}
          </Typography>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={incomePie} cx="50%" cy="44%" innerRadius="38%" outerRadius="64%" dataKey="value" nameKey="name" paddingAngle={3}>
                  {incomePie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(v: any, e: any) => (
                  <span style={{ fontSize: 10, opacity: 0.8 }}>{v} ({e.payload.pct}%)</span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Pie: Cost Distribution */}
        <Paper sx={{ ...paperSx, flex: 1 }}>
          <Typography variant="caption" sx={capLabel}>% Cost Distribution</Typography>
          <Box sx={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={costData} cx="50%" cy="44%" innerRadius="38%" outerRadius="64%" dataKey="value" nameKey="category" paddingAngle={3}>
                  {costData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip content={<PieTooltip />} />
                <Legend iconType="circle" iconSize={8} formatter={(v: any, e: any) => (
                  <span style={{ fontSize: 10, opacity: 0.8 }}>{v} ({e.payload.pct}%)</span>
                )} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        {/* Table: Cost Distribution Detail */}
        <Paper sx={{ ...paperSx, flex: 1.2 }}>
          <Typography variant="caption" sx={capLabel}>Cost Distribution Detail</Typography>
          <TableContainer sx={{ flex: 1, overflow: 'hidden' }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  {['Category', 'Value', 'Cost %'].map(col => (
                    <TableCell key={col} sx={{
                      bgcolor: isDark ? '#000A1A' : '#f5f7fa',
                      fontSize: 9, fontWeight: 900, color: 'primary.main',
                      py: 0.7, textTransform: 'uppercase', letterSpacing: 0.5,
                      borderBottom: '1px solid rgba(11,160,175,0.2)',
                    }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {costData.map((row, idx) => (
                  <TableRow key={idx} sx={{ '&:hover': { bgcolor: 'rgba(11,160,175,0.04)' } }}>
                    <TableCell sx={{ fontSize: 10, fontWeight: 700, py: 0.6, borderBottom: '1px solid rgba(11,160,175,0.07)' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: row.color, flexShrink: 0 }} />
                        {row.category}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: 10, fontWeight: 700, py: 0.6, borderBottom: '1px solid rgba(11,160,175,0.07)' }}>
                      {fmtShort(row.value)}
                    </TableCell>
                    <TableCell sx={{ py: 0.6, borderBottom: '1px solid rgba(11,160,175,0.07)', minWidth: 80 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                        <Box sx={{ flex: 1, height: 3.5, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)', borderRadius: 2, overflow: 'hidden' }}>
                          <Box sx={{ height: '100%', width: `${row.pct}%`, bgcolor: row.color, borderRadius: 2 }} />
                        </Box>
                        <Typography variant="caption" sx={{ fontSize: 9.5, fontWeight: 800, minWidth: 24, textAlign: 'right' }}>
                          {row.pct}%
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow sx={{ bgcolor: isDark ? 'rgba(11,160,175,0.08)' : 'rgba(11,160,175,0.04)' }}>
                  <TableCell sx={{ fontSize: 10, fontWeight: 900, py: 0.7, color: 'primary.main', borderTop: '1px solid rgba(11,160,175,0.25)', borderBottom: 'none' }}>TOTAL</TableCell>
                  <TableCell sx={{ fontSize: 10, fontWeight: 900, py: 0.7, color: 'primary.main', borderTop: '1px solid rgba(11,160,175,0.25)', borderBottom: 'none' }}>{fmtShort(totalCost)}</TableCell>
                  <TableCell sx={{ fontSize: 10, fontWeight: 900, py: 0.7, color: 'primary.main', borderTop: '1px solid rgba(11,160,175,0.25)', borderBottom: 'none' }}>100%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

      </Box>
    </Box>
  );
};

export default FinancialView;
