# CoreFlow Starter — Especificación v1.0

Estado: **límites definitivos, confirmados el 2026-11-10**. Reemplaza cualquier referencia anterior a 5 GB, 10 GB, cinco automatizaciones o cinco roles en Starter.

## 1. Requisitos

| # | Requisito | Valor |
|---|---|---|
| R1 | Colaboradores activos | Máximo 15 |
| R2 | Sedes | Una |
| R3 | Áreas | Una única área general |
| R4 | Clientes | Ilimitados |
| R5 | Administradores | Máximo 2 |
| R6 | Roles | Exactamente 3: Administrador, Supervisor y Colaborador |
| R7 | Automatizaciones activas simultáneas | Máximo 3, con imposición en backend: no se puede activar una cuarta |
| R8 | Almacenamiento | Configurable por plan y por organización. Sin capacidad fija aprobada |
| R9 | IA | No incluida |
| R10 | Aprobaciones multinivel | No incluidas |
| R11 | Permisos granulares | No incluidos |
| R12 | Documentos | Carga real, descarga autorizada, asociación con registros e historial de versiones |

## 2. Estado frente al backend

**Actualización:** las migraciones 014, 015 y 016 implementan R5 a R9 y R12, con las decisiones de la sección 5 aprobadas. Siguen sin aplicarse en Supabase. La tabla de abajo es el estado anterior a esas migraciones, conservado como registro.

Rama `feature/backend-supabase`, commit `3a84f78`. Validado solo a nivel local o simulado.

| # | Estado | Situación |
|---|---|---|
| R1 | Cumple, con matiz | Trigger con límite 15. Cuenta también a los invitados, para reservar el cupo |
| R2 | Cumple | Trigger con `max_branches = 1` |
| R3 | Cumple, con matiz | Se crea una sola área y Starter no puede crear más, pero `rpc_invite_member` deja `department_id` nulo |
| R4 | Cumple | Sin límite |
| R5 | **No cumple** | Sin límite de administradores |
| R6 | **No cumple** | `SYSTEM_ROLE_TEMPLATES` define 5 roles y no existen Supervisor ni Colaborador |
| R7 | **No cumple** | Sin límite ni imposición |
| R8 | **No cumple** | Mecanismo presente (`plan_catalog.limits_json` y `organization_entitlements`), pero con 5120 MB fijos |
| R9 | **No cumple** | `ai_assistant: true` en Starter |
| R10 | Cumple | `multilevel_approvals: false` |
| R11 | Cumple | `granular_permissions: false`; el alcance se ignora en Starter |
| R12 | **Parcial** | Carga y URL firmada existen. Sin historial de versiones, sin asociación con tareas ni oportunidades |

## 3. Discrepancias

| ID | Severidad | Dónde | Problema |
|---|---|---|---|
| D1 | Alta | `permissionsCatalog.js` | 5 roles para todos los planes; Starter necesita sus 3 |
| D2 | Alta | Migraciones | Falta `max_active_automations` y su trigger |
| D3 | Alta | Migraciones | Falta `max_admins` y su trigger |
| D4 | Alta | `normalizeDatabasePlanRow` en `plansCatalog.js` y `PlatformAdminService.upsertPlan` | Solo conocen 3 límites. **Guardar un plan borraría `max_admins` y `max_active_automations`** |
| D5 | Alta | 001 y 005 (datos), `plansCatalog.js:20,89` | 5120 MB fijos, incluido un valor por defecto en el código |
| D6 | Alta | 006 | Sin tabla de versiones: `documents.version` es un texto en una sola fila |
| D7 | Media | 001, 005, `plansCatalog.js:30,111` | `ai_assistant` activo; el valor por defecto en el código es `true` |
| D8 | Media | `rpc_provision_organization` | No valida que Starter reciba exactamente sus 3 roles |
| D9 | Media | 006 | Sin asociación de documentos con tareas ni oportunidades |
| D10 | Media | 009, `private.storage_can` | La descarga no aplica el alcance de la fila del documento, solo el permiso |
| D11 | Media | `OperationalModulesService.createDocument` | `size_bytes` lo declara el cliente; debe salir de `storage.objects` |
| D12 | Media | `rpc_get_org_capabilities`, `mapCapabilities` | No exponen los nuevos límites |
| D13 | Media | `org_limit` | Sin dato devuelve 0: correcto para almacenamiento, pero bloquearía a Business en límites que no le aplican |
| D14 | Baja | `rpc_invite_member` | En Starter debería asignar la única área |
| D15 | Baja | `updateSubscription` | Pasar de Business a Starter no valida roles, áreas ni administradores excedentes |
| D16 | Baja | 007 | 25 MB por archivo fijos en el bucket; no está en la especificación |
| D17 | Alta | 009, `private.can_row` | En Starter se ignora el alcance, así que Colaborador vería todas las tareas |

**Fuera del backend** (para Antigravity): `ModulesPreviewView.jsx:459` usa 5120 como respaldo, `PlatformAdminView.jsx:619` calcula GB sin contemplar capacidad sin configurar, y `CoreFlowContext.jsx` tiene etiquetas de los roles anteriores.

## 4. Cambios necesarios

**Migraciones nuevas (no creadas, pendientes de aprobación):**

| Migración | Contenido | Cierra |
|---|---|---|
| `014_starter_spec_v1.sql` | Catálogo Starter: sin IA, sin capacidad fija, `max_admins = 2`, `max_active_automations = 3`. `private.org_limit_optional` para límites que no aplican a todos los planes. Triggers de automatizaciones y administradores con bloqueo por organización. Validación de roles en aprovisionamiento. Área por defecto al invitar. Capacidades ampliadas | D2, D3, D5, D7, D8, D12, D13, D14 |
| `015_document_versions.sql` | Tabla `document_versions` inmutable, RPC atómica de nueva versión, tamaño tomado de `storage.objects`, `task_id` y `opportunity_id` en `documents`, descarga con alcance | D6, D9, D10, D11 |

Las migraciones 001 a 013 no se modifican: 014 corrige los datos sembrados.

**Archivos a modificar:** `src/core/config/permissionsCatalog.js`, `src/core/config/plansCatalog.js`, `src/core/backend/mappers.js`, `PlatformAdminService.js`, `OperationalModulesService.js`, `OrganizationService.js`, `tests/db/harness.mjs`, `tests/db/security.test.mjs`, `tests/services/backend.test.mjs` y `src/core/__tests__/coreArchitecture.verify.js`.

## 5. Decisiones (aprobadas el 2026-11-10)

1. **Permisos de cada rol.** Propuesta:

| Permiso | Administrador | Supervisor | Colaborador |
|---|---|---|---|
| Estructura y lectura general | Sí | Sí | Sí |
| Gestionar colaboradores, roles y sede | Sí | No | No |
| Suscripción y consumo | Sí | No | No |
| Auditoría | Sí | Sí | No |
| Clientes y oportunidades | Gestiona | Consulta | Consulta |
| Solicitudes | Gestiona | Seguimiento y actualización | Crea y actualiza las asignadas |
| Tareas | Gestiona | Supervisa todas | Solo las asignadas |
| Documentos | Gestiona | Consulta y aprueba | Consulta y sube |
| Automatizaciones | Gestiona | Consulta | No |

"Sin permisos granulares" se interpreta como que los roles no se pueden personalizar. Para que Colaborador vea solo sus tareas, los roles predefinidos deben conservar su alcance fijo. **Esto cambia el backend:** hoy `private.can_row` ignora el alcance en Starter y daría acceso a toda la organización (D17).

2. **Capacidad sin configurar.** Propuesta: se bloquean las cargas con `STORAGE_QUOTA_NOT_CONFIGURED` hasta que Platform Admin fije un valor. La alternativa, sin límite, deja el costo abierto.
3. **Invitados y el límite de 15.** Propuesta: mantener el cupo reservado, para que no se puedan emitir más invitaciones que plazas.
4. **Business.** La especificación solo cubre Starter. Propuesta: Business conserva sus valores y queda sin límite de administradores ni automatizaciones.
