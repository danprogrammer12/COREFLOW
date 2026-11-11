/**
 * INDICADORES CALCULADOS CON DATOS REALES
 * CoreFlow — src/core/backend/MetricsService.js
 *
 * Devuelve la forma de `unifiedMetrics`. Lo que no se puede calcular llega como
 * 'N/D': nunca null, porque la interfaz sustituiría null por cifras de relleno.
 */

import { unwrap } from './result.js'

export class MetricsService {
  constructor({ client }) {
    this.client = client
  }

  async getOrganizationMetrics({ organizationId, period = '7d', entitlementsResolved = null }) {
    const metrics = await this.client
      .rpc('rpc_get_org_metrics', { p_org: organizationId, p_period: period })
      .then(unwrap)
    return { ...metrics, entitlementsResolved }
  }
}
