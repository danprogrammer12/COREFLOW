/**
 * VALIDADOR DE INTEGRIDAD REFERENCIAL INTRA-ORGANIZACIÓN
 * CoreFlow — src/core/domain/integrityValidator.js
 *
 * Condición 6: Garantizar integridad referencial entre registros de una misma organización.
 * Equivalente en dominio a las restricciones PostgreSQL:
 * FOREIGN KEY (entity_id, organization_id) REFERENCES target_table(id, organization_id)
 */

export class CrossOrganizationReferenceError extends Error {
  constructor(message, details = {}) {
    super(message)
    this.name = 'CrossOrganizationReferenceError'
    this.code = 'CROSS_ORG_REFERENCE_VIOLATION'
    this.details = details
  }
}

/**
 * Verifica que una entidad referenciada exista y pertenezca exactamente al mismo organizationId
 */
export function assertSameOrganizationReference({
  sourceEntityName,
  targetEntityName,
  targetCollection,
  targetId,
  expectedOrganizationId,
  allowNull = false,
}) {
  if (!targetId) {
    if (allowNull) return true
    throw new CrossOrganizationReferenceError(
      `INTEGRITY_ERROR: ${sourceEntityName} requiere una referencia válida a ${targetEntityName}.`,
      { sourceEntityName, targetEntityName, expectedOrganizationId }
    )
  }

  const found = (targetCollection || []).find(
    (item) => item.id === targetId && !item.deletedAt
  )

  if (!found) {
    throw new CrossOrganizationReferenceError(
      `INTEGRITY_ERROR: El registro referenciado en ${targetEntityName} (${targetId}) no existe o fue eliminado.`,
      { sourceEntityName, targetEntityName, targetId, expectedOrganizationId }
    )
  }

  if (found.organizationId !== expectedOrganizationId) {
    throw new CrossOrganizationReferenceError(
      `CROSS_ORG_REFERENCE_VIOLATION: Intento de vincular ${sourceEntityName} de la organización "${expectedOrganizationId}" con ${targetEntityName} ("${targetId}") perteneciente a otra organización ("${found.organizationId}").`,
      {
        sourceEntityName,
        targetEntityName,
        targetId,
        expectedOrganizationId,
        actualOrganizationId: found.organizationId,
      }
    )
  }

  return found
}
