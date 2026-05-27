# ORBIT — Agent Index

Dashboard corporativo de Alta MX. React 19 + Vite + Express 4 + Neon PostgreSQL. Desplegado en Vercel.

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/PRD.md](docs/PRD.md) | Objetivo, clientes, roles, reglas de negocio, vistas |
| [docs/PRD-Pepsico.md](docs/PRD-Pepsico.md) | Rol PM, campañas, Gantt, Manager Pepsico |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, entry points, endpoints, helpers backend, convenciones |
| [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md) | Implementado, tabla de indicadores Neon, fórmulas, puntos clave de AgentView |
| [docs/RULES.md](docs/RULES.md) | Reglas de código, UI, fechas, charts, Neon, cold-start |
| [docs/TASKS.md](docs/TASKS.md) | Pendientes priorizados y completados recientes |

## Comandos

```bash
npm run dev      # Express + Vite HMR en puerto 3000
npm run build    # Build de producción
npm run lint     # tsc --noEmit — ejecutar antes de cada commit
npm run preview  # Preview del build
npm run clean    # Elimina dist/
```

## Git

**No branches.** Todo va directo a `main`. Lint antes de cada commit. Push: `git push origin HEAD:main`.

## Entorno

Copiar `.env.example` → `.env`:
- `DATABASE_URL` / `NEON_DB_URL` — Neon PostgreSQL
- `JWT_SECRET` — Secreto para firmar tokens de sesión (**obligatorio en producción**; generar con `openssl rand -base64 32`)
- `GEMINI_API_KEY` — Google Gemini
- `GOOGLE_SHEETS_ID` — Roster (default en código; hoja pública, sin credenciales)
