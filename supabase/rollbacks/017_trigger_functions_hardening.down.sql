-- =============================================================================
-- COREFLOW — REVERSIÓN DE LA MIGRACIÓN 017
-- =============================================================================

grant execute on function public.sync_organization_plan_from_subscription() to public, anon, authenticated;
grant execute on function public.prevent_audit_log_tampering() to public, anon, authenticated;

alter function public.prevent_audit_log_tampering() reset search_path;
