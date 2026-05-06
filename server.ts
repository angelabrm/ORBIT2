import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import pg from 'pg';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { google } from 'googleapis';

dayjs.extend(customParseFormat);

const { Pool } = pg;

// --- Google Sheets / Roster ---

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID || '122mX8Jh0w5HP7JwW21mKHTDN2h0YhQuQYHhumHAcm4s';
const SHEET_NAME = 'Roster';
const ROSTER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface RosterUser {
  rfc: string;
  name: string;
  role: string;
  client: string;
  serviceDesk: string;
  team?: string[];
}

let rosterCache: RosterUser[] = [];
let rosterLastFetched = 0;

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
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    console.warn('[Roster] Google credentials not configured');
    return [];
  }

  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:V`,
  });

  const rows = response.data.values || [];
  if (rows.length < 2) return [];

  const headers = rows[0].map((h: string) => h.trim());
  const col = (name: string) => headers.indexOf(name);

  const docCol = col('Documento');
  const nombreCol = col('Nombre');
  const nivelCol = col('Nivel');
  const mesaCol = col('MESA_');
  const clientCol = col('Client');

  const users: RosterUser[] = rows
    .slice(1)
    .filter((row: string[]) => row[docCol]?.trim() && row[nivelCol]?.trim())
    .map((row: string[]) => {
      const rfc = row[docCol]?.trim().toUpperCase();
      const nombre = row[nombreCol]?.trim() || '';
      const nivel = row[nivelCol]?.trim() || '';
      const mesa = row[mesaCol]?.trim() || '';
      const clientVal = row[clientCol]?.trim() || '';
      const role = mapRole(nivel);
      if (!role || !rfc) return null;
      return { rfc, name: nombre, role, client: clientVal, serviceDesk: mapServiceDesk(mesa) };
    })
    .filter(Boolean) as RosterUser[];

  // Build team arrays for Leaders
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DB_URL;
  let pool: pg.Pool | null = null;

  if (dbUrl) {
    pool = new Pool({
      connectionString: dbUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
  }

  app.use(express.json());

  // Roster endpoint — returns all users from Google Sheets (cached 5 min)
  app.get('/api/roster', async (_req, res) => {
    try {
      const users = await getRoster();
      res.json(users);
    } catch (error) {
      console.error('[Roster] Fetch error:', error);
      res.status(500).json({ error: 'Failed to fetch roster' });
    }
  });

  // Login endpoint — looks up RFC in roster
  app.post('/api/login', async (req, res) => {
    try {
      const { rfc } = req.body;
      if (!rfc) return res.status(400).json({ error: 'RFC required' });
      const users = await getRoster();
      const user = users.find(u => u.rfc === rfc.toUpperCase().trim());
      if (user) {
        res.json(user);
      } else {
        res.status(404).json({ error: 'RFC not found' });
      }
    } catch (error) {
      console.error('[Login] Error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  });

  // API endpoint to fetch opened cases from database
  app.get('/api/opened-cases', async (req, res) => {
    if (!pool) {
      return res.status(503).json({ error: 'Database connection not configured' });
    }

    try {
      const { case_owner, startDate, endDate } = req.query;
      
      // Basic query to fetch all from Abiertos
      // In production, we'd filter in SQL, but since datetime_opened is varchar and 
      // follows a specific format MM/DD/YYYY hh:mm AM/PM, it's easier to parse in JS
      // or use complex SQL. For this demo, let's try to do it accurately.
      
      let query = 'SELECT * FROM "Abiertos"';
      let params: any[] = [];
      
      if (case_owner) {
        query += ' WHERE "case_owner" = $1';
        params.push(case_owner);
      }

      const result = await pool.query(query, params);
      
      // Filter by date in JavaScript to handle the specific varchar format
      let data = result.rows;
      
      if (startDate || endDate) {
        const start = startDate ? dayjs(startDate as string) : null;
        const end = endDate ? dayjs(endDate as string) : null;
        
        data = data.filter(row => {
          // Format: 7/30/2025 11:27 AM -> M/D/YYYY h:mm A
          const openedAt = dayjs(row.datetime_opened, 'M/D/YYYY h:mm A');
          if (!openedAt.isValid()) return false;
          
          if (start && openedAt.isBefore(start, 'day')) return false;
          if (end && openedAt.isAfter(end, 'day')) return false;
          
          return true;
        });
      }

      res.json(data);
    } catch (error) {
      console.error('Database error:', error);
      res.status(500).json({ error: 'Failed to fetch data from database' });
    }
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      databaseConnected: !!pool,
      dbConfigured: !!dbUrl
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
