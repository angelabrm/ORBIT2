import express from 'express';
import path from 'path';
import pg from 'pg';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import crypto from 'crypto';

dayjs.extend(customParseFormat);

const { Pool } = pg;

// ── Environment ────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-in-production';
const IS_PROD = process.env.NODE_ENV === 'production';
const TOKEN_COOKIE = 'orbit_session';
const TOKEN_TTL_S = 8 * 60 * 60; // 8 hours

// ── Roster ─────────────────────────────────────────────────────────────────────
const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '122mX8Jh0w5HP7JwW21mKHTDN2h0YhQuQYHhumHAcm4s';
const SHEET_NAME = 'Roster';
const ROSTER_CACHE_TTL = 5 * 60 * 1000;

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
  console.log('[Roster] Headers:', JSON.stringify(headers));
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
  console.log(`[Roster] Loaded ${users.length} users from Google Sheets`);
  return users;
}

async function getRoster(): Promise<RosterUser[]> {
  const now = Date.now();
  if (rosterCache.length === 0 || now - rosterLastFetched > ROSTER_CACHE_TTL) {
    rosterCache = await fetchRosterFromSheets();
    rosterLastFetched = now;
  }
  return rosterCache;
}

// ── Auth helpers ───────────────────────────────────────────────────────────────
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
    `${TOKEN_COOKIE}=${token}`, 'HttpOnly', 'SameSite=Strict',
    `Max-Age=${TOKEN_TTL_S}`, 'Path=/',
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
  const now = Date.now(); const WINDOW = 15 * 60 * 1000; const MAX = 10;
  const entry = loginAttempts.get(ip);
  if (!entry || now > entry.resetAt) { loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW }); return true; }
  if (entry.count >= MAX) return false;
  entry.count++; return true;
}

// ── Auth middleware ────────────────────────────────────────────────────────────
function requireAuth(req: any, res: any, next: () => void): void {
  const cookies = parseCookies(req.headers['cookie'] as string | undefined);
  const token = cookies[TOKEN_COOKIE];
  if (!token) { res.status(401).json({ error: 'Authentication required' }); return; }
  try { req.auth = verifyToken(token); next(); }
  catch { clearSessionCookie(res); res.status(401).json({ error: 'Session expired — please log in again' }); }
}

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
  return ids;
}

function assertScope(requestedIds: string[], allowed: Set<string> | null, res: any): boolean {
  if (allowed === null || requestedIds.length === 0) return true;
  const bad = requestedIds.filter(id => !allowed.has(id));
  if (bad.length > 0) { res.status(403).json({ error: 'Access denied to requested scope' }); return false; }
  return true;
}

function resolveUserList(raw: string | undefined, auth: any): string[] {
  const list = (raw || '').split(',').map((s: string) => s.trim()).filter(Boolean);
  if (list.length > 0) return list;
  if ((auth.role === 'Agent' || auth.role === 'PM') && auth.compass) return [auth.compass as string];
  return [];
}

function errRes(res: any, status: number, message: string, detail?: string): void {
  const body: any = { error: message };
  if (!IS_PROD && detail) body.detail = detail;
  res.status(status).json(body);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DB_URL;
  const useSSL = process.env.DATABASE_SSL !== 'false';
  let pool: pg.Pool | null = null;
  if (dbUrl) { pool = new Pool({ connectionString: dbUrl, ssl: useSSL ? { rejectUnauthorized: false } : false }); }

  app.use(express.json());

  // ── Security headers ─────────────────────────────────────────────────────
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

  // ── Login ─────────────────────────────────────────────────────────────────
  app.post('/api/login', async (req, res) => {
    try {
      const ip = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(ip)) return res.status(429).json({ error: 'Too many login attempts — try again in 15 minutes' });
      const { rfc } = req.body || {};
      if (!rfc || typeof rfc !== 'string') return res.status(400).json({ error: 'RFC required' });
      const users = await getRoster();
      const user = users.find(u => u.rfc === rfc.toUpperCase().trim());
      if (!user) return res.status(401).json({ error: 'RFC not found' });
      const tokenPayload = {
        rfc: user.rfc, name: user.name, role: user.role, client: user.client,
        serviceDesk: user.serviceDesk, compass: user.compass ?? null,
        callPicker: user.callPicker ?? null, qa: user.qa ?? null,
        genesys: user.genesys ?? null, subNivel: user.subNivel ?? null,
      };
      setSessionCookie(res, signToken(tokenPayload));
      res.json({
        rfc: user.rfc, name: user.name, role: user.role, client: user.client,
        serviceDesk: user.serviceDesk, compass: user.compass,
        callPicker: user.callPicker, qa: user.qa, genesys: user.genesys, subNivel: user.subNivel,
      });
    } catch (error: any) {
      console.error('[Login] Error:', error?.message);
      errRes(res, 500, 'Login failed', error?.message);
    }
  });

  // ── Logout ────────────────────────────────────────────────────────────────
  app.post('/api/logout', (_req, res) => {
    clearSessionCookie(res);
    res.json({ ok: true });
  });

  // ── Me ────────────────────────────────────────────────────────────────────
  app.get('/api/me', requireAuth, (req: any, res) => {
    const { iat, exp, ...user } = req.auth;
    res.json(user);
  });

  // ── Roster (scoped) ───────────────────────────────────────────────────────
  app.get('/api/roster', requireAuth, async (req: any, res) => {
    try {
      const { role, client, serviceDesk } = req.auth;
      const all = await getRoster();
      let scoped: RosterUser[];
      if (role === 'Executive') { scoped = all; }
      else if (role === 'Manager') { scoped = all.filter(u => u.client === client); }
      else if (role === 'Leader') { scoped = all.filter(u => u.client === client && u.serviceDesk === serviceDesk); }
      else { scoped = all.filter(u => u.rfc === req.auth.rfc); }
      res.json(scoped);
    } catch (error: any) {
      console.error('[Roster] Fetch error:', error?.message);
      errRes(res, 500, 'Failed to fetch roster', error?.message);
    }
  });

  // ── Health ────────────────────────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', databaseConnected: !!pool, dbConfigured: !!dbUrl });
  });

  // ── Opened Cases ──────────────────────────────────────────────────────────
  app.get('/api/opened-cases', requireAuth, async (req: any, res) => {
    if (!pool) return res.status(503).json({ error: 'Database connection not configured' });
    try {
      const { case_owner, user, startDate, endDate } = req.query as {
        case_owner?: string; user?: string; startDate?: string; endDate?: string;
      };
      const rawList = user ? user.split(',').map(s => s.trim()).filter(Boolean) : case_owner ? [case_owner.trim()] : [];
      const ownerList = rawList.length > 0 ? rawList : resolveUserList(user, req.auth);
      const allowed = await getAllowedCompassIds(req.auth);
      if (!assertScope(ownerList, allowed, res)) return;

      let data: any[];
      if (ownerList.length > 0) {
        const ph = ownerList.map((_, i) => `$${i + 1}`).join(',');
        const result = await pool.query(`SELECT * FROM "Abiertos" WHERE "case_owner" IN (${ph})`, ownerList);
        data = result.rows;
      } else {
        const result = await pool.query('SELECT * FROM "Abiertos"');
        data = result.rows;
      }

      if (startDate || endDate) {
        const start = startDate ? dayjs(startDate as string) : null;
        const end   = endDate   ? dayjs(endDate as string)   : null;
        data = data.filter(row => {
          const openedAt = dayjs(row.datetime_opened, 'M/D/YYYY h:mm A');
          if (!openedAt.isValid()) return false;
          if (start && openedAt.isBefore(start, 'day')) return false;
          if (end   && openedAt.isAfter(end,   'day')) return false;
          return true;
        });
      }
      res.json(data);
    } catch (error: any) {
      console.error('Database error:', error?.message);
      errRes(res, 500, 'Failed to fetch data from database', error?.message);
    }
  });

  // ── Closed Cases ──────────────────────────────────────────────────────────
  app.get('/api/closed-cases', requireAuth, async (req: any, res) => {
    if (!pool) return res.status(503).json({ error: 'Database connection not configured' });
    try {
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

      const start = startDate ? dayjs(startDate as string) : null;
      const end   = endDate   ? dayjs(endDate as string)   : null;
      const out = rows
        .map((row: any) => {
          const d = dayjs(row['closed_date'], 'M/D/YYYY');
          if (!d.isValid()) return null;
          const op = dayjs(row['opened_date'], 'M/D/YYYY');
          return {
            caseClosedBy: row['case_closed_by'] ?? null,
            dateStr: d.format('YYYY-MM-DD'), dateMs: Date.UTC(d.year(), d.month(), d.date()),
            openedDateStr: op.isValid() ? op.format('YYYY-MM-DD') : null,
            contactReason1: row['contact_reason_1'] ?? null,
          };
        })
        .filter((r: any): r is NonNullable<typeof r> => r !== null)
        .filter((r: any) => {
          if (start && dayjs(r.dateStr).isBefore(start, 'day')) return false;
          if (end   && dayjs(r.dateStr).isAfter(end,   'day')) return false;
          return true;
        });
      res.json(out);
    } catch (error: any) {
      console.error('[closed-cases] error:', error?.message);
      errRes(res, 500, 'Failed to fetch closed cases', error?.message);
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => { res.sendFile(path.join(distPath, 'index.html')); });
  }

  app.listen(PORT, '0.0.0.0', () => { console.log(`Server running on http://localhost:${PORT}`); });
}

startServer().catch(err => { console.error('Failed to start server:', err); });
