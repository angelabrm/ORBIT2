# Product Requirements Document (PRD)
**Producto:** ORBIT — Dashboard Corporativo  
**Empresa:** Alta MX  
**Fecha:** 2026-05-06  
**Estado:** En definición

---

## 1. Objetivo

Diseñar y documentar el dashboard corporativo ORBIT para Alta MX, que permite a los usuarios visualizar información operativa y financiera de acuerdo con su rol y cliente asignado. El acceso y las visualizaciones están determinadas por la jerarquía de roles y la información contenida en el Roster (Google Sheets).

---

## 2. Contexto de negocio

**Compañía:** Alta MX  

**Clientes actuales:**

| Cliente | Departments | Notas |
|---------|------------|-------|
| Stellantis | CAC, Fleet, Premium | Completamente implementado |
| Pepsico | Pepsico (department único) | PM view, Manager view y Financial implementados |

**Escalabilidad:** La arquitectura está diseñada para incorporar nuevos clientes y departments en el futuro sin rediseñar el modelo de acceso.

---

## 3. Fuente de datos — Roster

**Fuente objetivo:** Google Sheets — [Roster Alta MX](https://docs.google.com/spreadsheets/d/122mX8Jh0w5HP7JwW21mKHTDN2h0YhQuQYHhumHAcm4s/edit?gid=0#gid=0)

**Columnas relevantes:**

| Columna | Descripción |
|---------|-------------|
| Documento | RFC del usuario (normativa mexicana) — usado como identificador de login |
| Nombre | Nombre completo del usuario |
| Client | Cliente al que pertenece el usuario |
| Nivel | Rol del usuario: Agent, Leader, Manager, Executive, PM |
| MESA_ | Department al que pertenece el usuario dentro del cliente |

**Estado actual:** La integración en tiempo real con Google Sheets está **implementada**. El backend (`server.ts` en local, `api/index.ts` en Vercel) descarga el Roster directamente desde la URL pública CSV de Google Sheets (`gviz/tq?tqx=out:csv`) con un caché en memoria de 5 minutos. No requiere credenciales — la hoja está compartida públicamente. El frontend consume:

- `GET /api/roster` — lista completa de usuarios para hidratar `AuthContext.users`
- `POST /api/login` — recibe `{ rfc }`, devuelve el usuario o 404

Los datos de usuario ya **no** existen en `mockData.ts`. Si la hoja se vuelve privada, se debe migrar a un service account de Google Cloud y actualizar `fetchRosterFromSheets()` en ambos archivos del backend.

---

## 4. Jerarquía de roles

| Rol | Cliente | Descripción |
|-----|---------|-------------|
| **Executive** | Todos | Acceso global a todos los clientes y todas las vistas |
| **Manager** | Su cliente asignado | Visibilidad operativa de su cliente completo |
| **Leader** | Su cliente asignado | Visibilidad del department al que pertenece |
| **Agent** | Su cliente asignado | Visibilidad únicamente de su propia información |
| **PM** | Pepsico (exclusivo) | Gestión de campañas publicitarias; no supervisa agentes |

---

## 5. Reglas de negocio

### 5.1 Control de acceso por rol

- El dashboard carga las visualizaciones de acuerdo con el rol y cliente asignado en el Roster.
- La información se filtra automáticamente según el nivel jerárquico:
  - **Executive** → vista global (todos los clientes).
  - **Manager** → vista por cliente (solo su cliente).
  - **Leader** → vista por department (solo su department).
  - **Agent** → vista individual (solo sus propios datos).
  - **PM** → vista individual de campañas (exclusivo Pepsico, sin acceso a datos de Stellantis).

### 5.2 Aislamiento por cliente

- El único rol con acceso a información de todos los clientes es el **Executive**.
- Los roles Manager, Leader y Agent de Stellantis no tienen acceso a información de Pepsico.
- Los roles de Pepsico no tienen acceso a información de Stellantis.
- Las vistas actuales de Stellantis permanecen tal como están.

### 5.3 Pestañas de gestión

Las pestañas **Operational**, **Administrative** y **Financial** son visibles para Leader y roles superiores.

| Rol | Operational | Administrative | Financial |
|-----|:-----------:|:--------------:|:---------:|
| Agent | ✅ | ✅ | ❌ |
| Leader | ✅ | ✅ | ❌ |
| Manager | ✅ | ✅ | ❌ |
| Executive | ✅ | ✅ | ✅ |
| PM | Por definir | Por definir | ❌ |

La pestaña **Financial** es exclusiva del Executive y solo es accesible cuando no hay un miembro seleccionado en la vista de detalle.

### 5.4 Navegación y drilling entre roles

| Acción | Resultado |
|--------|-----------|
| Executive o Manager hace clic en una barra del gráfico "Average Performance by Department" (pestaña Operational) | Renderiza la vista del Leader de ese Department |
| Executive, Manager o Leader selecciona un nombre en el dropdown del Sidebar | Renderiza la vista individual del Agent seleccionado con botón de regreso |
| Se presiona el botón de regreso en la vista de detalle | Restaura la pestaña activa previa |

### 5.5 Autenticación

- El acceso al dashboard se realiza mediante RFC.
- El RFC se valida contra el Roster. Si existe, se carga la vista correspondiente al rol del usuario.
- Al cerrar sesión, el estado se limpia completamente (usuario, miembro seleccionado, pestaña activa).

---

## 6. Vistas por rol

### Agent
- Vista individual con sus propios indicadores: QA, casos abiertos/cerrados, NSAT, SLA, llamadas, FCR, adherencia, home office, entre otros.
- Sin acceso a información de otros usuarios.

### Leader
- Ve la vista de su team en las pestañas Operational y Administrative.
- Puede hacer drilling hacia la vista individual de cualquier miembro de su equipo via dropdown en el Sidebar.

### Manager
- Pestaña Operational: gráfico "Average Performance by Department" con barras por department. Clic en una barra lleva a la vista del Leader de ese department.
- Pestaña Administrative: vista de equipo agregada.
- Sin acceso a la pestaña Financial.

### Executive
- Pestaña Operational y Administrative: igual que Manager pero con visibilidad global.
- Pestaña Financial: KPIs financieros por cliente y department (`FinancialView`).
- Vista propia global (`ExecutiveView`): KPIs macro (Core Clients, Service Desks, Growth QoQ, Revenue Projection), gráfico de distribución por cliente, índice de performance financiero. **Pendiente de activar en el routing de Dashboard.**

### PM *(Pepsico exclusivo)*

Ver sección **10. Pepsico — Rol PM** para la definición completa.

---

## 7. Framework y arquitectura técnica

### Frontend

**React 19** con **Vite** como bundler y servidor de desarrollo. La arquitectura de componentes es modular — cada vista, tarjeta de métricas y elemento del menú es independiente y renderiza condicionalmente según el rol del usuario autenticado.

El estado global (usuario autenticado, miembro seleccionado, pestaña activa, rango de fechas) se gestiona mediante **React Context API** (`AuthContext.tsx`) y se propaga a todos los subcomponentes sin prop drilling.

**Sistema de diseño:** **MUI 9** (`@mui/material`) es la biblioteca de componentes principal. Se usa el prop `sx` para estilos puntuales y `ThemeProvider` para la gestión centralizada de temas (claro / oscuro). **Tailwind CSS 4** está disponible como capa utilitaria complementaria vía `@tailwindcss/vite`.

| Propósito | Librería |
|-----------|----------|
| Componentes UI | MUI 9 (`@mui/material`) |
| Gráficos | Recharts (líneas, barras, áreas) |
| Manejo de fechas | dayjs + `customParseFormat` + `@mui/x-date-pickers` |
| Iconos | `@mui/icons-material`, `lucide-react` |
| Animaciones | `motion` (fork de Framer Motion) |

### Backend

**Express 4** sirve la SPA en producción y expone endpoints REST. En desarrollo, Vite corre como middleware sobre Express para habilitar HMR. HMR puede desactivarse con `DISABLE_HMR=true`.

| Endpoint | Función |
|----------|---------|
| `GET /api/health` | Verifica conectividad con la base de datos |
| `GET /api/opened-cases` | Consulta casos abiertos desde PostgreSQL, con filtrado por `case_owner` y rango de fechas |

### Base de datos

**Neon PostgreSQL** accedido mediante el cliente `pg` con pool de conexiones SSL. Se configura via `DATABASE_URL` o `NEON_DB_URL`. El servidor degrada de forma segura si no hay conexión configurada.

### Inteligencia Artificial

**Google Gemini** (`@google/genai`) para funcionalidades de IA. Requiere `GEMINI_API_KEY` en el entorno.

### Despliegue

La aplicación está preparada para despliegue en **Vercel** (`vercel.json` presente en el repositorio). Requiere Node.js >= 20.0.0.

---

## 8. Estado de implementación

### Implementado y funcional

- Roles Agent, Leader, Manager, Executive, PM con sus vistas correspondientes
- Tabs Operational / Administrative / Financial con control de acceso por rol
- Drilling: clic en barra de gráfico → vista de Leader; dropdown → vista de Agent/PM
- **Integración en tiempo real con Google Sheets** vía CSV público (`/api/roster`, `/api/login`) con caché de 5 minutos
- Sidebar oculta tabs de management y dropdown de miembros cuando el usuario es PM; Pepsico Manager no ve tabs Operational/Administrative y su dropdown muestra solo miembros Pepsico
- Cliente Stellantis con departments CAC, Fleet, Premium
- **Vista PM** con KPIs (Performance + Ranking con cuartil), gráfico de tendencias, Gantt jerárquico y gráficos auxiliares; acepta prop `member` para "ver como" desde el Manager
- **Vista Manager Pepsico** (`PepsicoManagerView.tsx`) con KPI "Avg. Team Performance", ranking interactivo Q1–Q4, gráfico de tendencias (Team Average + overlay individual), Pie por fase, Gantt y Bar por Brand; selección en ranking filtra Pie/Gantt/Bar al PM seleccionado
- Capa de datos mock Pepsico centralizada en `pepsicoMockData.ts` — seeded por RFC, garantiza consistencia entre PMView y PepsicoManagerView
- Pestaña Financial del Executive con datos de Stellantis y Pepsico
- Backend Express con endpoint de casos abiertos (Neon PostgreSQL)
- **Migración progresiva mock → Neon (Stellantis):** seis indicadores del line chart de `AgentView` ya provienen de Neon — `Opened Cases`, `Closed Cases`, `Closed Cases Rate`, `Incoming Calls`, `QA`, `NSAT`. Ver §11 para fórmulas, joins y formato por indicador
- Despliegue en Vercel con `api/index.ts` como serverless function en `orbit-2-weld.vercel.app`. `engines.node` pineado a `22.x`, `@neondatabase/serverless` eliminado del path de cold start, `pg` y `dayjs` cargados lazy desde dentro de los handlers
- Rango de fechas default del dashboard: últimos 12 meses rolling (`dayjs().subtract(12, 'month').startOf('month')` → `dayjs()`), garantiza que los datos reales de BD entren en ventana al cargar
- Aislamiento de sesión al cerrar

### Pendiente de implementar

| Item | Descripción |
|------|-------------|
| `ExecutiveView` activa | Conectar `ExecutiveView.tsx` al routing de `Dashboard.tsx` |
| Fuente de datos campañas Pepsico | Reemplazar el mock de campañas con la fuente real (fases, tasks, fechas, estados) |
| Control de acceso backend | Validación de rol/cliente en endpoints de la API |
| Migración mock → Neon (siguientes indicadores) | Faltan por migrar al line chart: `Performance`, `Productivity`, `Ranking`, `Bonus`, `NSAT Information`, `NSAT Claims`, `Outgoing Calls`, `% First Contact Resolution`, `Backlog Team`. Misma técnica: agregar al `Set DB_INDICATORS` en `AgentView.tsx` + extender `dbTrendByBucket`. Los KPI cards superiores también siguen en mock |
| Mapeo completo de joins en Roster | Sigue habiendo filas del Google Sheet con nombre real en `Compass` / `CallPicker` / `QA` en vez del identificador `User X`. Esos usuarios reciben 0 datos del indicador correspondiente hasta que se les complete el mapeo |
| Bug `ProjectManagerView.tsx:93` | Filtra cases por `rfcs.includes(c.case_owner)` pero `case_owner` es Compass, no RFC. Mismo bug ya corregido en `AgentView.tsx` |
| Day-inclusive margin en `/api/opened-cases` | El backend agrega ±1 día al filtro de fechas (línea `t < start - 86400000`). Si el usuario pone start=end=15-Abr-2026 devuelve casos del 14, 15 y 16. Útil como tolerancia de timezone pero impreciso |

---

## 9. Alcance del PRD

Este PRD cubre:
- Definición de roles y jerarquía de acceso
- Estructura de clientes y departments
- Reglas de negocio para filtrado y visualización
- Arquitectura técnica del frontend y backend
- Estado actual del proyecto y roadmap de pendientes

No cubre:
- Lógica de cálculo de KPIs individuales
- Diseño visual específico de componentes
- Métricas detalladas del rol PM (% cumplimiento, estados de fase — por definir)
- Fuente de datos de campañas Pepsico (por definir)
- Vistas operativas del cliente Pepsico más allá del Financial y PM

---

## 10. Pepsico — Rol PM: Gestión de Campañas Publicitarias

### Descripción del rol

Los PM (Project Managers) de Pepsico gestionan campañas publicitarias por marca. Su vista en el dashboard refleja su rendimiento individual sobre el portafolio de campañas que tienen asignadas. No supervisan agentes ni tienen acceso a datos de Stellantis.

### Categorías y Brands

Las campañas se organizan en dos categorías. Cada campaña pertenece a una Brand dentro de su categoría:

**Biscuit**
CHOKIS, CLASICA GAMESA, CRACKETS, EMPERADOR, GAMESA, GIRO, HABANERAS, MARIAS, MULTIMARCA/PROMO, QUAKER, SALADITAS, SONRICS, EQUITY

**Savory**
CHEETOS, DORITOS, FLAMINHOT, INNOVACIÓN, JOY, KACANG, MAFER, MIXES, MULTIMARCA/PROMOS, PAKETAXO, PAPAS SABRITAS, RUFFLES, TOSTITOS, SABRITAS, AFFORDABLE

### Nomenclatura de campañas

Las campañas siguen la convención:
`Brand_NombreCampaña_Año_FechaInicio_FechaFin_Categoría_Sufijo`

Ejemplos:
- `Chokis_Switch_25_Oct16_Dic10_B_PMF`
- `Doritos_Dinamita_25_Sep08_Oct24_S_PMF`
- `Emperador_Rafiki_26_Oct10_Jul31_B_PMF`

### Fases de campaña

Todas las campañas siguen el mismo ciclo de 8 fases secuenciales:

| # | Fase |
|---|------|
| 01 | Brief |
| 02 | Big Idea |
| 03 | Media Plan |
| 04 | Content Grid |
| 05 | Content Production |
| 06 | Go Live |
| 07 | Final Report |
| 08 | Closing Campaign |

Cada fase puede contener **Tasks** (subtareas). Las Tasks son el nivel más granular de la jerarquía pero no se representan en el Gantt.

### Visualización — Gráfico de Gantt jerárquico

El Gantt funciona como una matriz expandible (similar a Power BI), con 4 niveles de jerarquía:

| Nivel | Filas | Barra en Gantt |
|-------|-------|----------------|
| **Brand** | Una fila por Brand | No muestra barra |
| **Campaña** | Una fila por nombre de campaña | Barra única de inicio a fin de la campaña completa |
| **Fase** | Una fila por fase (01–08) | Barra por duración de cada fase |
| **Task** | Una fila por tarea | No muestra barra en el Gantt |

Comportamiento de expansión:
- Contraído a **Brand**: se listan las Brands sin visualización de tiempo
- Expandido a **Campaña**: se muestra una barra por campaña (duración total)
- Expandido a **Fase**: se despliegan las 8 fases con su duración individual en el Gantt
- Expandido a **Task**: se listan las tareas de cada fase sin representación gráfica

### Layout de la vista PM (`PMView.tsx`)

Tres niveles horizontales apilados verticalmente:

| Nivel | Altura | Contenido |
|-------|--------|-----------|
| 1 | 24% | **My Performance** (50%) + **My Ranking** (50%) — ambos con el mismo `ManagementIndicator` que la vista Agent. My Ranking incluye la franja superior con formato condicional Q1–Q4 ("YOU ARE POSITIONED IN PERFORMANCE QUARTILE QX"). |
| 2 | 30% | **Gráfico de líneas de tendencias** (50%) con dropdown multi-indicador y selector de jerarquía temporal (Days / Weeks / Months / Quarters / Years); **Pie chart** *Campaign Distribution by Status* (50%). |
| 3 | resto | Strip de filtros (tile **Total Campaigns** + Brand + Category + Status), debajo: **Gantt jerárquico** (50%) | **Campaigns by Brand** bar chart (50%). Gantt y Bar comparten la misma altura. |

**Eje X del gráfico de líneas:** se construye dinámicamente a partir de `startDate`/`endDate` del Sidebar y la jerarquía temporal seleccionada. Cambiar el rango en el menú lateral repinta el chart.

**Indicadores del gráfico de líneas:** On Time Rate, QA Rate, Performance. Hasta dos seleccionables simultáneamente. Performance se calcula como `0.5 × On Time Rate + 0.5 × QA Rate`.

**Pie chart:** los 8 segmentos corresponden a las 8 fases (01 Brief … 08 Closing Campaign). Cada campaña se cuenta en su **fase actual** (la primera fase no Completed, o la última fase si todas están completas). No se filtra por los segmenters — siempre muestra la distribución global.

**Tile Total Campaigns:** indicador prominente con borde teal y número grande monospace. Refleja en tiempo real los filtros Brand + Category + Status. Cuando hay filtro activo muestra `N / total`.

**Filtros (Brand + Category + Status):** afectan al tile Total, al Gantt y al Bar chart. El Status filter usa la fase actual (misma definición que el pie). El menú de Status muestra un punto de color por fase para escaneo visual rápido.

**Sidebar:** para usuarios con rol PM se ocultan los botones de Operational / Administrative / Financial y el dropdown de miembros del equipo. Solo se conservan los date pickers (que ahora alimentan el eje X del gráfico de líneas) y el toggle de modo claro/oscuro.

### Métricas del dashboard PM (estado actual)

| Métrica | Estado |
|---------|--------|
| My Performance — `(0.5 × On Time Rate) + (0.5 × QA Rate)` | Implementado con datos mock |
| My Ranking (TOP X% + cuartil Q1–Q4) | Implementado con datos mock |
| Total Campaigns (tile interactivo) | Implementado, reactivo a Brand/Category/Status |
| Campaign Distribution by Status (Pie por fase actual) | Implementado |
| Campaigns by Brand (Bar) | Implementado |
| Tendencias temporales (On Time Rate, QA Rate, Performance) | Implementado con datos mock generados por seed determinista |
| Gantt jerárquico Brand → Campaña → Fase → Task | Implementado, expandible por fila |

Pendiente: reemplazar el mock por datos reales y validar las fórmulas finales de Performance, Ranking y QA Rate con el equipo Pepsico.

### Vista Manager Pepsico (`PepsicoManagerView.tsx`) — implementada

**Layout** (tres filas verticales):

| Fila | Altura | Contenido |
|------|--------|-----------|
| 1 | 30% | KPI "Avg. Team Performance" (30%) + Ranking de equipo Q1–Q4 (70%) |
| 2 | 28% | Gráfico de líneas de tendencias (60%) + Pie chart Campaign Distribution by Status (40%) |
| 3 | resto | Filtros + Gantt (50%) + Campaigns by Brand bar chart (50%) |

**Ranking de equipo:** lista ordenada de PMs con su Performance individual y cuartil (Q1–Q4 por posición relativa). Clic en un PM filtra Pie, Gantt y Bar a solo ese PM; segundo clic restaura vista de equipo completo.

**Gráfico de líneas:** muestra siempre "Team Average". Si hay un PM seleccionado, agrega una línea punteada con sus datos individuales. Jerarquía temporal por defecto: Days.

**Datos:** compartidos con `PMView.tsx` vía `pepsicoMockData.ts` — los valores de Performance del ranking son idénticos a los que ve cada PM en su propio dashboard.

**Sidebar:** sin tabs Operational/Administrative; dropdown muestra solo miembros Pepsico (todos los roles). Seleccionar un miembro activa el banner "You're seeing X Dashboard" y renderiza `PMView` con el RFC del PM seleccionado.

### Fuente de datos

Los datos de campañas (nombres, fechas, fases, tasks, estados) provienen de una fuente externa aún por definir, separada del Roster de Google Sheets. La implementación actual usa `pepsicoMockData.ts` (mock seeded por RFC, compartido entre PMView y PepsicoManagerView).

### Jerarquía de acceso Pepsico

| Rol | Alcance |
|-----|---------|
| PM | Ve únicamente sus propias campañas y métricas |
| Manager | Ve rendimiento agregado del equipo; puede navegar a la vista individual de cualquier PM vía dropdown del Sidebar |

---

## 11. Migración mock → Neon: estado por indicador (Stellantis)

El line chart de `AgentView` lista los indicadores en dos grupos: **KPIs** (métricas agregadas calculadas a partir de varios indicadores) e **Indicators** (métricas que vienen directo de una tabla fuente). El extension point en código es el `Set DB_INDICATORS` en `AgentView.tsx`; agregar un indicador ahí y extender `dbTrendByBucket` lo "promueve" de mock a Neon.

### Indicadores ya en Neon

| Indicador | Tabla fuente | Join | Agregación por bucket | Display |
|---|---|---|---|---|
| `Opened Cases` | `Abiertos` | `case_owner` ↔ `Roster.Compass` | COUNT de filas con `datetime_opened` en el bucket | entero |
| `Closed Cases` | `Abiertos` | `case_owner` ↔ `Roster.Compass` | COUNT de filas con `datetime_closed` en el bucket | entero |
| `Closed Cases Rate` | `Abiertos` | `case_owner` ↔ `Roster.Compass` | (Closed/Opened) × 100 por bucket | decimal |
| `Incoming Calls` | `Actividad` | `User` ↔ `Roster.CallPicker` | SUM de `Answered Calls` (no count). Fecha viene de parsear `Source.Name` con formato `Actividad_YYYY_MM_DD.csv` | entero |
| `QA` | `QA` + `QA_Premium` (merged) | `Agente` (QA) o `Agent` (QA_Premium) ↔ `Roster.QA` | AVG de score por fila. Score = suma ponderada de 10 criterios (5 × 16 pts soft skills + 5 × 4 pts process) con penalty all-or-nothing por `Error Crítico`/`Critical Error`. Premium tiene reglas levemente distintas: textos en inglés, "NA" cuenta como crédito completo en criterios. Filas sin evaluaciones → bucket ausente (gap en línea, conectado por `connectNulls`) | porcentaje `92.8%` |
| `NSAT` | `NSAT` | `case_owner` ↔ `Roster.Compass` | NPS-style Index: por cada Q (Q1=`agent_satisfaction_score`, Q2=`effort_score`, Q3=`overall_satisfaction_score`), `((promotores − detractores) / total) × 100`. Promotores = 9–10, detractores = 1–6, pasivos = 7–8. Index = promedio de las 3 Qs. Buckets sin respuestas → gap conectado | entero `[-100, +100]` (sin `%`) |

### Indicadores aún en mock (por migrar)

`Performance`, `Productivity`, `Ranking`, `Bonus` (todos KPIs derivados — necesitan que los indicadores base estén en Neon primero), `NSAT Information`, `NSAT Claims`, `Outgoing Calls`, `% First Contact Resolution`, `Backlog Team`.

### Patrones técnicos del backend

| Helper | Uso |
|---|---|
| `parseSourceName` | Parsea `Actividad_YYYY_MM_DD.csv` → `{ dateStr, dateMs }` |
| `parseMarcaTemporal` | Acepta `Date` (timestamp Postgres) o string ISO de QA |
| `parseDateFlex` | Tolera Date, ISO, o `M/D/YYYY` (Abiertos varchar). Default para nuevas tablas |
| `queryQaTable` | Wrappea SELECTs con try/catch para que una tabla faltante no tumbe el endpoint completo |
| `isErrorCritico` | Compartido entre QA y QA_Premium: null/empty/`NA`/`N/A` → sin error |
| `scoreQaRow` | Compartido entre las dos tablas QA, con `QaConfig` parametrizable (string de "thumbs up", regla NA) |

### Patrones técnicos del frontend (`AgentView.tsx`)

- `dbTrendByBucket` retorna `{ out, qaByBucket, nsatByBucket }`:
  - `out` — buckets con valores tipo COUNT (0 es legítimo)
  - `qaByBucket`, `nsatByBucket` — buckets con valores tipo AVG/INDEX (bucket ausente = sin datos → null en el chart)
- En el render del `<Line>`: `connectNulls={indicator === 'QA' || indicator === 'NSAT'}` para que la línea atraviese los gaps
- Tooltip y `LabelList` aplican formato por indicador: `% suffix` para QA, entero raw para NSAT, defaults para counts

### Ventana temporal

Default startDate = `dayjs().subtract(12, 'month').startOf('month')`. Captura el año más reciente de datos automáticamente; ajustable desde el Sidebar.
