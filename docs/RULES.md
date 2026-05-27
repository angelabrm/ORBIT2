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

## Seguridad

### Token de sesión
- Login emite cookie `orbit_session` firmada con HMAC-SHA256 (Node `crypto` nativo) → `httpOnly; SameSite=Strict; Max-Age=28800`. En producción también `Secure`.
- **Nunca** leer ni escribir este cookie desde JavaScript. `credentials: 'include'` en todos los `fetch` para que el browser lo adjunte automáticamente.
- `JWT_SECRET` debe estar en variables de entorno (Vercel env vars). El valor por defecto `'dev-secret-change-in-production'` solo es aceptable en local dev sin datos reales.
- Expiración del token: 8 horas. Al expirar, el servidor responde 401 y el AuthContext muestra el login.

### Middleware `requireAuth`
- Todos los endpoints de datos (`/api/opened-cases`, `/api/closed-cases`, `/api/incoming-calls`, `/api/qa`, `/api/nsat`, `/api/still-open-cases`, `/api/roster`) lo usan.
- Únicas excepciones: `/api/login`, `/api/logout`, `/api/health`.
- Al agregar un endpoint nuevo, siempre incluir `requireAuth` como primer middleware.

### Scope validation
- `getAllowedCompassIds(auth)` → devuelve el Set de Compass IDs que el usuario puede consultar (o `null` para Executive = sin restricción).
- `assertScope(requestedIds, allowed, res)` → envía 403 y retorna `false` si algún ID está fuera del scope.
- `resolveUserList(raw, auth)` → si no hay `?user=` y el rol es Agent/PM, auto-inyecta el propio compass (previene full-table scan).
- Siempre ejecutar `assertScope` antes de hacer la query a la BD.

### Rate limiting
- `/api/login`: máximo 10 intentos por IP en 15 minutos. En-memory, best-effort para serverless (se reinicia con el proceso).
- No agregar rate limiting en-memory a endpoints de datos — usar infra (Vercel Edge, Cloudflare) para eso.

### Respuestas de error
- En producción (`NODE_ENV === 'production'`), usar `errRes(res, status, message)` sin el argumento `detail`.
- Nunca exponer stack traces, mensajes de error de la BD o nombres de tabla en respuestas de producción.
- En dev, `errRes(res, 500, 'message', error?.message)` incluye el detail para facilitar debugging.

### Headers de seguridad
- El middleware de headers corre para **todas** las rutas. No moverlo después del router de Vite.
- `Content-Security-Policy` incluye `'unsafe-inline'` para scripts/styles por compatibilidad con MUI. Mejorable con nonces en el futuro.

---

## Indicadores team-wide CAC

`Still Open Cases` y `Backlog` usan `scopeIsCAC` como gate. No fetcharlos si el scope no es CAC. Still Open usa **snapshot** (último día con data), no SUM — aplicar este patrón a cualquier indicador de stock acumulado.
