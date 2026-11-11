-- =============================================================================
-- COREFLOW — REVERSIÓN DE LA MIGRACIÓN 012
-- Retira la función. Las organizaciones ya aprovisionadas se conservan.
-- =============================================================================

drop function public.rpc_provision_organization(jsonb);
