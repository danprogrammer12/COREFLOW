import React, { useState } from 'react'
import { ArrowRight, Check, ChevronRight, Clock, FileText, Plus, X } from 'lucide-react'
import { Button, StatusBadge, SearchInput, ToastNotification } from '../components/ui/Primitives'
import { formatStorageMb, roleLabel } from '../components/ui/labels'
import { BUSINESS_AREAS_PERFORMANCE } from '../data/demoStore'
import { TriangleMark } from '../components/brand/BrandShapes'

const PANEL =
  'rounded-card border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#171936]'
const RULE = 'border-core-border dark:border-[#282C5A]'
const STRONG = 'text-core-navy dark:text-white'
const MUTED = 'text-core-muted dark:text-slate-400'
const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-core-violet'
const FIELD = `h-10 w-full rounded-xl border ${RULE} bg-core-cloud/50 dark:bg-[#101228] px-3 text-xs ${STRONG}`
const COLUMN_HEAD = `text-left text-[11px] font-semibold ${MUTED} py-2.5 px-3 sm:px-4`

const includes = (value, query) => String(value || '').toLowerCase().includes(query.toLowerCase())
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`
const formatCop = (value) => `$${Number(value || 0).toLocaleString('es-CO')}`
const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

function Segmented({ label, options, value, onChange }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-1">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={`h-10 sm:h-8 px-3 rounded-lg text-xs font-semibold tabular-nums transition-colors ${FOCUS} ${
            value === option.id
              ? 'bg-core-navy text-white dark:bg-white dark:text-core-navy'
              : `${MUTED} hover:bg-core-cloud dark:hover:bg-white/5`
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function EmptyState({ title, hint }) {
  return (
    <div className="px-5 py-12 text-center">
      <p className={`text-sm font-semibold ${STRONG}`}>{title}</p>
      {hint && <p className={`mt-1 text-xs ${MUTED}`}>{hint}</p>}
    </div>
  )
}

function Toolbar({ children }) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b ${RULE}`}>
      {children}
    </div>
  )
}

function ClientsModule({ clients, requests, onOpenNewRequest }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [selectedId, setSelectedId] = useState(null)

  const active = clients.filter((c) => c.status === 'active')
  const visible = clients.filter(
    (c) =>
      (status === 'all' || (status === 'active' ? c.status === 'active' : c.status !== 'active')) &&
      (!query ||
        includes(c.displayName || c.legalName, query) ||
        includes(c.sector, query) ||
        includes(c.code || c.id, query) ||
        includes(c.taxId, query))
  )
  const selected = clients.find((c) => c.id === selectedId)
  // Las solicitudes guardan la referencia del cliente o, en registros antiguos, solo su nombre.
  const requestsOf = (client) =>
    requests.filter(
      (r) =>
        [r.clientId, r.clienteId].some((ref) => ref && (ref === client.id || ref === client.code)) ||
        r.cliente === (client.displayName || client.legalName)
    )

  return (
    <div className={`grid grid-cols-1 gap-5 ${selected ? 'xl:grid-cols-[minmax(0,1fr)_340px]' : ''}`}>
      <section className={PANEL}>
        <Toolbar>
          <SearchInput
            placeholder="Buscar cliente o NIT"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
            className="w-full sm:w-80"
          />
          <Segmented
            label="Filtrar clientes por estado"
            value={status}
            onChange={setStatus}
            options={[
              { id: 'all', label: `Todos ${clients.length}` },
              { id: 'active', label: `Activos ${active.length}` },
              { id: 'other', label: `En incorporación ${clients.length - active.length}` },
            ]}
          />
        </Toolbar>

        {visible.length === 0 ? (
          <EmptyState
            title={clients.length ? 'Ningún cliente coincide' : 'Aún no hay clientes'}
            hint={clients.length ? 'Prueba con otro nombre o estado.' : 'Registra tu primera cuenta para empezar.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${RULE}`}>
                  <th className={COLUMN_HEAD}>Cliente</th>
                  <th className={`${COLUMN_HEAD} hidden md:table-cell`}>Sector</th>
                  <th className={`${COLUMN_HEAD} hidden lg:table-cell`}>Responsable</th>
                  <th className={`${COLUMN_HEAD} hidden sm:table-cell text-right`}>Solicitudes</th>
                  <th className={COLUMN_HEAD}>Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-core-border/70 dark:divide-[#282C5A]">
                {visible.map((client) => (
                  <tr
                    key={client.id}
                    className={
                      client.id === selectedId
                        ? 'bg-core-violet/5 dark:bg-core-violet/15'
                        : 'hover:bg-core-cloud/60 dark:hover:bg-white/5'
                    }
                  >
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setSelectedId(client.id === selectedId ? null : client.id)}
                        className={`text-left font-semibold ${STRONG} hover:text-core-violet dark:hover:text-indigo-300 rounded ${FOCUS}`}
                      >
                        {client.displayName || client.legalName}
                      </button>
                      {client.taxId && <p className={`text-xs ${MUTED}`}>NIT {client.taxId}</p>}
                    </td>
                    <td className={`py-3 px-4 hidden md:table-cell ${MUTED}`}>{client.sector || 'Sin sector'}</td>
                    <td className={`py-3 px-4 hidden lg:table-cell ${MUTED}`}>{client.ownerName || 'Sin responsable'}</td>
                    <td className={`py-3 px-4 hidden sm:table-cell text-right tabular-nums ${STRONG}`}>
                      {requestsOf(client).length}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={client.status || 'active'} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <aside className={`${PANEL} p-5 self-start space-y-4`} aria-label="Ficha del cliente">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className={`text-base font-bold ${STRONG}`}>{selected.displayName || selected.legalName}</h2>
              <p className={`text-xs ${MUTED}`}>{selected.code || selected.id}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              aria-label="Cerrar ficha"
              className={`p-1 rounded-md ${MUTED} hover:bg-core-cloud dark:hover:bg-white/5 ${FOCUS}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <dl className="text-xs space-y-2.5">
            {[
              ['Responsable', selected.ownerName],
              ['Sector', selected.sector],
              ['NIT', selected.taxId],
              ['Contacto', selected.contactName],
              ['Correo', selected.contactEmail],
            ]
              .filter(([, value]) => value)
              .map(([term, value]) => (
                <div key={term} className="flex justify-between gap-4">
                  <dt className={MUTED}>{term}</dt>
                  <dd className={`font-semibold text-right break-words min-w-0 ${STRONG}`}>{value}</dd>
                </div>
              ))}
          </dl>

          <div className={`pt-3 border-t ${RULE}`}>
            <h3 className={`text-xs font-semibold mb-2 ${STRONG}`}>Solicitudes vinculadas</h3>
            {requestsOf(selected).length === 0 ? (
              <p className={`text-xs ${MUTED}`}>Este cliente aún no tiene solicitudes.</p>
            ) : (
              <ul className="space-y-2">
                {requestsOf(selected).map((request) => (
                  <li key={request.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className={`min-w-0 ${STRONG}`}>{request.asunto}</span>
                    <StatusBadge status={request.estado} size="sm" />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <Button variant="primary" size="sm" className="w-full" onClick={() => onOpenNewRequest?.()}>
            Crear solicitud
          </Button>
        </aside>
      )}
    </div>
  )
}

/** La etapa comercial decide la columna; el estado operativo no. */
const stageOf = (opportunity) => {
  const stage = String(opportunity.stage || '').toLowerCase()
  if (stage === 'ganada' || stage === 'perdida' || opportunity.status === 'completed') return 'cierre'
  if (stage.includes('validacion') || stage.includes('negociacion')) return 'validacion'
  return 'propuesta'
}

const compactCop = (value) =>
  `$${new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 }).format(Number(value || 0))}`
const weightedValue = (opportunity) =>
  Number(opportunity.estimatedValue || 0) * (Number(opportunity.probability ?? 0) / 100)

const PIPELINE_STAGES = [
  {
    id: 'propuesta',
    title: 'Propuesta',
    hint: 'Levantamiento y cotización',
    accent: 'violet',
    lane: 'bg-core-violet/[0.04] dark:bg-core-violet/10',
    rule: 'bg-core-violet',
  },
  {
    id: 'validacion',
    title: 'Validación',
    hint: 'Revisión con cliente y operación',
    accent: 'cyan',
    lane: 'bg-core-cyan/[0.06] dark:bg-core-cyan/10',
    rule: 'bg-core-cyan',
  },
  {
    id: 'cierre',
    title: 'Cierre',
    hint: 'Ganadas o descartadas',
    accent: 'lime',
    lane: 'bg-core-lime/[0.10] dark:bg-core-lime/10',
    rule: 'bg-core-lime',
  },
]

function PipelineModule({ opportunities, clients }) {
  const clientName = (opportunity) => {
    const client = clients.find((c) => c.id === opportunity.clientId || c.code === opportunity.clientId)
    return client?.displayName || client?.legalName || null
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {PIPELINE_STAGES.map((stage) => {
        const items = opportunities
          .filter((o) => stageOf(o) === stage.id)
          .sort((a, b) => Number(b.estimatedValue || 0) - Number(a.estimatedValue || 0))
        const total = items.reduce((sum, o) => sum + Number(o.estimatedValue || 0), 0)
        const weighted = items.reduce((sum, o) => sum + weightedValue(o), 0)

        return (
          <section key={stage.id} className={`min-w-0 rounded-card ${stage.lane} p-2.5`} aria-label={`Etapa ${stage.title}`}>
            <header className="px-1.5 pt-1 pb-3">
              <div className="flex items-center justify-between gap-2">
                <h2 className={`flex items-center gap-2 text-sm font-bold ${STRONG}`}>
                  <TriangleMark accent={stage.accent} />
                  {stage.title}
                  <span className={`text-xs font-semibold tabular-nums px-1.5 py-0.5 rounded-md bg-white dark:bg-white/10 ${MUTED}`}>
                    {items.length}
                  </span>
                </h2>
                <span className={`text-base font-extrabold tabular-nums ${STRONG}`}>{compactCop(total)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[11px]">
                <span className={MUTED}>{stage.hint}</span>
                {stage.id !== 'cierre' && items.length > 0 && (
                  <span className={`tabular-nums ${MUTED}`}>Ponderado {compactCop(weighted)}</span>
                )}
              </div>
              <div className={`mt-2.5 h-0.5 rounded-full ${stage.rule}`} aria-hidden="true" />
            </header>

            {items.length === 0 ? (
              <p className={`mx-1.5 mb-1.5 rounded-xl border border-dashed ${RULE} px-3 py-6 text-center text-xs ${MUTED}`}>
                Sin oportunidades en esta etapa
              </p>
            ) : (
              <ul className="space-y-2">
                {items.map((opportunity) => {
                  const client = clientName(opportunity)
                  const lost = String(opportunity.stage || '').toLowerCase() === 'perdida'
                  const hasProbability = typeof opportunity.probability === 'number'
                  return (
                    <li
                      key={opportunity.id}
                      className={`rounded-xl border ${RULE} bg-white dark:bg-[#171936] p-3.5 shadow-card dark:shadow-none ${lost ? 'opacity-70' : ''}`}
                    >
                      {client && <p className={`text-[11px] font-semibold ${MUTED}`}>{client}</p>}
                      <p className={`mt-0.5 text-sm font-semibold leading-snug ${STRONG}`}>{opportunity.title}</p>

                      <div className="mt-3 flex items-end justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`text-base font-extrabold tabular-nums ${STRONG}`}>
                            {formatCop(opportunity.estimatedValue)}
                          </p>
                          {hasProbability && stage.id !== 'cierre' && (
                            <p className={`text-[11px] tabular-nums ${MUTED}`}>
                              {opportunity.probability}% · ponderado {compactCop(weightedValue(opportunity))}
                            </p>
                          )}
                          {stage.id === 'cierre' && (
                            <p className={`text-[11px] font-semibold ${lost ? MUTED : 'text-[#4D7C0F] dark:text-core-lime'}`}>
                              {lost ? 'Descartada' : 'Ganada'}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className={`mt-3 pt-2.5 border-t ${RULE} flex items-center justify-between gap-2 text-[11px] ${MUTED}`}>
                        <span className="min-w-0">{opportunity.ownerName || 'Sin responsable'}</span>
                        {opportunity.expectedCloseLabel && (
                          <span className="inline-flex items-center gap-1 shrink-0">
                            <Clock className="w-3 h-3" />
                            {opportunity.expectedCloseLabel}
                          </span>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}

function RequestsModule({ requests, isStarter, onSelectRequest }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('open')

  const open = requests.filter((r) => r.estado !== 'completed')
  const visible = requests.filter(
    (r) =>
      (status === 'all' || (status === 'open' ? r.estado !== 'completed' : r.estado === status)) &&
      (!query ||
        includes(r.asunto, query) ||
        includes(r.code || r.id, query) ||
        includes(r.cliente, query) ||
        includes(r.responsable, query))
  )

  return (
    <section className={PANEL}>
      <Toolbar>
        <Segmented
          label="Filtrar solicitudes por estado"
          value={status}
          onChange={setStatus}
          options={[
            { id: 'open', label: `Abiertas ${open.length}` },
            { id: 'pending', label: `Pendientes ${requests.filter((r) => r.estado === 'pending').length}` },
            { id: 'completed', label: `Completadas ${requests.length - open.length}` },
            { id: 'all', label: `Todas ${requests.length}` },
          ]}
        />
        <SearchInput
          placeholder="Buscar solicitud o cliente"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          className="w-full sm:w-72"
        />
      </Toolbar>

      {visible.length === 0 ? (
        <EmptyState
          title={requests.length ? 'Nada en esta bandeja' : 'Aún no hay solicitudes'}
          hint={requests.length ? 'Cambia de filtro para ver otras solicitudes.' : 'Crea la primera para iniciar el seguimiento.'}
        />
      ) : (
        <ul className="divide-y divide-core-border/70 dark:divide-[#282C5A]">
          {visible.map((request) => (
            <li key={request.id}>
              <button
                type="button"
                onClick={() => onSelectRequest?.(request)}
                className={`w-full text-left px-4 py-3.5 flex items-center gap-4 hover:bg-core-cloud/60 dark:hover:bg-white/5 transition-colors ${FOCUS}`}
              >
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${STRONG}`}>{request.asunto}</span>
                  <span className={`block mt-0.5 text-xs ${MUTED}`}>
                    {request.cliente} · {request.responsable}
                    {!isStarter && ` · ${request.departamento}`}
                  </span>
                </span>
                <span className={`hidden md:inline-flex items-center gap-1 text-xs shrink-0 ${MUTED}`}>
                  <Clock className="w-3 h-3" />
                  {request.vencimiento}
                </span>
                {(request.prioridad === 'Alta' || request.prioridad === 'Prioritaria') && (
                  <span className="hidden sm:inline text-[11px] font-semibold text-[#B45309] dark:text-amber-300 shrink-0">
                    {request.prioridad}
                  </span>
                )}
                <span className="shrink-0">
                  <StatusBadge status={request.estado} size="sm" />
                </span>
                <ChevronRight className={`w-4 h-4 shrink-0 ${MUTED}`} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

const TRIGGER_LABELS = {
  'request.created': 'se crea una solicitud',
  'request.status_changed': 'una solicitud cambia de estado',
  'task.created': 'se crea una tarea',
  'task.overdue': 'una tarea vence',
  'document.created': 'se registra un documento',
  'document.status_pending': 'un documento queda pendiente de firma',
  'opportunity.stage_changed_to_won': 'se gana una oportunidad',
}

function AutomationsModule({ automationRules, isStarter }) {
  if (automationRules.length === 0) {
    return (
      <section className={PANEL}>
        <EmptyState title="Aún no hay reglas" hint="Crea una regla para avisar al equipo cuando algo ocurra." />
      </section>
    )
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {automationRules.map((rule) => (
          <li key={rule.id} className={`${PANEL} p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-5`}>
            <TriangleMark accent={rule.scopeType === 'cross_department_workflow' ? 'cyan' : 'violet'} className="hidden md:block w-3 h-2.5" />
            <div className="min-w-0 md:w-56 shrink-0">
              <h2 className={`text-sm font-semibold ${STRONG}`}>{rule.name}</h2>
              <p className={`text-xs ${MUTED}`}>
                {rule.scopeType === 'cross_department_workflow' ? 'Entre áreas' : 'Aviso al equipo'}
              </p>
            </div>
            <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 text-xs">
              <span className={MUTED}>
                Cuando <strong className={STRONG}>{TRIGGER_LABELS[rule.triggerEvent] || 'ocurre el evento configurado'}</strong>
              </span>
              <ArrowRight className={`hidden sm:block w-3.5 h-3.5 shrink-0 ${MUTED}`} />
              <span className={`min-w-0 ${STRONG}`}>{rule.description || rule.meta}</span>
            </div>
            <div className="shrink-0">
              <StatusBadge status={rule.status || 'active'} size="sm" />
            </div>
          </li>
        ))}
      </ul>
      {isStarter && (
        <p className={`text-xs ${MUTED}`}>Las reglas entre áreas están disponibles en CoreFlow Business.</p>
      )}
    </div>
  )
}

function TasksModule({ tasks, onToggle }) {
  const [query, setQuery] = useState('')
  const visible = tasks.filter(
    (t) => !query || includes(t.title, query) || includes(t.code || t.id, query) || includes(t.owner, query)
  )
  const isDueNow = (t) => /hoy|vencid/i.test(t.dueLabel || '') || t.status === 'error'
  const groups = [
    { id: 'now', title: 'Para hoy', items: visible.filter((t) => t.status !== 'completed' && isDueNow(t)) },
    { id: 'next', title: 'Próximas', items: visible.filter((t) => t.status !== 'completed' && !isDueNow(t)) },
    { id: 'done', title: 'Completadas', items: visible.filter((t) => t.status === 'completed') },
  ].filter((group) => group.items.length > 0)

  return (
    <section className={PANEL}>
      <Toolbar>
        <SearchInput
          placeholder="Buscar tarea o responsable"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onClear={() => setQuery('')}
          className="w-full sm:w-80"
        />
      </Toolbar>

      {groups.length === 0 ? (
        <EmptyState
          title={tasks.length ? 'Ninguna tarea coincide' : 'Aún no hay tareas'}
          hint={tasks.length ? 'Prueba con otra búsqueda.' : 'Crea una tarea y asígnala al equipo.'}
        />
      ) : (
        groups.map((group) => (
          <div key={group.id}>
            <h2 className={`flex items-center gap-2 px-4 pt-4 pb-1.5 text-xs font-semibold ${STRONG}`}>
              <TriangleMark accent={group.id === 'now' ? 'lime' : group.id === 'next' ? 'blue' : 'violet'} className="w-2 h-2" />
              <span>
                {group.title} <span className={`font-medium tabular-nums ${MUTED}`}>{group.items.length}</span>
              </span>
            </h2>
            <ul>
              {group.items.map((task) => {
                const done = task.status === 'completed'
                return (
                  <li key={task.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-core-cloud/60 dark:hover:bg-white/5">
                    <button
                      type="button"
                      onClick={() => onToggle(task)}
                      aria-label={done ? 'Marcar como pendiente' : 'Completar tarea'}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${FOCUS} ${
                        done
                          ? 'bg-core-violet border-core-violet text-white'
                          : 'border-slate-400 dark:border-slate-500 hover:border-core-violet'
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5" strokeWidth={2.6} />}
                    </button>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-sm ${done ? `line-through ${MUTED}` : `font-medium ${STRONG}`}`}>
                        {task.title}
                      </span>
                      <span className={`block text-xs ${MUTED}`}>{task.owner || 'Sin asignar'}</span>
                    </span>
                    {!done && (task.priority === 'Alta' || task.priority === 'Prioritaria') && (
                      <span className="hidden sm:inline text-[11px] font-semibold text-[#B45309] dark:text-amber-300 shrink-0">
                        {task.priority}
                      </span>
                    )}
                    <span className={`text-xs tabular-nums shrink-0 ${MUTED}`}>{task.dueLabel}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))
      )}
      <div className="h-2" aria-hidden="true" />
    </section>
  )
}

const formatBytes = (bytes) => {
  if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`
  return `${Math.ceil(bytes / 1024)} KB`
}

function DocumentsModule({ documents, entitlementsResolved, onSelect }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')

  const categories = [...new Set(documents.map((d) => d.category || 'Operativo'))].sort()
  const visible = documents.filter(
    (d) =>
      (category === 'all' || (d.category || 'Operativo') === category) &&
      (!query || includes(d.title, query) || includes(d.code || d.id, query) || includes(d.owner, query))
  )
  const usedBytes = entitlementsResolved?.usage?.storageBytes
  const railItem = (id, label, count) => (
    <li key={id}>
      <button
        type="button"
        aria-pressed={category === id}
        onClick={() => setCategory(id)}
        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors ${FOCUS} ${
          category === id
            ? 'bg-core-violet/10 font-semibold text-core-violet dark:text-indigo-300'
            : `${MUTED} hover:bg-core-cloud dark:hover:bg-white/5`
        }`}
      >
        <span className="min-w-0 text-left">{label}</span>
        <span className="tabular-nums">{count}</span>
      </button>
    </li>
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_minmax(0,1fr)] gap-5">
      <aside className="space-y-4" aria-label="Categorías de documentos">
        <ul className="space-y-0.5">
          {railItem('all', 'Todos', documents.length)}
          {categories.map((name) =>
            railItem(name, name, documents.filter((d) => (d.category || 'Operativo') === name).length)
          )}
        </ul>
        <div className={`pt-3 border-t px-2.5 ${RULE}`}>
          <p className={`text-xs ${MUTED}`}>Almacenamiento</p>
          <p className={`mt-0.5 text-sm font-semibold ${STRONG}`}>
            {formatStorageMb(entitlementsResolved?.realLimits?.maxStorageMb)}
          </p>
          {typeof usedBytes === 'number' && <p className={`text-xs ${MUTED}`}>{formatBytes(usedBytes)} en uso</p>}
        </div>
      </aside>

      <section className={PANEL}>
        <Toolbar>
          <SearchInput
            placeholder="Buscar documento o responsable"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onClear={() => setQuery('')}
            className="w-full sm:w-80"
          />
        </Toolbar>

        {visible.length === 0 ? (
          <EmptyState
            title={documents.length ? 'Ningún documento coincide' : 'Aún no hay documentos'}
            hint={documents.length ? 'Prueba con otra categoría.' : 'Registra el primero con su archivo.'}
          />
        ) : (
          <ul className="divide-y divide-core-border/70 dark:divide-[#282C5A]">
            {visible.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  onClick={() => onSelect(doc)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-core-cloud/60 dark:hover:bg-white/5 transition-colors ${FOCUS}`}
                >
                  <FileText className={`w-4 h-4 shrink-0 ${MUTED}`} />
                  <span className="min-w-0 flex-1">
                    <span className={`block text-sm font-semibold ${STRONG}`}>{doc.title}</span>
                    <span className={`block text-xs ${MUTED}`}>
                      {doc.category || 'Operativo'} · {doc.owner || 'Sin responsable'}
                    </span>
                  </span>
                  <span className={`text-xs tabular-nums shrink-0 ${MUTED}`}>{doc.version || 'v1.0'}</span>
                  <span className="hidden sm:inline shrink-0">
                    <StatusBadge status={doc.status || 'active'} size="sm" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function ReportsModule({ isDemoData, requests, tasks, clients, opportunities, documents, per }) {
  const rows = isDemoData
    ? BUSINESS_AREAS_PERFORMANCE.map((area) => ({
        id: area.rol,
        area: area.departamento,
        owner: area.rol,
        assigned: area.asignadas,
        resolved: area.completadas,
      }))
    : Object.values(
        requests.reduce((byOwner, request) => {
          const row = (byOwner[request.responsable] ||= {
            id: request.responsable,
            area: request.departamento,
            owner: request.responsable,
            assigned: 0,
            resolved: 0,
          })
          row.assigned += 1
          if (request.estado === 'completed') row.resolved += 1
          return byOwner
        }, {})
      )
  const ranked = [...rows].sort((a, b) => b.resolved / b.assigned - a.resolved / a.assigned)
  const closedTasks = tasks.filter((t) => t.status === 'completed').length

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5">
      <section className={PANEL}>
        <h2 className={`flex items-center gap-2 px-4 py-3.5 text-sm font-bold border-b ${RULE} ${STRONG}`}>
          <TriangleMark accent="blue" />
          Resultados por responsable
        </h2>
        {ranked.length === 0 ? (
          <EmptyState title="Sin datos para comparar" hint="Los resultados aparecen cuando haya solicitudes asignadas." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${RULE}`}>
                  <th className={COLUMN_HEAD}>Responsable</th>
                  <th className={`${COLUMN_HEAD} hidden sm:table-cell`}>Área</th>
                  <th className={`${COLUMN_HEAD} text-right`}>
                    <span className="sm:hidden">Asig.</span>
                    <span className="hidden sm:inline">Asignadas</span>
                  </th>
                  <th className={`${COLUMN_HEAD} text-right`}>
                    <span className="sm:hidden">Resu.</span>
                    <span className="hidden sm:inline">Resueltas</span>
                  </th>
                  <th className={`${COLUMN_HEAD} text-right`}>
                    <span className="sm:hidden">%</span>
                    <span className="hidden sm:inline">Resuelto</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-core-border/70 dark:divide-[#282C5A]">
                {ranked.map((row) => (
                  <tr key={row.id}>
                    <td className={`py-3 px-3 sm:px-4 font-medium ${STRONG}`}>{row.owner}</td>
                    <td className={`py-3 px-3 sm:px-4 hidden sm:table-cell ${MUTED}`}>{row.area}</td>
                    <td className={`py-3 px-3 sm:px-4 text-right tabular-nums ${MUTED}`}>{row.assigned}</td>
                    <td className={`py-3 px-3 sm:px-4 text-right tabular-nums ${MUTED}`}>{row.resolved}</td>
                    <td className={`py-3 px-3 sm:px-4 text-right tabular-nums font-bold ${STRONG}`}>
                      {row.assigned ? Math.round((row.resolved / row.assigned) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <aside className={`${PANEL} p-4 self-start`} aria-label="Resumen del período">
        <h2 className={`flex items-center gap-2 text-sm font-bold ${STRONG}`}>
          <TriangleMark accent="cyan" />
          {per?.label || 'Período actual'}
        </h2>
        <dl className="mt-3 text-xs space-y-2.5">
          {[
            ['Cumplimiento de plazos', per?.cumplimientoSla ?? 'N/D'],
            ['Solicitudes resueltas', per?.solicitudesResueltas ?? 0],
            ['Solicitudes gestionadas', per?.solicitudesGestionadas ?? 0],
            ['Tareas cerradas', closedTasks],
            ['Clientes', clients.length],
            ['Oportunidades', opportunities.length],
            ['Documentos', documents.length],
          ].map(([term, value]) => (
            <div key={term} className="flex justify-between gap-4">
              <dt className={MUTED}>{term}</dt>
              <dd className={`font-semibold tabular-nums ${STRONG}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </div>
  )
}

function SettingsModule({ members, departments, branches, entitlementsResolved, collabStatus, isStarter }) {
  const limits = entitlementsResolved?.realLimits || {}
  const usage = entitlementsResolved?.usage
  const quota = (used, max) =>
    typeof max === 'number' ? (typeof used === 'number' ? `${used} de ${max}` : `Hasta ${max}`) : 'Sin límite'

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-5">
      <section className={PANEL}>
        <h2 className={`flex items-center gap-2 px-4 py-3.5 text-sm font-bold border-b ${RULE} ${STRONG}`}>
          <TriangleMark accent="lime" />
          <span>
            Equipo <span className={`font-medium tabular-nums ${MUTED}`}>{members.length}</span>
          </span>
        </h2>
        {members.length === 0 ? (
          <EmptyState title="Aún no hay personas" />
        ) : (
          <ul className="divide-y divide-core-border/70 dark:divide-[#282C5A]">
            {members.map((member) => (
              <li key={member.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-9 h-9 rounded-full bg-core-violet/15 text-core-violet dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                  {initials(member.displayName) || '–'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm font-semibold ${STRONG}`}>{member.displayName}</span>
                  <span className={`block text-xs ${MUTED}`}>{member.jobTitle}</span>
                </span>
                <span className={`hidden sm:inline text-xs shrink-0 ${MUTED}`}>{roleLabel(member.roleCode)}</span>
                <span className="shrink-0">
                  <StatusBadge status={member.status || 'active'} size="sm" />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="space-y-5 self-start">
        <section className={`${PANEL} p-4`}>
          <h2 className={`flex items-center gap-2 text-sm font-bold ${STRONG}`}>
            <TriangleMark accent="violet" />
            {entitlementsResolved?.contractedPlanName || 'Plan contratado'}
          </h2>
          <dl className="mt-3 text-xs space-y-2.5">
            {[
              ['Colaboradores', `${collabStatus.current} de ${collabStatus.max}`],
              ['Sedes', quota(usage?.branches ?? branches.length, limits.maxBranches)],
              ['Administradores', quota(usage?.admins, limits.maxAdmins)],
              ['Automatizaciones activas', quota(usage?.activeAutomations, limits.maxActiveAutomations)],
              ['Almacenamiento', formatStorageMb(limits.maxStorageMb)],
            ].map(([term, value]) => (
              <div key={term} className="flex justify-between gap-4">
                <dt className={MUTED}>{term}</dt>
                <dd className={`font-semibold text-right tabular-nums ${STRONG}`}>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={`${PANEL} p-4`}>
          <h2 className={`flex items-center gap-2 text-sm font-bold ${STRONG}`}>
            <TriangleMark accent="cyan" />
            {isStarter ? 'Estructura' : 'Departamentos'}
          </h2>
          <ul className="mt-3 space-y-2.5">
            {departments.map((department) => (
              <li key={department.id} className="text-xs">
                <span className={`block font-semibold ${STRONG}`}>{department.name}</span>
                <span className={MUTED}>
                  {branches.find((b) => b.id === department.branchId)?.name || 'Sede principal'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${PANEL} p-4`}>
          <h2 className={`flex items-center gap-2 text-sm font-bold ${STRONG}`}>
            <TriangleMark accent="blue" />
            Privacidad
          </h2>
          <p className={`mt-2 text-xs leading-relaxed ${MUTED}`}>
            Tu organización es responsable de los datos personales que registra en CoreFlow y de obtener las
            autorizaciones de sus titulares. Webcore los trata como encargado, según el acuerdo de tratamiento.
          </p>
          <ul className="mt-3 space-y-1.5 text-xs">
            {[
              ['#/legal/tratamiento-datos', 'Política de tratamiento de datos'],
              ['#/legal/terminos', 'Términos y acuerdo de tratamiento'],
              ['#/legal/derechos', 'Solicitudes de titulares'],
            ].map(([href, label]) => (
              <li key={href}>
                <a href={href} className="font-semibold text-core-violet dark:text-indigo-300 hover:underline underline-offset-2">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export function ModulesPreviewView({
  moduleId,
  edition,
  activeOrganization,
  entitlementsResolved,
  unifiedMetrics,
  clients = [],
  opportunities = [],
  requests = [],
  tasks = [],
  documents = [],
  automationRules = [],
  departments = [],
  branches = [],
  members = [],
  onSelectRequest,
  onOpenNewRequest,
  onCreateClient,
  onCreateOpportunity,
  onCreateTask,
  onToggleTaskStatus,
  onCreateDocument,
  onCreateAutomationRule,
  onCreateDepartment,
  isDemoData = true,
  onOpenDocument,
}) {
  const [createPanelOpen, setCreatePanelOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [formTitle, setFormTitle] = useState('')
  const [formSecondary, setFormSecondary] = useState('')
  const [formScopeType, setFormScopeType] = useState('basic_notification')
  const [formPriority, setFormPriority] = useState('Alta')
  const [formFile, setFormFile] = useState(null)

  const isStarter = edition === 'start' || edition === 'starter'
  const per = unifiedMetrics?.periodo
  const collabStatus = entitlementsResolved?.collaboratorsStatus || {
    current: activeOrganization?.activeCollaboratorsCount ?? members.length,
    max: isStarter ? 15 : 30,
  }

  const handleOpenModuleAction = () => {
    if (moduleId === 'solicitudes' || moduleId === 'reportes') {
      onOpenNewRequest?.()
      return
    }
    setCreatePanelOpen((v) => !v)
  }

  const handleModuleFormSubmit = async (e) => {
    e.preventDefault()
    if (!formTitle.trim()) return

    let res = { ok: true }
    if (moduleId === 'clientes') {
      res = await onCreateClient?.({
        displayName: formTitle.trim(),
        sector: formSecondary.trim() || 'Servicios Empresariales',
        status: 'active',
      })
    } else if (moduleId === 'comercial') {
      res = await onCreateOpportunity?.({
        title: formTitle.trim(),
        clientId: clients[0]?.id || null,
        stage: 'propuesta',
        estimatedValue: Number(formSecondary) || 0,
      })
    } else if (moduleId === 'tareas') {
      res = await onCreateTask?.({
        title: formTitle.trim(),
        priority: formPriority,
        dueLabel: formSecondary.trim() || 'Mañana · 17:00',
      })
    } else if (moduleId === 'documentos') {
      res = await onCreateDocument?.({
        title: formTitle.trim(),
        category: formSecondary.trim() || 'Operativo',
        version: 'v1.0',
        file: formFile,
      })
    } else if (moduleId === 'procesos') {
      res = await onCreateAutomationRule?.({
        name: formTitle.trim(),
        description: formSecondary.trim() || 'Avisar al equipo responsable.',
        scopeType: formScopeType,
      })
    } else if (moduleId === 'configuracion') {
      res = await onCreateDepartment?.({
        code: (formSecondary || formTitle.slice(0, 3)).toUpperCase(),
        name: formTitle.trim(),
        branchId: branches[0]?.id,
      })
    }

    if (res && res.ok === false) {
      setToast({ title: 'No se pudo guardar', description: res.error })
      return
    }

    setFormTitle('')
    setFormSecondary('')
    setFormFile(null)
    setCreatePanelOpen(false)
    setToast({
      title: 'Registro guardado',
      description: `Quedó guardado en ${activeOrganization?.displayName} y se anotó en la auditoría.`,
    })
  }

  const handleToggleTask = async (task) => {
    const res = await onToggleTaskStatus?.(task.id)
    if (res?.ok === false) {
      setToast({ title: 'No se pudo actualizar la tarea', description: res.error })
    }
  }

  const handleSelectDocument = async (doc) => {
    if (!onOpenDocument) {
      setToast({
        title: doc.title,
        description: `${doc.category || 'Operativo'} · versión ${doc.version || 'v1.0'}`,
      })
      return
    }
    // La pestaña se abre antes de esperar: si no, el navegador la bloquea.
    const tab = window.open('about:blank', '_blank')
    const res = await onOpenDocument(doc.id)
    if (res?.ok === false) {
      tab?.close()
      setToast({ title: 'No se pudo abrir el documento', description: res.error })
      return
    }
    if (tab) {
      tab.opener = null
      tab.location.href = res.data.url
    }
  }

  const activeClients = clients.filter((c) => c.status === 'active').length
  const openOpportunities = opportunities.filter((o) => stageOf(o) !== 'cierre')
  const openRequests = requests.filter((r) => r.estado !== 'completed').length
  const openTasks = tasks.filter((t) => t.status !== 'completed').length
  const activeRules = automationRules.filter((r) => r.status === 'active').length
  const maxRules = entitlementsResolved?.realLimits?.maxActiveAutomations

  const moduleConfigs = {
    clientes: {
      accent: 'violet',
      title: isStarter ? 'Clientes' : 'Cuentas y clientes',
      summary: `${plural(clients.length, 'cuenta', 'cuentas')}, ${plural(activeClients, 'activa', 'activas')}`,
      cta: 'Registrar cuenta',
      formLabel1: 'Razón social o nombre',
      formLabel2: 'Sector (ej. Logística, Salud)',
    },
    comercial: {
      accent: 'cyan',
      title: isStarter ? 'Oportunidades' : 'Pipeline comercial',
      summary: `${compactCop(openOpportunities.reduce((sum, o) => sum + Number(o.estimatedValue || 0), 0))} en ${plural(
        openOpportunities.length,
        'oportunidad abierta',
        'oportunidades abiertas'
      )} · pronóstico ${compactCop(openOpportunities.reduce((sum, o) => sum + weightedValue(o), 0))}`,
      cta: 'Nueva oportunidad',
      formLabel1: 'Título de la oportunidad',
      formLabel2: 'Valor estimado en COP (ej. 45000000)',
    },
    solicitudes: {
      accent: 'blue',
      title: isStarter ? 'Solicitudes directas' : 'Solicitudes y aprobaciones',
      summary: `${plural(openRequests, 'solicitud abierta', 'solicitudes abiertas')} de ${requests.length}`,
      cta: 'Crear solicitud',
    },
    procesos: {
      accent: 'violet',
      title: isStarter ? 'Procesos básicos' : 'Automatizaciones',
      summary:
        typeof maxRules === 'number'
          ? `${activeRules} de ${maxRules} reglas activas`
          : plural(activeRules, 'regla activa', 'reglas activas'),
      cta: 'Nueva regla',
      formLabel1: 'Nombre de la regla',
      formLabel2: 'Qué debe ocurrir (ej. Avisar a Operaciones)',
    },
    tareas: {
      accent: 'lime',
      title: isStarter ? 'Tareas del equipo' : 'Tareas',
      summary: `${plural(openTasks, 'tarea pendiente', 'tareas pendientes')} de ${tasks.length}`,
      cta: 'Nueva tarea',
      formLabel1: 'Título de la tarea',
      formLabel2: 'Plazo (ej. Hoy · 17:00)',
    },
    documentos: {
      accent: 'cyan',
      title: isStarter ? 'Documentos' : 'Control documental',
      summary: plural(documents.length, 'documento', 'documentos'),
      cta: 'Registrar documento',
      formLabel1: 'Título del documento',
      formLabel2: 'Categoría (Operativo, Comercial, Normativo)',
    },
    reportes: {
      accent: 'blue',
      title: 'Reportes comparativos',
      summary: per?.label || 'Período actual',
      cta: 'Nueva solicitud',
    },
    configuracion: {
      accent: 'lime',
      title: isStarter ? 'Equipo y suscripción' : 'Departamentos y roles',
      summary: `${collabStatus.current} de ${collabStatus.max} colaboradores`,
      cta: isStarter ? null : 'Crear departamento',
      formLabel1: 'Nombre del departamento',
      formLabel2: 'Código corto (ej. FIN, LOG)',
    },
  }

  const meta = moduleConfigs[moduleId] || moduleConfigs.clientes

  return (
    <div className="space-y-5">
      {toast && (
        <ToastNotification title={toast.title} description={toast.description} onClose={() => setToast(null)} />
      )}

      <header className="relative overflow-hidden rounded-card bg-core-navy px-5 py-4 sm:px-6 sm:py-5 text-white">
        <div className="cf-auth-pattern" aria-hidden="true" />
        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight">
              <TriangleMark accent={meta.accent} className="w-3.5 h-3" />
              {meta.title}
            </h1>
            <p className="mt-0.5 text-sm tabular-nums text-slate-300">{meta.summary}</p>
          </div>
          {meta.cta && (
            <Button variant="primary" icon={Plus} iconPosition="left" onClick={handleOpenModuleAction} className="shrink-0">
              {meta.cta}
            </Button>
          )}
        </div>
      </header>

      {createPanelOpen && meta.formLabel1 && (
        <form
          onSubmit={handleModuleFormSubmit}
          className={`${PANEL} p-4 grid grid-cols-1 md:grid-cols-12 gap-3 items-end shadow-card dark:shadow-none`}
        >
          <div className="md:col-span-4">
            <label htmlFor="module-form-title" className={`block text-xs font-semibold mb-1 ${STRONG}`}>
              {meta.formLabel1}
            </label>
            <input
              id="module-form-title"
              type="text"
              required
              autoFocus
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className={FIELD}
            />
          </div>

          <div className={moduleId === 'clientes' || moduleId === 'comercial' || moduleId === 'configuracion' ? 'md:col-span-5' : 'md:col-span-3'}>
            <label htmlFor="module-form-secondary" className={`block text-xs font-semibold mb-1 ${STRONG}`}>
              {meta.formLabel2}
            </label>
            <input
              id="module-form-secondary"
              type="text"
              value={formSecondary}
              onChange={(e) => setFormSecondary(e.target.value)}
              className={FIELD}
            />
          </div>

          {moduleId === 'procesos' && (
            <div className="md:col-span-2">
              <label htmlFor="module-form-scope" className={`block text-xs font-semibold mb-1 ${STRONG}`}>
                Alcance
              </label>
              <select
                id="module-form-scope"
                value={formScopeType}
                onChange={(e) => setFormScopeType(e.target.value)}
                className={FIELD}
              >
                <option value="basic_notification">Aviso al equipo</option>
                {!isStarter && <option value="cross_department_workflow">Entre áreas</option>}
              </select>
            </div>
          )}

          {moduleId === 'tareas' && (
            <div className="md:col-span-2">
              <label htmlFor="module-form-priority" className={`block text-xs font-semibold mb-1 ${STRONG}`}>
                Prioridad
              </label>
              <select
                id="module-form-priority"
                value={formPriority}
                onChange={(e) => setFormPriority(e.target.value)}
                className={FIELD}
              >
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>
          )}

          {moduleId === 'documentos' && (
            <div className="md:col-span-2">
              <label htmlFor="module-form-file" className={`block text-xs font-semibold mb-1 ${STRONG}`}>
                Archivo
              </label>
              <input
                id="module-form-file"
                type="file"
                required={!isDemoData}
                onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                className={`block w-full text-xs ${MUTED}`}
              />
            </div>
          )}

          <div className="md:col-span-3 flex items-center gap-2">
            <Button type="submit" variant="primary" size="md" className="flex-1">
              Guardar
            </Button>
            <Button type="button" variant="outline" size="md" onClick={() => setCreatePanelOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {moduleId === 'clientes' && (
        <ClientsModule clients={clients} requests={requests} onOpenNewRequest={onOpenNewRequest} />
      )}
      {moduleId === 'comercial' && <PipelineModule opportunities={opportunities} clients={clients} />}
      {moduleId === 'solicitudes' && (
        <RequestsModule requests={requests} isStarter={isStarter} onSelectRequest={onSelectRequest} />
      )}
      {moduleId === 'procesos' && <AutomationsModule automationRules={automationRules} isStarter={isStarter} />}
      {moduleId === 'tareas' && <TasksModule tasks={tasks} onToggle={handleToggleTask} />}
      {moduleId === 'documentos' && (
        <DocumentsModule
          documents={documents}
          entitlementsResolved={entitlementsResolved}
          onSelect={handleSelectDocument}
        />
      )}
      {moduleId === 'reportes' && (
        <ReportsModule
          isDemoData={isDemoData}
          requests={requests}
          tasks={tasks}
          clients={clients}
          opportunities={opportunities}
          documents={documents}
          per={per}
        />
      )}
      {moduleId === 'configuracion' && (
        <SettingsModule
          members={members}
          departments={departments}
          branches={branches}
          entitlementsResolved={entitlementsResolved}
          collabStatus={collabStatus}
          isStarter={isStarter}
        />
      )}
    </div>
  )
}
