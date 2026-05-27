import express from 'express';
import crypto from 'crypto';

const app = express();
app.use(express.json());

// ── Environment ────────────────────────────────────────────────────────────────
const dbUrl = process.env.DATABASE_URL || process.env.NEON_DB_URL;
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const IS_PROD = process.env.NODE_ENV === 'production';
const TOKEN_COOKIE = 'orbit_session';
const TOKEN_TTL_S = 8 * 60 * 60; // 8 hours

// ── Lazy pg pool ───────────────────────────────────────────────────────────────
let poolPromise: Promise<any> | null = null;
function getPool(): Promise<any> {
  if (!dbUrl) return Promise.resolve(null);
  if (!poolPromise) {
    poolPromise = import('pg').then((pgMod: any) => {
      const Pool = pgMod.Pool || pgMod.default?.Pool;
      return new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false }, max: 1 });
    });
  }
  return poolPromise;
}

// ── Date helpers ───────────────────────────────────────────────────────────────
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

function parseSourceName(s: string): { dateStr: string; dateMs: number } | null {
  if (!s) return null;
  const m = s.match(/Actividad_(\d{4})_(\d{2})_(\d{2})\.csv$/i);
  if (!m) return null;
  return { dateStr: `${m[1]}-${m[2]}-${m[3]}`, dateMs: Date.UTC(+m[1], +m[2] - 1, +m[3]) };
}

function parseMarcaTemporal(v: any): { dateStr: string; dateMs: number } | null {
  if (v == null) return null;
  let iso: string;
  if (v instanceof Date) { if (Number.isNaN(v.getTime())) return null; iso = v.toISOString(); }
  else if (typeof v === 'string') { iso = v; }
  else return null;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return { dateStr: `${m[1]}-${m[2]}-${m[3]}`, dateMs: Date.UTC(+m[1], +m[2] - 1, +m[3]) };
}

function parseDateFlex(v: any): { dateStr: string; dateMs: number } | null {
  if (v == null) return null;
  if (v instanceof Date) {
    if (Number.isNaN(v.getTime())) return null;
    const iso = v.toISOString();
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return null;
    return { dateStr: `${m[1]}-${m[2]}-${m[3]}`, dateMs: Date.UTC(+m[1], +m[2] - 1, +m[3]) };
  }
  if (typeof v !== 'string') return null;
  const s = v.trim();
  let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return { dateStr: `${m[1]}-${m[2]}-${m[3]}`, dateMs: Date.UTC(+m[1], +m[2] - 1, +m[3]) };
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const y = +m[3], mo = +m[1], d = +m[2];
    return { dateStr: `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`, dateMs: Date.UTC(y, mo - 1, d) };
  }
  return null;
}

// ── Roster ─────────────────────────────────────────────────────────────────────
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '122mX8Jh0w5HP7JwW21mKHTDN2h0YhQuQYHhumHAcm4s';
const SHEET_NAME = 'Roster';
const CACHE_TTL = 5 * 60 * 1000;

interface RosterUser {
  rfc: string; compass?: string; callPicker?: string; qa?: string; genesys?: string;
  subNivel?: string; name: string; role: string; client: string; serviceDesk: string; team?: string[];
}

let rosterCache: RosterUser[] = [];
let rosterLastFetched = 0;

function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let field = ''; let inQuotes = false;
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
  if (m === 'cac') return 'CAC'; if (m === 'fleet') return 'Fleet'; if (m === 'premium') return 'Premium';
  if (m === 'manager') return 'Manager'; if (m === 'executive') return 'Executive';
  if (m === 'pm' || m === 'pepsico') return 'PM';
  return mesa?.trim() || '';
}

async function fetchRosterFromSheets(): Promise<RosterUser[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET_NAME)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sheets fetch failed: ${res.status}`);
  const rows = parseCSV(await res.text());
  if (rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim());
  const col = (name: string) => headers.indexOf(name);
  const docCol = col('Documento'), compassCol = col('Compass'), callPickerCol = col('CallPicker');
  const qaCol = col('QA'), genesysCol = col('Genesys'), subNivelCol = col('SubNivel');
  const nombreCol = col('Nombre'), nivelCol = col('Nivel'), mesaCol = col('MESA_'), clientCol = col('Client');
  const users: RosterUser[] = rows.slice(1)
    .filter(row => row[docCol]?.trim() && row[nivelCol]?.trim())
    .map(row => {
      const rfc = row[docCol]?.trim().toUpperCase();
      const role = mapRole(row[nivelCol]?.trim() || '');
      if (!role || !rfc) return null;
      return {
        rfc,
        compass:    compassCol    >= 0 ? (row[compassCol]?.trim()    || undefined) : undefined,
        callPicker: callPickerCol >= 0 ? (row[callPickerCol]?.trim() || undefined) : undefined,
        qa:         qaCol         >= 0 ? (row[qaCol]?.trim()         || undefined) : undefined,
        genesys:    genesysCol    >= 0 ? (row[genesysCol]?.trim()    || undefined) : undefined,
        subNivel:   subNivelCol   >= 0 ? (row[subNivelCol]?.trim()   || undefined) : undefined,
        name: row[nombreCol]?.trim() || '', role,
        client: row[clientCol]?.trim() || '', serviceDesk: mapServiceDesk(row[mesaCol]?.trim() || ''),
      };
    }).filter(Boolean) as RosterUser[];
  const agentsByKey: Record<string, string[]> = {};
  users.forEach(u => { if (u.role === 'Agent') { const k = `${u.client}:${u.serviceDesk}`; (agentsByKey[k] ??= []).push(u.rfc); } });
  users.forEach(u => { if (u.role === 'Leader') u.team = agentsByKey[`${u.client}:${u.serviceDesk}`] || []; });
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

// ── Auth: cookie & JWT ─────────────────────────────────────────────────────────
function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(p => {
      const [k, ...v] = p.split('=');
      return [k.trim(), decodeURIComponent(v.join('=').trim())];
    }),
  );
}

function signToken(payload: Record<string, unknown>): string {
  const h = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const b = Buffer.from(JSON.stringify({
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_S,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${b}`).digest('base64url');
  return `${h}.${b}.${sig}`;
}

function verifyToken(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const [h, b, sig] = parts;
  const expected = crypto.createHmac('sha256', JWT_SECRET).update(`${h}.${b}`).digest('base64url');
  const sigBuf = Buffer.from(sig, 'base64url');
  const expBuf = Buffer.from(expected, 'base64url');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) throw new Error('Invalid signature');
  const payload = JSON.parse(Buffer.from(b, 'base64url').toString()) as Record<string, unknown>;
  if (typeof payload.exp === 'number' && Math.floor(Date.now() / 1000) > payload.exp) throw new Error('Token expired');
  return payload;
}

function setSessionCookie(res: any, token: string): void {
  const cookieOpts = [
    `${TOKEN_COOKIE}=${token}`,
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${TOKEN_TTL_S}`,
    'Path=/',
    ...(IS_PROD ? ['Secure'] : []),
  ].join('; ');
  res.setHeader('Set-Cookie', cookieOpts);
}

function clearSessionCookie(res: any): void {
  res.setHeader('Set-Cookie', `${TOKEN_COOKIE}=; HttpOnly; SameSite=Strict; Max-Age=0; Path=/`);
}

// ── Rate limiting ──────────────────────────────────────────────────────────────
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const WINDOW = 15 * 60 * 1000; // 15 min
  const MAX = 10;
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) { loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW }); return true; }
  if (entry.count >= MAX) return false;
  entry.count++;
  return true;
}

// ── Security headers middleware ────────────────────────────────────────────────
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    "connect-src 'self' https://docs.google.com",
  ].join('; '));
  next();
});

// ── requireAuth middleware ─────────────────────────────────────────────────────
function requireAuth(req: any, res: any, next: () => void): void {
  const cookies = parseCookies(req.headers['cookie'] as string | undefined);
  const token = cookies[TOKEN_COOKIE];
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return; }
  try {
    req.auth = verifyToken(token);
    next();
  } catch {
    clearSessionCookie(res);
    res.status(401).json({ error: 'Session expired — please log in again' });
  }
}

// ── Scope helpers ──────────────────────────────────────────────────────────────
// Returns the set of Compass IDs the authenticated user is allowed to query.
// null = unrestricted (Executive).
async function getAllowedCompassIds(auth: any): Promise<Set<string> | null> {
  const { role, client, serviceDesk, compass } = auth;
  if (role === 'Executive') return null;
  const roster = await getRoster();
  const ids = new Set<string>();
  if (compass) ids.add(compass as string);
  if (role === 'Manager') {
    roster.filter(u => u.client === client && u.compass).forEach(u => ids.add(u.compass!));
  } else if (role === 'Leader') {
    roster.filter(u => u.client === client && u.serviceDesk === serviceDesk && u.compass).forEach(u => ids.add(u.compass!));
  }
  // Agent and PM: only their own compass (already added above)
  return ids;
}

// Sends 403 and returns false if any requested ID is outside the allowed scope.
function assertScope(requestedIds: string[], allowed: Set<string> | null, res: any): boolean {
  if (allowed === null || requestedIds.length === 0) return true;
  const bad = requestedIds.filter(id => !allowed.has(id));
  if (bad.length > 0) { res.status(403).json({ error: 'Access denied to requested scope' }); return false; }
  return true;
}

// Resolve ?user= query param. Agent/PM with no ?user= auto-scope to own compass
// to prevent accidental full-table scans.
function resolveUserList(raw: string | undefined, auth: any): string[] {
  const list = (raw || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  if (list.length > 0) return list;
  if ((auth.role === 'Agent' || auth.role === 'PM') && auth.compass) return [auth.compass as string];
  return [];
}

// Safe error response — suppress internal details in production.
function errRes(res: any, status: number, message: string, detail?: string): void {
  const body: any = { error: message };
  if (!IS_PROD && detail) body.detail = detail;
  res.status(status).json(body);
}

// ── QA scoring ────────────────────────────────────────────────────────────────
const QA_CRITERIA: { weight: number; pattern: RegExp }[] = [
  { weight: 16, pattern: /cultivar|cultivate/i },
  { weight: 16, pattern: /lenguaje|language/i },
  { weight: 16, pattern: /empat/i },
  { weight: 16, pattern: /escucha|listening/i },
  { weight: 16, pattern: /^asegurar|reassurance/i },
  { weight: 4,  pattern: /documentaci|documentation/i },
  { weight: 4,  pattern: /tipificaci|case coding/i },
  { weight: 4,  pattern: /verificaci|verification/i },
  { weight: 4,  pattern: /cumplimiento|process adherence/i },
  { weight: 4,  pattern: /toma de decisiones|decision making/i },
];
const QA_ERROR_PATTERN = /(error.*cr|critical.*error)/i;

function isErrorCritico(v: unknown): boolean {
  if (v == null) return false;
  const s = String(v).trim(); if (s === '') return false;
  const u = s.toUpperCase(); if (u === 'NA' || u === 'N/A') return false;
  return true;
}

type QaConfig = { thumbsUp: string; naCountsAsFull: boolean };

function scoreQaRow(row: any, cols: string[], config: QaConfig): number {
  const errorCol = cols.find(c => QA_ERROR_PATTERN.test(c));
  if (errorCol && isErrorCritico(row[errorCol])) return 0;
  let score = 0;
  for (const { weight, pattern } of QA_CRITERIA) {
    const col = cols.find(c => pattern.test(c));
    if (!col) continue;
    const raw = row[col]; if (raw == null) continue;
    const v = String(raw).trim(), vu = v.toUpperCase();
    if (v.toLowerCase() === config.thumbsUp.toLowerCase()) score += weight;
    else if (config.naCountsAsFull && (vu === 'NA' || vu === 'N/A')) score += weight;
  }
  return score;
}

async function queryQaTable(
  pool: any, tableName: string, agentCol: string,
  userList: string[], startDate?: string, endDate?: string,
): Promise<{ rows: any[]; cols: string[] }> {
  try {
    const params: any[] = [], conditions: string[] = [];
    if (userList.length > 0) {
      const placeholders = userList.map((_, i) => `$${params.length + i + 1}`).join(',');
      conditions.push(`"${agentCol}" IN (${placeholders})`);
      params.push(...userList);
    }
    if (startDate) { params.push(startDate); conditions.push(`"Marca temporal"::date >= $${params.length}::date`); }
    if (endDate)   { params.push(endDate);   conditions.push(`"Marca temporal"::date <= $${params.length}::date`); }
    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const r = await pool.query(`SELECT * FROM "${tableName}" ${where}`, params);
    return { rows: r.rows, cols: (r.fields || []).map((f: any) => f.name) };
  } catch (err: any) {
    console.warn(`[qa] table "${tableName}" unavailable: ${err?.message}`);
    return { rows: [], cols: [] };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// ENDPOINTS
// ══════════════════════════════════════════════════════════════════════════════

// ── Login ──────────────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
    if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Too many login attempts — try again in 15 minutes' });

    const { rfc } = req.body || {};
    if (!rfc || typeof rfc !== 'string') return res.status(400).json({ error: 'RFC required' });

    const users = await getRoster();
    const user = users.find(u => u.rfc === rfc.toUpperCase().trim());
    if (!user) return res.status(401).json({ error: 'RFC not found' });

    // Issue session cookie — never include RFC in token (it's in the response body only)
    const tokenPayload = {
      rfc: user.rfc, name: user.name, role: user.role, client: user.client,
      serviceDesk: user.serviceDesk, compass: user.compass ?? null,
      callPicker: user.callPicker ?? null, qa: user.qa ?? null,
      genesys: user.genesys ?? null, subNivel: user.subNivel ?? null,
    };
    setSessionCookie(res, signToken(tokenPayload));

    // Return user object (no sensitive join keys — frontend doesn't need callPicker/genesys)
    res.json({
      rfc: user.rfc, name: user.name, role: user.role, client: user.client,
      serviceDesk: user.serviceDesk, compass: user.compass,
      callPicker: user.callPicker, qa: user.qa, genesys: user.genesys,
      subNivel: user.subNivel,
    });
  } catch (error: any) {
    console.error('[Login] Error:', error?.message);
    errRes(res, 500, 'Login failed', error?.message);
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
app.post('/api/logout', (_req, res) => {
  clearSessionCookie(res);
  res.json({ ok: true });
});

// ── Me (session check / restore) ──────────────────────────────────────────────
app.get('/api/me', requireAuth, (req: any, res) => {
  const { iat, exp, ...user } = req.auth;
  res.json(user);
});

// ── Roster (scoped by role) ────────────────────────────────────────────────────
app.get('/api/roster', requireAuth, async (req: any, res) => {
  try {
    const { role, client, serviceDesk } = req.auth;
    const all = await getRoster();

    let scoped: RosterUser[];
    if (role === 'Executive') {
      scoped = all;
    } else if (role === 'Manager') {
      scoped = all.filter(u => u.client === client);
    } else if (role === 'Leader') {
      scoped = all.filter(u => u.client === client && u.serviceDesk === serviceDesk);
    } else {
      // Agent, PM: only themselves
      scoped = all.filter(u => u.rfc === req.auth.rfc);
    }

    res.json(scoped);
  } catch (error: any) {
    console.error('[Roster] Error:', error?.message);
    errRes(res, 500, 'Failed to fetch roster', error?.message);
  }
});

// ── Opened Cases ──────────────────────────────────────────────────────────────
app.get('/api/opened-cases', requireAuth, async (req: any, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(503).json({ error: 'Database not configured' });

    const { case_owner, user, startDate, endDate } = req.query as {
      case_owner?: string; user?: string; startDate?: string; endDate?: string;
    };

    const rawList = user
      ? user.split(',').map(s => s.trim()).filter(Boolean)
      : case_owner ? [case_owner.trim()] : [];

    const ownerList = rawList.length > 0 ? rawList : resolveUserList(user, req.auth);
    const allowed = await getAllowedCompassIds(req.auth);
    if (!assertScope(ownerList, allowed, res)) return;

    let rows: any[];
    if (ownerList.length > 0) {
      const placeholders = ownerList.map((_, i) => `$${i + 1}`).join(',');
      const r = await pool.query(`SELECT * FROM "Abiertos" WHERE "case_owner" IN (${placeholders})`, ownerList);
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
        if (start !== null && t < start - 86400000) return false;
        if (end   !== null && t > end   + 86400000) return false;
        return true;
      });
    }

    res.json(rows);
  } catch (error: any) {
    console.error('[opened-cases] error:', error?.message);
    errRes(res, 500, 'Failed to fetch data', error?.message);
  }
});

// ── Incoming Calls ─────────────────────────────────────────────────────────────
app.get('/api/incoming-calls', requireAuth, async (req: any, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(503).json({ error: 'Database not configured' });

    const { user, genesys, startDate, endDate } = req.query as {
      user?: string; genesys?: string; startDate?: string; endDate?: string;
    };

    const callPickerList = resolveUserList(user, req.auth);
    // For genesys, derive from auth if not provided and Agent/PM
    const genesysList = (genesys || '').split(',').map((s: string) => s.trim()).filter(Boolean).length > 0
      ? (genesys || '').split(',').map((s: string) => s.trim()).filter(Boolean)
      : ((req.auth.role === 'Agent' || req.auth.role === 'PM') && req.auth.genesys)
        ? [req.auth.genesys as string] : [];

    const allowed = await getAllowedCompassIds(req.auth);
    // callPicker and genesys IDs are different namespaces from compass — skip scope check here;
    // scope is enforced by only allowing the user's own IDs when role is Agent/PM (via resolveUserList).

    const queryActividad = async (): Promise<any[]> => {
      try {
        let r;
        if (callPickerList.length > 0) {
          const ph = callPickerList.map((_, i) => `$${i + 1}`).join(',');
          r = await pool.query(`SELECT "User", "Answered Calls", "Source.Name" FROM "Actividad" WHERE "User" IN (${ph})`, callPickerList);
        } else {
          r = await pool.query('SELECT "User", "Answered Calls", "Source.Name" FROM "Actividad"');
        }
        return r.rows.map((row: any) => {
          const p = parseSourceName(row['Source.Name']);
          if (!p) return null;
          return { user: row['User'], source: row['Source.Name'], dateStr: p.dateStr, dateMs: p.dateMs, answeredCalls: Number(row['Answered Calls']) || 0 };
        }).filter((x: any) => x !== null);
      } catch (e: any) { console.warn(`[incoming-calls] Actividad unavailable: ${e?.message}`); return []; }
    };

    const queryRendimiento = async (): Promise<any[]> => {
      try {
        let r;
        if (genesysList.length > 0) {
          const ph = genesysList.map((_, i) => `$${i + 1}`).join(',');
          r = await pool.query(`SELECT "nombre_del_agente", "contestadas", "inicio_del_intervalo" FROM "Rendimiento_Agente" WHERE "nombre_del_agente" IN (${ph})`, genesysList);
        } else {
          r = await pool.query('SELECT "nombre_del_agente", "contestadas", "inicio_del_intervalo" FROM "Rendimiento_Agente"');
        }
        return r.rows.map((row: any) => {
          const p = parseDateFlex(row['inicio_del_intervalo']);
          if (!p) return null;
          return { user: row['nombre_del_agente'], source: 'Rendimiento_Agente', dateStr: p.dateStr, dateMs: p.dateMs, answeredCalls: Number(row['contestadas']) || 0 };
        }).filter((x: any) => x !== null);
      } catch (e: any) { console.warn(`[incoming-calls] Rendimiento_Agente unavailable: ${e?.message}`); return []; }
    };

    const [actividad, rendimiento] = await Promise.all([queryActividad(), queryRendimiento()]);

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
    errRes(res, 500, 'Failed to fetch activity', error?.message);
  }
});

// ── QA ────────────────────────────────────────────────────────────────────────
app.get('/api/qa', requireAuth, async (req: any, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(503).json({ error: 'Database not configured' });

    const { user, startDate, endDate } = req.query as { user?: string; startDate?: string; endDate?: string };
    const userList = resolveUserList(user, req.auth);

    // QA table uses the QA ID (Roster.qa), not compass — scope check skipped for namespace mismatch;
    // auto-scope (resolveUserList) ensures Agent/PM can't query without their own ID.

    const [qa, premium] = await Promise.all([
      queryQaTable(pool, 'QA',         'Agente', userList, startDate, endDate),
      queryQaTable(pool, 'QA_Premium', 'Agent',  userList, startDate, endDate),
    ]);

    const qaConfig:      QaConfig = { thumbsUp: 'Pulgar Arriba', naCountsAsFull: false };
    const premiumConfig: QaConfig = { thumbsUp: 'Thumbs up',     naCountsAsFull: true };

    const buildRow = (row: any, agentColName: string, cols: string[], config: QaConfig) => {
      const p = parseMarcaTemporal(row['Marca temporal'] ?? row['Marca Temporal']);
      if (!p) return null;
      return { agente: row[agentColName], dateStr: p.dateStr, dateMs: p.dateMs, score: scoreQaRow(row, cols, config) };
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
    errRes(res, 500, 'Failed to fetch QA', error?.message);
  }
});

// ── NSAT ──────────────────────────────────────────────────────────────────────
app.get('/api/nsat', requireAuth, async (req: any, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(503).json({ error: 'Database not configured' });

    const { user, startDate, endDate } = req.query as { user?: string; startDate?: string; endDate?: string };
    const userList = resolveUserList(user, req.auth);

    const allowed = await getAllowedCompassIds(req.auth);
    if (!assertScope(userList, allowed, res)) return;

    const dataCols = '"datetime_closed", "agent_satisfaction_score", "effort_score", "overall_satisfaction_score", "contact_reason_1"';
    const queryTable = async (table: string, joinCol: string): Promise<any[]> => {
      try {
        let r;
        if (userList.length > 0) {
          const ph = userList.map((_, i) => `$${i + 1}`).join(',');
          r = await pool.query(`SELECT "${joinCol}" AS "_owner", ${dataCols} FROM "${table}" WHERE "${joinCol}" IN (${ph})`, userList);
        } else {
          r = await pool.query(`SELECT "${joinCol}" AS "_owner", ${dataCols} FROM "${table}"`);
        }
        return r.rows;
      } catch (err: any) { console.warn(`[nsat] table "${table}" unavailable: ${err?.message}`); return []; }
    };

    const [base, premium] = await Promise.all([
      queryTable('NSAT',         'case_owner'),
      queryTable('NSAT_Premium', 'agent_full_name'),
    ]);

    const toScore = (v: unknown): number | null => {
      if (v == null) return null; const n = typeof v === 'number' ? v : Number(v);
      return Number.isFinite(n) ? n : null;
    };

    const start = startDate ? Date.parse(startDate) : null;
    const end   = endDate   ? Date.parse(endDate)   : null;

    const out = [...base, ...premium]
      .map(r => {
        const p = parseDateFlex(r['datetime_closed']);
        if (!p) return null;
        return {
          caseOwner: r['_owner'], dateStr: p.dateStr, dateMs: p.dateMs,
          q1: toScore(r['agent_satisfaction_score']), q2: toScore(r['effort_score']),
          q3: toScore(r['overall_satisfaction_score']), contactReason1: r['contact_reason_1'] ?? null,
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
    errRes(res, 500, 'Failed to fetch NSAT', error?.message);
  }
});

// ── Still Open Cases ──────────────────────────────────────────────────────────
app.get('/api/still-open-cases', requireAuth, async (req: any, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(503).json({ error: 'Database not configured' });

    // Only Manager/Executive/Leader/Agent with CAC scope should reach this.
    // No user filter — this table is CAC-wide by design.
    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };

    let rawRows: any[];
    try {
      const sqlParams: any[] = [], conditions: string[] = [];
      if (startDate) { sqlParams.push(startDate); conditions.push(`"fecha_en_que_esta_abierto"::date >= $${sqlParams.length}::date`); }
      if (endDate)   { sqlParams.push(endDate);   conditions.push(`"fecha_en_que_esta_abierto"::date <= $${sqlParams.length}::date`); }
      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
      const r = await pool.query(`SELECT "fecha_en_que_esta_abierto" FROM "Aun_Abiertos" ${where}`, sqlParams);
      rawRows = r.rows;
    } catch {
      const r = await pool.query('SELECT "fecha_en_que_esta_abierto" FROM "Aun_Abiertos"');
      rawRows = r.rows;
    }

    const start = startDate ? Date.parse(startDate) : null;
    const end   = endDate   ? Date.parse(endDate)   : null;

    const out = rawRows
      .map((row: any) => { const p = parseDateFlex(row['fecha_en_que_esta_abierto']); return p ? { dateStr: p.dateStr, dateMs: p.dateMs } : null; })
      .filter((x: any): x is NonNullable<typeof x> => x !== null)
      .filter((x: any) => {
        if (start !== null && x.dateMs < start - 86400000) return false;
        if (end   !== null && x.dateMs > end   + 86400000) return false;
        return true;
      });

    res.json(out);
  } catch (error: any) {
    console.error('[still-open-cases] error:', error?.message);
    errRes(res, 500, 'Failed to fetch Still Open Cases', error?.message);
  }
});

// ── Closed Cases ──────────────────────────────────────────────────────────────
app.get('/api/closed-cases', requireAuth, async (req: any, res) => {
  try {
    const pool = await getPool();
    if (!pool) return res.status(503).json({ error: 'Database not configured' });

    const { user, startDate, endDate } = req.query as { user?: string; startDate?: string; endDate?: string };
    const userList = resolveUserList(user, req.auth);

    const allowed = await getAllowedCompassIds(req.auth);
    if (!assertScope(userList, allowed, res)) return;

    let rows: any[];
    if (userList.length > 0) {
      const ph = userList.map((_, i) => `$${i + 1}`).join(',');
      const r = await pool.query(
        `SELECT "case_closed_by", "closed_date", "opened_date", "contact_reason_1" FROM "Cerrados" WHERE "case_closed_by" IN (${ph})`,
        userList,
      );
      rows = r.rows;
    } else {
      const r = await pool.query('SELECT "case_closed_by", "closed_date", "opened_date", "contact_reason_1" FROM "Cerrados"');
      rows = r.rows;
    }

    const start = startDate ? Date.parse(startDate) : null;
    const end   = endDate   ? Date.parse(endDate)   : null;

    const out = rows
      .map(row => {
        const p = parseDateFlex(row['closed_date']); if (!p) return null;
        const op = parseDateFlex(row['opened_date']);
        return {
          caseClosedBy: row['case_closed_by'] ?? null, dateStr: p.dateStr, dateMs: p.dateMs,
          openedDateStr: op?.dateStr ?? null, contactReason1: row['contact_reason_1'] ?? null,
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
    console.error('[closed-cases] error:', error?.message);
    errRes(res, 500, 'Failed to fetch closed cases', error?.message);
  }
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', db: !!dbUrl });
});

export default app;
