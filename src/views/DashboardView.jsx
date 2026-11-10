import React, { useState } from 'react'
import {
  Plus,
  UserPlus,
  FileCheck2,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Filter,
  Sparkles,
  Building2,
  GitPullRequest,
  ShieldCheck,
  Users,
  Layers,
  Calendar,
  ChevronRight,
  Zap,
} from 'lucide-react'
import {
  Button,
  KpiCard,
  SurfaceCard,
  StatusBadge,
  Tabs,
  ToastNotification,
} from '../components/ui/Primitives'
import { ProcessEvolutionChart } from '../components/charts/ProcessEvolutionChart'

const RECENT_ACTIVITY = [
  {
    id: 'act-1',
    title: 'Nuevo cliente registrado',
    detail: 'Ficha organizacional y contacto principal vinculados al flujo comercial',
    time: 'Hace 2 horas',
    category: 'Clientes',
    status: 'active',
    iconType: 'user',
  },
  {
    id: 'act-2',
    title: 'Solicitud #458 asignada',
    detail: 'Requerimiento operativo derivado al equipo de Procesos',
    time: 'Hace 4 horas',
    category: 'Solicitudes',
    status: 'process',
    iconType: 'request',
  },
  {
    id: 'act-3',
    title: 'Documento aprobado',
    detail: 'Acuerdo de nivel de servicio validado en repositorio central',
    time: 'Hace 6 horas',
    category: 'Documentos',
    status: 'completed',
    iconType: 'doc',
  },
  {
    id: 'act-4',
    title: 'Tarea completada',
    detail: 'Verificación de entregables de implementación cerrada sin pendientes',
    time: 'Hace 8 horas',
    category: 'Tareas',
    status: 'completed',
    iconType: 'check',
  },
]

const INITIAL_REQUESTS = [
  {
    id: 'SOL-458',
    asunto: 'Parametrización de flujo de atención comercial',
    cliente: 'Unidad Corporativa Norte',
    responsable: 'Laura Méndez',
    departamento: 'Operaciones',
    prioridad: 'Alta',
    estado: 'process',
    vencimiento: 'Hoy, 17:30',
    nivelAprobacion: 'Nivel 2 · Gerencia Operativa',
  },
  {
    id: 'SOL-459',
    asunto: 'Actualización de anexo documental y permisos',
    cliente: 'Grupo Logístico del Caribe',
    responsable: 'Carlos Ruiz',
    departamento: 'Documentación',
    prioridad: 'Media',
    estado: 'pending',
    vencimiento: 'Mañana, 11:00',
    nivelAprobacion: 'Nivel 1 · Coordinación',
  },
  {
    id: 'SOL-460',
    asunto: 'Activación de automatización de seguimiento',
    cliente: 'Inversiones Técnica S.A.S.',
    responsable: 'Daniel Peñaloza',
    departamento: 'Tecnología',
    prioridad: 'Alta',
    estado: 'active',
    vencimiento: 'En tiempo (48h)',
    nivelAprobacion: 'Aprobado',
  },
  {
    id: 'SOL-461',
    asunto: 'Validación de requisitos en entrega trimestral',
    cliente: 'Consultores Asociados',
    responsable: 'Andrea Vargas',
    departamento: 'Calidad',
    prioridad: 'Urgente',
    estado: 'error',
    vencimiento: 'Requiere revisión',
    nivelAprobacion: 'Observación en Nivel 2',
  },
  {
    id: 'SOL-455',
    asunto: 'Cierre de onboarding y capacitación inicial',
    cliente: 'Distribuidora Regional',
    responsable: 'Laura Méndez',
    departamento: 'Operaciones',
    prioridad: 'Media',
    estado: 'completed',
    vencimiento: 'Finalizado',
    nivelAprobacion: 'Completado',
  },
]

const BUSINESS_RESPONSABLES = [
  {
    nombre: 'Laura Méndez',
    departamento: 'Operaciones y Procesos',
    asignadas: 14,
    completadas: 12,
    cumplimiento: 92,
    estado: 'active',
  },
  {
    nombre: 'Carlos Ruiz',
    departamento: 'Comercial y Clientes',
    asignadas: 11,
    completadas: 9,
    cumplimiento: 85,
    estado: 'process',
  },
  {
    nombre: 'Andrea Vargas',
    departamento: 'Gestión Documental',
    asignadas: 9,
    completadas: 9,
    cumplimiento: 100,
    estado: 'completed',
  },
  {
    nombre: 'Mateo Gómez',
    departamento: 'Soporte y Solicitudes',
    asignadas: 8,
    completadas: 6,
    cumplimiento: 76,
    estado: 'pending',
  },
]

export function DashboardView({
  edition = 'business',
  darkMode = false,
  searchQuery = '',
  onNavigate,
  onOpenNewRequestModal,
}) {
  const [period, setPeriod] = useState('7d')
  const [selectedDepartment, setSelectedDepartment] = useState('all')
  const [operationalTab, setOperationalTab] = useState('solicitudes')
  const [requests, setRequests] = useState(INITIAL_REQUESTS)
  const [toastMessage, setToastMessage] = useState(null)

  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      !searchQuery ||
      req.asunto.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.id.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesDept =
      selectedDepartment === 'all' ||
      req.departamento.toLowerCase() === selectedDepartment.toLowerCase()

    return matchesSearch && matchesDept
  })

  const handleCycleStatus = (id) => {
    const order = ['pending', 'process', 'active', 'completed']
    setRequests((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item
        const nextIdx = (order.indexOf(item.estado) + 1) % order.length
        const nextState = order[nextIdx]
        return { ...item, estado: nextState }
      })
    )
    setToastMessage({
      title: 'Estado actualizado en el flujo',
      description: `La solicitud ${id} cambió su estado operativo correctamente.`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Notificación flotante de confirmación cuando ocurre una acción */}
      {toastMessage && (
        <ToastNotification
          title={toastMessage.title}
          description={toastMessage.description}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* CABECERA DEL DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-core-navy dark:text-white">
              {darkMode ? 'Resumen ejecutivo' : 'Dashboard'}
            </h1>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                edition === 'business'
                  ? 'bg-core-violet/10 text-core-violet dark:bg-core-violet/25 dark:text-indigo-300 border-core-violet/30'
                  : 'bg-core-cyan/10 text-[#0284C7] dark:text-core-cyan border-core-cyan/30'
              }`}
            >
              Edición {edition === 'business' ? 'Business' : 'Start'}
            </span>
          </div>
          <p className="mt-1 text-sm text-core-muted dark:text-slate-400">
            {darkMode
              ? 'Métricas clave y trazabilidad en tiempo real de tu organización'
              : 'Resumen general de tu organización · Centralización de clientes, solicitudes, tareas y procesos'}
          </p>
        </div>

        {/* Acciones principales */}
        <div className="flex flex-wrap items-center gap-2.5">
          {edition === 'business' && (
            <div className="flex items-center gap-1.5 rounded-xl border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#171936] px-3 py-2 text-xs">
              <Building2 className="w-3.5 h-3.5 text-core-violet" />
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                aria-label="Filtrar por departamento"
                className="bg-transparent font-semibold text-core-navy dark:text-white focus:outline-none"
              >
                <option value="all">Todos los departamentos</option>
                <option value="Operaciones">Área Operaciones</option>
                <option value="Documentación">Área Documentación</option>
                <option value="Tecnología">Área Tecnología</option>
                <option value="Calidad">Área Calidad</option>
              </select>
            </div>
          )}

          <Button
            variant="secondary"
            size="md"
            icon={UserPlus}
            iconPosition="left"
            onClick={() => onNavigate('clientes')}
          >
            Clientes
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={Plus}
            iconPosition="left"
            onClick={onOpenNewRequestModal}
          >
            Nueva solicitud
          </Button>
        </div>
      </div>

      {/* FILA 1: 4 INDICADORES KPI PRINCIPALES (Jerarquía exacta de la referencia) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <KpiCard
          title="Clientes"
          value="48"
          delta="12%"
          deltaDirection="up"
          accentColor="violet"
          subtitle="Organizaciones activas centralizadas"
          onClick={() => onNavigate('clientes')}
        />
        <KpiCard
          title="Oportunidades"
          value="16"
          delta="8%"
          deltaDirection="up"
          accentColor="cyan"
          subtitle="En seguimiento comercial activo"
          onClick={() => onNavigate('comercial')}
        />
        <KpiCard
          title="Tareas pendientes"
          value="24"
          delta="5%"
          deltaDirection="down"
          accentColor="violet"
          subtitle="8 vencen hoy · 16 programadas"
          onClick={() => onNavigate('tareas')}
        />
        <KpiCard
          title="Documentos"
          value="132"
          delta="18%"
          deltaDirection="up"
          accentColor="lime"
          subtitle="Anexos y archivos verificados"
          onClick={() => onNavigate('documentos')}
        />
      </div>

      {/* FILA 2: ACTIVIDAD RECIENTE + EVOLUCIÓN DE PROCESOS (Composición de referencia) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Tarjeta Izquierda: Actividad Reciente */}
        <SurfaceCard className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-core-navy dark:text-white">
                  Actividad reciente
                </h3>
                <p className="text-xs text-core-muted dark:text-slate-400">
                  Eventos registrados en los módulos activos
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-core-violet dark:text-indigo-300 bg-core-violet/10 px-2.5 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-core-lime animate-pulse" />
                En vivo
              </span>
            </div>

            <div className="space-y-2.5">
              {RECENT_ACTIVITY.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.category === 'Clientes') onNavigate('clientes')
                    if (item.category === 'Solicitudes') onNavigate('solicitudes')
                    if (item.category === 'Documentos') onNavigate('documentos')
                    if (item.category === 'Tareas') onNavigate('tareas')
                  }}
                  className="group flex items-center justify-between gap-3 rounded-xl border border-core-border/70 dark:border-[#282C5A] bg-core-cloud/45 dark:bg-[#12142E]/80 hover:bg-white dark:hover:bg-[#1B1F42] hover:border-core-violet/40 px-3.5 py-3 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Icono circular Royal Blue / Electric Violet fiel a la lámina */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0 ${
                        item.iconType === 'check'
                          ? 'bg-core-violet'
                          : 'bg-core-blue'
                      }`}
                    >
                      {item.iconType === 'check' ? (
                        <CheckCircle2 className="w-4 h-4" strokeWidth={2.2} />
                      ) : (
                        <FileCheck2 className="w-4 h-4" strokeWidth={2} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-core-navy dark:text-white truncate group-hover:text-core-violet dark:group-hover:text-indigo-300 transition-colors">
                        {item.title}
                      </p>
                      <p className="text-[11px] text-core-muted dark:text-slate-400 truncate">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-core-muted dark:text-slate-400 whitespace-nowrap shrink-0">
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-core-border dark:border-[#282C5A] flex items-center justify-between text-xs">
            <span className="text-core-muted dark:text-slate-400">
              Automatizaciones activas hoy: <strong className="text-core-navy dark:text-white">14 ejecuciones</strong>
            </span>
            <button
              type="button"
              onClick={() => onNavigate('procesos')}
              className="font-semibold text-core-violet dark:text-indigo-300 hover:underline inline-flex items-center gap-1"
            >
              Ver procesos
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </SurfaceCard>

        {/* Tarjeta Derecha: Gráfico Evolución de Procesos */}
        <SurfaceCard className="lg:col-span-7 p-5 sm:p-6" diagonalAccent>
          <ProcessEvolutionChart
            period={period}
            onPeriodChange={setPeriod}
            executiveMode={darkMode}
          />
        </SurfaceCard>
      </div>

      {/* FILA 3: TABLA OPERATIVA DE SEGUIMIENTO (Solicitudes, Procesos y Capacidades según Edición) */}
      <SurfaceCard className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-core-navy dark:text-white">
              Seguimiento operativo centralizado
            </h3>
            <p className="text-xs text-core-muted dark:text-slate-400">
              Haz clic sobre el estado de cualquier solicitud para simular su transición en el flujo
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-core-muted dark:text-slate-400">
              Mostrando {filteredRequests.length} registros
            </span>
          </div>
        </div>

        <Tabs
          activeTab={operationalTab}
          onChange={setOperationalTab}
          tabs={[
            { id: 'solicitudes', label: 'Solicitudes y Flujos', count: filteredRequests.length },
            ...(edition === 'business'
              ? [
                  { id: 'responsables', label: 'Indicadores por Responsable (Business)', count: 4 },
                  { id: 'aprobaciones', label: 'Aprobaciones Multinivel (Business)', count: 2 },
                ]
              : [{ id: 'automatizaciones', label: 'Automatizaciones Básicas (Start)', count: 3 }]),
          ]}
        />

        {/* TAB 1: TABLA DE SOLICITUDES ACTIVAS */}
        {operationalTab === 'solicitudes' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-core-border dark:border-[#282C5A] text-[11px] font-semibold uppercase tracking-wider text-core-muted dark:text-slate-400">
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Solicitud / Proceso</th>
                  <th className="py-3 px-3 hidden md:table-cell">Organización / Cliente</th>
                  <th className="py-3 px-3 hidden sm:table-cell">Responsable</th>
                  {edition === 'business' && (
                    <th className="py-3 px-3 hidden xl:table-cell">Aprobación Multinivel</th>
                  )}
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Seguimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-core-border/70 dark:divide-[#282C5A] text-xs sm:text-sm">
                {filteredRequests.map((req) => (
                  <tr
                    key={req.id}
                    className="hover:bg-core-cloud/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3.5 px-3 font-bold text-core-violet dark:text-indigo-300 whitespace-nowrap">
                      {req.id}
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-core-navy dark:text-white">
                        {req.asunto}
                      </p>
                      <p className="text-[11px] text-core-muted dark:text-slate-400 md:hidden">
                        {req.cliente} · {req.vencimiento}
                      </p>
                    </td>
                    <td className="py-3.5 px-3 hidden md:table-cell text-core-navy dark:text-slate-200">
                      {req.cliente}
                    </td>
                    <td className="py-3.5 px-3 hidden sm:table-cell">
                      <div className="flex flex-col">
                        <span className="font-medium text-core-navy dark:text-slate-200">
                          {req.responsable}
                        </span>
                        <span className="text-[11px] text-core-muted dark:text-slate-400">
                          {req.departamento}
                        </span>
                      </div>
                    </td>
                    {edition === 'business' && (
                      <td className="py-3.5 px-3 hidden xl:table-cell">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-core-muted dark:text-slate-300 bg-core-cloud dark:bg-[#12142E] px-2.5 py-1 rounded-lg border border-core-border dark:border-[#282C5A]">
                          <ShieldCheck className="w-3.5 h-3.5 text-core-violet" />
                          {req.nivelAprobacion}
                        </span>
                      </td>
                    )}
                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleCycleStatus(req.id)}
                        title="Haz clic para cambiar el estado"
                        className="focus:outline-none"
                      >
                        <StatusBadge status={req.estado} />
                      </button>
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onNavigate('solicitudes')}
                        className="text-xs font-semibold text-core-violet dark:text-indigo-300 hover:underline inline-flex items-center gap-1"
                      >
                        Detalle
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 2 (BUSINESS): INDICADORES POR RESPONSABLE Y DEPARTAMENTO */}
        {operationalTab === 'responsables' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {BUSINESS_RESPONSABLES.map((resp) => (
              <div
                key={resp.nombre}
                className="rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/40 dark:bg-[#12142E] p-4 flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-core-navy dark:text-white">
                      {resp.nombre}
                    </p>
                    <p className="text-xs text-core-muted dark:text-slate-400">
                      {resp.departamento}
                    </p>
                  </div>
                  <StatusBadge status={resp.estado} />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-core-muted dark:text-slate-400">
                      Actividades resueltas: {resp.completadas} de {resp.asignadas}
                    </span>
                    <span className="font-bold text-core-navy dark:text-white">
                      {resp.cumplimiento}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-core-violet to-core-cyan"
                      style={{ width: `${resp.cumplimiento}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3 (BUSINESS): APROBACIONES MULTINIVEL ENTRE ÁREAS */}
        {operationalTab === 'aprobaciones' && (
          <div className="mt-4 space-y-3">
            {[
              {
                id: 'APR-102',
                titulo: 'Autorización de propuesta comercial y alcance operativo',
                ruta: 'Comercial → Operaciones → Dirección',
                etapaActual: 'Etapa 2 de 3 (Operaciones)',
                estado: 'pending',
              },
              {
                id: 'APR-105',
                titulo: 'Publicación de procedimiento estandarizado de servicio',
                ruta: 'Calidad → Liderazgo de Área',
                etapaActual: 'Etapa 2 de 2 (Listo para liberar)',
                estado: 'process',
              },
            ].map((apr) => (
              <div
                key={apr.id}
                className="rounded-xl border border-core-border dark:border-[#282C5A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-core-violet">{apr.id}</span>
                    <StatusBadge status={apr.estado} size="sm" />
                  </div>
                  <p className="text-sm font-bold text-core-navy dark:text-white">
                    {apr.titulo}
                  </p>
                  <p className="text-xs text-core-muted dark:text-slate-400">
                    Flujo entre áreas: <strong>{apr.ruta}</strong> · {apr.etapaActual}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      setToastMessage({
                        title: `Aprobación ${apr.id} registrada`,
                        description: 'El flujo multinivel avanzó automáticamente al siguiente departamento.',
                      })
                    }
                  >
                    Aprobar nivel
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB ALTERNATIVO (START): AUTOMATIZACIONES BÁSICAS */}
        {operationalTab === 'automatizaciones' && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                title: 'Asignación automática de solicitudes',
                desc: 'Notifica al responsable cuando ingresa un requerimiento de cliente.',
                status: 'active',
              },
              {
                title: 'Recordatorio de tareas próximas a vencer',
                desc: 'Alerta 24 horas antes del vencimiento operativo.',
                status: 'active',
              },
              {
                title: 'Organización documental por cliente',
                desc: 'Vincula archivos cargados directamente a la ficha del cliente.',
                status: 'completed',
              },
            ].map((auto) => (
              <div
                key={auto.title}
                className="rounded-xl border border-core-border dark:border-[#282C5A] p-4 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Zap className="w-4 h-4 text-core-violet" />
                    <StatusBadge status={auto.status} size="sm" />
                  </div>
                  <p className="text-sm font-bold text-core-navy dark:text-white">{auto.title}</p>
                  <p className="text-xs text-core-muted dark:text-slate-400 mt-1">{auto.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </SurfaceCard>
    </div>
  )
}
