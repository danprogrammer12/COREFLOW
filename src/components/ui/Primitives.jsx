import React from 'react'
import {
  CheckCircle2,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  FileText,
  UserCheck,
  Building2,
  Check,
  AlertTriangle,
} from 'lucide-react'
import { CoreFlowIsotipo } from '../brand/CoreFlowLogo'

/**
 * Símbolo institucional de CoreFlow unificado (usa el recurso vectorial oficial CoreFlowIsotipo
 * sin reconstruir geometrías paralelas ni alterar proporciones)
 */
export function GeometricAccentBar({ size = 'sm', mono = null, className = '' }) {
  const dims = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-7 h-7' : 'w-6 h-6'
  return (
    <CoreFlowIsotipo
      mono={mono}
      className={`shrink-0 select-none ${dims} ${className}`}
    />
  )
}

/**
 * Botón reutilizable del Sistema de Diseño CoreFlow (alturas normalizadas para alineación exacta)
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon = null,
  iconPosition = 'right',
  className = '',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-core-violet/35 disabled:opacity-50 disabled:pointer-events-none select-none whitespace-nowrap'

  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-lg',
    md: 'h-10 px-4 text-xs sm:text-sm rounded-xl',
    lg: 'h-11 px-5 text-sm rounded-xl',
  }

  const variants = {
    primary:
      'bg-core-violet hover:bg-core-violet-hover text-white shadow-xs hover:shadow-md active:scale-[0.99]',
    secondary:
      'bg-white dark:bg-[#1C2042] border border-core-violet/35 dark:border-core-violet/50 text-core-violet dark:text-indigo-300 hover:bg-core-violet-soft/60 dark:hover:bg-core-violet/20',
    royal:
      'bg-core-blue hover:bg-core-blue-hover text-white shadow-xs',
    outline:
      'bg-white dark:bg-[#1C2042] border border-core-border dark:border-[#2E3468] text-core-navy dark:text-slate-100 hover:border-core-violet/40 hover:bg-slate-50/90 dark:hover:bg-white/5',
    text:
      'bg-transparent text-core-violet dark:text-indigo-400 hover:text-core-violet-hover px-2 py-1 rounded-lg hover:bg-core-violet-soft/50',
  }

  return (
    <button
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 shrink-0" strokeWidth={1.85} />}
      <span>{children}</span>
      {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 shrink-0" strokeWidth={1.85} />}
    </button>
  )
}

/**
 * Estados visuales diferenciados de CoreFlow:
 * - active (Activo)
 * - process (En proceso)
 * - pending (Pendiente)
 * - completed (Completado)
 * - overdue (Vencido)
 * - critical / error (Crítico / Requiere atención)
 */
export function StatusBadge({ status = 'active', label, size = 'md' }) {
  const configs = {
    active: {
      defaultLabel: 'Activo',
      bg: 'bg-[#EAFBE7] dark:bg-emerald-950/60',
      text: 'text-[#15803D] dark:text-emerald-300',
      border: 'border-emerald-200/90 dark:border-emerald-800/60',
      dotColor: 'text-[#16A34A] dark:text-emerald-400',
    },
    process: {
      defaultLabel: 'En proceso',
      bg: 'bg-[#E5F7FC] dark:bg-cyan-950/60',
      text: 'text-[#0369A1] dark:text-cyan-300',
      border: 'border-cyan-200/90 dark:border-cyan-800/60',
      dotColor: 'text-[#08C9E8]',
    },
    pending: {
      defaultLabel: 'Pendiente',
      bg: 'bg-[#FEF6E0] dark:bg-amber-950/60',
      text: 'text-[#B45309] dark:text-amber-300',
      border: 'border-amber-200/90 dark:border-amber-800/60',
      dotColor: 'text-[#F59E0B]',
    },
    completed: {
      defaultLabel: 'Completado',
      bg: 'bg-[#EFEBFD] dark:bg-indigo-950/70',
      text: 'text-[#6545E8] dark:text-indigo-300',
      border: 'border-indigo-200/90 dark:border-indigo-800/60',
      dotColor: 'text-[#6545E8] dark:text-indigo-400',
    },
    overdue: {
      defaultLabel: 'Vencido',
      bg: 'bg-[#FFF1F2] dark:bg-rose-950/70',
      text: 'text-[#BE123C] dark:text-rose-300',
      border: 'border-rose-300/90 dark:border-rose-800/70',
      dotColor: 'text-[#E11D48]',
    },
    critical: {
      defaultLabel: 'Crítico',
      bg: 'bg-[#FEE2E2] dark:bg-rose-950/80',
      text: 'text-[#DC2626] dark:text-rose-300',
      border: 'border-rose-300 dark:border-rose-700',
      dotColor: 'text-[#EF4444]',
    },
    error: {
      defaultLabel: 'Crítico',
      bg: 'bg-[#FEE2E2] dark:bg-rose-950/60',
      text: 'text-[#DC2626] dark:text-rose-300',
      border: 'border-rose-200/90 dark:border-rose-800/60',
      dotColor: 'text-[#EF4444]',
    },
  }

  const cfg = configs[status] || configs.active
  const sizeClasses =
    size === 'sm' ? 'px-2.5 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border whitespace-nowrap ${cfg.bg} ${cfg.text} ${cfg.border} ${sizeClasses}`}
    >
      <span
        className={`inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border-[1.75px] border-current ${cfg.dotColor}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
      </span>
      <span>{label || cfg.defaultLabel}</span>
    </span>
  )
}

/**
 * Superficie / Tarjeta institucional de CoreFlow
 */
export function SurfaceCard({
  children,
  className = '',
  diagonalAccent = false,
  interactive = false,
  onClick,
}) {
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-card bg-white dark:bg-[#171936] border border-core-border dark:border-[#282C5A] shadow-card transition-all duration-150 ${
        interactive
          ? 'cursor-pointer hover:border-core-violet/45 hover:shadow-card-hover group'
          : ''
      } ${className}`}
    >
      {diagonalAccent && (
        <div
          className="pointer-events-none absolute top-0 right-0 w-28 h-28 select-none"
          aria-hidden="true"
        >
          <svg viewBox="0 0 120 120" fill="none" className="w-full h-full">
            <path d="M40 -10 L130 80 L130 42 L78 -10 Z" fill="#6545E8" fillOpacity="0.06" />
            <path d="M76 -10 L130 44 L130 18 L102 -10 Z" fill="#08C9E8" fillOpacity="0.09" />
          </svg>
        </div>
      )}
      {children}
    </div>
  )
}

/**
 * 1. TARJETA DE INDICADOR (KpiCard)
 * Rediseñada con jerarquía numérica limpia, franja geométrica institucional lateral/superior
 * y contexto comparativo, eliminando iconos encerrados sistemáticamente en cajas de color.
 */
export function KpiCard({
  title,
  value,
  delta,
  deltaLabel = 'vs. corte anterior',
  deltaDirection = 'up',
  subtitle,
  scopeBadge = 'Acumulado actual',
  breakdown,
  progress = null,
  accentColor = 'violet',
  active = false,
  onClick,
}) {
  const isUp = deltaDirection === 'up'
  const isTrend = /^[+-]\d/.test(String(delta ?? ''))

  const accentStyles = {
    violet: {
      topBar: 'bg-core-violet',
      bar: 'from-core-violet to-core-blue',
      badgeText: 'text-core-violet dark:text-indigo-300',
    },
    cyan: {
      topBar: 'bg-core-cyan',
      bar: 'from-core-blue to-core-cyan',
      badgeText: 'text-[#0284C7] dark:text-core-cyan',
    },
    lime: {
      topBar: 'bg-core-lime',
      bar: 'from-core-violet to-core-lime',
      badgeText: 'text-[#4D7C0F] dark:text-core-lime',
    },
    blue: {
      topBar: 'bg-core-blue',
      bar: 'from-core-blue to-core-violet',
      badgeText: 'text-core-blue dark:text-blue-300',
    },
  }

  const acc = accentStyles[accentColor] || accentStyles.violet

  return (
    <SurfaceCard
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={`p-5 flex flex-col justify-between min-h-[154px] ${
        active ? 'ring-2 ring-core-violet border-core-violet' : ''
      }`}
    >
      {/* Franja superior geométrica institucional de 3px */}
      <div className={`absolute top-0 left-0 right-0 h-1 ${acc.topBar}`} aria-hidden="true" />

      {/* Encabezado: Etiqueta de alcance + Título */}
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[10px] font-extrabold uppercase tracking-wider ${acc.badgeText}`}>
            {scopeBadge}
          </span>
          {delta && !isTrend && (
            <span className="text-[11px] font-semibold text-core-muted dark:text-slate-400 tabular-nums shrink-0">
              {delta}
            </span>
          )}
          {delta && isTrend && (
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-bold tabular-nums ${
                isUp
                  ? 'text-[#15803D] dark:text-emerald-400'
                  : 'text-[#B45309] dark:text-amber-400'
              }`}
            >
              {isUp ? (
                <TrendingUp className="w-3 h-3" strokeWidth={2.2} />
              ) : (
                <TrendingDown className="w-3 h-3" strokeWidth={2.2} />
              )}
              {delta}
            </span>
          )}
        </div>
        <h4 className="text-sm font-bold text-core-navy dark:text-slate-100 tracking-tight">
          {title}
        </h4>
      </div>

      {/* Valor numérico principal y subtítulo */}
      <div className="my-2.5 flex items-baseline justify-between gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-core-navy dark:text-white tabular-nums">
          {value}
        </span>
        {subtitle && (
          <span className="text-[11px] text-core-muted dark:text-slate-400 text-right truncate max-w-[58%]">
            {subtitle}
          </span>
        )}
      </div>

      {/* Contexto comparativo inferior */}
      <div className="pt-2.5 border-t border-core-border/70 dark:border-[#282C5A] space-y-1.5">
        {typeof progress === 'number' && (
          <div className="w-full h-1 rounded-full bg-core-cloud dark:bg-[#101228] overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${acc.bar}`}
              style={{ width: `${Math.min(100, Math.max(10, progress))}%` }}
            />
          </div>
        )}
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="text-core-muted dark:text-slate-300 truncate">
            {breakdown || deltaLabel}
          </span>
          {onClick && (
            <span className="inline-flex items-center gap-0.5 font-semibold text-core-violet dark:text-indigo-300 group-hover:translate-x-0.5 transition-transform shrink-0">
              Ver detalle
              <ArrowUpRight className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
    </SurfaceCard>
  )
}

/**
 * 2. COMPONENTE CRONOLÓGICO DE ACTIVIDAD RECIENTE (ActivityTimelineList)
 * Estructura cronológica real con línea de tiempo vertical, nodo de estado y metadatos de trazabilidad.
 */
export function ActivityTimelineList({ items = [], onSelectItem }) {
  return (
    <div className="relative pl-5 space-y-4 before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-core-border dark:before:bg-[#282C5A]">
      {items.map((item, index) => {
        const dotColor =
          item.category === 'Solicitudes'
            ? 'border-core-violet bg-white dark:bg-[#171936]'
            : item.category === 'Documentos'
            ? 'border-core-cyan bg-white dark:bg-[#171936]'
            : 'border-core-lime bg-white dark:bg-[#171936]'

        return (
          <div
            key={item.id || index}
            onClick={() => onSelectItem?.(item)}
            className="relative group cursor-pointer rounded-xl border border-transparent hover:border-core-border dark:hover:border-[#282C5A] hover:bg-core-cloud/50 dark:hover:bg-[#12142E] p-2.5 -ml-2 transition-all"
          >
            <span
              className={`absolute -left-[17px] top-4 w-3 h-3 rounded-full border-2 ${dotColor} group-hover:scale-110 transition-transform`}
              aria-hidden="true"
            />
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-core-violet dark:text-indigo-300">
                {item.category || 'Operación'}
              </span>
              <time className="text-[11px] font-mono text-core-muted dark:text-slate-400 shrink-0">
                {item.time}
              </time>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-core-navy dark:text-white mt-0.5 group-hover:text-core-violet dark:group-hover:text-indigo-300">
              {item.title}
            </p>
            {item.detail && (
              <p className="text-[11px] text-core-muted dark:text-slate-400 mt-0.5">
                {item.detail}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * 3. TARJETA DE CLIENTE ORGANIZACIONAL (ClientAccountCard)
 * Muestra razón social, NIT, sector, contacto principal, estado de relación y volumen de operaciones.
 */
export function ClientAccountCard({ client, requestsCount = 0, onSelect }) {
  const statusMap =
    client.status === 'onboarding' || client.status === 'process'
      ? { status: 'process', label: 'En incorporación' }
      : client.status === 'pending'
      ? { status: 'pending', label: 'Revisión documental' }
      : { status: 'active', label: 'Relación vigente' }

  return (
    <SurfaceCard
      interactive={Boolean(onSelect)}
      onClick={() => onSelect?.(client)}
      className="p-5 flex flex-col justify-between gap-4"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[11px] font-mono font-bold text-core-violet dark:text-indigo-300">
              {client.code || client.id}{client.taxId ? ` · NIT ${client.taxId}` : ''}
            </span>
            <h4 className="text-base font-bold text-core-navy dark:text-white mt-0.5 leading-snug">
              {client.displayName || client.legalName || client.name}
            </h4>
          </div>
          <StatusBadge status={statusMap.status} label={statusMap.label} size="sm" />
        </div>

        <p className="text-xs text-core-muted dark:text-slate-400">
          Sector: <strong className="text-core-navy dark:text-slate-200">{client.sector || 'Servicios'}</strong>
        </p>
      </div>

      <div className="pt-3 border-t border-core-border/70 dark:border-[#282C5A] grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[10px] uppercase tracking-wider text-core-muted block">
            Contacto / Responsable
          </span>
          <span className="font-semibold text-core-navy dark:text-slate-200 truncate block mt-0.5">
            {client.contactName || client.ownerName || 'Coordinación General'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase tracking-wider text-core-muted block">
            Operaciones vinculadas
          </span>
          <span className="font-bold text-core-violet dark:text-indigo-300 tabular-nums mt-0.5 block">
            {requestsCount} solicitudes
          </span>
        </div>
      </div>
    </SurfaceCard>
  )
}

/**
 * 4. TARJETA DE DOCUMENTO CONTROLADO (DocumentRecordCard)
 * Identificación de versión, clasificación documental, aprobación y ruta de almacenamiento aislado.
 */
export function DocumentRecordCard({ doc, onSelect }) {
  return (
    <div
      onClick={() => onSelect?.(doc)}
      className="rounded-xl border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#171936] hover:border-core-violet/45 p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-2xs"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="px-2 py-0.5 rounded bg-core-navy text-white text-[10px] font-mono font-bold">
              {doc.version || 'v1.0'}
            </span>
            <span className="px-2 py-0.5 rounded bg-core-cloud dark:bg-[#101228] text-core-muted dark:text-slate-300 text-[10px] font-semibold border border-core-border dark:border-[#282C5A]">
              {doc.category || 'Operativo'}
            </span>
            <span className="text-[11px] font-mono text-core-violet dark:text-indigo-300 font-semibold">
              {doc.code || doc.id}
            </span>
          </div>
          <h4 className="text-sm font-bold text-core-navy dark:text-white leading-snug pt-0.5">
            {doc.title || doc.name}
          </h4>
        </div>
        <StatusBadge
          status={doc.status || 'active'}
          label={doc.status === 'pending' ? 'En firma' : doc.status === 'completed' ? 'Aprobado' : 'Vigente'}
          size="sm"
        />
      </div>

      <div className="pt-2.5 border-t border-core-border/70 dark:border-[#282C5A] flex items-center justify-between gap-2 text-[11px] text-core-muted dark:text-slate-400">
        <span className="truncate">Responsable</span>
        <span className="font-semibold text-core-navy dark:text-slate-200 shrink-0">
          {doc.owner || 'Control Documental'}
        </span>
      </div>
    </div>
  )
}

/**
 * 5. TARJETA DE TAREA OPERATIVA (TaskProgressCard)
 * Muestra responsable, vencimiento, prioridad, barra de progreso y control de completitud directo.
 */
export function TaskProgressCard({ task, onToggleStatus }) {
  const isCompleted = task.status === 'completed'
  const isOverdue =
    !isCompleted &&
    (String(task.dueLabel || '').toLowerCase().includes('vencid') || task.status === 'error')

  return (
    <div
      className={`rounded-xl border p-4 transition-all flex flex-col justify-between gap-3 ${
        isCompleted
          ? 'border-core-border/70 dark:border-[#282C5A] bg-core-cloud/40 dark:bg-[#12142E]/60'
          : isOverdue
          ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/30 dark:bg-rose-950/20'
          : 'border-core-border dark:border-[#282C5A] bg-white dark:bg-[#171936] hover:border-core-violet/45'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onToggleStatus?.(task.id || task.code)}
            aria-label={isCompleted ? 'Marcar como pendiente' : 'Completar tarea'}
            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-colors ${
              isCompleted
                ? 'bg-core-violet border-core-violet text-white'
                : 'border-slate-300 dark:border-slate-600 hover:border-core-violet'
            }`}
          >
            {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={2.6} />}
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono font-bold text-core-violet dark:text-indigo-300">
                {task.code || task.id}
              </span>
              <span
                className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                  task.priority === 'Alta' || task.priority === 'Prioritaria'
                    ? 'bg-amber-500/15 text-[#B45309] dark:text-amber-300'
                    : 'bg-core-cloud dark:bg-[#101228] text-core-muted'
                }`}
              >
                Prioridad {task.priority || 'Media'}
              </span>
            </div>
            <h4
              className={`text-sm font-bold mt-1 leading-snug ${
                isCompleted
                  ? 'line-through text-core-muted dark:text-slate-400'
                  : 'text-core-navy dark:text-white'
              }`}
            >
              {task.title || task.name}
            </h4>
          </div>
        </div>

        <StatusBadge
          status={isCompleted ? 'completed' : isOverdue ? 'overdue' : task.status || 'pending'}
          size="sm"
        />
      </div>

      <div className="space-y-2 pt-2 border-t border-core-border/60 dark:border-[#282C5A]">
        <div className="flex items-center justify-between text-[11px] text-core-muted dark:text-slate-400">
          <span>Responsable: <strong className="text-core-navy dark:text-slate-200">{task.owner || 'Equipo Operativo'}</strong></span>
          <span className="inline-flex items-center gap-1 font-medium">
            <Clock className="w-3 h-3" />
            {task.dueLabel || 'En plazo'}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Campo de entrada estándar (altura h-10 consistente)
 */
export function InputField({
  label,
  placeholder,
  type = 'text',
  value,
  onChange,
  rightElement,
  className = '',
  required = false,
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold text-core-navy dark:text-slate-200 pl-0.5">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        <input
          type={type}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="h-10 w-full rounded-xl border border-core-border dark:border-[#2E3366] bg-white dark:bg-[#12142E] px-3.5 text-sm text-core-navy dark:text-white placeholder:text-slate-400 focus:border-core-violet focus:outline-none focus:ring-2 focus:ring-core-violet/20 transition-all"
        />
        {rightElement && <div className="absolute right-3">{rightElement}</div>}
      </div>
    </div>
  )
}

/**
 * Buscador con icono (altura h-10 consistente)
 */
export function SearchInput({
  placeholder = 'Buscar...',
  value,
  onChange,
  onClear,
  className = '',
}) {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search
        className="w-4 h-4 text-core-muted absolute left-3.5 pointer-events-none"
        strokeWidth={1.8}
      />
      <input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#12142E] pl-10 pr-8 text-xs sm:text-sm text-core-navy dark:text-white placeholder:text-slate-400 focus:border-core-violet focus:outline-none focus:ring-2 focus:ring-core-violet/20 transition-all"
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 p-1 text-slate-400 hover:text-core-navy dark:hover:text-white"
          aria-label="Limpiar búsqueda"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}

/**
 * Tabs horizontales con indicador Electric Violet
 */
export function Tabs({ tabs, activeTab, onChange }) {
  return (
    <div className="flex items-center gap-5 sm:gap-7 border-b border-core-border dark:border-[#282C5A] overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`relative pb-3 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'text-core-violet dark:text-indigo-400 font-semibold'
                : 'text-core-muted hover:text-core-navy dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                    isActive
                      ? 'bg-core-violet/12 text-core-violet dark:bg-indigo-500/25 dark:text-indigo-300'
                      : 'bg-core-cloud text-core-muted dark:bg-[#1C2042] dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </span>
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-core-violet" />
            )}
          </button>
        )
      })}
    </div>
  )
}

/**
 * Notificación Toast empresarial
 */
export function ToastNotification({
  title = 'Proceso completado',
  description = 'Los cambios se guardaron correctamente.',
  onClose,
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 dark:border-emerald-800/70 bg-[#F2FBF5] dark:bg-emerald-950/75 px-4 py-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#16A34A] text-white">
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2.5} />
        </span>
        <div>
          <p className="text-xs font-bold text-[#15803D] dark:text-emerald-300">{title}</p>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{description}</p>
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
