import React, { lazy, Suspense, useState, useEffect } from 'react'
import { CoreFlowProvider, useCoreFlow } from './adapters/react/CoreFlowContext'
import { LandingView } from './views/LandingView'
import { PrivacyProvider, usePrivacy } from './components/privacy/PrivacyProvider'
import { applyRouteMeta, getPath, navigate, useRoute } from './lib/router'
import { canonicalUrl, getRouteMeta } from './lib/routes'

// Todo lo que la landing no necesita se descarga bajo demanda
const lazyNamed = (loader, name) => lazy(() => loader().then((m) => ({ default: m[name] })))
const AppShell = lazyNamed(() => import('./components/layout/AppShell'), 'AppShell')
const DashboardView = lazyNamed(() => import('./views/DashboardView'), 'DashboardView')
const DesignSystemView = lazyNamed(() => import('./views/DesignSystemView'), 'DesignSystemView')
const AuthView = lazyNamed(() => import('./views/AuthView'), 'AuthView')
const PlatformAdminView = lazyNamed(() => import('./views/PlatformAdminView'), 'PlatformAdminView')
const ModulesPreviewView = lazyNamed(() => import('./views/ModulesPreviewView'), 'ModulesPreviewView')
const LegalCenterView = lazyNamed(() => import('./views/LegalCenterView'), 'LegalCenterView')
const ToastNotification = lazyNamed(() => import('./components/ui/Primitives'), 'ToastNotification')
const NewRequestModal = lazyNamed(() => import('./components/modals/QuickActionModals'), 'NewRequestModal')
const RequestDetailDrawer = lazyNamed(() => import('./components/modals/QuickActionModals'), 'RequestDetailDrawer')
const DemoView = lazyNamed(() => import('./views/DemoView'), 'DemoView')
const NotFoundView = lazyNamed(() => import('./views/NotFoundView'), 'NotFoundView')

const THEME_KEY = 'coreflow_ui_theme'

function CoreFlowWorkspace() {
  const {
    supabaseStatus,
    isDemoData,
    isAuthenticated,
    isPlatformAdmin,
    accessContext,
    user,
    authenticateAccount,
    signOut,
    requestPasswordReset,
    submitPrivacyRequest,
    dataError,
    approvalQueue,
    getDocumentUrl,

    // Contexto A: Platform Admin
    platformAdminData,
    upsertPlan,
    createOrganization,
    updateSubscription,
    updateEntitlement,

    // Contextos B y C: Tenant Workspace (Starter / Business)
    accessibleOrganizations,
    activeOrganization,
    switchOrganization,
    contractedEdition,
    presentationEdition,
    entitlementsResolved,
    activeRole,
    departments,
    branches,
    members,
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
  } = useCoreFlow()

  const [activeView, setActiveView] = useState('dashboard')
  const privacy = usePrivacy()
  const route = useRoute()
  // El tema solo se recuerda con consentimiento funcional.
  const [darkMode, setDarkMode] = useState(() => privacy.readPreference(THEME_KEY) === 'dark')
  const [searchQuery, setSearchQuery] = useState('')
  const [showAuthScreen, setShowAuthScreen] = useState(false)
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [pendingDemoId, setPendingDemoId] = useState(null)
  const [demoError, setDemoError] = useState(null)

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
  }, [darkMode])

  useEffect(() => {
    privacy.writePreference(THEME_KEY, darkMode ? 'dark' : 'light')
  }, [darkMode, privacy])

  // Título, descripción, canonical y robots siguen a la ruta
  useEffect(() => {
    const meta = getRouteMeta(route)
    applyRouteMeta(meta, meta.path === null ? null : canonicalUrl(meta.path))
  }, [route.name, route.slug])

  // Rutas que solo tienen sentido sin sesión (o solo con datos de ejemplo) vuelven a la raíz
  useEffect(() => {
    const inertWithSession = isAuthenticated && !showAuthScreen && (route.name === 'acceso' || route.name === 'demo')
    const demoUnavailable = !isAuthenticated && !isDemoData && route.name === 'demo'
    if (inertWithSession || demoUnavailable) navigate('/', { replace: true })
  }, [route.name, isAuthenticated, showAuthScreen, isDemoData])

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || null

  const handleCycleRequestStatus = (id) => {
    return cycleRequestStatus(id)
  }

  const handleUpdateRequestStatus = async (id, newStatus) => {
    const res = await updateRequestStatus(id, newStatus)
    if (res?.ok === false) setActionError(res.error)
    return res
  }

  const handleApproveLevel = (id) => {
    return approveRequestLevel(id, 2)
  }

  const handleCreateRequest = async (newReqData) => {
    const res = await createRequest(newReqData)
    if (res.ok && res.data) {
      setSelectedRequestId(res.data.id)
    }
    return res
  }

  const handleAuthenticate = async (credentials) => {
    const res = await authenticateAccount(credentials)
    if (res.ok) {
      if (getPath() === '/acceso') navigate('/', { replace: true })
      setShowAuthScreen(false)
      setSelectedRequestId(null)
      setActiveView('dashboard')
    }
    return res
  }

  const handleSignOut = async () => {
    const res = await signOut()
    if (res?.ok === false) {
      setActionError(res.error)
      return
    }
    setSelectedRequestId(null)
    setShowAuthScreen(true)
    navigate('/acceso')
  }

  const goToLogin = () => {
    setShowAuthScreen(true)
    navigate('/acceso')
  }

  const goToDemo = () => {
    setShowAuthScreen(false)
    setDemoError(null)
    navigate('/demo')
  }

  // showAuthScreen sigue en true tras ir al login; hay que apagarlo para que la landing vuelva a mostrarse
  const goToHome = () => {
    setShowAuthScreen(false)
    setDemoError(null)
    navigate('/')
  }

  const handleStartDemo = async (demo) => {
    setDemoError(null)
    setPendingDemoId(demo.id)
    try {
      const res = await authenticateAccount({ email: demo.email, password: '' })
      if (res?.ok === false) setDemoError('No se pudo abrir la demo. Inténtalo de nuevo.')
      else {
        setShowAuthScreen(false)
        setActiveView('dashboard')
        if (getPath() !== '/') navigate('/', { replace: true })
      }
    } catch {
      setDemoError('No se pudo abrir la demo. Inténtalo de nuevo.')
    } finally {
      setPendingDemoId(null)
    }
  }

  // La autenticación demo es síncrona; la pausa deja ver la transición de carga en vez de un parpadeo
  const DEMO_TRANSITION_MS = 900
  const startDemoWithTransition = async (demo) => {
    if (pendingDemoId) return
    setDemoError(null)
    setPendingDemoId(demo.id)
    await new Promise((resolve) => setTimeout(resolve, DEMO_TRANSITION_MS))
    // Si la persona volvió atrás mientras cargaba, se cancela en vez de abrir el dashboard por sorpresa
    if (getPath() !== '/demo') {
      setPendingDemoId(null)
      return
    }
    await handleStartDemo(demo)
  }

  // Desde un plan de la landing: abre la pantalla de demo y arranca ese plan directo
  const startDemoFromLanding = (demo) => {
    goToDemo()
    return startDemoWithTransition(demo)
  }

  // 0. Centro legal: accesible con o sin sesión
  if (route.name === 'legal') {
    return <LegalCenterView slug={route.slug} onSubmitPrivacyRequest={submitPrivacyRequest} />
  }

  if (route.name === 'notfound') {
    return <NotFoundView />
  }

  // 0.4 Pantalla de demo (solo con datos de ejemplo): elegir Starter o Business
  if (!isAuthenticated && isDemoData && route.name === 'demo') {
    return (
      <DemoView
        onStartDemo={startDemoWithTransition}
        pendingDemoId={pendingDemoId}
        demoError={demoError}
        onBack={goToHome}
      />
    )
  }

  // 0.5 Landing pública: primera pantalla para quien llega sin sesión
  if (!isAuthenticated && !showAuthScreen && route.name !== 'acceso') {
    return (
      <LandingView
        isDemoData={isDemoData}
        onStartDemo={startDemoFromLanding}
        onOpenDemo={goToDemo}
        pendingDemoId={pendingDemoId}
        demoError={demoError}
        onLogin={goToLogin}
      />
    )
  }

  // 1. Pantalla de Autenticación real cuando no hay sesión o el usuario solicita cambiar cuenta
  if (!isAuthenticated || showAuthScreen) {
    return (
      <AuthView
        onAuthenticate={handleAuthenticate}
        onRequestPasswordReset={requestPasswordReset}
        onBackToHome={goToHome}
        isDemoData={isDemoData}
      />
    )
  }

  // 2. Contexto A: CoreFlow Platform Admin (Consola Global de Organizaciones, Planes y Suscripciones)
  if (isPlatformAdmin || accessContext === 'PLATFORM_ADMIN') {
    return (
      <PlatformAdminView
        user={user}
        supabaseStatus={supabaseStatus}
        isDemoData={isDemoData}
        plans={platformAdminData.plans}
        organizations={platformAdminData.organizations}
        usersData={platformAdminData.users}
        globalAuditLogs={platformAdminData.globalAuditLogs}
        onUpsertPlan={upsertPlan}
        onCreateOrganization={createOrganization}
        onUpdateSubscription={updateSubscription}
        onUpdateEntitlement={updateEntitlement}
        onSignOut={handleSignOut}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
      />
    )
  }

  // 3. Contextos B y C: CoreFlow Starter / CoreFlow Business (Workspace Organizacional Aislado)
  return (
    <>
      <AppShell
        activeView={activeView}
        onNavigate={setActiveView}
        edition={presentationEdition}
        contractedEdition={contractedEdition}
        entitlementsResolved={entitlementsResolved}
        activeOrganization={activeOrganization}
        accessibleOrganizations={accessibleOrganizations}
        onSwitchOrganization={async (orgId) => {
          setSelectedRequestId(null)
          const res = await switchOrganization(orgId)
          if (res?.ok === false) setActionError(res.error)
        }}
        activeRole={activeRole}
        user={user}
        isDemoData={isDemoData}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAuth={goToLogin}
        onSignOut={handleSignOut}
        counts={{
          clientes: unifiedMetrics.acumulados.clientesTotal,
          comercial: unifiedMetrics.acumulados.oportunidadesActivas,
          solicitudes: unifiedMetrics.acumulados.solicitudesEnSeguimiento,
          tareas: unifiedMetrics.acumulados.tareasPendientesActuales,
        }}
      >
        {activeView === 'dashboard' && (
          <DashboardView
            edition={presentationEdition}
            contractedEdition={contractedEdition}
            entitlementsResolved={entitlementsResolved}
            activeOrganization={activeOrganization}
            departments={departments}
            branches={branches}
            auditLogs={auditLogs}
            activeRole={activeRole}
            period={period}
            onPeriodChange={setPeriod}
            unifiedMetrics={unifiedMetrics}
            darkMode={darkMode}
            searchQuery={searchQuery}
            onNavigate={setActiveView}
            clients={clients}
            requests={requests}
            tasks={tasks}
            documents={documents}
            automationRules={automationRules}
            onSelectRequest={(req) => setSelectedRequestId(req.id)}
            onCycleRequestStatus={handleCycleRequestStatus}
            onApproveRequestLevel={handleApproveLevel}
            onOpenNewRequestModal={() => setNewRequestOpen(true)}
            onToggleTaskStatus={toggleTaskStatus}
            onCreateTask={createTask}
            isDemoData={isDemoData}
            approvalQueue={approvalQueue}
          />
        )}

        {activeView === 'design-system' && <DesignSystemView />}

        {activeView !== 'dashboard' && activeView !== 'design-system' && (
          <ModulesPreviewView
            moduleId={activeView}
            edition={presentationEdition}
            contractedEdition={contractedEdition}
            activeOrganization={activeOrganization}
            entitlementsResolved={entitlementsResolved}
            auditLogs={auditLogs}
            activeRole={activeRole}
            unifiedMetrics={unifiedMetrics}
            clients={clients}
            opportunities={opportunities}
            requests={requests}
            tasks={tasks}
            documents={documents}
            automationRules={automationRules}
            departments={departments}
            branches={branches}
            members={members}
            onCreateClient={createClient}
            onCreateOpportunity={createOpportunity}
            onCreateTask={createTask}
            onToggleTaskStatus={toggleTaskStatus}
            onCreateDocument={createDocument}
            onCreateAutomationRule={createAutomationRule}
            onCreateDepartment={createDepartment}
            onSelectRequest={(req) => setSelectedRequestId(req.id)}
            onBackToDashboard={() => setActiveView('dashboard')}
            onOpenNewRequest={() => setNewRequestOpen(true)}
            isDemoData={isDemoData}
            onOpenDocument={getDocumentUrl}
          />
        )}
      </AppShell>

      <NewRequestModal
        isOpen={newRequestOpen}
        onClose={() => setNewRequestOpen(false)}
        edition={presentationEdition}
        activeRole={activeRole}
        onCreated={handleCreateRequest}
        isDemoData={isDemoData}
        clients={clients}
        departments={departments}
        members={members}
      />

      <RequestDetailDrawer
        request={selectedRequest}
        onClose={() => setSelectedRequestId(null)}
        edition={presentationEdition}
        activeRole={activeRole}
        onUpdateStatus={handleUpdateRequestStatus}
        onApproveLevel={handleApproveLevel}
      />

      {(actionError || dataError) && (
        <ToastNotification
          title={actionError ? 'No se pudo completar la acción' : 'No se pudieron actualizar los datos'}
          description={actionError || dataError.message}
          onClose={() => setActionError(null)}
        />
      )}
    </>
  )
}

/** El consentimiento envuelve toda la aplicación; con datos reales puede registrarse en el servidor. */
function PrivacyLayer({ children }) {
  const { recordPrivacyConsent } = useCoreFlow()
  return <PrivacyProvider onRecord={recordPrivacyConsent}>{children}</PrivacyProvider>
}

export default function App() {
  return (
    <CoreFlowProvider>
      <PrivacyLayer>
        <Suspense fallback={<div className="min-h-screen bg-core-navy-deep" aria-busy="true" />}>
          <CoreFlowWorkspace />
        </Suspense>
      </PrivacyLayer>
    </CoreFlowProvider>
  )
}
