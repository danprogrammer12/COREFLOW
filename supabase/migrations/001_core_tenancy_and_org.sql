-- =============================================================================
-- COREFLOW — MIGRACIÓN 001: NÚCLEO MULTI-TENANT Y ESTRUCTURA ORGANIZACIONAL
-- Responsabilidad: Catálogo de planes, organizaciones (tenants), cuotas
-- administrables, perfiles globales de usuario, sedes, departamentos y equipos.
-- Garantiza integridad intra-organización mediante restricciones UNIQUE (id, organization_id)
-- y claves foráneas compuestas.
-- =============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. CATÁLOGO ADMINISTRABLE DE PLANES Y EDICIONES
create table if not exists plan_catalog (
  plan_code       text primary key check (plan_code in ('start', 'business')),
  display_name    text not null,
  description     text not null,
  limits_json     jsonb not null default '{}'::jsonb,
  features_json   jsonb not null default '{}'::jsonb,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

insert into plan_catalog (plan_code, display_name, description, limits_json, features_json)
values
  (
    'start',
    'CoreFlow Start',
    'Edición para organizaciones de 1 a 15 colaboradores con gestión esencial.',
    '{"max_collaborators": 15, "max_branches": 1, "max_storage_mb": 5120}'::jsonb,
    '{"multi_branch": false, "departments_and_teams": false, "granular_permissions": false, "multilevel_approvals": false, "cross_area_automations": false, "responsible_indicators": false, "basic_automations": true, "ai_assistant": true}'::jsonb
  ),
  (
    'business',
    'CoreFlow Business',
    'Edición para organizaciones de 16 a 30 colaboradores con departamentos, aprobaciones multinivel y permisos granulares.',
    '{"max_collaborators": 30, "max_branches": 10, "max_storage_mb": 25600}'::jsonb,
    '{"multi_branch": true, "departments_and_teams": true, "granular_permissions": true, "multilevel_approvals": true, "cross_area_automations": true, "responsible_indicators": true, "basic_automations": true, "ai_assistant": true}'::jsonb
  )
on conflict (plan_code) do nothing;

-- 2. ORGANIZACIONES (TENANT RAÍZ)
create table if not exists organizations (
  id                    uuid primary key default uuid_generate_v4(),
  slug                  text not null unique,
  legal_name            text not null,
  display_name          text not null,
  tax_id                text,
  sector                text,
  contracted_plan_code  text not null references plan_catalog(plan_code) default 'start',
  status                text not null check (status in ('active', 'trial', 'suspended', 'archived')) default 'active',
  timezone              text not null default 'America/Bogota',
  settings_json         jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz
);

-- 3. CAPACIDADES Y CUOTAS ADMINISTRABLES POR ORGANIZACIÓN (OVERRIDES)
create table if not exists organization_entitlements (
  organization_id   uuid not null references organizations(id) on delete cascade,
  entitlement_key   text not null,
  value_json        jsonb not null,
  reason            text,
  updated_at        timestamptz not null default now(),
  updated_by        uuid,
  primary key (organization_id, entitlement_key)
);

-- 4. PERFILES GLOBALES DE USUARIO (Separados de organizaciones y roles)
create table if not exists user_profiles (
  id                uuid primary key, -- Corresponde 1:1 con auth.users.id
  email             text not null unique,
  full_name         text not null,
  avatar_url        text,
  phone             text,
  preferred_locale  text not null default 'es-CO',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 5. SEDES / UNIDADES OPERATIVAS DE LA ORGANIZACIÓN
create table if not exists organization_branches (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  code              text not null,
  name              text not null,
  city              text,
  is_main           boolean not null default false,
  status            text not null check (status in ('active', 'inactive')) default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  unique (organization_id, code),
  unique (id, organization_id) -- Requerido para claves foráneas compuestas intra-tenant
);

-- 6. DEPARTAMENTOS / ÁREAS FUNCIONALES
create table if not exists departments (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  branch_id             uuid not null,
  parent_department_id  uuid,
  code                  text not null,
  name                  text not null,
  description           text,
  status                text not null check (status in ('active', 'inactive')) default 'active',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz,
  unique (organization_id, code),
  unique (id, organization_id),
  foreign key (branch_id, organization_id)
    references organization_branches(id, organization_id) on delete restrict,
  foreign key (parent_department_id, organization_id)
    references departments(id, organization_id) on delete restrict
);

-- 7. EQUIPOS DE TRABAJO
create table if not exists teams (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  department_id     uuid not null,
  code              text not null,
  name              text not null,
  status            text not null check (status in ('active', 'inactive')) default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  unique (organization_id, code),
  unique (id, organization_id),
  foreign key (department_id, organization_id)
    references departments(id, organization_id) on delete restrict
);

create index if not exists idx_branches_org on organization_branches (organization_id, status);
create index if not exists idx_departments_org on departments (organization_id, branch_id, status);
create index if not exists idx_teams_org on teams (organization_id, department_id, status);
