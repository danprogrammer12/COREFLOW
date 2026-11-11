/**
 * SOLICITUDES Y APROBACIONES
 * CoreFlow — src/core/backend/WorkflowService.js
 *
 * Las escrituras pasan por RPC transaccionales: estados, aprobaciones y alcance se
 * deciden en PostgreSQL.
 */

import { BackendError, unwrap } from './result.js'
import { mapApprovalStep, mapRequest } from './mappers.js'
import { getNextCycledStatus } from '../domain/requestStateMachine.js'

export class WorkflowService {
  constructor({ client, organizations }) {
    this.client = client
    this.organizations = organizations
  }

  async listRequests(organizationId) {
    const [rows, directory] = await Promise.all([
      this.client
        .from('requests')
        .select('*')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .then(unwrap),
      this.organizations._loadDirectory(organizationId),
    ])
    return rows.map((r) => mapRequest(r, directory))
  }

  async listApprovalSteps(organizationId, requestId = null) {
    let query = this.client
      .from('approval_steps')
      .select('*')
      .eq('organization_id', organizationId)
    if (requestId) query = query.eq('request_id', requestId)
    const rows = await query.order('step_order', { ascending: true }).then(unwrap)
    return rows.map(mapApprovalStep)
  }

  async createRequest({ organizationId, payload }) {
    const directory = await this.organizations._loadDirectory(organizationId)
    const department =
      payload.departmentId ??
      [...directory.departments.values()].find((d) => d.name === payload.departamento)?.id ??
      null
    const assigned =
      payload.assignedMemberId ??
      [...directory.members.values()].find((m) => m.displayName === payload.responsable)?.id ??
      null

    const row = await this.client
      .rpc('rpc_create_request', {
        p_org: organizationId,
        p_payload: {
          code: payload.code,
          subject: payload.asunto,
          client_display_name: payload.cliente,
          client_reference_code: payload.clienteId,
          branch_id: payload.branchId,
          department_id: department,
          assigned_member_id: assigned,
          priority: payload.prioridad,
          due_label: payload.vencimiento,
          approval_steps: payload.approvalSteps,
        },
      })
      .then(unwrap)
    return mapRequest(row, directory)
  }

  /** Sin `nextStatus`, avanza al siguiente estado del ciclo, como el flujo local. */
  async transitionRequest({ organizationId, requestId, nextStatus = null }) {
    const directory = await this.organizations._loadDirectory(organizationId)
    let target = nextStatus
    if (!target) {
      const current = await this.client
        .from('requests')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('id', requestId)
        .maybeSingle()
        .then(unwrap)
      if (!current) {
        throw new BackendError('ENTITY_NOT_FOUND', 'La solicitud no existe en la organización.')
      }
      target = getNextCycledStatus(current.status)
    }

    const row = await this.client
      .rpc('rpc_transition_request', { p_org: organizationId, p_request: requestId, p_next: target })
      .then(unwrap)
    return mapRequest(row, directory)
  }

  /** Identifica el paso por `stepId`, por `stepOrder` o toma el primero sin decidir. */
  async decideApprovalStep({ organizationId, requestId, stepId = null, stepOrder = null, decision = 'approved', comment = null }) {
    let id = stepId
    if (!id) {
      const steps = await this.listApprovalSteps(organizationId, requestId)
      const step =
        steps.find((s) => s.stepOrder === stepOrder) ||
        steps.find((s) => s.status === 'pending' || s.status === 'process')
      if (!step) {
        throw new BackendError('ENTITY_NOT_FOUND', 'La solicitud no tiene pasos de aprobación pendientes.')
      }
      id = step.id
    }

    const step = await this.client
      .rpc('rpc_decide_approval_step', {
        p_org: organizationId,
        p_step: id,
        p_decision: decision,
        p_comment: comment,
      })
      .then(unwrap)

    const [requestRow, directory] = await Promise.all([
      this.client.from('requests').select('*').eq('id', step.request_id).maybeSingle().then(unwrap),
      this.organizations._loadDirectory(organizationId),
    ])
    return {
      step: mapApprovalStep(step),
      request: requestRow ? mapRequest(requestRow, directory) : null,
    }
  }
}
