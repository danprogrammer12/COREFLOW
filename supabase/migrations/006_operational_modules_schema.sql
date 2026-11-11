-- =============================================================================
-- COREFLOW — MIGRACIÓN 006: ESQUEMA DE MÓDULOS OPERATIVOS MULTI-TENANT
-- Responsabilidad: Tablas de Clientes, Comercial (Oportunidades), Tareas,
-- Documentos y Reglas de Automatización con integridad referencial compuesta
-- intra-organización y políticas RLS.
-- =============================================================================

-- 1. CLIENTES Y CUENTAS ORGANIZACIONALES
create table if not exists clients (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  branch_id         uuid not null,
  code              text not null,
  legal_name        text not null,
  display_name      text not null,
  tax_id            text,
  sector            text not null default 'Servicios',
  status            text not null check (status in ('active', 'onboarding', 'process', 'pending', 'inactive')) default 'active',
  owner_member_id   uuid,
  contact_name      text,
  contact_email     text,
  contact_phone     text,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz,
  unique (organization_id, code),
  unique (id, organization_id),
  foreign key (branch_id, organization_id)
    references organization_branches(id, organization_id) on delete restrict,
  foreign key (owner_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null
);

-- 2. OPORTUNIDADES COMERCIALES
create table if not exists commercial_opportunities (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  client_id             uuid not null,
  code                  text not null,
  title                 text not null,
  stage                 text not null check (stage in ('prospeccion', 'propuesta', 'validacion_tecnica', 'negociacion', 'ganada', 'perdida')) default 'propuesta',
  status                text not null check (status in ('active', 'process', 'pending', 'completed', 'error')) default 'process',
  estimated_value       numeric(14, 2) not null default 0,
  currency              text not null default 'COP',
  probability           integer not null check (probability between 0 and 100) default 50,
  owner_member_id       uuid,
  expected_close_label  text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz,
  unique (organization_id, code),
  unique (id, organization_id),
  foreign key (client_id, organization_id)
    references clients(id, organization_id) on delete restrict,
  foreign key (owner_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null
);

-- 3. TAREAS OPERATIVAS
create table if not exists tasks (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  code                  text not null,
  title                 text not null,
  description           text,
  request_id            uuid,
  client_id             uuid,
  department_id         uuid,
  assigned_member_id    uuid,
  priority              text not null check (priority in ('Baja', 'Media', 'Alta', 'Prioritaria')) default 'Media',
  status                text not null check (status in ('pending', 'process', 'active', 'completed', 'error')) default 'pending',
  due_label             text not null default 'Hoy · 17:00',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz,
  unique (organization_id, code),
  unique (id, organization_id),
  foreign key (request_id, organization_id)
    references requests(id, organization_id) on delete set null,
  foreign key (client_id, organization_id)
    references clients(id, organization_id) on delete set null,
  foreign key (department_id, organization_id)
    references departments(id, organization_id) on delete set null,
  foreign key (assigned_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null
);

-- 4. DOCUMENTOS Y METADATOS DE STORAGE PRIVADO
create table if not exists documents (
  id                      uuid primary key default uuid_generate_v4(),
  organization_id         uuid not null references organizations(id) on delete cascade,
  code                    text not null,
  title                   text not null,
  category                text not null default 'Operativo',
  version                 text not null default 'v1.0',
  status                  text not null check (status in ('pending', 'process', 'active', 'completed', 'error')) default 'active',
  client_id               uuid,
  request_id              uuid,
  department_id           uuid,
  uploaded_by_member_id   uuid,
  storage_bucket          text not null default 'coreflow-documents',
  storage_path            text not null,
  mime_type               text not null default 'application/pdf',
  size_bytes              bigint not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  deleted_at              timestamptz,
  unique (organization_id, code),
  unique (id, organization_id),
  foreign key (client_id, organization_id)
    references clients(id, organization_id) on delete set null,
  foreign key (request_id, organization_id)
    references requests(id, organization_id) on delete set null,
  foreign key (department_id, organization_id)
    references departments(id, organization_id) on delete set null,
  foreign key (uploaded_by_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null
);

-- 5. REGLAS DE AUTOMATIZACIÓN Y PROCESOS
create table if not exists automation_rules (
  id                      uuid primary key default uuid_generate_v4(),
  organization_id         uuid not null references organizations(id) on delete cascade,
  code                    text not null,
  name                    text not null,
  description             text not null,
  trigger_event           text not null,
  scope_type              text not null check (scope_type in ('basic_notification', 'cross_department_workflow')) default 'basic_notification',
  source_department_id    uuid,
  target_department_id    uuid,
  status                  text not null check (status in ('active', 'process', 'pending')) default 'active',
  executions_count        integer not null default 0,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (organization_id, code),
  foreign key (source_department_id, organization_id)
    references departments(id, organization_id) on delete set null,
  foreign key (target_department_id, organization_id)
    references departments(id, organization_id) on delete set null
);

create index if not exists idx_clients_org on clients (organization_id, status);
create index if not exists idx_opportunities_org on commercial_opportunities (organization_id, stage, status);
create index if not exists idx_tasks_org on tasks (organization_id, status, assigned_member_id);
create index if not exists idx_documents_org on documents (organization_id, status, category);
create index if not exists idx_automations_org on automation_rules (organization_id, scope_type, status);

-- 6. POLÍTICAS RLS DE MÓDULOS OPERATIVOS
alter table clients enable row level security;
alter table commercial_opportunities enable row level security;
alter table tasks enable row level security;
alter table documents enable row level security;
alter table automation_rules enable row level security;

-- Clientes
create policy "clients: select" on clients
  for select using ((select app_has_active_membership(organization_id)));

create policy "clients: insert" on clients
  for insert with check ((select app_has_org_permission(organization_id, 'clients:write')));

create policy "clients: update" on clients
  for update using ((select app_has_org_permission(organization_id, 'clients:write')));

-- Oportunidades Comerciales
create policy "opportunities: select" on commercial_opportunities
  for select using ((select app_has_active_membership(organization_id)));

create policy "opportunities: insert" on commercial_opportunities
  for insert with check ((select app_has_org_permission(organization_id, 'opportunities:write')));

create policy "opportunities: update" on commercial_opportunities
  for update using ((select app_has_org_permission(organization_id, 'opportunities:write')));

-- Tareas
create policy "tasks: select" on tasks
  for select using ((select app_has_active_membership(organization_id)));

create policy "tasks: insert" on tasks
  for insert with check ((select app_has_org_permission(organization_id, 'tasks:write')));

create policy "tasks: update" on tasks
  for update using ((select app_has_org_permission(organization_id, 'tasks:write')));

-- Documentos
create policy "documents: select" on documents
  for select using ((select app_has_active_membership(organization_id)));

create policy "documents: insert" on documents
  for insert with check ((select app_has_active_membership(organization_id)));

create policy "documents: update" on documents
  for update using ((select app_has_org_permission(organization_id, 'documents:approve')));

-- Automatizaciones (Si es cross_department_workflow exige feature cross_area_automations en el plan suscrito)
create policy "automation_rules: select" on automation_rules
  for select using ((select app_has_active_membership(organization_id)));

create policy "automation_rules: insert" on automation_rules
  for insert with check (
    (select app_has_active_membership(organization_id))
    and (
      scope_type = 'basic_notification'
      or (select app_org_has_feature(organization_id, 'cross_area_automations'))
    )
  );
