// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Tri } from './atmos'
import { FOCUS_DARK } from './ui'

function formatStorage(mb) {
  if (!mb) return null
  return `${Math.round(mb / 1024)} GB de almacenamiento`
}

export function planFeatures(plan) {
  const { limits, features } = plan
  const items = [`${plan.collaboratorsRangeLabel}`]
  items.push(limits.maxBranches === 1 ? 'Una sede' : `Hasta ${limits.maxBranches} sedes`)
  items.push('Clientes, comercial, solicitudes, tareas y documentos')
  if (limits.maxActiveAutomations) items.push(`Hasta ${limits.maxActiveAutomations} automatizaciones activas`)
  else items.push('Automatizaciones sin tope fijo')
  if (limits.maxAdmins) items.push(`Hasta ${limits.maxAdmins} administradores`)
  if (features.departmentsAndTeams) items.push('Departamentos y equipos')
  if (features.multilevelApprovals) items.push('Aprobaciones multinivel')
  if (features.granularPermissions) items.push('Permisos granulares')
  const storage = formatStorage(limits.maxStorageMb)
  if (storage) items.push(storage)
  return items
}

export function PlanCard({ plan, featured, demo, onStartDemo, pendingId, disabled, onLogin, recommended = false }) {
  const pending = pendingId === demo.id
  return (
    <div
      className={`lf-spot lf-lift relative flex flex-col rounded-2xl p-7 ${featured ? '' : 'lf-spot-light'} ${
        featured ? 'lf-glow-border bg-core-navy-deep/90 text-white shadow-float' : 'lf-glow-border bg-core-navy-deep/80 text-white shadow-float'
      } ${recommended ? 'ring-2 ring-core-lime ring-offset-4 ring-offset-[#1c1f55]' : ''}`}
      style={featured ? undefined : { '--lf-gb-a': '#08C9E8', '--lf-gb-b': '#3568E8', '--lf-gb-c': '#6545E8' }}
    >
      <span aria-hidden="true" className="lf-bar-brand absolute inset-x-6 top-0 h-[3px] rounded-b" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
        <Tri tone={featured ? 'lime' : 'cyan'} mask="tr" />
      </div>
      {recommended && (
        <span className="absolute -top-3.5 left-6 z-10 rounded-full bg-core-violet px-3 py-1 text-xs font-semibold text-white">
          Recomendado para tu equipo
        </span>
      )}
      <p className={`relative text-base font-semibold ${featured ? 'text-core-lime' : 'text-core-cyan'}`}>{plan.displayName}</p>
      <p className="mt-3 flex items-baseline gap-1">
        <span className="text-4xl font-extrabold tracking-tight tabular-nums">${plan.priceMonthlyUsd}</span>
        <span className={`text-sm text-slate-200`}>USD al mes</span>
      </p>
      <p className={`relative mt-3 text-sm leading-relaxed text-slate-200`}>
        {featured
          ? 'Para organizaciones que crecen y necesitan áreas, permisos y más control.'
          : 'Para equipos pequeños que quieren ordenar su operación desde el primer día.'}
      </p>
      <ul className="relative mt-6 flex-1 space-y-2.5">
        {planFeatures(plan).map((item) => (
          <li key={item} className="flex items-start gap-2.5 text-sm">
            <Check className={`mt-0.5 h-4 w-4 shrink-0 ${featured ? 'text-core-lime' : 'text-core-cyan'}`} aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {onStartDemo ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onStartDemo(demo)}
          className={`mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60 ${FOCUS_DARK} ${
            featured ? 'bg-core-lime text-core-navy hover:brightness-95' : 'bg-core-cyan text-core-navy hover:brightness-95'
          }`}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-label="Entrando" />
          ) : (
            `Ver demo de ${plan.planCode === 'business' ? 'Business' : 'Starter'}`
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={onLogin}
          className={`mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-core-cyan text-sm font-semibold text-core-navy hover:brightness-95 ${FOCUS_DARK}`}
        >
          Iniciar sesión
        </button>
      )}
    </div>
  )
}
