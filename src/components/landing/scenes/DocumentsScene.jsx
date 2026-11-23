import React from 'react'
import { Download } from 'lucide-react'
import { SceneWindow } from '../ui'

const HISTORY = [
  ['v3', 'Marta Pérez', 'hoy'],
  ['v2', 'Luis Gómez', 'hace 3 días'],
  ['v1', 'Ana Ruiz', 'hace 2 semanas'],
]

export function DocumentsScene() {
  return (
    <div aria-hidden="true">
      <SceneWindow title="Control documental" bodyClassName="p-4 sm:p-5">
        <div className="grid gap-5 sm:grid-cols-[1.1fr_1fr]">
          <div className="relative h-[220px]">
            {['v1', 'v2'].map((v, i) => (
              <div
                key={v}
                className="lf-in absolute h-[190px] w-[78%] rounded-lg border border-core-border bg-core-cloud p-3"
                style={{ left: `${i * 9}%`, top: `${i * 9}px`, '--lf-d': `${i * 80}ms` }}
              >
                <span className="text-xs font-semibold text-core-body">{v}</span>
              </div>
            ))}
            <div
              className="lf-in absolute h-[190px] w-[78%] rounded-lg border border-core-border bg-white p-3 shadow-card"
              style={{ left: '18%', top: '24px', '--lf-d': '160ms' }}
            >
              <div className="flex items-center justify-between">
                <span className="rounded bg-core-violet px-1.5 py-0.5 text-xs font-bold text-white">v3</span>
                <span className="text-xs text-core-body">4 páginas</span>
              </div>
              <p className="mt-2 text-[13px] font-bold text-core-navy">Contrato de servicio</p>
              <p className="mt-1.5 text-xs leading-relaxed text-core-body">1. Objeto: soporte y mantenimiento del sistema.</p>
              <p className="mt-1.5 text-xs leading-relaxed text-core-body">
                2. Vigencia:{' '}
                <span className="relative inline-block">
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 origin-left bg-core-lime"
                    style={{ animation: 'lf-grow 500ms var(--cf-ease-out) 800ms both' }}
                  />
                  <span className="relative font-semibold text-core-navy">24 meses</span>
                </span>{' '}
                (antes 12).
              </p>
              <p className="mt-1.5 text-xs leading-relaxed tabular-nums text-core-body">3. Valor mensual: $1.200.000.</p>
            </div>
          </div>
          <div className="min-w-0">
            <span className="inline-flex h-10 items-center gap-2 rounded-lg bg-core-violet px-4 text-sm font-semibold text-white">
              <Download className="h-4 w-4" />
              Descargar v3
            </span>
            <p className="mt-4 text-[13px] font-semibold text-core-navy">Historial</p>
            <ul className="mt-2 space-y-1.5">
              {HISTORY.map(([v, who, when], i) => (
                <li
                  key={v}
                  className="lf-in flex items-center gap-2 rounded-lg bg-core-cloud px-3 py-2 text-xs"
                  style={{ '--lf-d': `${300 + i * 70}ms` }}
                >
                  <span className="font-bold text-core-navy">{v}</span>
                  <span className="min-w-0 flex-1 truncate text-core-body">{who}</span>
                  <span className="shrink-0 text-core-body">{when}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SceneWindow>
    </div>
  )
}
