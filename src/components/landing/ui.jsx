import React, { useLayoutEffect } from 'react'
import { useInView } from './hooks'

export const FOCUS =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-core-violet'
export const FOCUS_DARK =
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'

export const fmtCop = (n) => `$${Math.round(n).toLocaleString('es-CO')}`
export const fmtNum = (n) => Math.round(n).toLocaleString('es-CO')

export const DEMO_STARTER = { id: 'starter_admin', email: 'admin.starter@unidadpyme.co' }
export const DEMO_BUSINESS = { id: 'business_admin', email: 'admin.business@corporativoprincipal.co' }

export function scrollToId(id) {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

/** Arma las entradas por scroll (sin JS el contenido queda visible). */
export function useArmReveal(rootRef) {
  useLayoutEffect(() => {
    const el = rootRef.current
    el?.classList.add('lf-armed')
    return () => el?.classList.remove('lf-armed')
  }, [rootRef])
}

/** Entrada de bloque: 480 ms, translateY 20 px, una sola vez. */
export function Reveal({ as: Tag = 'div', delay = 0, className = '', children, ...rest }) {
  const [ref, inView] = useInView({ threshold: 0.2, once: true })
  return (
    <Tag
      ref={ref}
      data-in={inView ? 'true' : undefined}
      style={{ '--lf-delay': `${delay}ms` }}
      className={`lf-reveal ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

/** Contenedor con hijos que entran escalonados (70 ms) al aparecer. Los hijos reciben --i. */
export function Stagger({ as: Tag = 'div', className = '', children, ...rest }) {
  const [ref, inView] = useInView({ threshold: 0.15, once: true })
  return (
    <Tag ref={ref} data-in={inView ? 'true' : undefined} className={`lf-stagger ${className}`} {...rest}>
      {React.Children.map(children, (child, i) => (
        <div className="min-w-0" style={{ '--i': i }}>
          {child}
        </div>
      ))}
    </Tag>
  )
}

/** Interruptor accesible reutilizado en S2 y en la escena de automatizaciones. */
export function Switch({ checked, onChange, label, dark = false, className = '' }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-11 w-[68px] shrink-0 items-center rounded-full ${dark ? FOCUS_DARK : FOCUS} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-1/2 h-8 -translate-y-1/2 rounded-full border-2 transition-colors ${
          checked ? 'border-core-violet bg-core-violet' : dark ? 'border-slate-400 bg-core-navy-light' : 'border-[#8B93AE] bg-white'
        }`}
      />
      <span
        aria-hidden="true"
        className={`absolute left-0 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full transition-transform duration-200 ${
          checked ? 'translate-x-[40px] bg-white' : `translate-x-[6px] ${dark ? 'bg-slate-300' : 'bg-core-navy'}`
        }`}
      />
    </button>
  )
}

/** Ventana de aplicación de las escenas: borde, radio 14, rótulo "Datos de ejemplo". */
export function SceneWindow({ title, children, className = '', bodyClassName = '' }) {
  return (
    <div className={`lf-win lf-win-tint overflow-hidden rounded-[14px] ${className}`}>
      <span aria-hidden="true" className="lf-bar-brand block h-[3px]" />
      <div className="flex items-center justify-between gap-3 border-b border-core-border/70 lf-head-tint px-4 py-2.5">
        <span className="truncate text-[13px] font-semibold text-core-navy">{title}</span>
        <span className="shrink-0 text-xs font-medium text-core-body">Datos de ejemplo</span>
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  )
}
