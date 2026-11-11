/**
 * PERMISOS EFECTIVOS PARA LA INTERFAZ
 * CoreFlow — src/core/backend/AuthorizationService.js
 *
 * Solo anticipa qué mostrar o deshabilitar. No es autoridad: la decisión real la
 * toman RLS y las RPC en PostgreSQL.
 */

import { unwrap } from './result.js'

export class AuthorizationService {
  constructor({ client, store, subscriptions }) {
    this.client = client
    this.store = store
    this.subscriptions = subscriptions
  }

  async getEffectivePermissions(organizationId) {
    const { session } = this.store.getSnapshot()
    const membership = session.memberships.find((m) => m.organizationId === organizationId)
    if (!membership) return []

    const [role, permissions] = await Promise.all([
      this.client.from('roles').select('*').eq('id', membership.roleId).maybeSingle().then(unwrap),
      this.client
        .from('role_permissions')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('role_id', membership.roleId)
        .then(unwrap),
    ])

    return permissions.map((p) => ({
      permissionKey: p.permission_key,
      scope: p.scope_override || role?.default_scope || null,
    }))
  }

  /** `requiredFeature` usa el nombre en camelCase, por ejemplo `multilevelApprovals`. */
  async can(organizationId, permissionKey, { requiredFeature = null, requiresWrite = false } = {}) {
    const [permissions, entitlements] = await Promise.all([
      this.getEffectivePermissions(organizationId),
      requiredFeature || requiresWrite ? this.subscriptions.getEntitlements(organizationId) : null,
    ])

    if (!permissions.some((p) => p.permissionKey === permissionKey)) {
      return { allowed: false, code: 'RBAC_PERMISSION_DENIED' }
    }
    if (requiresWrite && !entitlements.canWrite) {
      return { allowed: false, code: 'SUBSCRIPTION_INACTIVE' }
    }
    if (requiredFeature && !entitlements.realFeatures[requiredFeature]) {
      return { allowed: false, code: 'ENTITLEMENT_FEATURE_RESTRICTED' }
    }
    return { allowed: true, code: 'AUTHORIZED' }
  }
}
