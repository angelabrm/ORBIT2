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
| Pepsico | Pepsico (department único) | Solo presente en la pestaña Financial del Executive. Resto pendiente de implementar |

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

**Estado actual:** La integración en tiempo real con Google Sheets está **pendiente de implementar**. Actualmente los datos del Roster están copiados manualmente en `src/data/mockData.ts`. El login funciona correctamente contra estos datos estáticos.

**Pendiente:** Implementar sincronización automática con Google Sheets para que el Roster del dashboard refleje siempre el estado real del archivo.

---

## 4. Jerarquía de roles

| Rol | Cliente | Descripción |
|-----|---------|-------------|
| **Executive** | Todos | Acceso global a todos los clientes y todas las vistas |
| **Manager** | Su cliente asignado | Visibilidad operativa de su cliente completo |
| **Leader** | Su cliente asignado | Visibilidad del department al que pertenece |
| **Agent** | Su cliente asignado | Visibilidad únicamente de su propia información |
| **PM** | Pepsico (exclusivo) | Gestión de proyectos; no supervisa agentes. Vistas por definir |

---

## 5. Reglas de negocio

### 5.1 Control de acceso por rol

- El dashboard carga las visualizaciones de acuerdo con el rol y cliente asignado en el Roster.
- La información se filtra automáticamente según el nivel jerárquico:
  - **Executive** → vista global (todos los clientes).
  - **Manager** → vista por cliente (solo su cliente).
  - **Leader** → vista por department (solo su department).
  - **Agent** → vista individual (solo sus propios datos).
  - **PM** → pendiente de definir (exclusivo Pepsico, sin acceso a datos de Stellantis).

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

### PM *(Pepsico exclusivo — pendiente de definir)*
- Rol de gestión de proyectos dentro de Pepsico.
- No supervisa agentes ni tiene acceso a datos de Stellantis.
- Vistas, pestañas y métricas por definir en una fase posterior.

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

- Roles Agent, Leader, Manager, Executive con sus vistas correspondientes
- Tabs Operational / Administrative / Financial con control de acceso por rol
- Drilling: clic en barra de gráfico → vista de Leader; dropdown → vista de Agent
- Autenticación por RFC contra datos del Roster (estáticos en `mockData.ts`)
- Cliente Stellantis con departments CAC, Fleet, Premium
- Manager de Pepsico con su vista operativa
- Pestaña Financial del Executive con datos de Stellantis y Pepsico
- Backend Express con endpoint de casos abiertos (Neon PostgreSQL)
- Aislamiento de sesión al cerrar

### Pendiente de implementar

| Item | Descripción |
|------|-------------|
| Google Sheets — integración en tiempo real | Sincronización automática del Roster desde Google Sheets |
| `ExecutiveView` activa | Conectar `ExecutiveView.tsx` al routing de `Dashboard.tsx` |
| Rol PM | Definir vistas, métricas y acceso para el rol PM de Pepsico |
| Vistas operativas de Pepsico | Datos operativos del equipo Pepsico más allá del Financial |
| Control de acceso backend | Validación de rol/cliente en endpoints de la API |

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
- Vistas y métricas del rol PM (se definirán en una fase posterior)
- Vistas operativas del cliente Pepsico (se definirán en una fase posterior)
