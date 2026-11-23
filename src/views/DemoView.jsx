// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React, { useEffect, useRef } from 'react'
import { ArrowLeft, ArrowRight, Check, RefreshCw } from 'lucide-react'
import { PLANS_CATALOG } from '../core/config/plansCatalog'
import { CoreFlowIsotipo, CoreFlowLogo } from '../components/brand/CoreFlowLogo'
import { TriangleCluster } from '../components/brand/BrandShapes'
import { Atmos, Tri } from '../components/landing/atmos'
import { idlePreloadWorkspace } from './preloadRoutes'
import { DEMO_BUSINESS, DEMO_STARTER, FOCUS_DARK } from '../components/landing/ui'

/** Qué se puede probar en cada demo; los límites salen de PLANS_CATALOG, nunca se escriben a mano. */
const PLAN_TRIALS = {
  starter: [
    'Registrar un cliente y seguirlo desde Clientes y Oportunidades.',
    'Crear una solicitud y moverla por su flujo directo de estados.',
    'Asignar tareas al equipo y marcarlas como hechas.',
    'Guardar documentos y revisar los procesos básicos automatizados.',
  ],
  business: [
    'Mover oportunidades por el pipeline comercial y revisar cuentas por área.',
    'Aprobar solicitudes en varios niveles.',
    'Ver automatizaciones entre áreas y el control documental.',
    'Comparar indicadores en reportes y revisar departamentos, roles y auditoría.',
  ],
}

const OPTIONS = [
  {
    key: 'starter',
    demo: DEMO_STARTER,
    plan: PLANS_CATALOG.starter,
    label: 'Starter',
    pitch: 'Para equipos pequeños que quieren ordenar su operación desde el primer día.',
    accent: 'cyan',
  },
  {
    key: 'business',
    demo: DEMO_BUSINESS,
    plan: PLANS_CATALOG.business,
    label: 'Business',
    pitch: 'Para organizaciones que crecen y necesitan áreas, permisos y más control.',
    accent: 'lime',
  },
]

function planIncludes(plan) {
  const { limits, features } = plan
  const items = [plan.collaboratorsRangeLabel]
  items.push(limits.maxBranches === 1 ? 'Una sede' : `Hasta ${limits.maxBranches} sedes`)
  items.push(
    limits.maxActiveAutomations
      ? `Hasta ${limits.maxActiveAutomations} automatizaciones activas`
      : 'Automatizaciones sin tope fijo'
  )
  if (limits.maxAdmins) items.push(`Hasta ${limits.maxAdmins} administradores`)
  if (features.granularPermissions) items.push('Roles y permisos granulares')
  return items
}

function OptionCard({ option, disabled, onChoose }) {
  const { key, demo, plan, label, pitch, accent } = option
  const featured = accent === 'lime'
  const titleId = `lf-demo-${key}-title`
  return (
    <article
      aria-labelledby={titleId}
      className="lf-glow-border lf-card-glass relative flex flex-col overflow-hidden rounded-2xl bg-core-navy-deep/85 p-6 shadow-float sm:p-8"
      style={featured ? undefined : { '--lf-gb-a': '#08C9E8', '--lf-gb-b': '#3568E8', '--lf-gb-c': '#6545E8' }}
    >
      <span aria-hidden="true" className="lf-bar-brand absolute inset-x-6 top-0 h-[3px] rounded-b" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <Tri tone={featured ? 'lime' : 'cyan'} mask="tr" />
      </div>

      <p className={`relative text-sm font-semibold uppercase tracking-wider ${featured ? 'text-core-lime' : 'text-core-cyan'}`}>
        Demo
      </p>
      <h2 id={titleId} className="relative mt-1 text-3xl font-extrabold tracking-tight text-white">
        CoreFlow {label}
      </h2>
      <p className="relative mt-3 text-[15px] leading-relaxed text-slate-200">{pitch}</p>

      <h3 className="relative mt-6 text-sm font-semibold text-white">Qué incluye este plan</h3>
      <ul className="relative mt-3 flex flex-wrap gap-2">
        {planIncludes(plan).map((item) => (
          <li key={item} className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-[13px] text-slate-100">
            {item}
          </li>
        ))}
      </ul>

      <h3 className="relative mt-6 text-sm font-semibold text-white">Qué podrás probar</h3>
      <ul className="relative mt-3 flex-1 space-y-2.5">
        {PLAN_TRIALS[key].map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-[15px] leading-snug text-slate-100">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? 'text-core-lime' : 'text-core-cyan'}`} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="relative mt-6 text-[13px] text-slate-300">Datos de ejemplo: no pertenecen a ninguna empresa real.</p>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChoose(demo)}
        className={`relative mt-3 inline-flex h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold transition-colors disabled:opacity-60 ${FOCUS_DARK} ${
          featured ? 'bg-core-lime text-core-navy hover:brightness-95' : 'bg-core-cyan text-core-navy hover:brightness-95'
        }`}
      >
        Entrar a la demo de {label}
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </article>
  )
}

/** Estado de carga: isotipo que se arma pieza a pieza (sin animación con movimiento reducido). */
function Preparing({ headingRef, label }) {
  return (
    <div aria-live="polite" className="mx-auto flex max-w-xl flex-col items-center py-16 text-center sm:py-24">
      <div className="relative flex h-32 w-32 items-center justify-center">
        <span aria-hidden="true" className="lf-demo-ring absolute inset-0" />
        <CoreFlowIsotipo className="lf-demo-iso h-16 w-16" />
      </div>
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="mt-8 text-balance text-[clamp(1.5rem,4vw,2.25rem)] font-extrabold leading-tight tracking-[-0.02em] text-white outline-none"
      >
        Preparando tu espacio de demostración…
      </h1>
      <p className="mt-3 text-[16px] leading-relaxed text-slate-200">
        Cargando los datos de ejemplo de CoreFlow {label}. Un momento.
      </p>
    </div>
  )
}

export function DemoView({ onStartDemo, pendingDemoId = null, demoError = null, onBack }) {
  useEffect(() => idlePreloadWorkspace(), [])
  const titleRef = useRef(null)
  const loadingRef = useRef(null)
  const errorRef = useRef(null)
  const lastDemoRef = useRef(null)
  const busy = Boolean(pendingDemoId)

  if (pendingDemoId) lastDemoRef.current = OPTIONS.find((o) => o.demo.id === pendingDemoId) || lastDemoRef.current

  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  // El foco sigue al estado: carga -> encabezado de carga; error -> aviso de error
  useEffect(() => {
    if (busy) loadingRef.current?.focus()
  }, [busy])
  useEffect(() => {
    if (demoError && !busy) errorRef.current?.focus()
  }, [demoError, busy])

  useEffect(() => {
    if (busy) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onBack?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [busy, onBack])

  const retryOption = lastDemoRef.current

  return (
    <div className="lf-root relative isolate min-h-screen overflow-x-clip bg-core-navy-deep text-white selection:bg-core-violet selection:text-white">
      <Atmos mesh="hero" grid fade />
      <Tri tone="mix" size="lg" mask="tr" />
      <Tri tone="cyan" size="lg" mask="bl" className="opacity-60" />
      <TriangleCluster accent="violet" className="!-right-6 !-top-3 !h-24 !w-40 opacity-60 sm:!h-36 sm:!w-60" />

      <header className="relative z-10 flex h-16 items-center justify-between gap-3 border-b border-white/10 px-4 sm:px-6 lg:px-8">
        <CoreFlowLogo variant="horizontal" theme="dark" size="md" />
        {!busy && (
          <a
            href="/"
            onClick={(e) => {
              if (!onBack) return
              e.preventDefault()
              onBack()
            }}
            className={`inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white hover:underline underline-offset-4 ${FOCUS_DARK}`}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Volver al inicio
          </a>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 sm:pt-14 lg:px-8">
        {busy ? (
          <Preparing headingRef={loadingRef} label={retryOption?.label || ''} />
        ) : (
          <>
            <p className="inline-flex rounded-full border border-core-lime/60 bg-core-lime/10 px-3 py-1 text-[13px] font-semibold text-core-lime">
              Demo con datos de ejemplo
            </p>
            <h1
              ref={titleRef}
              tabIndex={-1}
              className="mt-4 max-w-[22ch] text-balance text-[clamp(2rem,5.4vw,3.75rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white outline-none"
            >
              Elige qué plan quieres explorar.
            </h1>
            <p className="mt-4 max-w-[58ch] text-[17px] leading-[1.6] text-slate-200">
              Entras directo, sin registro. Todo lo que veas es información de ejemplo para recorrer el flujo completo
              y comparar los dos planes.
            </p>

            {demoError && (
              <div
                ref={errorRef}
                role="alert"
                tabIndex={-1}
                className="mt-6 flex flex-col gap-3 rounded-xl border border-red-300/50 bg-red-500/10 px-4 py-3 text-[15px] text-red-100 outline-none sm:flex-row sm:items-center sm:justify-between"
              >
                <span>{demoError}</span>
                {retryOption && (
                  <button
                    type="button"
                    onClick={() => onStartDemo(retryOption.demo)}
                    className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/50 px-4 text-sm font-semibold text-white hover:bg-white/10 ${FOCUS_DARK}`}
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    Reintentar con {retryOption.label}
                  </button>
                )}
              </div>
            )}

            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:gap-8">
              {OPTIONS.map((option) => (
                <OptionCard key={option.key} option={option} disabled={busy} onChoose={onStartDemo} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
