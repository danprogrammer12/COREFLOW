-- =============================================================================
-- COREFLOW — REVERSIÓN DE LA MIGRACIÓN 010
-- Aplicar solo después de revertir 012 y 011.
-- Límite: se pierde la marca `origin` de los registros de auditoría; los registros
-- en sí se conservan.
-- =============================================================================

drop function public.rpc_record_client_event(uuid, text, text, text, text, text, jsonb);
drop function public.rpc_decide_approval_step(uuid, uuid, text, text);
drop function public.rpc_transition_request(uuid, uuid, text);
drop function public.rpc_create_request(uuid, jsonb);

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
  end loop;
end;
$$;

drop trigger if exists trg_forbid_audit_truncate on audit_logs;

drop function private.require_writable(uuid);
drop function private.require_member(uuid);
drop function private.audit_row_change();
drop function private.write_audit(uuid, text, text, text, text, text, jsonb, text);
drop function private.sanitize_jsonb(jsonb, int);
drop function private.forbid_audit_truncate();

alter table audit_logs drop column if exists origin;
