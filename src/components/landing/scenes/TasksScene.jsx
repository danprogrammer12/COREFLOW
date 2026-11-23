import React, { useEffect, useState } from 'react'
import { SceneWindow } from '../ui'
import { useReducedMotion } from '../hooks'

const TASKS = [
  { id: 'a', text: 'Confirmar reunión con Textiles Sur', who: 'Luis G.', done: true },
  { id: 'b', text: 'Enviar cotización a Distribuidora Andina', who: 'Ana R.', completes: true },
  { id: 'c', text: 'Cargar contrato v3', who: 'Marta P.' },
  { id: 'd', text: 'Llamar a Café Tairona', who: 'Luis G.' },
  { id: 'e', text: 'Revisar facturas del viernes', who: 'Ana R.' },
]

function CheckMark({ staticDraw }) {
  return (
    <svg viewBox="0 0 16 16" className={`lf-check h-4 w-4 ${staticDraw ? 'lf-check-static' : ''}`} fill="none">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" pathLength="1" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TasksScene() {
  const reduced = useReducedMotion()
  const [done, setDone] = useState(reduced)
  useEffect(() => {
    if (reduced) {
      setDone(true)
      return undefined
    }
    const t = setTimeout(() => setDone(true), 1100)
    return () => clearTimeout(t)
  }, [reduced])
  const pending = TASKS.filter((t) => !t.done && !(t.completes && done)).length

  return (
    <div aria-hidden="true">
      <SceneWindow title="Tareas del equipo" bodyClassName="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-core-navy">Esta semana</p>
          <span className="rounded-full bg-core-violet-soft px-3 py-1 text-[13px] font-semibold tabular-nums text-core-violet">
            {pending} pendientes
          </span>
        </div>
        <ul className="space-y-2">
          {TASKS.map((t, i) => {
            const checked = t.done || (t.completes && done)
            return (
              <li
                key={t.id}
                className="lf-in flex items-center gap-3 rounded-xl border border-core-border px-3 py-2.5"
                style={{ '--lf-d': `${i * 70}ms` }}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    checked ? 'border-core-violet bg-core-violet' : 'border-[#8B93AE] bg-white'
                  }`}
                >
                  {checked && <CheckMark staticDraw={t.done} />}
                </span>
                <span className={`min-w-0 flex-1 truncate text-sm ${checked ? 'text-core-body line-through' : 'font-medium text-core-navy'}`}>
                  {t.text}
                </span>
                <span className="shrink-0 text-xs text-core-body">{t.who}</span>
              </li>
            )
          })}
        </ul>
      </SceneWindow>
    </div>
  )
}
