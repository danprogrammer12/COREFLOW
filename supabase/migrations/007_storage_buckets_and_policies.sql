-- =============================================================================
-- COREFLOW — MIGRACIÓN 007: SUPABASE STORAGE PRIVADO Y POLÍTICAS MULTI-TENANT
-- Responsabilidad: Crear bucket privado `coreflow-documents` y restringir
-- lectura/escritura por prefijo `{organization_id}/{module}/{entity_id}/{filename}`
-- validado contra la membresía activa del usuario autenticado.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'coreflow-documents',
  'coreflow-documents',
  false,
  26214400, -- 25 MB por archivo
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit;

-- Políticas sobre storage.objects para el bucket privado `coreflow-documents`
drop policy if exists "storage_docs: lectura multi-tenant" on storage.objects;
create policy "storage_docs: lectura multi-tenant" on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'coreflow-documents'
    and (storage.foldername(name))[1] is not null
    and (select app_has_active_membership(((storage.foldername(name))[1])::uuid))
  );

drop policy if exists "storage_docs: carga multi-tenant" on storage.objects;
create policy "storage_docs: carga multi-tenant" on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'coreflow-documents'
    and (storage.foldername(name))[1] is not null
    and (select app_has_active_membership(((storage.foldername(name))[1])::uuid))
  );

drop policy if exists "storage_docs: eliminacion autorizada" on storage.objects;
create policy "storage_docs: eliminacion autorizada" on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'coreflow-documents'
    and (storage.foldername(name))[1] is not null
    and (select app_has_org_permission(((storage.foldername(name))[1])::uuid, 'documents:approve'))
  );
