-- =============================================================================
-- COREFLOW — REVERSIÓN DE LA MIGRACIÓN 011
-- Aplicar solo después de revertir 012. No altera membresías ni sedes existentes.
-- =============================================================================

drop function public.rpc_update_member(uuid, uuid, jsonb);
drop function public.rpc_accept_invitation(uuid);
drop function public.rpc_invite_member(uuid, text, text, uuid, uuid, text);

drop trigger if exists trg_enforce_branch_quota on organization_branches;
drop trigger if exists trg_enforce_member_quota on organization_members;

drop function private.role_within_actor(uuid, uuid);
drop function private.enforce_branch_quota();
drop function private.enforce_member_quota();
