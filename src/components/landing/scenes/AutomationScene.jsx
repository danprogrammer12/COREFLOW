import React, { useState } from 'react'
import { CheckSquare, GitBranch, Inbox } from 'lucide-react'
import { SceneWindow, Switch } from '../ui'
import { useInView, usePageVisible } from '../hooks'

const NODES = [
  { kind: 'Disparador', text: 'Se aprueba una solicitud', icon: Inbox, tone: 'border-core-cyan bg-core-cyan-soft' },
  { kind: 'Condición', text: 'El monto supera $5.000.000', icon: GitBranch, tone: 'border-core-violet bg-core-violet-soft' },
  { kind: 'Acción', text: 'Crear tarea y avisar a Gerencia', icon: CheckSquare, tone: 'border-core-lime bg-core-lime-soft' },
]

function Connector({ delay, off, play }) {
  return (
    <div aria-hidden="true" className="relative mx-auto h-11 w-0.5 bg-core-border">
      <span
        data-off={off ? 'true' : 'false'}
        className="lf-pulse absolute -left-[5px] top-0 block h-3 w-3 rounded-full bg-core-violet"
        style={{ '--lf-d': `${delay}ms`, '--lf-play': play ? 'running' : 'paused' }}
      />
    </div>
  )
}

export function AutomationScene() {
  const [on, setOn] = useState(true)
  const [ref, inView] = useInView({ threshold: 0.2 })
  const visible = usePageVisible()
  const play = inView && visible

  return (
    <div ref={ref} role="group" aria-label="Automatización de ejemplo. Puedes apagar la regla.">
      <SceneWindow title="Automatizaciones" bodyClassName="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-core-navy">Regla: aprobaciones grandes</p>
          <div className="flex items-center gap-1">
            <span className="text-[13px] font-semibold text-core-navy" aria-hidden="true">
              {on ? 'Activa' : 'Apagada'}
            </span>
            <Switch checked={on} onChange={setOn} label="Regla activa" />
          </div>
        </div>
        <div className={`mx-auto mt-3 max-w-sm transition-opacity duration-300 ${on ? '' : 'opacity-60'}`}>
          {NODES.map(({ kind, text, icon: Icon, tone }, i) => (
            <React.Fragment key={kind}>
              <div className={`lf-in flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 ${on ? tone : 'border-core-border bg-core-cloud'}`} style={{ '--lf-d': `${i * 90}ms` }}>
                <Icon className="h-5 w-5 shrink-0 text-core-navy" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-core-body">{kind}</p>
                  <p className="text-sm font-semibold text-core-navy">{text}</p>
                </div>
              </div>
              {i < NODES.length - 1 && <Connector delay={i * 1150} off={!on} play={play} />}
            </React.Fragment>
          ))}
        </div>
      </SceneWindow>
    </div>
  )
}
