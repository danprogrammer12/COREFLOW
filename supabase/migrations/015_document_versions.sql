-- =============================================================================
-- COREFLOW — MIGRACIÓN 015: VERSIONES DE DOCUMENTOS Y DESCARGA CON ALCANCE
-- Responsabilidad: historial inmutable, registro atómico tras la carga, tamaño
-- tomado de Storage, asociación con tareas y oportunidades, y Storage con alcance.
-- Reversión: supabase/rollbacks/015_document_versions.down.sql
-- =============================================================================

-- 1. ASOCIACIONES
alter table documents
  add column if not exists task_id uuid,
  add column if not exists opportunity_id uuid,
  add column if not exists current_version_id uuid;

alter table documents
  add constraint documents_task_id_organization_id_fkey
    foreign key (task_id, organization_id)
    references tasks(id, organization_id) on delete set null (task_id),
  add constraint documents_opportunity_id_organization_id_fkey
    foreign key (opportunity_id, organization_id)
    references commercial_opportunities(id, organization_id) on delete set null (opportunity_id);

-- 2. HISTORIAL
create table if not exists document_versions (
  id                     uuid primary key default gen_random_uuid(),
  organization_id        uuid not null references organizations(id) on delete restrict,
  document_id            uuid not null,
  version_number         integer not null check (version_number > 0),
  storage_path           text not null unique,
  size_bytes             bigint not null check (size_bytes >= 0),
  mime_type              text not null,
  uploaded_by_member_id  uuid not null,
  comment                text,
  created_at             timestamptz not null default now(),
  unique (document_id, version_number),
  unique (id, organization_id),
  foreign key (document_id, organization_id)
    references documents(id, organization_id) on delete restrict,
  foreign key (uploaded_by_member_id, organization_id)
    references organization_members(id, organization_id) on delete restrict
);

create index if not exists idx_document_versions_doc on document_versions (document_id, version_number desc);

alter table documents
  add constraint documents_current_version_id_organization_id_fkey
    foreign key (current_version_id, organization_id)
    references document_versions(id, organization_id) on delete set null (current_version_id);

create or replace function private.forbid_version_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'SECURITY_POLICY_VIOLATION: Las versiones de documentos son inmutables.';
end;
$$;

drop trigger if exists trg_forbid_version_change on document_versions;
create trigger trg_forbid_version_change
before update or delete on document_versions
for each row execute function private.forbid_version_change();

drop trigger if exists trg_audit_row_change on document_versions;
create trigger trg_audit_row_change
after insert on document_versions
for each row execute function private.audit_row_change();

alter table document_versions enable row level security;

create policy "cf: document_versions select" on document_versions
  for select to authenticated
  using (
    private.is_reader(organization_id)
    and exists (select 1 from documents d where d.id = document_versions.document_id)
  );

-- 3. ESCRITURA SOLO POR RPC: los campos de versión no se editan directamente
drop policy if exists "cf: documents insert" on documents;

revoke update on documents from anon, authenticated;
grant update (title, category, status, client_id, request_id, task_id, opportunity_id, department_id)
  on documents to authenticated;

-- 4. STORAGE CON ALCANCE. Un archivo registrado no se reemplaza ni se borra.
create or replace function private.storage_is_registered(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.document_versions v where v.storage_path = p_name);
$$;

create or replace function private.storage_can(p_name text, p_action text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.storage_path_org(p_name);
begin
  if v_org is null then
    return false;
  end if;

  if p_action = 'write' then
    return private.can_write_perm(v_org, 'documents:write') and private.org_storage_has_room(v_org);
  end if;

  return false;
end;
$$;

-- Un archivo registrado sigue el alcance de su documento. Uno sin registrar solo
-- lo ve quien lo subió.
create or replace function private.storage_can_read(p_name text, p_owner text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.storage_path_org(p_name);
begin
  if v_org is null then
    return false;
  end if;

  if private.storage_is_registered(p_name) then
    return exists (
      select 1
        from public.document_versions v
        join public.documents d on d.id = v.document_id
       where v.storage_path = p_name
         and d.deleted_at is null
         and private.can_row(v_org, 'documents:read', null, d.department_id, d.uploaded_by_member_id)
    );
  end if;

  return private.is_reader(v_org) and p_owner = auth.uid()::text;
end;
$$;

create or replace function private.storage_can_delete(p_name text, p_owner text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_org uuid := private.storage_path_org(p_name);
begin
  if v_org is null or private.storage_is_registered(p_name) then
    return false;
  end if;
  return private.can_write_perm(v_org, 'documents:approve')
      or (private.is_reader(v_org) and p_owner = auth.uid()::text);
end;
$$;

drop policy if exists "storage_docs: lectura" on storage.objects;
create policy "storage_docs: lectura" on storage.objects
  for select to authenticated
  using (bucket_id = 'coreflow-documents' and private.storage_can_read(name, owner_id));

drop policy if exists "storage_docs: reemplazo" on storage.objects;
drop policy if exists "storage_docs: eliminacion" on storage.objects;
create policy "storage_docs: eliminacion" on storage.objects
  for delete to authenticated
  using (bucket_id = 'coreflow-documents' and private.storage_can_delete(name, owner_id));

-- 5. REGISTRO ATÓMICO
create or replace function private.register_document_version(
  p_org uuid,
  p_document uuid,
  p_path text,
  p_comment text,
  p_member uuid
)
returns public.document_versions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_size bigint;
  v_mime text;
  v_number integer;
  v_version public.document_versions;
begin
  if p_path not like p_org::text || '/documents/' || p_document::text || '/%' then
    raise exception 'VALIDATION_ERROR: La ruta no corresponde al documento.';
  end if;

  select coalesce((o.metadata ->> 'size')::bigint, 0),
         coalesce(o.metadata ->> 'mimetype', 'application/octet-stream')
    into v_size, v_mime
    from storage.objects o
   where o.bucket_id = 'coreflow-documents'
     and o.name = p_path
     and o.owner_id = auth.uid()::text;
  if not found then
    raise exception 'STORAGE_OBJECT_NOT_FOUND: El archivo no existe en Storage.';
  end if;

  perform 1 from public.documents d where d.id = p_document for update;

  select coalesce(max(v.version_number), 0) + 1 into v_number
    from public.document_versions v
   where v.document_id = p_document;

  insert into public.document_versions (
    organization_id, document_id, version_number, storage_path,
    size_bytes, mime_type, uploaded_by_member_id, comment
  )
  values (p_org, p_document, v_number, p_path, v_size, v_mime, p_member, p_comment)
  returning * into v_version;

  update public.documents
     set current_version_id = v_version.id,
         version = 'v' || v_number || '.0',
         storage_path = p_path,
         size_bytes = v_size,
         mime_type = v_mime
   where id = p_document;

  return v_version;
end;
$$;

revoke all on all functions in schema private from public, anon;
grant execute on all functions in schema private to authenticated, service_role;

create or replace function public.rpc_create_document(
  p_org uuid,
  p_document uuid,
  p_storage_path text,
  p_payload jsonb
)
returns public.documents
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.organization_members;
  v_title text := nullif(trim(p_payload ->> 'title'), '');
  v_document public.documents;
begin
  v_member := private.require_member(p_org);
  perform private.require_writable(p_org);

  if not private.has_perm(p_org, 'documents:write') then
    raise exception 'RBAC_PERMISSION_DENIED: Sin permiso documents:write.';
  end if;
  if private.org_limit_optional(p_org, 'max_storage_mb') is null then
    raise exception 'STORAGE_QUOTA_NOT_CONFIGURED: La capacidad de almacenamiento no está configurada.';
  end if;
  if v_title is null then
    raise exception 'VALIDATION_ERROR: title es obligatorio.';
  end if;

  insert into public.documents (
    id, organization_id, code, title, category, status,
    client_id, request_id, task_id, opportunity_id, department_id,
    uploaded_by_member_id, storage_path
  )
  values (
    p_document,
    p_org,
    coalesce(
      nullif(trim(p_payload ->> 'code'), ''),
      'DOC-' || upper(substr(replace(p_document::text, '-', ''), 1, 10))
    ),
    v_title,
    coalesce(p_payload ->> 'category', 'Operativo'),
    coalesce(p_payload ->> 'status', 'active'),
    (p_payload ->> 'client_id')::uuid,
    (p_payload ->> 'request_id')::uuid,
    (p_payload ->> 'task_id')::uuid,
    (p_payload ->> 'opportunity_id')::uuid,
    coalesce((p_payload ->> 'department_id')::uuid, v_member.department_id),
    v_member.id,
    p_storage_path
  );

  perform private.register_document_version(p_org, p_document, p_storage_path, p_payload ->> 'comment', v_member.id);

  select * into v_document from public.documents d where d.id = p_document;
  return v_document;
end;
$$;

create or replace function public.rpc_add_document_version(
  p_org uuid,
  p_document uuid,
  p_storage_path text,
  p_comment text default null
)
returns public.document_versions
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.organization_members;
  v_document public.documents;
begin
  v_member := private.require_member(p_org);
  perform private.require_writable(p_org);

  if not private.has_perm(p_org, 'documents:write') then
    raise exception 'RBAC_PERMISSION_DENIED: Sin permiso documents:write.';
  end if;

  select * into v_document
    from public.documents d
   where d.id = p_document and d.organization_id = p_org and d.deleted_at is null;
  if not found then
    raise exception 'ENTITY_NOT_FOUND: El documento no existe en la organización.';
  end if;
  if not private.can_row(p_org, 'documents:write', null, v_document.department_id, v_document.uploaded_by_member_id) then
    raise exception 'SCOPE_RESTRICTION_VIOLATION: Fuera del alcance de datos del rol.';
  end if;

  return private.register_document_version(p_org, p_document, p_storage_path, p_comment, v_member.id);
end;
$$;

revoke all on function public.rpc_create_document(uuid, uuid, text, jsonb) from public, anon;
revoke all on function public.rpc_add_document_version(uuid, uuid, text, text) from public, anon;
grant execute on function public.rpc_create_document(uuid, uuid, text, jsonb) to authenticated;
grant execute on function public.rpc_add_document_version(uuid, uuid, text, text) to authenticated;
