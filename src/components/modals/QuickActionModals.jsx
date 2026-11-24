// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
import React, { useState } from 'react'
import {
  X,
  Sparkles,
  Send,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Building2,
  UserCheck,
  Lock,
} from 'lucide-react'
import { Button, InputField, StatusBadge, GeometricAccentBar } from '../ui/Primitives'
import { checkCapability, EDITION_RULES } from '../../data/demoStore'

const DEMO_CLIENTS = [
  'Cuenta Corporativa A (Sector Servicios)',
  'Cuenta Empresarial B (Sector Operativo)',
  'Organización Asociada C (Consultoría)',
  'Entidad Corporativa D (Soporte)',
]
const DEMO_AREAS = ['Operaciones', 'Comercial', 'Documentación', 'Calidad', 'Tecnología']
const DEMO_OWNERS = [
  'Coordinación de Operaciones',
  'Líder de Gestión Comercial',
  'Especialista Documental',
  'Analista de Calidad y Procesos',
]

export function NewRequestModal({
  isOpen,
  onClose,
  edition,
  activeRole,
  onCreated,
  isDemoData = true,
  clients = [],
  departments = [],
  members = [],
}) {
  const [title, setTitle] = useState('')
  const [client, setClient] = useState('Cuenta Corporativa A (Sector Servicios)')
  const isBusinessEdition = edition === 'business'
  const [area, setArea] = useState(isBusinessEdition ? 'Operaciones' : 'General')
  const [responsable, setResponsable] = useState('Coordinación de Operaciones')
  const [priority, setPriority] = useState('Alta')
  const [submitError, setSubmitError] = useState(null)

  if (!isOpen) return null

  const crossAreaCheck = checkCapability(edition, activeRole, 'crossAreaAutomation')
  const planConfig = EDITION_RULES[edition] || EDITION_RULES.start

  const clientOptions = isDemoData ? DEMO_CLIENTS : clients.map((c) => c.displayName || c.legalName)
  const areaOptions = isDemoData ? DEMO_AREAS : departments.map((d) => d.name)
  const ownerOptions = isDemoData
    ? DEMO_OWNERS
    : members.filter((m) => m.status === 'active').map((m) => m.displayName)
  const pick = (value, options) => (isDemoData || options.includes(value) ? value : options[0] || '')
  const selectedClient = pick(client, clientOptions)
  const selectedArea = pick(area, areaOptions)
  const selectedOwner = pick(responsable, ownerOptions)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitError(null)
    if (!selectedClient) {
      setSubmitError('Registra primero un cliente para crear solicitudes.')
      return
    }
    const cleanTitle =
      title.trim().length >= 4
        ? title.trim()
        : `Requerimiento operativo · ${selectedArea} (${title.trim() || 'Seguimiento'})`

    const res = await onCreated?.({
      asunto: cleanTitle,
      cliente: selectedClient,
      departamento: selectedArea,
      responsable: selectedOwner,
      prioridad: priority,
      nivelAprobacion: crossAreaCheck.allowed
        ? `Nivel 1 · Coordinación de ${selectedArea}`
        : planConfig.defaultApprovalLabel,
    })
    if (res?.ok === false) {
      setSubmitError(res.error)
      return
    }
    setTitle('')
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-core-navy/65 backdrop-blur-xs"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Registrar nueva solicitud"
        className="w-full sm:max-w-lg max-h-[92dvh] sm:max-h-[calc(100dvh-2rem)] overflow-y-auto cf-scroll-contain rounded-t-2xl sm:rounded-2xl bg-white dark:bg-[#171936] border border-core-border dark:border-[#282C5A] shadow-float"
      >
        <div className="sticky top-0 z-20 px-4 sm:px-6 py-3 sm:py-4 bg-core-navy text-white flex items-center justify-between overflow-hidden">
          <svg
            className="pointer-events-none absolute top-0 right-0 w-32 h-20 opacity-35"
            viewBox="0 0 120 80"
            fill="none"
            aria-hidden="true"
          >
            <path d="M40 -10 L130 80 L130 40 L80 -10 Z" fill="#6545E8" />
            <path d="M80 -10 L130 40 L130 15 L105 -10 Z" fill="#08C9E8" />
          </svg>
          <div className="relative z-10 min-w-0 flex-1 pr-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-core-cyan block">
              Registro Operativo · {planConfig.name}
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Registrar nueva solicitud
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="relative z-10 h-11 w-11 -mr-2 inline-flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 shrink-0"
            aria-label="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6 space-y-4">
          <InputField
            label="Asunto / Descripción de la solicitud"
            placeholder="Ej. Estandarización de entregables trimestrales..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div className={`grid grid-cols-1 gap-4 ${isBusinessEdition ? 'sm:grid-cols-2' : ''}`}>
            <div>
              <label className="text-xs font-semibold text-core-navy dark:text-slate-200 block mb-1.5">
                Cuenta / Organización asociada
              </label>
              <select
                value={selectedClient}
                onChange={(e) => setClient(e.target.value)}
                className="h-11 sm:h-10 w-full rounded-xl border border-core-border dark:border-[#2E3366] bg-white dark:bg-[#12142E] px-3 text-sm text-core-navy dark:text-white focus:border-core-violet focus:outline-none"
              >
                {clientOptions.length === 0 && <option value="">Sin clientes registrados</option>}
                {clientOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            {isBusinessEdition && (
            <div>
              <label className="text-xs font-semibold text-core-navy dark:text-slate-200 block mb-1.5">
                Área / Departamento destino
              </label>
              <select
                value={selectedArea}
                onChange={(e) => setArea(e.target.value)}
                className="h-11 sm:h-10 w-full rounded-xl border border-core-border dark:border-[#2E3366] bg-white dark:bg-[#12142E] px-3 text-sm text-core-navy dark:text-white focus:border-core-violet focus:outline-none"
              >
                {areaOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-core-navy dark:text-slate-200 block mb-1.5">
                Rol responsable asignado
              </label>
              <select
                value={selectedOwner}
                onChange={(e) => setResponsable(e.target.value)}
                className="h-11 sm:h-10 w-full rounded-xl border border-core-border dark:border-[#2E3366] bg-white dark:bg-[#12142E] px-3 text-sm text-core-navy dark:text-white focus:border-core-violet focus:outline-none"
              >
                {ownerOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-core-navy dark:text-slate-200 block mb-1.5">
                Prioridad operativa
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="h-11 sm:h-10 w-full rounded-xl border border-core-border dark:border-[#2E3366] bg-white dark:bg-[#12142E] px-3 text-sm text-core-navy dark:text-white focus:border-core-violet focus:outline-none"
              >
                <option>Alta</option>
                <option>Media</option>
                <option>Prioritaria</option>
              </select>
            </div>
          </div>

          {submitError && (
            <p role="alert" className="rounded-xl p-3 text-xs bg-rose-50 text-rose-700 border border-rose-200">
              {submitError}
            </p>
          )}

          {/* Aviso lógico según la edición activa (Start vs Business) */}
          <div
            className={`rounded-xl p-3.5 text-xs border ${
              crossAreaCheck.allowed
                ? 'bg-core-violet/6 dark:bg-core-violet/15 border-core-violet/25 text-core-navy dark:text-slate-200'
                : 'bg-core-cloud dark:bg-[#101228] border-core-border dark:border-[#282C5A] text-core-muted dark:text-slate-300'
            }`}
          >
            <strong
              className={`block mb-0.5 ${
                crossAreaCheck.allowed
                  ? 'text-core-violet dark:text-indigo-300'
                  : 'text-core-navy dark:text-white'
              }`}
            >
              Regla aplicada ({planConfig.name}):
            </strong>
            {crossAreaCheck.allowed
              ? `Se activará enrutamiento entre áreas y aprobación multinivel inicial en ${area}.`
              : 'Se registrará con flujo de asignación directa (las aprobaciones multinivel entre áreas corresponden a CoreFlow Business).'}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" icon={ArrowRight}>
              Crear y vincular al flujo
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Drawer de Detalle y Seguimiento de Solicitud
 * Encabezado corregido sin truncamiento forzado y con validación lógica de permisos Start/Business y Rol.
 */
export function RequestDetailDrawer({
  request,
  onClose,
  edition,
  activeRole = 'Administrador Organizacional',
  onUpdateStatus,
  onApproveLevel,
}) {
  const [comment, setComment] = useState('')
  const [permissionNotice, setPermissionNotice] = useState(null)
  const [notes, setNotes] = useState([
    {
      author: 'Sistema CoreFlow',
      time: 'Registro inicial',
      text: 'Solicitud ingresada y vinculada a la cuenta y responsable asignados.',
    },
  ])

  if (!request) return null

  const approvalPermission = checkCapability(edition, activeRole, 'multilevelApproval')

  const handleAddNote = (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setNotes((prev) => [
      ...prev,
      {
        author: activeRole,
        time: 'Ahora mismo',
        text: comment.trim(),
      },
    ])
    setComment('')
  }

  const handleTryApprove = async () => {
    if (!approvalPermission.allowed) {
      setPermissionNotice(approvalPermission.reason)
      return
    }
    setPermissionNotice(null)
    const res = await onApproveLevel?.(request.id)
    if (res?.ok === false) {
      setPermissionNotice(res.error)
      return
    }
    setNotes((prev) => [
      ...prev,
      {
        author: activeRole,
        time: 'Ahora mismo',
        text: 'Nivel de aprobación validado satisfactoriamente en el flujo multinivel.',
      },
    ])
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-core-navy/60 backdrop-blur-xs">
      <div className="w-full sm:max-w-lg bg-white dark:bg-[#171936] h-full max-h-dvh border-l border-core-border dark:border-[#282C5A] shadow-2xl flex flex-col justify-between overflow-hidden">
        {/* ENCABEZADO CORREGIDO: Jerarquía limpia, sin colapso de flexbox ni truncamiento de una sola letra */}
        <div className="p-5 sm:p-6 bg-core-navy text-white border-b border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <GeometricAccentBar size="sm" />
              <span className="px-2.5 py-0.5 rounded-md bg-core-violet/35 border border-core-violet/60 text-xs font-extrabold text-core-cyan tabular-nums">
                {request.id}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-semibold text-slate-200">
                Área: {request.departamento}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-[11px] font-semibold text-core-lime">
                Prioridad {request.prioridad}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-11 w-11 -mr-2 -mt-2 inline-flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 shrink-0"
              aria-label="Cerrar panel de seguimiento"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <h3 className="mt-3 text-base sm:text-lg font-bold text-white leading-snug break-words">
            {request.asunto && request.asunto.length > 2
              ? request.asunto
              : `Seguimiento operativo de solicitud ${request.id}`}
          </h3>

          <p className="mt-1 text-xs text-slate-300">
            Organización vinculada: <strong className="text-white">{request.cliente}</strong>
          </p>
        </div>

        {/* Cuerpo de trazabilidad */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Estado actual y plazo */}
          <div className="flex items-center justify-between gap-2 p-3.5 rounded-xl bg-core-cloud/75 dark:bg-[#101228] border border-core-border dark:border-[#282C5A]">
            <div>
              <p className="text-[11px] font-medium text-core-muted dark:text-slate-400">
                Estado operativo actual
              </p>
              <div className="mt-1">
                <StatusBadge status={request.estado} />
              </div>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-medium text-core-muted dark:text-slate-400">
                Plazo / SLA de atención
              </p>
              <p className="text-xs font-bold text-core-navy dark:text-white mt-1">
                {request.vencimiento}
              </p>
            </div>
          </div>

          {/* Cambiar Estado Operativo */}
          <div>
            <p className="text-xs font-bold text-core-navy dark:text-white mb-2">
              Transición de estado en el flujo
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'pending', label: 'Pendiente' },
                { id: 'process', label: 'En proceso' },
                { id: 'active', label: 'Activo' },
                { id: 'completed', label: 'Completado' },
                { id: 'error', label: 'Requiere atención' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onUpdateStatus?.(request.id, st.id)}
                  className={`min-h-11 sm:min-h-0 px-3 sm:px-2.5 py-2 sm:py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    request.estado === st.id
                      ? 'border-core-violet bg-core-violet text-white shadow-2xs'
                      : 'border-core-border dark:border-[#282C5A] bg-white dark:bg-[#12142E] text-core-navy dark:text-slate-200 hover:border-core-violet/50'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Metadatos y Control de Permisos de Edición / Rol */}
          <div className="rounded-xl border border-core-border dark:border-[#282C5A] divide-y divide-core-border/70 dark:divide-[#282C5A] text-xs">
            <div className="p-3.5 flex items-center justify-between gap-2">
              <span className="text-core-muted flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-core-violet shrink-0" />
                Cuenta asociada
              </span>
              <strong className="text-core-navy dark:text-white text-right">
                {request.cliente}
              </strong>
            </div>

            <div className="p-3.5 flex items-center justify-between gap-2">
              <span className="text-core-muted flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-core-cyan shrink-0" />
                Rol responsable
              </span>
              <strong className="text-core-navy dark:text-white text-right">
                {request.responsable} ({request.departamento})
              </strong>
            </div>

            {/* Bloque de Aprobación con validación lógica de edición y permisos de rol */}
            <div className="p-3.5 space-y-2 bg-core-violet/4 dark:bg-core-violet/10">
              <div className="flex items-center justify-between gap-2">
                <span className="text-core-muted flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-core-violet shrink-0" />
                  Control de aprobación
                </span>
                <strong className="text-core-violet dark:text-indigo-300 text-right">
                  {edition === 'business'
                    ? request.nivelAprobacion
                    : 'Flujo estándar (Plan Start)'}
                </strong>
              </div>

              {request.nivelAprobacion !== 'Validado' && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-core-muted dark:text-slate-300">
                    Rol activo: <strong>{activeRole}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleTryApprove}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      approvalPermission.allowed
                        ? 'bg-core-violet text-white hover:bg-core-violet-hover'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {!approvalPermission.allowed && <Lock className="w-3 h-3" />}
                    Validar nivel actual
                  </button>
                </div>
              )}

              {permissionNotice && (
                <div className="mt-2 p-2.5 rounded-lg bg-[#FEF6E0] dark:bg-amber-950/60 border border-amber-300/80 dark:border-amber-800 text-[11px] text-[#B45309] dark:text-amber-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{permissionNotice}</span>
                </div>
              )}
            </div>
          </div>

          {/* Bitácora de seguimiento */}
          <div className="space-y-2.5">
            <p className="text-xs font-bold text-core-navy dark:text-white">
              Bitácora de trazabilidad ({notes.length})
            </p>
            <div className="space-y-2">
              {notes.map((n, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-core-cloud/60 dark:bg-[#101228] border border-core-border/80 dark:border-[#282C5A] text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] text-core-muted mb-1">
                    <strong className="text-core-navy dark:text-slate-200">{n.author}</strong>
                    <span>{n.time}</span>
                  </div>
                  <p className="text-core-navy dark:text-slate-300">{n.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie para agregar nota de seguimiento */}
        <form
          onSubmit={handleAddNote}
          className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-core-border dark:border-[#282C5A] bg-core-cloud/40 dark:bg-[#101228] flex items-center gap-2"
        >
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Añadir observación o nota de avance..."
            className="h-11 sm:h-10 min-w-0 flex-1 rounded-xl border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#171936] px-3.5 text-xs text-core-navy dark:text-white focus:border-core-violet focus:outline-none"
          />
          <Button type="submit" variant="primary" size="md">
            Registrar
          </Button>
        </form>
      </div>
    </div>
  )
}

export function AiAssistantDrawer({ isOpen, onClose, edition, unifiedMetrics }) {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Asistente operativo de CoreFlow activo. Consulto directamente la fuente centralizada de indicadores del entorno.',
    },
  ])

  if (!isOpen) return null

  const triggerQuickPrompt = (q) => {
    const acum = unifiedMetrics?.acumulados
    const per = unifiedMetrics?.periodo
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: q },
      {
        role: 'assistant',
        text: `Corte sincronizado (${edition.toUpperCase()} · ${
          per?.label || 'Últimos 7 días'
        }): ${acum?.solicitudesEnSeguimiento || 9} solicitudes en seguimiento activo, ${
          per?.solicitudesResueltas || 34
        } resueltas en el período (${per?.solicitudesGestionadas || 42} gestionadas en total) y ${
          acum?.tareasPendientesActuales || 24
        } tareas pendientes en inventario.`,
      },
    ])
  }

  const handleSend = (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    const q = prompt.trim()
    setPrompt('')
    triggerQuickPrompt(q)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-core-navy/50 backdrop-blur-xs">
      <div className="w-full sm:max-w-md bg-white dark:bg-[#171936] h-full border-l border-core-border dark:border-[#282C5A] shadow-2xl flex flex-col justify-between">
        <div className="p-5 bg-core-navy text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-core-violet flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Asistente Operativo CoreFlow</h3>
              <p className="text-[11px] text-slate-300">
                Sincronizado con almacén central · Edición {edition === 'business' ? 'Business' : 'Start'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-3">
          <div className="flex flex-wrap gap-1.5 pb-2">
            {[
              'Corte de solicitudes del período',
              'Estado de aprobaciones',
              'Balance de tareas e inventario',
            ].map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => triggerQuickPrompt(suggestion)}
                className="px-2.5 py-1 rounded-lg bg-core-violet/8 dark:bg-core-violet/20 text-core-violet dark:text-indigo-300 text-[11px] font-semibold hover:bg-core-violet hover:text-white transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-2xl p-3.5 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-core-violet text-white ml-8'
                  : 'bg-core-cloud dark:bg-[#12142E] text-core-navy dark:text-slate-200 border border-core-border dark:border-[#282C5A] mr-6'
              }`}
            >
              {m.text}
            </div>
          ))}
        </div>

        <form
          onSubmit={handleSend}
          className="p-4 border-t border-core-border dark:border-[#282C5A] bg-core-cloud/50 dark:bg-[#12142E] flex items-center gap-2"
        >
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Consultar indicadores o solicitudes..."
            className="h-11 sm:h-10 min-w-0 flex-1 rounded-xl border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#171936] px-3.5 text-xs text-core-navy dark:text-white focus:border-core-violet focus:outline-none"
          />
          <Button type="submit" variant="primary" size="md" icon={Send} iconPosition="left">
            Consultar
          </Button>
        </form>
      </div>
    </div>
  )
}
