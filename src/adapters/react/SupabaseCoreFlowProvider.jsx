/**
 * PROVEEDOR REACT CONECTADO A SUPABASE
 * CoreFlow — src/adapters/react/SupabaseCoreFlowProvider.jsx
 *
 * Entrega la misma forma que el proveedor local, con acciones asíncronas.
 * Nunca recurre a datos locales: si Supabase falla, se muestra el error.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { createBackendEngine } from '../../core/backend/index.js'
import { getSupabaseClient, getSupabaseConfigStatus, setSessionPersistence } from '../../lib/supabaseClient.js'
import { CoreFlowContext } from './coreFlowContextObject.js'
import { loadPlatformData, loadTenantData } from './supabaseData.js'
import { roleLabel } from '../../components/ui/labels.js'

// Las vistas consultan permisos de interfaz con estos nombres.
const ROLE_NAME_BY_CODE = {
  ORG_ADMIN: 'Administrador Organizacional',
  OPS_COORDINATOR: 'Coordinación de Operaciones',
  COMMERCIAL_LEAD: 'Líder de Área Comercial',
  SPECIALIST: 'Especialista Documental',
}

const EMPTY_PLATFORM = {
  plans: [],
  organizations: [],
  users: { platformAdmins: [], userProfiles: [], memberships: [] },
  globalAuditLogs: [],
}
const EMPTY_METRICS = { acumulados: {}, periodo: {}, periodInfo: {} }

// Requiere la migración propuesta 018. Desactivado hasta aplicarla y probarla.
const PRIVACY_SYNC = import.meta.env.VITE_COREFLOW_PRIVACY_SYNC === 'on'

export function ConnectionScreen({ title, message, actions = null }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-core-cloud px-4 text-core-navy">
      <div role={actions ? 'alert' : 'status'} className="max-w-md text-center space-y-3">
        <h1 className="text-lg font-bold">{title}</h1>
        {message && <p className="text-sm text-core-muted">{message}</p>}
        {actions && <div className="flex justify-center gap-2 pt-2">{actions}</div>}
      </div>
    </div>
  )
}

const actionButton =
  'h-10 px-4 rounded-xl bg-core-violet text-white text-sm font-semibold hover:bg-core-blue transition-colors'

export function SupabaseCoreFlowProvider({ children }) {
  const supabaseStatus = useMemo(() => getSupabaseConfigStatus(), [])
  const engine = useMemo(
    () =>
      createBackendEngine({
        client: getSupabaseClient(),
        storage: typeof window === 'undefined' ? null : window.localStorage,
      }),
    []
  )
  const { session } = useSyncExternalStore(engine.subscribe, engine.getSnapshot)

  const [boot, setBoot] = useState({ done: false, error: null, attempt: 0 })
  const [period, setPeriod] = useState('7d')
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const loadSequence = useRef(0)

  const { isAuthenticated, isPlatformAdmin, activeOrganizationId } = session
  const scope = !isAuthenticated
    ? null
    : isPlatformAdmin
    ? 'platform'
    : activeOrganizationId
    ? `org:${activeOrganizationId}`
    : 'none'

  useEffect(() => {
    let active = true
    let stopListening = null
    engine.authentication.initialize().then((result) => {
      if (active) setBoot((b) => ({ ...b, done: result.ok, error: result.ok ? null : result.error }))
    })
    engine.authentication.startSessionListener().then((result) => {
      if (!result.ok) return
      if (active) stopListening = result.data
      else result.data?.()
    })
    return () => {
      active = false
      stopListening?.()
    }
  }, [engine, boot.attempt])

  const reload = useCallback(async () => {
    const sequence = ++loadSequence.current
    if (!scope || scope === 'none') {
      setData(null)
      setLoadError(null)
      return
    }
    try {
      const loaded =
        scope === 'platform'
          ? await loadPlatformData(engine)
          : await loadTenantData(engine, activeOrganizationId, period)
      if (sequence !== loadSequence.current) return
      setData({ scope, ...loaded })
      setLoadError(null)
    } catch (err) {
      if (sequence !== loadSequence.current) return
      setLoadError({ message: err.message, code: err.code })
    }
  }, [engine, scope, activeOrganizationId, period])

  useEffect(() => {
    reload()
  }, [reload])

  /** Tras una escritura confirmada, vuelve a leer: la base es la única fuente de verdad. */
  const mutate = useCallback(
    async (operation) => {
      const result = await operation()
      if (result.ok) await reload()
      return result
    },
    [reload]
  )

  const authenticateAccount = useCallback(
    async ({ email, password, remember = true }) => {
      setSessionPersistence(remember)
      const result = await engine.authentication.signIn({ email, password })
      return result.ok ? { ok: true, session: result.data } : result
    },
    [engine]
  )

  const signOut = useCallback(() => engine.authentication.signOut(), [engine])

  const requestPasswordReset = useCallback(
    (email) =>
      engine.authentication.requestPasswordReset({ email, redirectTo: window.location.origin }),
    [engine]
  )

  const recordPrivacyConsent = useCallback(
    (record) =>
      engine.privacy.recordConsent(record).then((result) => {
        if (!result.ok) console.warn('[CoreFlow] No se pudo registrar el consentimiento en el servidor:', result.error)
        return result
      }),
    [engine]
  )
  const submitPrivacyRequest = useCallback((payload) => engine.privacy.submitRequest(payload), [engine])

  const switchOrganization = useCallback(
    (organizationId) => engine.organizations.switchOrganization(organizationId),
    [engine]
  )

  const org = activeOrganizationId
  const tenantAction = useCallback(
    (run) =>
      (...args) =>
        mutate(() => run(...args)),
    [mutate]
  )

  const actions = useMemo(
    () => ({
      upsertPlan: tenantAction((plan) => engine.platformAdmin.upsertPlan(plan)),
      createOrganization: tenantAction((payload) => engine.platformAdmin.provisionOrganization(payload)),
      updateSubscription: tenantAction((payload) => engine.platformAdmin.updateSubscription(payload)),
      updateEntitlement: tenantAction((payload) => engine.platformAdmin.setEntitlement(payload)),
      createRequest: tenantAction((payload) => engine.workflow.createRequest({ organizationId: org, payload })),
      cycleRequestStatus: tenantAction((requestId) =>
        engine.workflow.transitionRequest({ organizationId: org, requestId })
      ),
      updateRequestStatus: tenantAction((requestId, nextStatus) =>
        engine.workflow.transitionRequest({ organizationId: org, requestId, nextStatus })
      ),
      // El servidor decide el orden: se aprueba el primer paso pendiente.
      approveRequestLevel: tenantAction((requestId) =>
        engine.workflow.decideApprovalStep({ organizationId: org, requestId })
      ),
      createClient: tenantAction((payload) =>
        engine.operationalModules.createClient({ organizationId: org, payload })
      ),
      createOpportunity: tenantAction(async (payload) => {
        if (!payload.clientId) {
          return {
            ok: false,
            code: 'VALIDATION_ERROR',
            error: 'Registra primero un cliente para crear oportunidades.',
          }
        }
        return engine.operationalModules.createOpportunity({ organizationId: org, payload })
      }),
      createTask: tenantAction((payload) =>
        engine.operationalModules.createTask({ organizationId: org, payload })
      ),
      toggleTaskStatus: tenantAction((taskId) =>
        engine.operationalModules.toggleTaskStatus({ organizationId: org, taskId })
      ),
      createDocument: tenantAction((payload) =>
        engine.operationalModules.createDocument({ organizationId: org, payload })
      ),
      createAutomationRule: tenantAction((payload) =>
        engine.automations.createRule({ organizationId: org, payload })
      ),
      createDepartment: tenantAction((payload) =>
        engine.organizations.createDepartment({ organizationId: org, ...payload })
      ),
      getDocumentUrl: (documentId) =>
        engine.operationalModules.getDocumentUrl({ organizationId: org, documentId }),
    }),
    [engine, org, tenantAction]
  )

  const retry = () => {
    setBoot((b) => ({ done: false, error: null, attempt: b.attempt + 1 }))
  }

  if (boot.error) {
    return (
      <ConnectionScreen
        title="No fue posible conectar con CoreFlow"
        message={boot.error}
        actions={
          <button type="button" className={actionButton} onClick={retry}>
            Reintentar
          </button>
        }
      />
    )
  }
  if (!boot.done) return <ConnectionScreen title="Cargando CoreFlow…" />

  const signOutButton = (
    <button type="button" className={actionButton} onClick={signOut}>
      Cerrar sesión
    </button>
  )
  if (scope === 'none') {
    return (
      <ConnectionScreen
        title="Tu cuenta no tiene una organización activa"
        message="Pide a un administrador que te agregue a una organización."
        actions={signOutButton}
      />
    )
  }

  const isReady = !scope || data?.scope === scope
  if (!isReady && loadError) {
    return (
      <ConnectionScreen
        title="No se pudieron cargar los datos"
        message={loadError.message}
        actions={
          <>
            <button type="button" className={actionButton} onClick={reload}>
              Reintentar
            </button>
            {signOutButton}
          </>
        }
      />
    )
  }
  if (!isReady) return <ConnectionScreen title="Cargando tu organización…" />

  const context = isReady ? data?.context : null
  const edition = context?.entitlementsResolved?.contractedEdition || 'business'
  const presentation = edition === 'starter' ? 'start' : edition
  const roleCode = context?.activeMembership?.roleCode

  const value = {
    providerName: 'supabase',
    supabaseStatus,
    isDemoData: false,
    dataError: loadError,
    isAuthenticated,
    isPlatformAdmin,
    accessContext: session.accessContext,
    user: session.user,
    authenticateAccount,
    signOut,
    requestPasswordReset,
    recordPrivacyConsent: PRIVACY_SYNC ? recordPrivacyConsent : undefined,
    submitPrivacyRequest: PRIVACY_SYNC ? submitPrivacyRequest : undefined,

    platformAdminData: data?.platformAdminData || EMPTY_PLATFORM,

    accessibleOrganizations: session.accessibleOrganizations,
    activeOrganization: context?.organization || null,
    activeOrganizationId,
    switchOrganization,
    contractedEdition: presentation,
    presentationEdition: presentation,
    entitlementsResolved: context?.entitlementsResolved || null,
    activeMembership: context?.activeMembership || null,
    activeRole: ROLE_NAME_BY_CODE[roleCode] || (roleCode ? roleLabel(roleCode) : ''),
    branches: context?.branches || [],
    departments: context?.departments || [],
    members: context?.members || [],

    period,
    setPeriod,
    clients: data?.clients || [],
    opportunities: data?.opportunities || [],
    requests: data?.requests || [],
    tasks: data?.tasks || [],
    documents: data?.documents || [],
    automationRules: data?.automationRules || [],
    auditLogs: data?.auditLogs || [],
    approvalQueue: data?.approvalQueue || [],
    unifiedMetrics: data?.unifiedMetrics || EMPTY_METRICS,

    ...actions,
  }

  return <CoreFlowContext.Provider value={value}>{children}</CoreFlowContext.Provider>
}
