/**
 * SERVICIO DE AUTORIZACIÓN MULTICAPA (MEMBRESÍA + PLAN + RBAC + ALCANCE)
 * CoreFlow — src/core/services/AuthorizationService.js
 *
 * Condición 3, 4 y 5: Evalúa la autorización en 3 capas independientes:
 *   1. Membresía activa en la organización (Aislamiento Multi-Tenant)
 *   2. Capacidad habilitada en la edición contratada real (Entitlement Gate)
 *   3. Permiso atómico RBAC + Alcance de datos (ORG_WIDE, BRANCH_SCOPE, DEPARTMENT_SCOPE, TEAM_OR_ASSIGNED)
 * Condición 9: 100% desacoplado de React.
 */

import { DATA_SCOPES, SYSTEM_ROLE_TEMPLATES } from '../config/permissionsCatalog.js'

export class AuthorizationService {
  constructor({ entitlementService, auditService = null }) {
    if (!entitlementService) {
      throw new Error('AuthorizationService requiere una instancia válida de EntitlementService.')
    }
    this.entitlementService = entitlementService
    this.auditService = auditService
  }

  /**
   * Obtiene los permisos efectivos y alcances para un código de rol dentro del tenant.
   */
  resolveRolePermissions({ roleCode, rolePermissions = [] }) {
    const matchingFromOrg = rolePermissions.filter(
      (rp) => rp.roleId && rp.roleId.toUpperCase().endsWith(String(roleCode).toUpperCase())
    )

    if (matchingFromOrg.length > 0) {
      return matchingFromOrg
    }

    const template = SYSTEM_ROLE_TEMPLATES[roleCode]
    return template ? template.permissions : []
  }

  /**
   * Evalúa si un actor con su membresía activa puede ejecutar un permiso sobre un recurso/alcance.
   * No lanza excepción; retorna { allowed, reason, code, effectiveScope }.
   */
  evaluateAccess({
    organization,
    entitlementOverrides = [],
    simulationOverlay = null,
    actorMembership,
    rolePermissions = [],
    permissionKey,
    requiredFeatureKey = null,
    targetResource = null,
  }) {
    // Capa 1: Membresía activa en el tenant
    if (
      !actorMembership ||
      actorMembership.status !== 'active' ||
      actorMembership.deletedAt ||
      actorMembership.organizationId !== organization?.id
    ) {
      return {
        allowed: false,
        code: 'TENANT_ISOLATION_VIOLATION',
        reason: 'El actor no posee una membresía activa en la organización objetivo.',
        effectiveScope: null,
      }
    }

    // Capa 2: Capacidad contratada real del tenant (ignora simulationOverlay)
    if (requiredFeatureKey) {
      try {
        this.entitlementService.assertContractedFeatureEnabled({
          organization,
          entitlementOverrides,
          featureKey: requiredFeatureKey,
          simulationOverlay,
        })
      } catch (err) {
        return {
          allowed: false,
          code: err.code || 'ENTITLEMENT_FEATURE_RESTRICTED',
          reason: err.message,
          effectiveScope: null,
        }
      }
    }

    // Capa 3A: Permiso atómico en el rol activo de la membresía
    const roleCode = actorMembership.roleCode || 'SPECIALIST'
    const permissions = this.resolveRolePermissions({ roleCode, rolePermissions })
    const matchedPermission = permissions.find((p) => p.permissionKey === permissionKey)

    if (!matchedPermission) {
      return {
        allowed: false,
        code: 'RBAC_PERMISSION_DENIED',
        reason: `El rol "${roleCode}" (${actorMembership.displayName || actorMembership.jobTitle}) no posee el permiso requerido "${permissionKey}".`,
        effectiveScope: null,
      }
    }

    const effectiveScope =
      matchedPermission.scopeOverride ||
      SYSTEM_ROLE_TEMPLATES[roleCode]?.defaultScope ||
      DATA_SCOPES.TEAM_OR_ASSIGNED

    // Capa 3B: Evaluación de alcance de datos (Data Scope) sobre el recurso objetivo
    if (targetResource) {
      if (
        targetResource.organizationId &&
        targetResource.organizationId !== organization.id
      ) {
        return {
          allowed: false,
          code: 'TENANT_ISOLATION_VIOLATION',
          reason: 'El recurso objetivo pertenece a otra organización.',
          effectiveScope,
        }
      }

      if (effectiveScope === DATA_SCOPES.BRANCH_SCOPE) {
        if (
          targetResource.branchId &&
          actorMembership.branchId &&
          targetResource.branchId !== actorMembership.branchId
        ) {
          return {
            allowed: false,
            code: 'SCOPE_RESTRICTION_VIOLATION',
            reason: `Alcance restringido a la sede asignada (${actorMembership.branchId}).`,
            effectiveScope,
          }
        }
      } else if (effectiveScope === DATA_SCOPES.DEPARTMENT_SCOPE) {
        const targetDept = targetResource.targetDepartmentId || targetResource.departmentId
        if (
          targetDept &&
          actorMembership.departmentId &&
          targetDept !== actorMembership.departmentId
        ) {
          return {
            allowed: false,
            code: 'SCOPE_RESTRICTION_VIOLATION',
            reason: `El rol "${roleCode}" tiene alcance departamental (${actorMembership.departmentId}) y no puede operar sobre registros o aprobaciones del departamento "${targetDept}".`,
            effectiveScope,
          }
        }
      } else if (effectiveScope === DATA_SCOPES.TEAM_OR_ASSIGNED) {
        const isAssigned =
          !targetResource.assignedMemberId ||
          targetResource.assignedMemberId === actorMembership.id
        if (!isAssigned) {
          return {
            allowed: false,
            code: 'SCOPE_RESTRICTION_VIOLATION',
            reason: `El rol "${roleCode}" solo puede modificar registros asignados directamente a su membresía (${actorMembership.displayName}).`,
            effectiveScope,
          }
        }
      }
    }

    return {
      allowed: true,
      code: 'AUTHORIZED',
      reason: 'Autorización validada en membresía, plan contratado, permiso RBAC y alcance.',
      effectiveScope,
    }
  }

  /**
   * Exige autorización multicapa. Si falla, registra el intento bloqueado en auditoría y lanza error.
   */
  assertAuthorized(params) {
    const evaluation = this.evaluateAccess(params)
    if (!evaluation.allowed) {
      if (this.auditService && params.organization?.id && params.actorMembership) {
        try {
          this.auditService.recordEvent({
            organizationId: params.organization.id,
            actorUserId: params.actorMembership.userId,
            actorMemberId: params.actorMembership.id,
            actorRoleCode: params.actorMembership.roleCode,
            module: 'core.security',
            entityType: 'authorization_check',
            entityId: params.targetResource?.id || params.permissionKey,
            action: 'ACCESS_DENIED',
            summary: `Intento bloqueado (${evaluation.code}): ${evaluation.reason}`,
            changes: {
              permissionKey: params.permissionKey,
              requiredFeatureKey: params.requiredFeatureKey || null,
              simulationOverlay: params.simulationOverlay || null,
            },
          })
        } catch {
          // No ocultar el error principal de autorización si falla el log secundario
        }
      }

      const err = new Error(`AUTHORIZATION_DENIED [${evaluation.code}]: ${evaluation.reason}`)
      err.code = evaluation.code
      err.evaluation = evaluation
      throw err
    }

    return evaluation
  }
}
