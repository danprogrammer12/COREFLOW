/**
 * SUITE AUTOMATIZADA DE VERIFICACIÓN DE INTEGRIDAD, AISLAMIENTO, SUSCRIPCIONES Y SAAS (ETAPAS A–F)
 * CoreFlow — src/core/__tests__/coreArchitecture.verify.js
 *
 * Ejecuta las 12 pruebas formales (T1 a T12) que validan todos los requisitos de arquitectura
 * empresarial y los 10 criterios de aceptación SaaS:
 *  - T1: Aislamiento multi-tenant (Membresía activa obligatoria; rechazo de org-aislada)
 *  - T2: Integridad referencial intra-organización (Rechazo de FK cruzada entre tenants)
 *  - T3: Separación estricta entre Edición Contratada y Modo de Simulación Visual
 *  - T4: Autorización en 3 capas (Plan + Permiso RBAC + Alcance Departamental)
 *  - T5: Cumplimiento de cuotas administrables (max_collaborators sin límites incrustados)
 *  - T6: Inmutabilidad de auditoría (bloqueo UPDATE/DELETE) y sanitización de secretos
 *  - T7: Coherencia analítica entre acumulados y cortes temporales (7d, 30d, trimestre) por tenant
 *  - T8: Autenticación independiente y resolución de los 3 contextos SaaS (Platform Admin, Starter, Business)
 *  - T9: Aislamiento total de datos entre las cuentas Starter (org-pyme) y Business (org-principal) en los módulos operativos
 *  - T10: Administración dinámica de planes (plan_catalog), creación de organizaciones y asignación de suscripciones desde Platform Admin
 *  - T11: Restricción efectiva de funcionalidades por plan en servicios operativos (Starter vs Business)
 *  - T12: Persistencia transaccional de cambios ante recarga de sesión / navegador
 */

import assert from 'node:assert/strict'
import { createCoreFlowEngine } from '../index.js'

function runTestSuite() {
  console.log('======================================================================')
  console.log(' COREFLOW — VERIFICACIÓN INTEGRAL DE ARQUITECTURA SAAS (ETAPAS A–F)')
  console.log('======================================================================\n')

  const engine = createCoreFlowEngine({
    mode: 'local-dev',
    persistToBrowser: false,
  })

  const {
    dataProvider,
    organizationService,
    platformAdminService,
    operationalModulesService,
    workflowService,
    auditService,
    metricsService,
  } = engine

  // -------------------------------------------------------------------------
  // T1: Aislamiento Multi-Tenant (Membresía activa obligatoria)
  // -------------------------------------------------------------------------
  {
    assert.equal(
      organizationService.getSessionSummary().isAuthenticated,
      false,
      'T1: La aplicación debe arrancar sin sesión iniciada.'
    )
    organizationService.authenticateAccount({
      email: 'admin.business@corporativoprincipal.co',
    })

    const session = organizationService.getSessionSummary()
    const accessibleIds = session.accessibleOrganizations.map((o) => o.id)
    assert.deepEqual(
      accessibleIds,
      ['org-principal'],
      'T1: La cuenta Business por defecto (admin.business@corporativoprincipal.co) solo debe listar org-principal.'
    )

    // Intentar leer solicitudes o cambiar a org-aislada o a org-pyme (sin membresía para admin.business) debe lanzar TENANT_ISOLATION_VIOLATION
    assert.throws(
      () => {
        workflowService.listRequests('org-aislada')
      },
      (err) => err.code === 'TENANT_ISOLATION_VIOLATION',
      'T1: Lectura directa sobre org-aislada debe ser bloqueada por membresía.'
    )

    assert.throws(
      () => {
        workflowService.listRequests('org-pyme')
      },
      (err) => err.code === 'TENANT_ISOLATION_VIOLATION',
      'T1: La cuenta Business no puede leer registros de la organización Starter (org-pyme).'
    )

    assert.throws(
      () => {
        organizationService.switchOrganization('org-aislada')
      },
      (err) => err.code === 'TENANT_ISOLATION_VIOLATION',
      'T1: Cambio de contexto a org-aislada debe ser rechazado.'
    )

    const reqPrincipal = workflowService.listRequests('org-principal')
    assert.ok(
      reqPrincipal.every((r) => r.organizationId === 'org-principal'),
      'T1: Solicitudes de org-principal aisladas.'
    )

    console.log('✅ [PASS] T1: Aislamiento multi-tenant y validación de membresía activa.')
  }

  // -------------------------------------------------------------------------
  // T2: Integridad Referencial Intra-Organización (FKs compuestas)
  // -------------------------------------------------------------------------
  {
    // Intentar crear una solicitud en org-principal apuntando a un departamento de org-pyme (dept-pyme-gen)
    assert.throws(
      () => {
        workflowService.createRequest({
          organizationId: 'org-principal',
          payload: {
            asunto: 'Intento de referencia cruzada entre tenants',
            cliente: 'Cuenta Prueba',
            branchId: 'br-prin-01',
            departmentId: 'dept-pyme-gen', // Pertenece a org-pyme!
          },
        })
      },
      (err) => err.code === 'CROSS_ORG_REFERENCE_VIOLATION',
      'T2: Debe rechazar la vinculación de un departamento perteneciente a otra organización.'
    )

    // Intentar crear una solicitud en org-principal apuntando a una sede de org-aislada (br-ext-01)
    assert.throws(
      () => {
        workflowService.createRequest({
          organizationId: 'org-principal',
          payload: {
            asunto: 'Intento de sede cruzada',
            cliente: 'Cuenta Prueba',
            branchId: 'br-ext-01', // Pertenece a org-aislada!
          },
        })
      },
      (err) => err.code === 'CROSS_ORG_REFERENCE_VIOLATION',
      'T2: Debe rechazar la vinculación de una sede perteneciente a otra organización.'
    )

    console.log('✅ [PASS] T2: Integridad referencial intra-organización (bloqueo de FKs cruzadas).')
  }

  // -------------------------------------------------------------------------
  // T3: Separación estricta entre Edición Contratada y Simulación Visual
  // -------------------------------------------------------------------------
  {
    // Autenticar como Administrador Starter (org-pyme)
    organizationService.authenticateAccount({
      email: 'admin.starter@unidadpyme.co',
    })

    const ctxSimulated = organizationService.getActiveTenantContext({
      organizationId: 'org-pyme',
      simulationOverlay: 'business',
    })

    assert.equal(ctxSimulated.entitlementsResolved.contractedEdition, 'starter')
    assert.equal(ctxSimulated.entitlementsResolved.presentationEdition, 'business')
    assert.equal(ctxSimulated.entitlementsResolved.isSimulationActive, true)
    assert.equal(ctxSimulated.entitlementsResolved.realFeatures.departmentsAndTeams, false)
    assert.equal(ctxSimulated.entitlementsResolved.presentationFeatures.departmentsAndTeams, true)

    assert.throws(
      () => {
        organizationService.createDepartment({
          organizationId: 'org-pyme',
          simulationOverlay: 'business', // Intento de escalar privilegios con simulación UI
          branchId: 'br-pyme-01',
          code: 'FIN',
          name: 'Finanzas',
        })
      },
      (err) => err.code === 'ENTITLEMENT_FEATURE_RESTRICTED',
      'T3: La simulación Business sobre un tenant Starter no debe permitir crear departamentos en el backend.'
    )

    // Regresar a la cuenta Business para T4
    organizationService.authenticateAccount({
      email: 'admin.business@corporativoprincipal.co',
    })

    console.log('✅ [PASS] T3: Separación estricta entre edición contratada, modo simulación y autorizaciones reales.')
  }

  // -------------------------------------------------------------------------
  // T4: Autorización en 3 Capas (Plan + Permiso RBAC + Alcance Departamental)
  // -------------------------------------------------------------------------
  {
    // En org-principal (Business):
    // 1) mem-prin-com (COMMERCIAL_LEAD) intenta aprobar el Nivel 2 Operativo de SOL-458 -> Rechazado por RBAC
    assert.throws(
      () => {
        workflowService.validateApprovalStep({
          organizationId: 'org-principal',
          actorMemberId: 'mem-prin-com', // COMMERCIAL_LEAD
          requestId: 'SOL-458',
          stepOrder: 2,
        })
      },
      (err) => err.code === 'RBAC_PERMISSION_DENIED',
      'T4: COMMERCIAL_LEAD no posee el permiso approvals:validate_level.'
    )

    // 2) mem-prin-cal (OPS_COORDINATOR pero del departamento Calidad 'dept-prin-cal') intenta aprobar
    //    el Nivel 2 Operativo de SOL-458 cuyo targetDepartmentId es 'dept-prin-ops' -> Rechazado por Alcance (DEPARTMENT_SCOPE)
    assert.throws(
      () => {
        workflowService.validateApprovalStep({
          organizationId: 'org-principal',
          actorMemberId: 'mem-prin-cal', // OPS_COORDINATOR en Calidad, no en Operaciones
          requestId: 'SOL-458',
          stepOrder: 2,
        })
      },
      (err) => err.code === 'SCOPE_RESTRICTION_VIOLATION',
      'T4: Coordinador de otro departamento no puede aprobar un paso asignado a Operaciones (DEPARTMENT_SCOPE).'
    )

    // 3) mem-prin-ops (OPS_COORDINATOR del departamento Operaciones 'dept-prin-ops') aprueba exitosamente Nivel 2 de SOL-458
    const approvalResult = workflowService.validateApprovalStep({
      organizationId: 'org-principal',
      actorMemberId: 'mem-prin-ops',
      requestId: 'SOL-458',
      stepOrder: 2,
    })
    assert.equal(approvalResult.step.status, 'approved')
    assert.equal(approvalResult.request.estado, 'active')

    console.log('✅ [PASS] T4: Autorización multicapa (Plan + RBAC + Alcance Departamental).')
  }

  // -------------------------------------------------------------------------
  // T5: Cumplimiento de Cuotas Administrables (maxCollaborators)
  // -------------------------------------------------------------------------
  {
    organizationService.authenticateAccount({
      email: 'admin.starter@unidadpyme.co',
    })

    // org-pyme tiene 12 colaboradores activos y cuota max_collaborators = 15 en organization_entitlements.
    // Agregar 2 colaboradores (12 + 2 = 14 <= 15) está permitido:
    const validQuota = organizationService.registerCollaboratorBatch({
      organizationId: 'org-pyme',
      additionalCount: 2,
    })
    assert.equal(validQuota.allowed, true)
    assert.equal(validQuota.projected, 14)

    // Intentar agregar 4 colaboradores (12 + 4 = 16 > 15) debe lanzar COLLABORATOR_QUOTA_EXCEEDED:
    assert.throws(
      () => {
        organizationService.registerCollaboratorBatch({
          organizationId: 'org-pyme',
          additionalCount: 4,
        })
      },
      (err) => err.code === 'COLLABORATOR_QUOTA_EXCEEDED',
      'T5: Superar la cuota administrable de colaboradores debe ser bloqueado.'
    )

    organizationService.authenticateAccount({
      email: 'admin.business@corporativoprincipal.co',
    })

    console.log('✅ [PASS] T5: Control centralizado de cuotas administrables (organization_entitlements).')
  }

  // -------------------------------------------------------------------------
  // T6: Inmutabilidad de Auditoría y Sanitización de Secretos
  // -------------------------------------------------------------------------
  {
    const logged = auditService.recordEvent({
      organizationId: 'org-principal',
      actorUserId: 'usr-business-admin',
      actorMemberId: 'mem-prin-admin',
      actorRoleCode: 'ORG_ADMIN',
      module: 'core.security',
      entityType: 'credential_config',
      entityId: 'cfg-01',
      action: 'CONFIG_UPDATED',
      summary: 'Actualización de parámetros con campos sensibles redactados.',
      changes: {
        webhookUrl: 'https://api.empresa.co/hook',
        apiKey: 'sk-live-999999999',
        userPassword: 'SuperSecretPassword123!',
        nested: {
          accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
          safeField: 'visible',
        },
      },
    })

    assert.equal(logged.changes.apiKey, '[REDACTED]')
    assert.equal(logged.changes.userPassword, '[REDACTED]')
    assert.equal(logged.changes.nested.accessToken, '[REDACTED]')
    assert.equal(logged.changes.nested.safeField, 'visible')

    // Intentar mutar el objeto en memoria debe fallar porque está congelado (Object.freeze)
    assert.throws(() => {
      logged.summary = 'Intento de alteración en memoria'
    })

    // Intentar ejecutar UPDATE o DELETE en el servicio/proveedor debe lanzar AUDIT_IMMUTABILITY_VIOLATION
    assert.throws(
      () => auditService.updateAuditLog(logged.id, { summary: 'Alterado' }),
      (err) => err.code === 'AUDIT_IMMUTABILITY_VIOLATION'
    )
    assert.throws(
      () => auditService.deleteAuditLog(logged.id),
      (err) => err.code === 'AUDIT_IMMUTABILITY_VIOLATION'
    )

    console.log('✅ [PASS] T6: Auditoría protegida append-only y sanitización de credenciales.')
  }

  // -------------------------------------------------------------------------
  // T7: Coherencia Analítica entre Acumulados y Cortes Temporales por Tenant
  // -------------------------------------------------------------------------
  {
    dataProvider.resetDemoSeed()
    organizationService.authenticateAccount({
      email: 'admin.business@corporativoprincipal.co',
    })
    const reqsPrincipal = workflowService.listRequests('org-principal')

    const m7d = metricsService.computeOrganizationMetrics({
      organizationId: 'org-principal',
      requests: reqsPrincipal,
      period: '7d',
    })
    const m30d = metricsService.computeOrganizationMetrics({
      organizationId: 'org-principal',
      requests: reqsPrincipal,
      period: '30d',
    })

    organizationService.authenticateAccount({
      email: 'admin.starter@unidadpyme.co',
    })
    const reqsPyme = workflowService.listRequests('org-pyme')
    const mPyme = metricsService.computeOrganizationMetrics({
      organizationId: 'org-pyme',
      requests: reqsPyme,
      period: '7d',
    })

    // En org-principal (7d inicial): 34 resueltas + (9 en seguimiento - 1) = 42 gestionadas
    assert.equal(m7d.periodo.solicitudesResueltas, 34)
    assert.equal(m7d.acumulados.solicitudesEnSeguimiento, 9)
    assert.equal(m7d.periodo.solicitudesGestionadas, 42)
    assert.equal(m30d.periodo.solicitudesGestionadas, 164)

    // En org-pyme: métricas completamente independientes de org-principal
    assert.equal(mPyme.acumulados.clientesTotal, 19)
    assert.equal(m7d.acumulados.clientesTotal, 48)

    console.log('✅ [PASS] T7: Coherencia analítica de acumulados y períodos aislada por organización.')
  }

  // -------------------------------------------------------------------------
  // T8: Autenticación Real y Resolución de los 3 Contextos SaaS Independientes
  // -------------------------------------------------------------------------
  {
    // 1. Cuenta Platform Admin
    organizationService.authenticateAccount({
      email: 'platform.admin@coreflow.app',
    })
    const summaryAdmin = organizationService.getSessionSummary()
    assert.equal(summaryAdmin.isAuthenticated, true)
    assert.equal(summaryAdmin.isPlatformAdmin, true)
    assert.equal(summaryAdmin.accessContext, 'PLATFORM_ADMIN')

    // 2. Cuenta Starter Admin
    organizationService.authenticateAccount({
      email: 'admin.starter@unidadpyme.co',
    })
    const summaryStarter = organizationService.getSessionSummary()
    assert.equal(summaryStarter.isAuthenticated, true)
    assert.equal(summaryStarter.isPlatformAdmin, false)
    assert.equal(summaryStarter.accessContext, 'TENANT_WORKSPACE')
    assert.equal(summaryStarter.activeOrganizationId, 'org-pyme')
    const ctxStarter = organizationService.getActiveTenantContext({
      organizationId: 'org-pyme',
    })
    assert.equal(ctxStarter.entitlementsResolved.contractedEdition, 'starter')

    // 3. Cuenta Business Admin
    organizationService.authenticateAccount({
      email: 'admin.business@corporativoprincipal.co',
    })
    const summaryBusiness = organizationService.getSessionSummary()
    assert.equal(summaryBusiness.isAuthenticated, true)
    assert.equal(summaryBusiness.isPlatformAdmin, false)
    assert.equal(summaryBusiness.accessContext, 'TENANT_WORKSPACE')
    assert.equal(summaryBusiness.activeOrganizationId, 'org-principal')
    const ctxBusiness = organizationService.getActiveTenantContext({
      organizationId: 'org-principal',
    })
    assert.equal(ctxBusiness.entitlementsResolved.contractedEdition, 'business')

    // 4. Cierre de sesión
    organizationService.signOut()
    const summarySignedOut = organizationService.getSessionSummary()
    assert.equal(summarySignedOut.isAuthenticated, false)
    assert.equal(summarySignedOut.accessContext, 'UNAUTHENTICATED')

    console.log('✅ [PASS] T8: Autenticación independiente y resolución de los 3 contextos SaaS (Platform Admin, Starter, Business).')
  }

  // -------------------------------------------------------------------------
  // T9: Aislamiento de Datos entre Starter y Business en Módulos Operativos
  // -------------------------------------------------------------------------
  {
    // Autenticar como Starter (org-pyme) y crear un cliente + tarea
    organizationService.authenticateAccount({
      email: 'admin.starter@unidadpyme.co',
    })

    const createdStarterClient = operationalModulesService.createClient({
      organizationId: 'org-pyme',
      payload: {
        legalName: 'Inversiones Costeras S.A.S.',
        taxId: '901.888.111-2',
        sector: 'Comercio',
        tier: 'PYME',
        contactName: 'Roberto Díaz',
        contactEmail: 'rdiaz@costeras.co',
      },
    })
    assert.equal(createdStarterClient.organizationId, 'org-pyme')

    const starterClients = operationalModulesService.listClients('org-pyme')
    assert.ok(starterClients.some((c) => c.id === createdStarterClient.id))
    assert.ok(starterClients.every((c) => c.organizationId === 'org-pyme'))

    // Intentar leer clientes de org-principal desde la sesión Starter debe ser bloqueado
    assert.throws(
      () => operationalModulesService.listClients('org-principal'),
      (err) => err.code === 'TENANT_ISOLATION_VIOLATION',
      'T9: Starter no puede listar clientes de Business.'
    )

    // Autenticar como Business (org-principal) y verificar que NO ve el cliente de Starter
    organizationService.authenticateAccount({
      email: 'admin.business@corporativoprincipal.co',
    })
    const businessClients = operationalModulesService.listClients('org-principal')
    assert.ok(!businessClients.some((c) => c.id === createdStarterClient.id))
    assert.ok(businessClients.every((c) => c.organizationId === 'org-principal'))

    // Intentar leer tareas o documentos de org-pyme desde la sesión Business debe ser bloqueado
    assert.throws(
      () => operationalModulesService.listTasks('org-pyme'),
      (err) => err.code === 'TENANT_ISOLATION_VIOLATION',
      'T9: Business no puede listar tareas de Starter.'
    )
    assert.throws(
      () => operationalModulesService.listDocuments('org-pyme'),
      (err) => err.code === 'TENANT_ISOLATION_VIOLATION',
      'T9: Business no puede listar documentos de Starter.'
    )

    console.log('✅ [PASS] T9: Aislamiento total de colecciones operativas entre Starter y Business.')
  }

  // -------------------------------------------------------------------------
  // T10: Administración Dinámica de Planes y Suscripciones por Platform Admin
  // -------------------------------------------------------------------------
  {
    // Un usuario de organización (Business Admin) NO puede invocar PlatformAdminService
    organizationService.authenticateAccount({
      email: 'admin.business@corporativoprincipal.co',
    })
    assert.throws(
      () => platformAdminService.listPlans(),
      (err) => err.code === 'PLATFORM_ADMIN_REQUIRED',
      'T10: Un administrador organizacional no tiene acceso a PlatformAdminService.'
    )

    // Autenticar como Platform Admin
    organizationService.authenticateAccount({
      email: 'platform.admin@coreflow.app',
    })

    // 1. Crear un nuevo plan "corporate_plus" en el catálogo sin tocar código
    const newPlan = platformAdminService.upsertPlan({
      planCode: 'corporate_plus',
      displayName: 'CoreFlow Corporate Plus',
      tagline: 'Escala corporativa multi-país con gobernanza avanzada',
      priceMonthlyUsd: 350,
      limits: {
        maxCollaborators: 1000,
        maxBranches: 40,
        maxDepartments: 80,
        maxActiveAutomations: 250,
        maxStorageGb: 1000,
      },
      features: {
        departmentsAndTeams: true,
        multilevelApprovals: true,
        crossAreaAutomations: true,
        customRbacScopes: true,
        executiveAnalyticsByOwner: true,
        auditExport: true,
      },
    })
    assert.equal(newPlan.planCode, 'corporate_plus')

    const plans = platformAdminService.listPlans()
    assert.ok(plans.some((p) => p.planCode === 'corporate_plus'))

    // 2. Crear una nueva organización y asignarle el plan recién creado
    const createdOrgResult = platformAdminService.createOrganizationWithSubscription({
      displayName: 'Holding Pacífico Internacional',
      slug: 'holding-pacifico',
      taxId: '900.777.666-1',
      sector: 'Infraestructura',
      planCode: 'corporate_plus',
      adminEmail: 'admin.business@corporativoprincipal.co',
      adminFullName: 'Daniel Peñaloza',
    })
    assert.equal(createdOrgResult.organization.contractedPlanCode, 'corporate_plus')
    assert.equal(createdOrgResult.subscription.planCode, 'corporate_plus')

    // 3. Modificar una cuota específica de una organización
    const updatedQuota = platformAdminService.updateOrganizationFeatureOrQuota({
      organizationId: 'org-pyme',
      entitlementKey: 'max_collaborators',
      valueJson: 20,
      reason: 'Ampliación comercial autorizada por Platform Admin',
    })
    assert.equal(updatedQuota.valueJson, 20)

    console.log('✅ [PASS] T10: Administración global de planes en BD, organizaciones y suscripciones (Platform Admin).')
  }

  // -------------------------------------------------------------------------
  // T11: Restricción Efectiva de Capacidades del Plan en Módulos Operativos
  // -------------------------------------------------------------------------
  {
    // En Starter (org-pyme): crossAreaAutomations = false
    organizationService.authenticateAccount({
      email: 'admin.starter@unidadpyme.co',
    })

    // Automatización básica de notificación está permitida en Starter:
    const basicRule = operationalModulesService.createAutomationRule({
      organizationId: 'org-pyme',
      payload: {
        name: 'Aviso de vencimiento de solicitud',
        triggerEvent: 'request.due_soon',
        scopeType: 'basic_notification',
      },
    })
    assert.equal(basicRule.organizationId, 'org-pyme')

    // Automatización entre áreas (cross_department_workflow) debe ser bloqueada en Starter:
    assert.throws(
      () =>
        operationalModulesService.createAutomationRule({
          organizationId: 'org-pyme',
          payload: {
            name: 'Flujo interdepartamental restringido',
            triggerEvent: 'request.approved_level_1',
            scopeType: 'cross_department_workflow',
          },
        }),
      (err) => err.code === 'ENTITLEMENT_FEATURE_RESTRICTED',
      'T11: El plan Starter debe bloquear automatizaciones cross_department_workflow en el servicio.'
    )

    // En Business (org-principal): crossAreaAutomations = true -> permitida
    organizationService.authenticateAccount({
      email: 'admin.business@corporativoprincipal.co',
    })
    const businessRule = operationalModulesService.createAutomationRule({
      organizationId: 'org-principal',
      payload: {
        name: 'Escalamiento interdepartamental Operaciones -> Finanzas',
        triggerEvent: 'request.approved_level_1',
        scopeType: 'cross_department_workflow',
      },
    })
    assert.equal(businessRule.scopeType, 'cross_department_workflow')

    console.log('✅ [PASS] T11: Aplicación efectiva de capacidades por plan (Starter vs Business) en servicios operativos.')
  }

  // -------------------------------------------------------------------------
  // T12: Persistencia ante Recarga de Sesión / Navegador
  // -------------------------------------------------------------------------
  {
    // Simular almacenamiento localStorage en entorno Node para verificar persistencia entre instancias
    const memoryStorage = new Map()
    globalThis.window = {
      localStorage: {
        getItem: (k) => (memoryStorage.has(k) ? memoryStorage.get(k) : null),
        setItem: (k, v) => memoryStorage.set(k, String(v)),
        removeItem: (k) => memoryStorage.delete(k),
      },
    }

    const engineInstance1 = createCoreFlowEngine({
      mode: 'local-dev',
      persistToBrowser: true,
    })

    engineInstance1.organizationService.authenticateAccount({
      email: 'admin.starter@unidadpyme.co',
    })
    const persistedTask = engineInstance1.operationalModulesService.createTask({
      organizationId: 'org-pyme',
      payload: {
        title: 'Tarea persistida tras recarga de navegador',
        priority: 'high',
      },
    })

    // Crear una segunda instancia independiente (simulando recarga F5 del navegador)
    const engineInstance2 = createCoreFlowEngine({
      mode: 'local-dev',
      persistToBrowser: true,
    })
    const sessionAfterReload = engineInstance2.organizationService.getSessionSummary()
    assert.equal(
      sessionAfterReload.activeOrganizationId,
      'org-pyme',
      'T12: La sesión autenticada de Starter se conserva tras recargar el navegador.'
    )

    const tasksAfterReload = engineInstance2.operationalModulesService.listTasks('org-pyme')
    assert.ok(
      tasksAfterReload.some((t) => t.id === persistedTask.id),
      'T12: La tarea creada se conserva íntegra tras recargar el navegador.'
    )

    delete globalThis.window

    console.log('✅ [PASS] T12: Persistencia de sesión, suscripciones y registros operativos tras recarga.')
  }

  console.log('\n======================================================================')
  console.log(' RESULTADO: 12 / 12 PRUEBAS SAAS SUPERADAS EXITOSAMENTE')
  console.log('======================================================================')
}

runTestSuite()
