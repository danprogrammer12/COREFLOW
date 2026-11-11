-- =============================================================================
-- COREFLOW — MIGRACIÓN 012: APROVISIONAMIENTO ATÓMICO DE ORGANIZACIONES
-- Responsabilidad: crear de forma idempotente una organización con suscripción, sede,
-- departamento, roles, permisos y administrador inicial.
-- Las plantillas de roles llegan como parámetro desde permissionsCatalog.js, que
-- sigue siendo la única definición: no se duplican en SQL.
-- Reversión: supabase/rollbacks/012_organization_provisioning.down.sql
-- =============================================================================

create or replace function public.rpc_provision_organization(p jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_slug text := nullif(trim(p ->> 'slug'), '');
  v_display text := nullif(trim(p ->> 'display_name'), '');
  v_plan text := coalesce(p ->> 'plan_code', 'starter');
  v_org uuid;
  v_branch uuid;
  v_department uuid;
  v_role uuid;
  v_template jsonb;
  v_permission jsonb;
  v_admin_role uuid;
  v_admin_member uuid;
begin
  if not (private.admin_can('manage_tenants') or auth.role() = 'service_role') then
    raise exception 'PLATFORM_ADMIN_REQUIRED: Operación exclusiva de Platform Admin.';
  end if;
  if v_slug is null or v_display is null then
    raise exception 'VALIDATION_ERROR: slug y display_name son obligatorios.';
  end if;
  if jsonb_typeof(p -> 'role_templates') is distinct from 'array'
     or jsonb_array_length(p -> 'role_templates') = 0 then
    raise exception 'VALIDATION_ERROR: role_templates es obligatorio.';
  end if;
  if not exists (
    select 1 from public.plan_catalog pc where pc.plan_code = v_plan and pc.is_active
  ) then
    raise exception 'PLAN_NOT_AVAILABLE: El plan % no está disponible.', v_plan;
  end if;

  -- Solo el script administrativo reconcilia organizaciones existentes. Desde la API
  -- únicamente se crean tenants nuevos, para que nadie altere roles o se haga miembro
  -- de un tenant con datos.
  if auth.role() is distinct from 'service_role'
     and exists (select 1 from public.organizations o where o.slug = v_slug) then
    raise exception 'ORGANIZATION_ALREADY_EXISTS: Ya existe una organización con ese slug.';
  end if;

  -- Platform Admin es independiente de las membresías de clientes.
  if p ? 'admin_user_id' and exists (
    select 1 from public.platform_admins pa where pa.user_id = (p ->> 'admin_user_id')::uuid
  ) then
    raise exception 'VALIDATION_ERROR: Un Platform Admin no puede ser administrador de un tenant.';
  end if;

  insert into public.organizations (
    slug, legal_name, display_name, tax_id, sector, contracted_plan_code, status
  )
  values (
    v_slug,
    coalesce(p ->> 'legal_name', v_display),
    v_display,
    p ->> 'tax_id',
    p ->> 'sector',
    v_plan,
    'active'
  )
  on conflict (slug) do update
    set legal_name = excluded.legal_name,
        display_name = excluded.display_name,
        tax_id = coalesce(excluded.tax_id, public.organizations.tax_id),
        sector = coalesce(excluded.sector, public.organizations.sector)
  returning id into v_org;

  insert into public.organization_subscriptions (
    organization_id, plan_code, status, billing_cycle, valid_until, assigned_by, notes
  )
  values (
    v_org,
    v_plan,
    coalesce(p ->> 'subscription_status', 'active'),
    coalesce(p ->> 'billing_cycle', 'monthly'),
    coalesce((p ->> 'valid_until')::timestamptz, now() + interval '1 year'),
    auth.uid(),
    p ->> 'notes'
  )
  -- Repetir el aprovisionamiento nunca altera una suscripción existente: reactivaría
  -- tenants suspendidos o extendería vigencias. Esos cambios son operaciones explícitas.
  on conflict (organization_id) do nothing;

  select b.id into v_branch
    from public.organization_branches b
   where b.organization_id = v_org and b.code = 'SEDE-PRINCIPAL';
  if v_branch is null then
    insert into public.organization_branches (organization_id, code, name, city, is_main)
    values (v_org, 'SEDE-PRINCIPAL', 'Sede Principal', p ->> 'city', true)
    returning id into v_branch;
  end if;

  select d.id into v_department
    from public.departments d
   where d.organization_id = v_org and d.code = 'GEN';
  if v_department is null then
    insert into public.departments (organization_id, branch_id, code, name, description)
    values (v_org, v_branch, 'GEN', 'Operación General', 'Área principal de la organización')
    returning id into v_department;
  end if;

  for v_template in select value from jsonb_array_elements(p -> 'role_templates') loop
    insert into public.roles (
      organization_id, code, name, description, default_scope, is_system_role
    )
    values (
      v_org,
      v_template ->> 'code',
      v_template ->> 'name',
      v_template ->> 'description',
      v_template ->> 'defaultScope',
      true
    )
    on conflict (organization_id, code) do update
      set name = excluded.name,
          description = excluded.description,
          default_scope = excluded.default_scope
    returning id into v_role;

    for v_permission in select value from jsonb_array_elements(v_template -> 'permissions') loop
      insert into public.role_permissions (role_id, organization_id, permission_key, scope_override)
      values (v_role, v_org, v_permission ->> 'permissionKey', v_permission ->> 'scopeOverride')
      on conflict (role_id, permission_key) do update
        set scope_override = excluded.scope_override;
    end loop;
  end loop;

  if p ? 'admin_user_id' then
    select r.id into v_admin_role
      from public.roles r
     where r.organization_id = v_org and r.code = 'ORG_ADMIN';
    if v_admin_role is null then
      raise exception 'VALIDATION_ERROR: role_templates debe incluir ORG_ADMIN.';
    end if;

    select om.id into v_admin_member
      from public.organization_members om
     where om.organization_id = v_org and om.user_id = (p ->> 'admin_user_id')::uuid;

    if v_admin_member is null then
      insert into public.organization_members (
        organization_id, user_id, role_id, branch_id, department_id, job_title
      )
      values (
        v_org,
        (p ->> 'admin_user_id')::uuid,
        v_admin_role,
        v_branch,
        v_department,
        coalesce(p ->> 'admin_job_title', 'Administrador Organizacional')
      )
      returning id into v_admin_member;
    end if;
  end if;

  return jsonb_build_object(
    'organization_id', v_org,
    'branch_id', v_branch,
    'department_id', v_department,
    'admin_member_id', v_admin_member
  );
end;
$$;

revoke all on function public.rpc_provision_organization(jsonb) from public, anon;
grant execute on function public.rpc_provision_organization(jsonb) to authenticated, service_role;
