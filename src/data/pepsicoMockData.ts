import dayjs, { Dayjs } from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';
dayjs.extend(weekOfYear);

// ─── Types ───────────────────────────────────────────────────────────────────

export type PhaseStatus = 'Completed' | 'In Progress' | 'Pending' | 'Delayed';

export interface Task {
  id: string;
  name: string;
  status: PhaseStatus;
}

export interface Phase {
  id: string;
  number: number;
  name: string;
  startDate: Date;
  endDate: Date;
  status: PhaseStatus;
  tasks: Task[];
}

export interface Campaign {
  id: string;
  name: string;
  brand: string;
  category: 'Biscuit' | 'Savory';
  startDate: Date;
  endDate: Date;
  phases: Phase[];
}

export const PHASE_DEFS: { number: number; name: string; color: string }[] = [
  { number: 1, name: 'Brief',              color: '#0ba0af' },
  { number: 2, name: 'Big Idea',           color: '#33b6c4' },
  { number: 3, name: 'Media Plan',         color: '#5cccd9' },
  { number: 4, name: 'Content Grid',       color: '#b9e04d' },
  { number: 5, name: 'Content Production', color: '#ffcc00' },
  { number: 6, name: 'Go Live',            color: '#ff9900' },
  { number: 7, name: 'Final Report',       color: '#ea5713' },
  { number: 8, name: 'Closing Campaign',   color: '#B018D9' },
];

export const PHASE_COLORS: Record<PhaseStatus, string> = {
  Completed:    '#22c55e',
  'In Progress': '#0ba0af',
  Pending:      '#94a3b8',
  Delayed:      '#ef4444',
};

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

export function rfcSeed(rfc: string): number {
  return rfc.split('').reduce((acc, c, i) => acc + c.charCodeAt(0) * (i + 1), 0);
}

function sr(seed: number, n: number): number {
  const x = Math.sin(seed * 127.1 + n * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

// ─── Campaign generation ──────────────────────────────────────────────────────

const TODAY = new Date('2026-05-12');

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

const BRAND_TEMPLATES = [
  { brand: 'CHOKIS',    category: 'Biscuit' as const, suffix: 'Switch'   },
  { brand: 'DORITOS',   category: 'Savory'  as const, suffix: 'Dinamita' },
  { brand: 'CHEETOS',   category: 'Savory'  as const, suffix: 'Flamin'   },
  { brand: 'EMPERADOR', category: 'Biscuit' as const, suffix: 'Rafiki'   },
  { brand: 'GAMESA',    category: 'Biscuit' as const, suffix: 'Digital'  },
  { brand: 'RUFFLES',   category: 'Savory'  as const, suffix: 'Launch'   },
  { brand: 'SABRITAS',  category: 'Savory'  as const, suffix: 'Summer'   },
  { brand: 'QUAKER',    category: 'Biscuit' as const, suffix: 'Promo'    },
  { brand: "LAY'S",     category: 'Savory'  as const, suffix: 'Social'   },
  { brand: 'TOSTITOS',  category: 'Savory'  as const, suffix: 'Holiday'  },
];

// Fraction of campaign duration per phase
const PHASE_FRACS = [0.06, 0.10, 0.08, 0.08, 0.20, 0.18, 0.18, 0.12];

export function generateCampaignsForPM(rfc: string): Campaign[] {
  const seed = rfcSeed(rfc);
  const numCampaigns = 2 + Math.floor(sr(seed, 0) * 3); // 2–4

  // Fisher-Yates shuffle → pick first N templates
  const indices = Array.from({ length: BRAND_TEMPLATES.length }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(sr(seed, i + 50) * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  const templates = indices.slice(0, numCampaigns).map(i => BRAND_TEMPLATES[i]);

  return templates.map((tmpl, ci) => {
    const startOffset = Math.floor(sr(seed, ci * 10 + 2) * 350) - 200; // −200…+149 days
    const duration    = 60 + Math.floor(sr(seed, ci * 10 + 3) * 150);  // 60–209 days
    const startDate   = addDays(TODAY, startOffset);
    const endDate     = addDays(startDate, duration);

    let phaseStart = startDate;
    const phases: Phase[] = PHASE_DEFS.map((def, pi) => {
      const days     = Math.max(4, Math.round(duration * PHASE_FRACS[pi]));
      const phaseEnd = addDays(phaseStart, days);

      let status: PhaseStatus;
      if (phaseEnd < TODAY) {
        status = sr(seed, ci * 100 + pi * 7) < 0.10 ? 'Delayed' : 'Completed';
      } else if (phaseStart <= TODAY) {
        status = sr(seed, ci * 100 + pi * 7 + 1) < 0.20 ? 'Delayed' : 'In Progress';
      } else {
        status = 'Pending';
      }

      const phase: Phase = {
        id: `${rfc}-c${ci}-p${pi}`,
        number: def.number,
        name: def.name,
        startDate: phaseStart,
        endDate: phaseEnd,
        status,
        tasks: [{ id: `${rfc}-c${ci}-p${pi}-t1`, name: `${def.name} task`, status }],
      };
      phaseStart = addDays(phaseEnd, 1);
      return phase;
    });

    // Once a phase is non-completed, all subsequent are Pending
    let hitActive = false;
    phases.forEach(p => {
      if (hitActive) {
        p.status = 'Pending';
        p.tasks.forEach(t => { t.status = 'Pending'; });
      }
      if (p.status !== 'Completed') hitActive = true;
    });

    const catCode = tmpl.category === 'Biscuit' ? 'B' : 'S';
    const yr  = String(startDate.getFullYear()).slice(2);
    const fmt = (d: Date) =>
      `${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;

    return {
      id: `${rfc}-c${ci}`,
      name: `${tmpl.brand}_${tmpl.suffix}_${yr}_${fmt(startDate)}_${fmt(endDate)}_${catCode}_PMF`,
      brand: tmpl.brand,
      category: tmpl.category,
      startDate,
      endDate,
      phases,
    };
  });
}

// ─── PM metrics ───────────────────────────────────────────────────────────────

export interface PMMetrics {
  onTimeRate:  number;
  qaRate:      number;
  performance: number;
}

export function generatePMMetrics(rfc: string): PMMetrics {
  const campaigns = generateCampaignsForPM(rfc);
  const delayed   = campaigns.filter(c => c.phases.some(p => p.status === 'Delayed')).length;
  const onTimeRate = campaigns.length > 0
    ? Math.round(((campaigns.length - delayed) / campaigns.length) * 100)
    : 100;
  const seed    = rfcSeed(rfc);
  const qaRate  = 65 + Math.floor(sr(seed, 999) * 35); // 65–99
  const performance = Math.round(onTimeRate * 0.5 + qaRate * 0.5);
  return { onTimeRate, qaRate, performance };
}

// ─── Trend data ───────────────────────────────────────────────────────────────

export type HierarchyKey = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface TrendPoint {
  name: string;
  fullDate: string;
  'On Time Rate': number;
  'QA Rate': number;
  'Performance': number;
}

export function buildPMTrendData(
  start: Dayjs,
  end: Dayjs,
  hierarchy: HierarchyKey,
  rfc = '',
): TrendPoint[] {
  const rfcOff = rfc ? rfcSeed(rfc) : 0;
  const data: TrendPoint[] = [];

  let cur: Dayjs;
  if      (hierarchy === 'day')     cur = start.startOf('day');
  else if (hierarchy === 'week')    cur = start.startOf('week');
  else if (hierarchy === 'month')   cur = start.startOf('month');
  else if (hierarchy === 'quarter') cur = start.startOf('month').subtract(start.month() % 3, 'month');
  else                              cur = start.startOf('year');

  let safety = 0;
  const endCmp = (hierarchy === 'quarter' ? 'month' : hierarchy) as dayjs.OpUnitType;

  while ((cur.isBefore(end) || cur.isSame(end, endCmp)) && safety < 400) {
    safety++;
    const baseSeed = cur.unix() + rfcOff * 1337;
    const rx = (off: number) => { const x = Math.sin(baseSeed + off) * 10000; return x - Math.floor(x); };
    const onTime      = 60 + Math.floor(rx(1) * 40);
    const qa          = 65 + Math.floor(rx(2) * 35);
    const performance = Math.round(onTime * 0.5 + qa * 0.5);

    let name = '';
    if      (hierarchy === 'day')     name = cur.format('MMM DD');
    else if (hierarchy === 'week')    name = `W${cur.week()}`;
    else if (hierarchy === 'month')   name = cur.format('MMM YY');
    else if (hierarchy === 'quarter') name = `Q${Math.floor(cur.month() / 3) + 1} ${cur.format('YY')}`;
    else                              name = cur.format('YYYY');

    data.push({ name, fullDate: cur.toISOString(), 'On Time Rate': onTime, 'QA Rate': qa, 'Performance': performance });

    if      (hierarchy === 'day')     cur = cur.add(1, 'day');
    else if (hierarchy === 'week')    cur = cur.add(1, 'week');
    else if (hierarchy === 'month')   cur = cur.add(1, 'month');
    else if (hierarchy === 'quarter') cur = cur.add(3, 'month');
    else                              cur = cur.add(1, 'year');
  }

  return data;
}

// Average trend data across multiple RFCs
export function buildTeamAvgTrendData(
  start: Dayjs,
  end: Dayjs,
  hierarchy: HierarchyKey,
  rfcs: string[],
): TrendPoint[] {
  if (rfcs.length === 0) return buildPMTrendData(start, end, hierarchy);

  const allData = rfcs.map(rfc => buildPMTrendData(start, end, hierarchy, rfc));
  const ref = allData[0];

  return ref.map((point, i) => {
    const avg = (key: keyof TrendPoint) =>
      Math.round(allData.reduce((sum, d) => sum + ((d[i]?.[key] as number) ?? 0), 0) / allData.length);
    return {
      ...point,
      'On Time Rate': avg('On Time Rate'),
      'QA Rate':      avg('QA Rate'),
      'Performance':  avg('Performance'),
    };
  });
}
