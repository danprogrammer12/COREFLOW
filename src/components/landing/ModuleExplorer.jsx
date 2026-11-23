// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React, { useRef, useState } from 'react'
import { TriangleMark } from '../brand/BrandShapes'
import { Atmos, Depth, Parallax, Tri, TriEdge } from './atmos'
import { AvatarStack, CursorTag, Notif, SparkCard, StatusChip } from './floaters'
import { FOCUS_DARK, Reveal } from './ui'
import { ClientScene } from './scenes/ClientScene'
import { PipelineScene } from './scenes/PipelineScene'
import { RequestsScene } from './scenes/RequestsScene'
import { TasksScene } from './scenes/TasksScene'
import { AutomationScene } from './scenes/AutomationScene'
import { DocumentsScene } from './scenes/DocumentsScene'
import { ReportsScene } from './scenes/ReportsScene'
import { RolesScene } from './scenes/RolesScene'

const GROUPS = [
  { id: 'organiza', label: 'Organiza', accent: 'cyan', glow: 'rgba(8, 201, 232, 0.4)' },
  { id: 'conecta', label: 'Conecta', accent: 'violet', glow: 'rgba(101, 69, 232, 0.6)' },
  { id: 'evoluciona', label: 'Evoluciona', accent: 'lime', glow: 'rgba(166, 233, 28, 0.3)' },
]

export const MODULES = [
  { id: 'clientes', group: 'organiza', title: 'Clientes y cuentas', text: 'Ficha única de cada cliente con su contexto y su historial.', Scene: ClientScene },
  { id: 'pipeline', group: 'organiza', title: 'Pipeline comercial', text: 'Oportunidades por etapa para saber qué está por cerrarse. Arrastra una tarjeta.', Scene: PipelineScene },
  { id: 'tareas', group: 'organiza', title: 'Tareas', text: 'Trabajo del equipo con responsable, estado y vista de pendientes.', Scene: TasksScene },
  { id: 'documentos', group: 'organiza', title: 'Control documental', text: 'Carga, descarga autorizada e historial de versiones de cada documento.', Scene: DocumentsScene },
  { id: 'solicitudes', group: 'conecta', title: 'Solicitudes', text: 'Pedidos internos con estados, responsables y aprobaciones.', Scene: RequestsScene },
  { id: 'roles', group: 'conecta', title: 'Roles, auditoría y privacidad', text: 'Datos aislados por organización y registro de cada cambio. Prueba cambiar de rol.', Scene: RolesScene },
  { id: 'automatizaciones', group: 'evoluciona', title: 'Automatizaciones', text: 'Reglas que repiten por ti los pasos que siempre son los mismos.', Scene: AutomationScene },
  { id: 'reportes', group: 'evoluciona', title: 'Reportes e indicadores', text: 'Comparativos por periodo para entender la operación de un vistazo.', Scene: ReportsScene },
]

// Elementos flotantes por módulo (solo desde md). Datos de ejemplo.
const FLOATERS = {
  clientes: (
    <>
      <Depth d={20} s={-22} bob={200} className="absolute -right-3 top-10 lg:-right-8">
        <Notif who="laura" tone="violet" title="Laura añadió una nota" text="Distribuidora Andina · hace 2 min" />
      </Depth>
      <Depth d={28} s={18} bob={900} className="absolute -left-4 bottom-24 lg:-left-8">
        <CursorTag name="Mateo" tone="cyan" />
      </Depth>
    </>
  ),
  pipeline: (
    <>
      <Depth d={18} s={-26} bob={0} className="absolute -right-3 -top-3 lg:-right-8">
        <StatusChip tone="lime">$19.700.000 en juego</StatusChip>
      </Depth>
      <Depth d={30} s={22} bob={700} className="absolute -left-4 bottom-20 lg:-left-8">
        <CursorTag name="Camila" tone="lime" />
      </Depth>
    </>
  ),
  tareas: (
    <>
      <Depth d={22} s={-18} bob={300} className="absolute -right-3 top-16 lg:-right-8">
        <Notif who="mateo" tone="cyan" title="Tarea completada" text="Revisar facturas · Mateo" />
      </Depth>
      <Depth d={14} s={20} bob={1200} className="absolute -left-3 -top-3 lg:-left-6">
        <StatusChip tone="cyan">3 pendientes hoy</StatusChip>
      </Depth>
    </>
  ),
  documentos: (
    <>
      <Depth d={20} s={-24} bob={500} className="absolute -right-3 top-12 lg:-right-8">
        <Notif who="andres" tone="violet" title="Nueva versión v3" text="Contrato de servicio · 4 páginas" />
      </Depth>
      <Depth d={16} s={20} bob={1000} className="absolute -left-4 -top-3 lg:-left-8">
        <StatusChip tone="violet">Descarga autorizada</StatusChip>
      </Depth>
    </>
  ),
  solicitudes: (
    <>
      <Depth d={22} s={-22} bob={100} className="absolute -right-3 top-10 lg:-right-8">
        <Notif who="camila" tone="lime" title="Gerencia aprobó" text="Portátiles · $14.400.000" />
      </Depth>
      <Depth d={14} s={18} bob={800} className="absolute -left-4 bottom-16 lg:-left-8">
        <AvatarStack people={['laura', 'mateo', 'andres']} ring="ring-[#101228]" />
      </Depth>
    </>
  ),
  roles: (
    <>
      <Depth d={18} s={-20} bob={400} className="absolute -right-3 -top-3 lg:-right-8">
        <StatusChip tone="violet">Datos aislados por organización</StatusChip>
      </Depth>
      <Depth d={26} s={20} bob={1100} className="absolute -left-4 bottom-24 lg:-left-8">
        <CursorTag name="Ana" tone="violet" />
      </Depth>
    </>
  ),
  automatizaciones: (
    <>
      <Depth d={20} s={-22} bob={600} className="absolute -right-3 top-10 lg:-right-8">
        <Notif who="mateo" tone="lime" title="Regla ejecutada" text="Tarea creada · hace 1 min" />
      </Depth>
      <Depth d={14} s={18} bob={0} className="absolute -left-3 -top-3 lg:-left-6">
        <StatusChip tone="lime">Regla activa</StatusChip>
      </Depth>
    </>
  ),
  reportes: (
    <>
      <Depth d={18} s={-22} bob={200} className="absolute -right-3 top-8 lg:-right-10">
        <SparkCard label="Tareas completadas" value="126" bars={[3, 4, 4, 6, 7, 9]} />
      </Depth>
      <Depth d={24} s={20} bob={900} className="absolute -left-4 bottom-20 lg:-left-8">
        <CursorTag name="Laura" tone="violet" />
      </Depth>
    </>
  ),
}

export function ModuleExplorer() {
  const [active, setActive] = useState(0)
  const listRef = useRef(null)
  const current = MODULES[active]
  const group = GROUPS.find((g) => g.id === current.group)

  const select = (i, focus = false) => {
    setActive(i)
    if (focus) listRef.current?.querySelector(`#lf-mod-tab-${i}`)?.focus()
  }

  const onKeyDown = (e) => {
    const n = MODULES.length
    let next = null
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') next = (active + 1) % n
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') next = (active - 1 + n) % n
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = n - 1
    if (next === null) return
    e.preventDefault()
    select(next, true)
  }

  return (
    <section id="funciones" className="relative isolate scroll-mt-16 overflow-clip bg-core-navy-deep py-24 text-white lg:py-32">
      <Atmos mesh="b" grid />
      <Tri tone="mix" size="xl" mask="tr" />
      <Tri tone="cyan" size="lg" mask="br" className="opacity-70" />
      <TriEdge at="top" />
      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8">
        <Reveal as="h2" className="max-w-[20ch] text-balance text-[clamp(2rem,4.4vw,3.5rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">
          Un solo lugar para lo que hoy está en cinco.
        </Reveal>
        <Reveal as="p" delay={70} className="mt-5 max-w-[62ch] text-[17px] leading-[1.6] text-slate-200">
          Elige un módulo y míralo funcionar con datos de ejemplo. Tres de ellos puedes tocarlos.
        </Reveal>

        <div className="mt-10 grid grid-cols-[minmax(0,1fr)] gap-8 lg:mt-14 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14">
          <div
            ref={listRef}
            role="tablist"
            aria-label="Módulos de CoreFlow"
            aria-orientation="vertical"
            onKeyDown={onKeyDown}
            className="lf-no-scrollbar relative -mx-6 flex gap-2 overflow-x-auto px-6 py-1 lg:mx-0 lg:block lg:space-y-6 lg:overflow-visible lg:px-0"
          >
            {GROUPS.map((g) => (
              <div key={g.id} role="presentation" className="flex gap-2 lg:block">
                <p aria-hidden="true" className="mb-1.5 hidden items-center gap-2 text-[13px] font-bold uppercase tracking-wider text-slate-300 lg:flex">
                  <TriangleMark accent={g.accent} className="h-3 w-3" />
                  {g.label}
                </p>
                <div role="presentation" className="flex gap-2 lg:block lg:space-y-1.5">
                  {MODULES.map((m, i) =>
                    m.group !== g.id ? null : (
                      <button
                        key={m.id}
                        id={`lf-mod-tab-${i}`}
                        type="button"
                        role="tab"
                        aria-selected={active === i}
                        aria-controls="lf-mod-panel"
                        tabIndex={active === i ? 0 : -1}
                        onClick={() => select(i)}
                        className={`lf-spot flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-xl border px-4 py-2 text-left text-[15px] font-semibold transition-all duration-150 lg:w-full lg:whitespace-normal ${FOCUS_DARK} ${
                          active === i
                            ? 'border-core-lime bg-core-lime text-core-navy shadow-[0_12px_32px_-12px_rgba(166,233,28,0.45)] lg:translate-x-2'
                            : 'border-white/15 bg-white/5 text-slate-200 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/10 hover:text-white lg:hover:translate-x-1 lg:hover:translate-y-0'
                        }`}
                      >
                        <TriangleMark accent={g.accent} className="h-2.5 w-2.5 lg:hidden" />
                        <span className="sr-only">{g.label}: </span>
                        {m.title}
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="min-w-0 lg:sticky lg:top-24 lg:self-start">
            <Parallax className="relative">
              <div
                aria-hidden="true"
                className="lf-glow left-[8%] top-[4%] h-[92%] w-[86%] transition-[background] duration-500"
                style={{ '--lf-glow': group.glow }}
              />
              <div
                id="lf-mod-panel"
                role="tabpanel"
                aria-labelledby={`lf-mod-tab-${active}`}
                tabIndex={-1}
                className="relative lf-glow-border rounded-3xl bg-white/[0.05] p-3 outline-none sm:p-6 lg:min-h-[480px]"
              >
                <div key={current.id} className="lf-scene-in">
                  <current.Scene />
                </div>
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden md:block">
                  <div key={current.id} className="lf-scene-in absolute inset-0">
                    {FLOATERS[current.id]}
                  </div>
                </div>
              </div>
            </Parallax>
            <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-slate-200">
              <span className="font-semibold text-white">{current.title}.</span> {current.text}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
