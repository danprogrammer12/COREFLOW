import React, { useState } from 'react'
import { X, Sparkles, Send, Plus, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button, InputField, StatusBadge } from '../ui/Primitives'

export function NewRequestModal({ isOpen, onClose, edition, onCreated }) {
  const [title, setTitle] = useState('')
  const [client, setClient] = useState('Unidad Corporativa Norte')
  const [area, setArea] = useState('Operaciones')
  const [priority, setPriority] = useState('Media')

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onCreated?.({
      title: title || 'Requerimiento operativo de seguimiento',
      client,
      area,
      priority,
    })
    setTitle('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-core-navy/65 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#171936] border border-core-border dark:border-[#282C5A] shadow-float overflow-hidden">
        <div className="px-6 py-4 bg-core-navy text-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-core-cyan">
              Flujo Operativo · CoreFlow {edition === 'business' ? 'Business' : 'Start'}
            </span>
            <h3 className="text-base font-bold">Registrar nueva solicitud</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="Cerrar ventana"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <InputField
            label="Asunto de la solicitud"
            placeholder="Ej. Parametrización de entregables trimestrales..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-core-muted dark:text-slate-300 block mb-1.5">
                Cliente / Organización
              </label>
              <select
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full rounded-xl border border-core-border dark:border-[#2E3366] bg-white dark:bg-[#12142E] px-3 py-2.5 text-sm text-core-navy dark:text-white focus:border-core-violet focus:outline-none"
              >
                <option>Unidad Corporativa Norte</option>
                <option>Grupo Logístico del Caribe</option>
                <option>Inversiones Técnica S.A.S.</option>
                <option>Distribuidora Regional</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-core-muted dark:text-slate-300 block mb-1.5">
                Área responsable
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full rounded-xl border border-core-border dark:border-[#2E3366] bg-white dark:bg-[#12142E] px-3 py-2.5 text-sm text-core-navy dark:text-white focus:border-core-violet focus:outline-none"
              >
                <option>Operaciones</option>
                <option>Comercial</option>
                <option>Documentación</option>
                <option>Calidad</option>
              </select>
            </div>
          </div>

          {edition === 'business' && (
            <div className="rounded-xl bg-core-violet/5 dark:bg-core-violet/15 border border-core-violet/20 p-3 text-xs text-core-navy dark:text-slate-200">
              <strong className="text-core-violet dark:text-indigo-300 block mb-0.5">
                Regla Business activa:
              </strong>
              Se asignará automáticamente al flujo de aprobación multinivel del departamento de{' '}
              <strong>{area}</strong>.
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" icon={ArrowRight}>
              Crear y asignar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AiAssistantDrawer({ isOpen, onClose, edition }) {
  const [prompt, setPrompt] = useState('')
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Asistente operativo CoreFlow listo. Puedo ayudarte a resumir solicitudes abiertas, consultar el estado de documentos o verificar tareas pendientes por responsable.',
    },
  ])

  if (!isOpen) return null

  const handleSend = (e) => {
    e.preventDefault()
    if (!prompt.trim()) return
    const userMsg = prompt.trim()
    setPrompt('')
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userMsg },
      {
        role: 'assistant',
        text: `Consulta procesada en tu entorno CoreFlow (${edition.toUpperCase()}): Existen actualmente 9 solicitudes en seguimiento, 2 aprobaciones listas para validar y un cumplimiento operativo del 92% en la semana actual.`,
      },
    ])
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-core-navy/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-[#171936] h-full border-l border-core-border dark:border-[#282C5A] shadow-2xl flex flex-col justify-between">
        <div className="p-5 bg-core-navy text-white flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-core-violet flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Asistente Operativo CoreFlow</h3>
              <p className="text-[11px] text-slate-300">
                Consulta contextual sobre procesos y tareas
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
            placeholder="Consultar solicitudes, tareas o documentos..."
            className="flex-1 rounded-xl border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#171936] px-3.5 py-2.5 text-xs text-core-navy dark:text-white focus:border-core-violet focus:outline-none"
          />
          <Button type="submit" variant="primary" size="md" icon={Send} iconPosition="left">
            Enviar
          </Button>
        </form>
      </div>
    </div>
  )
}
