-- =============================================================================
-- COREFLOW — MIGRACIÓN 002: ROLES, PERMISOS, ALCANCES Y MEMBRESÍAS
-- Responsabilidad: Separar usuarios autenticados, membresías por organización,
-- roles organizacionales y permisos atómicos con alcance de datos (Data Scope).
-- =============================================================================

-- 1. ROLES ORGANIZACIONALES
create table if not exists roles (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  code              text not null,
  name              text not null,
  description       text,
  default_scope     text not null check (default_scope in ('ORG_WIDE', 'BRANCH_SCOPE', 'DEPARTMENT_SCOPE', 'TEAM_OR_ASSIGNED')),
  is_system_role    boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (organization_id, code),
  unique (id, organization_id)
);

-- 2. PERMISOS ATÓMICOS ASIGNADOS A CADA ROL
create table if not exists role_permissions (
  role_id           uuid not null,
  organization_id   uuid not null,
  permission_key    text not null,
  scope_override    text check (scope_override in ('ORG_WIDE', 'BRANCH_SCOPE', 'DEPARTMENT_SCOPE', 'TEAM_OR_ASSIGNED')),
  created_at        timestamptz not null default now(),
  primary key (role_id, permission_key),
  foreign key (role_id, organization_id)
    references roles(id, organization_id) on delete cascade
);

-- 3. MEMBRESÍAS ORGANIZACIONALES (Vínculo Usuario <-> Organización + Rol + Sede + Área)
create table if not exists organization_members (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  user_id           uuid not null references user_profiles(id) on delete restrict,
  role_id           uuid not null,
  branch_id         uuid not null,
  department_id     uuid,
  job_title         text not null,
  status            text not null check (status in ('active', 'invited', 'suspended', 'archived')) default 'active',
  joined_at         timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  unique (organization_id, user_id),
  unique (id, organization_id),
  foreign key (role_id, organization_id)
    references roles(id, organization_id) on delete restrict,
  foreign key (branch_id, organization_id)
    references organization_branches(id, organization_id) on delete restrict,
  foreign key (department_id, organization_id)
    references departments(id, organization_id) on delete restrict
);

-- 4. ADSCRIPCIÓN DE MIEMBROS A EQUIPOS (Con integridad intra-organización)
create table if not exists team_members (
  team_id           uuid not null,
  member_id         uuid not null,
  organization_id   uuid not null,
  is_team_lead      boolean not null default false,
  joined_at         timestamptz not null default now(),
  primary key (team_id, member_id),
  foreign key (team_id, organization_id)
    references teams(id, organization_id) on delete cascade,
  foreign key (member_id, organization_id)
    references organization_members(id, organization_id) on delete cascade
);

create index if not exists idx_members_user_active on organization_members (user_id, status);
create index if not exists idx_members_org_dept on organization_members (organization_id, department_id, status);
create index if not exists idx_role_perms_lookup on role_permissions (organization_id, role_id, permission_key);
