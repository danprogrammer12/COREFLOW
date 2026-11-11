-- =============================================================================
-- COREFLOW — REVERSIÓN DE LA MIGRACIÓN 008
-- Aplicar solo después de revertir 012, 011, 010 y 009, en ese orden.
-- Límites: las organizaciones migradas de `start` a `starter` no vuelven a `start`,
-- y las suscripciones y perfiles creados por 008 se conservan.
-- =============================================================================

do $$
declare
  t text;
begin
  foreach t in array array[
    'organization_entitlements', 'organization_branches', 'departments', 'teams', 'roles',
    'role_permissions', 'organization_members', 'team_members', 'entity_timeline_events',
    'requests', 'approval_steps', 'organization_subscriptions', 'clients',
    'commercial_opportunities', 'tasks', 'documents', 'automation_rules'
  ] loop
    execute format('drop trigger if exists trg_forbid_organization_change on public.%I', t);
  end loop;

  foreach t in array array[
    'plan_catalog', 'organizations', 'organization_entitlements', 'user_profiles',
    'organization_branches', 'departments', 'teams', 'roles', 'organization_members',
    'requests', 'platform_admins', 'organization_subscriptions', 'clients',
    'commercial_opportunities', 'tasks', 'documents', 'automation_rules'
  ] loop
    execute format('drop trigger if exists trg_touch_updated_at on public.%I', t);
  end loop;
end;
$$;

drop trigger if exists trg_coreflow_auth_user_change on auth.users;
drop trigger if exists trg_guard_contracted_plan on organizations;

alter table platform_admins drop constraint if exists platform_admins_user_id_auth_fkey;
alter table user_profiles drop constraint if exists user_profiles_id_auth_fkey;

alter table entity_timeline_events
  drop constraint entity_timeline_events_actor_member_id_organization_id_fkey,
  add constraint entity_timeline_events_actor_member_id_organization_id_fkey
    foreign key (actor_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null;

alter table clients
  drop constraint clients_owner_member_id_organization_id_fkey,
  add constraint clients_owner_member_id_organization_id_fkey
    foreign key (owner_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null;

alter table commercial_opportunities
  drop constraint commercial_opportunities_owner_member_id_organization_id_fkey,
  add constraint commercial_opportunities_owner_member_id_organization_id_fkey
    foreign key (owner_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null;

alter table tasks
  drop constraint tasks_request_id_organization_id_fkey,
  add constraint tasks_request_id_organization_id_fkey
    foreign key (request_id, organization_id)
    references requests(id, organization_id) on delete set null,
  drop constraint tasks_client_id_organization_id_fkey,
  add constraint tasks_client_id_organization_id_fkey
    foreign key (client_id, organization_id)
    references clients(id, organization_id) on delete set null,
  drop constraint tasks_department_id_organization_id_fkey,
  add constraint tasks_department_id_organization_id_fkey
    foreign key (department_id, organization_id)
    references departments(id, organization_id) on delete set null,
  drop constraint tasks_assigned_member_id_organization_id_fkey,
  add constraint tasks_assigned_member_id_organization_id_fkey
    foreign key (assigned_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null;

alter table documents
  drop constraint documents_client_id_organization_id_fkey,
  add constraint documents_client_id_organization_id_fkey
    foreign key (client_id, organization_id)
    references clients(id, organization_id) on delete set null,
  drop constraint documents_request_id_organization_id_fkey,
  add constraint documents_request_id_organization_id_fkey
    foreign key (request_id, organization_id)
    references requests(id, organization_id) on delete set null,
  drop constraint documents_department_id_organization_id_fkey,
  add constraint documents_department_id_organization_id_fkey
    foreign key (department_id, organization_id)
    references departments(id, organization_id) on delete set null,
  drop constraint documents_uploaded_by_member_id_organization_id_fkey,
  add constraint documents_uploaded_by_member_id_organization_id_fkey
    foreign key (uploaded_by_member_id, organization_id)
    references organization_members(id, organization_id) on delete set null;

alter table automation_rules
  drop constraint automation_rules_source_department_id_organization_id_fkey,
  add constraint automation_rules_source_department_id_organization_id_fkey
    foreign key (source_department_id, organization_id)
    references departments(id, organization_id) on delete set null,
  drop constraint automation_rules_target_department_id_organization_id_fkey,
  add constraint automation_rules_target_department_id_organization_id_fkey
    foreign key (target_department_id, organization_id)
    references departments(id, organization_id) on delete set null;

alter table organization_subscriptions drop constraint if exists subscriptions_plan_not_retired;
alter table organizations drop constraint if exists organizations_plan_not_retired;
alter table plan_catalog drop constraint if exists plan_catalog_start_retired;
alter table organizations alter column contracted_plan_code set default 'start';
update plan_catalog set is_active = true where plan_code = 'start';

drop schema if exists private cascade;
