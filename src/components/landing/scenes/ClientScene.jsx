// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React from 'react'
import { CheckSquare, FileText, Paperclip, Phone } from 'lucide-react'
import { SceneWindow } from '../ui'

const EVENTS = [
  { icon: Phone, tone: 'border-core-cyan bg-core-cyan-soft', title: 'Llamada con Marta Pérez', meta: 'Confirmó interés · hoy, 9:10' },
  { icon: FileText, tone: 'border-core-violet bg-core-violet-soft', title: 'Cotización $4.200.000 enviada', meta: 'Propuesta v2 · ayer' },
  { icon: Paperclip, tone: 'border-core-violet bg-core-violet-soft', title: 'Contrato v3 cargado', meta: 'Documento · hace 2 días' },
  { icon: CheckSquare, tone: 'border-core-lime bg-core-lime-soft', title: 'Seguimiento a la cotización', meta: 'Tarea · vence el viernes' },
]

export function ClientScene() {
  return (
    <div aria-hidden="true">
      <SceneWindow title="Ficha de cliente" bodyClassName="p-4 sm:p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-core-violet-soft text-base font-bold text-core-violet">
            DA
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold text-core-navy">Distribuidora Andina</p>
            <p className="text-[13px] text-core-body">Cliente activo · Barranquilla</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2">
          {[
            ['NIT', '900.123.456-7'],
            ['Contacto', 'Marta Pérez'],
            ['Responsable', 'Ana Ruiz'],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0 rounded-lg bg-core-cloud px-2.5 py-2">
              <dt className="text-xs text-core-body">{k}</dt>
              <dd className="break-words text-[13px] font-semibold tabular-nums text-core-navy">{v}</dd>
            </div>
          ))}
        </dl>
        <ol className="relative mt-5 space-y-3 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-core-border">
          {EVENTS.map(({ icon: Icon, tone, title, meta }, i) => (
            <li key={title} className="lf-in relative flex items-start gap-3" style={{ '--lf-d': `${120 + i * 70}ms` }}>
              <span className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${tone}`}>
                <Icon className="h-4 w-4 text-core-navy" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-semibold text-core-navy">{title}</p>
                <p className="text-xs text-core-body">{meta}</p>
              </div>
            </li>
          ))}
        </ol>
      </SceneWindow>
    </div>
  )
}
