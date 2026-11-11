-- =============================================================================
-- COREFLOW — MIGRACIÓN 008: RECONCILIACIÓN DEL ESQUEMA
-- Responsabilidad: definición canónica de planes, fuente de verdad única de
-- suscripciones, corrección de claves foráneas, vínculo con auth.users, integridad
-- de updated_at y organization_id, y funciones base de capacidades.
-- No borra datos. Reversión: supabase/rollbacks/008_schema_reconciliation.down.sql
-- =============================================================================

-- 1. ESQUEMA PRIVADO: no expuesto por la API, invocable solo desde políticas y RPC
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

-- 2. PLAN CANÓNICO: `starter` es el único código del plan de entrada.
-- `start` se conserva inactivo como registro histórico y no puede volver a usarse.
update organization_subscriptions set plan_code = 'starter' where plan_code = 'start';
update organizations set contracted_plan_code = 'starter' where contracted_plan_code = 'start';
alter table organizations alter column contracted_plan_code set default 'starter';

update plan_catalog
   set is_active = false,
       description = 'Código histórico reemplazado por starter. No asignable.'
 where plan_code = 'start';

alter table plan_catalog
  add constraint plan_catalog_start_retired check (plan_code <> 'start' or is_active = false);
alter table organizations
  add constraint organizations_plan_not_retired check (contracted_plan_code <> 'start');
alter table organization_subscriptions
  add constraint subscriptions_plan_not_retired check (plan_code <> 'start');

-- 3. FUENTE DE VERDAD: toda organización tiene una suscripción, y el plan se escribe
-- únicamente allí. organizations.contracted_plan_code queda como dato derivado.
insert into organization_subscriptions (organization_id, plan_code, status)
select o.id,
       o.contracted_plan_code,
       case o.status
         when 'trial' then 'trialing'
         when 'suspended' then 'suspended'
         when 'archived' then 'canceled'
         else 'active'
       end
  from organizations o
 where not exists (
   select 1 from organization_subscriptions s where s.organization_id = o.id
 );

create or replace function private.guard_contracted_plan()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Profundidad 1 = UPDATE directo. El trigger de sincronización corre en profundidad 2.
  if new.contracted_plan_code is distinct from old.contracted_plan_code
     and pg_trigger_depth() < 2 then
    raise exception 'PLAN_SOURCE_VIOLATION: El plan se modifica en organization_subscriptions.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_contracted_plan on organizations;
create trigger trg_guard_contracted_plan
before update of contracted_plan_code on organizations
for each row execute function private.guard_contracted_plan();

-- 4. CLAVES FORÁNEAS: SET NULL solo sobre la columna opcional, no sobre organization_id
alter table entity_timeline_events
  drop constraint entity_timeline_events_actor_member_id_organization_id_fkey,
  add constraint entity_timeline_events_actor_member_id_organization_id_fkey
    foreign key (actor_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null (actor_member_id);

alter table clients
  drop constraint clients_owner_member_id_organization_id_fkey,
  add constraint clients_owner_member_id_organization_id_fkey
    foreign key (owner_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null (owner_member_id);

alter table commercial_opportunities
  drop constraint commercial_opportunities_owner_member_id_organization_id_fkey,
  add constraint commercial_opportunities_owner_member_id_organization_id_fkey
    foreign key (owner_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null (owner_member_id);

alter table tasks
  drop constraint tasks_request_id_organization_id_fkey,
  add constraint tasks_request_id_organization_id_fkey
    foreign key (request_id, organization_id)
    references requests(id, organization_id) on delete set null (request_id),
  drop constraint tasks_client_id_organization_id_fkey,
  add constraint tasks_client_id_organization_id_fkey
    foreign key (client_id, organization_id)
    references clients(id, organization_id) on delete set null (client_id),
  drop constraint tasks_department_id_organization_id_fkey,
  add constraint tasks_department_id_organization_id_fkey
    foreign key (department_id, organization_id)
    references departments(id, organization_id) on delete set null (department_id),
  drop constraint tasks_assigned_member_id_organization_id_fkey,
  add constraint tasks_assigned_member_id_organization_id_fkey
    foreign key (assigned_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null (assigned_member_id);

alter table documents
  drop constraint documents_client_id_organization_id_fkey,
  add constraint documents_client_id_organization_id_fkey
    foreign key (client_id, organization_id)
    references clients(id, organization_id) on delete set null (client_id),
  drop constraint documents_request_id_organization_id_fkey,
  add constraint documents_request_id_organization_id_fkey
    foreign key (request_id, organization_id)
    references requests(id, organization_id) on delete set null (request_id),
  drop constraint documents_department_id_organization_id_fkey,
  add constraint documents_department_id_organization_id_fkey
    foreign key (department_id, organization_id)
    references departments(id, organization_id) on delete set null (department_id),
  drop constraint documents_uploaded_by_member_id_organization_id_fkey,
  add constraint documents_uploaded_by_member_id_organization_id_fkey
    foreign key (uploaded_by_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null (uploaded_by_member_id);

alter table automation_rules
  drop constraint automation_rules_source_department_id_organization_id_fkey,
  add constraint automation_rules_source_department_id_organization_id_fkey
    foreign key (source_department_id, organization_id)
    references departments(id, organization_id) on delete set null (source_department_id),
  drop constraint automation_rules_target_department_id_organization_id_fkey,
  add constraint automation_rules_target_department_id_organization_id_fkey
    foreign key (target_department_id, organization_id)
    references departments(id, organization_id) on delete set null (target_department_id);

-- 5. VÍNCULO CON SUPABASE AUTH
create or replace function private.handle_auth_user_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email is null then
    return new;
  end if;

  if tg_op = 'INSERT' then
    insert into public.user_profiles (id, email, full_name)
    values (
      new.id,
      new.email,
      coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), new.email)
    )
    on conflict do nothing;
  elsif new.email is distinct from old.email then
    update public.user_profiles set email = new.email where id = new.id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_coreflow_auth_user_change on auth.users;
create trigger trg_coreflow_auth_user_change
after insert or update of email on auth.users
for each row execute function private.handle_auth_user_change();

insert into user_profiles (id, email, full_name)
select u.id, u.email, coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), u.email)
  from auth.users u
 where u.email is not null
on conflict do nothing;

alter table user_profiles
  add constraint user_profiles_id_auth_fkey
    foreign key (id) references auth.users(id) on delete cascade;
alter table platform_admins
  add constraint platform_admins_user_id_auth_fkey
    foreign key (user_id) references auth.users(id) on delete cascade;

-- 6. updated_at AUTOMÁTICO
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'plan_catalog', 'organizations', 'organization_entitlements', 'user_profiles',
    'organization_branches', 'departments', 'teams', 'roles', 'organization_members',
    'requests', 'platform_admins', 'organization_subscriptions', 'clients',
    'commercial_opportunities', 'tasks', 'documents', 'automation_rules'
  ] loop
    execute format('drop trigger if exists trg_touch_updated_at on public.%I', t);
    execute format(
      'create trigger trg_touch_updated_at before update on public.%I
       for each row execute function private.touch_updated_at()', t);
  end loop;
end;
$$;

-- 7. organization_id INMUTABLE: una fila no puede cambiar de tenant
create or replace function private.forbid_organization_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'TENANT_ISOLATION_VIOLATION: organization_id es inmutable en %.', tg_table_name;
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'organization_entitlements', 'organization_branches', 'departments', 'teams', 'roles',
    'role_permissions', 'organization_members', 'team_members', 'entity_timeline_events',
    'requests', 'approval_steps', 'organization_subscriptions', 'clients',
    'commercial_opportunities', 'tasks', 'documents', 'automation_rules'
  ] loop
    execute format('drop trigger if exists trg_forbid_organization_change on public.%I', t);
    execute format(
      'create trigger trg_forbid_organization_change before update of organization_id on public.%I
       for each row execute function private.forbid_organization_change()', t);
  end loop;
end;
$$;

-- 8. FUNCIONES BASE DE CAPACIDADES (única lectura autorizada de plan, overrides y vigencia)

-- El tenant existe y no fue archivado: se permite lectura aunque esté suspendido o vencido.
create or replace function private.org_can_read(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organizations o
     where o.id = p_org and o.deleted_at is null and o.status <> 'archived'
  );
$$;

-- El tenant está al día: organización operativa, suscripción activa y vigente.
create or replace function private.org_can_write(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.organizations o
      join public.organization_subscriptions s on s.organization_id = o.id
     where o.id = p_org
       and o.deleted_at is null
       and o.status in ('active', 'trial')
       and s.status in ('active', 'trialing')
       and s.valid_until > now()
  );
$$;

-- Capacidad contratada, sin considerar si el tenant está al día.
create or replace function private.org_entitled(p_org uuid, p_key text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_override jsonb;
  v_plan jsonb;
begin
  select oe.value_json into v_override
    from public.organization_entitlements oe
   where oe.organization_id = p_org and oe.entitlement_key = 'feature.' || p_key;

  if v_override is not null and jsonb_typeof(v_override) = 'boolean' then
    return (v_override #>> '{}')::boolean;
  end if;

  select pc.features_json -> p_key into v_plan
    from public.organization_subscriptions s
    join public.plan_catalog pc on pc.plan_code = s.plan_code
   where s.organization_id = p_org;

  return coalesce(jsonb_typeof(v_plan) = 'boolean' and (v_plan #>> '{}')::boolean, false);
end;
$$;

-- Capacidad utilizable ahora: contratada y con el tenant al día.
create or replace function private.org_feature(p_org uuid, p_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.org_can_write(p_org) and private.org_entitled(p_org, p_key);
$$;

-- Límite efectivo. Sin dato válido devuelve 0: ante la duda, se deniega.
create or replace function private.org_limit(p_org uuid, p_key text)
returns bigint
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_override jsonb;
  v_plan jsonb;
begin
  select oe.value_json into v_override
    from public.organization_entitlements oe
   where oe.organization_id = p_org and oe.entitlement_key = p_key;

  if v_override is not null and jsonb_typeof(v_override) = 'number' then
    return (v_override #>> '{}')::numeric::bigint;
  end if;

  select pc.limits_json -> p_key into v_plan
    from public.organization_subscriptions s
    join public.plan_catalog pc on pc.plan_code = s.plan_code
   where s.organization_id = p_org;

  if v_plan is null or jsonb_typeof(v_plan) <> 'number' then
    return 0;
  end if;
  return (v_plan #>> '{}')::numeric::bigint;
end;
$$;
