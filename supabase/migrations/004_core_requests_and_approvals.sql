-- =============================================================================
-- COREFLOW — MIGRACIÓN 004: CONTRATO BASE DE SOLICITUDES Y APROBACIONES
-- Responsabilidad: Entidades operativas fundamentales que conectan la estructura
-- organizacional (sedes, departamentos, miembros) con el flujo de solicitudes y
-- validación multinivel, manteniendo integridad referencial intra-organización.
-- =============================================================================

create table if not exists requests (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  code                  text not null,
  subject               text not null,
  client_reference_code text,
  client_display_name   text not null,
  branch_id             uuid not null,
  department_id         uuid,
  assigned_member_id    uuid not null,
  created_by_member_id  uuid not null,
  priority              text not null check (priority in ('Baja', 'Media', 'Alta', 'Prioritaria')) default 'Media',
  status                text not null check (status in ('pending', 'process', 'active', 'completed', 'error')) default 'process',
  due_label             text not null,
  approval_summary      text not null,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  deleted_at            timestamptz,
  unique (organization_id, code),
  unique (id, organization_id),
  foreign key (branch_id, organization_id)
    references organization_branches(id, organization_id) on delete restrict,
  foreign key (department_id, organization_id)
    references departments(id, organization_id) on delete restrict,
  foreign key (assigned_member_id, organization_id)
    references organization_members(id, organization_id) on delete restrict,
  foreign key (created_by_member_id, organization_id)
    references organization_members(id, organization_id) on delete restrict
);

create table if not exists approval_steps (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id) on delete cascade,
  request_id            uuid not null,
  step_order            integer not null,
  step_label            text not null,
  target_department_id  uuid,
  required_permission   text not null default 'approvals:validate_level',
  status                text not null check (status in ('pending', 'process', 'approved', 'rejected')) default 'pending',
  decided_by_member_id  uuid,
  decided_at            timestamptz,
  decision_comment      text,
  created_at            timestamptz not null default now(),
  unique (request_id, step_order),
  foreign key (request_id, organization_id)
    references requests(id, organization_id) on delete cascade,
  foreign key (target_department_id, organization_id)
    references departments(id, organization_id) on delete restrict,
  foreign key (decided_by_member_id, organization_id)
    references organization_members(id, organization_id) on delete restrict
);

create index if not exists idx_requests_org_status on requests (organization_id, status, created_at desc);
create index if not exists idx_requests_org_dept on requests (organization_id, department_id, status);
create index if not exists idx_approvals_org_req on approval_steps (organization_id, request_id, step_order);

alter table requests enable row level security;
alter table approval_steps enable row level security;

create policy "requests: select miembro activo" on requests
  for select using (
    (select app_has_active_membership(organization_id))
    and deleted_at is null
  );

create policy "requests: insert con permiso" on requests
  for insert with check ((select app_has_org_permission(organization_id, 'requests:create')));

create policy "requests: update con permiso" on requests
  for update using ((select app_has_org_permission(organization_id, 'requests:update')));

create policy "requests: prohibir delete fisico" on requests
  for delete using (false);

create policy "approval_steps: select miembro activo" on approval_steps
  for select using ((select app_has_active_membership(organization_id)));

create policy "approval_steps: update con permiso de aprobacion" on approval_steps
  for update using ((select app_has_org_permission(organization_id, 'approvals:validate_level')));
