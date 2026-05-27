# PRD — ORBIT Dashboard Corporativo

**Empresa:** Alta MX | **Estado:** En definición

---

## Objetivo

Dashboard corporativo que permite a los usuarios visualizar información operativa y financiera según su rol y cliente asignado. El acceso y las visualizaciones están determinadas por la jerarquía de roles y el Roster (Google Sheets).

---

## Clientes

| Cliente | Departments | Estado |
|---------|------------|--------|
| Stellantis | CAC, Fleet, Premium | Completamente implementado |
| Pepsico | Pepsico (department único) | PM view, Manager view y Financial implementados |

La arquitectura soporta nuevos clientes sin rediseñar el modelo de acceso.

---

## Roles

| Rol | Cliente | Alcance |
|-----|---------|---------|
| **Executive** | Todos | Vista global — todos los clientes |
| **Manager** | Su cliente | Visibilidad operativa de su cliente completo |
| **Leader** | Su cliente | Visibilidad del department al que pertenece |
| **Agent** | Su cliente | Solo sus propios datos |
| **PM** | Pepsico (exclusivo) | Gestión de campañas; no supervisa agentes |

---

## Reglas de negocio

### Control de acceso
- Executive → vista global (todos los clientes).
- Manager → solo su cliente.
- Leader → solo su department.
- Agent → solo su información individual.
- PM → solo sus campañas Pepsico; sin acceso a datos Stellantis.

### Aislamiento por cliente
- Solo Executive ve todos los clientes.
- Stellantis y Pepsico están aislados entre sí.

### Tabs de gestión

| Rol | Operational | Administrative | Financial |
|-----|:-----------:|:--------------:|:---------:|
| Agent | ✅ | ✅ | ❌ |
| Leader | ✅ | ✅ | ❌ |
| Manager | ✅ | ✅ | ❌ |
| Executive | ✅ | ✅ | ✅ |
| PM | Por definir | Por definir | ❌ |

Financial: exclusiva del Executive, solo accesible sin miembro seleccionado.

### Drilling y navegación

| Acción | Resultado |
|--------|-----------|
| Executive/Manager hace clic en barra de "Average Performance by Department" | Renderiza vista del Leader de ese Department |
| Cualquier rol selecciona nombre en dropdown del Sidebar | Renderiza vista individual del Agent/PM con botón de regreso |
| Presiona botón de regreso | Restaura la pestaña activa previa |

### Autenticación
- Login por RFC → validado contra el Roster → carga vista del rol.
- Al cerrar sesión se limpia todo el estado (usuario, miembro seleccionado, pestaña activa).

---

## Vistas por rol

### Agent
Indicadores propios: QA, casos abiertos/cerrados, NSAT, llamadas, FCR, adherencia, home office. Sin acceso a información de otros usuarios.

### Leader
Vista de su team en Operational y Administrative. Drilling a vista individual de cualquier miembro vía dropdown.

### Manager
- Operational: gráfico "Average Performance by Department" con barras por department.
- Administrative: vista de equipo agregada.

### Executive
- Operational / Administrative: igual que Manager con visibilidad global.
- Financial: KPIs financieros por cliente y department (`FinancialView`).
- `ExecutiveView`: KPIs macro (Core Clients, Service Desks, Growth QoQ, Revenue Projection). **Pendiente de activar en routing de Dashboard.**

### PM *(Pepsico exclusivo)*

Ver **[docs/PRD-Pepsico.md](PRD-Pepsico.md)** para la especificación completa (campañas, Gantt, fases, métricas).

---

## Roster — Fuente de datos de usuarios

**Fuente:** Google Sheets público → URL CSV `gviz/tq?tqx=out:csv`, sheet `Roster`.  
**No requiere credenciales.** Caché en memoria de 5 minutos en el backend.

| Columna | Descripción |
|---------|-------------|
| Documento | RFC — identificador de login |
| Nombre | Nombre completo |
| Client | Cliente asignado |
| Nivel | Rol: Agent, Leader, Manager, Executive, PM |
| MESA_ | Department dentro del cliente |
| Compass | ID para join con `Abiertos`, `Cerrados`, `NSAT` |
| CallPicker | ID para join con `Actividad` |
| QA | ID para join con tablas `QA` |
| Genesys | ID para join con `Rendimiento_Agente` |
| SubNivel | Subtipo de agente CAC: `Calls`, `Follow up`, `NA` |

Los datos de usuario **no** existen en código. Si la hoja se vuelve privada, migrar a service account y actualizar `fetchRosterFromSheets()` en `server.ts` **y** `api/index.ts`.
