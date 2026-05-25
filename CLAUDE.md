# CLAUDE.md

> Product requirements, role definitions, business rules, Pepsico PM spec, and migration status → [PRD.md](PRD.md).

## Git workflow

**No branches.** All commits go directly to `main`. Never create a branch, never use worktrees for new features — commit and push straight to `main`. Run `npm run lint` before every commit.

## Commands

```bash
npm run dev      # Express + Vite HMR on port 3000
npm run build    # Production build
npm run lint     # tsc --noEmit — run before every commit
npm run preview  # Preview prod build
npm run clean    # Remove dist/
```

Node.js >= 20.0.0 required.

## Environment

Copy `.env.example` to `.env`:
- `DATABASE_URL` / `NEON_DB_URL` — Neon PostgreSQL
- `GEMINI_API_KEY` — Google Gemini (AI features only)
- `GOOGLE_SHEETS_ID` — Roster sheet (default in code; public sheet, no creds needed)

## Architecture

React 19 + Vite frontend, Express 4 backend. Two parallel entry points — keep in sync:

| File | Used by |
|---|---|
| `server.ts` | Local dev — Express + Vite HMR |
| `api/index.ts` | Vercel — same app as serverless function |

`vercel.json`: `/api/*` → `/api/index`, everything else → `/index.html`. Node pinned to `22.x`.

**`api/index.ts` cold-start rules** — violations silently crash with no log:
- Never import `@neondatabase/serverless` at module scope (removed entirely).
- `pg` is dynamically imported inside `getPool()`.
- `dayjs/plugin/customParseFormat` is not imported; `parseOpenedAt()` uses a regex instead.
- Follow the same lazy-import pattern for any new heavy package.

### Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | DB check |
| `GET /api/roster` | Google Sheets users, 5-min cache; exposes `compass`, `callPicker`, `qa`, `genesys` join keys |
| `POST /api/login` | RFC lookup |
| `GET /api/opened-cases` | `Abiertos` — rows where `datetime_opened` falls in range |
| `GET /api/closed-cases` | `Cerrados` — join `case_closed_by ↔ Roster.Compass`; date from `closed_date` (`M/D/YYYY` varchar) |
| `GET /api/incoming-calls` | `Actividad` + `Rendimiento_Agente` merged |
| `GET /api/qa` | `QA` + `QA_Premium` merged |
| `GET /api/nsat` | `NSAT` + `NSAT_Premium` merged; ships Q1/Q2/Q3 |
| `GET /api/still-open-cases` | `Aun_Abiertos` — CAC-wide backlog snapshot |

Roster fetched via public CSV (`gviz/tq?tqx=out:csv`) — no service account. If the sheet goes private, update `fetchRosterFromSheets()` in **both** `server.ts` and `api/index.ts`.

**Date columns**: always emit `dateStr: "YYYY-MM-DD"` from the backend alongside `dateMs`. Frontend bucketing always reads `dateStr` — `dayjs(dateMs)` shifts by TZ offset for users west of UTC.

### Frontend layout

```
src/
├── context/AuthContext.tsx        user, users (RFC→User map), selectedMember, managementTab, dateRange
├── services/apiService.ts         fetch helpers for all endpoints
├── data/
│   ├── mockData.ts                METRICS_DATA, getFilteredMetrics(), generateHistoricalData()
│   └── pepsicoMockData.ts         RFC-seeded deterministic Pepsico mock (PMView + PepsicoManagerView)
└── components/
    ├── App.tsx / Dashboard.tsx / Sidebar.tsx / Login.tsx
    └── Views/
        ├── AgentView.tsx              Agent + Leader (~3300 lines); owns DB_INDICATORS migration
        ├── ProjectManagerView.tsx     Manager + Executive operational/admin (Stellantis)
        ├── FinancialView.tsx          Executive only
        ├── ExecutiveView.tsx          Exists — NOT yet wired into Dashboard routing
        ├── PMView.tsx                 Pepsico PM; accepts member? for "view as"
        └── PepsicoManagerView.tsx     Pepsico Manager — ranking, aggregated charts
```

### Conventions

- **KPI cards** — use `ManagementIndicator` (defined in `AgentView.tsx`; `PMView.tsx` has a tighter copy for narrower cards).
- **Charts** — mirror `AgentView.tsx` props: `CartesianGrid vertical={false}`, primary-color axes, `strokeWidth={4}` lines with hollow dots.
- **Styles** — MUI 9 `sx` prop; Tailwind 4 via `@tailwindcss/vite` for utilities.
- **Dates** — `dayjs` + `customParseFormat`; pickers from `@mui/x-date-pickers`.
- **Icons** — `lucide-react` + `@mui/icons-material`. **Animations** — `motion` (Framer Motion fork).
- **HMR** — set `DISABLE_HMR=true` in environments that flicker during edits.

## UI Rules

- No text overlap — use flex/grid flow, never absolute positioning for text.
- Truncate overflowing text: `text-overflow: ellipsis` (single line) or `line-clamp` (multi-line).
- Containers must grow with content — avoid fixed heights with variable text.

## Roster data

User data is **never** hardcoded. Read from `useAuth().users` (RFC→User map, populated from `/api/roster`). Lookup pattern: `Object.values(users).find(...)`. `case_owner` in DB rows is a **Compass ID** — map RFC→`users[rfc]?.compass` before filtering.

## Mock → Neon migration (Stellantis, `AgentView.tsx`)

See **PRD §11** for formulas, join keys, display format, and pending indicators.

Key wiring points in `AgentView.tsx`:
- `DB_INDICATORS` Set — add an indicator name here to promote it from mock to Neon. `'Productivity'` is NOT in this set (handled as a special case to preserve mock for NA agents).
- `dbTrendByBucket` — returns `{ out, qaByBucket, nsatByBucket, nsatInfoByBucket, nsatClaimsByBucket, backlogByBucket, fcrByBucket, callsEffByBucket, productivityByBucket }`:
  - `out` — count/sum/snapshot values (`0` is valid). Includes `Opened Cases`, `Closed Cases`, `Incoming Calls`, `Still Open Cases`, plus six breakdown counts: `Opened Cases Information`, `Opened Cases Complaint`, `Closed Cases Information`, `Closed Cases Complaint` (by `contact_reason_1`), and the raw components `Closed Cases` / `Incoming Calls` (re-read via `_callsEffClosed` / `_callsEffCalls` in tooltip metadata).
  - `xxxByBucket` — avg/index/ratio values; missing bucket → `null` → gap rendered with `connectNulls={true}`.
  - `callsEffByBucket` — `(Closed Cases / Incoming Calls) × 100` per bucket; buckets with 0 calls omitted → gap.
  - `productivityByBucket` — formula varies by `currentUser.subNivel`: Calls = `(CallsEff×0.5)+(QAnorm×0.5)`; Follow up = `(CasesEff×0.5)+(QAnorm×0.5)`; NA → mock data used instead.
- `scopeIsCAC` — gates CAC-only fetches (`Still Open Cases`, `Backlog`).
- `memberBuckets` / `memberValuesForRanking` — per-member recomputation for the management ranking line and sort order.
- Team + Member lines share **one Y axis** — do not reintroduce a right axis.

When adding a new indicator, touch: `indicatorOptions`, `CasesTooltip` (if it needs breakdown rows), `memberBuckets`, `memberValuesForRanking`, `teamValueOf` in `aggregatedTrendData`, and `indicatorSummary` (COUNT_SET / NSAT_SET / PCT_SET classification).

- **`indicatorSummary`** — useMemo that produces per-indicator period totals shown as badges in chart header (upper-right). Up to 3 badges: teal `#0ba0af` (idx 0), purple `#B018D9` (idx 1), orange `#FF7A00` (idx 2). COUNT → sum; NSAT → NPS index; else → average. `null` → badge hidden.
