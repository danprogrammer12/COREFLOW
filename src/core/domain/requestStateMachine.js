// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * CONTRATO FUNDAMENTAL DE ESTADOS DE SOLICITUDES Y APROBACIONES
 * CoreFlow — src/core/domain/requestStateMachine.js
 *
 * Define las transiciones válidas de estado y las reglas base de cierre sin
 * introducir motores complejos de automatización prematuramente.
 */

export const REQUEST_STATUSES = Object.freeze({
  PENDING: 'pending',
  PROCESS: 'process',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ERROR: 'error',
})

const ALLOWED_TRANSITIONS = Object.freeze({
  pending: ['process', 'active', 'completed', 'error'],
  process: ['pending', 'active', 'completed', 'error'],
  active: ['process', 'completed', 'error', 'pending'],
  error: ['process', 'pending', 'active', 'completed'],
  completed: ['process', 'active'], // Reapertura controlada
})

const CYCLE_ORDER = ['pending', 'process', 'active', 'completed']

export function getNextCycledStatus(currentStatus) {
  const idx = CYCLE_ORDER.indexOf(currentStatus)
  if (idx === -1) return 'process'
  return CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length]
}

export function validateRequestTransition({
  currentStatus,
  nextStatus,
  approvalSteps = [],
  enforceMultilevelApproval = false,
}) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || []
  if (!allowed.includes(nextStatus)) {
    return {
      valid: false,
      code: 'INVALID_STATE_TRANSITION',
      reason: `No se permite la transición directa de "${currentStatus}" a "${nextStatus}".`,
    }
  }

  if (nextStatus === REQUEST_STATUSES.COMPLETED && enforceMultilevelApproval) {
    const unapprovedSteps = approvalSteps.filter((s) => s.status !== 'approved')
    if (unapprovedSteps.length > 0) {
      return {
        valid: false,
        code: 'PENDING_APPROVAL_STEPS',
        reason: `No se puede cerrar la solicitud: existen ${unapprovedSteps.length} nivel(es) de aprobación pendientes de validar.`,
      }
    }
  }

  return { valid: true, code: 'OK', reason: 'Transición válida.' }
}
