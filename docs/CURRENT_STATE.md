# CURRENT STATE — ORBIT

Última actualización: 2026-05-27

---

## Implementado y funcional

- Roles Agent, Leader, Manager, Executive, PM con sus vistas correspondientes
- Tabs Operational / Administrative / Financial con control de acceso por rol
- Drilling: clic en barra → vista Leader; dropdown Sidebar → vista Agent/PM con botón de regreso
- Integración Google Sheets en tiempo real (`/api/roster`, `/api/login`), caché 5 min, sin credenciales
- Sidebar adaptado por rol (PM: sin tabs ni dropdown; Pepsico Manager: dropdown solo miembros Pepsico)
- Clientes Stellantis (CAC, Fleet, Premium) y Pepsico (PM + Manager views)
- Vista PM: KPIs, line chart, Pie, Gantt jerárquico, filtros Brand/Category/Status
- Vista Manager Pepsico: ranking Q1-Q4, line chart Team Average + individual overlay, Pie, Gantt, Bar
- Mock Pepsico centralizado en `pepsicoMockData.ts` (seeded por RFC, consistente entre vistas)
- Financial Executive con datos Stellantis y Pepsico
- Despliegue Vercel (`orbit-2-weld.vercel.app`), Node 22.x, cold-start seguro (pg lazy, sin @neondatabase/serverless)
- Aislamiento de sesión al cerrar
- SubNivel badge en Header y banner de miembro (solo CAC con SubNivel ≠ NA)
- Selección hasta 3 indicadores simultáneos en line chart (eje Y izq. / der. compartido)
- Badges de resumen en header del chart: COUNT→suma, NSAT→NPS index, PCT→promedio
- Tooltip con desglose `CasesTooltip`: sub-filas para Opened/Closed Cases, Calls Efficiency, Productivity

### Migración mock → Neon (Stellantis) — indicadores en producción

| Indicador | Tabla(s) fuente | Join key | Agregación | Display |
|-----------|----------------|----------|------------|---------|
| `Opened Cases` | `Abiertos` | `case_owner` ↔ `Roster.Compass` | COUNT por bucket | entero |
| `Closed Cases` | `Cerrados` | `case_closed_by` ↔ `Roster.Compass` | COUNT por bucket | entero |
| `Closed Cases Rate` | `Abiertos` + `Cerrados` | Compass | (Closed/Opened) × 100 | decimal |
| `Incoming Calls` | `Actividad` + `Rendimiento_Agente` | `User` ↔ CallPicker; `nombre_del_agente` ↔ Genesys | SUM de ambos | entero |
| `QA` | `QA` + `QA_Premium` | `Agente`/`Agent` ↔ `Roster.QA` | AVG score (10 criterios ponderados; penalty Error Crítico) | `92.8%` |
| `NSAT` | `NSAT` + `NSAT_Premium` | `case_owner`/`agent_full_name` ↔ Compass | NPS Index: avg de Q1/Q2/Q3 | `[-100, +100]` |
| `NSAT Information` | NSAT + NSAT_Premium | Compass | NPS filtrado a `contact_reason_1 = "Information & Assistance requests"` | `[-100, +100]` |
| `NSAT Claims` | NSAT + NSAT_Premium | Compass | NPS filtrado a `contact_reason_1 = "Complaint"` | `[-100, +100]` |
| `Still Open Cases` ⚙️ CAC | `Aun_Abiertos` | sin join (tabla CAC-wide) | Snapshot del último día con data en el bucket | entero |
| `Backlog` ⚙️ CAC | `Aun_Abiertos` + `Abiertos` | sin join usuario | (Still Open último día bucket) / avg(Opened 3 meses prior) × 100 | `%` entero |
| `% First Contact Resolution` | `Cerrados` | Compass | % casos cerrados donde `openedDateStr === dateStr` | decimal `%` |
| `Calls Efficiency` | `Cerrados` + `Actividad`/`Rendimiento_Agente` | Compass + CallPicker/Genesys | (Closed / Incoming Calls) × 100 por bucket | decimal `%` |

#### Indicador `Productivity` — mixto (Neon parcial / mock por SubNivel)

No está en `DB_INDICATORS` — caso especial en `trendData` y `aggregatedTrendData`.

| SubNivel | Fórmula |
|----------|---------|
| `Calls` | `(CallsEff × 0.5) + (QAnorm × 0.5)` donde `CallsEff = min(100, Closed / (0.7 × Calls) × 100)`, `QAnorm = min(100, QA / 80 × 100)` |
| `Follow up` | `(CasesEff × 0.5) + (QAnorm × 0.5)` donde `CasesEff = min(100, nonFCR_closed / 5 × 100)` |
| `NA` | Usa `generateHistoricalData` (mock) |

`nonFCR_closed` = casos en `Cerrados` donde `openedDateStr !== dateStr`.

---

## Puntos clave de implementación en `AgentView.tsx`

- **`DB_INDICATORS`** (Set) — agregar nombre de indicador aquí lo promueve de mock a Neon.
- **`dbTrendByBucket`** — retorna `{ out, qaByBucket, nsatByBucket, nsatInfoByBucket, nsatClaimsByBucket, backlogByBucket, fcrByBucket, callsEffByBucket, productivityByBucket }`.
  - `out`: COUNT/SUM/SNAPSHOT (0 válido). Incluye 6 contadores de desglose por `contact_reason_1`.
  - `xxxByBucket`: AVG/INDEX/RATIO — bucket ausente → `null` → gap con `connectNulls`.
- **`scopeIsCAC`** — gate para fetches team-wide (Still Open Cases, Backlog).
- **`memberBuckets`** — recomputa el indicador filtrando arrays por join keys del miembro en ranking.
- **`memberValuesForRanking`** — valor único por miembro para ordenar el ranking.
- **`indicatorSummary`** — badges en header: COUNT_SET→suma, NSAT_SET→NPS index, PCT_SET→promedio.
- Team + Member comparten **un único eje Y**. No reintroducir right axis.

### Al agregar un indicador nuevo tocar:
1. `indicatorOptions` — añadir al selector
2. `DB_INDICATORS` — si viene de Neon
3. `dbTrendByBucket` — calcular y exponer el bucket
4. `CasesTooltip` — si necesita sub-filas de desglose
5. `memberBuckets` — soporte para línea individual en management
6. `memberValuesForRanking` — valor para ordenar ranking
7. `teamValueOf` en `aggregatedTrendData` — valor de equipo
8. `indicatorSummary` — clasificar en COUNT_SET / NSAT_SET / PCT_SET

---

## Optimización de transferencia de red (Neon)

El plan free de Neon tiene 5 GB/mes. Los fetches de tabla completa agotaron el límite. Regla: **siempre filtrar en SQL con `?user=`**.

- `/api/opened-cases` → `WHERE "case_owner" IN (...)` 
- `/api/qa` → filtro adicional SQL sobre `Marca temporal::date`
- `/api/still-open-cases` → intento SQL, fallback JS
- Backlog fetch → sin filtro de usuario (necesita tabla completa), intencionalmente
- `fetchOpenedCases` en `apiService.ts` cambió firma: `compassIds?: string[]` → `?user=id1,id2`
