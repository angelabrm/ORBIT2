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
  qa?: string;
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
  const qaCol         = col('QA');
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
      const qa         = qaCol         >= 0 ? (row[qaCol]?.trim()         || undefined) : undefined;
      const nombre = row[nombreCol]?.trim() || '';
      const nivel = row[nivelCol]?.trim() || '';
      const mesa = row[mesaCol]?.trim() || '';
      const clientVal = row[clientCol]?.trim() || '';
      const role = mapRole(nivel);
      if (!role || !rfc) return null;
      return { rfc, compass, callPicker, qa, name: nombre, role, client: clientVal, serviceDesk: mapServiceDesk(mesa) };
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

// Parse "Actividad_YYYY_MM_DD.csv" → { dateStr: "YYYY-MM-DD", dateMs: UTC ms } or null.
// dateStr is the timezone-agnostic value the frontend should use for bucketing
// (avoids the local-timezone shift you get when dayjs(ms) is formatted).
function parseSourceName(s: string): { dateStr: string; dateMs: number } | null {
  if (!s) return null;
  const m = s.match(/Actividad_(\d{4})_(\d{2})_(\d{2})\.csv$/i);
  if (!m) return null;
  const y = parseInt(m[1], 10);
  const mo = parseInt(m[2], 10);
  const d = parseInt(m[3], 10);
  const dateStr = `${m[1]}-${m[2]}-${m[3]}`;
  return { dateStr, dateMs: Date.UTC(y, mo - 1, d) };
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
        const p = parseSourceName(r['Source.Name']);
        if (p === null) return null;
        return {
          user: r['User'],
          source: r['Source.Name'],
          dateStr: p.dateStr,                          // "YYYY-MM-DD" — use this for bucketing
          dateMs: p.dateMs,                            // UTC ms — for legacy callers
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

// Parse "Marca temporal" into { dateStr, dateMs } or null.
// Accepts both: plain string ("YYYY-MM-DD HH:MM:SS.mmm" or ISO) AND Date objects
// — pg returns the column as a JS Date because in Neon it's a `timestamp` type.
function parseMarcaTemporal(v: any): { dateStr: string; dateMs: number } | null {
  if (v == null) return null;
  let iso: string;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    iso = v.toISOString();                     // "YYYY-MM-DDTHH:MM:SS.mmmZ"
  } else if (typeof v === 'string') {
    iso = v;
  } else {
    return null;
  }
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return {
    dateStr: `${m[1]}-${m[2]}-${m[3]}`,
    dateMs: Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)),
  };
}

// QA score per row:
//   Soft skills (5 × 16 = 80 pts): Cultivar, Lenguaje y Tono, Empatía, Escucha
//     Activa / Confirmación, Asegurar
//   Process    (5 × 4  = 20 pts): Documentación, Tipificación de Casos,
//     Verificación, Cumplimiento de Procesos, Toma de Decisiones
//   Error Crítico: if set to anything other than NA / N/A / empty → score = 0
//
// Column names are matched by case-insensitive partial regex because the
// real names include mojibake-encoded accents and one is truncated to 63
// chars by Postgres ("Toma de Decisiones / Pensamiento Crítico (Incluidos
// Recursos C").
const QA_CRITERIA: { weight: number; pattern: RegExp }[] = [
  { weight: 16, pattern: /cultivar/i },              // Cultivar la Reputación...
  { weight: 16, pattern: /lenguaje/i },              // Lenguaje y Tono
  { weight: 16, pattern: /empat/i },                 // Empatía
  { weight: 16, pattern: /escucha/i },               // Escucha Activa / Confirmación
  { weight: 16, pattern: /^asegurar/i },             // Asegurar
  { weight: 4,  pattern: /documentaci/i },           // Documentación
  { weight: 4,  pattern: /tipificaci/i },            // Tipificación de Casos
  { weight: 4,  pattern: /verificaci/i },            // Verificación
  { weight: 4,  pattern: /cumplimiento/i },          // Cumplimiento de Procesos
  { weight: 4,  pattern: /toma de decisiones/i },    // Toma de Decisiones / Pensamiento Crítico
];
const QA_ERROR_PATTERN = /error.*cr/i;               // Error Crítico (matches even truncated)

// "Sin error" = null / empty / NA / N/A (case-insensitive trim).
function isErrorCritico(v: unknown): boolean {
  if (v == null) return false;
  const s = String(v).trim();
  if (s === '') return false;
  const upper = s.toUpperCase();
  if (upper === 'NA' || upper === 'N/A') return false;
  return true;
}

app.get('/api/qa', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(503).json({ error: 'Database not configured' });

    const { user, startDate, endDate } = req.query as { user?: string; startDate?: string; endDate?: string };

    const userList = (user || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    let result;
    if (userList.length > 0) {
      const placeholders = userList.map((_, i) => `$${i + 1}`).join(',');
      result = await pool.query(
        `SELECT * FROM "QA" WHERE "Agente" IN (${placeholders})`,
        userList,
      );
    } else {
      result = await pool.query('SELECT * FROM "QA"');
    }

    // Resolve the actual column name for each criterion + the error column.
    const allCols: string[] = (result.fields || []).map((f: any) => f.name);
    const criterionCols = QA_CRITERIA.map(c => ({
      weight: c.weight,
      col: allCols.find(name => c.pattern.test(name)),
    }));
    const errorCol = allCols.find(name => QA_ERROR_PATTERN.test(name));

    const start = startDate ? Date.parse(startDate) : null;
    const end   = endDate   ? Date.parse(endDate)   : null;

    const out = result.rows
      .map((row: any) => {
        const p = parseMarcaTemporal(row['Marca temporal']);
        if (p === null) return null;

        // Compute the score
        let score = 0;
        if (errorCol && isErrorCritico(row[errorCol])) {
          score = 0; // all-or-nothing penalty
        } else {
          for (const { weight, col } of criterionCols) {
            if (!col) continue;
            const v = row[col];
            if (v != null && String(v).trim() === 'Pulgar Arriba') {
              score += weight;
            }
          }
        }

        return {
          agente: row['Agente'],
          dateStr: p.dateStr,
          dateMs: p.dateMs,
          score,
        };
      })
      .filter((r: any): r is NonNullable<typeof r> => r !== null)
      .filter((r: any) => {
        if (start !== null && r.dateMs < start - 86400000) return false;
        if (end   !== null && r.dateMs > end   + 86400000) return false;
        return true;
      });

    res.json(out);
  } catch (error: any) {
    console.error('[qa] error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch QA', detail: error?.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
