# Guía de Instalación, Configuración de Supabase y Despliegue — CoreFlow SaaS

**Plataforma**: CoreFlow — *Organiza. Conecta. Evoluciona.*  
**Repositorio GitHub**: `https://github.com/danprogrammer12/COREFLOW.git`

---

## 1. Requisitos Previos

- **Node.js**: v20 LTS o superior.
- **Proyecto en Supabase**: PostgreSQL 15+, Supabase Auth y Supabase Storage habilitados.
- **Git**: Configurado con acceso al repositorio remoto.

---

## 2. Configuración de Variables de Entorno

1. Copie la plantilla `.env.example` a `.env.local` en la raíz del proyecto:
   ```bash
   cp .env.example .env.local
   ```
2. Complete las variables públicas del cliente en `.env.local`:
   ```env
   VITE_SUPABASE_URL=https://su-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=su-anon-public-key
   ```
   > **Regla de Seguridad**: Nunca incluya `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` con prefijo `VITE_` ni dentro de archivos en `src/`. El flujo de CI (`.github/workflows/ci.yml`) verifica automáticamente que no existan referencias a `service_role` en el cliente.

---

## 3. Ejecución de las Migraciones SQL en Supabase (`001` a `007`)

Ejecute las migraciones en orden secuencial desde el **SQL Editor** de Supabase o mediante Supabase CLI (`supabase db push`):

1. `supabase/migrations/001_core_tenancy_and_org.sql` — Catálogo de planes, organizaciones, sedes, departamentos y equipos.
2. `supabase/migrations/002_rbac_and_memberships.sql` — Roles, permisos atómicos y membresías organizacionales.
3. `supabase/migrations/003_audit_and_security_rls.sql` — Auditoría inmutable (`audit_logs`) y funciones RLS multi-tenant.
4. `supabase/migrations/004_core_requests_and_approvals.sql` — Solicitudes y aprobaciones multinivel con FKs compuestas.
5. `supabase/migrations/005_platform_admin_and_subscriptions.sql` — Tabla `platform_admins`, tabla `organization_subscriptions` y funciones de validación de planes/capacidades en PostgreSQL.
6. `supabase/migrations/006_operational_modules_schema.sql` — Módulos operativos (`clients`, `commercial_opportunities`, `tasks`, `documents`, `automation_rules`) y sus políticas RLS.
7. `supabase/migrations/007_storage_buckets_and_policies.sql` — Bucket privado `coreflow-documents` y políticas RLS por prefijo `{organization_id}/{module}/{entity_id}/{filename}`.

---

## 4. Aprovisionamiento Seguro de las Tres Cuentas SaaS

Para aprovisionar en Supabase Auth y PostgreSQL las tres cuentas diferenciadas (`Platform Admin`, `Starter Admin` y `Business Admin`) junto con sus dos organizaciones aisladas (`org-pyme` con plan `starter` y `org-principal` con plan `business`), ejecute desde una terminal administrativa:

```bash
SUPABASE_URL="https://su-proyecto.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="su-service-role-key-solo-en-terminal" \
PROVISION_PLATFORM_ADMIN_EMAIL="platform.admin@coreflow.app" \
PROVISION_PLATFORM_ADMIN_PASSWORD="SuPasswordSeguro1!" \
PROVISION_STARTER_ADMIN_EMAIL="admin.starter@unidadpyme.co" \
PROVISION_STARTER_ADMIN_PASSWORD="SuPasswordSeguro2!" \
PROVISION_BUSINESS_ADMIN_EMAIL="admin.business@corporativoprincipal.co" \
PROVISION_BUSINESS_ADMIN_PASSWORD="SuPasswordSeguro3!" \
node scripts/provision-coreflow-accounts.mjs
```

### Cuentas y Contextos de Acceso Disponibles

1. **Contexto A — CoreFlow Platform Admin**:
   - Correo: `platform.admin@coreflow.app`
   - Acceso: Consola global de administración de plataforma (organizaciones, planes en PostgreSQL, suscripciones, cuotas, usuarios y auditoría global).
2. **Contexto B — CoreFlow Starter**:
   - Correo: `admin.starter@unidadpyme.co`
   - Organización asignada: *Soluciones Ágiles del Caribe* (`org-pyme`) — Suscripción activa `starter`.
   - Acceso: Dashboard Starter, clientes, comercial, solicitudes con flujo directo, tareas, documentos y configuración hasta 15 colaboradores.
3. **Contexto C — CoreFlow Business**:
   - Correo: `admin.business@corporativoprincipal.co`
   - Organización asignada: *Grupo Corporativo Andino* (`org-principal`) — Suscripción activa `business`.
   - Acceso: Dashboard Business, gestión de departamentos y equipos, aprobaciones multinivel, automatizaciones entre áreas e indicadores por responsable.

---

## 5. Ejecución Local, Pruebas de Arquitectura y Build de Producción

```bash
# Instalar dependencias
npm install

# Ejecutar la suite automatizada de 12 pruebas SaaS (aislamiento, RBAC, planes, persistencia)
npm run test:core

# Iniciar servidor de desarrollo
npm run dev

# Generar compilación optimizada de producción
npm run build
```

---

### 5.1 Rutas y despliegue en Vercel

CoreFlow usa rutas normales (History API, router propio en `src/lib/router.js` y `src/lib/routes.js`): `/`, `/acceso`, `/demo`, `/legal` y `/legal/:slug`. Cualquier otra ruta muestra la vista 404.

- Los enlaces antiguos con hash (`#/acceso`, `#/demo`, `#/legal/privacidad`) se redirigen solos a la ruta normal. Los anclas de sección (`#planes`) y los fragmentos de Supabase (`#access_token=...`) no se tocan.
- `vercel.json` reescribe a `index.html` toda ruta sin punto que no empiece por `assets/`, `fonts/` ni `brand/` (así un chunk inexistente devuelve 404 y no HTML). Los headers de caché de `/assets` y `/fonts` se conservan; `/acceso` y `/demo` envían `X-Robots-Tag: noindex`.
- `vite dev` y `vite preview` ya sirven el fallback SPA.
- SEO: título, descripción, canonical y robots se actualizan por ruta; `public/robots.txt` y `public/sitemap.xml` apuntan a `https://coreflowwebcore.vercel.app`. Si cambia el dominio, actualizar `SITE_URL` en `src/lib/routes.js`, `index.html`, `robots.txt` y `sitemap.xml`.
- Pruebas del router: `npm run test:routing`.

## 6. Flujo de Trabajo en GitHub

- **`main`**: Rama principal protegida para despliegues de producción.
- **`develop`**: Rama de integración donde convergen las etapas verificadas.
- **`feature/*`**: Ramas de desarrollo por etapa o módulo funcional.
- **CI Automatizado (`.github/workflows/ci.yml`)**: En cada `push` o `pull_request` hacia `main` o `develop`, GitHub Actions verifica la ausencia de secretos en el cliente, ejecuta `npm run test:core` (12/12 pruebas) y valida `npm run build`.
