-- =============================================================================
-- COREFLOW — MIGRACIÓN 014: ESPECIFICACIÓN STARTER v1.0
-- Responsabilidad: catálogo Starter sin IA y sin capacidad fija, límites de
-- administradores y automatizaciones activas, roles predefinidos y su alcance.
-- Reversión: supabase/rollbacks/014_starter_spec_v1.down.sql
-- =============================================================================

-- 1. CATÁLOGO. El almacenamiento queda sin valor hasta que Platform Admin lo configure.
update plan_catalog
   set features_json = features_json || '{"ai_assistant": false}'::jsonb,
       limits_json = (limits_json - 'max_storage_mb')
                     || '{"max_admins": 2, "max_active_automations": 3}'::jsonb
 where plan_code = 'starter';

-- 2. LÍMITE OPCIONAL: NULL significa que el límite no aplica o no está configurado.
create or replace function private.org_limit_optional(p_org uuid, p_key text)
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
    return null;
  end if;
  return (v_plan #>> '{}')::numeric::bigint;
end;
$$;

-- 3. ALCANCE: los roles predefinidos conservan su alcance en todos los planes.
-- "Sin permisos granulares" significa que los roles no se pueden personalizar.
create or replace function private.can_row(
  p_org uuid,
  p_perm text,
  p_branch uuid,
  p_department uuid,
  p_assigned uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_member public.organization_members;
  v_scope text;
begin
  v_member := private.member_row(p_org);
  if v_member.id is null or not private.org_can_read(p_org) then
    return false;
  end if;

  select coalesce(rp.scope_override, r.default_scope) into v_scope
    from public.role_permissions rp
    join public.roles r on r.id = rp.role_id and r.organization_id = rp.organization_id
   where rp.organization_id = p_org
     and rp.role_id = v_member.role_id
     and rp.permission_key = p_perm;

  if v_scope is null then
    return false;
  end if;
  if v_scope = 'ORG_WIDE' then
    return true;
  end if;
  if p_assigned is not null and p_assigned = v_member.id then
    return true;
  end if;
  if v_scope = 'BRANCH_SCOPE' then
    return coalesce(p_branch = v_member.branch_id, false);
  end if;
  if v_scope = 'DEPARTMENT_SCOPE' then
    return coalesce(p_department = v_member.department_id, false);
  end if;

  return p_assigned is not null and exists (
    select 1
      from public.team_members mine
      join public.team_members other on other.team_id = mine.team_id
     where mine.member_id = v_member.id
       and other.member_id = p_assigned
  );
end;
$$;

-- 4. MÁXIMO DE ADMINISTRADORES
create or replace function private.enforce_admin_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_admin boolean;
  v_limit bigint;
  v_used bigint;
begin
  if new.status not in ('active', 'invited') or new.deleted_at is not null then
    return new;
  end if;

  select r.code = 'ORG_ADMIN' into v_is_admin
    from public.roles r
   where r.id = new.role_id and r.organization_id = new.organization_id;
  if not coalesce(v_is_admin, false) then
    return new;
  end if;

  if tg_op = 'UPDATE'
     and old.role_id = new.role_id
     and old.status in ('active', 'invited')
     and old.deleted_at is null then
    return new;
  end if;

  v_limit := private.org_limit_optional(new.organization_id, 'max_admins');
  if v_limit is null then
    return new;
  end if;

  perform 1 from public.organizations o where o.id = new.organization_id for update;

  select count(*) into v_used
    from public.organization_members om
    join public.roles r on r.id = om.role_id and r.organization_id = om.organization_id
   where om.organization_id = new.organization_id
     and om.id <> new.id
     and r.code = 'ORG_ADMIN'
     and om.status in ('active', 'invited')
     and om.deleted_at is null;

  if v_used >= v_limit then
    raise exception 'ADMIN_QUOTA_EXCEEDED: Límite de % administradores alcanzado.', v_limit;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_admin_quota on organization_members;
create trigger trg_enforce_admin_quota
before insert or update of role_id, status, deleted_at on organization_members
for each row execute function private.enforce_admin_quota();

-- 5. MÁXIMO DE AUTOMATIZACIONES ACTIVAS
create or replace function private.enforce_automation_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_limit bigint;
  v_used bigint;
begin
  if new.status <> 'active' then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'active' then
    return new;
  end if;

  v_limit := private.org_limit_optional(new.organization_id, 'max_active_automations');
  if v_limit is null then
    return new;
  end if;

  perform 1 from public.organizations o where o.id = new.organization_id for update;

  select count(*) into v_used
    from public.automation_rules a
   where a.organization_id = new.organization_id
     and a.id <> new.id
     and a.status = 'active';

  if v_used >= v_limit then
    raise exception 'AUTOMATION_QUOTA_EXCEEDED: Límite de % automatizaciones activas alcanzado.', v_limit;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_automation_quota on automation_rules;
create trigger trg_enforce_automation_quota
before insert or update of status on automation_rules
for each row execute function private.enforce_automation_quota();

-- 6. ROLES DE STARTER: solo los tres predefinidos
create or replace function private.enforce_plan_roles()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan text;
begin
  select s.plan_code into v_plan
    from public.organization_subscriptions s
   where s.organization_id = new.organization_id;

  if v_plan = 'starter' and new.code not in ('ORG_ADMIN', 'SUPERVISOR', 'COLLABORATOR') then
    raise exception 'ROLE_NOT_ALLOWED_IN_PLAN: Starter solo admite Administrador, Supervisor y Colaborador.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_plan_roles on roles;
create trigger trg_enforce_plan_roles
before insert or update of code on roles
for each row execute function private.enforce_plan_roles();

-- 7. ÁREA ÚNICA: sin departamentos en el plan, el miembro pertenece al área general
create or replace function private.default_member_department()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.department_id is null
     and not private.org_entitled(new.organization_id, 'departments_and_teams') then
    select d.id into new.department_id
      from public.departments d
     where d.organization_id = new.organization_id
       and d.status = 'active'
       and d.deleted_at is null
     order by d.created_at
     limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_default_member_department on organization_members;
create trigger trg_default_member_department
before insert on organization_members
for each row execute function private.default_member_department();

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

-- 8. ARCHIVAR CLIENTES: una fila archivada deja de ser visible, por lo que un
-- UPDATE directo lo rechazaría la política de lectura.
create or replace function public.rpc_archive_client(p_org uuid, p_client uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client public.clients;
begin
  perform private.require_member(p_org);
  perform private.require_writable(p_org);

  if not private.has_perm(p_org, 'clients:write') then
    raise exception 'RBAC_PERMISSION_DENIED: Sin permiso clients:write.';
  end if;

  select * into v_client
    from public.clients c
   where c.id = p_client and c.organization_id = p_org and c.deleted_at is null
   for update;
  if not found then
    raise exception 'ENTITY_NOT_FOUND: El cliente no existe en la organización.';
  end if;
  if not private.can_row(p_org, 'clients:write', v_client.branch_id, null, v_client.owner_member_id) then
    raise exception 'SCOPE_RESTRICTION_VIOLATION: Fuera del alcance de datos del rol.';
  end if;

  update public.clients set deleted_at = now() where id = p_client;
end;
$$;

revoke all on function public.rpc_archive_client(uuid, uuid) from public, anon;
grant execute on function public.rpc_archive_client(uuid, uuid) to authenticated;

-- 9. CAPACIDADES: un límite NULL indica que no aplica o no está configurado
create or replace function public.rpc_get_org_capabilities(p_org uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_plan public.plan_catalog;
  v_subscription public.organization_subscriptions;
  v_features jsonb;
  v_collaborators bigint;
  v_branches bigint;
  v_admins bigint;
  v_automations bigint;
  v_storage_bytes bigint;
begin
  if not (private.is_reader(p_org) or private.admin_can('read')) then
    raise exception 'TENANT_ISOLATION_VIOLATION: Sin acceso a la organización.';
  end if;

  select * into v_subscription
    from public.organization_subscriptions s
   where s.organization_id = p_org;
  if not found then
    raise exception 'ENTITY_NOT_FOUND: La organización no tiene suscripción.';
  end if;

  select * into v_plan
    from public.plan_catalog pc
   where pc.plan_code = v_subscription.plan_code;

  select coalesce(jsonb_object_agg(k.key, private.org_entitled(p_org, k.key)), '{}'::jsonb)
    into v_features
    from (
      select jsonb_object_keys(v_plan.features_json) as key
      union
      select substr(oe.entitlement_key, 9)
        from public.organization_entitlements oe
       where oe.organization_id = p_org and oe.entitlement_key like 'feature.%'
    ) k;

  select count(*) into v_collaborators
    from public.organization_members om
   where om.organization_id = p_org
     and om.status in ('active', 'invited')
     and om.deleted_at is null;

  select count(*) into v_admins
    from public.organization_members om
    join public.roles r on r.id = om.role_id and r.organization_id = om.organization_id
   where om.organization_id = p_org
     and r.code = 'ORG_ADMIN'
     and om.status in ('active', 'invited')
     and om.deleted_at is null;

  select count(*) into v_branches
    from public.organization_branches b
   where b.organization_id = p_org and b.status = 'active' and b.deleted_at is null;

  select count(*) into v_automations
    from public.automation_rules a
   where a.organization_id = p_org and a.status = 'active';

  select coalesce(sum((o.metadata ->> 'size')::bigint), 0) into v_storage_bytes
    from storage.objects o
   where o.bucket_id = 'coreflow-documents'
     and private.storage_path_org(o.name) = p_org;

  return jsonb_build_object(
    'plan_code', v_subscription.plan_code,
    'plan_name', v_plan.display_name,
    'collaborators_range_label', v_plan.collaborators_range_label,
    'default_approval_summary', v_plan.default_approval_summary,
    'subscription_status', v_subscription.status,
    'valid_until', v_subscription.valid_until,
    'can_write', private.org_can_write(p_org),
    'features', v_features,
    'limits', jsonb_build_object(
      'max_collaborators', private.org_limit_optional(p_org, 'max_collaborators'),
      'max_branches', private.org_limit_optional(p_org, 'max_branches'),
      'max_storage_mb', private.org_limit_optional(p_org, 'max_storage_mb'),
      'max_admins', private.org_limit_optional(p_org, 'max_admins'),
      'max_active_automations', private.org_limit_optional(p_org, 'max_active_automations')
    ),
    'usage', jsonb_build_object(
      'collaborators', v_collaborators,
      'branches', v_branches,
      'admins', v_admins,
      'active_automations', v_automations,
      'storage_bytes', v_storage_bytes
    )
  );
end;
$$;
