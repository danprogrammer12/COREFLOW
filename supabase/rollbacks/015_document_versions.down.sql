-- =============================================================================
-- COREFLOW — REVERSIÓN DE LA MIGRACIÓN 015
-- Aplicar solo después de revertir 016.
-- Destructiva: elimina el historial de versiones y las asociaciones con tareas y
-- oportunidades. Los archivos en Storage se conservan.
-- =============================================================================

drop function public.rpc_add_document_version(uuid, uuid, text, text);
drop function public.rpc_create_document(uuid, uuid, text, jsonb);

drop policy if exists "storage_docs: eliminacion" on storage.objects;
drop policy if exists "storage_docs: lectura" on storage.objects;

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
  return case p_action
    when 'read' then private.has_perm(v_org, 'documents:read')
    when 'write' then private.can_write_perm(v_org, 'documents:write')
                      and private.org_storage_has_room(v_org)
    when 'delete' then private.can_write_perm(v_org, 'documents:approve')
    else false
  end;
end;
$$;

create policy "storage_docs: lectura" on storage.objects
  for select to authenticated
  using (bucket_id = 'coreflow-documents' and private.storage_can(name, 'read'));
create policy "storage_docs: reemplazo" on storage.objects
  for update to authenticated
  using (bucket_id = 'coreflow-documents' and private.storage_can(name, 'write'))
  with check (bucket_id = 'coreflow-documents' and private.storage_can(name, 'write'));
create policy "storage_docs: eliminacion" on storage.objects
  for delete to authenticated
  using (bucket_id = 'coreflow-documents' and private.storage_can(name, 'delete'));

grant update on documents to anon, authenticated;

create policy "cf: documents insert" on documents
  for insert to authenticated
  with check (
    private.can_write_perm(organization_id, 'documents:write')
    and uploaded_by_member_id = private.member_id(organization_id)
    and private.storage_path_org(storage_path) = organization_id
  );

drop function private.register_document_version(uuid, uuid, text, text, uuid);

alter table documents drop constraint if exists documents_current_version_id_organization_id_fkey;

drop function private.storage_can_delete(text, text);
drop function private.storage_can_read(text, text);
drop function private.storage_is_registered(text);
drop table document_versions;
drop function private.forbid_version_change();

alter table documents
  drop constraint if exists documents_task_id_organization_id_fkey,
  drop constraint if exists documents_opportunity_id_organization_id_fkey,
  drop column if exists task_id,
  drop column if exists opportunity_id,
  drop column if exists current_version_id;
