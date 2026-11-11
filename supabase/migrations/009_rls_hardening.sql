-- =============================================================================
-- COREFLOW — MIGRACIÓN 009: ENDURECIMIENTO DE ROW LEVEL SECURITY
-- Responsabilidad: alcance de datos en lecturas, tenant al día en escrituras,
-- niveles de Platform Admin, políticas faltantes y Storage robusto.
-- Las escrituras de solicitudes, aprobaciones, auditoría y membresías dejan de ser
-- directas: pasan a las RPC de 010 y 011.
-- Reversión: supabase/rollbacks/009_rls_hardening.down.sql
-- =============================================================================

-- 1. FUNCIONES DE IDENTIDAD Y AUTORIZACIÓN
create or replace function private.member_row(p_org uuid)
returns public.organization_members
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v public.organization_members;
begin
  select * into v
    from public.organization_members om
   where om.organization_id = p_org
     and om.user_id = auth.uid()
     and om.status = 'active'
     and om.deleted_at is null;
  return v;
end;
$$;

create or replace function private.member_id(p_org uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select (private.member_row(p_org)).id;
$$;

create or replace function private.is_reader(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.member_id(p_org) is not null and private.org_can_read(p_org);
$$;

create or replace function private.has_perm(p_org uuid, p_perm text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_reader(p_org) and exists (
    select 1
      from public.role_permissions rp
     where rp.organization_id = p_org
       and rp.role_id = (private.member_row(p_org)).role_id
       and rp.permission_key = p_perm
  );
$$;

create or replace function private.can_write_perm(p_org uuid, p_perm text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_perm(p_org, p_perm) and private.org_can_write(p_org);
$$;

-- Permiso más alcance de datos sobre una fila concreta.
-- Sin `granular_permissions` en el plan, el permiso aplica a toda la organización.
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

  -- TEAM_OR_ASSIGNED: asignado a un compañero de equipo
  return p_assigned is not null and exists (
    select 1
      from public.team_members mine
      join public.team_members other on other.team_id = mine.team_id
     where mine.member_id = v_member.id
       and other.member_id = p_assigned
  );
end;
$$;

create or replace function private.shares_org(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.organization_members theirs
      join public.organization_members mine
        on mine.organization_id = theirs.organization_id
     where theirs.user_id = p_user
       and theirs.deleted_at is null
       and mine.user_id = auth.uid()
       and mine.status = 'active'
       and mine.deleted_at is null
  );
$$;

create or replace function private.role_is_custom(p_org uuid, p_role uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.roles r
     where r.id = p_role and r.organization_id = p_org and not r.is_system_role
  );
$$;

-- Niveles de Platform Admin:
--   SUPER_ADMIN todo · PLATFORM_OPS tenants y lectura · PLATFORM_AUDITOR solo lectura
create or replace function private.admin_can(p_action text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.platform_admins pa
     where pa.user_id = auth.uid()
       and pa.status = 'active'
       and case pa.role_level
             when 'SUPER_ADMIN' then true
             when 'PLATFORM_OPS' then p_action in ('read', 'manage_tenants')
             when 'PLATFORM_AUDITOR' then p_action = 'read'
             else false
           end
  );
$$;

-- 2. STORAGE: extracción segura del tenant y cuota
create or replace function private.storage_path_org(p_name text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_first text := split_part(p_name, '/', 1);
begin
  if v_first ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return v_first::uuid;
  end if;
  return null;
end;
$$;

create or replace function private.org_storage_has_room(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(sum((o.metadata ->> 'size')::bigint), 0)
           < private.org_limit(p_org, 'max_storage_mb') * 1048576
    from storage.objects o
   where o.bucket_id = 'coreflow-documents'
     and private.storage_path_org(o.name) = p_org;
$$;

create or replace function private.storage_can(p_name text, p_action text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.storage_path_org(p_name);
begin
  if v_org is null then
    return false;
  end if;
  return case p_action
    when 'read' then private.has_perm(v_org, 'documents:read')
    when 'write' then private.can_write_perm(v_org, 'documents:write')
                      and private.org_storage_has_room(v_org)
    when 'delete' then private.can_write_perm(v_org, 'documents:approve')
    else false
  end;
end;
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

-- 3. RESPALDO Y RETIRO DE LAS POLÍTICAS ANTERIORES (la reversión las recrea desde aquí)
create table if not exists private.policy_backup_009 as
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
  from pg_policies
 where schemaname = 'public'
    or (schemaname = 'storage' and policyname like 'storage_docs:%');

revoke all on private.policy_backup_009 from public, anon, authenticated;

do $$
declare
  p record;
begin
  for p in select schemaname, tablename, policyname from private.policy_backup_009 loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end;
$$;

-- 4. CATÁLOGO, ORGANIZACIONES Y PLATAFORMA
create policy "cf: plan_catalog select" on plan_catalog
  for select to authenticated using (true);
create policy "cf: plan_catalog insert" on plan_catalog
  for insert to authenticated with check (private.admin_can('manage_catalog'));
create policy "cf: plan_catalog update" on plan_catalog
  for update to authenticated
  using (private.admin_can('manage_catalog'))
  with check (private.admin_can('manage_catalog'));

create policy "cf: organizations select" on organizations
  for select to authenticated
  using ((deleted_at is null and private.is_reader(id)) or private.admin_can('read'));
create policy "cf: organizations insert" on organizations
  for insert to authenticated with check (private.admin_can('manage_tenants'));
create policy "cf: organizations update" on organizations
  for update to authenticated
  using (private.admin_can('manage_tenants'))
  with check (private.admin_can('manage_tenants'));

create policy "cf: subscriptions select" on organization_subscriptions
  for select to authenticated
  using (private.is_reader(organization_id) or private.admin_can('read'));
create policy "cf: subscriptions insert" on organization_subscriptions
  for insert to authenticated with check (private.admin_can('manage_tenants'));
create policy "cf: subscriptions update" on organization_subscriptions
  for update to authenticated
  using (private.admin_can('manage_tenants'))
  with check (private.admin_can('manage_tenants'));

create policy "cf: entitlements select" on organization_entitlements
  for select to authenticated
  using (private.is_reader(organization_id) or private.admin_can('read'));
create policy "cf: entitlements insert" on organization_entitlements
  for insert to authenticated with check (private.admin_can('manage_tenants'));
create policy "cf: entitlements update" on organization_entitlements
  for update to authenticated
  using (private.admin_can('manage_tenants'))
  with check (private.admin_can('manage_tenants'));

create policy "cf: platform_admins select" on platform_admins
  for select to authenticated
  using (user_id = (select auth.uid()) or private.admin_can('read'));

create policy "cf: user_profiles select" on user_profiles
  for select to authenticated
  using (id = (select auth.uid()) or private.shares_org(id) or private.admin_can('read'));
create policy "cf: user_profiles update" on user_profiles
  for update to authenticated
  using (id = (select auth.uid()) or private.admin_can('manage_tenants'))
  with check (id = (select auth.uid()) or private.admin_can('manage_tenants'));

-- El correo lo administra Supabase Auth; se sincroniza por trigger.
revoke update on user_profiles from anon, authenticated;
grant update (full_name, avatar_url, phone, preferred_locale) on user_profiles to authenticated;

-- 5. ESTRUCTURA ORGANIZACIONAL
create policy "cf: branches select" on organization_branches
  for select to authenticated
  using (deleted_at is null and private.is_reader(organization_id));
create policy "cf: branches insert" on organization_branches
  for insert to authenticated
  with check (private.can_write_perm(organization_id, 'org:manage_branches'));
create policy "cf: branches update" on organization_branches
  for update to authenticated
  using (private.can_write_perm(organization_id, 'org:manage_branches'))
  with check (private.can_write_perm(organization_id, 'org:manage_branches'));

create policy "cf: departments select" on departments
  for select to authenticated
  using (deleted_at is null and private.is_reader(organization_id));
create policy "cf: departments insert" on departments
  for insert to authenticated
  with check (
    private.can_write_perm(organization_id, 'org:manage_departments')
    and private.org_entitled(organization_id, 'departments_and_teams')
  );
create policy "cf: departments update" on departments
  for update to authenticated
  using (
    private.can_write_perm(organization_id, 'org:manage_departments')
    and private.org_entitled(organization_id, 'departments_and_teams')
  )
  with check (
    private.can_write_perm(organization_id, 'org:manage_departments')
    and private.org_entitled(organization_id, 'departments_and_teams')
  );

create policy "cf: teams select" on teams
  for select to authenticated
  using (deleted_at is null and private.is_reader(organization_id));
create policy "cf: teams insert" on teams
  for insert to authenticated
  with check (
    private.can_write_perm(organization_id, 'org:manage_departments')
    and private.org_entitled(organization_id, 'departments_and_teams')
  );
create policy "cf: teams update" on teams
  for update to authenticated
  using (
    private.can_write_perm(organization_id, 'org:manage_departments')
    and private.org_entitled(organization_id, 'departments_and_teams')
  )
  with check (
    private.can_write_perm(organization_id, 'org:manage_departments')
    and private.org_entitled(organization_id, 'departments_and_teams')
  );

create policy "cf: team_members select" on team_members
  for select to authenticated using (private.is_reader(organization_id));
create policy "cf: team_members insert" on team_members
  for insert to authenticated
  with check (
    private.can_write_perm(organization_id, 'org:manage_departments')
    and private.org_entitled(organization_id, 'departments_and_teams')
  );
create policy "cf: team_members delete" on team_members
  for delete to authenticated
  using (
    private.can_write_perm(organization_id, 'org:manage_departments')
    and private.org_entitled(organization_id, 'departments_and_teams')
  );

-- Roles: solo los personalizados son editables y requieren permisos granulares
create policy "cf: roles select" on roles
  for select to authenticated using (private.is_reader(organization_id));
create policy "cf: roles insert" on roles
  for insert to authenticated
  with check (
    not is_system_role
    and private.can_write_perm(organization_id, 'security:manage_roles')
    and private.org_entitled(organization_id, 'granular_permissions')
  );
create policy "cf: roles update" on roles
  for update to authenticated
  using (
    not is_system_role
    and private.can_write_perm(organization_id, 'security:manage_roles')
    and private.org_entitled(organization_id, 'granular_permissions')
  )
  with check (
    not is_system_role
    and private.can_write_perm(organization_id, 'security:manage_roles')
    and private.org_entitled(organization_id, 'granular_permissions')
  );

create policy "cf: role_permissions select" on role_permissions
  for select to authenticated using (private.is_reader(organization_id));
create policy "cf: role_permissions insert" on role_permissions
  for insert to authenticated
  with check (
    private.role_is_custom(organization_id, role_id)
    and private.can_write_perm(organization_id, 'security:manage_roles')
    and private.org_entitled(organization_id, 'granular_permissions')
  );
create policy "cf: role_permissions delete" on role_permissions
  for delete to authenticated
  using (
    private.role_is_custom(organization_id, role_id)
    and private.can_write_perm(organization_id, 'security:manage_roles')
    and private.org_entitled(organization_id, 'granular_permissions')
  );

-- Membresías: lectura directa; toda escritura pasa por las RPC de 011 y 012
create policy "cf: members select" on organization_members
  for select to authenticated
  using (
    private.is_reader(organization_id)
    or user_id = (select auth.uid())
    or private.admin_can('read')
  );

-- 6. AUDITORÍA Y BITÁCORA: solo lectura desde la API; se escriben en el servidor
create policy "cf: audit_logs select" on audit_logs
  for select to authenticated
  using (
    private.can_row(organization_id, 'audit:read_logs', null, null, actor_member_id)
    or private.admin_can('read')
  );

create policy "cf: timeline select" on entity_timeline_events
  for select to authenticated using (private.is_reader(organization_id));

-- 7. SOLICITUDES Y APROBACIONES: lectura con alcance; escritura por las RPC de 010
create policy "cf: requests select" on requests
  for select to authenticated
  using (
    deleted_at is null
    and (
      private.can_row(organization_id, 'requests:read', branch_id, department_id, assigned_member_id)
      or (private.is_reader(organization_id) and created_by_member_id = private.member_id(organization_id))
    )
  );

create policy "cf: approval_steps select" on approval_steps
  for select to authenticated
  using (
    private.is_reader(organization_id)
    and (
      exists (select 1 from requests r where r.id = approval_steps.request_id)
      or target_department_id = (private.member_row(organization_id)).department_id
    )
  );

-- 8. MÓDULOS OPERATIVOS
create policy "cf: clients select" on clients
  for select to authenticated
  using (
    deleted_at is null
    and private.can_row(organization_id, 'clients:read', branch_id, null, owner_member_id)
  );
create policy "cf: clients insert" on clients
  for insert to authenticated
  with check (private.can_write_perm(organization_id, 'clients:write'));
create policy "cf: clients update" on clients
  for update to authenticated
  using (
    private.org_can_write(organization_id)
    and private.can_row(organization_id, 'clients:write', branch_id, null, owner_member_id)
  )
  with check (
    private.org_can_write(organization_id)
    and private.can_row(organization_id, 'clients:write', branch_id, null, owner_member_id)
  );

create policy "cf: opportunities select" on commercial_opportunities
  for select to authenticated
  using (
    deleted_at is null
    and private.can_row(organization_id, 'opportunities:read', null, null, owner_member_id)
  );
create policy "cf: opportunities insert" on commercial_opportunities
  for insert to authenticated
  with check (private.can_write_perm(organization_id, 'opportunities:write'));
create policy "cf: opportunities update" on commercial_opportunities
  for update to authenticated
  using (
    private.org_can_write(organization_id)
    and private.can_row(organization_id, 'opportunities:write', null, null, owner_member_id)
  )
  with check (
    private.org_can_write(organization_id)
    and private.can_row(organization_id, 'opportunities:write', null, null, owner_member_id)
  );

create policy "cf: tasks select" on tasks
  for select to authenticated
  using (
    deleted_at is null
    and private.can_row(organization_id, 'tasks:read', null, department_id, assigned_member_id)
  );
create policy "cf: tasks insert" on tasks
  for insert to authenticated
  with check (private.can_write_perm(organization_id, 'tasks:write'));
create policy "cf: tasks update" on tasks
  for update to authenticated
  using (
    private.org_can_write(organization_id)
    and private.can_row(organization_id, 'tasks:write', null, department_id, assigned_member_id)
  )
  with check (
    private.org_can_write(organization_id)
    and private.can_row(organization_id, 'tasks:write', null, department_id, assigned_member_id)
  );

create policy "cf: documents select" on documents
  for select to authenticated
  using (
    deleted_at is null
    and private.can_row(organization_id, 'documents:read', null, department_id, uploaded_by_member_id)
  );
create policy "cf: documents insert" on documents
  for insert to authenticated
  with check (
    private.can_write_perm(organization_id, 'documents:write')
    and uploaded_by_member_id = private.member_id(organization_id)
    and private.storage_path_org(storage_path) = organization_id
  );
create policy "cf: documents update" on documents
  for update to authenticated
  using (
    private.org_can_write(organization_id)
    and private.can_row(organization_id, 'documents:approve', null, department_id, uploaded_by_member_id)
  )
  with check (
    private.org_can_write(organization_id)
    and private.can_row(organization_id, 'documents:approve', null, department_id, uploaded_by_member_id)
    and private.storage_path_org(storage_path) = organization_id
  );

create policy "cf: automation_rules select" on automation_rules
  for select to authenticated using (private.is_reader(organization_id));
create policy "cf: automation_rules insert" on automation_rules
  for insert to authenticated
  with check (
    private.can_write_perm(organization_id, 'automations:write')
    and private.org_feature(
      organization_id,
      case scope_type
        when 'cross_department_workflow' then 'cross_area_automations'
        else 'basic_automations'
      end
    )
  );
create policy "cf: automation_rules update" on automation_rules
  for update to authenticated
  using (private.can_write_perm(organization_id, 'automations:write'))
  with check (
    private.can_write_perm(organization_id, 'automations:write')
    and private.org_feature(
      organization_id,
      case scope_type
        when 'cross_department_workflow' then 'cross_area_automations'
        else 'basic_automations'
      end
    )
  );

-- 9. STORAGE PRIVADO
create policy "storage_docs: lectura" on storage.objects
  for select to authenticated
  using (bucket_id = 'coreflow-documents' and private.storage_can(name, 'read'));
create policy "storage_docs: carga" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'coreflow-documents' and private.storage_can(name, 'write'));
create policy "storage_docs: reemplazo" on storage.objects
  for update to authenticated
  using (bucket_id = 'coreflow-documents' and private.storage_can(name, 'write'))
  with check (bucket_id = 'coreflow-documents' and private.storage_can(name, 'write'));
create policy "storage_docs: eliminacion" on storage.objects
  for delete to authenticated
  using (bucket_id = 'coreflow-documents' and private.storage_can(name, 'delete'));

-- 10. LAS FUNCIONES ANTERIORES DEJAN DE SER INVOCABLES DESDE LA API
revoke execute on function public.app_user_active_org_ids() from public, anon, authenticated;
revoke execute on function public.app_has_active_membership(uuid) from public, anon, authenticated;
revoke execute on function public.app_has_org_permission(uuid, text) from public, anon, authenticated;
revoke execute on function public.app_is_platform_admin() from public, anon, authenticated;
revoke execute on function public.app_org_has_feature(uuid, text) from public, anon, authenticated;
