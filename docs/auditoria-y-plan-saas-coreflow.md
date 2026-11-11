# Auditoría del Repositorio y Plan Técnico de Reestructuración SaaS — CoreFlow

**Ubicación**: `docs/auditoria-y-plan-saas-coreflow.md`  
**Plataforma**: CoreFlow — *Organiza. Conecta. Evoluciona.*  
**Estado**: Implementado y verificado (Etapas A a F)

---

## 1. Resumen Ejecutivo

Este documento consolida la auditoría técnica del repositorio y la arquitectura de producción implementada para transformar CoreFlow en una plataforma SaaS multi-tenant funcional con tres contextos de acceso independientes (**CoreFlow Platform Admin**, **CoreFlow Starter** y **CoreFlow Business**), administración de planes y suscripciones persistida en PostgreSQL (`plan_catalog` y `organization_subscriptions`), aislamiento por organización mediante Row-Level Security (RLS), almacenamiento privado en Supabase Storage (`coreflow-documents`) y flujo de integración continua en GitHub.

---

## 2. Separación de los Tres Contextos de Acceso

CoreFlow opera sobre una plataforma compartida cuyo enrutador de sesión (`src/App.jsx` + `src/adapters/react/CoreFlowContext.jsx`) resuelve el contexto de acceso exclusivamente a partir del usuario autenticado y sus registros en base de datos:

| Contexto | Cuenta Provisionada | Organización / Alcance | Plan y Capacidades en Base de Datos |
|---|---|---|---|
| **A. CoreFlow Platform Admin** | `platform.admin@coreflow.app` | Alcance global de plataforma (`platform_admins`) | Consola exclusiva (`PlatformAdminView.jsx`) para crear/editar planes en `plan_catalog`, aprovisionar organizaciones, asignar suscripciones/vigencias en `organization_subscriptions`, ajustar cuotas en `organization_entitlements`, gestionar usuarios y auditar toda la plataforma. |
| **B. CoreFlow Starter** | `admin.starter@unidadpyme.co` | Organización 1: `org-pyme` (*Soluciones Ágiles del Caribe*) | Suscripción activa `starter` (1–15 colaboradores, sede principal única, flujo operativo directo sin aprobaciones multinivel ni automatizaciones interdepartamentales). |
| **C. CoreFlow Business** | `admin.business@corporativoprincipal.co` | Organización 2: `org-principal` (*Grupo Corporativo Andino*) | Suscripción activa `business` (16–30+ colaboradores, múltiples sedes, departamentos y equipos, permisos granulares por alcance, aprobaciones multinivel, automatizaciones entre áreas e indicadores por responsable). |

---

## 3. Esquema Relacional PostgreSQL y Migraciones Versionadas

Las migraciones SQL en `supabase/migrations/` están distribuidas por responsabilidades:

1. `001_core_tenancy_and_org.sql`: Catálogo base `plan_catalog`, `organizations`, `organization_entitlements`, `user_profiles`, `organization_branches`, `departments` y `teams` con claves compuestas `UNIQUE (id, organization_id)`.
2. `002_rbac_and_memberships.sql`: `roles`, `role_permissions`, `organization_members` y `team_members`.
3. `003_audit_and_security_rls.sql`: `audit_logs` (protegida con trigger append-only `trg_protect_audit_logs`), `entity_timeline_events` y funciones RLS (`app_user_active_org_ids()`, `app_has_active_membership()`, `app_has_org_permission()`).
4. `004_core_requests_and_approvals.sql`: `requests` y `approval_steps` con integridad referencial intra-organización.
5. `005_platform_admin_and_subscriptions.sql`: Catálogo dinámico `plan_catalog` (sin restricción cerrada de códigos para permitir crear nuevos planes desde Platform Admin), tabla `platform_admins`, tabla `organization_subscriptions`, funciones `app_is_platform_admin()` y `app_org_has_feature()`, y políticas RLS de administración global.
6. `006_operational_modules_schema.sql`: Tablas operativas `clients`, `commercial_opportunities`, `tasks`, `documents` y `automation_rules` con claves foráneas compuestas intra-organización y validación RLS de capacidades del plan.
7. `007_storage_buckets_and_policies.sql`: Bucket privado `coreflow-documents` y políticas RLS sobre `storage.objects` que exigen el prefijo `{organization_id}/{module}/{entity_id}/{filename}`.

---

## 4. Verificación Automatizada de los Criterios de Aceptación (T1 a T12)

La suite ejecutable `src/core/__tests__/coreArchitecture.verify.js` (`npm run test:core`) verifica automáticamente:

- **T1**: Aislamiento multi-tenant y validación de membresía activa (`TENANT_ISOLATION_VIOLATION`).
- **T2**: Integridad referencial intra-organización mediante claves foráneas compuestas (`CROSS_ORG_REFERENCE_VIOLATION`).
- **T3**: Separación entre suscripción contratada y cualquier intento de escalamiento de privilegios (`ENTITLEMENT_FEATURE_RESTRICTED`).
- **T4**: Autorización en 3 capas: Suscripción del Plan + Permiso RBAC + Alcance Departamental (`SCOPE_RESTRICTION_VIOLATION`).
- **T5**: Cumplimiento de cuotas administrables en base de datos (`COLLABORATOR_QUOTA_EXCEEDED`).
- **T6**: Inmutabilidad de `audit_logs` (`AUDIT_IMMUTABILITY_VIOLATION`) y sanitización de credenciales/tokens.
- **T7**: Coherencia analítica de métricas acumuladas y cortes temporales (`7d`, `30d`, `trimestre`) aislados por organización.
- **T8**: Inicio y cierre de sesión independiente para las 3 cuentas (`Platform Admin`, `Starter Admin`, `Business Admin`) y resolución de su contexto.
- **T9**: Aislamiento total de colecciones operativas (`clients`, `opportunities`, `requests`, `tasks`, `documents`) entre la organización Starter (`org-pyme`) y la organización Business (`org-principal`).
- **T10**: Creación y modificación de planes en el catálogo (`plan_catalog`), aprovisionamiento de organizaciones y asignación de suscripciones/cuotas exclusivamente desde `CoreFlow Platform Admin`.
- **T11**: Aplicación efectiva de restricciones por plan en los servicios operativos (`cross_department_workflow` bloqueado en Starter y habilitado en Business).
- **T12**: Persistencia de sesión, suscripciones y registros operativos tras recargar el navegador.
