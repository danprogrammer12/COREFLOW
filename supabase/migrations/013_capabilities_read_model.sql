-- =============================================================================
-- COREFLOW — MIGRACIÓN 013: MODELO DE LECTURA DE CAPACIDADES Y USO
-- Responsabilidad: exponer, solo en lectura, las capacidades efectivas de un tenant
-- calculadas en el servidor y los contadores que Platform Admin necesita, sin abrirle
-- las tablas de estructura de los clientes.
-- Reversión: supabase/rollbacks/013_capabilities_read_model.down.sql
-- =============================================================================

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

create or replace function public.rpc_admin_organization_usage()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.admin_can('read') then
    raise exception 'PLATFORM_ADMIN_REQUIRED: Operación exclusiva de Platform Admin.';
  end if;

  return (
    select coalesce(
      jsonb_object_agg(
        o.id,
        jsonb_build_object(
          'members', (
            select count(*) from public.organization_members om
             where om.organization_id = o.id and om.deleted_at is null
          ),
          'active_collaborators', (
            select count(*) from public.organization_members om
             where om.organization_id = o.id and om.status = 'active' and om.deleted_at is null
          ),
          'branches', (
            select count(*) from public.organization_branches b
             where b.organization_id = o.id and b.deleted_at is null
          ),
          'departments', (
            select count(*) from public.departments d
             where d.organization_id = o.id and d.deleted_at is null
          ),
          'admin_member_ids', (
            select coalesce(jsonb_agg(om.id), '[]'::jsonb)
              from public.organization_members om
              join public.roles r on r.id = om.role_id and r.organization_id = om.organization_id
             where om.organization_id = o.id and r.code = 'ORG_ADMIN' and om.deleted_at is null
          )
        )
      ),
      '{}'::jsonb
    )
    from public.organizations o
    where o.deleted_at is null
  );
end;
$$;

revoke all on function public.rpc_get_org_capabilities(uuid) from public, anon;
revoke all on function public.rpc_admin_organization_usage() from public, anon;
grant execute on function public.rpc_get_org_capabilities(uuid) to authenticated;
grant execute on function public.rpc_admin_organization_usage() to authenticated;
