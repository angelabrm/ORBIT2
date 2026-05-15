import express from 'express';

const app = express();
app.use(express.json());

const dbUrl = process.env.DATABASE_URL || process.env.NEON_DB_URL;

// Lazy pg pool — only instantiated when /api/opened-cases is first called.
// Keeping pg out of the module-load path avoids any bundling/ESM issues
// that would crash the whole serverless function on cold start.
let poolPromise: Promise<any> | null = null;
function getPool(): Promise<any> {
  if (!dbUrl) return Promise.resolve(null);
  if (!poolPromise) {
    poolPromise = import('pg').then((pgMod: any) => {
      const Pool = pgMod.Pool || pgMod.default?.Pool;
      return new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        max: 1,
      });
    });
  }
  return poolPromise;
}

// Parse "M/D/YYYY h:mm A" without dayjs (which we keep out of module load).
function parseOpenedAt(s: string): number | null {
  if (!s) return null;
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  let h = parseInt(m[4], 10);
  const ampm = m[6].toUpperCase();
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return Date.UTC(parseInt(m[3], 10), parseInt(m[1], 10) - 1, parseInt(m[2], 10), h, parseInt(m[5], 10));
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '122mX8Jh0w5HP7JwW21mKHTDN2h0YhQuQYHhumHAcm4s';
const SHEET_NAME = 'Roster';
const CACHE_TTL = 5 * 60 * 1000;

interface RosterUser {
  rfc: string;
  compass?: string;
  callPicker?: string;
  name: string;
  role: string;
  client: string;
  serviceDesk: string;
  team?: string[];
}

let rosterCache: RosterUser[] = [];
let rosterLastFetched = 0;

function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { field += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { row.push(field); field = ''; }
      else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (ch === '\r') { /* skip */ }
      else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  return rows;
}

function mapRole(nivel: string): string | null {
  const n = nivel?.trim().toLowerCase();
  if (['agent', 'agente'].includes(n)) return 'Agent';
  if (['leader', 'líder', 'lider'].includes(n)) return 'Leader';
  if (n === 'manager') return 'Manager';
  if (['executive', 'ejecutivo'].includes(n)) return 'Executive';
  if (n === 'pm') return 'PM';
  return null;
}

function mapServiceDesk(mesa: string): string {
  const m = mesa?.trim().toLowerCase();
  if (m === 'cac') return 'CAC';
  if (m === 'fleet') return 'Fleet';
  if (m === 'premium') return 'Premium';
  if (m === 'manager') return 'Manager';
  if (m === 'executive') return 'Executive';
  if (m === 'pm' || m === 'pepsico') return 'PM';
  return mesa?.trim() || '';
}

async function fetchRosterFromSheets(): Promise<RosterUser[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
  const csv = await res.text();

  const rows = parseCSV(csv);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim());
  const col = (name: string) => headers.indexOf(name);

  const docCol        = col('Documento');
  const compassCol    = col('Compass');
  const callPickerCol = col('CallPicker');
  const nombreCol     = col('Nombre');
  const nivelCol      = col('Nivel');
  const mesaCol       = col('MESA_');
  const clientCol     = col('Client');

  const users: RosterUser[] = rows
    .slice(1)
    .filter(row => row[docCol]?.trim() && row[nivelCol]?.trim())
    .map(row => {
      const rfc = row[docCol]?.trim().toUpperCase();
      const compass    = compassCol    >= 0 ? (row[compassCol]?.trim()    || undefined) : undefined;
      const callPicker = callPickerCol >= 0 ? (row[callPickerCol]?.trim() || undefined) : undefined;
      const nombre = row[nombreCol]?.trim() || '';
      const nivel = row[nivelCol]?.trim() || '';
      const mesa = row[mesaCol]?.trim() || '';
      const clientVal = row[clientCol]?.trim() || '';
      const role = mapRole(nivel);
      if (!role || !rfc) return null;
      return { rfc, compass, callPicker, name: nombre, role, client: clientVal, serviceDesk: mapServiceDesk(mesa) };
    })
    .filter(Boolean) as RosterUser[];

  const agentsByKey: Record<string, string[]> = {};
  users.forEach(u => {
    if (u.role === 'Agent') {
      const key = `${u.client}:${u.serviceDesk}`;
      if (!agentsByKey[key]) agentsByKey[key] = [];
      agentsByKey[key].push(u.rfc);
    }
  });
  users.forEach(u => {
    if (u.role === 'Leader') {
      u.team = agentsByKey[`${u.client}:${u.serviceDesk}`] || [];
    }
  });

  return users;
}

async function getRoster(): Promise<RosterUser[]> {
  const now = Date.now();
  if (rosterCache.length === 0 || now - rosterLastFetched > CACHE_TTL) {
    rosterCache = await fetchRosterFromSheets();
    rosterLastFetched = now;
  }
  return rosterCache;
}

app.get('/api/roster', async (_req, res) => {
  try {
    const users = await getRoster();
    res.json(users);
  } catch (error: any) {
    console.error('[Roster] Error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch roster', detail: error?.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { rfc } = req.body || {};
    if (!rfc) return res.status(400).json({ error: 'RFC required' });
    const users = await getRoster();
    const user = users.find(u => u.rfc === rfc.toUpperCase().trim());
    if (user) res.json(user);
    else res.status(404).json({ error: 'RFC not found' });
  } catch (error: any) {
    console.error('[Login] Error:', error?.message);
    res.status(500).json({ error: 'Login failed', detail: error?.message });
  }
});

app.get('/api/opened-cases', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(503).json({ error: 'Database not configured' });

    const { case_owner, startDate, endDate } = req.query as { case_owner?: string; startDate?: string; endDate?: string };

    let rows: any[];
    if (case_owner) {
      const r = await pool.query('SELECT * FROM "Abiertos" WHERE "case_owner" = $1', [case_owner]);
      rows = r.rows;
    } else {
      const r = await pool.query('SELECT * FROM "Abiertos"');
      rows = r.rows;
    }

    if (startDate || endDate) {
      const start = startDate ? Date.parse(startDate) : null;
      const end   = endDate   ? Date.parse(endDate)   : null;
      rows = rows.filter(row => {
        const t = parseOpenedAt(row.datetime_opened);
        if (t === null) return false;
        if (start !== null && t < start - 86400000) return false; // day-inclusive
        if (end   !== null && t > end   + 86400000) return false;
        return true;
      });
    }

    res.json(rows);
  } catch (error: any) {
    console.error('[opened-cases] error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch data', detail: error?.message });
  }
});

// Parse "Actividad_YYYY_MM_DD.csv" → ms-since-epoch UTC, or null if format unknown.
function parseSourceName(s: string): number | null {
  if (!s) return null;
  const m = s.match(/Actividad_(\d{4})_(\d{2})_(\d{2})\.csv$/i);
  if (!m) return null;
  const year = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const day = parseInt(m[3], 10);
  return Date.UTC(year, month, day);
}

app.get('/api/incoming-calls', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(503).json({ error: 'Database not configured' });

    const { user, startDate, endDate } = req.query as { user?: string; startDate?: string; endDate?: string };

    // user is a CSV of CallPicker values. Build a parameterised IN clause.
    const userList = (user || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    let rows: any[];
    if (userList.length > 0) {
      const placeholders = userList.map((_, i) => `$${i + 1}`).join(',');
      const r = await pool.query(
        `SELECT "User", "Answered Calls", "Source.Name" FROM "Actividad" WHERE "User" IN (${placeholders})`,
        userList,
      );
      rows = r.rows;
    } else {
      const r = await pool.query('SELECT "User", "Answered Calls", "Source.Name" FROM "Actividad"');
      rows = r.rows;
    }

    // Attach parsed date + filter by range (day-inclusive, same convention as /api/opened-cases).
    const start = startDate ? Date.parse(startDate) : null;
    const end   = endDate   ? Date.parse(endDate)   : null;

    const out = rows
      .map(r => {
        const t = parseSourceName(r['Source.Name']);
        if (t === null) return null;
        return {
          user: r['User'],
          date: r['Source.Name'],
          dateMs: t,
          answeredCalls: Number(r['Answered Calls']) || 0,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .filter(r => {
        if (start !== null && r.dateMs < start - 86400000) return false;
        if (end   !== null && r.dateMs > end   + 86400000) return false;
        return true;
      });

    res.json(out);
  } catch (error: any) {
    console.error('[incoming-calls] error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch activity', detail: error?.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
