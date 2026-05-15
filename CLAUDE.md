# CLAUDE.md

Guidance for Claude Code when working in this repository.

> Product requirements, role definitions, business rules, and Pepsico PM spec → [PRD.md](PRD.md).

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Express + Vite HMR) on port 3000
npm run build        # Production build via Vite
npm run lint         # TypeScript type-check (tsc --noEmit)
npm run preview      # Preview production build
npm run clean        # Remove dist/
```

Node.js >= 20.0.0 required. Always run `npm run lint` before committing.

## Environment

Copy `.env.example` to `.env`:
- `DATABASE_URL` or `NEON_DB_URL` — Neon PostgreSQL (optional; `/api/opened-cases` degrades to 503 without it)
- `GEMINI_API_KEY` — Google Gemini (only required for AI features)
- `GOOGLE_SHEETS_ID` — Roster spreadsheet ID (default value present in code, no creds needed since the sheet is public)

## Architecture

React 19 + Vite frontend, Express 4 backend. Two parallel server entry points share roster logic but run in different environments — keep them in sync when changing API behavior.

### Backend entry points

| File | Used by |
|---|---|
| `server.ts` | Local dev (`npm run dev`) — Express with Vite middleware, full HMR |
| `api/index.ts` | Vercel production — same Express app exported as a serverless function |

`vercel.json` rewrites `/api/*` → `/api/index` and everything else → `/index.html`. `engines.node` is pinned to `22.x` in `package.json` (Node 24 broke the bundle).

**Vercel function landmines** — `api/index.ts` is a single-file Express handler. Some things will silently crash the cold start (FUNCTION_INVOCATION_FAILED with no log line) unless you keep them out of the module-load path:
- `@neondatabase/serverless` cannot be imported at module scope (not even via `typeof import(...)` in a type position). Removed entirely.
- `pg` is dynamically imported inside `getPool()` — never at the top of the file.
- `dayjs` parsing is also kept lazy; the file has its own `parseOpenedAt()` regex to avoid pulling `dayjs/plugin/customParseFormat` into the cold start.
- If you add a new DB library or heavy package, follow the same pattern: import it inside the handler that needs it, not at module top.

### Endpoints

| Endpoint | Purpose |
|---|---|
| `GET  /api/health` | DB connectivity check |
| `GET  /api/roster` | All Roster users from Google Sheets (5-min cache). Exposes `compass`, `callPicker`, `qa` join keys |
| `POST /api/login` | RFC lookup against Roster |
| `GET  /api/opened-cases` | Abiertos rows (filtered by `case_owner` ↔ `Roster.compass`) |
| `GET  /api/incoming-calls` | Actividad rows aggregated by `User` ↔ `Roster.callPicker` |
| `GET  /api/qa` | QA + QA_Premium merged, weighted per-row score (`Agente`/`Agent` ↔ `Roster.qa`) |
| `GET  /api/nsat` | NSAT rows with Q1/Q2/Q3 scores (`case_owner` ↔ `Roster.compass`) |

The Roster is fetched from Google Sheets via the public CSV export URL (`gviz/tq?tqx=out:csv`) — **no service account or credentials**. If that ever changes (sheet made private), `fetchRosterFromSheets()` lives in both `server.ts` and `api/index.ts` and must be updated in both.

**Date columns from Neon**: emit `dateStr: "YYYY-MM-DD"` (string) from the backend, not just `dateMs`. Reading `dayjs(dateMs)` on the frontend shifts by the browser's TZ offset and slides every datapoint by a day for users west of UTC. The helpers `parseSourceName`, `parseMarcaTemporal`, and `parseDateFlex` all return both fields — frontend bucketing reads `dateStr`.

### Frontend layout

```
src/
├── context/AuthContext.tsx   Global state: user, users (RFC→User map), selectedMember, managementTab, dateRange
├── services/apiService.ts    fetchOpenedCases / fetchIncomingCalls / fetchQA / fetchNSAT
├── data/
│   ├── mockData.ts           METRICS_DATA + getFilteredMetrics() + generateHistoricalData() (no user data)
│   └── pepsicoMockData.ts    Shared Pepsico mock layer: generateCampaignsForPM, generatePMMetrics,
│                             buildPMTrendData, buildTeamAvgTrendData — all RFC-seeded deterministic
└── components/
    ├── App.tsx               ThemeProvider + AuthProvider + Login/Dashboard
    ├── Dashboard.tsx         Role dispatch → View; member wrapper uses flex:1/minHeight:0 so
    │                         percentage-height rows in PMView resolve to real pixels
    ├── Sidebar.tsx           Date pickers, management tabs, member dropdown
    ├── Login.tsx             RFC entry, async login via /api/login
    └── Views/
        ├── AgentView.tsx              Agent/Leader (~1900 lines)
        ├── ProjectManagerView.tsx     Manager/Executive operational + admin tabs (Stellantis)
        ├── FinancialView.tsx          Executive only
        ├── ExecutiveView.tsx          Exists, NOT yet wired into Dashboard routing
        ├── PMView.tsx                 Pepsico PM — accepts member? prop for "view as"
        └── PepsicoManagerView.tsx     Pepsico Manager — team ranking, avg KPI, aggregated charts
```

### Conventions

- Use `ManagementIndicator` for all KPI cards — it carries the formula tooltip, color logic, and the quartile band. Defined in `AgentView.tsx`; `PMView.tsx` keeps its own slightly tighter copy (smaller value font + `whiteSpace: nowrap`) because its cards are narrower. When extracting a shared component, preserve both sizing variants.
- All Recharts charts share the same dark/light tooltip + axis styling. When adding a new chart, mirror the props from `AgentView.tsx` (CartesianGrid `vertical={false}`, primary-color stroke axes, `strokeWidth={4}` lines with hollow dots).
- MUI 9 `sx` prop for styles. Tailwind 4 is available via `@tailwindcss/vite` for utility classes.
- `dayjs` with `customParseFormat` for date handling; date pickers from `@mui/x-date-pickers`.
- `motion` (Framer Motion fork) for animation, `lucide-react` + `@mui/icons-material` for icons.

### HMR

`DISABLE_HMR=true` disables Vite HMR (used in environments like AI Studio that flicker during agent edits).

## UI Rules

- Never let text overlap. Use flex/grid flow — never absolute positioning for text.
- Truncate when content exceeds container: `text-overflow: ellipsis` (single line) or `line-clamp` (multi-line).
- Containers must allow dynamic growth — avoid fixed heights with variable text.
- Validate responsive at mobile, tablet, desktop.

## Working with Roster data

User data is **never** hardcoded. `MOCK_USERS` no longer exists. Components read users from `useAuth().users` (RFC→User map populated from `/api/roster` on mount). When adding a feature that needs to look up a user by RFC, by role, or by serviceDesk, use `Object.values(users).find(...)` — don't reach for a static map.

## Progressive migration: mock → Neon

The Stellantis trend chart in `AgentView.tsx` is moving from synthetic `generateHistoricalData(rfc)` mock to real (anonymized) Neon data. See PRD §11 for the per-indicator status, formulas, and join keys.

The wiring inside the component:

- `DB_INDICATORS` Set — indicator names that should pull from BD instead of mock. Add to this set to "promote" a new indicator.
- `dbTrendByBucket` useMemo — returns `{ out, qaByBucket, nsatByBucket }`:
  - `out` holds **count-style** values (Opened Cases, Closed Cases, Incoming Calls, …) where `0` is a legitimate datapoint.
  - `qaByBucket` / `nsatByBucket` hold **average-style** values where empty buckets are *absent* from the map — the trendData consumer renders `null` for those, so Recharts shows a gap. Lines for these indicators set `connectNulls={true}` so the gap is bridged.
- New BD-backed indicators with average semantics (NSAT-like) should follow the `xxxByBucket` pattern. Counts can stay in `out`.

When adding a new indicator, also touch:
- `indicatorOptions` dropdown (KPIs are aggregates of multiple indicators; Indicators come from a single source table).
- Tooltip + LabelList formatters in the LineChart — add a `% suffix` / integer / no-suffix branch as needed (QA shows `92.8%`; NSAT shows `-33`; counts show raw integer).
