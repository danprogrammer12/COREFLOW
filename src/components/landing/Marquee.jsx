// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React, { useRef } from 'react'
import { TriangleMark } from '../brand/BrandShapes'
import { Tri, useLiveClass } from './atmos'

const ITEMS = [
  ['cyan', 'Clientes y cuentas'],
  ['cyan', 'Pipeline comercial'],
  ['cyan', 'Tareas'],
  ['cyan', 'Control documental'],
  ['lime', 'Solicitudes'],
  ['lime', 'Aprobaciones'],
  ['lime', 'Roles y auditoría'],
  ['lime', 'Automatizaciones'],
  ['cyan', 'Reportes e indicadores'],
]

function Row({ dup = false }) {
  return (
    <ul
      aria-hidden="true"
      className={`flex shrink-0 items-center gap-10 pr-10 ${dup ? 'lf-marquee-dup' : ''}`}
    >
      {ITEMS.map(([accent, label]) => (
        <li key={label} className="flex items-center gap-10 whitespace-nowrap text-[15px] font-semibold tracking-tight text-white">
          {label}
          <TriangleMark accent={accent} className="h-3 w-3" />
        </li>
      ))}
    </ul>
  )
}

/** Franja inclinada de color de marca con los módulos. Decorativa: el contenido está en el explorador. */
export function ModuleMarquee() {
  const ref = useRef(null)
  useLiveClass(ref)
  return (
    <div ref={ref} aria-hidden="true" className="relative z-10 -mt-12 overflow-hidden bg-core-navy-deep py-10 lg:-mt-20">
      <div
        className="relative -mx-6 -rotate-[1.4deg] overflow-hidden py-4 shadow-[0_20px_50px_-20px_rgba(101,69,232,0.8)]"
        style={{ background: 'linear-gradient(90deg, #2D5BD1 0%, #5A3FD6 50%, #2D5BD1 100%)' }}
      >
        <Tri tone="navy" mask="none" />
        <div className="relative overflow-hidden">
          <div className="lf-marquee-track">
            <Row />
            <Row dup />
          </div>
        </div>
      </div>
    </div>
  )
}
