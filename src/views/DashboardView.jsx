import React, { useState, useEffect } from 'react'
import {
  Plus,
  UserPlus,
  FileCheck2,
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
} from 'lucide-react'
import {
  Button,
  KpiCard,
  SurfaceCard,
  StatusBadge,
  Tabs,
  ToastNotification,
  GeometricAccentBar,
} from '../components/ui/Primitives'
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
  onEditionChange,
  activeRole = 'Administrador Organizacional',
  period = '7d',
  onPeriodChange,
  unifiedMetrics,
  darkMode = false,
  searchQuery = '',
  onNavigate,
  requests = [],
  onSelectRequest,
  onCycleRequestStatus,
  onApproveRequestLevel,
  onOpenNewRequestModal,
}) {
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all')
  const [activityCategory, setActivityCategory] = useState('Todo')
  const [operationalTab, setOperationalTab] = useState('solicitudes')
  const [toastMessage, setToastMessage] = useState(null)

  const deptFilterPermission = checkCapability(edition, activeRole, 'departmentFilter')
  const approvalPermission = checkCapability(contractedEdition, activeRole, 'multilevelApproval')
  const collabStatus = entitlementsResolved?.collaboratorsStatus || {
    current: edition === 'business' ? 18 : 12,
    max: edition === 'business' ? 30 : 15,
  }

  // Restricción lógica: al cambiar a edición Start, se restablece cualquier filtro o pestaña exclusiva de Business
  useEffect(() => {
    if (!deptFilterPermission.allowed) {
      setSelectedDepartment('all')
    }
    if (
      edition === 'start' &&
      (operationalTab === 'responsables' || operationalTab === 'aprobaciones')
    ) {
      setOperationalTab('solicitudes')
    }
    if (edition === 'business' && operationalTab === 'automatizaciones') {
      setOperationalTab('solicitudes')
    }
  }, [edition, deptFilterPermission.allowed, operationalTab])

  const acum = unifiedMetrics?.acumulados
  const per = unifiedMetrics?.periodo

  // Filtrado real de solicitudes (respeta permisos lógicos de edición)
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

  return (
    <div className="space-y-6">
      {toastMessage && (
        <ToastNotification
          title={toastMessage.title}
          description={toastMessage.description}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* CABECERA PRINCIPAL CON IDENTIDAD GEOMÉTRICA Y CONTROLES ALINEADOS */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <GeometricAccentBar size="md" />
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-core-navy dark:text-white">
              {darkMode ? 'Resumen ejecutivo' : 'Dashboard operativo'}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                edition === 'business'
                  ? 'bg-core-violet/10 text-core-violet dark:bg-core-violet/25 dark:text-indigo-300 border-core-violet/30'
                  : 'bg-core-cyan/10 text-[#0369A1] dark:text-core-cyan border-core-cyan/30'
              }`}
            >
              CoreFlow {edition === 'business' ? 'Business · 16–30 colab.' : 'Start · 1–15 colab.'}
            </span>
            {isSimulationActive && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-[#B45309] dark:text-amber-300 border border-amber-400/30">
                Simulación de Vista · Plan Contratado Real: {contractedEdition.toUpperCase()}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs sm:text-sm text-core-muted dark:text-slate-400">
            Organización activa:{' '}
            <strong className="text-core-navy dark:text-slate-200">
              {activeOrganization?.displayName || 'Entorno Principal · Sede Central'}
            </strong>{' '}
            · Rol de membresía:{' '}
            <strong className="text-core-violet dark:text-indigo-300">{activeRole}</strong>
          </p>
        </div>

        {/* Barra de acciones principales con altura h-10 uniforme */}
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
                <option value="all">Todas las áreas ({departments.length || 5})</option>
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
            Directorio de clientes
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            iconPosition="left"
            onClick={onOpenNewRequestModal}
          >
            Nueva solicitud
          </Button>
        </div>
      </div>

      {/* FRANJA GEOMÉTRICA DE ALCANCE Y PERMISOS LÓGICOS (Start vs Business) */}
      <div className="relative overflow-hidden rounded-card bg-core-navy text-white px-4 py-3 sm:px-5 sm:py-3.5 shadow-sm border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <svg
          className="pointer-events-none absolute top-0 right-0 h-full w-64 opacity-90"
          viewBox="0 0 260 80"
          fill="none"
          aria-hidden="true"
        >
          <path d="M120 -10 L210 90 L265 90 L175 -10 Z" fill="#6545E8" fillOpacity="0.28" />
          <path d="M175 -10 L265 90 L295 90 L205 -10 Z" fill="#08C9E8" fillOpacity="0.25" />
          <path d="M220 -10 L310 90 L330 90 L240 -10 Z" fill="#A6E91C" fillOpacity="0.22" />
        </svg>

        <div className="relative z-10 flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
              edition === 'business'
                ? 'bg-core-violet text-white'
                : 'bg-core-cyan text-core-navy'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {edition === 'business' ? 'Suscripción CoreFlow Business' : 'Suscripción CoreFlow Starter'}
          </span>

          <p className="text-xs text-slate-200">
            {edition === 'business' ? (
              <>
                <strong className="text-core-lime">Capacidades de suscripción activas:</strong> Departamentos y equipos · Aprobación multinivel{' '}
                {approvalPermission.allowed
                  ? `autorizada para "${activeRole}"`
                  : `restringida para "${activeRole}"`}{' '}
                · Cuota contratada: {collabStatus.current}/{collabStatus.max} colaboradores.
              </>
            ) : (
              <>
                <strong className="text-core-cyan">Suscripción Starter activa:</strong> Operación directa ({collabStatus.current}/{collabStatus.max} colaboradores activos). Módulos esenciales habilitados con aislamiento RLS.
              </>
            )}
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate?.('configuracion')}
            className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white transition-colors"
          >
            Ver estructura y suscripción
          </button>
        </div>
      </div>

      {/* FILA 1: 4 TARJETAS KPI CON DISTINCIÓN EXPLÍCITA ENTRE ACUMULADO Y PERÍODO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <KpiCard
          title="Clientes registrados"
          scopeBadge="Acumulado actual"
          subtitle="Cuentas organizacionales en directorio"
          value={String(acum?.clientesTotal ?? 48)}
          delta={per?.deltas?.clientes ?? '+12%'}
          deltaLabel={`en ${per?.label?.toLowerCase() ?? 'últimos 7 días'}`}
          deltaDirection="up"
          accentColor="violet"
          icon={Users}
          progress={79}
          breakdown={`${acum?.clientesActivos ?? 38} cuentas activas · ${
            acum?.clientesIncorporacion ?? 10
          } en incorporación`}
          onClick={() => onNavigate('clientes')}
        />
        <KpiCard
          title="Oportunidades abiertas"
          scopeBadge="Inventario activo"
          subtitle="Embudo comercial conectado a operaciones"
          value={String(acum?.oportunidadesActivas ?? 16)}
          delta={per?.deltas?.oportunidades ?? '+8%'}
          deltaLabel={`en ${per?.label?.toLowerCase() ?? 'últimos 7 días'}`}
          deltaDirection="up"
          accentColor="cyan"
          icon={Briefcase}
          progress={68}
          breakdown={`${acum?.oportunidadesPropuesta ?? 9} en propuesta · ${
            acum?.oportunidadesValidacion ?? 7
          } en validación`}
          onClick={() => onNavigate('comercial')}
        />
        <KpiCard
          title="Tareas pendientes"
          scopeBadge="Saldo actual"
          subtitle={`Cerradas en ${per?.label?.toLowerCase() ?? '7 días'}: ${
            per?.tareasCerradas ?? 38
          }`}
          value={String(acum?.tareasPendientesActuales ?? 24)}
          delta={per?.deltas?.tareas ?? '-5% rezago'}
          deltaLabel={`vs. ${per?.label?.toLowerCase() ?? 'corte previo'}`}
          deltaDirection="up"
          accentColor="violet"
          icon={CheckSquare}
          progress={64}
          breakdown={`${acum?.tareasHoy ?? 8} vencen hoy · ${
            acum?.tareasSemana ?? 16
          } programadas en semana`}
          onClick={() => onNavigate('tareas')}
        />
        <KpiCard
          title="Documentos centralizados"
          scopeBadge="Repositorio total"
          subtitle="Control de versión y estado documental"
          value={String(acum?.documentosTotales ?? 132)}
          delta={per?.deltas?.documentos ?? '+18%'}
          deltaLabel={`en ${per?.label?.toLowerCase() ?? 'últimos 7 días'}`}
          deltaDirection="up"
          accentColor="lime"
          icon={FileText}
          progress={95}
          breakdown={`${acum?.documentosVigentes ?? 126} aprobados y vigentes · ${
            acum?.documentosRevision ?? 6
          } en revisión`}
          onClick={() => onNavigate('documentos')}
        />
      </div>

      {/* FILA 2: ACTIVIDAD RECIENTE INTERACTIVA + GRÁFICO DE EVOLUCIÓN DE PROCESOS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <SurfaceCard className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <GeometricAccentBar size="sm" />
                  <h3 className="text-base font-bold text-core-navy dark:text-white">
                    Actividad reciente
                  </h3>
                </div>
                <p className="text-xs text-core-muted dark:text-slate-400 mt-0.5">
                  Trazabilidad de eventos registrados en la plataforma
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-core-violet dark:text-indigo-300 bg-core-violet/10 px-2.5 py-1 rounded-full shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-core-lime" />
                Sincronizado
              </span>
            </div>

            <div className="flex items-center gap-1.5 mb-3.5 overflow-x-auto pb-1">
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

            <div className="space-y-2.5">
              {filteredActivity.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    const found = requests.find((r) => r.id === item.linkedRequestId)
                    if (found && onSelectRequest) {
                      onSelectRequest(found)
                    } else if (item.category === 'Clientes') {
                      onNavigate('clientes')
                    }
                  }}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-core-border/80 dark:border-[#282C5A] bg-core-cloud/45 dark:bg-[#12142E]/80 hover:bg-white dark:hover:bg-[#1B1F42] hover:border-core-violet/45 px-3.5 py-3 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${
                        item.iconType === 'check' ? 'bg-core-violet' : 'bg-core-blue'
                      }`}
                    >
                      {item.iconType === 'check' ? (
                        <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} />
                      ) : (
                        <FileCheck2 className="w-4 h-4" strokeWidth={2} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-core-navy dark:text-white truncate group-hover:text-core-violet dark:group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-core-muted dark:text-slate-400 truncate">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end shrink-0">
                    <span className="text-[11px] font-medium text-core-muted dark:text-slate-400 whitespace-nowrap">
                      {item.time}
                    </span>
                    <span className="text-[10px] font-semibold text-core-violet dark:text-indigo-300 opacity-0 group-hover:opacity-100 transition-opacity">
                      Inspeccionar →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-core-border dark:border-[#282C5A] flex items-center justify-between text-xs">
            <span className="text-core-muted dark:text-slate-400">
              Solicitudes resueltas ({per?.label?.toLowerCase() ?? '7 días'}):{' '}
              <strong className="text-core-navy dark:text-white tabular-nums">
                {per?.solicitudesResueltas ?? 34} de {per?.solicitudesGestionadas ?? 42} gestionadas
              </strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('solicitudes')}
              className="font-semibold text-core-violet dark:text-indigo-300 hover:underline inline-flex items-center gap-1"
            >
              Ver módulo
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </SurfaceCard>

        {/* Tarjeta Derecha: Gráfico Evolución de Procesos */}
        <SurfaceCard className="lg:col-span-7 p-5 sm:p-6" diagonalAccent>
          <ProcessEvolutionChart
            period={period}
            onPeriodChange={onPeriodChange}
            unifiedMetrics={unifiedMetrics}
            executiveMode={darkMode}
          />
        </SurfaceCard>
      </div>

      {/* FILA 3: SEGUIMIENTO OPERATIVO CENTRALIZADO */}
      <SurfaceCard className="p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <GeometricAccentBar size="sm" />
              <h3 className="text-base font-bold text-core-navy dark:text-white">
                Bandeja de seguimiento operativo ({acum?.solicitudesEnSeguimiento ?? 9} en seguimiento activo)
              </h3>
            </div>
            <p className="text-xs text-core-muted dark:text-slate-400 mt-0.5">
              Selecciona cualquier fila para abrir el panel de seguimiento, o pulsa la etiqueta de estado para avanzar su etapa
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'process', label: 'En proceso' },
              { id: 'pending', label: 'Pendiente' },
              { id: 'active', label: 'Activo' },
              { id: 'completed', label: 'Completado' },
              { id: 'error', label: 'Atención' },
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
              label: 'Solicitudes y Flujos Operativos',
              count: filteredRequests.length,
            },
            ...(edition === 'business'
              ? [
                  {
                    id: 'responsables',
                    label: 'Indicadores por Área y Responsable (Business)',
                    count: BUSINESS_AREAS_PERFORMANCE.length,
                  },
                  {
                    id: 'aprobaciones',
                    label: 'Aprobaciones Multinivel (Business)',
                    count: 2,
                  },
                ]
              : [
                  {
                    id: 'automatizaciones',
                    label: 'Automatizaciones Básicas (Start)',
                    count: 3,
                  },
                ]),
            {
              id: 'auditoria',
              label: 'Auditoría Protegida (Append-Only)',
              count: auditLogs.length,
            },
          ]}
        />

        {/* TAB 1: SOLICITUDES Y FLUJOS */}
        {operationalTab === 'solicitudes' && (
          <div className="mt-4">
            {filteredRequests.length === 0 ? (
              <div className="py-10 text-center rounded-xl border border-dashed border-core-border dark:border-[#282C5A]">
                <p className="text-sm font-semibold text-core-navy dark:text-white">
                  No se encontraron registros con los filtros seleccionados
                </p>
                <p className="text-xs text-core-muted mt-1">
                  Prueba restableciendo el filtro de estado, búsqueda o departamento.
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
              <>
                {/* VISTA ESCRITORIO / TABLET */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-core-border dark:border-[#282C5A] text-[11px] font-bold uppercase tracking-wider text-core-muted dark:text-slate-400">
                        <th className="py-3 px-3">Código</th>
                        <th className="py-3 px-3">Solicitud / Proceso</th>
                        <th className="py-3 px-3">Cuenta / Organización</th>
                        <th className="py-3 px-3">Rol Responsable</th>
                        {edition === 'business' && (
                          <th className="py-3 px-3 hidden xl:table-cell">Aprobación Multinivel</th>
                        )}
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
                          <td className="py-3.5 px-3 font-bold text-core-violet dark:text-indigo-300 whitespace-nowrap tabular-nums">
                            {req.id}
                          </td>
                          <td className="py-3.5 px-3">
                            <p className="font-semibold text-core-navy dark:text-white">
                              {req.asunto}
                            </p>
                            <p className="text-[11px] text-core-muted dark:text-slate-400 mt-0.5">
                              Plazo: {req.vencimiento} · Prioridad {req.prioridad}
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
                          {edition === 'business' && (
                            <td className="py-3.5 px-3 hidden xl:table-cell">
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-core-navy dark:text-slate-200 bg-core-cloud dark:bg-[#12142E] px-2.5 py-1 rounded-lg border border-core-border dark:border-[#282C5A]">
                                <ShieldCheck className="w-3.5 h-3.5 text-core-violet shrink-0" />
                                {req.nivelAprobacion}
                              </span>
                            </td>
                          )}
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

                {/* VISTA MÓVIL (Tarjetas adaptadas) */}
                <div className="md:hidden space-y-3">
                  {filteredRequests.map((req) => (
                    <div
                      key={req.id}
                      onClick={() => onSelectRequest?.(req)}
                      className="rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/40 dark:bg-[#12142E] p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-core-violet dark:text-indigo-300">
                          {req.id} · {req.departamento}
                        </span>
                        <StatusBadge status={req.estado} size="sm" />
                      </div>
                      <p className="text-sm font-bold text-core-navy dark:text-white">
                        {req.asunto}
                      </p>
                      <p className="text-xs text-core-muted dark:text-slate-300">
                        {req.cliente} · {req.responsable}
                      </p>
                      <div className="pt-2 border-t border-core-border/70 dark:border-[#282C5A] flex items-center justify-between text-xs">
                        <span className="text-core-muted">{req.vencimiento}</span>
                        <span className="font-semibold text-core-violet dark:text-indigo-300 inline-flex items-center gap-1">
                          Abrir seguimiento <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2 (BUSINESS): INDICADORES POR RESPONSABLE Y ÁREA */}
        {operationalTab === 'responsables' && edition === 'business' && (
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
                      {resp.cumplimiento}%
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

        {/* TAB 3 (BUSINESS): APROBACIONES MULTINIVEL CON VALIDACIÓN LÓGICA DE PERMISOS */}
        {operationalTab === 'aprobaciones' && edition === 'business' && (
          <div className="mt-4 space-y-3">
            {!approvalPermission.allowed && (
              <div className="p-3.5 rounded-xl bg-[#FEF6E0] dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-800 text-xs text-[#B45309] dark:text-amber-300 flex items-center gap-2.5">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>
                  <strong>Restricción de permiso granular activa:</strong> {approvalPermission.reason}{' '}
                  (Cambia el rol en el pie del menú lateral a "Administrador Organizacional" o "Coordinación de Operaciones" para habilitar la aprobación).
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
                    <span className="text-xs font-bold text-core-violet">{apr.id}</span>
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

        {/* TAB ALTERNATIVO (START): AUTOMATIZACIONES BÁSICAS */}
        {operationalTab === 'automatizaciones' && edition === 'start' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Asignación automática de solicitudes',
                desc: 'Notifica al rol responsable cuando se registra un requerimiento.',
                status: 'active',
              },
              {
                title: 'Alerta de tareas próximas a vencer',
                desc: 'Recordatorio automático 24 horas antes del plazo operativo.',
                status: 'active',
              },
              {
                title: 'Vinculación documental por cuenta',
                desc: 'Organiza los anexos cargados directamente en la ficha del cliente.',
                status: 'completed',
              },
            ].map((auto) => (
              <div
                key={auto.title}
                className="rounded-xl border border-core-border dark:border-[#282C5A] p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-4 h-4 text-core-violet" />
                    <StatusBadge status={auto.status} size="sm" />
                  </div>
                  <p className="text-sm font-bold text-core-navy dark:text-white">{auto.title}</p>
                  <p className="text-xs text-core-muted dark:text-slate-400 mt-1">{auto.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 4: AUDITORÍA PROTEGIDA (APPEND-ONLY POR ORGANIZACIÓN) */}
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
