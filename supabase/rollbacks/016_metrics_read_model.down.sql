-- =============================================================================
-- COREFLOW — REVERSIÓN DE LA MIGRACIÓN 016
-- Solo retira una función de lectura. No afecta a datos.
-- =============================================================================

drop function public.rpc_get_org_metrics(uuid, text);
