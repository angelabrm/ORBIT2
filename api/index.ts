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
  genesys?: string;
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
  const genesysCol    = col('Genesys');
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
      const genesys    = genesysCol    >= 0 ? (row[genesysCol]?.trim()    || undefined) : undefined;
      const nombre = row[nombreCol]?.trim() || '';
      const nivel = row[nivelCol]?.trim() || '';
      const mesa = row[mesaCol]?.trim() || '';
      const clientVal = row[clientCol]?.trim() || '';
      const role = mapRole(nivel);
      if (!role || !rfc) return null;
      return { rfc, compass, callPicker, qa, genesys, name: nombre, role, client: clientVal, serviceDesk: mapServiceDesk(mesa) };
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

    const { user, genesys, startDate, endDate } = req.query as {
      user?: string;
      genesys?: string;
      startDate?: string;
      endDate?: string;
    };

    // Incoming Calls comes from two tables, joined on different Roster columns:
    //   Actividad.User                  ↔ Roster.CallPicker  (param: ?user=)
    //   Rendimiento_Agente.nombre_del_agente ↔ Roster.Genesys (param: ?genesys=)
    // Values from both sources are SUMMED per bucket on the frontend.
    const callPickerList = (user    || '').split(',').map(s => s.trim()).filter(Boolean);
    const genesysList    = (genesys || '').split(',').map(s => s.trim()).filter(Boolean);

    const queryActividad = async (): Promise<any[]> => {
      try {
        let r;
        if (callPickerList.length > 0) {
          const placeholders = callPickerList.map((_, i) => `$${i + 1}`).join(',');
          r = await pool.query(
            `SELECT "User", "Answered Calls", "Source.Name" FROM "Actividad" WHERE "User" IN (${placeholders})`,
            callPickerList,
          );
        } else {
          r = await pool.query('SELECT "User", "Answered Calls", "Source.Name" FROM "Actividad"');
        }
        return r.rows.map((row: any) => {
          const p = parseSourceName(row['Source.Name']);
          if (p === null) return null;
          return {
            user: row['User'],
            source: row['Source.Name'],
            dateStr: p.dateStr,
            dateMs: p.dateMs,
            answeredCalls: Number(row['Answered Calls']) || 0,
          };
        }).filter((x: any) => x !== null);
      } catch (e: any) {
        console.warn(`[incoming-calls] Actividad unavailable: ${e?.message}`);
        return [];
      }
    };

    const queryRendimiento = async (): Promise<any[]> => {
      try {
        // Column names in Neon are all-lowercase ("contestadas", not
        // "Contestadas") and Postgres is case-sensitive inside double quotes.
        let r;
        if (genesysList.length > 0) {
          const placeholders = genesysList.map((_, i) => `$${i + 1}`).join(',');
          r = await pool.query(
            `SELECT "nombre_del_agente", "contestadas", "inicio_del_intervalo" FROM "Rendimiento_Agente" WHERE "nombre_del_agente" IN (${placeholders})`,
            genesysList,
          );
        } else {
          r = await pool.query('SELECT "nombre_del_agente", "contestadas", "inicio_del_intervalo" FROM "Rendimiento_Agente"');
        }
        return r.rows.map((row: any) => {
          const p = parseDateFlex(row['inicio_del_intervalo']);
          if (p === null) return null;
          return {
            user: row['nombre_del_agente'],
            source: 'Rendimiento_Agente',
            dateStr: p.dateStr,
            dateMs: p.dateMs,
            answeredCalls: Number(row['contestadas']) || 0,
          };
        }).filter((x: any) => x !== null);
      } catch (e: any) {
        console.warn(`[incoming-calls] Rendimiento_Agente unavailable: ${e?.message}`);
        return [];
      }
    };

    const [actividad, rendimiento] = await Promise.all([queryActividad(), queryRendimiento()]);

    // Apply date-range filter (day-inclusive, same convention as /api/opened-cases).
    const start = startDate ? Date.parse(startDate) : null;
    const end   = endDate   ? Date.parse(endDate)   : null;
    const out = [...actividad, ...rendimiento].filter(r => {
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

// QA scoring (shared between QA and QA_Premium tables):
//   Soft skills (5 × 16 = 80 pts) and Process (5 × 4 = 20 pts) — 100 max.
//   Each criterion column gets matched by case-insensitive partial regex
//   so we handle both Spanish (QA table) and English (QA_Premium) names,
//   plus Postgres' 63-byte identifier truncation and mojibake-encoded accents.
const QA_CRITERIA: { weight: number; pattern: RegExp }[] = [
  // Soft skills — 16 pts each
  { weight: 16, pattern: /cultivar|cultivate/i },                   // Cultivar… / Cultivate Stellantis…
  { weight: 16, pattern: /lenguaje|language/i },                    // Lenguaje y Tono / Language and Tone
  { weight: 16, pattern: /empat/i },                                // Empatía / Empathy
  { weight: 16, pattern: /escucha|listening/i },                    // Escucha Activa… / Active Listening…
  { weight: 16, pattern: /^asegurar|reassurance/i },                // Asegurar / Reassurance
  // Process — 4 pts each
  { weight: 4,  pattern: /documentaci|documentation/i },            // Documentación / Documentation
  { weight: 4,  pattern: /tipificaci|case coding/i },               // Tipificación / Case Coding
  { weight: 4,  pattern: /verificaci|verification/i },              // Verificación / Verification
  { weight: 4,  pattern: /cumplimiento|process adherence/i },       // Cumplimiento / Process Adherence
  { weight: 4,  pattern: /toma de decisiones|decision making/i },   // Toma de Decisiones / Decision Making
];
const QA_ERROR_PATTERN = /(error.*cr|critical.*error)/i;            // Error Crítico / Critical Error

// "Sin error" = null / empty / NA / N/A (case-insensitive trim).
function isErrorCritico(v: unknown): boolean {
  if (v == null) return false;
  const s = String(v).trim();
  if (s === '') return false;
  const upper = s.toUpperCase();
  if (upper === 'NA' || upper === 'N/A') return false;
  return true;
}

// Per-table scoring config.
type QaConfig = {
  thumbsUp: string;        // exact (case-insensitive) value granting full credit
  naCountsAsFull: boolean; // whether "NA" / "N/A" in a criterion column also grants full credit
};

function scoreQaRow(row: any, cols: string[], config: QaConfig): number {
  const errorCol = cols.find(c => QA_ERROR_PATTERN.test(c));
  if (errorCol && isErrorCritico(row[errorCol])) return 0;

  let score = 0;
  for (const { weight, pattern } of QA_CRITERIA) {
    const col = cols.find(c => pattern.test(c));
    if (!col) continue;
    const raw = row[col];
    if (raw == null) continue;
    const v = String(raw).trim();
    const vu = v.toUpperCase();
    if (v.toLowerCase() === config.thumbsUp.toLowerCase()) {
      score += weight;
    } else if (config.naCountsAsFull && (vu === 'NA' || vu === 'N/A')) {
      score += weight;
    }
  }
  return score;
}

// Run a SELECT against either QA table. Returns [] if the table doesn't
// exist (so a missing QA_Premium table doesn't kill the whole endpoint).
async function queryQaTable(
  pool: any,
  tableName: string,
  agentCol: string,
  userList: string[],
): Promise<{ rows: any[]; cols: string[] }> {
  try {
    let r;
    if (userList.length > 0) {
      const placeholders = userList.map((_, i) => `$${i + 1}`).join(',');
      r = await pool.query(
        `SELECT * FROM "${tableName}" WHERE "${agentCol}" IN (${placeholders})`,
        userList,
      );
    } else {
      r = await pool.query(`SELECT * FROM "${tableName}"`);
    }
    return {
      rows: r.rows,
      cols: (r.fields || []).map((f: any) => f.name),
    };
  } catch (err: any) {
    console.warn(`[qa] table "${tableName}" unavailable: ${err?.message}`);
    return { rows: [], cols: [] };
  }
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

    // Query both tables in parallel.
    const [qa, premium] = await Promise.all([
      queryQaTable(pool, 'QA',         'Agente', userList),
      queryQaTable(pool, 'QA_Premium', 'Agent',  userList),
    ]);

    const qaConfig:      QaConfig = { thumbsUp: 'Pulgar Arriba', naCountsAsFull: false };
    const premiumConfig: QaConfig = { thumbsUp: 'Thumbs up',     naCountsAsFull: true  };

    const buildRow = (row: any, agentColName: string, cols: string[], config: QaConfig) => {
      const p = parseMarcaTemporal(row['Marca temporal'] ?? row['Marca Temporal']);
      if (p === null) return null;
      return {
        agente: row[agentColName],
        dateStr: p.dateStr,
        dateMs: p.dateMs,
        score: scoreQaRow(row, cols, config),
      };
    };

    const start = startDate ? Date.parse(startDate) : null;
    const end   = endDate   ? Date.parse(endDate)   : null;

    const out = [
      ...qa.rows.map(r => buildRow(r, 'Agente', qa.cols, qaConfig)),
      ...premium.rows.map(r => buildRow(r, 'Agent', premium.cols, premiumConfig)),
    ]
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

// Tolerant date parser: accepts Date objects (Postgres timestamps), ISO-prefixed
// strings ("YYYY-MM-DD…"), and the M/D/YYYY varchar style used by Abiertos.
// Returns { dateStr, dateMs } or null.
function parseDateFlex(v: any): { dateStr: string; dateMs: number } | null {
  if (v == null) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    const iso = v.toISOString();
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return {
      dateStr: `${m[1]}-${m[2]}-${m[3]}`,
      dateMs: Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)),
    };
  }
  if (typeof v !== 'string') return null;
  const s = v.trim();
  // ISO prefix
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return {
    dateStr: `${m[1]}-${m[2]}-${m[3]}`,
    dateMs: Date.UTC(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10)),
  };
  // M/D/YYYY (Abiertos style)
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const y = parseInt(m[3], 10);
    const mo = parseInt(m[1], 10);
    const d = parseInt(m[2], 10);
    return {
      dateStr: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      dateMs: Date.UTC(y, mo - 1, d),
    };
  }
  return null;
}

app.get('/api/nsat', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(503).json({ error: 'Database not configured' });

    const { user, startDate, endDate } = req.query as { user?: string; startDate?: string; endDate?: string };

    // `user` here is a CSV of Compass values (same key used by /api/opened-cases).
    const userList = (user || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    // The three survey scores that drive the NSAT Index:
    //   Q1 = agent_satisfaction_score
    //   Q2 = effort_score
    //   Q3 = overall_satisfaction_score
    // Both tables share schema + scoring formula but use DIFFERENT join columns:
    //   NSAT.case_owner          ↔ Roster.Compass
    //   NSAT_Premium.agent_full_name ↔ Roster.Compass
    // We alias the join column to "_owner" so downstream processing is uniform.
    const dataCols = '"datetime_closed", "agent_satisfaction_score", "effort_score", "overall_satisfaction_score", "contact_reason_1"';
    const queryTable = async (table: string, joinCol: string): Promise<any[]> => {
      try {
        let r;
        if (userList.length > 0) {
          const placeholders = userList.map((_, i) => `$${i + 1}`).join(',');
          r = await pool.query(
            `SELECT "${joinCol}" AS "_owner", ${dataCols} FROM "${table}" WHERE "${joinCol}" IN (${placeholders})`,
            userList,
          );
        } else {
          r = await pool.query(`SELECT "${joinCol}" AS "_owner", ${dataCols} FROM "${table}"`);
        }
        return r.rows;
      } catch (err: any) {
        console.warn(`[nsat] table "${table}" unavailable: ${err?.message}`);
        return [];
      }
    };

    const [base, premium] = await Promise.all([
      queryTable('NSAT',         'case_owner'),
      queryTable('NSAT_Premium', 'agent_full_name'),
    ]);
    const rows = [...base, ...premium];

    const toScore = (v: unknown): number | null => {
      if (v == null) return null;
      const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const start = startDate ? Date.parse(startDate) : null;
    const end   = endDate   ? Date.parse(endDate)   : null;

    const out = rows
      .map(r => {
        const p = parseDateFlex(r['datetime_closed']);
        if (p === null) return null;
        return {
          caseOwner: r['_owner'],
          dateStr: p.dateStr,
          dateMs: p.dateMs,
          q1: toScore(r['agent_satisfaction_score']),
          q2: toScore(r['effort_score']),
          q3: toScore(r['overall_satisfaction_score']),
          // Used by the frontend to split NSAT into NSAT Information and
          // NSAT Claims via the same per-question NSAT formula.
          contactReason1: r['contact_reason_1'] ?? null,
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
    console.error('[nsat] error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch NSAT', detail: error?.message });
  }
});

// Still Open Cases: a CAC-team-wide count (not per-user). Returns every row
// of Aun_Abiertos within the date range as { dateStr, dateMs }. The frontend
// counts rows per bucket. No user filter — the entire table is CAC by spec.
app.get('/api/still-open-cases', async (req, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(503).json({ error: 'Database not configured' });

    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const r = await pool.query('SELECT "fecha_en_que_esta_abierto" FROM "Aun_Abiertos"');

    const start = startDate ? Date.parse(startDate) : null;
    const end   = endDate   ? Date.parse(endDate)   : null;

    const out = r.rows
      .map((row: any) => {
        const p = parseDateFlex(row['fecha_en_que_esta_abierto']);
        if (p === null) return null;
        return { dateStr: p.dateStr, dateMs: p.dateMs };
      })
      .filter((x: any): x is NonNullable<typeof x> => x !== null)
      .filter((x: any) => {
        if (start !== null && x.dateMs < start - 86400000) return false;
        if (end   !== null && x.dateMs > end   + 86400000) return false;
        return true;
      });

    res.json(out);
  } catch (error: any) {
    console.error('[still-open-cases] error:', error?.message);
    res.status(500).json({ error: 'Failed to fetch Still Open Cases', detail: error?.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

export default app;
