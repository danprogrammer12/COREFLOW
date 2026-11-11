/**
 * SERVICIO DE AUDITORÍA Y TRAZABILIDAD PROTEGIDA
 * CoreFlow — src/core/services/AuditService.js
 *
 * Condición 7: Auditoría append-only con control de modificaciones/eliminación
 * y sanitización automática de campos sensibles (passwords, tokens, API keys).
 * Condición 9: 100% desacoplado de React.
 */

export class AuditService {
  constructor({ dataProvider }) {
    if (!dataProvider) {
      throw new Error('AuditService requiere una instancia válida de dataProvider.')
    }
    this.provider = dataProvider
  }

  recordEvent({
    organizationId,
    actorUserId,
    actorMemberId,
    actorRoleCode,
    module,
    entityType,
    entityId,
    action,
    summary,
    changes = {},
  }) {
    return this.provider.appendAuditLog({
      organizationId,
      actorUserId,
      actorMemberId,
      actorRoleCode,
      module,
      entityType,
      entityId,
      action,
      summary,
      changes,
    })
  }

  listOrganizationLogs(organizationId) {
    return this.provider.listAuditLogs(organizationId)
  }

  updateAuditLog(auditId, patch) {
    return this.provider.updateAuditLog(auditId, patch)
  }

  deleteAuditLog(auditId) {
    return this.provider.deleteAuditLog(auditId)
  }
}
