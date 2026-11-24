// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * SERVICIO DEL NÚCLEO ORGANIZACIONAL (AUTENTICACIÓN, TENANCY, SEDES, DEPARTAMENTOS Y MEMBRESÍAS)
 * CoreFlow — src/core/services/OrganizationService.js
 *
 * Gestiona la autenticación de sesión, el contexto multi-tenant, cambio de
 * organización validado por membresía, estructura organizacional y control de cuotas.
 * 100% desacoplado de React.
 */

import { ATOMIC_PERMISSIONS } from '../config/permissionsCatalog.js'

export class OrganizationService {
  constructor({ dataProvider, entitlementService, authorizationService, auditService }) {
    this.provider = dataProvider
    this.entitlementService = entitlementService
    this.authorizationService = authorizationService
    this.auditService = auditService
  }

  authenticateAccount({ email, password }) {
    const session = this.provider.authenticateByEmail({ email, password })
    if (this.auditService && session?.isAuthenticated) {
      this.auditService.recordEvent({
        organizationId: session.activeOrganizationId || 'org-principal',
        actorUserId: session.user.id,
        actorMemberId: session.memberships?.[0]?.id || null,
        actorRoleCode: session.isPlatformAdmin
          ? 'PLATFORM_SUPER_ADMIN'
          : session.memberships?.[0]?.roleCode || 'ORG_ADMIN',
        module: 'core.auth',
        entityType: 'session',
        entityId: session.user.id,
        action: 'SESSION_AUTHENTICATED',
        summary: `Inicio de sesión autenticado para "${session.user.email}" en contexto ${session.accessContext}.`,
        changes: {
          email: session.user.email,
          accessContext: session.accessContext,
          activeOrganizationId: session.activeOrganizationId,
        },
      })
    }
    return session
  }

  signOut() {
    return this.provider.signOut()
  }

  getSessionSummary() {
    return this.provider.getCurrentSession()
  }

  switchOrganization(organizationId) {
    const result = this.provider.switchActiveOrganization(organizationId)
    const context = this.provider.getOrganizationContext(organizationId)

    if (this.auditService && result.membership) {
      this.auditService.recordEvent({
        organizationId,
        actorUserId: result.membership.userId,
        actorMemberId: result.membership.id,
        actorRoleCode: result.membership.roleCode,
        module: 'core.tenancy',
        entityType: 'organization',
        entityId: organizationId,
        action: 'TENANT_CONTEXT_SWITCHED',
        summary: `Cambio de contexto organizacional activo hacia "${context.organization?.displayName || organizationId}".`,
        changes: {
          activeOrganizationId: organizationId,
          contractedPlan: context.organization?.contractedPlanCode,
        },
      })
    }

    return result
  }

  getActiveTenantContext({
    organizationId,
    simulationOverlay = null,
    activeMemberIdOverride = null,
  } = {}) {
    const rawContext = this.provider.getOrganizationContext(organizationId)
    const resolvedEntitlements = this.entitlementService.resolveEntitlements({
      organization: rawContext.organization,
      subscription: rawContext.subscription,
      planCatalog: rawContext.planCatalog,
      entitlementOverrides: rawContext.entitlements,
      simulationOverlay,
    })

    let activeMembership = rawContext.membership
    if (activeMemberIdOverride) {
      const candidate = rawContext.members.find(
        (m) =>
          m.id === activeMemberIdOverride &&
          m.organizationId === rawContext.organization.id &&
          m.status === 'active'
      )
      if (candidate) {
        activeMembership = candidate
      }
    }

    return {
      ...rawContext,
      activeMembership,
      entitlementsResolved: resolvedEntitlements,
    }
  }

  createDepartment({
    organizationId,
    actorMemberId = null,
    simulationOverlay = null,
    branchId,
    code,
    name,
    description = '',
  }) {
    const ctx = this.getActiveTenantContext({
      organizationId,
      simulationOverlay,
      activeMemberIdOverride: actorMemberId,
    })

    this.authorizationService.assertAuthorized({
      organization: ctx.organization,
      entitlementOverrides: ctx.entitlements,
      simulationOverlay,
      actorMembership: ctx.activeMembership,
      rolePermissions: ctx.rolePermissions,
      permissionKey: ATOMIC_PERMISSIONS.ORG_MANAGE_DEPARTMENTS,
      requiredFeatureKey: 'departmentsAndTeams',
      targetResource: { organizationId: ctx.organization.id, branchId },
    })

    const newDept = {
      id: `dept-${ctx.organization.id}-${String(code).toLowerCase()}`,
      organizationId: ctx.organization.id,
      branchId: branchId || ctx.branches[0]?.id,
      code: String(code).toUpperCase(),
      name,
      description,
      status: 'active',
      deletedAt: null,
    }

    if (this.provider.state?.departments) {
      this.provider.state.departments.push(newDept)
      this.provider._saveState?.()
    }

    this.auditService?.recordEvent({
      organizationId: ctx.organization.id,
      actorUserId: ctx.activeMembership.userId,
      actorMemberId: ctx.activeMembership.id,
      actorRoleCode: ctx.activeMembership.roleCode,
      module: 'core.organization',
      entityType: 'department',
      entityId: newDept.id,
      action: 'DEPARTMENT_CREATED',
      summary: `Departamento "${name}" (${newDept.code}) creado en ${ctx.organization.displayName}.`,
      changes: { code: newDept.code, name, branchId: newDept.branchId },
    })

    return newDept
  }

  registerCollaboratorBatch({
    organizationId,
    actorMemberId = null,
    simulationOverlay = null,
    additionalCount = 1,
  }) {
    const ctx = this.getActiveTenantContext({
      organizationId,
      simulationOverlay,
      activeMemberIdOverride: actorMemberId,
    })

    this.authorizationService.assertAuthorized({
      organization: ctx.organization,
      entitlementOverrides: ctx.entitlements,
      simulationOverlay,
      actorMembership: ctx.activeMembership,
      rolePermissions: ctx.rolePermissions,
      permissionKey: ATOMIC_PERMISSIONS.ORG_MANAGE_MEMBERS,
    })

    const quotaCheck = this.entitlementService.assertCollaboratorQuotaAvailable({
      organization: ctx.organization,
      subscription: ctx.subscription,
      planCatalog: ctx.planCatalog,
      entitlementOverrides: ctx.entitlements,
      currentCollaboratorsCount: ctx.organization.activeCollaboratorsCount,
      additionalCount,
    })

    return quotaCheck
  }
}
