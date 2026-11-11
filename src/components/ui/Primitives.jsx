import React from 'react'
import {
  CheckCircle2,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
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
 * Estados visuales coherentes (Activo, En proceso, Pendiente, Completado, Error)
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
    error: {
      defaultLabel: 'Requiere atención',
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
 * Superficie / Tarjeta estándar de CoreFlow (esquinas 14px, sombra suave, borde sutil y geometría diagonal)
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
 * Indicador KPI con jerarquía empresarial refinada, barra de progreso geométrica y desglose operativo
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
  progress = 72,
  accentColor = 'violet',
  icon: Icon = null,
  active = false,
  onClick,
}) {
  const isUp = deltaDirection === 'up'

  const accentStyles = {
    violet: {
      bar: 'from-core-violet to-core-blue',
      iconBg: 'bg-core-violet/10 text-core-violet dark:bg-core-violet/20 dark:text-indigo-300',
      stripe: 'bg-core-violet',
    },
    cyan: {
      bar: 'from-core-blue to-core-cyan',
      iconBg: 'bg-core-cyan/15 text-[#0284C7] dark:bg-core-cyan/20 dark:text-core-cyan',
      stripe: 'bg-core-cyan',
    },
    lime: {
      bar: 'from-[#6545E8] to-[#84CC16]',
      iconBg: 'bg-[#EAFBE7] text-[#15803D] dark:bg-core-lime/20 dark:text-core-lime',
      stripe: 'bg-[#84CC16]',
    },
    blue: {
      bar: 'from-core-blue to-core-violet',
      iconBg: 'bg-core-blue/10 text-core-blue dark:bg-core-blue/20 dark:text-blue-300',
      stripe: 'bg-core-blue',
    },
  }

  const acc = accentStyles[accentColor] || accentStyles.violet

  return (
    <SurfaceCard
      interactive={Boolean(onClick)}
      onClick={onClick}
      className={`p-5 flex flex-col justify-between min-h-[164px] ${
        active ? 'ring-2 ring-core-violet border-core-violet' : ''
      }`}
    >
      {/* Acento diagonal superior derecho sutil */}
      <svg
        className="pointer-events-none absolute top-0 right-0 w-20 h-20 opacity-80"
        viewBox="0 0 80 80"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M36 -8 L88 44 L88 22 L58 -8 Z"
          fill={
            accentColor === 'cyan'
              ? '#08C9E8'
              : accentColor === 'lime'
              ? '#A6E91C'
              : '#6545E8'
          }
          fillOpacity="0.08"
        />
      </svg>

      {/* Fila Superior: Título + Etiqueta de Alcance (Acumulado vs Período) + Icono */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[13px] font-semibold text-core-navy dark:text-slate-100 tracking-tight">
              {title}
            </span>
            {scopeBadge && (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-core-cloud dark:bg-[#101228] text-core-muted dark:text-slate-300 border border-core-border/80 dark:border-[#282C5A]">
                {scopeBadge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-core-muted dark:text-slate-400 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${acc.iconBg}`}
          >
            <Icon className="w-4 h-4" strokeWidth={1.9} />
          </div>
        )}
      </div>

      {/* Fila Central: Valor Principal + Variación */}
      <div className="my-3 flex items-baseline justify-between gap-2">
        <span className="text-3xl font-extrabold tracking-tight text-core-navy dark:text-white tabular-nums">
          {value}
        </span>

        {delta && (
          <div className="flex flex-col items-end">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold tabular-nums ${
                isUp
                  ? 'bg-[#EAFBE7] text-[#15803D] dark:bg-emerald-950/80 dark:text-emerald-300'
                  : 'bg-[#FEF6E0] text-[#B45309] dark:bg-amber-950/80 dark:text-amber-300'
              }`}
            >
              {isUp ? (
                <TrendingUp className="w-3 h-3" strokeWidth={2.3} />
              ) : (
                <TrendingDown className="w-3 h-3" strokeWidth={2.3} />
              )}
              {delta}
            </span>
            <span className="text-[10px] text-core-muted dark:text-slate-400 mt-0.5">
              {deltaLabel}
            </span>
          </div>
        )}
      </div>

      {/* Fila Inferior: Barra de progreso geométrica + Desglose operativo accionable */}
      <div className="pt-2.5 border-t border-core-border/70 dark:border-[#282C5A] space-y-2">
        <div className="w-full h-1.5 rounded-full bg-core-cloud dark:bg-[#101228] overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${acc.bar} transition-all duration-300`}
            style={{ width: `${Math.min(100, Math.max(12, progress))}%` }}
          />
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="font-medium text-core-muted dark:text-slate-300 truncate">
            {breakdown}
          </span>
          {onClick && (
            <span className="inline-flex items-center gap-0.5 font-semibold text-core-violet dark:text-indigo-300 group-hover:translate-x-0.5 transition-transform shrink-0">
              Explorar
              <ArrowUpRight className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>
    </SurfaceCard>
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
