# PRD — Pepsico: Rol PM y Manager

---

## Rol PM — Gestión de Campañas Publicitarias

Los PM gestionan campañas por marca. Su vista refleja rendimiento individual sobre su portafolio. No supervisan agentes ni acceden a datos Stellantis.

### Categorías y Brands

**Biscuit:** CHOKIS, CLASICA GAMESA, CRACKETS, EMPERADOR, GAMESA, GIRO, HABANERAS, MARIAS, MULTIMARCA/PROMO, QUAKER, SALADITAS, SONRICS, EQUITY

**Savory:** CHEETOS, DORITOS, FLAMINHOT, INNOVACIÓN, JOY, KACANG, MAFER, MIXES, MULTIMARCA/PROMOS, PAKETAXO, PAPAS SABRITAS, RUFFLES, TOSTITOS, SABRITAS, AFFORDABLE

### Nomenclatura de campañas

`Brand_NombreCampaña_Año_FechaInicio_FechaFin_Categoría_Sufijo`

Ejemplos:
- `Chokis_Switch_25_Oct16_Dic10_B_PMF`
- `Doritos_Dinamita_25_Sep08_Oct24_S_PMF`

### Fases de campaña (8 fases secuenciales)

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

Cada fase puede contener Tasks (nivel más granular; no se representan en el Gantt).

**Fase actual** de una campaña = primera fase no Completed, o la última si todas están completas.

---

## Vista PM (`PMView.tsx`)

### Layout (3 filas verticales)

| Fila | Altura | Contenido |
|------|--------|-----------|
| 1 | 24% | **My Performance** (50%) + **My Ranking** (50%) con formato Q1–Q4 |
| 2 | 30% | **Line chart de tendencias** (50%) + **Pie chart** Campaign Distribution by Status (50%) |
| 3 | resto | Strip de filtros + **Gantt** (50%) \| **Campaigns by Brand** bar chart (50%) |

### Componentes detallados

**Line chart:** On Time Rate, QA Rate, Performance. Hasta 2 indicadores simultáneos. Performance = `0.5 × On Time Rate + 0.5 × QA Rate`. Eje X construido desde `startDate`/`endDate` del Sidebar + jerarquía temporal (Days / Weeks / Months / Quarters / Years).

**Pie chart:** 8 segmentos = 8 fases. Cada campaña se cuenta en su fase actual. Siempre muestra distribución global (no afectado por filtros de Brand/Category/Status).

**Tile Total Campaigns:** número grande monospace con borde teal. Refleja filtros Brand + Category + Status en tiempo real. Con filtro activo: `N / total`.

**Filtros:** Brand + Category + Status → afectan tile Total, Gantt y Bar chart. Status usa fase actual; el menú muestra punto de color por fase.

**Sidebar PM:** solo date pickers + toggle claro/oscuro. Sin tabs Operational/Administrative/Financial ni dropdown de miembros.

**Gantt jerárquico (4 niveles expandibles):**

| Nivel | Barra |
|-------|-------|
| Brand | Sin barra |
| Campaña | Barra de inicio a fin de campaña |
| Fase | Barra por duración de fase |
| Task | Sin barra |

### Métricas (estado actual)

| Métrica | Estado |
|---------|--------|
| My Performance `(0.5 × On Time Rate) + (0.5 × QA Rate)` | Mock |
| My Ranking TOP X% + cuartil Q1–Q4 | Mock |
| Total Campaigns (tile) | Implementado, reactivo |
| Campaign Distribution by Status (Pie) | Implementado |
| Campaigns by Brand (Bar) | Implementado |
| Tendencias (On Time Rate, QA Rate, Performance) | Mock determinista (seeded por RFC) |
| Gantt Brand → Campaña → Fase → Task | Implementado, expandible |

Pendiente: reemplazar mock por datos reales; validar fórmulas con equipo Pepsico.

---

## Vista Manager Pepsico (`PepsicoManagerView.tsx`)

### Layout (3 filas verticales)

| Fila | Altura | Contenido |
|------|--------|-----------|
| 1 | 30% | KPI "Avg. Team Performance" (30%) + Ranking Q1–Q4 (70%) |
| 2 | 28% | Line chart tendencias (60%) + Pie chart (40%) |
| 3 | resto | Filtros + Gantt (50%) + Bar por Brand (50%) |

**Ranking:** lista de PMs por Performance individual. Clic → filtra Pie, Gantt y Bar a ese PM. Segundo clic → restaura vista de equipo.

**Line chart:** siempre muestra "Team Average". Si hay PM seleccionado, agrega línea punteada con sus datos individuales.

**Datos:** compartidos con `PMView.tsx` vía `pepsicoMockData.ts` (seeded por RFC, consistencia garantizada entre vistas).

**Sidebar:** sin tabs Operational/Administrative; dropdown muestra solo miembros Pepsico. Seleccionar miembro activa banner "You're seeing X Dashboard" y renderiza `PMView` con ese RFC.

### Jerarquía de acceso Pepsico

| Rol | Alcance |
|-----|---------|
| PM | Solo sus campañas y métricas |
| Manager | Rendimiento agregado del equipo; puede navegar a vista individual de cualquier PM |

### Fuente de datos

Campañas (nombres, fechas, fases, tasks, estados) → fuente externa **por definir**. Hoy usa `pepsicoMockData.ts`.
