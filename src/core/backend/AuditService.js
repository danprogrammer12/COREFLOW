// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * CONSULTA DE AUDITORÍA Y EVENTOS DE CLIENTE
 * CoreFlow — src/core/backend/AuditService.js
 *
 * Los cambios de datos los audita PostgreSQL por trigger, con el actor real. Desde
 * aquí solo se registran los eventos que el servidor no puede observar.
 */

import { unwrap } from './result.js'
import { mapAuditLog } from './mappers.js'

export class AuditService {
  constructor({ client, logger = console }) {
    this.client = client
    this.logger = logger
  }

  async listOrganizationLogs(organizationId, { limit = 200 } = {}) {
    const rows = await this.client
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(unwrap)
    return rows.map(mapAuditLog)
  }

  async listGlobalLogs({ limit = 200 } = {}) {
    const rows = await this.client
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
      .then(unwrap)
    return rows.map(mapAuditLog)
  }

  async recordClientEvent({ organizationId, module, entityType, entityId, action, summary, changes = {} }) {
    await this.client
      .rpc('rpc_record_client_event', {
        p_org: organizationId ?? null,
        p_module: module,
        p_entity_type: entityType,
        p_entity_id: String(entityId),
        p_action: action,
        p_summary: summary,
        p_changes: changes,
      })
      .then(unwrap)
    return { recorded: true }
  }

  /** Un evento informativo no debe impedir la operación, pero su fallo queda visible. */
  async _recordBestEffort(event) {
    try {
      await this.recordClientEvent(event)
    } catch (err) {
      this.logger.warn?.(`No se pudo registrar el evento ${event.action}: ${err.message}`)
    }
  }
}
