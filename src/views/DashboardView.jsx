import React, { useState } from 'react'
import { Check, ChevronRight, Clock, Lock, Plus } from 'lucide-react'
import { Button, StatusBadge, ToastNotification } from '../components/ui/Primitives'
import { auditActionLabel } from '../components/ui/labels'
import { ProcessEvolutionChart } from '../components/charts/ProcessEvolutionChart'
import { CoreFlowIsotipo } from '../components/brand/CoreFlowLogo'
import { TriangleCluster, TriangleMark } from '../components/brand/BrandShapes'
import { INITIAL_ACTIVITY_FEED, BUSINESS_AREAS_PERFORMANCE, checkCapability } from '../data/demoStore'

const PANEL =
  'rounded-card border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#171936]'
const RULE = 'border-core-border dark:border-[#282C5A]'
const DIVIDE = 'divide-y divide-core-border/70 dark:divide-[#282C5A]'
const STRONG = 'text-core-navy dark:text-white'
const MUTED = 'text-core-muted dark:text-slate-400'
const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-core-violet'
const ROW_HOVER = 'hover:bg-core-cloud/60 dark:hover:bg-white/5 transition-colors'

const DEMO_APPROVALS = [
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
]

const isUrgent = (request) =>
  request.estado === 'error' ||
  request.estado === 'pending' ||
  request.prioridad === 'Alta' ||
  request.prioridad === 'Prioritaria'
const isDueToday = (task) => /hoy|vencid/i.test(task.dueLabel || '') || task.status === 'error'

function PanelHeader({ title, count, action, accent = 'violet' }) {
  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3.5 border-b ${RULE}`}>
      <h2 className={`flex items-center gap-2 text-sm font-bold ${STRONG}`}>
        <TriangleMark accent={accent} />
        <span>
          {title}
          {typeof count === 'number' && <span className={`ml-1.5 font-medium tabular-nums ${MUTED}`}>{count}</span>}
        </span>
      </h2>
      {action}
    </div>
  )
}

function LinkButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-0.5 text-xs font-semibold text-core-violet dark:text-indigo-300 hover:underline underline-offset-2 rounded ${FOCUS}`}
    >
      {children}
      <ChevronRight className="w-3.5 h-3.5" />
    </button>
  )
}

function Empty({ children }) {
  return <p className={`px-4 py-8 text-center text-xs ${MUTED}`}>{children}</p>
}

export function DashboardView({
  edition = 'business',
  contractedEdition = 'business',
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
  onSelectRequest,
  onApproveRequestLevel,
  onOpenNewRequestModal,
  onToggleTaskStatus,
  onCreateTask,
  isDemoData = true,
  approvalQueue = [],
}) {
  const [department, setDepartment] = useState('all')
  const [quickTaskTitle, setQuickTaskTitle] = useState('')
  const [toast, setToast] = useState(null)

  const isStarter = edition === 'start' || edition === 'starter'
  const deptFilter = checkCapability(edition, activeRole, 'departmentFilter')
  const approvalPermission = checkCapability(contractedEdition, activeRole, 'multilevelApproval')
  const today = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })

  const openRequests = requests.filter(
    (r) =>
      r.estado !== 'completed' &&
      (!deptFilter.allowed || department === 'all' || r.departamento === department) &&
      (!searchQuery ||
        [r.asunto, r.cliente, r.responsable, r.code, r.id].some((v) =>
          String(v || '').toLowerCase().includes(searchQuery.toLowerCase())
        ))
  )
  const sortedRequests = [...openRequests].sort((a, b) => Number(isUrgent(b)) - Number(isUrgent(a)))
  const openTasks = tasks.filter((t) => t.status !== 'completed')
  const sortedTasks = [...openTasks].sort((a, b) => Number(isDueToday(b)) - Number(isDueToday(a)))
  const approvals = isDemoData ? DEMO_APPROVALS : approvalQueue
  const activity = isDemoData
    ? INITIAL_ACTIVITY_FEED
    : auditLogs.map((log) => ({
        id: log.id,
        time: new Date(log.createdAt).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }),
        title: auditActionLabel(log.action),
        detail: log.summary,
      }))
  const performance = (
    isDemoData
      ? BUSINESS_AREAS_PERFORMANCE.map((a) => ({ owner: a.rol, area: a.departamento, assigned: a.asignadas, resolved: a.completadas }))
      : Object.values(
          requests.reduce((byOwner, r) => {
            const row = (byOwner[r.responsable] ||= { owner: r.responsable, area: r.departamento, assigned: 0, resolved: 0 })
            row.assigned += 1
            if (r.estado === 'completed') row.resolved += 1
            return byOwner
          }, {})
        )
  ).sort((a, b) => b.resolved / b.assigned - a.resolved / a.assigned)

  const stats = [
    {
      id: 'clientes',
      accent: 'violet',
      label: 'Clientes',
      value: clients.length,
      detail: `${clients.filter((c) => c.status === 'active').length} activos`,
    },
    {
      id: 'solicitudes',
      accent: 'blue',
      label: 'Solicitudes abiertas',
      value: requests.filter((r) => r.estado !== 'completed').length,
      detail: `${requests.filter((r) => r.estado !== 'completed' && isUrgent(r)).length} prioritarias`,
    },
    {
      id: 'tareas',
      accent: 'lime',
      label: 'Tareas pendientes',
      value: openTasks.length,
      detail: `${openTasks.filter(isDueToday).length} para hoy`,
    },
    isStarter
      ? { id: 'documentos', accent: 'cyan', label: 'Documentos', value: documents.length, detail: 'en el repositorio' }
      : {
          id: 'solicitudes',
          accent: 'cyan',
          label: 'Aprobaciones',
          value: approvals.length,
          detail: approvals.length === 1 ? 'esperando decisión' : 'esperando decisión',
        },
  ]

  const handleQuickCreateTask = async (e) => {
    e.preventDefault()
    if (!quickTaskTitle.trim()) return
    const res = await onCreateTask?.({ title: quickTaskTitle.trim(), priority: 'Media', dueLabel: 'Hoy · 17:00' })
    if (res && res.ok === false) {
      setToast({ title: 'No se pudo crear la tarea', description: res.error })
      return
    }
    setQuickTaskTitle('')
  }

  const handleToggleTask = async (task) => {
    const res = await onToggleTaskStatus?.(task.id)
    if (res?.ok === false) setToast({ title: 'No se pudo actualizar la tarea', description: res.error })
  }

  const handleApprove = async (approval) => {
    if (!approvalPermission.allowed) {
      setToast({ title: 'Sin permiso para aprobar', description: approvalPermission.reason })
      return
    }
    const res = await onApproveRequestLevel?.(approval.reqId)
    if (res?.ok === false) {
      setToast({ title: 'No se pudo aprobar', description: res.error })
      return
    }
    setToast({ title: 'Aprobación registrada', description: approval.titulo })
  }

  const requestsPanel = (
    <section className={PANEL}>
      <PanelHeader
        title="Solicitudes abiertas"
        count={openRequests.length}
        accent="violet"
        action={<LinkButton onClick={() => onNavigate('solicitudes')}>Ver bandeja</LinkButton>}
      />
      {sortedRequests.length === 0 ? (
        <Empty>{searchQuery ? 'Ninguna solicitud coincide con la búsqueda.' : 'No hay solicitudes abiertas.'}</Empty>
      ) : (
        <ul className={DIVIDE}>
          {sortedRequests.slice(0, 6).map((request) => (
            <li key={request.id}>
              <button
                type="button"
                onClick={() => onSelectRequest?.(request)}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 ${ROW_HOVER} ${FOCUS}`}
              >
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${STRONG}`}>{request.asunto}</span>
                  <span className={`block mt-0.5 text-xs ${MUTED}`}>
                    {request.cliente}
                    {!isStarter && ` · ${request.departamento}`}
                  </span>
                </span>
                <span className={`hidden md:inline-flex items-center gap-1 text-xs shrink-0 ${MUTED}`}>
                  <Clock className="w-3 h-3" />
                  {request.vencimiento}
                </span>
                <span className="shrink-0">
                  <StatusBadge status={request.estado} size="sm" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )

  const tasksPanel = (
    <section className={PANEL}>
      <PanelHeader
        title="Tareas"
        count={openTasks.length}
        accent="lime"
        action={<LinkButton onClick={() => onNavigate('tareas')}>Ver todas</LinkButton>}
      />
      <form onSubmit={handleQuickCreateTask} className={`flex items-center gap-2 px-4 py-3 border-b ${RULE}`}>
        <label htmlFor="quick-task" className="sr-only">
          Nueva tarea para hoy
        </label>
        <input
          id="quick-task"
          type="text"
          value={quickTaskTitle}
          onChange={(e) => setQuickTaskTitle(e.target.value)}
          placeholder="Agregar una tarea para hoy"
          className={`h-9 flex-1 min-w-0 rounded-lg border ${RULE} bg-core-cloud/50 dark:bg-[#101228] px-3 text-xs ${STRONG} placeholder:text-core-muted focus:border-core-violet focus:outline-none focus:ring-2 focus:ring-core-violet/20`}
        />
        <Button type="submit" variant="secondary" size="sm" icon={Plus} iconPosition="left">
          Agregar
        </Button>
      </form>
      {sortedTasks.length === 0 ? (
        <Empty>Sin tareas pendientes.</Empty>
      ) : (
        <ul>
          {sortedTasks.slice(0, 6).map((task) => (
            <li key={task.id} className={`flex items-center gap-3 px-4 py-2.5 ${ROW_HOVER}`}>
              <button
                type="button"
                onClick={() => handleToggleTask(task)}
                aria-label="Completar tarea"
                className={`group w-5 h-5 rounded-md border border-slate-400 dark:border-slate-500 hover:border-core-violet flex items-center justify-center shrink-0 ${FOCUS}`}
              >
                <Check className="w-3.5 h-3.5 text-core-violet opacity-0 group-hover:opacity-70" strokeWidth={2.6} />
              </button>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${STRONG}`}>{task.title}</span>
                <span className={`block text-xs ${MUTED}`}>{task.owner || 'Sin asignar'}</span>
              </span>
              <span
                className={`text-xs tabular-nums shrink-0 ${
                  isDueToday(task) ? 'font-semibold text-[#B45309] dark:text-amber-300' : MUTED
                }`}
              >
                {task.dueLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )

  const activityPanel = (
    <section className={PANEL}>
      <PanelHeader title="Actividad reciente" accent="cyan" />
      {activity.length === 0 ? (
        <Empty>Todavía no hay movimientos registrados.</Empty>
      ) : (
        <ol className={DIVIDE}>
          {activity.slice(0, 5).map((item, index) => (
            <li key={item.id || index} className="px-4 py-3 flex items-baseline gap-3">
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-medium ${STRONG}`}>{item.title}</span>
                {item.detail && <span className={`block text-xs ${MUTED}`}>{item.detail}</span>}
              </span>
              <time className={`text-xs tabular-nums shrink-0 ${MUTED}`}>{item.time}</time>
            </li>
          ))}
        </ol>
      )}
    </section>
  )

  return (
    <div className="space-y-5">
      {toast && <ToastNotification title={toast.title} description={toast.description} onClose={() => setToast(null)} />}

      <header className="relative overflow-hidden rounded-card bg-core-navy px-5 py-5 sm:px-6 sm:py-6 text-white">
        <div className="cf-auth-pattern" aria-hidden="true" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <CoreFlowIsotipo className="w-10 h-10 shrink-0" />
            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight">Inicio</h1>
              <p className="mt-0.5 text-sm text-slate-300">
                {activeOrganization?.displayName} · <span className="first-letter:uppercase inline-block">{today}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {!isStarter && deptFilter.allowed && (
              <>
                <label htmlFor="dashboard-department" className="sr-only">
                  Filtrar por área
                </label>
                <select
                  id="dashboard-department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className={`h-10 rounded-xl border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white [&>option]:text-core-navy ${FOCUS}`}
                >
                  <option value="all">Todas las áreas</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </>
            )}
            <Button variant="primary" icon={Plus} iconPosition="left" onClick={onOpenNewRequestModal}>
              Nueva solicitud
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <button
            key={stat.label}
            type="button"
            onClick={() => onNavigate(stat.id)}
            className={`group relative overflow-hidden text-left rounded-card border ${RULE} bg-white dark:bg-[#171936] px-4 py-4 shadow-card hover:shadow-card-hover dark:shadow-none dark:hover:shadow-none dark:hover:border-core-violet/50 transition-shadow ${FOCUS}`}
          >
            <TriangleCluster accent={stat.accent} />
            <span className={`relative block text-xs font-semibold ${MUTED}`}>{stat.label}</span>
            <span className={`relative block mt-2 text-3xl font-extrabold tracking-tight tabular-nums ${STRONG}`}>
              {stat.value}
            </span>
            <span className={`relative mt-1 flex items-center justify-between gap-2 text-xs ${MUTED}`}>
              {stat.detail}
              <ChevronRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-5">
        {requestsPanel}
        {tasksPanel}
      </div>

      {isStarter ? (
        activityPanel
      ) : (
        <>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            <section className={PANEL}>
              <PanelHeader title="Aprobaciones pendientes" count={approvals.length} accent="blue" />
              {approvals.length === 0 ? (
                <Empty>No hay aprobaciones esperando decisión.</Empty>
              ) : (
                <ul className={DIVIDE}>
                  {approvals.map((approval) => (
                    <li key={approval.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-semibold ${STRONG}`}>{approval.titulo}</span>
                        <span className={`block text-xs ${MUTED}`}>
                          {approval.etapaActual} · {approval.ruta}
                        </span>
                      </span>
                      <Button
                        variant={approvalPermission.allowed ? 'primary' : 'outline'}
                        size="sm"
                        icon={approvalPermission.allowed ? null : Lock}
                        iconPosition="left"
                        onClick={() => handleApprove(approval)}
                        className="shrink-0 self-start sm:self-center"
                      >
                        Aprobar
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className={PANEL}>
              <PanelHeader
                title="Resultados por responsable"
                accent="cyan"
                action={<LinkButton onClick={() => onNavigate('reportes')}>Ver reporte</LinkButton>}
              />
              {performance.length === 0 ? (
                <Empty>Los resultados aparecen cuando haya solicitudes asignadas.</Empty>
              ) : (
                <ul className={DIVIDE}>
                  {performance.slice(0, 4).map((row) => (
                    <li key={row.owner} className="px-4 py-3 flex items-center gap-3">
                      <span className="min-w-0 flex-1">
                        <span className={`block text-sm font-medium ${STRONG}`}>{row.owner}</span>
                        <span className={`block text-xs ${MUTED}`}>{row.area}</span>
                      </span>
                      <span className={`text-xs tabular-nums ${MUTED}`}>
                        {row.resolved} de {row.assigned}
                      </span>
                      <span className={`w-12 text-right text-sm font-bold tabular-nums ${STRONG}`}>
                        {row.assigned ? Math.round((row.resolved / row.assigned) * 100) : 0}%
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-5">
            <section className={`${PANEL} p-4 sm:p-5`}>
              <ProcessEvolutionChart
                period={period}
                onPeriodChange={onPeriodChange}
                unifiedMetrics={unifiedMetrics}
                executiveMode={darkMode}
              />
            </section>
            {activityPanel}
          </div>
        </>
      )}
    </div>
  )
}
