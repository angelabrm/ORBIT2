# TASKS — ORBIT

Trabajo pendiente priorizado. Marcar como completado cuando se implemente.

---

## 🔴 Alta prioridad

### Conectar `ExecutiveView` al routing
- **Archivo:** `src/components/Dashboard.tsx`
- `ExecutiveView.tsx` existe pero no está conectado al router.
- Debe renderizarse cuando el rol es Executive y no hay miembro seleccionado.

### Mapeo completo de joins en Roster
- **Contexto:** Filas del Google Sheet con IDs reales en `Compass` / `CallPicker` / `QA` / `Genesys` reciben 0 datos hasta que el mapeo esté completo.
- Verificar que cada agente en el Roster tenga los 4 IDs mapeados correctamente.

---

## 🟡 Media prioridad

### Migrar indicadores mock restantes (Stellantis)
- **Archivo:** `src/components/Views/AgentView.tsx`
- Indicadores pendientes: `Outgoing Calls`, `Performance`, `Ranking`, `Bonus`, `Backlog Team` (legacy mock).
- Los KPI cards superiores también siguen en mock.
- Técnica: agregar al `Set DB_INDICATORS` + extender `dbTrendByBucket`.
- Ver `docs/CURRENT_STATE.md` para la checklist completa al agregar un indicador.

### Fuente de datos real para campañas Pepsico
- Reemplazar `pepsicoMockData.ts` con la fuente real (fases, tasks, fechas, estados).
- Fuente aún por definir — coordinación con equipo Pepsico requerida.
- Validar fórmulas de Performance, Ranking y QA Rate.

---

## 🟢 Baja prioridad / mejoras

### Day-inclusive margin en `/api/opened-cases`
- El backend agrega ±1 día al filtro de fecha (tolerancia de timezone).
- Puede devolver casos un día fuera del rango seleccionado.
- Limpiar el filtro para ser preciso o documentar el comportamiento intencionalmente.

### Definir tabs PM en Pepsico
- Las tabs Operational y Administrative del rol PM están marcadas como "Por definir" en el PRD.
- Necesita decisión de negocio antes de implementar.

---

## ✅ Completado recientemente

- **Seguridad completa:** JWT httpOnly cookie, `requireAuth` en todos los endpoints, scope validation por rol, rate limiting, security headers, `/api/roster` protegido y scoped, restauración de sesión, `JWT_SECRET` en Vercel
- Migración 12 indicadores Stellantis a Neon (ver `docs/CURRENT_STATE.md`)
- Optimización de transferencia de red: SQL IN filter en opened-cases, fecha SQL en QA
- Tooltip `CasesTooltip` con desglose por sub-fila
- Multi-indicador (hasta 3) con eje Y compartido
- Badges de resumen en header del chart
- SubNivel badge en Header
- Indicador Productivity (mixto Neon/mock por SubNivel)
- Despliegue Vercel con cold-start seguro (pg lazy, sin @neondatabase/serverless)
- Aislamiento de sesión al cerrar
