-- =============================================================================
-- COREFLOW — MIGRACIÓN 017: FUNCIONES DE TRIGGER FUERA DE LA API
-- Responsabilidad: atender los avisos del asesor de seguridad de Supabase. Estas dos
-- funciones solo se ejecutan como triggers: nadie necesita invocarlas por la API.
-- PostgreSQL comprueba EXECUTE al crear el trigger, no al dispararlo, así que
-- retirarlo no afecta a los triggers existentes.
-- Reversión: supabase/rollbacks/017_trigger_functions_hardening.down.sql
-- =============================================================================

alter function public.prevent_audit_log_tampering() set search_path = '';

revoke all on function public.prevent_audit_log_tampering() from public, anon, authenticated;
revoke all on function public.sync_organization_plan_from_subscription() from public, anon, authenticated;
