import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Check, Pause, Play, UserCheck, Zap } from 'lucide-react'
import { TriangleMark } from '../brand/BrandShapes'
import { SceneWindow, FOCUS_DARK } from './ui'
import { useCountUp, useInView, usePageVisible, useReducedMotion } from './hooks'

const STORIES = [
  {
    id: 'cliente',
    tab: 'Cliente nuevo',
    title: 'Seguimiento comercial',
    cols: ['Nuevo', 'Contacto', 'Propuesta'],
    ghosts: [null, 'Textiles Sur · $2.800.000', 'Café Tairona · $1.950.000'],
    card: { name: 'Distribuidora Andina', meta: 'Cotización $4.200.000' },
    role: 'Gerencia',
    rule: 'Si aprobado → crear tarea',
    kpi: { label: 'Aprobadas este mes', from: 18 },
    steps: [
      'Distribuidora Andina entra al pipeline en la columna «Nuevo».',
      'La cotización llega a Gerencia y queda aprobada.',
      'La regla crea la tarea de seguimiento y el indicador sube de 18 a 19.',
    ],
  },
  {
    id: 'compra',
    tab: 'Solicitud de compra',
    title: 'Solicitudes internas',
    cols: ['Nueva', 'En revisión', 'Aprobada'],
    ghosts: [null, 'Resmas de papel · $380.000', 'Sillas ergonómicas · $2.400.000'],
    card: { name: 'Portátiles para ventas', meta: 'Solicitud $14.400.000' },
    role: 'Compras',
    rule: 'Si aprobada → notificar a Compras',
    kpi: { label: 'Solicitudes cerradas', from: 41 },
    steps: [
      'La solicitud de portátiles se registra en «Nueva».',
      'Compras la revisa y la aprueba.',
      'La regla avisa al equipo de Compras y el indicador sube de 41 a 42.',
    ],
  },
  {
    id: 'documento',
    tab: 'Documento por firmar',
    title: 'Control documental',
    cols: ['Borrador', 'Revisión', 'Firma'],
    ghosts: [null, 'Política de datos v2', 'Acta de comité v1'],
    card: { name: 'Contrato de servicio v3', meta: 'Documento · 4 páginas' },
    role: 'Representante legal',
    rule: 'Si firmado → archivar versión',
    kpi: { label: 'Documentos firmados', from: 7 },
    steps: [
      'El contrato v3 se carga como borrador.',
      'El representante legal lo revisa y lo aprueba.',
      'La regla archiva la versión firmada y el indicador sube de 7 a 8.',
    ],
  },
]

const ACCENT = {
  cyan: { ring: 'border-core-cyan', bg: 'bg-core-cyan-soft' },
  violet: { ring: 'border-core-violet', bg: 'bg-core-violet-soft' },
  lime: { ring: 'border-core-lime', bg: 'bg-core-lime-soft' },
}

const STATIONS = [
  { key: 'organiza', label: 'Organiza', accent: 'cyan' },
  { key: 'conecta', label: 'Conecta', accent: 'violet' },
  { key: 'evoluciona', label: 'Evoluciona', accent: 'lime' },
]

function Thread({ color, on }) {
  return (
    <svg
      viewBox="0 0 44 100"
      preserveAspectRatio="none"
      className="lf-thread pointer-events-none absolute left-0 top-[34px] w-11"
      style={{ height: 'calc(100% - 16px)' }}
      data-on={on ? 'true' : 'false'}
      aria-hidden="true"
    >
      <path d="M22 0 C 38 34, 6 66, 22 100" pathLength="1" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

function Station({ index, active, accent, label, children, thread }) {
  const a = ACCENT[accent]
  return (
    <div className="relative grid grid-cols-[44px_1fr] gap-x-0" data-station={STATIONS[index].key}>
      <div className="relative">
        <span
          className={`absolute left-[8px] top-[6px] flex h-7 w-7 items-center justify-center rounded-full border-2 bg-white transition-colors ${
            active ? a.ring : 'border-core-border'
          }`}
        >
          <TriangleMark accent={accent} className="h-3 w-3" />
        </span>
        {thread}
      </div>
      <div
        className={`lf-station rounded-xl border p-3 sm:p-4 ${active ? `${a.ring} ${a.bg}` : 'border-core-border bg-white'}`}
      >
        <p className="text-[13px] font-bold text-core-navy">{label}</p>
        <div className={`lf-step mt-2 ${active ? '' : 'opacity-60'}`} data-on="true">
          {children}
        </div>
      </div>
    </div>
  )
}

export function FlowScene() {
  const reduced = useReducedMotion()
  const visible = usePageVisible()
  const [wrapRef, inView] = useInView({ threshold: 0.25 })
  const [story, setStory] = useState(0)
  const [step, setStep] = useState(0)
  const [mode, setMode] = useState('loop')
  const [hover, setHover] = useState(false)
  const [focusIn, setFocusIn] = useState(false)
  const figureRef = useRef(null)
  const rafRef = useRef(0)
  const data = STORIES[story]

  const shown = reduced ? 3 : step
  const hold = hover || (focusIn && mode === 'loop')
  const running = !reduced && mode !== 'paused' && !hold && inView && visible

  useEffect(() => {
    if (!running) return undefined
    if (step === 3 && mode === 'once') return undefined
    const delay = step === 0 ? 400 : step === 3 ? 2400 : 1900
    const t = setTimeout(() => {
      if (step < 3) setStep(step + 1)
      else {
        setStory((s) => (s + 1) % STORIES.length)
        setStep(0)
      }
    }, delay)
    return () => clearTimeout(t)
  }, [running, step, mode, story])

  const kpi = useCountUp(data.kpi.from + 1, { active: shown >= 3, from: data.kpi.from, duration: 900 })

  const selectStory = (i) => {
    setStory(i)
    setStep(0)
    setMode('once')
  }

  const onTabKey = (e) => {
    const keys = { ArrowRight: 1, ArrowLeft: -1 }
    let next = null
    if (e.key in keys) next = (story + keys[e.key] + STORIES.length) % STORIES.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = STORIES.length - 1
    if (next === null) return
    e.preventDefault()
    selectStory(next)
    document.getElementById(`lf-flow-tab-${next}`)?.focus()
  }

  const onPointerMove = useCallback((e) => {
    if (e.pointerType !== 'mouse' || reduced) return
    const el = figureRef.current
    if (!el || rafRef.current) return
    const { clientX } = e
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0
      const r = el.getBoundingClientRect()
      const v = (((clientX - r.left) / r.width) * 2 - 1).toFixed(2)
      // Solo en las capas que lo usan, no en toda la figura
      el.querySelectorAll('.lf-thread-wrap').forEach((n) => n.style.setProperty('--lf-px', v))
    })
  }, [reduced])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const setRefs = (node) => {
    wrapRef.current = node
    figureRef.current = node
  }

  return (
    <figure
      ref={setRefs}
      onPointerMove={onPointerMove}
      onFocus={() => setFocusIn(true)}
      onBlur={() => setFocusIn(false)}
      className="m-0 w-full"
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          role="tablist"
          aria-label="Historias de ejemplo"
          onKeyDown={onTabKey}
          className="lf-no-scrollbar -mx-1 flex min-w-0 flex-1 gap-2 overflow-x-auto px-1 py-1"
        >
          {STORIES.map((s, i) => (
            <button
              key={s.id}
              id={`lf-flow-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={story === i}
              aria-controls="lf-flow-panel"
              tabIndex={story === i ? 0 : -1}
              onClick={() => selectStory(i)}
              className={`h-11 shrink-0 whitespace-nowrap rounded-xl border px-4 text-sm font-semibold transition-colors ${FOCUS_DARK} ${
                story === i
                  ? 'border-core-lime bg-core-lime text-core-navy'
                  : 'border-white/25 bg-white/5 text-white hover:border-white/60 hover:bg-white/10'
              }`}
            >
              {s.tab}
            </button>
          ))}
        </div>
      </div>

      <div id="lf-flow-panel" role="tabpanel" aria-labelledby={`lf-flow-tab-${story}`} tabIndex={-1} className="outline-none">
        <div
          aria-hidden="true"
          onPointerEnter={(e) => e.pointerType === 'mouse' && setHover(true)}
          onPointerLeave={() => setHover(false)}
        >
          <SceneWindow title={`CoreFlow · ${data.title}`} bodyClassName="p-3 sm:p-5 lf-flow-body">
            <div className="space-y-3">
              <Station
                index={0}
                active={shown >= 1}
                accent="cyan"
                label="Organiza"
                thread={<Thread color="#08C9E8" on={shown >= 2} />}
              >
                <div className="grid grid-cols-3 gap-2">
                  {data.cols.map((col, i) => (
                    <div key={col} className="min-w-0 rounded-lg bg-white/70 p-2">
                      <p className="truncate text-xs font-semibold text-core-body">{col}</p>
                      <div className="mt-1.5 min-h-[58px] sm:min-h-[62px]">
                        {i === 0 ? (
                          <div
                            data-on={shown >= 1 ? 'true' : 'false'}
                            className="lf-step rounded-md border border-core-cyan bg-white p-1.5"
                          >
                            <p className="truncate text-[13px] font-semibold leading-tight text-core-navy">{data.card.name}</p>
                            <p className="mt-0.5 truncate text-xs tabular-nums text-core-body">{data.card.meta}</p>
                          </div>
                        ) : (
                          <div className="rounded-md bg-core-cloud p-1.5">
                            <p className="line-clamp-2 text-xs leading-tight text-core-body">{data.ghosts[i]}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Station>

              <Station
                index={1}
                active={shown >= 2}
                accent="violet"
                label="Conecta"
                thread={<Thread color="#6545E8" on={shown >= 3} />}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-core-border bg-white px-2.5 text-[13px] font-semibold text-core-navy">
                    <UserCheck className="h-4 w-4 text-core-violet" aria-hidden="true" />
                    {data.role}
                  </span>
                  <span
                    className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold transition-colors ${
                      shown >= 2 ? 'bg-core-violet text-white' : 'bg-white text-core-body'
                    }`}
                  >
                    {shown >= 2 ? (
                      <>
                        <Check className="h-4 w-4" aria-hidden="true" />
                        Aprobado
                      </>
                    ) : (
                      'Pendiente de aprobación'
                    )}
                  </span>
                </div>
              </Station>

              <Station index={2} active={shown >= 3} accent="lime" label="Evoluciona">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`inline-flex min-h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold transition-colors ${
                      shown >= 3 ? 'bg-core-lime text-core-navy' : 'bg-white text-core-body'
                    }`}
                  >
                    <Zap className="h-4 w-4" aria-hidden="true" />
                    {data.rule}
                  </span>
                  <span className="text-right">
                    <span className="block text-xs text-core-body">{data.kpi.label}</span>
                    <span className="block text-[32px] font-extrabold leading-none tabular-nums text-core-navy">
                      {Math.round(shown >= 3 ? kpi : data.kpi.from)}
                    </span>
                  </span>
                </div>
              </Station>
            </div>
          </SceneWindow>
        </div>

        <ol className="sr-only mt-4 list-decimal space-y-1 pl-5 text-sm text-slate-200 motion-reduce:not-sr-only">
          {data.steps.map((text) => (
            <li key={text}>{text}</li>
          ))}
        </ol>
      </div>

      <div className="mt-2 flex items-center justify-between gap-3">
        <figcaption className="text-[13px] text-slate-300">Ejemplo ilustrativo con datos de ejemplo.</figcaption>
        <button
            type="button"
            onClick={() => setMode(mode === 'loop' ? 'paused' : 'loop')}
            aria-label={mode === 'loop' ? 'Pausar la animación' : 'Reproducir la animación'}
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/5 text-white hover:border-white/60 motion-reduce:hidden ${FOCUS_DARK}`}
          >
            {mode === 'loop' ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
          </button>
      </div>
    </figure>
  )
}
