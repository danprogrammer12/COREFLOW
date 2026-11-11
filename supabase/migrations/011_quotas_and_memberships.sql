-- =============================================================================
-- COREFLOW — MIGRACIÓN 011: CUOTAS Y GESTIÓN DE MEMBRESÍAS
-- Responsabilidad: imponer en PostgreSQL los límites de colaboradores y sedes, con
-- bloqueo por organización, y gestionar membresías sin escalada de privilegios.
-- Reversión: supabase/rollbacks/011_quotas_and_memberships.down.sql
-- =============================================================================

-- 1. CUOTAS. El bloqueo de la fila de la organización serializa altas concurrentes.
create or replace function private.enforce_member_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used bigint;
  v_limit bigint;
begin
  if new.status not in ('active', 'invited') or new.deleted_at is not null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status in ('active', 'invited') and old.deleted_at is null then
    return new;
  end if;

  perform 1 from public.organizations o where o.id = new.organization_id for update;

  select count(*) into v_used
    from public.organization_members om
   where om.organization_id = new.organization_id
     and om.status in ('active', 'invited')
     and om.deleted_at is null;

  v_limit := private.org_limit(new.organization_id, 'max_collaborators');
  if v_used >= v_limit then
    raise exception 'COLLABORATOR_QUOTA_EXCEEDED: Límite de % colaboradores alcanzado.', v_limit;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_member_quota on organization_members;
create trigger trg_enforce_member_quota
before insert or update of status, deleted_at on organization_members
for each row execute function private.enforce_member_quota();

create or replace function private.enforce_branch_quota()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_used bigint;
  v_limit bigint;
begin
  if new.status <> 'active' or new.deleted_at is not null then
    return new;
  end if;
  if tg_op = 'UPDATE' and old.status = 'active' and old.deleted_at is null then
    return new;
  end if;

  perform 1 from public.organizations o where o.id = new.organization_id for update;

  select count(*) into v_used
    from public.organization_branches b
   where b.organization_id = new.organization_id
     and b.status = 'active'
     and b.deleted_at is null;

  v_limit := private.org_limit(new.organization_id, 'max_branches');
  if v_used >= v_limit then
    raise exception 'BRANCH_QUOTA_EXCEEDED: Límite de % sedes alcanzado.', v_limit;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_enforce_branch_quota on organization_branches;
create trigger trg_enforce_branch_quota
before insert or update of status, deleted_at on organization_branches
for each row execute function private.enforce_branch_quota();

-- 2. ANTIESCALADA: nadie asigna un rol con permisos que no posee
create or replace function private.role_within_actor(p_org uuid, p_role uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1
      from public.role_permissions target
     where target.role_id = p_role
       and target.organization_id = p_org
       and not private.has_perm(p_org, target.permission_key)
  );
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

-- 3. RPC DE MEMBRESÍAS
create or replace function public.rpc_invite_member(
  p_org uuid,
  p_email text,
  p_role_code text,
  p_branch uuid default null,
  p_department uuid default null,
  p_job_title text default 'Colaborador'
)
returns public.organization_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor public.organization_members;
  v_role uuid;
  v_user uuid;
  v_member public.organization_members;
begin
  v_actor := private.require_member(p_org);
  perform private.require_writable(p_org);

  if not private.has_perm(p_org, 'org:manage_members') then
    raise exception 'RBAC_PERMISSION_DENIED: Sin permiso org:manage_members.';
  end if;

  select r.id into v_role
    from public.roles r
   where r.organization_id = p_org and r.code = p_role_code;
  if v_role is null then
    raise exception 'ENTITY_NOT_FOUND: El rol no existe en la organización.';
  end if;
  if not private.role_within_actor(p_org, v_role) then
    raise exception 'RBAC_PERMISSION_DENIED: No puede asignar un rol con más permisos que el propio.';
  end if;

  select u.id into v_user
    from public.user_profiles u
   where lower(u.email) = lower(trim(p_email));
  if v_user is null then
    raise exception 'USER_NOT_FOUND: No existe una cuenta con ese correo.';
  end if;

  if exists (
    select 1 from public.organization_members om
     where om.organization_id = p_org and om.user_id = v_user
  ) then
    raise exception 'MEMBER_ALREADY_EXISTS: El usuario ya pertenece a la organización.';
  end if;

  insert into public.organization_members (
    organization_id, user_id, role_id, branch_id, department_id, job_title, status
  )
  values (
    p_org, v_user, v_role, coalesce(p_branch, v_actor.branch_id), p_department, p_job_title, 'invited'
  )
  returning * into v_member;

  return v_member;
end;
$$;

create or replace function public.rpc_accept_invitation(p_org uuid)
returns public.organization_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.organization_members;
begin
  -- Activar una membresía es una escritura: no procede en tenants no operativos.
  perform private.require_writable(p_org);

  update public.organization_members om
     set status = 'active'
   where om.organization_id = p_org
     and om.user_id = auth.uid()
     and om.status = 'invited'
     and om.deleted_at is null
   returning * into v_member;

  if v_member.id is null then
    raise exception 'ENTITY_NOT_FOUND: No hay una invitación pendiente en la organización.';
  end if;
  return v_member;
end;
$$;

create or replace function public.rpc_update_member(p_org uuid, p_member uuid, p_patch jsonb)
returns public.organization_members
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target public.organization_members;
  v_new_role uuid;
  v_new_status text;
  v_was_admin boolean;
begin
  perform private.require_member(p_org);
  perform private.require_writable(p_org);

  if not private.has_perm(p_org, 'org:manage_members') then
    raise exception 'RBAC_PERMISSION_DENIED: Sin permiso org:manage_members.';
  end if;

  -- Serializa cambios sobre administradores y cuotas de la organización
  perform 1 from public.organizations o where o.id = p_org for update;

  select * into v_target
    from public.organization_members om
   where om.id = p_member and om.organization_id = p_org and om.deleted_at is null;
  if not found then
    raise exception 'ENTITY_NOT_FOUND: El miembro no existe en la organización.';
  end if;

  if not private.role_within_actor(p_org, v_target.role_id) then
    raise exception 'RBAC_PERMISSION_DENIED: No puede modificar a un miembro con más permisos que el propio.';
  end if;

  v_new_role := v_target.role_id;
  if p_patch ? 'role_code' then
    select r.id into v_new_role
      from public.roles r
     where r.organization_id = p_org and r.code = p_patch ->> 'role_code';
    if v_new_role is null then
      raise exception 'ENTITY_NOT_FOUND: El rol no existe en la organización.';
    end if;
    if not private.role_within_actor(p_org, v_new_role) then
      raise exception 'RBAC_PERMISSION_DENIED: No puede asignar un rol con más permisos que el propio.';
    end if;
  end if;

  v_new_status := coalesce(p_patch ->> 'status', v_target.status);
  if v_new_status not in ('active', 'suspended', 'archived') then
    raise exception 'VALIDATION_ERROR: Estado de miembro no admitido.';
  end if;

  select r.code = 'ORG_ADMIN' into v_was_admin
    from public.roles r
   where r.id = v_target.role_id and r.organization_id = p_org;

  if v_was_admin
     and v_target.status = 'active'
     and (v_new_status <> 'active' or v_new_role <> v_target.role_id)
     and (
       select count(*)
         from public.organization_members om
         join public.roles r on r.id = om.role_id and r.organization_id = om.organization_id
        where om.organization_id = p_org
          and r.code = 'ORG_ADMIN'
          and om.status = 'active'
          and om.deleted_at is null
     ) <= 1 then
    raise exception 'LAST_ADMIN_PROTECTED: La organización debe conservar un administrador activo.';
  end if;

  update public.organization_members om
     set role_id = v_new_role,
         status = v_new_status,
         branch_id = coalesce((p_patch ->> 'branch_id')::uuid, om.branch_id),
         department_id = case
           when p_patch ? 'department_id' then (p_patch ->> 'department_id')::uuid
           else om.department_id
         end,
         job_title = coalesce(p_patch ->> 'job_title', om.job_title)
   where om.id = p_member
   returning * into v_target;

  return v_target;
end;
$$;

revoke all on function public.rpc_invite_member(uuid, text, text, uuid, uuid, text) from public, anon;
revoke all on function public.rpc_accept_invitation(uuid) from public, anon;
revoke all on function public.rpc_update_member(uuid, uuid, jsonb) from public, anon;
grant execute on function public.rpc_invite_member(uuid, text, text, uuid, uuid, text) to authenticated;
grant execute on function public.rpc_accept_invitation(uuid) to authenticated;
grant execute on function public.rpc_update_member(uuid, uuid, jsonb) to authenticated;
