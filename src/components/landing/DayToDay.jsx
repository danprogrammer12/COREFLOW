// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React from 'react'
import { Check, FileText } from 'lucide-react'
import { PLANS_CATALOG } from '../../core/config/plansCatalog'
import { TriangleMark } from '../brand/BrandShapes'
import { Atmos, Depth, Parallax, Tri, TriEdge } from './atmos'
import { Avatar, AvatarStack, Notif } from './floaters'
import { useCountUp, useInView } from './hooks'
import { Reveal, Stagger } from './ui'

const CARD = 'lf-win lf-spot lf-spot-light lf-lift relative h-full overflow-hidden rounded-2xl p-4 text-core-navy'

/** Tarjeta con tinte de marca, banda de color y facetas triangulares en la esquina. */
function Card({ tone, children }) {
  return (
    <div className={`${CARD} lf-tint-${tone} w-full`}>
      <span aria-hidden="true" className="lf-bar-brand absolute inset-x-0 top-0 h-[3px]" />
      <Tri tone={tone} size="base" mask="tr" className="!opacity-90" />
      <div className="relative">{children}</div>
    </div>
  )
}

function TasksCard() {
  const rows = [
    { t: 'Enviar cotización a Textiles Sur', who: 'laura', time: '9:00', done: true },
    { t: 'Llamar a Marta Pérez', who: 'mateo', time: '10:30' },
    { t: 'Revisar contrato de servicio v3', who: 'camila', time: '14:00' },
    { t: 'Aprobar compra de portátiles', who: 'andres', time: '16:30' },
  ]
  return (
    <Card tone="cyan">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-bold">Hoy</p>
        <p className="text-xs font-semibold tabular-nums text-core-body">3 pendientes</p>
      </div>
      <ul className="mt-3 space-y-2">
        {rows.map((r) => (
          <li key={r.t} className="flex items-center gap-3 rounded-lg bg-white/60 px-3 py-2">
            <span
              aria-hidden="true"
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${r.done ? 'border-core-lime bg-core-lime' : 'border-[#8B93AE] bg-white'}`}
            >
              {r.done && <Check className="h-3 w-3 text-core-navy" strokeWidth={3.5} />}
            </span>
            <span className={`min-w-0 flex-1 truncate text-[13px] font-semibold ${r.done ? 'text-core-body line-through' : ''}`}>{r.t}</span>
            <span className="text-xs tabular-nums text-core-body">{r.time}</span>
            <Avatar who={r.who} size="h-6 w-6" ring="ring-white" />
          </li>
        ))}
      </ul>
    </Card>
  )
}

function RequestCard() {
  const steps = [
    ['Jefe', true],
    ['Gerencia', true],
    ['Compras', false],
  ]
  return (
    <Card tone="violet">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-core-body">Solicitud n.º 118</p>
          <p className="text-sm font-bold">Portátiles para ventas</p>
        </div>
        <span className="rounded-full bg-core-violet-soft px-2.5 py-1 text-xs font-semibold text-core-violet-hover">En revisión</span>
      </div>
      <p className="mt-2 text-2xl font-extrabold tabular-nums">$14.400.000</p>
      <ol className="mt-3 flex items-center gap-2">
        {steps.map(([name, ok], i) => (
          <li key={name} className="flex flex-1 items-center gap-2">
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${ok ? 'bg-core-violet text-white' : 'border-2 border-core-cyan bg-white text-core-navy'}`}
            >
              {ok ? <Check className="h-3.5 w-3.5" strokeWidth={3.5} /> : i + 1}
            </span>
            <span className="truncate text-xs font-semibold">{name}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function KpiCard() {
  const bars = [4, 6, 5, 8, 7, 9, 12]
  const max = Math.max(...bars)
  return (
    <Card tone="lime">
      <p className="text-xs font-semibold text-core-body">Aprobadas este mes</p>
      <div className="mt-1 flex items-end justify-between gap-4">
        <p className="text-[44px] font-extrabold leading-none tabular-nums">19</p>
        <span aria-hidden="true" className="flex h-12 flex-1 items-end gap-1.5">
          {bars.map((b, i) => (
            <span
              key={i}
              className={`flex-1 rounded-t ${i === bars.length - 1 ? 'bg-core-violet' : 'bg-core-violet/25'}`}
              style={{ height: `${(b / max) * 100}%` }}
            />
          ))}
        </span>
      </div>
    </Card>
  )
}

function DocCard() {
  return (
    <Card tone="blue">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-core-blue-soft text-core-blue">
          <FileText className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">Contrato de servicio v3</p>
          <p className="text-xs text-core-body">Firmado por 2 de 3</p>
        </div>
      </div>
      <div aria-hidden="true" className="mt-3 h-2 overflow-hidden rounded-full bg-white/70">
        <div className="h-full w-2/3 rounded-full bg-core-lime" />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <AvatarStack people={['laura', 'camila', 'andres']} ring="ring-white" />
        <span className="text-xs font-semibold tabular-nums text-core-body">66 %</span>
      </div>
    </Card>
  )
}

export function DayToDay() {
  return (
    <section aria-labelledby="lf-dia-title" className="relative isolate overflow-hidden bg-core-navy py-24 text-white lg:py-32">
      <Atmos mesh="c" />
      <Tri tone="mix" size="xl" mask="tr" />
      <Tri tone="lime" size="lg" mask="bl" className="opacity-70" />
      <TriEdge at="top" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8">
        <Reveal as="h2" id="lf-dia-title" className="max-w-[18ch] text-balance text-[clamp(2rem,4.4vw,3.5rem)] font-extrabold leading-[1.04] tracking-[-0.03em]">
          Así se ve el día a día.
        </Reveal>
        <Reveal as="p" delay={70} className="mt-5 max-w-[56ch] text-[17px] leading-[1.6] text-slate-200">
          Tareas, aprobaciones y documentos avanzan en una sola vista, y cada persona ve lo que le toca. Todo con datos de ejemplo.
        </Reveal>

        <Parallax className="mt-14 lg:mt-20">
          <Stagger className="grid gap-5 sm:grid-cols-2 lg:hidden">
            <TasksCard />
            <RequestCard />
            <KpiCard />
            <DocCard />
          </Stagger>

          <div className="relative hidden h-[620px] lg:block">
            <Depth d={14} s={22} className="absolute left-0 top-[110px] z-10 w-[380px]">
              <div className="-rotate-3 scale-[0.96]">
                <RequestCard />
              </div>
            </Depth>
            <Depth d={20} s={-16} className="absolute left-[29%] top-[20px] z-20 w-[420px]">
              <TasksCard />
            </Depth>
            <Depth d={12} s={30} className="absolute right-[3%] top-[0px] z-10 w-[310px]">
              <div className="rotate-2 scale-[0.96]">
                <KpiCard />
              </div>
            </Depth>
            <Depth d={26} s={-30} className="absolute right-[10%] top-[250px] z-30 w-[330px]">
              <DocCard />
            </Depth>
            <Depth d={34} s={-40} bob={300} className="absolute bottom-[40px] left-[6%] z-40">
              <Notif who="mateo" tone="cyan" title="Mateo comentó" text="Contrato v3 · falta tu firma" />
            </Depth>
            <Depth d={30} s={-24} bob={1400} className="absolute bottom-[0px] left-[38%] z-40">
              <Notif who="camila" tone="violet" title="Compras recibió" text="Solicitud 118 · $14.400.000" />
            </Depth>
          </div>
        </Parallax>
      </div>
    </section>
  )
}

const fmtInt = (n) => Math.round(n).toLocaleString('es-CO')

function Metric({ value, suffix = '', label, note, decimals = 0, tag }) {
  const [ref, inView] = useInView({ threshold: 0.4, once: true })
  const v = useCountUp(value, { active: inView, duration: 1100 })
  const text = decimals ? v.toFixed(decimals).replace('.', ',') : fmtInt(v)
  return (
    <div ref={ref} style={{ '--lf-spot': 'rgba(16, 18, 40, 0.24)' }} className="lf-spot lf-lift h-full rounded-2xl border border-white/25 bg-core-navy-deep/55 p-5 sm:p-6">
      <p className="flex items-baseline gap-1.5 text-[clamp(2.75rem,5vw,3.75rem)] font-extrabold leading-none tracking-[-0.03em] tabular-nums">
        <span aria-hidden="true">{text}</span>
        <span className="sr-only">{fmtInt(value)}</span>
        {suffix && <span className="text-2xl font-bold">{suffix}</span>}
      </p>
      <p className="mt-3 text-[15px] font-semibold leading-snug text-white">{label}</p>
      <p className="mt-1 text-[13px] leading-snug text-white">
        {tag && <span className="mr-1.5 rounded bg-white px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-core-navy">{tag}</span>}
        {note}
      </p>
    </div>
  )
}

/** Banda de color de marca con cifras reales del producto; lo que no es dato real va rotulado "Ejemplo". */
export function MetricsBand({ moduleCount = 8 }) {
  const biz = PLANS_CATALOG.business.limits
  return (
    <section
      aria-label="Cifras del producto"
      className="relative isolate overflow-hidden py-16 text-white lg:py-20"
      style={{ background: 'linear-gradient(115deg, #2D5BD1 0%, #5A3FD6 100%)' }}
    >
      <Tri tone="mix" size="lg" mask="tr" />
      <Tri tone="cyan" size="lg" mask="bl" className="opacity-80" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8">
        <Reveal as="p" className="flex items-center gap-2 text-[15px] font-semibold text-white">
          <TriangleMark accent="lime" className="h-3 w-3" />
          Lo que cabe en CoreFlow Business
        </Reveal>
        <Stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Metric value={moduleCount} label="módulos en un solo lugar" note="De clientes a reportes." />
          <Metric value={biz.maxCollaborators} label="colaboradores por organización" note="Con permisos por rol." />
          <Metric value={biz.maxBranches} label="sedes conectadas" note="Datos aislados por organización." />
          <Metric value={1.8} decimals={1} suffix="días" label="para aprobar una solicitud" note="Cifra ilustrativa de la demo." tag="Ejemplo" />
        </Stagger>
      </div>
    </section>
  )
}
