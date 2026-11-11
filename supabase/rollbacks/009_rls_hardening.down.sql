-- =============================================================================
-- COREFLOW — REVERSIÓN DE LA MIGRACIÓN 009
-- Aplicar solo después de revertir 012, 011 y 010. Restaura las políticas
-- originales desde private.policy_backup_009.
-- =============================================================================

grant execute on function public.app_user_active_org_ids() to public;
grant execute on function public.app_has_active_membership(uuid) to public;
grant execute on function public.app_has_org_permission(uuid, text) to public;
grant execute on function public.app_is_platform_admin() to public;
grant execute on function public.app_org_has_feature(uuid, text) to public;

grant update on user_profiles to anon, authenticated;

do $$
declare
  p record;
begin
  for p in
    select schemaname, tablename, policyname
      from pg_policies
     where (schemaname = 'public' and policyname like 'cf: %')
        or (schemaname = 'storage' and policyname like 'storage_docs:%')
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;

  for p in select * from private.policy_backup_009 loop
    execute format(
      'create policy %I on %I.%I as %s for %s to %s %s %s',
      p.policyname, p.schemaname, p.tablename, p.permissive, p.cmd,
      array_to_string(p.roles, ', '),
      case when p.qual is not null then 'using (' || p.qual || ')' else '' end,
      case when p.with_check is not null then 'with check (' || p.with_check || ')' else '' end
    );
  end loop;
end;
$$;

drop table private.policy_backup_009;

drop function private.storage_can(text, text);
drop function private.org_storage_has_room(uuid);
drop function private.storage_path_org(text);
drop function private.admin_can(text);
drop function private.role_is_custom(uuid, uuid);
drop function private.shares_org(uuid);
drop function private.can_row(uuid, text, uuid, uuid, uuid);
drop function private.can_write_perm(uuid, text);
drop function private.has_perm(uuid, text);
drop function private.is_reader(uuid);
drop function private.member_id(uuid);
drop function private.member_row(uuid);
