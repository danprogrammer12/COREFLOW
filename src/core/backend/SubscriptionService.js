// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * SUSCRIPCIONES, CAPACIDADES Y USO
 * CoreFlow — src/core/backend/SubscriptionService.js
 *
 * Capacidades, límites y uso se calculan en PostgreSQL; aquí solo se adaptan.
 */

import { unwrap } from './result.js'
import { camelizeRow, mapCapabilities } from './mappers.js'

export class SubscriptionService {
  constructor({ client }) {
    this.client = client
  }

  async getCurrent(organizationId) {
    const row = await this.client
      .from('organization_subscriptions')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle()
      .then(unwrap)
    return camelizeRow(row) || null
  }

  async getEntitlements(organizationId) {
    const capabilities = await this.client
      .rpc('rpc_get_org_capabilities', { p_org: organizationId })
      .then(unwrap)
    return mapCapabilities(capabilities)
  }

  async getUsage(organizationId) {
    const resolved = await this.getEntitlements(organizationId)
    return { ...resolved.usage, limits: resolved.realLimits, canWrite: resolved.canWrite }
  }
}
