-- =============================================================================
-- COREFLOW — REVERSIÓN DE LA MIGRACIÓN 013
-- Solo retira funciones de lectura. No afecta a datos.
-- =============================================================================

drop function public.rpc_admin_organization_usage();
drop function public.rpc_get_org_capabilities(uuid);
