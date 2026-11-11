-- =============================================================================
-- COREFLOW — REVERSIÓN DE LA MIGRACIÓN 014
-- Aplicar solo después de revertir 016 y 015.
-- Límite: el catálogo Starter vuelve a los valores sembrados por 005. Cualquier
-- capacidad configurada después en el plan se pierde.
-- =============================================================================

drop function public.rpc_archive_client(uuid, uuid);

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

  select count(*) into v_branches
    from public.organization_branches b
   where b.organization_id = p_org and b.status = 'active' and b.deleted_at is null;

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
      'max_collaborators', private.org_limit(p_org, 'max_collaborators'),
      'max_branches', private.org_limit(p_org, 'max_branches'),
      'max_storage_mb', private.org_limit(p_org, 'max_storage_mb')
    ),
    'usage', jsonb_build_object(
      'collaborators', v_collaborators,
      'branches', v_branches,
      'storage_bytes', v_storage_bytes
    )
  );
end;
$$;

drop trigger if exists trg_default_member_department on organization_members;
drop trigger if exists trg_enforce_plan_roles on roles;
drop trigger if exists trg_enforce_automation_quota on automation_rules;
drop trigger if exists trg_enforce_admin_quota on organization_members;

drop function private.default_member_department();
drop function private.enforce_plan_roles();
drop function private.enforce_automation_quota();
drop function private.enforce_admin_quota();

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
  if v_scope = 'ORG_WIDE' or not private.org_entitled(p_org, 'granular_permissions') then
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

drop function private.org_limit_optional(uuid, text);

update plan_catalog
   set features_json = features_json || '{"ai_assistant": true}'::jsonb,
       limits_json = (limits_json - 'max_admins' - 'max_active_automations')
                     || '{"max_storage_mb": 5120}'::jsonb
 where plan_code = 'starter';
