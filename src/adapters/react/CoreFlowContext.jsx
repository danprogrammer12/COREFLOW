/**
 * ADAPTADOR REACT PARA LOS 3 CONTEXTOS SAAS DE COREFLOW
 * CoreFlow — src/adapters/react/CoreFlowContext.jsx
 *
 * Conecta los servicios puros de `src/core/` con la interfaz y resuelve
 * dinámicamente el contexto de acceso según la sesión autenticada:
 *  A. PLATFORM_ADMIN (Consola global de organizaciones, planes y suscripciones)
 *  B. TENANT_WORKSPACE — CoreFlow Starter (Organización con suscripción Starter)
 *  C. TENANT_WORKSPACE — CoreFlow Business (Organización con suscripción Business)
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { createCoreFlowEngine } from '../../core/index.js'
import { getSupabaseConfigStatus } from '../../lib/supabaseClient.js'

const CoreFlowContext = createContext(null)

const ROLE_LABEL_BY_CODE = {
  ORG_ADMIN: 'Administrador Organizacional',
  OPS_COORDINATOR: 'Coordinación de Operaciones',
  COMMERCIAL_LEAD: 'Líder de Área Comercial',
  SPECIALIST: 'Especialista Documental',
}

export function CoreFlowProvider({ children }) {
  const supabaseStatus = useMemo(() => getSupabaseConfigStatus(), [])

  const engine = useMemo(
    () =>
      createCoreFlowEngine({
        mode: 'local-dev',
        persistToBrowser: true,
      }),
    []
  )

  const [stateVersion, setStateVersion] = useState(0)
  const [period, setPeriod] = useState('7d')

  const refreshState = useCallback(() => {
    setStateVersion((v) => v + 1)
  }, [])

  const sessionSummary = useMemo(
    () => engine.organizationService.getSessionSummary(),
    [engine, stateVersion]
  )

  const activeOrganizationId = sessionSummary.activeOrganizationId || 'org-principal'

  // Si el usuario está en un contexto organizacional (Starter o Business), resolver su tenant
  const tenantContext = useMemo(() => {
    if (!sessionSummary.isAuthenticated || sessionSummary.isPlatformAdmin) {
      return null
    }
    try {
      return engine.organizationService.getActiveTenantContext({
        organizationId: activeOrganizationId,
      })
    } catch {
      return null
    }
  }, [engine, sessionSummary, activeOrganizationId, stateVersion])

  // Colecciones operativas del tenant activo (Starter o Business)
  const requests = useMemo(() => {
    if (!tenantContext) return []
    return engine.workflowService.listRequests(activeOrganizationId)
  }, [engine, tenantContext, activeOrganizationId, stateVersion])

  const clients = useMemo(() => {
    if (!tenantContext) return []
    return engine.operationalModulesService.listClients(activeOrganizationId)
  }, [engine, tenantContext, activeOrganizationId, stateVersion])

  const opportunities = useMemo(() => {
    if (!tenantContext) return []
    return engine.operationalModulesService.listOpportunities(activeOrganizationId)
  }, [engine, tenantContext, activeOrganizationId, stateVersion])

  const tasks = useMemo(() => {
    if (!tenantContext) return []
    return engine.operationalModulesService.listTasks(activeOrganizationId)
  }, [engine, tenantContext, activeOrganizationId, stateVersion])

  const documents = useMemo(() => {
    if (!tenantContext) return []
    return engine.operationalModulesService.listDocuments(activeOrganizationId)
  }, [engine, tenantContext, activeOrganizationId, stateVersion])

  const automationRules = useMemo(() => {
    if (!tenantContext) return []
    return engine.operationalModulesService.listAutomationRules(activeOrganizationId)
  }, [engine, tenantContext, activeOrganizationId, stateVersion])

  const auditLogs = useMemo(() => {
    if (!tenantContext) return []
    return engine.auditService.listOrganizationLogs(activeOrganizationId)
  }, [engine, tenantContext, activeOrganizationId, stateVersion])

  const unifiedMetrics = useMemo(() => {
    const baseMetrics = engine.metricsService.computeOrganizationMetrics({
      organizationId: activeOrganizationId,
      requests,
      period,
      entitlementsResolved: tenantContext?.entitlementsResolved || null,
    })

    if (tenantContext) {
      baseMetrics.acumulados.clientesTotal = Math.max(
        baseMetrics.acumulados.clientesTotal,
        clients.length
      )
      baseMetrics.acumulados.oportunidadesActivas = Math.max(
        baseMetrics.acumulados.oportunidadesActivas,
        opportunities.length
      )
      baseMetrics.acumulados.tareasPendientesActuales = Math.max(
        baseMetrics.acumulados.tareasPendientesActuales,
        tasks.filter((t) => t.status !== 'completed').length
      )
      baseMetrics.acumulados.documentosTotales = Math.max(
        baseMetrics.acumulados.documentosTotales,
        documents.length
      )
    }

    return baseMetrics
  }, [
    engine,
    activeOrganizationId,
    requests,
    clients,
    opportunities,
    tasks,
    documents,
    period,
    tenantContext,
  ])

  // Datos exclusivos para CoreFlow Platform Admin (Contexto A)
  const platformAdminData = useMemo(() => {
    if (!sessionSummary.isPlatformAdmin) {
      return {
        plans: [],
        organizations: [],
        users: { platformAdmins: [], userProfiles: [], memberships: [] },
        globalAuditLogs: [],
      }
    }
    return {
      plans: engine.platformAdminService.listPlans(),
      organizations: engine.platformAdminService.listOrganizationsWithSubscriptions(),
      users: engine.platformAdminService.listPlatformUsersAndAdmins(),
      globalAuditLogs: engine.platformAdminService.listGlobalAuditLogs(),
    }
  }, [engine, sessionSummary.isPlatformAdmin, stateVersion])

  // ---------------------------------------------------------------------------
  // ACCIONES DE AUTENTICACIÓN Y CAMBIO DE TENANT
  // ---------------------------------------------------------------------------
  const authenticateAccount = useCallback(
    ({ email, password }) => {
      try {
        const session = engine.organizationService.authenticateAccount({
          email,
          password,
        })
        refreshState()
        return { ok: true, session }
      } catch (err) {
        return { ok: false, error: err.message, code: err.code }
      }
    },
    [engine, refreshState]
  )

  const signOut = useCallback(() => {
    engine.organizationService.signOut()
    refreshState()
  }, [engine, refreshState])

  const switchOrganization = useCallback(
    (targetOrgId) => {
      try {
        engine.organizationService.switchOrganization(targetOrgId)
        refreshState()
        return { ok: true }
      } catch (err) {
        refreshState()
        return { ok: false, error: err.message, code: err.code }
      }
    },
    [engine, refreshState]
  )

  // ---------------------------------------------------------------------------
  // ACCIONES DE COREFLOW PLATFORM ADMIN (Contexto A)
  // ---------------------------------------------------------------------------
  const upsertPlan = useCallback(
    (planPayload) => {
      try {
        const data = engine.platformAdminService.upsertPlan(planPayload)
        refreshState()
        return { ok: true, data }
      } catch (err) {
        return { ok: false, error: err.message }
      }
    },
    [engine, refreshState]
  )

  const createOrganization = useCallback(
    (orgPayload) => {
      try {
        const data =
          engine.platformAdminService.createOrganizationWithSubscription(orgPayload)
        refreshState()
        return { ok: true, data }
      } catch (err) {
        return { ok: false, error: err.message }
      }
    },
    [engine, refreshState]
  )

  const updateSubscription = useCallback(
    (subPayload) => {
      try {
        const data =
          engine.platformAdminService.updateOrganizationSubscription(subPayload)
        refreshState()
        return { ok: true, data }
      } catch (err) {
        return { ok: false, error: err.message }
      }
    },
    [engine, refreshState]
  )

  const updateEntitlement = useCallback(
    (entPayload) => {
      try {
        const data =
          engine.platformAdminService.updateOrganizationFeatureOrQuota(entPayload)
        refreshState()
        return { ok: true, data }
      } catch (err) {
        return { ok: false, error: err.message }
      }
    },
    [engine, refreshState]
  )

  // ---------------------------------------------------------------------------
  // ACCIONES DE MÓDULOS OPERATIVOS DEL TENANT (Contextos B y C)
  // ---------------------------------------------------------------------------
  const createRequest = useCallback(
    (payload) => {
      try {
        const created = engine.workflowService.createRequest({
          organizationId: activeOrganizationId,
          actorMemberId: tenantContext?.activeMembership?.id,
          payload,
        })
        refreshState()
        return { ok: true, data: created }
      } catch (err) {
        refreshState()
        return { ok: false, error: err.message, code: err.code }
      }
    },
    [engine, activeOrganizationId, tenantContext, refreshState]
  )

  const cycleRequestStatus = useCallback(
    (requestId) => {
      try {
        const updated = engine.workflowService.transitionRequestStatus({
          organizationId: activeOrganizationId,
          actorMemberId: tenantContext?.activeMembership?.id,
          requestId,
        })
        refreshState()
        return { ok: true, data: updated }
      } catch (err) {
        refreshState()
        return { ok: false, error: err.message, code: err.code }
      }
    },
    [engine, activeOrganizationId, tenantContext, refreshState]
  )

  const updateRequestStatus = useCallback(
    (requestId, nextStatus) => {
      try {
        const updated = engine.workflowService.transitionRequestStatus({
          organizationId: activeOrganizationId,
          actorMemberId: tenantContext?.activeMembership?.id,
          requestId,
          nextStatus,
        })
        refreshState()
        return { ok: true, data: updated }
      } catch (err) {
        refreshState()
        return { ok: false, error: err.message, code: err.code }
      }
    },
    [engine, activeOrganizationId, tenantContext, refreshState]
  )

  const approveRequestLevel = useCallback(
    (requestId, stepOrder = 2) => {
      try {
        const res = engine.workflowService.validateApprovalStep({
          organizationId: activeOrganizationId,
          actorMemberId: tenantContext?.activeMembership?.id,
          requestId,
          stepOrder,
        })
        refreshState()
        return { ok: true, data: res.request }
      } catch (err) {
        refreshState()
        return { ok: false, error: err.message, code: err.code }
      }
    },
    [engine, activeOrganizationId, tenantContext, refreshState]
  )

  const createClient = useCallback(
    (payload) => {
      try {
        const created = engine.operationalModulesService.createClient({
          organizationId: activeOrganizationId,
          actorMemberId: tenantContext?.activeMembership?.id,
          payload,
        })
        refreshState()
        return { ok: true, data: created }
      } catch (err) {
        refreshState()
        return { ok: false, error: err.message, code: err.code }
      }
    },
    [engine, activeOrganizationId, tenantContext, refreshState]
  )

  const createOpportunity = useCallback(
    (payload) => {
      try {
        const created = engine.operationalModulesService.createOpportunity({
          organizationId: activeOrganizationId,
          actorMemberId: tenantContext?.activeMembership?.id,
          payload,
        })
        refreshState()
        return { ok: true, data: created }
      } catch (err) {
        refreshState()
        return { ok: false, error: err.message, code: err.code }
      }
    },
    [engine, activeOrganizationId, tenantContext, refreshState]
  )

  const createTask = useCallback(
    (payload) => {
      try {
        const created = engine.operationalModulesService.createTask({
          organizationId: activeOrganizationId,
          actorMemberId: tenantContext?.activeMembership?.id,
          payload,
        })
        refreshState()
        return { ok: true, data: created }
      } catch (err) {
        refreshState()
        return { ok: false, error: err.message, code: err.code }
      }
    },
    [engine, activeOrganizationId, tenantContext, refreshState]
  )

  const toggleTaskStatus = useCallback(
    (taskId) => {
      try {
        const updated = engine.operationalModulesService.toggleTaskStatus({
          organizationId: activeOrganizationId,
          actorMemberId: tenantContext?.activeMembership?.id,
          taskId,
        })
        refreshState()
        return { ok: true, data: updated }
      } catch (err) {
        refreshState()
        return { ok: false, error: err.message, code: err.code }
      }
    },
    [engine, activeOrganizationId, tenantContext, refreshState]
  )

  const createDocument = useCallback(
    (payload) => {
      try {
        const created = engine.operationalModulesService.createDocument({
          organizationId: activeOrganizationId,
          actorMemberId: tenantContext?.activeMembership?.id,
          payload,
        })
        refreshState()
        return { ok: true, data: created }
      } catch (err) {
        refreshState()
        return { ok: false, error: err.message, code: err.code }
      }
    },
    [engine, activeOrganizationId, tenantContext, refreshState]
  )

  const createAutomationRule = useCallback(
    (payload) => {
      try {
        const created = engine.operationalModulesService.createAutomationRule({
          organizationId: activeOrganizationId,
          actorMemberId: tenantContext?.activeMembership?.id,
          payload,
        })
        refreshState()
        return { ok: true, data: created }
      } catch (err) {
        refreshState()
        return { ok: false, error: err.message, code: err.code }
      }
    },
    [engine, activeOrganizationId, tenantContext, refreshState]
  )

  const createDepartment = useCallback(
    (payload) => {
      try {
        const created = engine.organizationService.createDepartment({
          organizationId: activeOrganizationId,
          actorMemberId: tenantContext?.activeMembership?.id,
          ...payload,
        })
        refreshState()
        return { ok: true, data: created }
      } catch (err) {
        refreshState()
        return { ok: false, error: err.message, code: err.code }
      }
    },
    [engine, activeOrganizationId, tenantContext, refreshState]
  )

  const rawEdition = tenantContext?.entitlementsResolved?.contractedEdition || 'business'
  const effectiveEdition = rawEdition === 'starter' ? 'start' : rawEdition

  const value = {
    providerName: engine.dataProvider.providerName,
    supabaseStatus,
    isAuthenticated: sessionSummary.isAuthenticated,
    isPlatformAdmin: sessionSummary.isPlatformAdmin,
    accessContext: sessionSummary.accessContext,
    user: sessionSummary.user,
    authenticateAccount,
    signOut,

    // Contexto A: Platform Admin
    platformAdminData,
    upsertPlan,
    createOrganization,
    updateSubscription,
    updateEntitlement,

    // Contextos B y C: Tenant Workspace (Starter / Business)
    accessibleOrganizations: sessionSummary.accessibleOrganizations,
    activeOrganization: tenantContext?.organization || null,
    activeOrganizationId,
    switchOrganization,
    contractedEdition: effectiveEdition,
    presentationEdition: effectiveEdition,
    entitlementsResolved: tenantContext?.entitlementsResolved || null,
    activeMembership: tenantContext?.activeMembership || null,
    activeRole:
      ROLE_LABEL_BY_CODE[tenantContext?.activeMembership?.roleCode] ||
      'Administrador Organizacional',
    branches: tenantContext?.branches || [],
    departments: tenantContext?.departments || [],
    members: tenantContext?.members || [],

    // Colecciones operativas y métricas del tenant
    period,
    setPeriod,
    clients,
    opportunities,
    requests,
    tasks,
    documents,
    automationRules,
    auditLogs,
    unifiedMetrics,

    // Mutaciones transaccionales
    createClient,
    createOpportunity,
    createRequest,
    cycleRequestStatus,
    updateRequestStatus,
    approveRequestLevel,
    createTask,
    toggleTaskStatus,
    createDocument,
    createAutomationRule,
    createDepartment,
  }

  return <CoreFlowContext.Provider value={value}>{children}</CoreFlowContext.Provider>
}

export function useCoreFlow() {
  const ctx = useContext(CoreFlowContext)
  if (!ctx) {
    throw new Error('useCoreFlow debe utilizarse dentro de un <CoreFlowProvider>.')
  }
  return ctx
}
