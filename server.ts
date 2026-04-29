import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import pg from 'pg';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);

const { Pool } = pg;

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
