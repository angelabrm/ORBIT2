# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> For full product requirements, business rules, role hierarchy, and implementation roadmap see [PRD.md](PRD.md).

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Express + Vite HMR) on port 3000
npm run build        # Production build via Vite
npm run preview      # Preview production build
npm run lint         # TypeScript type-check (tsc --noEmit)
npm run clean        # Remove dist/
```

Node.js >= 20.0.0 required.

## Environment

Copy `.env.example` to `.env` and fill in:
- `DATABASE_URL` or `NEON_DB_URL` — Neon PostgreSQL connection string (optional; server degrades gracefully without it)
- `GEMINI_API_KEY` — Google Gemini API key (required for AI features)

## Architecture

**ORBIT** is a role-based KPI dashboard for Alta MX — React 19 frontend served by an Express 4 backend with optional Neon PostgreSQL.

### Data flow

```
server.ts (Express)
  ├── /api/health        → DB connectivity check
  └── /api/opened-cases  → Queries pg pool with varchar date filtering done in JS

src/
  ├── context/AuthContext.tsx   → Global auth, selectedMember, managementTab, dateRange
  ├── services/apiService.ts    → fetchOpenedCases(), checkApiHealth()
  ├── data/mockData.ts          → MOCK_USERS (manual copy of Roster), METRICS_DATA, getFilteredMetrics()
  └── components/
        ├── App.tsx             → ThemeProvider + AuthProvider + Login/Dashboard routing
        ├── Dashboard.tsx       → Role dispatch → correct View component
        ├── Sidebar.tsx         → Date pickers (dayjs), member selection, collapsible
        ├── Header.tsx          → Navigation bar
        └── Views/
              ├── AgentView.tsx           → Agent/Leader view (~1938 lines, most complex)
              ├── ProjectManagerView.tsx  → Manager/Executive operational metrics
              ├── FinancialView.tsx       → Financial KPIs (Executive only)
              └── ExecutiveView.tsx       → Executive global KPIs + multi-client charts (exists but not yet wired into Dashboard routing)
```

### Role system

Roles: `Agent | Leader | Manager | Executive | PM`

- **`Staff`** — previously defined in the type but has no users and no logic. **Eliminated.**
- **`PM`** — exclusive to Pepsico. Manages projects, does not supervise agents. Views not yet defined. Pending implementation.

ServiceDesks: `CAC | Fleet | Premium | Manager | Executive`

**Tab switcher** (`Operational | Administrative | Financial`) is visible to Leaders and above, stored in `AuthContext`. The active tab determines which View renders inside `Dashboard.tsx`.

| Role | Operational | Administrative | Financial |
|------|:-----------:|:--------------:|:---------:|
| Agent | ✅ own view | ✅ own view | ❌ |
| Leader | ✅ team view | ✅ team view | ❌ |
| Manager | ✅ | ✅ | ❌ |
| Executive | ✅ | ✅ | ✅ |
| PM | TBD | TBD | ❌ |

**Drilling navigation:**
- Executive or Manager clicks a bar in the "Average Performance by Department" chart (Operational tab) → renders that department's Leader view.
- Executive, Manager, or Leader selects a name from the Sidebar dropdown → renders that Agent's view with a back button (`AuthContext.selectedMember`).

### Client isolation

- **Executive**: sees all clients (Stellantis + Pepsico).
- **Manager, Leader, Agent**: only see their own client. Stellantis roles have no access to Pepsico data and vice versa.
- **Pepsico**: currently only present in the Executive's Financial tab. All other Pepsico views (PM role, operational data) are pending implementation.

### Data sources

| Data | Current source | Notes |
|------|---------------|-------|
| Roster / User login | `mockData.ts` (manual copy of Google Sheets) | Google Sheets live integration is **pending implementation** |
| Agent metrics | `mockData.ts` with pseudo-random fluctuation by date range | |
| Opened cases | Neon PostgreSQL via `/api/opened-cases` | Functional |
| Financial data | Hardcoded mock in `FinancialView.tsx` | Executive only |

### Styling

- **MUI 9** (`@mui/material`) is the primary component library; use the `sx` prop for one-off styles.
- **Tailwind CSS 4** is available for utility classes via `@tailwindcss/vite`.
- Light/dark mode is toggled at the root `App.tsx` level and threaded down via `ThemeProvider`.
- `AspectRatioWrapper` enforces a 16:9 letterbox layout for the main content area.

### Key libraries

| Purpose | Library |
|---|---|
| Charts | Recharts |
| Date handling | dayjs + `customParseFormat` plugin, `@mui/x-date-pickers` |
| Icons | `@mui/icons-material`, `lucide-react` |
| Animation | `motion` (framer-motion fork) |
| DB client | `pg` (pooled, SSL) |
| AI | `@google/genai` (Gemini) |

### Vite / HMR note

HMR can be disabled by setting `DISABLE_HMR=true` in the environment (used in AI Studio to prevent flickering during agent edits).

## UI Rules

- Nunca permitir que elementos de texto se sobrepongan visualmente
- Todo layout debe usar sistemas de flujo (flex, grid), evitar posicionamiento absoluto para texto
- Usar truncamiento cuando el contenido exceda el contenedor:
  - single line: text-overflow: ellipsis
  - multi-line: line-clamp
- Contenedores deben permitir crecimiento dinámico (no usar alturas fijas con texto variable)
- Siempre validar responsive (mobile, tablet, desktop)
