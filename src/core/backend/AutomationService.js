// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * REGLAS DE AUTOMATIZACIÓN
 * CoreFlow — src/core/backend/AutomationService.js
 *
 * El permiso `automations:write` y la capacidad del plan los impone RLS.
 */

import { unwrap } from './result.js'
import { mapAutomationRule } from './mappers.js'

export class AutomationService {
  constructor({ client }) {
    this.client = client
  }

  async listRules(organizationId) {
    const rows = await this.client
      .from('automation_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .then(unwrap)
    return rows.map(mapAutomationRule)
  }

  async createRule({ organizationId, payload }) {
    const row = await this.client
      .from('automation_rules')
      .insert({
        organization_id: organizationId,
        code: payload.code || `FLU-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`,
        name: payload.name,
        description: payload.description || 'Regla automatizada configurada en el entorno.',
        trigger_event: payload.triggerEvent || 'request.created',
        scope_type: payload.scopeType || 'basic_notification',
        source_department_id: payload.sourceDepartmentId || null,
        target_department_id: payload.targetDepartmentId || null,
        status: 'active',
      })
      .select()
      .single()
      .then(unwrap)
    return mapAutomationRule(row)
  }

  async setRuleStatus({ organizationId, ruleId, status }) {
    const row = await this.client
      .from('automation_rules')
      .update({ status })
      .eq('organization_id', organizationId)
      .eq('id', ruleId)
      .select()
      .single()
      .then(unwrap)
    return mapAutomationRule(row)
  }
}
