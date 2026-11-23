import React from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { TriangleCluster, TriangleMark } from '../brand/BrandShapes'
import { FlowScene } from './FlowScene'
import { Atmos, Depth, Parallax, Tri } from './atmos'
import { AvatarStack, CursorTag, Notif, SparkCard } from './floaters'
import { useInView } from './hooks'
import { DEMO_STARTER, FOCUS_DARK, Reveal, scrollToId } from './ui'

/** Hilo diagonal del isotipo cruzando el fondo: cian, violeta y lima. */
function DiagonalThread() {
  const [ref, inView] = useInView({ threshold: 0.1, once: true })
  return (
    <svg
      ref={ref}
      data-in={inView ? 'true' : undefined}
      aria-hidden="true"
      viewBox="0 0 1440 900"
      preserveAspectRatio="none"
      className="lf-draw pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
    >
      <defs>
        <linearGradient id="lf-hero-thread" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#08C9E8" />
          <stop offset="0.5" stopColor="#6545E8" />
          <stop offset="1" stopColor="#A6E91C" />
        </linearGradient>
      </defs>
      <path
        d="M -60 860 C 360 760, 520 560, 860 420 S 1300 150, 1500 40"
        pathLength="1"
        fill="none"
        stroke="url(#lf-hero-thread)"
        strokeWidth="2.5"
        strokeLinecap="round"
        opacity="0.55"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

export function Hero({ canDemo, busy, pendingDemoId, demoError, onStartDemo, onLogin }) {
  return (
    <section className="relative isolate overflow-hidden bg-core-navy-deep pb-28 pt-12 text-white sm:pt-16 lg:pb-40 lg:pt-20">
      <Atmos mesh="hero" grid fade />
      <Tri tone="mix" size="lg" mask="tr" />
      <Tri tone="cyan" size="lg" mask="bl" className="opacity-60" />
      <DiagonalThread />
      <TriangleCluster accent="cyan" className="!-right-6 !-top-3 !h-24 !w-40 opacity-60 sm:!h-36 sm:!w-60" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8">
        <Reveal
          as="h1"
          className="text-[clamp(2.25rem,7.4vw,6.25rem)] font-extrabold leading-[0.98] tracking-[-0.04em] text-white"
        >
          <span className="block">Todo tu equipo</span>
          <span className="block">
            en un solo <span className="text-core-lime">flujo.</span>
          </span>
        </Reveal>

        <div className="mt-10 grid items-start gap-14 lg:mt-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
          <div className="lg:pt-6">
            <Reveal as="p" delay={70} className="max-w-[44ch] text-[18px] leading-[1.6] text-slate-200 sm:text-[19px]">
              CoreFlow reúne clientes, solicitudes, tareas y documentos, con aprobaciones y automatizaciones, para pymes.
            </Reveal>
            <Reveal delay={140} className="mt-8 flex flex-wrap items-center gap-3">
              {canDemo ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onStartDemo(DEMO_STARTER)}
                  className={`inline-flex h-14 items-center gap-2 rounded-xl bg-core-lime px-7 text-base font-bold text-core-navy shadow-[0_12px_32px_-8px_rgba(166,233,28,0.55)] transition-all hover:-translate-y-0.5 hover:brightness-95 disabled:opacity-60 ${FOCUS_DARK}`}
                >
                  {pendingDemoId === DEMO_STARTER.id ? (
                    <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-label="Entrando" />
                  ) : (
                    <>
                      Explorar la demo
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onLogin}
                  className={`inline-flex h-14 items-center gap-2 rounded-xl bg-core-lime px-7 text-base font-bold text-core-navy hover:brightness-95 ${FOCUS_DARK}`}
                >
                  Iniciar sesión
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
              <button
                type="button"
                onClick={() => scrollToId('como-funciona')}
                className={`inline-flex h-12 items-center rounded-xl px-3 text-[15px] font-semibold text-white underline decoration-core-cyan decoration-2 underline-offset-[6px] hover:text-core-cyan ${FOCUS_DARK}`}
              >
                Ver cómo funciona
              </button>
            </Reveal>
            {canDemo && <p className="mt-4 text-sm text-slate-300">Sin registro y con datos de ejemplo.</p>}
            {demoError && (
              <p role="alert" className="mt-4 rounded-lg border border-red-300/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {demoError}
              </p>
            )}

            <Reveal delay={200} className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-white/10 pt-6">
              {[
                ['cyan', 'Organiza'],
                ['violet', 'Conecta'],
                ['lime', 'Evoluciona'],
              ].map(([accent, label]) => (
                <span key={label} className="inline-flex items-center gap-2 text-[15px] font-semibold text-white">
                  <TriangleMark accent={accent} className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </Reveal>
          </div>

          <Reveal delay={120} className="min-w-0">
            <Parallax className="relative">
              <div aria-hidden="true" className="lf-glow -left-[8%] top-[6%] h-[90%] w-[80%]" style={{ '--lf-glow': 'rgba(101, 69, 232, 0.5)' }} />
              <div aria-hidden="true" className="lf-glow -right-[6%] bottom-[0%] h-[50%] w-[50%]" style={{ '--lf-glow': 'rgba(8, 201, 232, 0.28)' }} />
              <div className="relative">
                <FlowScene />
              </div>

              <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
                <Depth d={22} s={-34} bob={0} className="absolute -right-4 top-[72px] lg:-right-12">
                  <Notif who="camila" title="Gerencia aprobó" text="Cotización Andina · $4.200.000" />
                </Depth>
                <Depth d={30} s={26} bob={1200} className="absolute -left-6 top-[44%] lg:-left-14">
                  <CursorTag name="Laura" tone="violet" />
                </Depth>
                <Depth d={16} s={-20} bob={800} className="absolute -left-3 bottom-[60px] lg:-left-12">
                  <SparkCard label="Aprobaciones del mes" value="19" />
                </Depth>
                <Depth d={26} s={34} bob={2000} className="absolute left-[54%] top-[56%]">
                  <CursorTag name="Mateo" tone="cyan" />
                </Depth>
                <Depth d={12} s={-14} bob={400} className="absolute right-4 top-[-22px] lg:right-10">
                  <span className="lf-glass inline-flex items-center gap-2.5 rounded-full py-1.5 pl-2 pr-3.5 text-xs font-semibold text-white">
                    <AvatarStack people={['laura', 'mateo', 'camila', 'andres']} ring="ring-[#101228]" />
                    4 en línea
                  </span>
                </Depth>
              </div>
            </Parallax>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
