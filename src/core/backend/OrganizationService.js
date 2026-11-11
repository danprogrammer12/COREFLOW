/**
 * CONTEXTO ORGANIZACIONAL, ESTRUCTURA Y MEMBRESÍAS
 * CoreFlow — src/core/backend/OrganizationService.js
 */

import { BackendError, unwrap } from './result.js'
import { buildDirectory, camelizeRow, mapMember } from './mappers.js'
import { normalizeDatabasePlanRow } from '../config/plansCatalog.js'

export class OrganizationService {
  constructor({ client, store, subscriptions, audit }) {
    this.client = client
    this.store = store
    this.subscriptions = subscriptions
    this.audit = audit
  }

  listAccessibleOrganizations() {
    return this.store.getSnapshot().session.accessibleOrganizations
  }

  async switchOrganization(organizationId) {
    const { session } = this.store.getSnapshot()
    const membership = session.memberships.find((m) => m.organizationId === organizationId)
    if (!membership) {
      throw new BackendError(
        'TENANT_ISOLATION_VIOLATION',
        'El usuario no tiene membresía activa en esa organización.'
      )
    }

    this.store.writeActiveOrganization(organizationId)
    this.store.setSession({ ...session, activeOrganizationId: organizationId })

    await this.audit._recordBestEffort({
      organizationId,
      module: 'core.tenancy',
      entityType: 'organization',
      entityId: organizationId,
      action: 'TENANT_CONTEXT_SWITCHED',
      summary: 'Cambio de organización activa.',
    })
    return { activeOrganizationId: organizationId, membership }
  }

  async getTenantContext(organizationId) {
    const { session } = this.store.getSnapshot()
    const from = (table) => this.client.from(table).select('*').eq('organization_id', organizationId)

    const [organization, subscription, plans, branches, departments, roles, rolePermissions, entitlements, members, entitlementsResolved] =
      await Promise.all([
        this.client.from('organizations').select('*').eq('id', organizationId).maybeSingle().then(unwrap),
        this.subscriptions.getCurrent(organizationId),
        this.client.from('plan_catalog').select('*').eq('is_active', true).then(unwrap),
        from('organization_branches').is('deleted_at', null).then(unwrap),
        from('departments').is('deleted_at', null).then(unwrap),
        from('roles').then(unwrap),
        from('role_permissions').then(unwrap),
        from('organization_entitlements').then(unwrap),
        this._listMembers(organizationId),
        this.subscriptions.getEntitlements(organizationId),
      ])

    if (!organization) {
      throw new BackendError('TENANT_ISOLATION_VIOLATION', 'Sin acceso a la organización.')
    }

    const membership = members.find((m) => m.userId === session.user?.id) || null
    return {
      organization: {
        ...camelizeRow(organization),
        activeCollaboratorsCount: members.filter((m) => m.status === 'active').length,
      },
      subscription,
      planCatalog: plans.map(normalizeDatabasePlanRow),
      membership,
      activeMembership: membership,
      branches: branches.map(camelizeRow),
      departments: departments.map(camelizeRow),
      members,
      entitlements: entitlements.map(camelizeRow),
      roles: roles.map(camelizeRow),
      rolePermissions: rolePermissions.map(camelizeRow),
      entitlementsResolved,
    }
  }

  listMembers(organizationId) {
    return this._listMembers(organizationId)
  }

  async createBranch({ organizationId, code, name, city = null }) {
    const row = await this.client
      .from('organization_branches')
      .insert({ organization_id: organizationId, code: String(code).toUpperCase(), name, city })
      .select()
      .single()
      .then(unwrap)
    return camelizeRow(row)
  }

  async createDepartment({ organizationId, branchId, code, name, description = null }) {
    const row = await this.client
      .from('departments')
      .insert({
        organization_id: organizationId,
        branch_id: branchId,
        code: String(code).toUpperCase(),
        name,
        description,
      })
      .select()
      .single()
      .then(unwrap)
    return camelizeRow(row)
  }

  async inviteMember({ organizationId, email, roleCode, branchId = null, departmentId = null, jobTitle = 'Colaborador' }) {
    const row = await this.client
      .rpc('rpc_invite_member', {
        p_org: organizationId,
        p_email: email,
        p_role_code: roleCode,
        p_branch: branchId,
        p_department: departmentId,
        p_job_title: jobTitle,
      })
      .then(unwrap)
    return camelizeRow(row)
  }

  async acceptInvitation(organizationId) {
    const row = await this.client.rpc('rpc_accept_invitation', { p_org: organizationId }).then(unwrap)
    return camelizeRow(row)
  }

  async updateMember({ organizationId, memberId, patch }) {
    const allowed = {}
    if (patch.roleCode !== undefined) allowed.role_code = patch.roleCode
    if (patch.status !== undefined) allowed.status = patch.status
    if (patch.branchId !== undefined) allowed.branch_id = patch.branchId
    if (patch.departmentId !== undefined) allowed.department_id = patch.departmentId
    if (patch.jobTitle !== undefined) allowed.job_title = patch.jobTitle

    const row = await this.client
      .rpc('rpc_update_member', { p_org: organizationId, p_member: memberId, p_patch: allowed })
      .then(unwrap)
    return camelizeRow(row)
  }

  async _listMembers(organizationId) {
    const rows = await this.client
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .then(unwrap)
    if (rows.length === 0) return []

    const [profiles, roles] = await Promise.all([
      this.client.from('user_profiles').select('*').in('id', rows.map((m) => m.user_id)).then(unwrap),
      this.client.from('roles').select('*').eq('organization_id', organizationId).then(unwrap),
    ])
    return rows.map((m) =>
      mapMember(m, {
        profile: profiles.find((p) => p.id === m.user_id),
        role: roles.find((r) => r.id === m.role_id),
      })
    )
  }

  /** Nombres de departamentos y miembros para mapear registros operativos. */
  async _loadDirectory(organizationId) {
    const [departments, members] = await Promise.all([
      this.client
        .from('departments')
        .select('*')
        .eq('organization_id', organizationId)
        .then(unwrap),
      this._listMembers(organizationId),
    ])
    return buildDirectory({ departments: departments.map(camelizeRow), members })
  }
}
