# CoreFlow — Contratos de integración frontend y backend

Estado: **propuesta, sin implementar**. Basada en el código real de `COREFLOW` (rama `develop` más 6 archivos sin commit) y en `feature/backend-supabase`, commit `3a84f78`. Nada validado contra Supabase real.

La arquitectura usa `supabase-js` directo: tablas con RLS y funciones RPC. **No hay endpoints REST.** El único componente de servidor adicional propuesto es una Edge Function, porque crear usuarios exige `service_role`.

## 1. Estado real del frontend

El informe de la Fase 2 de Antigravity **no coincide con el repositorio**:
- No existen `ClientsView`, `RequestsView`, `TasksView`, `DocumentsView`, `ProcessesView`, `TeamView`, `SubscriptionView`, `AutomationView`, `EmptyState`, `InfoBadge`, `DemoBadge`, `src/core/demoStore.js` ni `artifacts/`.
- Las cuatro llamadas a `ClientAccountCard` y `DocumentRecordCard` siguen pasando campos sueltos.
- Ningún archivo de `src/` cambió después de las 21:07.
- `localhost:5174` sigue en blanco, con la misma excepción.

Este documento describe lo que existe: `AuthView`, `DashboardView`, `ModulesPreviewView`, `PlatformAdminView` y `QuickActionModals`, conectados por `useCoreFlow()`.

## 2. Contratos por módulo

Toda operación devuelve `Promise<{ ok: true, data } | { ok: false, error, code }>`.

| Módulo | Lo que usa el frontend | Servicio backend | Estado |
|---|---|---|---|
| Auth | `authenticateAccount({ email, password })` | `authentication.signIn` | Disponible |
| Auth | `signOut()` | `authentication.signOut` | Disponible |
| Auth | `isAuthenticated`, `isPlatformAdmin`, `accessContext`, `user` | `getSnapshot().session` | Disponible |
| Auth | Restauración de sesión | `authentication.initialize`, `startSessionListener` | Disponible; la interfaz no tiene estado de carga |
| Auth | Recuperar contraseña | `authentication.requestPasswordReset` | Disponible; `AuthView:85` no llama a nada |
| Tenant | `accessibleOrganizations`, `activeOrganization`, `switchOrganization` | `organizations.*`, sesión | Disponible |
| Tenant | `branches`, `departments`, `members`, `activeMembership` | `organizations.getTenantContext` | Disponible |
| Tenant | `activeRole` | Etiqueta en el contexto | **Falta:** Supervisor y Colaborador caerían en "Administrador Organizacional" |
| Plan | `entitlementsResolved`, `contractedEdition`, `presentationEdition` | `subscriptions.getEntitlements` | Parcial: faltan límites nuevos y capacidad sin configurar |
| Clientes | `clients`, `createClient` | `operationalModules.listClients`, `createClient` | Disponible |
| Clientes | Editar, archivar | RLS lo permite | **Falta** el servicio; la interfaz tampoco lo llama |
| Comercial | `opportunities`, `createOpportunity` | `listOpportunities`, `createOpportunity` | Disponible |
| Solicitudes | `requests`, `createRequest` | `workflow.listRequests`, `createRequest` | Disponible |
| Solicitudes | `cycleRequestStatus`, `updateRequestStatus` | `workflow.transitionRequest` | Disponible |
| Solicitudes | `approveRequestLevel(id, 2)` | `workflow.decideApprovalStep` | Disponible |
| Tareas | `tasks`, `createTask`, `toggleTaskStatus` | `operationalModules.*` | Disponible |
| Tareas | Reasignar | RLS lo permite | **Falta** el servicio |
| Documentos | `documents` | `listDocuments` | Disponible |
| Documentos | `createDocument({ title, category, version })` | `createDocument` | **Incompatible:** la interfaz no envía archivo |
| Documentos | Carga, descarga, versiones | `getDocumentUrl` parcial | **Falta** |
| Procesos | `automationRules`, `createAutomationRule` | `automations.listRules`, `createRule` | Disponible; **falta** el límite de 3 |
| Procesos | Activar o desactivar | `automations.setRuleStatus` | Disponible; la interfaz no lo llama |
| Áreas | `createDepartment` | `organizations.createDepartment` | Disponible |
| Equipo | Invitar, cambiar rol | `inviteMember`, `updateMember`, `acceptInvitation` | Disponible; la interfaz no lo llama |
| Auditoría | `auditLogs` | `audit.listOrganizationLogs` | Disponible |
| Métricas | `unifiedMetrics`, `period`, `setPeriod` | Ninguno | **Falta:** es el mayor vacío |
| Platform | `platformAdminData` | `platformAdmin.listPlans`, `listOrganizations`, `listUsers`, `listGlobalAudit` | Disponible |
| Platform | `upsertPlan` | `platformAdmin.upsertPlan` | Disponible; **borra límites nuevos** hasta corregirlo |
| Platform | `updateSubscription`, `updateEntitlement` | `updateSubscription`, `setEntitlement` | Disponible |
| Platform | `createOrganization({ ..., adminEmail, adminFullName })` | `provisionOrganization` | **Incompatible:** el servicio espera `adminUserId` |

**Contratos nuevos propuestos:**

```
operationalModules.updateClient({ organizationId, clientId, patch })
operationalModules.archiveClient({ organizationId, clientId })
operationalModules.updateTask({ organizationId, taskId, patch })
operationalModules.createDocument({ organizationId, payload: { title, category, file, clientId?, requestId?, taskId?, opportunityId? } })
operationalModules.addDocumentVersion({ organizationId, documentId, file, comment? })
operationalModules.listDocumentVersions({ organizationId, documentId })
operationalModules.getDocumentUrl({ organizationId, documentId, versionId? })
metrics.getOrganizationMetrics({ organizationId, period })
platformAdmin.provisionOrganization({ ..., adminEmail, adminFullName })
```

`metrics.getOrganizationMetrics` devuelve la forma actual de `unifiedMetrics`: `acumulados`, `periodo`, `periodInfo` y `series`. Lo que no se pueda calcular se devuelve como texto "N/D", nunca `null`: la interfaz sustituiría `null` por cifras inventadas.

## 3. Bloqueos para conectar sin cambiar la interfaz

| ID | Bloqueo | Dónde | Efecto |
|---|---|---|---|
| I1 | Llamadas síncronas a acciones que serán asíncronas | `App.jsx:99,107`, `DashboardView:126,411,1011,1146`, `ModulesPreviewView:96-134`, `PlatformAdminView:112,131,148` | `res.ok === false` nunca se cumple sobre una promesa: **cada fallo se mostraría como éxito** |
| I2 | Pantalla en blanco | `DashboardView:551,577`, `ModulesPreviewView:698,905` | La aplicación no carga |
| I3 | Sin campo de archivo | `ModulesPreviewView:115` | No se puede cargar nada |
| I4 | Valores inventados de respaldo | `ModulesPreviewView:78,106,315,459`, `DashboardView:732,747,779` | Cifras ficticias como 12 colaboradores, 32.000.000 o "+12%" |
| I5 | Contraseña fija y acceso rápido | `AuthView:72,76` | Debe limitarse a modo local |
| I6 | Sin estados de carga ni de error de conexión | `App.jsx` | El contexto arranca sin datos |
| I7 | Lógica de capacidades en cliente | `QuickActionModals:25` usa `EDITION_RULES` | Puede diferir del servidor |

I1 es incompatible con "sin tocar la interfaz": un adaptador no puede convertir una promesa en un valor síncrono. Requiere añadir `await` en unas 12 llamadas, sin cambio visual.

## 4. Documentos, Storage y descarga segura

**Modelo (migración 015):** tabla `document_versions` (`document_id`, `version_number`, `storage_path`, `size_bytes`, `mime_type`, `uploaded_by_member_id`, `comment`, `created_at`), inmutable y con `unique (document_id, version_number)`. `documents.current_version_id` apunta a la vigente. Se añaden `task_id` y `opportunity_id` con claves foráneas compuestas.

**Carga:**
1. El cliente sube a `{org}/documents/{documentId}/v{n}/{archivo}`, sin sobrescritura.
2. `rpc_register_document_version` bloquea el documento, comprueba que el objeto exista en `storage.objects`, toma el tamaño de allí y asigna el número.
3. Si el registro falla, el servicio retira el archivo.

**Descarga:** `createSignedUrl` con vida corta. La política de `storage.objects` se apoya en `document_versions` para aplicar el alcance de la fila; hoy solo comprueba el permiso.

## 5. Cuotas

| Cuota | Estado actual | Cambio |
|---|---|---|
| 15 colaboradores | Trigger con bloqueo | Ninguno |
| 1 sede | Trigger con bloqueo | Ninguno |
| 1 área | Por capacidad del plan | Verificar en provisión |
| 2 administradores | **Sin imponer** | Trigger en 014 |
| 3 automatizaciones activas | **Sin imponer** | Trigger en 014 |
| Almacenamiento | Comprobación sin reserva | Valor por plan; la reserva queda como riesgo abierto |

## 6. Autenticación y aislamiento

El motor ya resuelve sesión, membresías y organización activa desde `auth.uid()`. Para conectarlo:
- `CoreFlowContext.jsx` escoge el motor con `resolveDataMode`, sin fallback.
- Se suscribe con `useSyncExternalStore` a `subscribe` y `getSnapshot`.
- El `organization_id` enviado por el cliente nunca se confía: RLS y las RPC lo comprueban contra `auth.uid()`.
- Crear usuarios para invitaciones nuevas exige una Edge Function con `service_role`. Sin ella, solo se puede invitar a cuentas ya existentes.

## 7. Migraciones propuestas

| Migración | Contenido |
|---|---|
| 014 | Catálogo Starter, triggers de administradores y automatizaciones, roles en provisión, alcance de roles predefinidos, `admin_email` en provisión, capacidades ampliadas |
| 015 | Versiones de documentos, asociaciones, RPC de registro, Storage con alcance |
| 016 | `rpc_get_org_metrics`, calculado solo con datos reales |

## 8. Orden de integración

1. Antigravity corrige I2 de verdad, con verificación independiente.
2. Decisiones pendientes de la especificación.
3. Backend: 014, 015, 016, catálogos, servicios y pruebas simuladas.
4. Autorización y conexión con `CoreFlow Development`: migraciones, aprovisionamiento, pruebas reales.
5. Adaptador: `CoreFlowContext.jsx` con estados de carga.
6. Frontend, coordinado: `await` (I1), archivo (I3), retirar cifras (I4) y contraseña (I5).
7. Por módulos: Auth y tenant, plan y cuotas, clientes, solicitudes, tareas, documentos, procesos, equipo, métricas, Platform Admin.

## 9. Pruebas necesarias

- **Simuladas:** triggers de 2 administradores y 3 automatizaciones, incluida la reactivación; catálogo sin perder límites; capacidad sin configurar; versiones inmutables y numeración; métricas sin cifras fijas.
- **Supabase real:** las de `tests/supabase/`, más carga, descarga y versiones; concurrencia de automatizaciones, administradores y versiones.
- **Contrato:** cada clave de `useCoreFlow()` presente en el adaptador, con los mismos tipos.
- **Navegador:** Starter, Business y Platform Admin con consola limpia, y un fallo forzado que se muestre como error y no como éxito.
