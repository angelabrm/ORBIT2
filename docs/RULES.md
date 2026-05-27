# RULES — ORBIT

Reglas que todo agente debe seguir al modificar este codebase.

---

## Git

- **No branches.** Todo va directo a `main`. Nunca crear ramas ni worktrees para features.
- Ejecutar `npm run lint` (tsc --noEmit) antes de cada commit.
- Push: `git push origin HEAD:main`.

---

## Datos de usuario

- Nunca hardcodear datos de usuario en código.
- Leer siempre desde `useAuth().users` (RFC→User map, poblado desde `/api/roster`).
- Patrón de lookup: `Object.values(users).find(...)`.
- `case_owner` en filas de BD es un **Compass ID** → mapear RFC→`users[rfc]?.compass` antes de filtrar.

---

## Transferencia de red (Neon)

- Siempre pasar `?user=compassIds` a los endpoints para que el filtro ocurra en SQL.
- Nunca hacer `SELECT *` de tabla completa si el scope es de un único usuario.
- Única excepción: fetch de Backlog (necesita datos de todo el equipo).

---

## Fechas

- Backend emite **siempre** `dateStr: "YYYY-MM-DD"` junto a `dateMs`.
- Frontend **siempre** usa `dateStr` para bucketing. No usar `dayjs(dateMs)` para agrupar (shift de TZ).
- Nuevas tablas con fechas → usar `parseDateFlex()`. No reimplementar el parsing.

---

## UI

- Sin solapamiento de texto — usar flex/grid, nunca `position: absolute` para texto.
- Texto que desborda → `text-overflow: ellipsis` (una línea) o `line-clamp` (multilínea).
- Contenedores crecen con el contenido — no usar altura fija con texto variable.

---

## Charts (Recharts)

- `CartesianGrid vertical={false}`
- Ejes en color primario del tema
- `strokeWidth={4}` en todas las líneas
- Puntos hollow (dot con fill blanco / fondo)
- `connectNulls={true}` en indicadores que pueden tener buckets vacíos (QA, NSAT, FCR, Backlog, Calls Efficiency)
- Team y Member comparten **un único eje Y** en las vistas de management — no reintroducir right axis independiente.

---

## Dos archivos de backend — siempre sincronizar

Cualquier cambio en `server.ts` debe replicarse en `api/index.ts` y viceversa:
- Lógica de endpoints
- Helpers de parsing
- Fetch del Roster (`fetchRosterFromSheets`)

---

## `api/index.ts` — cold-start

- `pg` → importar dinámicamente dentro de `getPool()`.
- No importar `@neondatabase/serverless` (eliminado).
- No importar `dayjs/plugin/customParseFormat` a nivel de módulo.
- Todo paquete pesado nuevo → mismo patrón lazy.

---

## Agregar un indicador nuevo al line chart

Al promover un indicador de mock a Neon, tocar en orden:

1. `DB_INDICATORS` Set en `AgentView.tsx`
2. `dbTrendByBucket` — calcular y exponer el bucket
3. `indicatorOptions` — añadir al selector UI
4. `CasesTooltip` — si necesita sub-filas
5. `memberBuckets` — soporte línea individual (management)
6. `memberValuesForRanking` — valor para ordenar ranking
7. `teamValueOf` en `aggregatedTrendData`
8. `indicatorSummary` — clasificar en COUNT_SET / NSAT_SET / PCT_SET

---

## Indicadores team-wide CAC

`Still Open Cases` y `Backlog` usan `scopeIsCAC` como gate. No fetcharlos si el scope no es CAC. Still Open usa **snapshot** (último día con data), no SUM — aplicar este patrón a cualquier indicador de stock acumulado.
