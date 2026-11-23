// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * SERVICIO DE MÓDULOS OPERATIVOS MULTI-TENANT
 * CoreFlow — src/core/services/OperationalModulesService.js
 *
 * Responsabilidad (Sección 2.B, 2.C y Etapa E):
 * Gestiona Clientes, Oportunidades Comerciales, Tareas, Documentos (Storage)
 * y Reglas de Automatización con validación de membresía activa, permisos RBAC,
 * capacidades de la suscripción y claves foráneas compuestas intra-tenant.
 */

import { ATOMIC_PERMISSIONS } from '../config/permissionsCatalog.js'

export class OperationalModulesService {
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

  // ---------------------------------------------------------------------------
  // 1. CLIENTES
  // ---------------------------------------------------------------------------
  listClients(organizationId) {
    return this.provider.listClients(organizationId)
  }

  createClient({ organizationId, actorMemberId = null, payload }) {
    const ctx = this.organizationService.getActiveTenantContext({
      organizationId,
      activeMemberIdOverride: actorMemberId,
    })

    this.authorizationService.assertAuthorized({
      organization: ctx.organization,
      entitlementOverrides: ctx.entitlements,
      actorMembership: ctx.activeMembership,
      rolePermissions: ctx.rolePermissions,
      permissionKey: ATOMIC_PERMISSIONS.CLIENTS_WRITE,
      targetResource: { organizationId: ctx.organization.id },
    })

    const created = this.provider.insertClient({
      organizationId: ctx.organization.id,
      branchId: payload.branchId || ctx.branches[0]?.id,
      ownerMemberId: payload.ownerMemberId || ctx.activeMembership?.id,
      ...payload,
    })

    this.auditService?.recordEvent({
      organizationId: ctx.organization.id,
      actorUserId: ctx.activeMembership.userId,
      actorMemberId: ctx.activeMembership.id,
      actorRoleCode: ctx.activeMembership.roleCode,
      module: 'module.clients',
      entityType: 'client',
      entityId: created.id || created.code,
      action: 'CLIENT_CREATED',
      summary: `Cliente "${created.displayName || created.name}" (${created.code}) registrado en el directorio.`,
      changes: {
        code: created.code,
        displayName: created.displayName || created.name,
        sector: created.sector,
        status: created.status,
      },
    })

    return created
  }

  // ---------------------------------------------------------------------------
  // 2. COMERCIAL / OPORTUNIDADES
  // ---------------------------------------------------------------------------
  listOpportunities(organizationId) {
    return this.provider.listOpportunities(organizationId)
  }

  createOpportunity({ organizationId, actorMemberId = null, payload }) {
    const ctx = this.organizationService.getActiveTenantContext({
      organizationId,
      activeMemberIdOverride: actorMemberId,
    })

    this.authorizationService.assertAuthorized({
      organization: ctx.organization,
      entitlementOverrides: ctx.entitlements,
      actorMembership: ctx.activeMembership,
      rolePermissions: ctx.rolePermissions,
      permissionKey: ATOMIC_PERMISSIONS.OPPORTUNITIES_WRITE,
      targetResource: { organizationId: ctx.organization.id },
    })

    const created = this.provider.insertOpportunity({
      organizationId: ctx.organization.id,
      ownerMemberId: payload.ownerMemberId || ctx.activeMembership?.id,
      ...payload,
    })

    this.auditService?.recordEvent({
      organizationId: ctx.organization.id,
      actorUserId: ctx.activeMembership.userId,
      actorMemberId: ctx.activeMembership.id,
      actorRoleCode: ctx.activeMembership.roleCode,
      module: 'module.commercial',
      entityType: 'commercial_opportunity',
      entityId: created.id || created.code,
      action: 'OPPORTUNITY_CREATED',
      summary: `Oportunidad comercial "${created.title}" (${created.code}) registrada.`,
      changes: {
        code: created.code,
        title: created.title,
        stage: created.stage,
        estimatedValue: created.estimatedValue,
      },
    })

    return created
  }

  // ---------------------------------------------------------------------------
  // 3. TAREAS OPERATIVAS
  // ---------------------------------------------------------------------------
  listTasks(organizationId) {
    return this.provider.listTasks(organizationId)
  }

  createTask({ organizationId, actorMemberId = null, payload }) {
    const ctx = this.organizationService.getActiveTenantContext({
      organizationId,
      activeMemberIdOverride: actorMemberId,
    })

    this.authorizationService.assertAuthorized({
      organization: ctx.organization,
      entitlementOverrides: ctx.entitlements,
      actorMembership: ctx.activeMembership,
      rolePermissions: ctx.rolePermissions,
      permissionKey: ATOMIC_PERMISSIONS.TASKS_WRITE,
      targetResource: {
        organizationId: ctx.organization.id,
        departmentId: payload.departmentId || ctx.activeMembership?.departmentId,
        assignedMemberId: payload.assignedMemberId || ctx.activeMembership?.id,
      },
    })

    const created = this.provider.insertTask({
      organizationId: ctx.organization.id,
      departmentId: payload.departmentId || ctx.activeMembership?.departmentId,
      assignedMemberId: payload.assignedMemberId || ctx.activeMembership?.id,
      ...payload,
    })

    this.auditService?.recordEvent({
      organizationId: ctx.organization.id,
      actorUserId: ctx.activeMembership.userId,
      actorMemberId: ctx.activeMembership.id,
      actorRoleCode: ctx.activeMembership.roleCode,
      module: 'module.tasks',
      entityType: 'task',
      entityId: created.id || created.code,
      action: 'TASK_CREATED',
      summary: `Tarea "${created.title}" (${created.code}) asignada a ${created.owner || ctx.activeMembership.displayName}.`,
      changes: {
        code: created.code,
        title: created.title,
        priority: created.priority,
        status: created.status,
      },
    })

    return created
  }

  toggleTaskStatus({ organizationId, actorMemberId = null, taskId }) {
    const ctx = this.organizationService.getActiveTenantContext({
      organizationId,
      activeMemberIdOverride: actorMemberId,
    })

    const tasks = this.provider.listTasks(ctx.organization.id)
    const target = tasks.find((t) => t.id === taskId || t.code === taskId)
    if (!target) {
      throw new Error(`TASK_NOT_FOUND: La tarea "${taskId}" no existe en la organización.`)
    }

    const nextStatus = target.status === 'completed' ? 'process' : 'completed'
    const updated = this.provider.updateTask(ctx.organization.id, target.id || target.code, {
      status: nextStatus,
    })

    this.auditService?.recordEvent({
      organizationId: ctx.organization.id,
      actorUserId: ctx.activeMembership.userId,
      actorMemberId: ctx.activeMembership.id,
      actorRoleCode: ctx.activeMembership.roleCode,
      module: 'module.tasks',
      entityType: 'task',
      entityId: updated.id || updated.code,
      action: 'TASK_STATUS_UPDATED',
      summary: `Tarea "${updated.title}" actualizada a estado "${nextStatus}".`,
      changes: { previousStatus: target.status, newStatus: nextStatus },
    })

    return updated
  }

  // ---------------------------------------------------------------------------
  // 4. DOCUMENTOS Y REPOSITORIO PRIVADO (STORAGE)
  // ---------------------------------------------------------------------------
  listDocuments(organizationId) {
    return this.provider.listDocuments(organizationId)
  }

  createDocument({ organizationId, actorMemberId = null, payload }) {
    const ctx = this.organizationService.getActiveTenantContext({
      organizationId,
      activeMemberIdOverride: actorMemberId,
    })

    this.authorizationService.assertAuthorized({
      organization: ctx.organization,
      entitlementOverrides: ctx.entitlements,
      actorMembership: ctx.activeMembership,
      rolePermissions: ctx.rolePermissions,
      permissionKey: ATOMIC_PERMISSIONS.DOCUMENTS_READ,
      targetResource: { organizationId: ctx.organization.id },
    })

    const created = this.provider.insertDocument({
      organizationId: ctx.organization.id,
      uploadedByMemberId: ctx.activeMembership?.id,
      ...payload,
    })

    this.auditService?.recordEvent({
      organizationId: ctx.organization.id,
      actorUserId: ctx.activeMembership.userId,
      actorMemberId: ctx.activeMembership.id,
      actorRoleCode: ctx.activeMembership.roleCode,
      module: 'module.documents',
      entityType: 'document',
      entityId: created.id || created.code,
      action: 'DOCUMENT_REGISTERED',
      summary: `Documento "${created.title}" (${created.code}) almacenado en ruta aislada "${created.storagePath}".`,
      changes: {
        code: created.code,
        title: created.title,
        storagePath: created.storagePath,
        version: created.version,
      },
    })

    return created
  }

  // ---------------------------------------------------------------------------
  // 5. PROCESOS Y REGLAS DE AUTOMATIZACIÓN
  // ---------------------------------------------------------------------------
  listAutomationRules(organizationId) {
    return this.provider.listAutomationRules(organizationId)
  }

  createAutomationRule({ organizationId, actorMemberId = null, payload }) {
    const ctx = this.organizationService.getActiveTenantContext({
      organizationId,
      activeMemberIdOverride: actorMemberId,
    })

    const isCrossArea = payload.scopeType === 'cross_department_workflow'

    // Si la regla es entre áreas (cross_department_workflow), exige la capacidad `crossAreaAutomations` en la suscripción real
    this.authorizationService.assertAuthorized({
      organization: ctx.organization,
      entitlementOverrides: ctx.entitlements,
      actorMembership: ctx.activeMembership,
      rolePermissions: ctx.rolePermissions,
      permissionKey: ATOMIC_PERMISSIONS.ORG_READ_STRUCTURE,
      requiredFeatureKey: isCrossArea ? 'crossAreaAutomations' : 'basicAutomations',
      targetResource: { organizationId: ctx.organization.id },
    })

    const created = this.provider.insertAutomationRule({
      organizationId: ctx.organization.id,
      ...payload,
    })

    this.auditService?.recordEvent({
      organizationId: ctx.organization.id,
      actorUserId: ctx.activeMembership.userId,
      actorMemberId: ctx.activeMembership.id,
      actorRoleCode: ctx.activeMembership.roleCode,
      module: 'module.automations',
      entityType: 'automation_rule',
      entityId: created.id || created.code,
      action: 'AUTOMATION_RULE_CREATED',
      summary: `Regla de automatización "${created.name}" (${created.scopeType}) creada.`,
      changes: {
        code: created.code,
        name: created.name,
        scopeType: created.scopeType,
      },
    })

    return created
  }
}
