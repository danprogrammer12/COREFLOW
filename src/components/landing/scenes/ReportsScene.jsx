import React, { useState } from 'react'
import { SceneWindow } from '../ui'
import { useCountUp } from '../hooks'

const DATA = {
  mes: {
    label: 'Mes',
    bars: [4, 6, 5, 8, 7, 3, 2],
    axis: ['Lun', 'Jue', 'Dom'],
    unit: 'Solicitudes cerradas por día',
    days: 1.8,
    tasks: 126,
  },
  trimestre: {
    label: 'Trimestre',
    bars: [14, 18, 16, 22, 25, 24, 31],
    axis: ['Semana 1', 'Semana 7', 'Semana 13'],
    unit: 'Solicitudes cerradas por quincena',
    days: 2.1,
    tasks: 342,
  },
}

function Kpi({ label, value, decimals = 0 }) {
  const v = useCountUp(value, { duration: 900 })
  const text = decimals ? v.toFixed(decimals).replace('.', ',') : Math.round(v).toLocaleString('es-CO')
  return (
    <div className="min-w-0 rounded-xl bg-core-cloud p-3">
      <p className="truncate text-xs text-core-body">{label}</p>
      <p className="mt-1 text-[28px] font-extrabold leading-none tabular-nums text-core-navy sm:text-[34px]">{text}</p>
    </div>
  )
}

export function ReportsScene() {
  const [period, setPeriod] = useState('mes')
  const d = DATA[period]
  const total = d.bars.reduce((s, n) => s + n, 0)
  const max = Math.max(...d.bars)

  return (
    <div role="group" aria-label="Reportes de ejemplo. Cambia entre mes y trimestre.">
      <SceneWindow title="Reportes e indicadores" bodyClassName="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-core-navy">{d.unit}</p>
          <div className="flex shrink-0 gap-1 rounded-xl bg-core-cloud p-1">
            {Object.entries(DATA).map(([key, v]) => (
              <button
                key={key}
                type="button"
                aria-pressed={period === key}
                onClick={() => setPeriod(key)}
                className={`h-9 rounded-lg px-3 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-core-violet ${
                  period === key ? 'bg-white text-core-navy shadow-card' : 'text-core-body hover:text-core-navy'
                }`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Kpi label="Cerradas" value={total} />
          <Kpi label="Días de aprobación" value={d.days} decimals={1} />
          <Kpi label="Tareas completadas" value={d.tasks} />
        </div>
        <div
          role="img"
          aria-label={`Barras de ${d.unit.toLowerCase()}: ${d.bars.join(', ')}. Total ${total}.`}
          className="mt-5"
        >
          <div className="flex h-32 items-end gap-2 border-b border-core-border">
            {d.bars.map((v, i) => {
              const last = i === d.bars.length - 1
              return (
                <div key={i} className="relative flex h-full flex-1 items-end">
                  <span
                    className={`lf-bar block w-full rounded-t ${last ? 'bg-core-violet' : 'bg-core-violet/25'}`}
                    style={{ height: '100%', transform: `scaleY(${v / max})` }}
                  />
                </div>
              )
            })}
          </div>
          <div className="mt-1.5 flex justify-between text-xs tabular-nums text-core-body">
            {d.axis.map((a) => (
              <span key={a}>{a}</span>
            ))}
          </div>
        </div>
      </SceneWindow>
    </div>
  )
}
