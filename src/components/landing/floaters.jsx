import React from 'react'
import { Check } from 'lucide-react'

// Personas ficticias de los datos de ejemplo. Texto navy sobre cian/lima, blanco sobre violeta/azul.
const PEOPLE = {
  laura: { initials: 'LM', cls: 'bg-core-violet text-white' },
  mateo: { initials: 'MR', cls: 'bg-core-cyan text-core-navy' },
  camila: { initials: 'CP', cls: 'bg-core-lime text-core-navy' },
  andres: { initials: 'AV', cls: 'bg-core-blue text-white' },
}

export function Avatar({ who = 'laura', size = 'h-7 w-7', ring = 'ring-white' }) {
  const p = PEOPLE[who]
  return (
    <span
      aria-hidden="true"
      className={`inline-flex ${size} shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-2 ${ring} ${p.cls}`}
    >
      {p.initials}
    </span>
  )
}

export function AvatarStack({ people = ['laura', 'mateo', 'camila'], ring = 'ring-core-navy' }) {
  return (
    <span aria-hidden="true" className="flex -space-x-2">
      {people.map((w) => (
        <Avatar key={w} who={w} ring={ring} />
      ))}
    </span>
  )
}

/** Notificación flotante en vidrio oscuro. */
export function Notif({ who = 'laura', title, text, tone = 'lime', className = '' }) {
  const dot = tone === 'lime' ? 'bg-core-lime text-core-navy' : tone === 'cyan' ? 'bg-core-cyan text-core-navy' : 'bg-core-violet text-white'
  return (
    <div className={`lf-glass flex w-[236px] items-start gap-2.5 rounded-xl p-3 ${className}`}>
      <span className="relative shrink-0">
        <Avatar who={who} ring="ring-white/20" size="h-8 w-8" />
        <span className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ${dot}`}>
          <Check className="h-2.5 w-2.5" strokeWidth={3.5} aria-hidden="true" />
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-[13px] font-semibold leading-tight text-white">{title}</span>
        <span className="mt-0.5 block text-xs leading-snug tabular-nums text-slate-300">{text}</span>
      </span>
    </div>
  )
}

/** Cursor de un colaborador: flecha más etiqueta con el nombre. */
export function CursorTag({ name, tone = 'violet', className = '' }) {
  const fill = { violet: '#6545E8', cyan: '#08C9E8', lime: '#A6E91C' }[tone]
  const label = tone === 'violet' ? 'bg-core-violet text-white' : tone === 'cyan' ? 'bg-core-cyan text-core-navy' : 'bg-core-lime text-core-navy'
  return (
    <div aria-hidden="true" className={`pointer-events-none flex items-start ${className}`}>
      <svg width="20" height="22" viewBox="0 0 20 22" className="-mr-0.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.35)]">
        <path d="M2 1.5 17.5 11.2 10 12.7 6.6 20z" fill={fill} stroke="#fff" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
      <span className={`mt-4 rounded-md px-2 py-0.5 text-[11px] font-bold shadow-lg ${label}`}>{name}</span>
    </div>
  )
}

/** Tarjeta de vidrio con mini-gráfico de barras. Valores relativos; el último destaca. */
export function SparkCard({ label, value, bars = [3, 5, 4, 7, 6, 9], className = '' }) {
  const max = Math.max(...bars)
  return (
    <div className={`lf-glass w-[200px] rounded-xl p-3 ${className}`}>
      <p className="text-[11px] font-medium text-slate-300">{label}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-[22px] font-extrabold leading-none tabular-nums text-white">{value}</p>
        <span aria-hidden="true" className="flex h-8 items-end gap-[3px]">
          {bars.map((b, i) => (
            <span
              key={i}
              className={`w-1.5 rounded-sm ${i === bars.length - 1 ? 'bg-core-lime' : 'bg-white/35'}`}
              style={{ height: `${(b / max) * 100}%` }}
            />
          ))}
        </span>
      </div>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Ejemplo</p>
    </div>
  )
}

/** Chip de estado con punto de color. */
export function StatusChip({ tone = 'lime', children, className = '' }) {
  const dot = { lime: 'bg-core-lime', cyan: 'bg-core-cyan', violet: 'bg-core-violet' }[tone]
  return (
    <span className={`lf-glass inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white ${className}`}>
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dot}`} />
      {children}
    </span>
  )
}
