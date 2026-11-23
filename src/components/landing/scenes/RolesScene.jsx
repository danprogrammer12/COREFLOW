// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React, { useState } from 'react'
import { BarChart3, Briefcase, CheckSquare, FileText, Inbox, Lock, Settings, Users } from 'lucide-react'
import { CoreFlowIsotipo } from '../../brand/CoreFlowLogo'
import { SceneWindow } from '../ui'

const ROLES = [
  { id: 'admin', name: 'Admin' },
  { id: 'asesor', name: 'Asesor' },
  { id: 'lectura', name: 'Solo lectura' },
]

const MODULES = [
  { id: 'clientes', label: 'Clientes', icon: Users },
  { id: 'comercial', label: 'Comercial', icon: Briefcase },
  { id: 'solicitudes', label: 'Solicitudes', icon: Inbox },
  { id: 'tareas', label: 'Tareas', icon: CheckSquare },
  { id: 'documentos', label: 'Documentos', icon: FileText },
  { id: 'reportes', label: 'Reportes', icon: BarChart3 },
  { id: 'ajustes', label: 'Roles y ajustes', icon: Settings },
]

const HIDDEN = { admin: [], asesor: ['reportes', 'ajustes'], lectura: ['ajustes'] }

const ACTIONS = [
  { id: 'editar', label: 'Editar cliente', verb: 'editó cliente', roles: ['admin', 'asesor'] },
  { id: 'aprobar', label: 'Aprobar solicitud', verb: 'aprobó solicitud', roles: ['admin'] },
  { id: 'exportar', label: 'Exportar datos', verb: 'exportó datos', roles: ['admin'] },
]

const INITIAL_LOG = [
  'Ana editó cliente · hace 2 min',
  'Luis aprobó solicitud · hace 18 min',
  'Marta cargó documento · hace 1 h',
  'Sistema creó tarea · hace 2 h',
]

export function RolesScene() {
  const [role, setRole] = useState('admin')
  const [log, setLog] = useState(INITIAL_LOG)
  const hidden = HIDDEN[role]
  const roleName = ROLES.find((r) => r.id === role).name

  const run = (action) => setLog((l) => [`Tú (${roleName}) ${action.verb} · ahora`, ...l].slice(0, 4))

  return (
    <div role="group" aria-label="Roles y auditoría de ejemplo. Cambia el rol para ver qué cambia.">
      <SceneWindow title="Roles y auditoría" bodyClassName="">
        <div className="grid grid-cols-[52px_1fr] sm:grid-cols-[148px_1fr]">
          <nav aria-label="Módulos visibles para el rol" className="bg-core-navy p-2 sm:p-3">
            <CoreFlowIsotipo mono="white" className="mx-auto mb-3 h-6 w-6 sm:mx-0" />
            <ul className="space-y-1">
              {MODULES.map(({ id, label, icon: Icon }) => {
                const off = hidden.includes(id)
                return (
                  <li
                    key={id}
                    aria-label={off ? `${label} (sin acceso)` : label}
                    className={`flex h-8 items-center gap-2 rounded-md px-2 text-[13px] transition-opacity ${
                      off ? 'text-slate-500 opacity-50' : id === 'clientes' ? 'bg-core-violet font-semibold text-white' : 'text-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="hidden min-w-0 flex-1 truncate sm:inline">{label}</span>
                    {off && <Lock className="ml-auto hidden h-3 w-3 sm:block" aria-hidden="true" />}
                  </li>
                )
              })}
            </ul>
          </nav>
          <div className="min-w-0 p-3 sm:p-4">
            <div role="radiogroup" aria-label="Rol" className="flex flex-wrap gap-1.5">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  role="radio"
                  aria-checked={role === r.id}
                  onClick={() => setRole(r.id)}
                  className={`h-11 rounded-lg border px-3 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-core-violet ${
                    role === r.id ? 'border-core-navy bg-core-navy text-white' : 'border-core-border bg-white text-core-navy hover:border-core-violet/50'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {ACTIONS.map((a) => {
                const ok = a.roles.includes(role)
                return (
                  <button
                    key={a.id}
                    type="button"
                    disabled={!ok}
                    onClick={() => run(a)}
                    className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-core-violet ${
                      ok ? 'bg-core-violet text-white hover:bg-core-violet-hover' : 'bg-core-cloud text-core-body'
                    }`}
                  >
                    {!ok && <Lock className="h-3 w-3" aria-hidden="true" />}
                    {a.label}
                  </button>
                )
              })}
            </div>
            <p className="mt-4 text-[13px] font-semibold text-core-navy">Registro de auditoría</p>
            <ul className="mt-2 space-y-1.5" aria-live="polite">
              {log.map((entry) => (
                <li key={entry} className="rounded-lg bg-core-cloud px-3 py-2 text-xs text-core-navy">
                  {entry}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SceneWindow>
    </div>
  )
}
