import React from 'react'
import { Check } from 'lucide-react'
import { SceneWindow } from '../ui'

const STEPS = [
  { who: 'Jefe de ventas', name: 'Carlos Rojas', time: '10:42' },
  { who: 'Gerencia', name: 'Lucía Mejía', time: '11:15' },
  { who: 'Compras', name: 'Pedro Salas', time: '11:40' },
]

export function RequestsScene() {
  return (
    <div aria-hidden="true">
      <SceneWindow title="Solicitudes" bodyClassName="p-4 sm:p-5">
        <div className="rounded-xl border border-core-border p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-base font-bold text-core-navy">Compra de 6 portátiles</p>
              <p className="text-[13px] tabular-nums text-core-body">Solicitud n.º 118 · Ventas · $14.400.000</p>
            </div>
            <span
              className="lf-pop rounded-full bg-core-lime px-3 py-1 text-xs font-semibold text-core-navy"
              style={{ '--lf-d': '2600ms' }}
            >
              Aprobada
            </span>
          </div>
          <ol className="mt-5 grid grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.who} className="relative flex flex-col items-center text-center">
                {i < STEPS.length - 1 && (
                  <span aria-hidden="true" className="absolute left-1/2 top-4 h-0.5 w-full bg-core-border">
                    <span
                      className="absolute inset-0 origin-left bg-core-violet"
                      style={{ animation: `lf-grow 500ms var(--cf-ease-out) ${900 + i * 800}ms both` }}
                    />
                  </span>
                )}
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-core-border bg-white">
                  <span
                    className="lf-pop absolute -inset-0.5 flex items-center justify-center rounded-full bg-core-violet"
                    style={{ '--lf-d': `${500 + i * 800}ms` }}
                  >
                    <Check className="h-4 w-4 text-white" />
                  </span>
                </span>
                <p className="mt-2 text-[13px] font-semibold text-core-navy">{s.who}</p>
                <p className="text-xs text-core-body">{s.name}</p>
                <p className="text-xs tabular-nums text-core-body">{s.time}</p>
              </li>
            ))}
          </ol>
        </div>
        <p className="mt-4 text-[13px] text-core-body">
          Cada aprobación queda en el historial con quién la dio y a qué hora.
        </p>
      </SceneWindow>
    </div>
  )
}
