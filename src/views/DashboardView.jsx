import React, { useState, useEffect } from 'react'
import {
  Plus,
  UserPlus,
  CheckCircle2,
  ArrowUpRight,
  Building2,
  ShieldCheck,
  ShieldAlert,
  Users,
  Briefcase,
  CheckSquare,
  FileText,
  ChevronRight,
  Zap,
  Layers,
  Lock,
  Inbox,
  Clock,
} from 'lucide-react'
import { CoreFlowIsotipo } from '../components/brand/CoreFlowLogo'
import {
  Button,
  KpiCard,
  SurfaceCard,
  StatusBadge,
  Tabs,
  ToastNotification,
  GeometricAccentBar,
  ActivityTimelineList,
  ClientAccountCard,
  DocumentRecordCard,
  TaskProgressCard,
} from '../components/ui/Primitives'
import { formatStorageMb } from '../components/ui/labels'
import { ProcessEvolutionChart } from '../components/charts/ProcessEvolutionChart'
import {
  INITIAL_ACTIVITY_FEED,
  BUSINESS_AREAS_PERFORMANCE,
  checkCapability,
} from '../data/demoStore'

export function DashboardView({
  edition = 'business',
  contractedEdition = 'business',
  isSimulationActive = false,
  entitlementsResolved = null,
  activeOrganization = null,
  departments = [],
  auditLogs = [],
  activeRole = 'Administrador Organizacional',
  period = '7d',
  onPeriodChange,
  unifiedMetrics,
  darkMode = false,
  searchQuery = '',
  onNavigate,
  clients = [],
  requests = [],
  tasks = [],
  documents = [],
  automationRules = [],
  onSelectRequest,
  onCycleRequestStatus,
  onApproveRequestLevel,
  onOpenNewRequestModal,
  onToggleTaskStatus,
  onCreateTask,
}) {
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  const [activityCategory, setActivityCategory] = useState('Todo')
  const [operationalTab, setOperationalTab] = useState('solicitudes')
  const [starterTab, setStarterTab] = useState('solicitudes')
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  const [toastMessage, setToastMessage] = useState(null)

  const isStarter = edition === 'start' || edition === 'starter'
  const deptFilterPermission = checkCapability(edition, activeRole, 'departmentFilter')
  const approvalPermission = checkCapability(contractedEdition, activeRole, 'multilevelApproval')
  const collabStatus = entitlementsResolved?.collaboratorsStatus || {
    current: activeOrganization?.activeCollaboratorsCount || (isStarter ? 12 : 18),
    max: isStarter ? 15 : 30,
  }

  useEffect(() => {
    if (!deptFilterPermission.allowed) {
      setSelectedDepartment('all')
    }
    if (
      isStarter &&
      (operationalTab === 'responsables' || operationalTab === 'aprobaciones')
    ) {
      setOperationalTab('solicitudes')
    }
  }, [isStarter, deptFilterPermission.allowed, operationalTab])

  const acum = unifiedMetrics?.acumulados
  const per = unifiedMetrics?.periodo

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      !searchQuery ||
      req.asunto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.responsable.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDept =
      !deptFilterPermission.allowed ||
      selectedDepartment === 'all' ||
      req.departamento.toLowerCase() === selectedDepartment.toLowerCase()

    const matchesStatus =
      selectedStatusFilter === 'all' || req.estado === selectedStatusFilter

    return matchesSearch && matchesDept && matchesStatus
  })

  const filteredActivity = INITIAL_ACTIVITY_FEED.filter(
    (item) => activityCategory === 'Todo' || item.category === activityCategory
  )

  const handleQuickCreateTask = (e) => {
    e.preventDefault()
    if (!quickTaskTitle.trim()) return
    const res = onCreateTask?.({
      title: quickTaskTitle.trim(),
      priority: 'Alta',
      dueLabel: 'Hoy · 17:30',
    })
    if (res && res.ok === false) {
      setToastMessage({
        title: 'No se pudo registrar la tarea',
        description: res.error,
      })
      return
    }
    setQuickTaskTitle('')
    setToastMessage({
      title: 'Tarea agregada al equipo',
      description: 'La tarea quedó asignada en la bandeja operativa de la organización.',
    })
  }

  // ============================================================================
  // RECORRIDO FUNCIONAL DIFERENCIADO A: COREFLOW STARTER (1 a 15 colaboradores)
  // ============================================================================
  if (isStarter) {
    const openTasksCount = tasks.filter((t) => t.status !== 'completed').length
    const activeClientsCount = clients.filter((c) => c.status === 'active').length || clients.length

    return (
      <div className="space-y-6">
        {toastMessage && (
          <ToastNotification
            title={toastMessage.title}
            description={toastMessage.description}
            onClose={() => setToastMessage(null)}
          />
        )}

        {/* Cabecera Operativa Directa (Starter) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <GeometricAccentBar size="md" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-core-navy dark:text-white">
                Inicio Operativo · Equipo Directo
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-core-cyan/15 text-[#0369A1] dark:text-core-cyan border border-core-cyan/30">
                CoreFlow Starter · {collabStatus.current}/{collabStatus.max} colaboradores
              </span>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-core-muted dark:text-slate-400">
              Organización:{' '}
              <strong className="text-core-navy dark:text-slate-200">
                {activeOrganization?.displayName || 'Soluciones Ágiles del Caribe S.A.S.'}
              </strong>{' '}
              · Operación centralizada en sede única sin burocracia multinivel · Rol:{' '}
              <strong className="text-core-violet dark:text-indigo-300">{activeRole}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="secondary"
              size="md"
              icon={UserPlus}
              iconPosition="left"
              onClick={() => onNavigate('clientes')}
            >
              Clientes ({clients.length})
            </Button>
            <Button
              variant="secondary"
              size="md"
              icon={CheckSquare}
              iconPosition="left"
              onClick={() => onNavigate('tareas')}
            >
              Tareas ({openTasksCount})
            </Button>
            <Button
              variant="primary"
              size="md"
              icon={Plus}
              iconPosition="left"
              onClick={onOpenNewRequestModal}
            >
              Nueva solicitud directa
            </Button>
          </div>
        </div>

        {/* Franja de Contexto Starter con Isotipo Oficial */}
        <div className="rounded-card bg-core-navy text-white px-4 py-3.5 sm:px-5 shadow-sm border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <CoreFlowIsotipo size={26} theme="dark" />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-core-cyan">
                  Flujo Directo para Pequeñas Empresas
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-core-lime">
                  Sede Principal Activa
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Atiende clientes, solicitudes, tareas y documentos en un solo paso sin aprobaciones multinivel ni divisiones departamentales.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate?.('procesos')}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-white transition-colors"
            >
              Reglas básicas ({automationRules.length})
            </button>
            <button
              type="button"
              onClick={() => onNavigate?.('configuracion')}
              className="px-3 py-1.5 rounded-lg bg-core-cyan text-core-navy text-xs font-bold hover:opacity-95 transition-opacity"
            >
              Equipo y Suscripción
            </button>
          </div>
        </div>

        {/* 4 KPIs Esenciales del Plan Starter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            title="Cuentas de Clientes"
            scopeBadge="Directorio Pyme"
            subtitle="Clientes atendidos por el equipo"
            value={String(clients.length)}
            delta={`${activeClientsCount} activos`}
            deltaLabel="en operación directa"
            deltaDirection="up"
            accentColor="violet"
            breakdown="Fichas comerciales con contacto directo y NIT"
            onClick={() => onNavigate('clientes')}
          />
          <KpiCard
            title="Solicitudes Directas"
            scopeBadge="Flujo Ágil"
            subtitle="Sin escalamiento departamental"
            value={String(requests.length)}
            delta={`${requests.filter((r) => r.estado !== 'completed').length} en curso`}
            deltaLabel="atención inmediata"
            deltaDirection="up"
            accentColor="cyan"
            breakdown="Haz clic en cualquier estado para avanzar etapa"
            onClick={() => onNavigate('solicitudes')}
          />
          <KpiCard
            title="Tareas del Equipo"
            scopeBadge="Ejecución Diaria"
            subtitle={`Lista compartida (${collabStatus.current} colab.)`}
            value={String(tasks.length)}
            delta={`${tasks.filter((t) => t.status === 'completed').length} completadas`}
            deltaLabel="en bandeja activa"
            deltaDirection="up"
            accentColor="lime"
            breakdown={`${openTasksCount} pendientes de cierre hoy`}
            onClick={() => onNavigate('tareas')}
          />
          <KpiCard
            title="Archivos y Soportes"
            scopeBadge="Repositorio"
            subtitle="Archivos privados de la organización"
            value={String(documents.length)}
            delta={formatStorageMb(entitlementsResolved?.realLimits?.maxStorageMb)}
            deltaLabel="Plan Starter"
            deltaDirection="up"
            accentColor="blue"
            breakdown="Contratos, propuestas y anexos operativos"
            onClick={() => onNavigate('documentos')}
          />
        </div>

        {/* Cuerpo Operativo Starter: 2 Columnas Asimétricas (Ejecución Directa + Directorio Rápido) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Columna Principal (7 cols): Solicitudes Directas, Checklist de Tareas y Automatizaciones Básicas */}
          <div className="xl:col-span-7 space-y-6">
            <SurfaceCard className="p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <GeometricAccentBar size="sm" />
                    <h2 className="text-base font-bold text-core-navy dark:text-white">
                      Centro de Ejecución Diaria (Flujo Directo)
                    </h2>
                  </div>
                  <p className="text-xs text-core-muted dark:text-slate-400 mt-0.5">
                    Gestiona los requerimientos de clientes y las tareas del día sin pasos intermedios
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {['all', 'process', 'pending', 'completed'].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatusFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                        selectedStatusFilter === st
                          ? 'bg-core-navy dark:bg-core-violet text-white'
                          : 'bg-core-cloud dark:bg-[#101228] text-core-muted dark:text-slate-300'
                      }`}
                    >
                      {st === 'all'
                        ? 'Todas'
                        : st === 'process'
                        ? 'En proceso'
                        : st === 'pending'
                        ? 'Pendientes'
                        : 'Listas'}
                    </button>
                  ))}
                </div>
              </div>

              <Tabs
                activeTab={starterTab}
                onChange={setStarterTab}
                tabs={[
                  {
                    id: 'solicitudes',
                    label: 'Solicitudes Directas',
                    count: filteredRequests.length,
                  },
                  {
                    id: 'tareas',
                    label: 'Checklist de Tareas del Equipo',
                    count: tasks.length,
                  },
                  {
                    id: 'reglas',
                    label: 'Avisos Automáticos Básicos',
                    count: automationRules.length,
                  },
                ]}
              />

              {/* Sub-vista 1: Solicitudes Directas */}
              {starterTab === 'solicitudes' && (
                <div className="mt-4 space-y-3">
                  {filteredRequests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => onSelectRequest?.(req)}
                      className="rounded-xl border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#141733] hover:border-core-violet/50 p-4 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-extrabold font-mono text-core-violet dark:text-indigo-300">
                            {req.id}
                          </span>
                          <span className="text-[11px] font-semibold text-core-muted dark:text-slate-400">
                            · Cuenta: <strong className="text-core-navy dark:text-slate-200">{req.cliente}</strong>
                          </span>
                          <span className="px-2 py-0.5 rounded bg-core-cloud dark:bg-[#1F2347] text-[10px] font-semibold text-core-muted dark:text-slate-300">
                            Prioridad {req.prioridad}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-core-navy dark:text-white truncate">
                          {req.asunto}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-core-muted dark:text-slate-400">
                          <span>Responsable: {req.responsable}</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Plazo: {req.vencimiento}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          title="Haz clic para cambiar el estado de la solicitud"
                          onClick={(e) => {
                            e.stopPropagation()
                            const res = onCycleRequestStatus?.(req.id)
                            if (res && res.ok === false) {
                              setToastMessage({
                                title: 'Cambio no permitido',
                                description: res.error,
                              })
                              return
                            }
                            setToastMessage({
                              title: `Solicitud ${req.id} actualizada`,
                              description: 'El estado avanzó directamente en la bandeja del equipo.',
                            })
                          }}
                        >
                          <StatusBadge status={req.estado} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onSelectRequest?.(req)
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-core-cloud hover:bg-core-violet hover:text-white dark:bg-[#1F2347] text-xs font-semibold text-core-navy dark:text-slate-200 transition-colors inline-flex items-center gap-1"
                        >
                          Detalle
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Sub-vista 2: Checklist Interactivo de Tareas del Equipo */}
              {starterTab === 'tareas' && (
                <div className="mt-4 space-y-4">
                  <form onSubmit={handleQuickCreateTask} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      placeholder="Agregar tarea rápida para el equipo (ej. Enviar cotización actualizada)..."
                      className="h-10 flex-1 rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/50 dark:bg-[#101228] px-3.5 text-xs text-core-navy dark:text-white"
                    />
                    <Button type="submit" variant="primary" size="md" icon={Plus} iconPosition="left">
                      Añadir tarea
                    </Button>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tasks.map((task) => (
                      <TaskProgressCard
                        key={task.id}
                        task={task}
                        onToggleStatus={() => {
                          onToggleTaskStatus?.(task.id)
                          setToastMessage({
                            title: `Tarea ${task.code || task.id} actualizada`,
                            description: 'Estado de la tarea sincronizado con el equipo.',
                          })
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-vista 3: Reglas Básicas de Notificación (Starter) */}
              {starterTab === 'reglas' && (
                <div className="mt-4 space-y-3">
                  {automationRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="rounded-xl border border-core-border dark:border-[#282C5A] p-4 flex items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-core-cyan shrink-0" />
                          <span className="text-xs font-bold text-core-violet dark:text-indigo-300">
                            {rule.code || rule.id}
                          </span>
                          <span className="text-sm font-bold text-core-navy dark:text-white">
                            {rule.name}
                          </span>
                        </div>
                        <p className="text-xs text-core-muted dark:text-slate-400">
                          {rule.description || rule.meta}
                        </p>
                      </div>
                      <StatusBadge status={rule.status || 'active'} size="sm" />
                    </div>
                  ))}
                  <div className="pt-2 flex justify-end">
                    <Button variant="secondary" size="sm" onClick={() => onNavigate('procesos')}>
                      Configurar avisos automáticos →
                    </Button>
                  </div>
                </div>
              )}
            </SurfaceCard>

            {/* Línea de Tiempo Cronológica del Equipo */}
            <SurfaceCard
              title="Actividad Reciente del Equipo"
              subtitle="Eventos operativos registrados en tiempo real dentro de la organización"
            >
              <div className="mt-2">
                <ActivityTimelineList
                  items={filteredActivity.slice(0, 4)}
                  onSelectItem={(item) => {
                    const found = requests.find((r) => r.id === item.linkedRequestId)
                    if (found && onSelectRequest) {
                      onSelectRequest(found)
                    } else {
                      onNavigate('solicitudes')
                    }
                  }}
                />
              </div>
            </SurfaceCard>
          </div>

          {/* Columna Lateral Derecha (5 cols): Directorio de Cuentas Activas y Documentos Recientes */}
          <div className="xl:col-span-5 space-y-6">
            <SurfaceCard
              title="Cuentas de Clientes Atendidas"
              subtitle="Acceso directo a las fichas comerciales de tu organización"
              action={
                <Button variant="secondary" size="sm" onClick={() => onNavigate('clientes')}>
                  Ver directorio ({clients.length})
                </Button>
              }
            >
              <div className="grid grid-cols-1 gap-3 mt-2">
                {clients.slice(0, 3).map((client) => (
                  <ClientAccountCard
                    key={client.id}
                    client={client}
                    requestsCount={requests.filter((r) => r.clientId === client.id).length}
                    onSelect={() => onNavigate('clientes')}
                  />
                ))}
              </div>
            </SurfaceCard>

            <SurfaceCard
              title="Documentos y Soportes Vigentes"
              subtitle="Archivos privados de la organización"
              action={
                <Button variant="secondary" size="sm" onClick={() => onNavigate('documentos')}>
                  Repositorio ({documents.length})
                </Button>
              }
            >
              <div className="grid grid-cols-1 gap-3 mt-2">
                {documents.slice(0, 3).map((doc) => (
                  <DocumentRecordCard
                    key={doc.id}
                    doc={doc}
                    onSelect={() => onNavigate('documentos')}
                  />
                ))}
              </div>
            </SurfaceCard>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RECORRIDO FUNCIONAL DIFERENCIADO B: COREFLOW BUSINESS (16 a 30 colaboradores)
  // ============================================================================
  return (
    <div className="space-y-6">
      {toastMessage && (
        <ToastNotification
          title={toastMessage.title}
          description={toastMessage.description}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* CABECERA CORPORATIVA MULTI-ÁREA (BUSINESS) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <GeometricAccentBar size="md" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-core-navy dark:text-white">
              Resumen Ejecutivo Multi-Área
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-core-violet/10 text-core-violet dark:bg-core-violet/25 dark:text-indigo-300 border border-core-violet/30">
              CoreFlow Business · {collabStatus.current}/{collabStatus.max} colab.
            </span>
            {isSimulationActive && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-[#B45309] dark:text-amber-300 border border-amber-400/30">
                Plan Contratado: {contractedEdition.toUpperCase()}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-core-muted dark:text-slate-400">
            Corporación activa:{' '}
            <strong className="text-core-navy dark:text-slate-200">
              {activeOrganization?.displayName || 'Grupo Corporativo Andino S.A.S.'}
            </strong>{' '}
            · Gobierno por departamentos, aprobaciones multinivel y control SLA · Rol:{' '}
            <strong className="text-core-violet dark:text-indigo-300">{activeRole}</strong>
          </p>
        </div>

        {/* Barra de acciones corporativas con filtro departamental */}
        <div className="flex flex-wrap items-center gap-2.5">
          {deptFilterPermission.allowed && (
            <div className="h-10 inline-flex items-center gap-2 rounded-xl border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#171936] px-3 text-xs shadow-2xs">
              <Building2 className="w-3.5 h-3.5 text-core-violet shrink-0" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                aria-label="Filtrar por departamento"
                className="bg-transparent font-semibold text-core-navy dark:text-white focus:outline-none cursor-pointer"
              >
                <option value="all">Todas las áreas ({departments.length})</option>
                {(departments.length > 0
                  ? departments
                  : [
                      { id: 'ops', name: 'Operaciones' },
                      { id: 'doc', name: 'Documentación' },
                      { id: 'tec', name: 'Tecnología' },
                      { id: 'cal', name: 'Calidad' },
                    ]
                ).map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    Área: {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <Button
            variant="secondary"
            size="md"
            icon={UserPlus}
            iconPosition="left"
            onClick={() => onNavigate('clientes')}
          >
            Cuentas corporativas
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            iconPosition="left"
            onClick={onOpenNewRequestModal}
          >
            Nueva solicitud corporativa
          </Button>
        </div>
      </div>

      {/* FRANJA DE GOBIERNO CORPORATIVO BUSINESS CON ISOTIPO OFICIAL */}
      <div className="rounded-card bg-core-navy text-white px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <CoreFlowIsotipo size={24} theme="dark" />
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-core-violet text-white">
            <Layers className="w-3.5 h-3.5" />
            Suscripción CoreFlow Business
          </span>

          <p className="text-xs text-slate-200">
            <strong className="text-core-lime">Capacidades corporativas activas:</strong>{' '}
            {departments.length} departamentos · Aprobación multinivel{' '}
            {approvalPermission.allowed
              ? `autorizada para "${activeRole}"`
              : `restringida para "${activeRole}"`}{' '}
            · Cuota contratada: {collabStatus.current}/{collabStatus.max} colaboradores.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate?.('reportes')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-colors"
          >
            Analítica comparativa
          </button>
          <button
            type="button"
            onClick={() => onNavigate?.('configuracion')}
            className="px-3 py-1.5 rounded-lg bg-core-violet hover:bg-core-blue text-xs font-semibold text-white transition-colors"
          >
            Departamentos y Roles
          </button>
        </div>
      </div>

      {/* FILA 1: 4 TARJETAS KPI EJECUTIVAS (SIN ÍCONOS ENCAJONADOS REPETITIVOS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <KpiCard
          title="Cuentas Corporativas"
          scopeBadge="Acumulado actual"
          subtitle="Cuentas organizacionales en directorio"
          value={String(acum?.clientesTotal ?? clients.length)}
          deltaDirection="up"
          accentColor="violet"
          breakdown={`${acum?.clientesActivos ?? 0} cuentas activas · ${
            acum?.clientesIncorporacion ?? 0
          } en incorporación`}
          onClick={() => onNavigate('clientes')}
        />
        <KpiCard
          title="Pipeline Comercial"
          scopeBadge="Inventario activo"
          subtitle="Embudo comercial conectado a áreas"
          value={String(acum?.oportunidadesActivas ?? 0)}
          deltaDirection="up"
          accentColor="cyan"
          breakdown={`${acum?.oportunidadesPropuesta ?? 0} en propuesta · ${
            acum?.oportunidadesValidacion ?? 0
          } en validación`}
          onClick={() => onNavigate('comercial')}
        />
        <KpiCard
          title="Tareas Departamentales"
          scopeBadge="Saldo actual"
          subtitle={`Cerradas en ${per?.label?.toLowerCase() ?? '7 días'}: ${
            per?.tareasCerradas ?? 0
          }`}
          value={String(acum?.tareasPendientesActuales ?? 0)}
          deltaDirection="up"
          accentColor="violet"
          breakdown={`${acum?.tareasHoy ?? 0} vencen hoy · ${
            acum?.tareasSemana ?? 0
          } programadas en semana`}
          onClick={() => onNavigate('tareas')}
        />
        <KpiCard
          title="Control Documental"
          scopeBadge="Repositorio total"
          subtitle="Control de versión y auditoría"
          value={String(acum?.documentosTotales ?? documents.length)}
          deltaDirection="up"
          accentColor="lime"
          breakdown={`${acum?.documentosVigentes ?? 0} aprobados y vigentes · ${
            acum?.documentosRevision ?? 0
          } en revisión`}
          onClick={() => onNavigate('documentos')}
        />
      </div>

      {/* FILA 2: LÍNEA DE TIEMPO DE TRAZABILIDAD + GRÁFICO DE EVOLUCIÓN DE PROCESOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <SurfaceCard className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <GeometricAccentBar size="sm" />
                  <h3 className="text-base font-bold text-core-navy dark:text-white">
                    Línea de tiempo multi-área
                  </h3>
                </div>
                <p className="text-xs text-core-muted dark:text-slate-400 mt-0.5">
                  Trazabilidad cronológica de eventos y aprobaciones
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-core-violet dark:text-indigo-300 bg-core-violet/10 px-2.5 py-1 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-core-lime" />
                En línea
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
              {['Todo', 'Solicitudes', 'Clientes', 'Documentos', 'Tareas'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActivityCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
                    activityCategory === cat
                      ? 'bg-core-violet text-white'
                      : 'bg-core-cloud dark:bg-[#101228] text-core-muted dark:text-slate-300 hover:text-core-navy'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <ActivityTimelineList
              items={filteredActivity}
              onSelectItem={(item) => {
                const found = requests.find((r) => r.id === item.linkedRequestId)
                if (found && onSelectRequest) {
                  onSelectRequest(found)
                } else if (item.category === 'Clientes') {
                  onNavigate('clientes')
                }
              }}
            />
          </div>

          <div className="mt-4 pt-3 border-t border-core-border dark:border-[#282C5A] flex items-center justify-between text-xs">
            <span className="text-core-muted dark:text-slate-400">
              Solicitudes resueltas ({per?.label?.toLowerCase() ?? '7 días'}):{' '}
              <strong className="text-core-navy dark:text-white tabular-nums">
                {per?.solicitudesResueltas ?? 0} de {per?.solicitudesGestionadas ?? 0} gestionadas
              </strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('solicitudes')}
              className="font-semibold text-core-violet dark:text-indigo-300 hover:underline inline-flex items-center gap-1"
            >
              Ver bandeja completa
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </SurfaceCard>

        <SurfaceCard className="lg:col-span-7 p-5 sm:p-6" diagonalAccent>
          <ProcessEvolutionChart
            period={period}
            onPeriodChange={onPeriodChange}
            unifiedMetrics={unifiedMetrics}
            executiveMode={darkMode}
          />
        </SurfaceCard>
      </div>

      {/* FILA 3: GOBIERNO OPERATIVO, APROBACIONES MULTINIVEL Y MATRIZ DE RESPONSABLES */}
      <SurfaceCard className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <GeometricAccentBar size="sm" />
              <h3 className="text-base font-bold text-core-navy dark:text-white">
                Gobierno de Solicitudes, Aprobaciones Multinivel y Desempeño por Área
              </h3>
            </div>
            <p className="text-xs text-core-muted dark:text-slate-400 mt-0.5">
              Selecciona una solicitud para inspeccionar su trazabilidad o valida niveles de aprobación entre áreas
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'process', label: 'En proceso' },
              { id: 'pending', label: 'Pendiente' },
              { id: 'active', label: 'Activo' },
              { id: 'completed', label: 'Completado' },
              { id: 'error', label: 'Crítico' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedStatusFilter === st.id
                    ? 'bg-core-navy dark:bg-core-violet text-white'
                    : 'bg-core-cloud dark:bg-[#101228] text-core-muted dark:text-slate-300 hover:text-core-navy'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <Tabs
          activeTab={operationalTab}
          onChange={setOperationalTab}
          tabs={[
            {
              id: 'solicitudes',
              label: 'Solicitudes y Aprobaciones por Área',
              count: filteredRequests.length,
            },
            {
              id: 'responsables',
              label: 'Desempeño por Departamento y Responsable',
              count: BUSINESS_AREAS_PERFORMANCE.length,
            },
            {
              id: 'aprobaciones',
              label: 'Cola de Aprobación Multinivel',
              count: 2,
            },
            {
              id: 'auditoria',
              label: 'Auditoría Protegida (Append-Only)',
              count: auditLogs.length,
            },
          ]}
        />

        {/* TAB 1: SOLICITUDES MULTI-ÁREA */}
        {operationalTab === 'solicitudes' && (
          <div className="mt-4">
            {filteredRequests.length === 0 ? (
              <div className="py-10 text-center rounded-xl border border-dashed border-core-border dark:border-[#282C5A]">
                <p className="text-sm font-semibold text-core-navy dark:text-white">
                  No se encontraron registros con los filtros seleccionados
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  onClick={() => {
                    setSelectedStatusFilter('all')
                    setSelectedDepartment('all')
                  }}
                >
                  Restablecer filtros
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-core-border dark:border-[#282C5A] text-[11px] font-bold uppercase tracking-wider text-core-muted dark:text-slate-400">
                      <th className="py-3 px-3">Código</th>
                      <th className="py-3 px-3">Solicitud / Proceso</th>
                      <th className="py-3 px-3">Cuenta Corporativa</th>
                      <th className="py-3 px-3">Departamento / Rol</th>
                      <th className="py-3 px-3 hidden xl:table-cell">Aprobación Multinivel</th>
                      <th className="py-3 px-3">Estado</th>
                      <th className="py-3 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-core-border/70 dark:divide-[#282C5A] text-xs sm:text-sm">
                    {filteredRequests.map((req) => (
                      <tr
                        key={req.id}
                        onClick={() => onSelectRequest?.(req)}
                        className="hover:bg-core-cloud/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
                      >
                        <td className="py-3.5 px-3 font-bold font-mono text-core-violet dark:text-indigo-300 whitespace-nowrap tabular-nums">
                          {req.id}
                        </td>
                        <td className="py-3.5 px-3">
                          <p className="font-semibold text-core-navy dark:text-white">
                            {req.asunto}
                          </p>
                          <p className="text-[11px] text-core-muted dark:text-slate-400 mt-0.5">
                            Plazo SLA: {req.vencimiento} · Prioridad {req.prioridad}
                          </p>
                        </td>
                        <td className="py-3.5 px-3 text-core-navy dark:text-slate-200 font-medium">
                          {req.cliente}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-medium text-core-navy dark:text-slate-200 block">
                            {req.responsable}
                          </span>
                          <span className="text-[11px] text-core-muted dark:text-slate-400">
                            Área: {req.departamento}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 hidden xl:table-cell">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-core-navy dark:text-slate-200 bg-core-cloud dark:bg-[#12142E] px-2.5 py-1 rounded-lg border border-core-border dark:border-[#282C5A]">
                            <ShieldCheck className="w-3.5 h-3.5 text-core-violet shrink-0" />
                            {req.nivelAprobacion}
                          </span>
                        </td>
                        <td
                          className="py-3.5 px-3"
                          onClick={(e) => {
                            e.stopPropagation()
                            const res = onCycleRequestStatus?.(req.id)
                            if (res && res.ok === false) {
                              setToastMessage({
                                title: 'Acción bloqueada por política RBAC / Alcance',
                                description: res.error,
                              })
                              return
                            }
                            setToastMessage({
                              title: `Estado de ${req.id} actualizado`,
                              description:
                                'Transición validada en WorkflowContractService y registrada en auditoría inmutable.',
                            })
                          }}
                        >
                          <button
                            type="button"
                            title="Haz clic para rotar estado operativo"
                            className="focus:outline-none"
                          >
                            <StatusBadge status={req.estado} />
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectRequest?.(req)
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-core-violet/8 hover:bg-core-violet text-core-violet hover:text-white dark:bg-core-violet/20 dark:text-indigo-300 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            Seguimiento
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2 (BUSINESS): DESEMPEÑO POR ÁREA Y RESPONSABLE */}
        {operationalTab === 'responsables' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {BUSINESS_AREAS_PERFORMANCE.map((resp) => (
              <div
                key={resp.rol}
                className="rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/40 dark:bg-[#12142E] p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-core-navy dark:text-white">{resp.rol}</p>
                    <p className="text-xs text-core-muted dark:text-slate-400">
                      {resp.departamento}
                    </p>
                  </div>
                  <StatusBadge status={resp.estado} />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5 tabular-nums">
                    <span className="text-core-muted dark:text-slate-400">
                      Actividades resueltas: {resp.completadas} de {resp.asignadas}
                    </span>
                    <span className="font-bold text-core-navy dark:text-white">
                      {resp.cumplimiento}% SLA
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-core-violet to-core-cyan"
                      style={{ width: `${resp.cumplimiento}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3 (BUSINESS): COLA DE APROBACIÓN MULTINIVEL */}
        {operationalTab === 'aprobaciones' && (
          <div className="mt-4 space-y-3">
            {!approvalPermission.allowed && (
              <div className="p-3.5 rounded-xl bg-[#FEF6E0] dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-800 text-xs text-[#B45309] dark:text-amber-300 flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Restricción de permiso granular activa:</strong> {approvalPermission.reason}
                </span>
              </div>
            )}

            {[
              {
                id: 'APR-102',
                reqId: 'SOL-458',
                titulo: 'Autorización de propuesta comercial y alcance operativo',
                ruta: 'Comercial → Operaciones → Dirección',
                etapaActual: 'Nivel 2 de 3 (Coordinación Operativa)',
                estado: 'pending',
              },
              {
                id: 'APR-105',
                reqId: 'SOL-459',
                titulo: 'Publicación de procedimiento estandarizado de servicio',
                ruta: 'Calidad → Liderazgo de Área',
                etapaActual: 'Nivel 2 de 2 (Listo para liberar)',
                estado: 'process',
              },
            ].map((apr) => (
              <div
                key={apr.id}
                className="rounded-xl border border-core-border dark:border-[#282C5A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold font-mono text-core-violet">{apr.id}</span>
                    <StatusBadge status={apr.estado} size="sm" />
                  </div>
                  <p className="text-sm font-bold text-core-navy dark:text-white">{apr.titulo}</p>
                  <p className="text-xs text-core-muted dark:text-slate-400">
                    Flujo entre áreas: <strong>{apr.ruta}</strong> · {apr.etapaActual}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant={approvalPermission.allowed ? 'primary' : 'outline'}
                    size="sm"
                    icon={!approvalPermission.allowed ? Lock : null}
                    iconPosition="left"
                    onClick={() => {
                      const res = onApproveRequestLevel?.(apr.reqId)
                      if (res && res.ok === false) {
                        setToastMessage({
                          title: 'Acción bloqueada por Autorización Multicapa',
                          description: res.error,
                        })
                        return
                      }
                      if (!approvalPermission.allowed) {
                        setToastMessage({
                          title: 'Acción bloqueada por permisos de rol',
                          description: approvalPermission.reason,
                        })
                        return
                      }
                      setToastMessage({
                        title: `Nivel aprobado en ${apr.id}`,
                        description:
                          'Validación multinivel autorizada y registrada en auditoría protegida.',
                      })
                    }}
                  >
                    Validar nivel actual
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: AUDITORÍA PROTEGIDA */}
        {operationalTab === 'auditoria' && (
          <div className="mt-4 space-y-2.5">
            <div className="p-3 rounded-xl bg-core-cloud/70 dark:bg-[#101228] border border-core-border dark:border-[#282C5A] flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="font-semibold text-core-navy dark:text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-core-violet shrink-0" />
                Registro inmutable (append-only) aislado para:{' '}
                <strong>{activeOrganization?.displayName}</strong>
              </span>
              <span className="text-[11px] text-core-muted dark:text-slate-400">
                Protección activa contra UPDATE/DELETE y sanitización de credenciales
              </span>
            </div>

            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-core-border dark:border-[#282C5A] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-core-violet dark:text-indigo-300">
                      {log.action}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-core-cloud dark:bg-[#101228] text-[10px] font-semibold text-core-muted">
                      {log.module} · {log.actorRoleCode}
                    </span>
                  </div>
                  <p className="font-medium text-core-navy dark:text-slate-100">{log.summary}</p>
                </div>
                <span className="text-[11px] text-core-muted tabular-nums shrink-0">
                  ID: {log.entityId}
                </span>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  )
}
