import React, { useCallback, useEffect, useRef, useState } from 'react'
import { FileText, MessageCircle, Table2, StickyNote } from 'lucide-react'
import { Atmos, Tri } from './atmos'
import { Switch } from './ui'
import { clamp, useMediaQuery, useReducedMotion, useScrollProgress } from './hooks'

const PAINS = [
  {
    title: 'Información dispersa',
    text: 'Clientes en una hoja de cálculo, acuerdos en un chat y archivos en el correo.',
  },
  {
    title: 'Procesos sin seguimiento',
    text: 'Nadie sabe en qué estado está una solicitud ni quién debe aprobarla.',
  },
  {
    title: 'Decisiones a ciegas',
    text: 'Sin indicadores claros, medir cómo avanza la operación toma horas.',
  },
]

const COLUMNS = [
  { name: 'Por hacer', bar: 'bg-core-cyan' },
  { name: 'En curso', bar: 'bg-core-violet' },
  { name: 'Hecho', bar: 'bg-core-lime' },
]

// kind: chat | sheet | file | note. sx/sy/sr: desplazamiento y giro de partida (px / grados)
const FRAGMENTS = [
  { kind: 'chat', raw: '¿ya lo aprobaron?', title: 'Cotización Distribuidora Andina', meta: 'Aprobación · Gerencia', sx: -180, sy: -90, sr: -8 },
  { kind: 'sheet', raw: 'Andina | 4.2M | ??', title: 'Cliente Distribuidora Andina', meta: 'Ficha única', sx: 90, sy: -150, sr: 5 },
  { kind: 'file', raw: 'contrato_v3_FINAL.pdf', title: 'Contrato de servicio v3', meta: 'Documento · versión vigente', sx: 190, sy: -60, sr: -4 },
  { kind: 'note', raw: 'llamar a Pérez mañana', title: 'Llamar a Marta Pérez', meta: 'Tarea · vence mañana', sx: -120, sy: 40, sr: 9 },
  { kind: 'chat', raw: '¿me lo mandas de nuevo?', title: 'Solicitud de compra n.º 118', meta: 'Pendiente · Jefe', sx: 60, sy: 120, sr: -6 },
  { kind: 'sheet', raw: 'Textiles Sur | ? | jul', title: 'Propuesta Textiles Sur', meta: '$2.800.000', sx: -200, sy: 130, sr: 4 },
  { kind: 'file', raw: 'cotizacion_final2.xlsx', title: 'Cotización Café Tairona', meta: 'Documento · v2', sx: 150, sy: 20, sr: 7 },
  { kind: 'note', raw: 'pedir permiso a gerencia', title: 'Permiso de vacaciones', meta: 'En aprobación', sx: -30, sy: -170, sr: -10 },
  { kind: 'chat', raw: '¿quién tiene el archivo?', title: 'Acta del comité', meta: 'Documento · v2', sx: 210, sy: 160, sr: 6 },
  { kind: 'sheet', raw: 'Pedido 118 | pendiente', title: 'Pedido 118', meta: 'Tarea · en curso', sx: -90, sy: 180, sr: -5 },
  { kind: 'file', raw: 'acta_reunion (1).docx', title: 'Acta de la reunión', meta: 'Documento · firmado', sx: 30, sy: -40, sr: 8 },
  { kind: 'note', raw: 'revisar facturas viernes', title: 'Revisar facturas', meta: 'Tarea · hecha', sx: 120, sy: -120, sr: -7 },
]

const RAW_STYLE = {
  chat: { Icon: MessageCircle, cls: 'rounded-2xl rounded-bl-sm bg-slate-200 text-core-navy' },
  sheet: { Icon: Table2, cls: 'rounded-sm border border-emerald-300 bg-emerald-50 font-mono text-emerald-900' },
  file: { Icon: FileText, cls: 'rounded-lg bg-red-100 text-red-900' },
  note: { Icon: StickyNote, cls: 'rounded-sm bg-amber-200 text-amber-950' },
}

function Fragment({ frag, index }) {
  const { Icon, cls } = RAW_STYLE[frag.kind]
  const col = Math.floor(index / 4)
  return (
    <li
      className="lf-frag relative h-[60px]"
      style={{ '--sx': frag.sx, '--sy': frag.sy, '--sr': frag.sr }}
    >
      <div className={`lf-frag-a absolute inset-0 flex items-center gap-2 px-3 text-[13px] ${cls}`}>
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate">{frag.raw}</span>
      </div>
      <div className="lf-frag-b absolute inset-0 flex items-stretch overflow-hidden rounded-lg lf-win-tint text-core-navy">
        <span className={`w-1.5 shrink-0 ${COLUMNS[col].bar}`} aria-hidden="true" />
        <span className="flex min-w-0 flex-col justify-center px-3 py-1">
          <span className="block line-clamp-2 text-[13px] font-semibold leading-tight">{frag.title}</span>
          <span className="block truncate text-xs text-core-body">{frag.meta}</span>
        </span>
      </div>
    </li>
  )
}

export function ChaosToOrder() {
  const reduced = useReducedMotion()
  const desktop = useMediaQuery('(min-width: 768px)')
  const pinned = desktop && !reduced
  const [ordered, setOrdered] = useState(false)
  const [beat, setBeat] = useState(0)
  const [done, setDone] = useState(false)
  const containerRef = useRef(null)
  const stageRef = useRef(null)
  const fragsRef = useRef(null)
  const animRef = useRef(0)
  const progressRef = useRef(0)

  const apply = useCallback((p) => {
    progressRef.current = p
    const el = stageRef.current
    if (el) {
      // Variables solo en los nodos que las usan: escribirlas en el contenedor invalida el estilo de todo el árbol
      if (!fragsRef.current) fragsRef.current = el.querySelectorAll('.lf-frag, .lf-frag-a, .lf-frag-b, .lf-colhead')
      const vp = clamp((p - 0.08) / 0.72).toFixed(3)
      const vc = clamp((p - 0.5) / 0.08).toFixed(3)
      fragsRef.current.forEach((n) => {
        if (n.classList.contains('lf-frag')) n.style.setProperty('--p', vp)
        else n.style.setProperty('--c', vc)
      })
    }
    const nextBeat = p < 0.33 ? 0 : p < 0.66 ? 1 : 2
    setBeat((b) => (b === nextBeat ? b : nextBeat))
    setDone((d) => (d === p >= 0.97 ? d : p >= 0.97))
    setOrdered((o) => (o === p >= 0.5 ? o : p >= 0.5))
  }, [])

  // Modo fijo (desktop): el progreso sale del scroll
  useScrollProgress(containerRef, (raw) => apply(clamp(raw / 0.9)), pinned)

  // Sin fijo: el interruptor anima 600 ms entre 0 y 1
  const animateTo = useCallback(
    (target) => {
      cancelAnimationFrame(animRef.current)
      if (reduced) return apply(target)
      const from = progressRef.current
      const t0 = performance.now()
      const tick = (now) => {
        const k = clamp((now - t0) / 600)
        const e = 1 - Math.pow(1 - k, 3)
        apply(from + (target - from) * e)
        if (k < 1) animRef.current = requestAnimationFrame(tick)
      }
      animRef.current = requestAnimationFrame(tick)
    },
    [apply, reduced]
  )

  useEffect(() => () => cancelAnimationFrame(animRef.current), [])

  // Al cambiar de modo se reinicia al estado "sin CoreFlow"
  useEffect(() => {
    apply(0)
  }, [pinned, apply])

  const onSwitch = (next) => {
    if (pinned) {
      // En modo fijo el interruptor lleva el scroll al inicio o al final del tramo
      const el = containerRef.current
      if (!el) return
      const top = el.getBoundingClientRect().top + window.scrollY
      const range = el.offsetHeight - window.innerHeight + 80
      window.scrollTo({ top: next ? top - 80 + range * 0.92 : top - 80 + 1, behavior: 'smooth' })
      return
    }
    setOrdered(next)
    animateTo(next ? 1 : 0)
  }

  return (
    <section id="como-funciona" aria-labelledby="lf-caos-title" className="scroll-mt-16 lf-dark-section lf-cut-both isolate overflow-clip bg-core-navy pb-[calc(var(--lf-cut)+24px)] pt-[calc(var(--lf-cut)+24px)] text-white md:pb-[calc(var(--lf-cut)+8px)] md:pt-[calc(var(--lf-cut)+8px)] lg:pb-[calc(var(--lf-cut)+8px)] lg:pt-[calc(var(--lf-cut)+8px)]" style={{ '--lf-prev': '#101228', '--lf-next': '#101228' }}>
      <Atmos mesh="a" />
      <Tri tone="mix" size="lg" mask="br" />
      <Tri tone="violet" size="xl" mask="tr" />
      <div
        ref={containerRef}
        className={pinned ? 'relative h-[240vh]' : 'relative'}
      >
        <div className={pinned ? 'sticky top-20' : ''}>
          <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-10 px-6 md:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14 lg:min-h-[calc(100vh-9rem)]">
            <div>
              <h2 id="lf-caos-title" className="relative text-balance text-[clamp(1.875rem,3.8vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
                <span className={`block transition-opacity duration-300 ${done ? 'opacity-0' : ''}`} aria-hidden={done}>
                  Cuando la operación crece, las hojas de cálculo y los chats se quedan cortos.
                </span>
                <span
                  className={`absolute inset-0 block transition-opacity duration-300 ${done ? '' : 'opacity-0'}`}
                  aria-hidden={!done}
                >
                  Organiza. Conecta. <span className="text-core-lime">Evoluciona.</span>
                </span>
              </h2>

              <ol className="mt-8 space-y-4">
                {PAINS.map((pain, i) => (
                  <li
                    key={pain.title}
                    className={`border-l-2 pl-4 transition-colors duration-300 ${beat === i ? 'border-core-lime' : 'border-white/20'}`}
                  >
                    <h3 className={`text-xl font-semibold ${beat === i ? 'text-white' : 'text-slate-400'}`}>{pain.title}</h3>
                    <p className={`mt-1 max-w-[46ch] text-[16px] leading-[1.6] ${beat === i ? 'text-slate-200' : 'text-slate-400'}`}>{pain.text}</p>
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex items-center gap-3">
                <span className={`text-[15px] font-semibold ${ordered ? 'text-slate-400' : 'text-white'}`}>Sin CoreFlow</span>
                <Switch dark checked={ordered} onChange={onSwitch} label="Mostrar el tablero con CoreFlow" />
                <span className={`text-[15px] font-semibold ${ordered ? 'text-white' : 'text-slate-400'}`}>Con CoreFlow</span>
              </div>
              {pinned && (
                <p className="mt-3 text-[13px] text-slate-400">También avanza al hacer scroll.</p>
              )}
            </div>

            <div
              ref={stageRef}
              className="lf-win-dark relative overflow-hidden rounded-2xl bg-core-navy-deep p-4 sm:p-6"
            >
              <div aria-hidden="true" className="lf-glow -right-10 -top-10 h-64 w-64" style={{ '--lf-glow': 'rgba(101, 69, 232, 0.45)' }} />
              <div aria-hidden="true" className="lf-glow -bottom-16 -left-10 h-64 w-64" style={{ '--lf-glow': 'rgba(8, 201, 232, 0.22)' }} />
              <Tri tone="mix" mask="br" className="opacity-80" />
              <div className="relative grid grid-cols-3 gap-2 sm:gap-4">
                {COLUMNS.map((c) => (
                  <p key={c.name} className="lf-colhead text-xs font-semibold text-slate-200 sm:text-[13px]">
                    {c.name}
                  </p>
                ))}
              </div>
              <ul className="relative mt-2 grid grid-flow-col grid-cols-3 grid-rows-4 gap-2 sm:gap-4">
                {FRAGMENTS.map((f, i) => (
                  <Fragment key={f.raw} frag={f} index={i} />
                ))}
              </ul>
              <p className="relative mt-4 text-xs text-slate-400">Datos de ejemplo</p>
            </div>
          </div>
        </div>
      </div>
      <p className="sr-only" role="status">
        {ordered ? 'Con CoreFlow: los fragmentos quedan ordenados en un tablero.' : 'Sin CoreFlow: la información está dispersa.'}
      </p>
    </section>
  )
}
