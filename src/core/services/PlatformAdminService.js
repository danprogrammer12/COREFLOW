// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * SERVICIO DE ADMINISTRACIÓN GLOBAL DE PLATAFORMA Y PLANES (COREFLOW PLATFORM ADMIN)
 * CoreFlow — src/core/services/PlatformAdminService.js
 *
 * Responsabilidad (Sección 2.A y Sección 3):
 * Exclusivo para usuarios con rol activo en `platform_admins`.
 * Permite crear y editar planes en PostgreSQL (`plan_catalog`), asignar suscripciones
 * y vigencias a organizaciones (`organization_subscriptions`), configurar capacidades
 * y cuotas (`organization_entitlements`), administrar organizaciones/usuarios y
 * consultar la auditoría global de plataforma.
 */

export class PlatformAdminService {
  constructor({ dataProvider, auditService }) {
    if (!dataProvider) {
      throw new Error('PlatformAdminService requiere una instancia válida de dataProvider.')
    }
    this.provider = dataProvider
    this.auditService = auditService
  }

  _assertPlatformAdmin() {
    const session = this.provider.getCurrentSession()
    if (!session?.isPlatformAdmin) {
      const err = new Error(
        'PLATFORM_ADMIN_REQUIRED: Acceso denegado. Esta operación es exclusiva del contexto CoreFlow Platform Admin.'
      )
      err.code = 'PLATFORM_ADMIN_REQUIRED'
      throw err
    }
    return session
  }

  listPlans() {
    this._assertPlatformAdmin()
    return this.provider.listPlanCatalog()
  }

  upsertPlan(planPayload) {
    const session = this._assertPlatformAdmin()
    const saved = this.provider.upsertPlanCatalog(planPayload)

    this.auditService?.recordEvent({
      organizationId: 'org-principal',
      actorUserId: session.user?.id || 'usr-platform-admin',
      actorMemberId: null,
      actorRoleCode: 'PLATFORM_SUPER_ADMIN',
      module: 'platform.plans',
      entityType: 'plan_catalog',
      entityId: saved.planCode,
      action: 'PLAN_CATALOG_UPSERTED',
      summary: `Plan "${saved.displayName}" (${saved.planCode}) guardado en catálogo PostgreSQL.`,
      changes: {
        planCode: saved.planCode,
        limits: saved.limits,
        features: saved.features,
        priceMonthlyUsd: saved.priceMonthlyUsd,
      },
    })

    return saved
  }

  listOrganizationsWithSubscriptions() {
    this._assertPlatformAdmin()
    return this.provider.listAllOrganizationsForPlatformAdmin()
  }

  createOrganizationWithSubscription(orgPayload) {
    const session = this._assertPlatformAdmin()
    const created = this.provider.createOrganizationByPlatformAdmin(orgPayload)

    this.auditService?.recordEvent({
      organizationId: created.organization.id,
      actorUserId: session.user?.id || 'usr-platform-admin',
      actorMemberId: null,
      actorRoleCode: 'PLATFORM_SUPER_ADMIN',
      module: 'platform.organizations',
      entityType: 'organization',
      entityId: created.organization.id,
      action: 'ORGANIZATION_CREATED',
      summary: `Organización "${created.organization.displayName}" aprovisionada con plan "${created.subscription.planCode}".`,
      changes: {
        organizationId: created.organization.id,
        planCode: created.subscription.planCode,
        status: created.subscription.status,
      },
    })

    return created
  }

  updateOrganizationSubscription({
    organizationId,
    planCode,
    status = 'active',
    billingCycle = 'monthly',
    validUntil,
    maxCollaboratorsOverride = null,
    notes = '',
  }) {
    const session = this._assertPlatformAdmin()
    const updated = this.provider.updateSubscriptionByPlatformAdmin({
      organizationId,
      planCode,
      status,
      billingCycle,
      validUntil,
      maxCollaboratorsOverride,
      notes,
      assignedBy: session.user?.id,
    })

    this.auditService?.recordEvent({
      organizationId,
      actorUserId: session.user?.id || 'usr-platform-admin',
      actorMemberId: null,
      actorRoleCode: 'PLATFORM_SUPER_ADMIN',
      module: 'platform.subscriptions',
      entityType: 'organization_subscription',
      entityId: organizationId,
      action: 'SUBSCRIPTION_UPDATED',
      summary: `Suscripción de "${organizationId}" actualizada a plan "${planCode}" (${status}).`,
      changes: {
        organizationId,
        planCode,
        status,
        billingCycle,
        validUntil,
        maxCollaboratorsOverride,
      },
    })

    return updated
  }

  updateOrganizationFeatureOrQuota({
    organizationId,
    entitlementKey,
    valueJson,
    reason = 'Ajuste administrativo desde CoreFlow Platform Admin',
  }) {
    const session = this._assertPlatformAdmin()
    const updated = this.provider.upsertEntitlementByPlatformAdmin({
      organizationId,
      entitlementKey,
      valueJson,
      reason,
      updatedBy: session.user?.id,
    })

    this.auditService?.recordEvent({
      organizationId,
      actorUserId: session.user?.id || 'usr-platform-admin',
      actorMemberId: null,
      actorRoleCode: 'PLATFORM_SUPER_ADMIN',
      module: 'platform.entitlements',
      entityType: 'organization_entitlement',
      entityId: `${organizationId}:${entitlementKey}`,
      action: 'ENTITLEMENT_OVERRIDE_UPDATED',
      summary: `Capacidad/cuota "${entitlementKey}" configurada en ${JSON.stringify(valueJson)} para ${organizationId}.`,
      changes: {
        organizationId,
        entitlementKey,
        valueJson,
        reason,
      },
    })

    return updated
  }

  listPlatformUsersAndAdmins() {
    this._assertPlatformAdmin()
    return this.provider.listAllUsersForPlatformAdmin()
  }

  listGlobalAuditLogs() {
    this._assertPlatformAdmin()
    return this.provider.listGlobalAuditLogsForPlatformAdmin()
  }
}
