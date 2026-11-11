/**
 * SANITIZADOR Y CONGELADOR INMUTABLE DE AUDITORÍA
 * CoreFlow — src/core/domain/auditSanitizer.js
 *
 * Condición 7: Implementar auditoría protegida con control de modificaciones
 * y eliminación, evitando almacenar información sensible.
 */

const SENSITIVE_KEY_PATTERN =
  /password|passphrase|secret|token|api_?key|private_?key|hash|credential|jwt|authorization|cookie|ssn|credit_?card/i

/**
 * Clona y redacta recursivamente cualquier propiedad sensible antes de persistir en auditoría
 */
export function sanitizeAuditPayload(input, depth = 0) {
  if (depth > 8 || input === null || input === undefined) {
    return input
  }

  if (typeof input !== 'object') {
    return input
  }

  if (Array.isArray(input)) {
    const arr = input.map((item) => sanitizeAuditPayload(item, depth + 1))
    return Object.freeze(arr)
  }

  const sanitized = {}
  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeAuditPayload(value, depth + 1)
    } else {
      sanitized[key] = value
    }
  }

  return Object.freeze(sanitized)
}

/**
 * Construye un registro de auditoría inmutable (deep freeze)
 */
export function createImmutableAuditRecord({
  id,
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
  createdAt = new Date().toISOString(),
}) {
  if (!organizationId || !actorUserId || !module || !entityType || !action) {
    throw new Error('AUDIT_CONTRACT_ERROR: Faltan campos obligatorios para el registro de auditoría.')
  }

  const record = {
    id: id || `aud-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    organizationId,
    actorUserId,
    actorMemberId: actorMemberId || null,
    actorRoleCode: actorRoleCode || 'UNKNOWN',
    module,
    entityType,
    entityId: String(entityId || 'N/A'),
    action,
    summary: String(summary || action),
    sanitizedChanges: sanitizeAuditPayload(changes || {}),
    changes: sanitizeAuditPayload(changes || {}),
    createdAt,
  }

  return Object.freeze(record)
}
