-- =============================================================================
-- COREFLOW — MIGRACIÓN 010: AUDITORÍA EN SERVIDOR Y FLUJOS TRANSACCIONALES
-- Responsabilidad: la auditoría deriva el actor de auth.uid() y sanea en servidor;
-- la creación, transición y aprobación de solicitudes ocurren en RPC atómicas.
-- Reversión: supabase/rollbacks/010_server_workflows_and_audit.down.sql
-- =============================================================================

-- 1. AUDITORÍA
alter table audit_logs
  add column if not exists origin text not null default 'server'
    check (origin in ('server', 'client'));

create or replace function private.forbid_audit_truncate()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'SECURITY_POLICY_VIOLATION: audit_logs es inmutable. No se permite TRUNCATE.';
end;
$$;

drop trigger if exists trg_forbid_audit_truncate on audit_logs;
create trigger trg_forbid_audit_truncate
before truncate on audit_logs
for each statement execute function private.forbid_audit_truncate();

-- Misma lista de claves sensibles que src/core/domain/auditSanitizer.js
create or replace function private.sanitize_jsonb(p_value jsonb, p_depth int default 0)
returns jsonb
language plpgsql
immutable
set search_path = ''
as $$
declare
  v_result jsonb;
  v_key text;
  v_item jsonb;
begin
  if p_value is null or p_depth > 8 then
    return p_value;
  end if;

  if jsonb_typeof(p_value) = 'array' then
    v_result := '[]'::jsonb;
    for v_item in select value from jsonb_array_elements(p_value) loop
      v_result := v_result || jsonb_build_array(private.sanitize_jsonb(v_item, p_depth + 1));
    end loop;
    return v_result;
  end if;

  if jsonb_typeof(p_value) <> 'object' then
    return p_value;
  end if;

  v_result := '{}'::jsonb;
  for v_key, v_item in select key, value from jsonb_each(p_value) loop
    if v_key ~* 'password|passphrase|secret|token|api_?key|private_?key|hash|credential|jwt|authorization|cookie|ssn|credit_?card' then
      v_result := v_result || jsonb_build_object(v_key, '[REDACTED]');
    else
      v_result := v_result || jsonb_build_object(v_key, private.sanitize_jsonb(v_item, p_depth + 1));
    end if;
  end loop;
  return v_result;
end;
$$;

create or replace function private.write_audit(
  p_org uuid,
  p_module text,
  p_entity_type text,
  p_entity_id text,
  p_action text,
  p_summary text,
  p_changes jsonb,
  p_origin text default 'server'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_member_id uuid;
  v_role text;
begin
  if v_uid is not null and p_org is not null then
    select om.id, r.code into v_member_id, v_role
      from public.organization_members om
      join public.roles r on r.id = om.role_id and r.organization_id = om.organization_id
     where om.organization_id = p_org and om.user_id = v_uid;
  end if;

  if v_role is null and v_uid is not null then
    select 'PLATFORM_' || pa.role_level into v_role
      from public.platform_admins pa
     where pa.user_id = v_uid;
  end if;

  insert into public.audit_logs (
    organization_id, actor_user_id, actor_member_id, actor_role_code,
    module, entity_type, entity_id, action, summary, sanitized_changes, origin
  )
  values (
    p_org,
    coalesce(v_uid, '00000000-0000-0000-0000-000000000000'::uuid),
    v_member_id,
    coalesce(v_role, 'SYSTEM'),
    p_module, p_entity_type, p_entity_id, p_action, p_summary,
    private.sanitize_jsonb(coalesce(p_changes, '{}'::jsonb)),
    p_origin
  );
end;
$$;

create or replace function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row jsonb;
  v_changes jsonb;
  v_org uuid;
begin
  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
    v_changes := v_row;
  elsif tg_op = 'INSERT' then
    v_row := to_jsonb(new);
    v_changes := v_row;
  else
    v_row := to_jsonb(new);
    select coalesce(
             jsonb_object_agg(n.key, jsonb_build_object('from', o.value, 'to', n.value)),
             '{}'::jsonb
           )
      into v_changes
      from jsonb_each(to_jsonb(new)) n
      join jsonb_each(to_jsonb(old)) o on o.key = n.key
     where n.value is distinct from o.value
       and n.key <> 'updated_at';
    if v_changes = '{}'::jsonb then
      return null;
    end if;
  end if;

  v_org := case
    when tg_table_name = 'organizations' then (v_row ->> 'id')::uuid
    else (v_row ->> 'organization_id')::uuid
  end;

  perform private.write_audit(
    v_org,
    'db.' || tg_table_name,
    tg_table_name,
    coalesce(v_row ->> 'id', v_row ->> 'plan_code', v_row ->> 'organization_id', tg_table_name),
    upper(tg_table_name) || '_' || tg_op,
    tg_op || ' en ' || tg_table_name,
    v_changes
  );
  return null;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'plan_catalog', 'organizations', 'organization_subscriptions', 'organization_entitlements',
    'platform_admins', 'organization_branches', 'departments', 'teams', 'team_members',
    'roles', 'role_permissions', 'organization_members', 'requests', 'approval_steps',
    'clients', 'commercial_opportunities', 'tasks', 'documents', 'automation_rules'
  ] loop
    execute format('drop trigger if exists trg_audit_row_change on public.%I', t);
    execute format(
      'create trigger trg_audit_row_change after insert or update or delete on public.%I
       for each row execute function private.audit_row_change()', t);
  end loop;
end;
$$;

-- 2. VALIDACIONES COMUNES
create or replace function private.require_member(p_org uuid)
returns public.organization_members
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v public.organization_members;
begin
  v := private.member_row(p_org);
  if v.id is null or not private.org_can_read(p_org) then
    raise exception 'TENANT_ISOLATION_VIOLATION: Sin membresía activa en la organización.';
  end if;
  return v;
end;
$$;

create or replace function private.require_writable(p_org uuid)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.org_can_write(p_org) then
    raise exception 'SUBSCRIPTION_INACTIVE: La organización no está al día; solo se permite lectura.';
  end if;
end;
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

-- 3. RPC DE SOLICITUDES
create or replace function public.rpc_create_request(p_org uuid, p_payload jsonb)
returns public.requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.organization_members;
  v_request public.requests;
  v_branch uuid;
  v_department uuid;
  v_assigned uuid;
  v_subject text := nullif(trim(p_payload ->> 'subject'), '');
  v_client text := nullif(trim(p_payload ->> 'client_display_name'), '');
  v_summary text;
  v_step jsonb;
  v_order int := 0;
begin
  v_member := private.require_member(p_org);
  perform private.require_writable(p_org);

  if not private.has_perm(p_org, 'requests:create') then
    raise exception 'RBAC_PERMISSION_DENIED: Sin permiso requests:create.';
  end if;
  if v_subject is null or v_client is null then
    raise exception 'VALIDATION_ERROR: subject y client_display_name son obligatorios.';
  end if;

  v_department := (p_payload ->> 'department_id')::uuid;
  v_assigned := coalesce((p_payload ->> 'assigned_member_id')::uuid, v_member.id);
  v_branch := coalesce((p_payload ->> 'branch_id')::uuid, v_member.branch_id);

  if not private.can_row(p_org, 'requests:create', v_branch, v_department, v_assigned) then
    raise exception 'SCOPE_RESTRICTION_VIOLATION: Fuera del alcance de datos del rol.';
  end if;

  select pc.default_approval_summary into v_summary
    from public.organization_subscriptions s
    join public.plan_catalog pc on pc.plan_code = s.plan_code
   where s.organization_id = p_org;

  insert into public.requests (
    organization_id, code, subject, client_reference_code, client_display_name,
    branch_id, department_id, assigned_member_id, created_by_member_id,
    priority, status, due_label, approval_summary
  )
  values (
    p_org,
    coalesce(
      nullif(trim(p_payload ->> 'code'), ''),
      'SOL-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
    ),
    v_subject,
    p_payload ->> 'client_reference_code',
    v_client,
    v_branch, v_department, v_assigned, v_member.id,
    coalesce(p_payload ->> 'priority', 'Media'),
    'process',
    coalesce(p_payload ->> 'due_label', 'En tiempo (48h)'),
    coalesce(v_summary, 'Flujo estándar')
  )
  returning * into v_request;

  if private.org_feature(p_org, 'multilevel_approvals') then
    if jsonb_typeof(p_payload -> 'approval_steps') = 'array' then
      for v_step in select value from jsonb_array_elements(p_payload -> 'approval_steps') loop
        v_order := v_order + 1;
        insert into public.approval_steps (
          organization_id, request_id, step_order, step_label, target_department_id
        )
        values (
          p_org, v_request.id, v_order,
          coalesce(v_step ->> 'label', 'Nivel ' || v_order),
          (v_step ->> 'target_department_id')::uuid
        );
      end loop;
    elsif v_department is not null then
      insert into public.approval_steps (
        organization_id, request_id, step_order, step_label, target_department_id
      )
      values (p_org, v_request.id, 1, 'Revisión de Área', v_department);
    end if;
  end if;

  return v_request;
end;
$$;

create or replace function public.rpc_transition_request(p_org uuid, p_request uuid, p_next text)
returns public.requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.requests;
  v_allowed text[];
begin
  perform private.require_member(p_org);
  perform private.require_writable(p_org);

  if not private.has_perm(p_org, 'requests:update') then
    raise exception 'RBAC_PERMISSION_DENIED: Sin permiso requests:update.';
  end if;

  select * into v_request
    from public.requests r
   where r.id = p_request and r.organization_id = p_org and r.deleted_at is null
   for update;

  if not found then
    raise exception 'ENTITY_NOT_FOUND: La solicitud no existe en la organización.';
  end if;

  if not private.can_row(
    p_org, 'requests:update', v_request.branch_id, v_request.department_id, v_request.assigned_member_id
  ) then
    raise exception 'SCOPE_RESTRICTION_VIOLATION: Fuera del alcance de datos del rol.';
  end if;

  v_allowed := case v_request.status
    when 'pending' then array['process', 'active', 'completed', 'error']
    when 'process' then array['pending', 'active', 'completed', 'error']
    when 'active' then array['process', 'completed', 'error', 'pending']
    when 'error' then array['process', 'pending', 'active', 'completed']
    when 'completed' then array['process', 'active']
    else array[]::text[]
  end;

  if not (p_next = any (v_allowed)) then
    raise exception 'INVALID_STATE_TRANSITION: No se permite pasar de % a %.', v_request.status, p_next;
  end if;

  if p_next = 'completed'
     and private.org_entitled(p_org, 'multilevel_approvals')
     and exists (
       select 1 from public.approval_steps a
        where a.request_id = p_request and a.status <> 'approved'
     ) then
    raise exception 'PENDING_APPROVAL_STEPS: Existen niveles de aprobación sin validar.';
  end if;

  update public.requests set status = p_next where id = p_request returning * into v_request;
  return v_request;
end;
$$;

create or replace function public.rpc_decide_approval_step(
  p_org uuid,
  p_step uuid,
  p_decision text,
  p_comment text default null
)
returns public.approval_steps
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.organization_members;
  v_step public.approval_steps;
begin
  v_member := private.require_member(p_org);
  perform private.require_writable(p_org);

  if p_decision not in ('approved', 'rejected') then
    raise exception 'VALIDATION_ERROR: La decisión debe ser approved o rejected.';
  end if;
  if not private.org_feature(p_org, 'multilevel_approvals') then
    raise exception 'ENTITLEMENT_FEATURE_RESTRICTED: El plan no incluye aprobaciones multinivel.';
  end if;

  select * into v_step
    from public.approval_steps a
   where a.id = p_step and a.organization_id = p_org
   for update;

  if not found then
    raise exception 'ENTITY_NOT_FOUND: El paso de aprobación no existe en la organización.';
  end if;
  if not private.has_perm(p_org, v_step.required_permission) then
    raise exception 'RBAC_PERMISSION_DENIED: Sin permiso %.', v_step.required_permission;
  end if;
  if not private.can_row(p_org, v_step.required_permission, null, v_step.target_department_id, null) then
    raise exception 'SCOPE_RESTRICTION_VIOLATION: El paso corresponde a otro departamento.';
  end if;
  if v_step.status not in ('pending', 'process') then
    raise exception 'INVALID_STATE_TRANSITION: El paso ya fue decidido.';
  end if;
  if exists (
    select 1 from public.approval_steps a
     where a.request_id = v_step.request_id
       and a.step_order < v_step.step_order
       and a.status <> 'approved'
  ) then
    raise exception 'PENDING_APPROVAL_STEPS: Existen niveles anteriores sin aprobar.';
  end if;

  update public.approval_steps
     set status = p_decision,
         decided_by_member_id = v_member.id,
         decided_at = now(),
         decision_comment = p_comment
   where id = p_step
   returning * into v_step;

  if p_decision = 'rejected' then
    update public.requests
       set status = 'error', approval_summary = 'Rechazado'
     where id = v_step.request_id;
  elsif not exists (
    select 1 from public.approval_steps a
     where a.request_id = v_step.request_id and a.status <> 'approved'
  ) then
    update public.requests
       set status = 'active', approval_summary = 'Validado'
     where id = v_step.request_id;
  end if;

  return v_step;
end;
$$;

-- Eventos que solo el cliente conoce. Quedan marcados con origin = 'client'.
create or replace function public.rpc_record_client_event(
  p_org uuid,
  p_module text,
  p_entity_type text,
  p_entity_id text,
  p_action text,
  p_summary text,
  p_changes jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_module not in ('core.auth', 'core.tenancy', 'core.security') then
    raise exception 'VALIDATION_ERROR: Módulo no admitido para eventos de cliente.';
  end if;
  if p_org is null then
    if not private.admin_can('read') then
      raise exception 'PLATFORM_ADMIN_REQUIRED: Evento global exclusivo de Platform Admin.';
    end if;
  else
    perform private.require_member(p_org);
  end if;

  perform private.write_audit(
    p_org, p_module, p_entity_type, p_entity_id, p_action, p_summary, p_changes, 'client'
  );
end;
$$;

revoke all on function public.rpc_create_request(uuid, jsonb) from public, anon;
revoke all on function public.rpc_transition_request(uuid, uuid, text) from public, anon;
revoke all on function public.rpc_decide_approval_step(uuid, uuid, text, text) from public, anon;
revoke all on function public.rpc_record_client_event(uuid, text, text, text, text, text, jsonb) from public, anon;
grant execute on function public.rpc_create_request(uuid, jsonb) to authenticated;
grant execute on function public.rpc_transition_request(uuid, uuid, text) to authenticated;
grant execute on function public.rpc_decide_approval_step(uuid, uuid, text, text) to authenticated;
grant execute on function public.rpc_record_client_event(uuid, text, text, text, text, text, jsonb) to authenticated;
