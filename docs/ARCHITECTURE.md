# ARCHITECTURE — ORBIT

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite |
| Backend | Express 4 |
| Base de datos | Neon PostgreSQL (`pg` con SSL) |
| Despliegue | Vercel (serverless) |
| UI | MUI 9 (`sx` prop) + Tailwind CSS 4 |
| Gráficos | Recharts |
| Fechas | dayjs + `customParseFormat` + `@mui/x-date-pickers` |
| Iconos | `lucide-react` + `@mui/icons-material` |
| Animaciones | `motion` (fork de Framer Motion) |
| IA | Google Gemini (`@google/genai`) |

---

## Dos entry points — mantener sincronizados

| Archivo | Usado por |
|---------|-----------|
| `server.ts` | Dev local — Express + Vite HMR |
| `api/index.ts` | Vercel — misma app como serverless function |

`vercel.json`: `/api/*` → `/api/index.ts`; todo lo demás → `/index.html`. Node pineado a `22.x`.

### Reglas de cold-start para `api/index.ts`

Las violaciones crashean silenciosamente sin log:

- **Nunca** importar `@neondatabase/serverless` a nivel de módulo (eliminado completamente).
- `pg` se importa de forma dinámica dentro de `getPool()`.
- `dayjs/plugin/customParseFormat` **no** se importa; `parseOpenedAt()` usa regex.
- Seguir el mismo patrón lazy para cualquier paquete pesado nuevo.

---

## Sesión y autenticación

**Flujo completo:**
1. `POST /api/login` → verifica RFC contra Roster → emite cookie `orbit_session` (JWT firmado HMAC-SHA256 con `JWT_SECRET`)
2. Todos los endpoints de datos → `requireAuth` verifica cookie → adjunta `req.auth` con payload del token
3. `GET /api/me` → devuelve payload del token (usado por `AuthContext` para restaurar sesión en page refresh)
4. `POST /api/logout` → cookie `Max-Age=0`

**Token payload:** `{ rfc, name, role, client, serviceDesk, compass, callPicker, qa, genesys, subNivel, iat, exp }`

**Cookie:** `orbit_session=<jwt>; HttpOnly; SameSite=Strict; Max-Age=28800; Path=/; Secure` (Secure solo en prod)

**`JWT_SECRET`:** variable de entorno obligatoria. Generar con `openssl rand -base64 32`. Ya configurada en Vercel.

---

## Endpoints API

| Endpoint | Auth | Descripción |
|----------|------|-------------|
| `GET /api/health` | No | DB check |
| `POST /api/login` | No | RFC lookup → emite cookie de sesión |
| `POST /api/logout` | No | Limpia cookie de sesión |
| `GET /api/me` | ✅ | Devuelve usuario del token actual (restauración de sesión) |
| `GET /api/roster` | ✅ | Google Sheets users, 5-min cache; **scope por rol** |
| `GET /api/opened-cases` | ✅ | `Abiertos` — `?user=id1,id2` SQL IN; fecha JS; scope validado |
| `GET /api/closed-cases` | ✅ | `Cerrados` — `?user=` SQL IN; fecha JS; scope validado |
| `GET /api/incoming-calls` | ✅ | `Actividad` + `Rendimiento_Agente`; `?user=` + `?genesys=`; scope validado |
| `GET /api/qa` | ✅ | `QA` + `QA_Premium`; `?user=` SQL IN + fecha SQL (`Marca temporal::date`) |
| `GET /api/nsat` | ✅ | `NSAT` + `NSAT_Premium`; `?user=` SQL IN; scope validado |
| `GET /api/still-open-cases` | ✅ | `Aun_Abiertos` — CAC-wide; SQL date filter + fallback JS |

**Nota de transferencia de red:** siempre pasar `?user=` para evitar fetches de tabla completa — el plan free de Neon tiene 5 GB/mes de transferencia. El único endpoint que puede omitir el filtro de usuario intencionalmente es el fetch de Backlog (necesita datos de equipo completo).

---

## Fechas — contratos entre backend y frontend

- El backend siempre emite `dateStr: "YYYY-MM-DD"` junto a `dateMs` (UTC ms).
- El frontend **siempre** lee `dateStr` para bucketing. `dayjs(dateMs)` desplaza por TZ en usuarios west of UTC.
- `datetime_opened` en `Abiertos` es varchar `M/D/YYYY h:mm A` → filtro en JS.
- `Marca temporal` en tablas QA es timestamp Postgres → filtro en SQL.

---

## Estructura de archivos frontend

```
src/
├── context/AuthContext.tsx        user, users (RFC→User map), selectedMember, managementTab, dateRange
├── services/apiService.ts         fetch helpers (fetchOpenedCases, fetchClosedCases, fetchIncomingCalls, fetchQA, fetchNSAT, fetchStillOpenCases)
├── data/
│   ├── mockData.ts                METRICS_DATA, getFilteredMetrics(), generateHistoricalData()
│   └── pepsicoMockData.ts         RFC-seeded deterministic Pepsico mock
└── components/
    ├── App.tsx
    ├── Dashboard.tsx              Router principal por rol
    ├── Sidebar.tsx                Date pickers, tabs, dropdown de miembros
    ├── Login.tsx
    └── Views/
        ├── AgentView.tsx              Agent + Leader (~3 300 líneas); dueño de DB_INDICATORS
        ├── ProjectManagerView.tsx     Manager + Executive (Stellantis)
        ├── FinancialView.tsx          Executive only
        ├── ExecutiveView.tsx          Existe — pendiente de activar en routing
        ├── PMView.tsx                 Pepsico PM
        └── PepsicoManagerView.tsx     Pepsico Manager
```

---

## Helpers backend (`api/index.ts`)

| Helper | Descripción |
|--------|-------------|
| `getPool()` | Importa `pg` dinámicamente y devuelve pool singleton |
| `parseSourceName(name)` | Parsea `Actividad_YYYY_MM_DD.csv` → `{ dateStr, dateMs }` |
| `parseMarcaTemporal(v)` | Acepta `Date` (Postgres timestamp) o string ISO |
| `parseDateFlex(v)` | Tolera Date, ISO, o `M/D/YYYY`. Default para tablas nuevas |
| `queryQaTable(pool, table, agentCol, userList, startDate?, endDate?)` | SELECT con try/catch (tabla faltante no tumba el endpoint); filtro SQL de fecha sobre `Marca temporal::date` |
| `isErrorCritico(v)` | null / empty / `NA` / `N/A` → sin error crítico |
| `scoreQaRow(row, config)` | Scoring compartido entre QA y QA_Premium; `QaConfig` parametrizable |
| `buildNsatIndex(rows)` | Fórmula NPS: `((promotores − detractores) / total) × 100`. Promotores 9-10, detractores 1-6 |

---

## Convenciones de UI / componentes

- **KPI cards** → `ManagementIndicator` (definido en `AgentView.tsx`; `PMView.tsx` tiene copia más estrecha).
- **Charts** → `CartesianGrid vertical={false}`, ejes en color primario, `strokeWidth={4}`, puntos hollow.
- **Multi-indicador** → hasta 3 simultáneos. `yAxisId` 0 → eje izquierdo, 1 y 2 → eje derecho compartido. Colores: teal `#0ba0af` / purple `#B018D9` / orange `#FF7A00`.
- **connectNulls** → activado para indicadores con posibles buckets vacíos (QA, NSAT, FCR, Backlog, Calls Efficiency).
- **HMR** → `DISABLE_HMR=true` en entornos que flickerean.

---

## Rango de fechas default

- Ventana visible: `dayjs().subtract(1, 'month').startOf('month')` → `dayjs().endOf('month')`.
- Backlog extiende su propio fetch `startDate − 3 meses` para tener los 3 meses de denominador sin ampliar la ventana visible.
