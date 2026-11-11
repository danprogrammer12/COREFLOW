import React, { useState, useEffect } from 'react'
import { CoreFlowProvider, useCoreFlow } from './adapters/react/CoreFlowContext'
import { AppShell } from './components/layout/AppShell'
import { DashboardView } from './views/DashboardView'
import { DesignSystemView } from './views/DesignSystemView'
import { AuthView } from './views/AuthView'
import { PlatformAdminView } from './views/PlatformAdminView'
import { ModulesPreviewView } from './views/ModulesPreviewView'
import {
  NewRequestModal,
  AiAssistantDrawer,
  RequestDetailDrawer,
} from './components/modals/QuickActionModals'

function CoreFlowWorkspace() {
  const {
    supabaseStatus,
    isAuthenticated,
    isPlatformAdmin,
    accessContext,
    user,
    authenticateAccount,
    signOut,

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
  const [darkMode, setDarkMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAuthScreen, setShowAuthScreen] = useState(false)
  const [newRequestOpen, setNewRequestOpen] = useState(false)
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false)
  const [selectedRequestId, setSelectedRequestId] = useState(null)

  useEffect(() => {
    const root = document.documentElement
    if (darkMode) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.removeAttribute('data-theme')
    }
  }, [darkMode])

  const selectedRequest = requests.find((r) => r.id === selectedRequestId) || null

  const handleCycleRequestStatus = (id) => {
    return cycleRequestStatus(id)
  }

  const handleUpdateRequestStatus = (id, newStatus) => {
    return updateRequestStatus(id, newStatus)
  }

  const handleApproveLevel = (id) => {
    return approveRequestLevel(id, 2)
  }

  const handleCreateRequest = (newReqData) => {
    const res = createRequest(newReqData)
    if (res.ok && res.data) {
      setSelectedRequestId(res.data.id)
    }
    return res
  }

  const handleAuthenticate = ({ email, password }) => {
    const res = authenticateAccount({ email, password })
    if (res.ok) {
      setShowAuthScreen(false)
      setSelectedRequestId(null)
      setActiveView('dashboard')
    }
    return res
  }

  const handleSignOut = () => {
    signOut()
    setSelectedRequestId(null)
    setShowAuthScreen(true)
  }

  // 1. Pantalla de Autenticación real cuando no hay sesión o el usuario solicita cambiar cuenta
  if (!isAuthenticated || showAuthScreen) {
    return (
      <AuthView
        onAuthenticate={handleAuthenticate}
        supabaseStatus={supabaseStatus}
      />
    )
  }

  // 2. Contexto A: CoreFlow Platform Admin (Consola Global de Organizaciones, Planes y Suscripciones)
  if (isPlatformAdmin || accessContext === 'PLATFORM_ADMIN') {
    return (
      <PlatformAdminView
        user={user}
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
        onSwitchOrganization={(orgId) => {
          setSelectedRequestId(null)
          switchOrganization(orgId)
        }}
        activeRole={activeRole}
        user={user}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenAuth={() => setShowAuthScreen(true)}
        onSignOut={handleSignOut}
        onOpenAiAssistant={() => setAiDrawerOpen(true)}
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
            requests={requests}
            onSelectRequest={(req) => setSelectedRequestId(req.id)}
            onCycleRequestStatus={handleCycleRequestStatus}
            onApproveRequestLevel={handleApproveLevel}
            onOpenNewRequestModal={() => setNewRequestOpen(true)}
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
          />
        )}
      </AppShell>

      <NewRequestModal
        isOpen={newRequestOpen}
        onClose={() => setNewRequestOpen(false)}
        edition={presentationEdition}
        activeRole={activeRole}
        onCreated={handleCreateRequest}
      />

      <RequestDetailDrawer
        request={selectedRequest}
        onClose={() => setSelectedRequestId(null)}
        edition={presentationEdition}
        activeRole={activeRole}
        onUpdateStatus={handleUpdateRequestStatus}
        onApproveLevel={handleApproveLevel}
      />

      <AiAssistantDrawer
        isOpen={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        edition={presentationEdition}
        unifiedMetrics={unifiedMetrics}
      />
    </>
  )
}

export default function App() {
  return (
    <CoreFlowProvider>
      <CoreFlowWorkspace />
    </CoreFlowProvider>
  )
}
