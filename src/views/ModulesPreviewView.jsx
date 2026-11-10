import React, { useState } from 'react'
import {
  Users,
  Briefcase,
  Inbox,
  GitBranch,
  CheckSquare,
  FileText,
  BarChart3,
  Settings,
  Plus,
  ArrowRight,
  FolderOpen,
  Calendar,
  ShieldCheck,
  Building2,
  Eye,
} from 'lucide-react'
import {
  Button,
  KpiCard,
  SurfaceCard,
  StatusBadge,
  SearchInput,
  Tabs,
} from '../components/ui/Primitives'

const MODULE_META = {
  clientes: {
    title: 'Gestión de Clientes y Fichas',
    subtitle: 'Centralización de organizaciones, contactos, historial de solicitudes y documentos asociados.',
    cta: 'Registrar cliente',
    kpis: [
      { title: 'Clientes activos', value: '48', delta: '12%', deltaDirection: 'up', accentColor: 'violet' },
      { title: 'En onboarding', value: '7', delta: '3 nuevos', deltaDirection: 'up', accentColor: 'cyan' },
      { title: 'Con solicitudes abiertas', value: '14', delta: '2%', deltaDirection: 'down', accentColor: 'lime' },
    ],
    rows: [
      { code: 'CLI-012', name: 'Unidad Corporativa Norte', owner: 'Laura Méndez', area: 'Servicios', status: 'active', meta: '4 solicitudes · 12 documentos' },
      { code: 'CLI-019', name: 'Grupo Logístico del Caribe', owner: 'Carlos Ruiz', area: 'Operaciones', status: 'process', meta: '2 oportunidades en curso' },
      { code: 'CLI-024', name: 'Inversiones Técnica S.A.S.', owner: 'Andrea Vargas', area: 'Consultoría', status: 'active', meta: 'Contrato vigente · Al día' },
      { code: 'CLI-031', name: 'Distribuidora Regional', owner: 'Mateo Gómez', area: 'Comercial', status: 'pending', meta: 'Pendiente anexo documental' },
    ],
  },
  comercial: {
    title: 'Gestión Comercial y Oportunidades',
    subtitle: 'Seguimiento estructurado de etapas comerciales, propuestas y conversión a operaciones.',
    cta: 'Nueva oportunidad',
    kpis: [
      { title: 'Oportunidades activas', value: '16', delta: '8%', deltaDirection: 'up', accentColor: 'violet' },
      { title: 'En validación técnica', value: '6', delta: '2 nuevas', deltaDirection: 'up', accentColor: 'cyan' },
      { title: 'Cerradas este mes', value: '9', delta: '15%', deltaDirection: 'up', accentColor: 'lime' },
    ],
    rows: [
      { code: 'OP-204', name: 'Implementación flujo documental y trazabilidad', owner: 'Carlos Ruiz', area: 'Etapa: Propuesta', status: 'process', meta: 'Seguimiento programado mañana' },
      { code: 'OP-208', name: 'Actualización de plataforma operativa', owner: 'Daniel Peñaloza', area: 'Etapa: Negociación', status: 'active', meta: 'Validación de alcance completada' },
      { code: 'OP-211', name: 'Diagnóstico y automatización de solicitudes', owner: 'Laura Méndez', area: 'Etapa: Levantamiento', status: 'pending', meta: 'Pendiente reunión técnica' },
    ],
  },
  solicitudes: {
    title: 'Gestión y Seguimiento de Solicitudes',
    subtitle: 'Bandeja centralizada con trazabilidad de responsables, estados, tiempos de respuesta y aprobaciones.',
    cta: 'Crear solicitud',
    kpis: [
      { title: 'En proceso', value: '9', delta: 'En tiempo', deltaDirection: 'up', accentColor: 'cyan' },
      { title: 'Pendientes de revisión', value: '5', delta: '2 prioritarias', deltaDirection: 'down', accentColor: 'violet' },
      { title: 'Completadas (mes)', value: '64', delta: '14%', deltaDirection: 'up', accentColor: 'lime' },
    ],
    rows: [
      { code: 'SOL-458', name: 'Parametrización de flujo de atención comercial', owner: 'Laura Méndez', area: 'Operaciones', status: 'process', meta: 'Vence hoy, 17:30' },
      { code: 'SOL-459', name: 'Actualización de anexo documental y permisos', owner: 'Carlos Ruiz', area: 'Documentación', status: 'pending', meta: 'Vence mañana, 11:00' },
      { code: 'SOL-461', name: 'Validación de requisitos en entrega trimestral', owner: 'Andrea Vargas', area: 'Calidad', status: 'error', meta: 'Observación en revisión' },
      { code: 'SOL-455', name: 'Cierre de onboarding y capacitación inicial', owner: 'Laura Méndez', area: 'Operaciones', status: 'completed', meta: 'Cerrada con conformidad' },
    ],
  },
  procesos: {
    title: 'Procesos y Automatizaciones',
    subtitle: 'Estandarización de flujos organizacionales, reglas de asignación y conexión entre áreas.',
    cta: 'Configurar proceso',
    kpis: [
      { title: 'Procesos estandarizados', value: '12', delta: '100% activos', deltaDirection: 'up', accentColor: 'violet' },
      { title: 'Reglas automatizadas', value: '18', delta: '4 nuevas', deltaDirection: 'up', accentColor: 'cyan' },
      { title: 'Cumplimiento de SLA', value: '94%', delta: '6%', deltaDirection: 'up', accentColor: 'lime' },
    ],
    rows: [
      { code: 'PRC-01', name: 'Flujo de alta y activación de cliente', owner: 'Operaciones → Comercial', area: '5 etapas', status: 'active', meta: 'Automatización de bienvenida activa' },
      { code: 'PRC-02', name: 'Revisión y aprobación documental multinivel', owner: 'Calidad → Dirección', area: '3 etapas', status: 'process', meta: 'Edición Business habilitada' },
      { code: 'PRC-03', name: 'Atención y escalamiento de solicitudes críticas', owner: 'Soporte → Ingeniería', area: '4 etapas', status: 'active', meta: 'Alerta temprana configurada' },
    ],
  },
  tareas: {
    title: 'Gestión de Tareas y Calendario Operativo',
    subtitle: 'Organización diaria de actividades por colaborador, prioridad, fecha límite y vínculo con procesos.',
    cta: 'Nueva tarea',
    kpis: [
      { title: 'Tareas pendientes', value: '24', delta: '5%', deltaDirection: 'down', accentColor: 'violet' },
      { title: 'En ejecución hoy', value: '8', delta: 'En curso', deltaDirection: 'up', accentColor: 'cyan' },
      { title: 'Completadas esta semana', value: '41', delta: '19%', deltaDirection: 'up', accentColor: 'lime' },
    ],
    rows: [
      { code: 'TAR-112', name: 'Preparar entregable de seguimiento mensual', owner: 'Laura Méndez', area: 'Hoy · 15:00', status: 'process', meta: 'Vinculada a CLI-012' },
      { code: 'TAR-115', name: 'Verificar firmas en acuerdo de servicio', owner: 'Andrea Vargas', area: 'Hoy · 17:00', status: 'pending', meta: 'Vinculada a SOL-459' },
      { code: 'TAR-109', name: 'Actualizar matriz de permisos por área', owner: 'Daniel Peñaloza', area: 'Finalizada', status: 'completed', meta: 'Configuración organizacional' },
    ],
  },
  documentos: {
    title: 'Gestión Documental Centralizada',
    subtitle: 'Repositorio estructurado por cliente, proceso y estado de validación con control de versiones.',
    cta: 'Cargar documento',
    kpis: [
      { title: 'Documentos totales', value: '132', delta: '18%', deltaDirection: 'up', accentColor: 'violet' },
      { title: 'En revisión', value: '6', delta: 'Pendientes', deltaDirection: 'up', accentColor: 'cyan' },
      { title: 'Aprobados y vigentes', value: '126', delta: '95%', deltaDirection: 'up', accentColor: 'lime' },
    ],
    rows: [
      { code: 'DOC-890', name: 'Acuerdo Marco de Servicios Operativos v2.4.pdf', owner: 'Andrea Vargas', area: 'Contratos', status: 'completed', meta: 'Aprobado · 1.8 MB' },
      { code: 'DOC-894', name: 'Manual de Procedimiento de Solicitudes.pdf', owner: 'Laura Méndez', area: 'Procesos', status: 'active', meta: 'Vigente · 2.4 MB' },
      { code: 'DOC-899', name: 'Anexo Técnico de Requerimientos.docx', owner: 'Carlos Ruiz', area: 'Comercial', status: 'pending', meta: 'En revisión de nivel 1' },
    ],
  },
  reportes: {
    title: 'Reportes e Indicadores Organizacionales',
    subtitle: 'Métricas de desempeño operativo, tiempos de atención y evolución por responsable y departamento.',
    cta: 'Exportar reporte',
    kpis: [
      { title: 'Eficiencia operativa', value: '92.4%', delta: '4.2%', deltaDirection: 'up', accentColor: 'lime' },
      { title: 'Tiempo medio de respuesta', value: '3.4 h', delta: '18% mejor', deltaDirection: 'up', accentColor: 'cyan' },
      { title: 'Cumplimiento de entregas', value: '96%', delta: '3%', deltaDirection: 'up', accentColor: 'violet' },
    ],
    rows: [
      { code: 'REP-01', name: 'Balance operativo semanal por área', owner: 'Dirección General', area: 'Automático', status: 'completed', meta: 'Generado hoy 08:00' },
      { code: 'REP-02', name: 'Indicadores de atención de solicitudes y SLA', owner: 'Operaciones', area: 'Mensual', status: 'active', meta: 'Actualizado en tiempo real' },
    ],
  },
  configuracion: {
    title: 'Configuración Organizacional y Permisos',
    subtitle: 'Administración de estructura empresarial, roles, departamentos y capacidades de la edición activa.',
    cta: 'Guardar cambios',
    kpis: [
      { title: 'Colaboradores activos', value: '18 / 30', delta: 'Plan Business', deltaDirection: 'up', accentColor: 'violet' },
      { title: 'Departamentos creados', value: '5', delta: 'Activos', deltaDirection: 'up', accentColor: 'cyan' },
      { title: 'Roles y perfiles', value: '6', delta: 'Granulares', deltaDirection: 'up', accentColor: 'lime' },
    ],
    rows: [
      { code: 'CFG-01', name: 'Estructura de Departamentos y Equipos', owner: 'Edición Business', area: '5 áreas activas', status: 'active', meta: 'Operaciones, Comercial, Calidad, Docs, TI' },
      { code: 'CFG-02', name: 'Permisos Granulares y Aprobaciones Multinivel', owner: 'Seguridad', area: '3 niveles', status: 'completed', meta: 'Control por módulo y acción' },
      { code: 'CFG-03', name: 'Asistente IA y Automatizaciones entre Áreas', owner: 'Plataforma', area: 'Habilitado', status: 'active', meta: 'Conectado al flujo de solicitudes' },
    ],
  },
}

export function ModulesPreviewView({ moduleId, edition, onBackToDashboard, onOpenNewRequest }) {
  const [filterText, setFilterText] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)

  const meta = MODULE_META[moduleId] || MODULE_META.clientes
  const filteredRows = meta.rows.filter(
    (r) =>
      !filterText ||
      r.name.toLowerCase().includes(filterText.toLowerCase()) ||
      r.code.toLowerCase().includes(filterText.toLowerCase()) ||
      r.owner.toLowerCase().includes(filterText.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Cabecera del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-core-violet dark:text-indigo-400">
              Módulo CoreFlow · {edition === 'business' ? 'Business' : 'Start'}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-core-navy dark:text-white">
            {meta.title}
          </h1>
          <p className="mt-1 text-sm text-core-muted dark:text-slate-400">{meta.subtitle}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" onClick={onBackToDashboard}>
            Volver al Dashboard
          </Button>
          <Button variant="primary" icon={Plus} iconPosition="left" onClick={onOpenNewRequest}>
            {meta.cta}
          </Button>
        </div>
      </div>

      {/* KPIs del Módulo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {meta.kpis.map((k) => (
          <KpiCard
            key={k.title}
            title={k.title}
            value={k.value}
            delta={k.delta}
            deltaDirection={k.deltaDirection}
            accentColor={k.accentColor}
          />
        ))}
      </div>

      {/* Tabla / Ficha Operativa reutilizando los componentes del Sistema de Diseño */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <SurfaceCard className={`${selectedRecord ? 'lg:col-span-8' : 'lg:col-span-12'} p-5 sm:p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <SearchInput
              placeholder="Filtrar por código, nombre o responsable..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full sm:w-80"
            />
            <span className="text-xs text-core-muted dark:text-slate-400">
              Selecciona un registro para inspeccionar su ficha de detalle
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-core-border dark:border-[#282C5A] text-[11px] font-semibold uppercase tracking-wider text-core-muted dark:text-slate-400">
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Descripción / Registro</th>
                  <th className="py-3 px-3 hidden sm:table-cell">Responsable / Área</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-core-border/70 dark:divide-[#282C5A] text-xs sm:text-sm">
                {filteredRows.map((row) => (
                  <tr
                    key={row.code}
                    onClick={() => setSelectedRecord(row)}
                    className={`cursor-pointer transition-colors ${
                      selectedRecord?.code === row.code
                        ? 'bg-core-violet/5 dark:bg-core-violet/15'
                        : 'hover:bg-core-cloud/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <td className="py-3.5 px-3 font-bold text-core-violet dark:text-indigo-300 whitespace-nowrap">
                      {row.code}
                    </td>
                    <td className="py-3.5 px-3">
                      <p className="font-semibold text-core-navy dark:text-white">{row.name}</p>
                      <p className="text-[11px] text-core-muted dark:text-slate-400">{row.meta}</p>
                    </td>
                    <td className="py-3.5 px-3 hidden sm:table-cell">
                      <p className="font-medium text-core-navy dark:text-slate-200">{row.owner}</p>
                      <p className="text-[11px] text-core-muted dark:text-slate-400">{row.area}</p>
                    </td>
                    <td className="py-3.5 px-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-core-violet dark:text-indigo-300 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver ficha
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>

        {/* Panel Lateral de Ficha / Seguimiento cuando se selecciona un registro */}
        {selectedRecord && (
          <SurfaceCard className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between" diagonalAccent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-core-violet dark:text-indigo-300">
                  Ficha · {selectedRecord.code}
                </span>
                <StatusBadge status={selectedRecord.status} size="sm" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-core-navy dark:text-white">
                  {selectedRecord.name}
                </h3>
                <p className="text-xs text-core-muted dark:text-slate-400 mt-1">
                  {selectedRecord.meta}
                </p>
              </div>

              <div className="rounded-xl bg-core-cloud/60 dark:bg-[#12142E] p-3.5 space-y-2 border border-core-border dark:border-[#282C5A] text-xs">
                <div className="flex justify-between">
                  <span className="text-core-muted">Responsable:</span>
                  <strong className="text-core-navy dark:text-white">{selectedRecord.owner}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-core-muted">Ubicación / Etapa:</span>
                  <strong className="text-core-navy dark:text-white">{selectedRecord.area}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-core-muted">Edición:</span>
                  <strong className="text-core-violet dark:text-indigo-300 uppercase">
                    CoreFlow {edition}
                  </strong>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-core-border dark:border-[#282C5A] flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRecord(null)}
                className="flex-1"
              >
                Cerrar ficha
              </Button>
              <Button variant="primary" size="sm" className="flex-1" onClick={onOpenNewRequest}>
                Registrar avance
              </Button>
            </div>
          </SurfaceCard>
        )}
      </div>
    </div>
  )
}
