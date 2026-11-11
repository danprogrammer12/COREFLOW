-- =============================================================================
-- COREFLOW — MIGRACIÓN PROPUESTA 018: CONSENTIMIENTO Y SOLICITUDES DE PRIVACIDAD
-- ESTADO: PROPUESTA. NO APLICAR sin autorización expresa y revisión jurídica.
-- Está fuera de supabase/migrations a propósito, para que ninguna integración la
-- aplique de forma automática.
--
-- Responsabilidad:
--   1. privacy_consents: registro inmutable de decisiones de cookies, de visitantes y
--      de usuarios. Sin IP, correo ni datos del navegador.
--   2. privacy_requests: solicitudes de titulares (consulta, actualización,
--      supresión, revocatoria, reclamo), con plazo legal calculado.
-- Reversión: supabase/proposed/018_privacy_consent_and_requests.down.sql
-- =============================================================================

-- 1. CONSENTIMIENTOS
create table if not exists privacy_consents (
  id               uuid primary key default gen_random_uuid(),
  consent_id       uuid not null unique,
  visitor_id       uuid not null,
  subject_type     text not null check (subject_type in ('visitor', 'user')),
  user_id          uuid references auth.users(id) on delete set null,
  -- Contexto en el que se decidió. El consentimiento de cookies es de la persona en
  -- este navegador, no de la organización: nunca se aplica a otra persona ni a otra organización.
  organization_id  uuid references organizations(id) on delete set null,
  accepted         text[] not null,
  rejected         text[] not null,
  method           text not null check (method in ('accept_all', 'reject_optional', 'custom', 'withdraw')),
  policy_version   text not null check (char_length(policy_version) between 1 and 64),
  notice_version   text not null check (char_length(notice_version) between 1 and 64),
  decided_at       timestamptz not null,
  recorded_at      timestamptz not null default now(),
  check ('necessary' = any (accepted)),
  check (not (accepted && rejected)),
  check (accepted <@ array['necessary', 'functional', 'analytics', 'marketing']),
  check (rejected <@ array['functional', 'analytics', 'marketing'])
);

create index if not exists idx_privacy_consents_user on privacy_consents (user_id, decided_at desc);
create index if not exists idx_privacy_consents_visitor on privacy_consents (visitor_id, decided_at desc);

create or replace function private.forbid_consent_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'SECURITY_POLICY_VIOLATION: El registro de consentimiento es inmutable. Cada cambio es un registro nuevo.';
end;
$$;

drop trigger if exists trg_forbid_consent_change on privacy_consents;
create trigger trg_forbid_consent_change
before update or delete on privacy_consents
for each row execute function private.forbid_consent_change();

alter table privacy_consents enable row level security;

-- Cada usuario ve sus propias decisiones; Platform Admin con nivel de lectura, todas.
create policy "cf: privacy_consents select" on privacy_consents
  for select to authenticated
  using (user_id = (select auth.uid()) or private.admin_can('read'));

-- Escritura solo por RPC, que fija el usuario desde la sesión. anon no tiene acceso directo.
revoke all on privacy_consents from anon;
revoke insert, update, delete on privacy_consents from authenticated;

create or replace function public.rpc_record_cookie_consent(p jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_org uuid := (p ->> 'organization_id')::uuid;
  v_id uuid;
begin
  -- La organización solo se guarda si el usuario es miembro activo de ella.
  if v_org is not null and (v_uid is null or private.member_id(v_org) is null) then
    v_org := null;
  end if;

  insert into public.privacy_consents (
    consent_id, visitor_id, subject_type, user_id, organization_id,
    accepted, rejected, method, policy_version, notice_version, decided_at
  )
  values (
    (p ->> 'consent_id')::uuid,
    (p ->> 'visitor_id')::uuid,
    case when v_uid is null then 'visitor' else 'user' end,
    v_uid,
    v_org,
    array(select jsonb_array_elements_text(p -> 'accepted')),
    array(select jsonb_array_elements_text(p -> 'rejected')),
    p ->> 'method',
    p ->> 'policy_version',
    p ->> 'notice_version',
    -- No se aceptan fechas futuras ni muy antiguas enviadas por el cliente.
    least(greatest((p ->> 'decided_at')::timestamptz, now() - interval '1 day'), now())
  )
  on conflict (consent_id) do nothing
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.rpc_record_cookie_consent(jsonb) from public;
-- Los visitantes sin cuenta también deciden: anon puede registrar, nunca leer.
grant execute on function public.rpc_record_cookie_consent(jsonb) to anon, authenticated;

-- 2. SOLICITUDES DE TITULARES
create table if not exists privacy_requests (
  id                 uuid primary key default gen_random_uuid(),
  request_type       text not null check (request_type in ('consulta', 'actualizacion', 'supresion', 'revocatoria', 'reclamo')),
  user_id            uuid references auth.users(id) on delete set null,
  organization_id    uuid references organizations(id) on delete set null,
  organization_name  text check (char_length(organization_name) <= 200),
  full_name          text not null check (char_length(full_name) between 2 and 200),
  email              text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  detail             text not null check (char_length(detail) between 5 and 2000),
  status             text not null default 'received'
                       check (status in ('received', 'incomplete', 'in_progress', 'forwarded', 'answered', 'closed')),
  -- Plazo legal en días hábiles: 10 para consultas y 15 para reclamos (Ley 1581 de 2012, arts. 14 y 15).
  legal_term_days    integer not null,
  received_at        timestamptz not null default now(),
  answered_at        timestamptz,
  resolution_note    text
);

create index if not exists idx_privacy_requests_status on privacy_requests (status, received_at);

alter table privacy_requests enable row level security;

create policy "cf: privacy_requests select" on privacy_requests
  for select to authenticated
  using (user_id = (select auth.uid()) or private.admin_can('read'));

create policy "cf: privacy_requests update" on privacy_requests
  for update to authenticated
  using (private.admin_can('manage_tenants'))
  with check (private.admin_can('manage_tenants'));

revoke all on privacy_requests from anon;
revoke insert, update, delete on privacy_requests from authenticated;
grant update (status, answered_at, resolution_note) on privacy_requests to authenticated;

create or replace function public.rpc_submit_privacy_request(p jsonb)
returns public.privacy_requests
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_org uuid := (p ->> 'organization_id')::uuid;
  v_type text := p ->> 'request_type';
  v_row public.privacy_requests;
begin
  if v_org is not null and (v_uid is null or private.member_id(v_org) is null) then
    v_org := null;
  end if;

  insert into public.privacy_requests (
    request_type, user_id, organization_id, organization_name, full_name, email, detail, legal_term_days
  )
  values (
    v_type, v_uid, v_org,
    nullif(trim(p ->> 'organization_name'), ''),
    trim(p ->> 'full_name'),
    lower(trim(p ->> 'email')),
    trim(p ->> 'detail'),
    case when v_type in ('consulta') then 10 else 15 end
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.rpc_submit_privacy_request(jsonb) from public;
grant execute on function public.rpc_submit_privacy_request(jsonb) to anon, authenticated;

-- Auditoría de los cambios de estado de las solicitudes
drop trigger if exists trg_audit_row_change on privacy_requests;
create trigger trg_audit_row_change
after update on privacy_requests
for each row execute function private.audit_row_change();

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;
