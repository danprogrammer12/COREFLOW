-- =============================================================================
-- COREFLOW — MIGRACIÓN 003: AUDITORÍA PROTEGIDA Y ESTRATEGIA RLS MULTI-TENANT
-- Responsabilidad: Registro de auditoría append-only protegido contra
-- modificaciones/eliminación, bitácora de eventos y políticas RLS validadas
-- directamente contra las membresías activas de auth.uid().
-- =============================================================================

-- 1. TABLA DE AUDITORÍA INMUTABLE (APPEND-ONLY)
create table if not exists audit_logs (
  id                    uuid primary key default uuid_generate_v4(),
  organization_id       uuid not null references organizations(id) on delete restrict,
  actor_user_id         uuid not null,
  actor_member_id       uuid,
  actor_role_code       text not null,
  module                text not null,
  entity_type           text not null,
  entity_id             text not null,
  action                text not null,
  summary               text not null,
  sanitized_changes     jsonb not null default '{}'::jsonb,
  created_at            timestamptz not null default now(),
  foreign key (actor_member_id, organization_id)
    references organization_members(id, organization_id) on delete restrict
);

-- Trigger de protección para impedir cualquier UPDATE o DELETE en audit_logs
create or replace function prevent_audit_log_tampering()
returns trigger
language plpgsql
as $$
begin
  raise exception 'SECURITY_POLICY_VIOLATION: audit_logs es inmutable (append-only). No se permite % sobre registros de auditoría.', tg_op;
end;
$$;

drop trigger if exists trg_protect_audit_logs on audit_logs;
create trigger trg_protect_audit_logs
before update or delete on audit_logs
for each row execute function prevent_audit_log_tampering();

create index if not exists idx_audit_logs_org_created on audit_logs (organization_id, created_at desc);
create index if not exists idx_audit_logs_entity on audit_logs (organization_id, entity_type, entity_id);

-- 2. BITÁCORA OPERATIVA DE ENTIDADES (Línea de tiempo legible de negocio)
create table if not exists entity_timeline_events (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null references organizations(id) on delete cascade,
  entity_type       text not null,
  entity_id         text not null,
  category          text not null,
  title             text not null,
  detail            text,
  actor_member_id   uuid,
  actor_label       text not null,
  created_at        timestamptz not null default now(),
  foreign key (actor_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null
);

create index if not exists idx_timeline_org_created on entity_timeline_events (organization_id, created_at desc);

-- =============================================================================
-- 3. FUNCIONES HELPER DE SEGURIDAD MULTI-TENANT (Evaluadas contra membresías reales)
-- Nunca confían en un organization_id arbitrario enviado por el cliente sin
-- comprobar que auth.uid() tenga membresía activa en organization_members.
-- =============================================================================

create or replace function app_user_active_org_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(organization_id), '{}'::uuid[])
  from organization_members
  where user_id = auth.uid()
    and status = 'active'
    and deleted_at is null;
$$;

create or replace function app_has_active_membership(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_members
    where organization_id = target_org_id
      and user_id = auth.uid()
      and status = 'active'
      and deleted_at is null
  );
$$;

create or replace function app_has_org_permission(target_org_id uuid, required_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from organization_members om
    join role_permissions rp
      on rp.role_id = om.role_id
     and rp.organization_id = om.organization_id
    where om.organization_id = target_org_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.deleted_at is null
      and rp.permission_key = required_permission
  );
$$;

-- =============================================================================
-- 4. POLÍTICAS ROW LEVEL SECURITY (RLS) DEL NÚCLEO
-- =============================================================================

alter table plan_catalog enable row level security;
alter table organizations enable row level security;
alter table organization_entitlements enable row level security;
alter table user_profiles enable row level security;
alter table organization_branches enable row level security;
alter table departments enable row level security;
alter table teams enable row level security;
alter table roles enable row level security;
alter table role_permissions enable row level security;
alter table organization_members enable row level security;
alter table team_members enable row level security;
alter table audit_logs enable row level security;
alter table entity_timeline_events enable row level security;

-- Catálogo de planes: lectura para usuarios autenticados
create policy "plan_catalog: lectura autenticada" on plan_catalog
  for select using (auth.role() = 'authenticated');

-- Organizaciones: solo aquellas donde el usuario autenticado tiene membresía activa
create policy "organizations: leer por membresia" on organizations
  for select using ((select app_has_active_membership(id)));

-- Entitlements: lectura para miembros activos del tenant
create policy "entitlements: leer por membresia" on organization_entitlements
  for select using ((select app_has_active_membership(organization_id)));

-- Perfiles de usuario: lectura si comparte organización o es el propio perfil
create policy "user_profiles: leer propio o compañero de tenant" on user_profiles
  for select using (
    id = (select auth.uid())
    or exists (
      select 1 from organization_members om
      where om.user_id = user_profiles.id
        and om.organization_id = any((select app_user_active_org_ids()))
    )
  );

create policy "user_profiles: actualizar propio" on user_profiles
  for update using (id = (select auth.uid()));

-- Sedes, Departamentos, Equipos, Roles y Membresías: aislamiento por membresía real
create policy "branches: select" on organization_branches
  for select using ((select app_has_active_membership(organization_id)));

create policy "branches: insert" on organization_branches
  for insert with check ((select app_has_org_permission(organization_id, 'org:manage_branches')));

create policy "departments: select" on departments
  for select using ((select app_has_active_membership(organization_id)));

create policy "departments: insert" on departments
  for insert with check ((select app_has_org_permission(organization_id, 'org:manage_departments')));

create policy "teams: select" on teams
  for select using ((select app_has_active_membership(organization_id)));

create policy "roles: select" on roles
  for select using ((select app_has_active_membership(organization_id)));

create policy "role_permissions: select" on role_permissions
  for select using ((select app_has_active_membership(organization_id)));

create policy "members: select" on organization_members
  for select using ((select app_has_active_membership(organization_id)));

create policy "members: insert" on organization_members
  for insert with check ((select app_has_org_permission(organization_id, 'org:manage_members')));

-- Auditoría: solo inserción para miembros activos y lectura según permiso audit:read_logs
create policy "audit_logs: select autorizado" on audit_logs
  for select using ((select app_has_org_permission(organization_id, 'audit:read_logs')));

create policy "audit_logs: insert miembro activo" on audit_logs
  for insert with check (
    (select app_has_active_membership(organization_id))
    and actor_user_id = (select auth.uid())
  );

create policy "audit_logs: bloquear update" on audit_logs
  for update using (false);

create policy "audit_logs: bloquear delete" on audit_logs
  for delete using (false);

-- Bitácora: lectura e inserción para miembros activos de la organización
create policy "timeline: select" on entity_timeline_events
  for select using ((select app_has_active_membership(organization_id)));

create policy "timeline: insert" on entity_timeline_events
  for insert with check ((select app_has_active_membership(organization_id)));
