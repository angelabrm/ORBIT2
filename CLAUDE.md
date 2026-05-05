# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
  ├── data/mockData.ts          → MOCK_USERS, METRICS_DATA, getFilteredMetrics()
  └── components/
        ├── App.tsx             → ThemeProvider + AuthProvider + Login/Dashboard routing
        ├── Dashboard.tsx       → Role dispatch → correct View component
        ├── Sidebar.tsx         → Date pickers (dayjs), member selection, collapsible
        ├── Header.tsx          → Navigation bar
        └── Views/
              ├── AgentView.tsx           → Agent/Staff/Leader (~1938 lines, most complex)
              ├── ProjectManagerView.tsx  → Manager/Executive operational metrics
              ├── FinancialView.tsx       → Financial KPIs
              └── ExecutiveView.tsx       → Executive summary
```

### Role system

Roles: `Agent | Staff | Leader | Manager | Executive`  
ServiceDesks: `CAC | Fleet | Premium | Manager | Executive`

Leaders and above see a **management tab** switcher (`Operational | Administrative | Financial`) stored in `AuthContext`. The active tab determines which View renders inside `Dashboard.tsx`.

Leaders can **drill into a team member** — selecting a member sets `AuthContext.selectedMember`, which renders that member's `AgentView` with a back button.

### Mock vs. live data

The app uses a hybrid approach: `mockData.ts` provides in-memory user profiles and metrics (filtered by the global date range from `AuthContext`), while `/api/opened-cases` hits the real database when configured. Both code paths coexist in the Views.

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
