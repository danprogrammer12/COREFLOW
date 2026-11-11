-- =============================================================================
-- COREFLOW — MIGRACIÓN 005: GOBIERNO DE PLATAFORMA (PLATFORM ADMIN),
-- CATÁLOGO DINÁMICO DE PLANES Y SUSCRIPCIONES ORGANIZACIONALES
-- =============================================================================

-- 1. PERMITIR CREACIÓN DINÁMICA DE PLANES EN plan_catalog DESDE PLATFORM ADMIN
alter table plan_catalog drop constraint if exists plan_catalog_plan_code_check;

alter table plan_catalog
  add column if not exists price_monthly_usd numeric(10, 2) not null default 0,
  add column if not exists collaborators_range_label text not null default '1 a 15 colaboradores',
  add column if not exists default_approval_summary text not null default 'Flujo directo';

insert into plan_catalog (
  plan_code,
  display_name,
  description,
  price_monthly_usd,
  collaborators_range_label,
  default_approval_summary,
  limits_json,
  features_json,
  is_active
)
values
  (
    'starter',
    'CoreFlow Starter',
    'Suscripción para organizaciones en crecimiento (1 a 15 colaboradores) con gestión centralizada de clientes, comercial, solicitudes, tareas y documentos.',
    49.00,
    '1 a 15 colaboradores',
    'Flujo directo (Plan Starter)',
    '{"max_collaborators": 15, "max_branches": 1, "max_storage_mb": 5120}'::jsonb,
    '{"multi_branch": false, "departments_and_teams": false, "granular_permissions": false, "multilevel_approvals": false, "cross_area_automations": false, "responsible_indicators": false, "basic_automations": true, "ai_assistant": true}'::jsonb,
    true
  ),
  (
    'business',
    'CoreFlow Business',
    'Suscripción empresarial (16 a 30+ colaboradores) con departamentos y equipos, permisos granulares, aprobaciones multinivel, automatizaciones entre áreas e indicadores por responsable.',
    129.00,
    '16 a 30 colaboradores',
    'Nivel 1 · Revisión de Área',
    '{"max_collaborators": 30, "max_branches": 10, "max_storage_mb": 25600}'::jsonb,
    '{"multi_branch": true, "departments_and_teams": true, "granular_permissions": true, "multilevel_approvals": true, "cross_area_automations": true, "responsible_indicators": true, "basic_automations": true, "ai_assistant": true}'::jsonb,
    true
  )
on conflict (plan_code) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  price_monthly_usd = excluded.price_monthly_usd,
  collaborators_range_label = excluded.collaborators_range_label,
  default_approval_summary = excluded.default_approval_summary,
  limits_json = excluded.limits_json,
  features_json = excluded.features_json,
  updated_at = now();

-- 2. TABLA DE ADMINISTRADORES DE PLATAFORMA (CONTEXTO GLOBAL INDEPENDIENTE)
create table if not exists platform_admins (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null unique,
  email         text not null unique,
  full_name     text not null,
  role_level    text not null check (role_level in ('SUPER_ADMIN', 'PLATFORM_OPS', 'PLATFORM_AUDITOR')) default 'SUPER_ADMIN',
  status        text not null check (status in ('active', 'suspended')) default 'active',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 3. TABLA DE SUSCRIPCIONES ORGANIZACIONALES Y VIGENCIAS
create table if not exists organization_subscriptions (
  id                uuid primary key default uuid_generate_v4(),
  organization_id   uuid not null unique references organizations(id) on delete cascade,
  plan_code         text not null references plan_catalog(plan_code) on update cascade,
  status            text not null check (status in ('trialing', 'active', 'past_due', 'suspended', 'canceled')) default 'active',
  billing_cycle     text not null check (billing_cycle in ('monthly', 'annual')) default 'monthly',
  valid_from        timestamptz not null default now(),
  valid_until       timestamptz not null default (now() + interval '1 year'),
  assigned_by       uuid,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Permitir registros globales en audit_logs cuando el actor es Platform Admin
alter table audit_logs alter column organization_id drop not null;

-- 4. FUNCIONES DE SEGURIDAD EN POSTGRESQL PARA PLATFORM ADMIN Y CAPACIDADES DE PLAN
create or replace function app_is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from platform_admins
    where user_id = auth.uid()
      and status = 'active'
  );
$$;

create or replace function app_org_has_feature(target_org_id uuid, feature_key text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_plan_code text;
  v_sub_status text;
  v_plan_feature boolean;
  v_override_val jsonb;
begin
  -- 1. Obtener suscripción activa o plan contratado de la organización
  select os.plan_code, os.status
    into v_plan_code, v_sub_status
    from organization_subscriptions os
   where os.organization_id = target_org_id;

  if v_plan_code is null then
    select o.contracted_plan_code, o.status
      into v_plan_code, v_sub_status
      from organizations o
     where o.id = target_org_id;
  end if;

  if v_sub_status not in ('active', 'trialing', 'trial') then
    return false;
  end if;

  -- 2. Verificar si existe override administrable en organization_entitlements
  select oe.value_json
    into v_override_val
    from organization_entitlements oe
   where oe.organization_id = target_org_id
     and oe.entitlement_key = ('feature.' || feature_key);

  if v_override_val is not null then
    return (v_override_val #>> '{}')::boolean;
  end if;

  -- 3. Evaluar desde plan_catalog en PostgreSQL
  select coalesce((pc.features_json ->> feature_key)::boolean, false)
    into v_plan_feature
    from plan_catalog pc
   where pc.plan_code = v_plan_code
     and pc.is_active = true;

  return coalesce(v_plan_feature, false);
end;
$$;

-- Trigger que sincroniza organizations.contracted_plan_code al crear/actualizar suscripción
create or replace function sync_organization_plan_from_subscription()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update organizations
     set contracted_plan_code = new.plan_code,
         updated_at = now()
   where id = new.organization_id;
  return new;
end;
$$;

drop trigger if exists trg_sync_org_subscription on organization_subscriptions;
create trigger trg_sync_org_subscription
after insert or update of plan_code, status on organization_subscriptions
for each row execute function sync_organization_plan_from_subscription();

-- 5. POLÍTICAS RLS PARA PLATFORM ADMIN Y SUSCRIPCIONES
alter table platform_admins enable row level security;
alter table organization_subscriptions enable row level security;

create policy "platform_admins: lectura propia o super admin" on platform_admins
  for select using (
    user_id = (select auth.uid())
    or (select app_is_platform_admin())
  );

create policy "plan_catalog: gestion por platform admin" on plan_catalog
  for all using ((select app_is_platform_admin()))
  with check ((select app_is_platform_admin()));

create policy "organizations: gestion global por platform admin" on organizations
  for all using ((select app_is_platform_admin()))
  with check ((select app_is_platform_admin()));

create policy "organization_subscriptions: lectura por miembro o platform admin" on organization_subscriptions
  for select using (
    (select app_has_active_membership(organization_id))
    or (select app_is_platform_admin())
  );

create policy "organization_subscriptions: gestion por platform admin" on organization_subscriptions
  for all using ((select app_is_platform_admin()))
  with check ((select app_is_platform_admin()));

create policy "organization_entitlements: gestion por platform admin" on organization_entitlements
  for all using ((select app_is_platform_admin()))
  with check ((select app_is_platform_admin()));

create policy "user_profiles: gestion por platform admin" on user_profiles
  for all using ((select app_is_platform_admin()))
  with check ((select app_is_platform_admin()));

create policy "organization_members: gestion por platform admin" on organization_members
  for all using ((select app_is_platform_admin()))
  with check ((select app_is_platform_admin()));

create policy "audit_logs: lectura global por platform admin" on audit_logs
  for select using ((select app_is_platform_admin()));

create policy "audit_logs: insert por platform admin" on audit_logs
  for insert with check (
    (select app_is_platform_admin())
    and actor_user_id = (select auth.uid())
  );
