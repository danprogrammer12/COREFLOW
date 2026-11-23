import React, { useState } from 'react'
import { PLANS_CATALOG } from '../../core/config/plansCatalog'
import { TriangleCluster } from '../brand/BrandShapes'
import { Atmos, Tri, TriEdge } from './atmos'
import { PlanCard } from './PlanCard'
import { DEMO_BUSINESS, DEMO_STARTER, Reveal } from './ui'
import { useCountUp } from './hooks'

const WEEKS_PER_MONTH = 4.3
const fmt1 = (n) => n.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function Slider({ id, label, hint, value, min, max, step = 1, onChange, suffix = '' }) {
  const fill = `${((value - min) / (max - min)) * 100}%`
  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={id} className="text-[15px] font-semibold text-white">
          {label}
        </label>
        <output htmlFor={id} className="whitespace-nowrap text-xl font-extrabold tabular-nums text-core-lime">
          {value}
          {suffix}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="lf-range mt-1"
        style={{ '--fill': fill }}
      />
      <p className="text-[13px] text-slate-200">{hint}</p>
    </div>
  )
}

export function PlansSection({ demoHandler, pendingDemoId, busy, onLogin }) {
  const maxTeam = PLANS_CATALOG.business.limits.maxCollaborators
  const [team, setTeam] = useState(10)
  const [hours, setHours] = useState(12)
  const [pct, setPct] = useState(30)

  const recovered = hours * WEEKS_PER_MONTH * (pct / 100)
  const shown = useCountUp(recovered, { duration: 600 })
  const recommended = team <= PLANS_CATALOG.starter.limits.maxCollaborators ? 'starter' : 'business'
  const plan = PLANS_CATALOG[recommended]

  return (
    <section id="planes" className="relative isolate scroll-mt-16 overflow-hidden bg-core-navy-deep px-3 py-14 sm:px-6 lg:py-24">
      <Atmos mesh="d" dots={false} />
      <Tri tone="mix" size="xl" mask="x" className="opacity-70" />
      <TriEdge at="top" />
      <div className="relative z-10 mx-auto max-w-7xl overflow-hidden lf-panel-brand lf-glow-border rounded-[28px] px-5 py-14 shadow-[0_50px_100px_-30px_rgba(101,69,232,0.7)] sm:rounded-[40px] sm:px-10 lg:px-16 lg:py-20">
        <Tri tone="mix" size="lg" mask="tr" />
        <Tri tone="cyan" size="lg" mask="bl" className="opacity-80" />
        <TriangleCluster accent="violet" className="!-right-1 !-top-1 !h-20 !w-36 sm:!h-[110px] sm:!w-[190px]" />
        <TriangleCluster accent="cyan" className="!right-24 !top-0 hidden !h-12 !w-20 sm:block" />
        <Reveal as="h2" className="max-w-[20ch] text-balance text-[clamp(2rem,4.4vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">
          ¿Cuánto tiempo recuperas?
        </Reveal>
        <Reveal as="p" delay={70} className="mt-5 max-w-[62ch] text-[17px] leading-[1.6] text-slate-100">
          Ajusta los tres datos con la realidad de tu equipo. La cuenta es tuya, no una promesa.
        </Reveal>

        <Reveal delay={100} className="mt-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div className="lf-card-glass space-y-6 rounded-2xl bg-core-navy-deep/60 p-6 sm:p-8">
            <Slider id="lf-team" label="Colaboradores" hint="Personas que usarían CoreFlow." value={team} min={1} max={maxTeam} onChange={setTeam} />
            <Slider
              id="lf-hours"
              label="Horas por semana en seguimiento manual"
              hint="Tiempo total del equipo en hojas de cálculo y chats."
              value={hours}
              min={1}
              max={80}
              onChange={setHours}
            />
            <Slider
              id="lf-pct"
              label="Porcentaje que automatizarías"
              hint="Por defecto 30 %. Cámbialo según tus procesos."
              value={pct}
              min={5}
              max={80}
              step={5}
              onChange={setPct}
              suffix=" %"
            />
          </div>

          <div className="lf-spot relative flex flex-col justify-center overflow-hidden lf-glow-border rounded-2xl bg-core-navy-deep/85 p-6 text-white shadow-float sm:p-8">
            <div aria-hidden="true" className="lf-glow -right-16 -top-16 h-64 w-64" style={{ '--lf-glow': 'rgba(101, 69, 232, 0.7)' }} />
            <div aria-hidden="true" className="lf-glow -bottom-20 left-0 h-56 w-56" style={{ '--lf-glow': 'rgba(166, 233, 28, 0.18)' }} />
            <p className="relative text-[15px] font-semibold text-slate-200">Horas al mes que podrías recuperar</p>
            <p className="relative mt-2 text-[clamp(3.5rem,8vw,5rem)] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-core-lime" aria-hidden="true">
              {fmt1(shown)}
            </p>
            <p className="sr-only" role="status">
              {fmt1(recovered)} horas al mes recuperadas
            </p>
            <p className="relative mt-5 text-[15px] leading-relaxed text-white">
              <span className="tabular-nums">
                {hours} h × {WEEKS_PER_MONTH.toLocaleString('es-CO')} semanas × {pct} % = {fmt1(recovered)} h
              </span>
            </p>
            <p className="relative mt-2 text-[13px] leading-relaxed text-slate-300">
              Fórmula: horas por semana × 4,3 semanas al mes × porcentaje que automatizarías. Es una estimación con tus
              propios datos, no es una promesa.
            </p>
            <p className="relative mt-5 border-t border-white/15 pt-4 text-[15px] text-white">
              Para {team} {team === 1 ? 'colaborador' : 'colaboradores'} te encaja <strong>{plan.displayName}</strong> (
              {plan.collaboratorsRangeLabel}).
            </p>
          </div>
        </Reveal>

        <Reveal as="h3" className="mt-20 max-w-[28ch] text-balance text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold leading-[1.15] tracking-[-0.02em] text-white">
          Empieza pequeño y crece sin cambiar de herramienta.
        </Reveal>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <Reveal>
            <PlanCard
              plan={PLANS_CATALOG.starter}
              demo={DEMO_STARTER}
              onStartDemo={demoHandler}
              pendingId={pendingDemoId}
              disabled={busy}
              onLogin={onLogin}
              recommended={recommended === 'starter'}
            />
          </Reveal>
          <Reveal delay={70}>
            <PlanCard
              plan={PLANS_CATALOG.business}
              featured
              demo={DEMO_BUSINESS}
              onStartDemo={demoHandler}
              pendingId={pendingDemoId}
              disabled={busy}
              onLogin={onLogin}
              recommended={recommended === 'business'}
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
