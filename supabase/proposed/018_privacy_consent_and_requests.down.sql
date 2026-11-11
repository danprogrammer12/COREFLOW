-- =============================================================================
-- COREFLOW — REVERSIÓN DE LA MIGRACIÓN PROPUESTA 018
-- Destructiva: elimina los registros de consentimiento y las solicitudes.
-- Exportarlos antes si ya contienen información.
-- =============================================================================

drop function if exists public.rpc_submit_privacy_request(jsonb);
drop function if exists public.rpc_record_cookie_consent(jsonb);
drop table if exists privacy_requests;
drop table if exists privacy_consents;
drop function if exists private.forbid_consent_change();
