/**
 * SERVICIO DE FLUJO DE SOLICITUDES Y APROBACIONES CON INTEGRIDAD Y ALCANCE RBAC
 * CoreFlow — src/core/services/WorkflowContractService.js
 *
 * Condición 3, 4, 5, 6, 7 y 9: Gestiona creación, transición de estados y validación
 * de niveles de aprobación aplicando membresía activa, plan contratado real,
 * permisos RBAC con alcance departamental y claves foráneas compuestas intra-tenant.
 * 100% desacoplado de React.
 */

import { ATOMIC_PERMISSIONS } from '../config/permissionsCatalog.js'
import { getNextCycledStatus, validateRequestTransition } from '../domain/requestStateMachine.js'

export class WorkflowContractService {
  constructor({
    dataProvider,
    organizationService,
    authorizationService,
    auditService,
  }) {
    this.provider = dataProvider
    this.organizationService = organizationService
    this.authorizationService = authorizationService
    this.auditService = auditService
  }

  listRequests(organizationId) {
    return this.provider.listRequests(organizationId)
  }

  listApprovalSteps(organizationId, requestId = null) {
    return this.provider.listApprovalSteps(organizationId, requestId)
  }

  /**
   * Crea una nueva solicitud verificando permisos RBAC (`requests:create`) y
   * claves foráneas compuestas dentro del mismo `organizationId` (Condición 6).
   */
  createRequest({
    organizationId,
    actorMemberId = null,
    simulationOverlay = null,
    payload,
  }) {
    const ctx = this.organizationService.getActiveTenantContext({
      organizationId,
      simulationOverlay,
      activeMemberIdOverride: actorMemberId,
    })

    const targetBranchId = payload.branchId || ctx.branches[0]?.id
    const targetDeptObj =
      ctx.departments.find(
        (d) => d.id === payload.departmentId || d.name === payload.departamento
      ) || ctx.departments[0]

    const targetDepartmentId =
      payload.departmentId !== undefined ? payload.departmentId : targetDeptObj?.id
    const targetMemberObj =
      ctx.members.find(
        (m) => m.id === payload.assignedMemberId || m.displayName === payload.responsable
      ) || ctx.activeMembership

    const targetAssignedMemberId =
      payload.assignedMemberId !== undefined ? payload.assignedMemberId : targetMemberObj?.id

    // Autorización multicapa
    this.authorizationService.assertAuthorized({
      organization: ctx.organization,
      entitlementOverrides: ctx.entitlements,
      simulationOverlay,
      actorMembership: ctx.activeMembership,
      rolePermissions: ctx.rolePermissions,
      permissionKey: ATOMIC_PERMISSIONS.REQUESTS_CREATE,
      targetResource: {
        organizationId: ctx.organization.id,
        branchId: targetBranchId,
        departmentId: targetDepartmentId,
      },
    })

    const nivelAprobacion =
      payload.nivelAprobacion || ctx.entitlementsResolved.defaultApprovalSummary

    const created = this.provider.insertRequest({
      organizationId: ctx.organization.id,
      code: payload.code,
      asunto: payload.asunto,
      cliente: payload.cliente,
      clienteId: payload.clienteId || 'CTA-GEN',
      branchId: targetBranchId,
      departmentId: targetDepartmentId,
      departamento: payload.departamento || targetDeptObj?.name || 'Operación General',
      assignedMemberId: targetAssignedMemberId,
      responsable: payload.responsable || targetMemberObj?.displayName || 'Coordinación General',
      prioridad: payload.prioridad || 'Media',
      estado: payload.estado || 'process',
      vencimiento: payload.vencimiento || 'En tiempo (48h)',
      nivelAprobacion,
    })

    this.auditService?.recordEvent({
      organizationId: ctx.organization.id,
      actorUserId: ctx.activeMembership.userId,
      actorMemberId: ctx.activeMembership.id,
      actorRoleCode: ctx.activeMembership.roleCode,
      module: 'core.requests',
      entityType: 'request',
      entityId: created.id,
      action: 'REQUEST_CREATED',
      summary: `Solicitud ${created.code} creada para "${created.cliente}" en ${created.departamento}.`,
      changes: {
        code: created.code,
        departmentId: created.departmentId,
        assignedMemberId: created.assignedMemberId,
        estado: created.estado,
      },
    })

    return created
  }

  /**
   * Cambia el estado de una solicitud verificando permisos RBAC (`requests:update`),
   * alcance de datos y contrato de transición de estado.
   */
  transitionRequestStatus({
    organizationId,
    actorMemberId = null,
    simulationOverlay = null,
    requestId,
    nextStatus = null,
  }) {
    const ctx = this.organizationService.getActiveTenantContext({
      organizationId,
      simulationOverlay,
      activeMemberIdOverride: actorMemberId,
    })

    const requests = this.provider.listRequests(ctx.organization.id)
    const currentReq = requests.find((r) => r.id === requestId)
    if (!currentReq) {
      const err = new Error(
        `ENTITY_NOT_FOUND: La solicitud "${requestId}" no existe en la organización "${ctx.organization.id}".`
      )
      err.code = 'ENTITY_NOT_FOUND'
      throw err
    }

    this.authorizationService.assertAuthorized({
      organization: ctx.organization,
      entitlementOverrides: ctx.entitlements,
      simulationOverlay,
      actorMembership: ctx.activeMembership,
      rolePermissions: ctx.rolePermissions,
      permissionKey: ATOMIC_PERMISSIONS.REQUESTS_UPDATE,
      targetResource: currentReq,
    })

    const resolvedNextStatus = nextStatus || getNextCycledStatus(currentReq.estado)
    const transitionCheck = validateRequestTransition({
      currentStatus: currentReq.estado,
      nextStatus: resolvedNextStatus,
      approvalSteps: this.provider.listApprovalSteps(ctx.organization.id, requestId),
      enforceMultilevelApproval: false,
    })

    if (!transitionCheck.valid) {
      const err = new Error(`WORKFLOW_TRANSITION_ERROR: ${transitionCheck.reason}`)
      err.code = transitionCheck.code
      throw err
    }

    const updated = this.provider.updateRequest(ctx.organization.id, requestId, {
      estado: resolvedNextStatus,
      nivelAprobacion:
        resolvedNextStatus === 'completed' || resolvedNextStatus === 'active'
          ? 'Validado'
          : currentReq.nivelAprobacion,
    })

    this.auditService?.recordEvent({
      organizationId: ctx.organization.id,
      actorUserId: ctx.activeMembership.userId,
      actorMemberId: ctx.activeMembership.id,
      actorRoleCode: ctx.activeMembership.roleCode,
      module: 'core.requests',
      entityType: 'request',
      entityId: updated.id,
      action: 'REQUEST_STATUS_TRANSITIONED',
      summary: `Estado de ${updated.code} actualizado de "${currentReq.estado}" a "${resolvedNextStatus}".`,
      changes: {
        previousStatus: currentReq.estado,
        newStatus: resolvedNextStatus,
      },
    })

    return updated
  }

  /**
   * Valida o aprueba un paso de aprobación multinivel verificando:
   * 1. Membresía activa en el tenant
   * 2. Que la edición contratada real tenga `multilevelApprovals: true` (Business)
   * 3. Que el rol tenga el permiso `approvals:validate_level`
   * 4. Que el alcance departamental (`DEPARTMENT_SCOPE`) coincida con `targetDepartmentId` del nivel
   */
  validateApprovalStep({
    organizationId,
    actorMemberId = null,
    simulationOverlay = null,
    requestId,
    stepOrder = 2,
  }) {
    const ctx = this.organizationService.getActiveTenantContext({
      organizationId,
      simulationOverlay,
      activeMemberIdOverride: actorMemberId,
    })

    const steps = this.provider.listApprovalSteps(ctx.organization.id, requestId)
    const targetStep =
      steps.find((s) => s.stepOrder === stepOrder) ||
      steps.find((s) => s.status === 'pending') || {
        id: `apr-${requestId}-${stepOrder}`,
        organizationId: ctx.organization.id,
        requestId,
        stepOrder,
        targetDepartmentId: 'dept-prin-ops',
      }

    // Evalúa las 3 capas: Membresía + Plan Contratado (multilevelApprovals) + Permiso + Alcance Departamental
    this.authorizationService.assertAuthorized({
      organization: ctx.organization,
      entitlementOverrides: ctx.entitlements,
      simulationOverlay,
      actorMembership: ctx.activeMembership,
      rolePermissions: ctx.rolePermissions,
      permissionKey: ATOMIC_PERMISSIONS.APPROVALS_VALIDATE_LEVEL,
      requiredFeatureKey: 'multilevelApprovals',
      targetResource: targetStep,
    })

    if (this.provider.state?.approvalSteps) {
      this.provider.state.approvalSteps = this.provider.state.approvalSteps.map((s) =>
        s.id === targetStep.id ? { ...s, status: 'approved' } : s
      )
    }

    const updatedRequest = this.provider.updateRequest(ctx.organization.id, requestId, {
      estado: 'active',
      nivelAprobacion: `Validado por ${ctx.activeMembership.displayName}`,
    })

    this.auditService?.recordEvent({
      organizationId: ctx.organization.id,
      actorUserId: ctx.activeMembership.userId,
      actorMemberId: ctx.activeMembership.id,
      actorRoleCode: ctx.activeMembership.roleCode,
      module: 'core.approvals',
      entityType: 'approval_step',
      entityId: targetStep.id,
      action: 'APPROVAL_STEP_VALIDATED',
      summary: `Nivel ${targetStep.stepOrder} de ${requestId} aprobado por ${ctx.activeMembership.displayName} (${ctx.activeMembership.roleCode}).`,
      changes: {
        requestId,
        stepOrder: targetStep.stepOrder,
        targetDepartmentId: targetStep.targetDepartmentId,
        status: 'approved',
      },
    })

    return {
      step: { ...targetStep, status: 'approved' },
      request: updatedRequest,
    }
  }
}
