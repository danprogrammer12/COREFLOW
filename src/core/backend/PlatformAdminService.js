/**
 * ADMINISTRACIÓN GLOBAL DE LA PLATAFORMA
 * CoreFlow — src/core/backend/PlatformAdminService.js
 *
 * Los niveles de Platform Admin los imponen RLS y las RPC.
 */

import { BackendError, unwrap } from './result.js'
import { camelizeRow, canonicalEntitlementKey, mapAuditLog } from './mappers.js'
import { normalizeDatabasePlanRow } from '../config/plansCatalog.js'
import { SYSTEM_ROLE_TEMPLATES } from '../config/permissionsCatalog.js'

export class PlatformAdminService {
  constructor({ client, store }) {
    this.client = client
    this.store = store
  }

  async listPlans() {
    const rows = await this.client
      .from('plan_catalog')
      .select('*')
      .order('price_monthly_usd', { ascending: true })
      .then(unwrap)
    return rows.map(normalizeDatabasePlanRow)
  }

  async upsertPlan(planPayload) {
    this._assertPlatformAdmin()
    const plan = normalizeDatabasePlanRow(planPayload)
    const row = await this.client
      .from('plan_catalog')
      .upsert(
        {
          plan_code: plan.planCode,
          display_name: plan.displayName,
          description: plan.description,
          price_monthly_usd: plan.priceMonthlyUsd,
          collaborators_range_label: plan.collaboratorsRangeLabel,
          default_approval_summary: plan.defaultApprovalSummary,
          limits_json: {
            max_collaborators: plan.limits.maxCollaborators,
            max_branches: plan.limits.maxBranches,
            max_storage_mb: plan.limits.maxStorageMb,
          },
          features_json: {
            multi_branch: plan.features.multiBranch,
            departments_and_teams: plan.features.departmentsAndTeams,
            granular_permissions: plan.features.granularPermissions,
            multilevel_approvals: plan.features.multilevelApprovals,
            cross_area_automations: plan.features.crossAreaAutomations,
            responsible_indicators: plan.features.responsibleIndicators,
            basic_automations: plan.features.basicAutomations,
            ai_assistant: plan.features.aiAssistant,
          },
          is_active: plan.isActive,
        },
        { onConflict: 'plan_code' }
      )
      .select()
      .single()
      .then(unwrap)
    return normalizeDatabasePlanRow(row)
  }

  async listOrganizations() {
    this._assertPlatformAdmin()
    const [organizations, subscriptions, entitlements, usage, members] = await Promise.all([
      this.client
        .from('organizations')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .then(unwrap),
      this.client.from('organization_subscriptions').select('*').then(unwrap),
      this.client.from('organization_entitlements').select('*').then(unwrap),
      this.client.rpc('rpc_admin_organization_usage').then(unwrap),
      this.client.from('organization_members').select('*').is('deleted_at', null).then(unwrap),
    ])

    return organizations.map((org) => ({
      ...camelizeRow(org),
      subscription: camelizeRow(subscriptions.find((s) => s.organization_id === org.id)) || null,
      entitlements: entitlements.filter((e) => e.organization_id === org.id).map(camelizeRow),
      membersCount: Number(usage[org.id]?.members ?? 0),
      activeCollaboratorsCount: Number(usage[org.id]?.active_collaborators ?? 0),
      branchesCount: Number(usage[org.id]?.branches ?? 0),
      departmentsCount: Number(usage[org.id]?.departments ?? 0),
      admins: members
        .filter((m) => (usage[org.id]?.admin_member_ids ?? []).includes(m.id))
        .map((m) => ({ ...camelizeRow(m), roleCode: 'ORG_ADMIN' })),
    }))
  }

  /** Crea un tenant nuevo. Las plantillas de roles salen de permissionsCatalog.js. */
  async provisionOrganization(payload) {
    this._assertPlatformAdmin()
    const result = await this.client
      .rpc('rpc_provision_organization', {
        p: {
          slug: payload.slug,
          display_name: payload.displayName,
          legal_name: payload.legalName,
          tax_id: payload.taxId,
          sector: payload.sector,
          city: payload.city,
          plan_code: payload.planCode || 'starter',
          subscription_status: payload.subscriptionStatus,
          billing_cycle: payload.billingCycle,
          valid_until: payload.validUntil,
          notes: payload.notes,
          role_templates: Object.values(SYSTEM_ROLE_TEMPLATES),
          ...(payload.adminUserId ? { admin_user_id: payload.adminUserId } : {}),
        },
      })
      .then(unwrap)

    const [organization, subscription] = await Promise.all([
      this.client.from('organizations').select('*').eq('id', result.organization_id).single().then(unwrap),
      this.client
        .from('organization_subscriptions')
        .select('*')
        .eq('organization_id', result.organization_id)
        .single()
        .then(unwrap),
    ])
    return { organization: camelizeRow(organization), subscription: camelizeRow(subscription) }
  }

  async updateSubscription({
    organizationId,
    planCode,
    status = 'active',
    billingCycle = 'monthly',
    validUntil,
    maxCollaboratorsOverride = null,
    notes = '',
  }) {
    const session = this._assertPlatformAdmin()
    const patch = {
      plan_code: planCode,
      status,
      billing_cycle: billingCycle,
      assigned_by: session.user.id,
      notes,
    }
    if (validUntil) patch.valid_until = validUntil

    const row = await this.client
      .from('organization_subscriptions')
      .update(patch)
      .eq('organization_id', organizationId)
      .select()
      .single()
      .then(unwrap)

    if (maxCollaboratorsOverride !== null) {
      await this.setEntitlement({
        organizationId,
        entitlementKey: 'max_collaborators',
        valueJson: Number(maxCollaboratorsOverride),
        reason: 'Ajuste junto con la suscripción',
      })
    }
    return camelizeRow(row)
  }

  async setEntitlement({ organizationId, entitlementKey, valueJson, reason = '' }) {
    const session = this._assertPlatformAdmin()
    const row = await this.client
      .from('organization_entitlements')
      .upsert(
        {
          organization_id: organizationId,
          entitlement_key: canonicalEntitlementKey(entitlementKey),
          value_json: valueJson,
          reason,
          updated_by: session.user.id,
        },
        { onConflict: 'organization_id,entitlement_key' }
      )
      .select()
      .single()
      .then(unwrap)
    return camelizeRow(row)
  }

  async listUsers() {
    this._assertPlatformAdmin()
    const [platformAdmins, userProfiles, memberships, organizations] = await Promise.all([
      this.client.from('platform_admins').select('*').then(unwrap),
      this.client.from('user_profiles').select('*').then(unwrap),
      this.client.from('organization_members').select('*').then(unwrap),
      this.client.from('organizations').select('*').then(unwrap),
    ])

    return {
      platformAdmins: platformAdmins.map(camelizeRow),
      userProfiles: userProfiles.map(camelizeRow),
      memberships: memberships.map((m) => {
        const profile = userProfiles.find((u) => u.id === m.user_id)
        return {
          ...camelizeRow(m),
          organizationName:
            organizations.find((o) => o.id === m.organization_id)?.display_name || m.organization_id,
          userEmail: profile?.email || null,
          userFullName: profile?.full_name || m.job_title,
        }
      }),
    }
  }

  async listGlobalAudit({ limit = 200 } = {}) {
    this._assertPlatformAdmin()
    const rows = await this.client
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(unwrap)
    return rows.map(mapAuditLog)
  }

  _assertPlatformAdmin() {
    const { session } = this.store.getSnapshot()
    if (!session.isPlatformAdmin) {
      throw new BackendError('PLATFORM_ADMIN_REQUIRED', 'Operación exclusiva de Platform Admin.')
    }
    return session
  }
}
