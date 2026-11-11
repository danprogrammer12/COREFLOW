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
  Eye,
  CheckCircle2,
  ShieldCheck,
  Building2,
  Zap,
  Lock,
  ArrowUpRight,
  Clock,
  FolderLock,
} from 'lucide-react'
import {
  Button,
  KpiCard,
  SurfaceCard,
  StatusBadge,
  SearchInput,
  ToastNotification,
  GeometricAccentBar,
  ClientAccountCard,
  DocumentRecordCard,
  TaskProgressCard,
} from '../components/ui/Primitives'
import { formatStorageMb, roleLabel } from '../components/ui/labels'
import { BUSINESS_AREAS_PERFORMANCE } from '../data/demoStore'

export function ModulesPreviewView({
  moduleId,
  edition,
  activeOrganization,
  entitlementsResolved,
  activeRole,
  unifiedMetrics,
  clients = [],
  opportunities = [],
  requests = [],
  tasks = [],
  documents = [],
  automationRules = [],
  departments = [],
  branches = [],
  members = [],
  onSelectRequest,
  onBackToDashboard,
  onOpenNewRequest,
  onCreateClient,
  onCreateOpportunity,
  onCreateTask,
  onToggleTaskStatus,
  onCreateDocument,
  onCreateAutomationRule,
  onCreateDepartment,
  isDemoData = true,
  onOpenDocument,
}) {
  const [filterText, setFilterText] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [createPanelOpen, setCreatePanelOpen] = useState(false)
  const [taskStatusFilter, setTaskStatusFilter] = useState('all')
  const [docCategoryFilter, setDocCategoryFilter] = useState('all')
  const [toast, setToast] = useState(null)

  const [formTitle, setFormTitle] = useState('')
  const [formSecondary, setFormSecondary] = useState('')
  const [formScopeType, setFormScopeType] = useState('basic_notification')
  const [formPriority, setFormPriority] = useState('Alta')
  const [formFile, setFormFile] = useState(null)

  const isStarter = edition === 'start' || edition === 'starter'
  const per = unifiedMetrics?.periodo
  const collabStatus = entitlementsResolved?.collaboratorsStatus || {
    current: activeOrganization?.activeCollaboratorsCount ?? members.length,
    max: isStarter ? 15 : 30,
  }

  const handleOpenModuleAction = () => {
    if (moduleId === 'solicitudes' || moduleId === 'reportes') {
      onOpenNewRequest?.()
      return
    }
    setCreatePanelOpen((v) => !v)
  }

  const handleModuleFormSubmit = async (e) => {
    e.preventDefault()
    if (!formTitle.trim()) return

    let res = { ok: true }
    if (moduleId === 'clientes') {
      res = await onCreateClient?.({
        displayName: formTitle.trim(),
        sector: formSecondary.trim() || 'Servicios Empresariales',
        status: 'active',
      })
    } else if (moduleId === 'comercial') {
      res = await onCreateOpportunity?.({
        title: formTitle.trim(),
        clientId: clients[0]?.id || null,
        stage: 'propuesta',
        estimatedValue: Number(formSecondary) || 0,
      })
    } else if (moduleId === 'tareas') {
      res = await onCreateTask?.({
        title: formTitle.trim(),
        priority: formPriority,
        dueLabel: formSecondary.trim() || 'Mañana · 17:00',
      })
    } else if (moduleId === 'documentos') {
      res = await onCreateDocument?.({
        title: formTitle.trim(),
        category: formSecondary.trim() || 'Operativo',
        version: 'v1.0',
        file: formFile,
      })
    } else if (moduleId === 'procesos') {
      res = await onCreateAutomationRule?.({
        name: formTitle.trim(),
        description: formSecondary.trim() || 'Regla automatizada configurada en el módulo.',
        scopeType: formScopeType,
      })
    } else if (moduleId === 'configuracion') {
      res = await onCreateDepartment?.({
        code: (formSecondary || formTitle.slice(0, 3)).toUpperCase(),
        name: formTitle.trim(),
        branchId: branches[0]?.id,
      })
    }

    if (res && res.ok === false) {
      setToast({
        title: 'No se pudo guardar',
        description: res.error,
      })
      return
    }

    setFormTitle('')
    setFormSecondary('')
    setFormFile(null)
    setCreatePanelOpen(false)
    setToast({
      title: 'Registro guardado',
      description: `Quedó guardado en ${activeOrganization?.displayName} y se anotó en la auditoría.`,
    })
  }

  const moduleConfigs = {
    clientes: {
      title: isStarter
        ? 'Directorio de Clientes y Contactos'
        : 'Cuentas Corporativas y Fichas Organizacionales',
      subtitle: isStarter
        ? 'Gestiona las cuentas comerciales atendidas por tu equipo con contacto directo y solicitudes asociadas.'
        : 'Cuentas corporativas de la organización, con sus acuerdos de servicio y su historial.',
      cta: 'Registrar cuenta',
      formLabel1: 'Razón social / Nombre de la cuenta',
      formLabel2: 'Sector empresarial (ej. Logística, Salud, Servicios)',
      kpis: [
        {
          title: 'Cuentas en directorio',
          scopeBadge: 'Directorio',
          subtitle: activeOrganization?.displayName || 'Organización activa',
          value: String(clients.length),
          deltaDirection: 'up',
          accentColor: 'violet',
          breakdown: 'Registradas en esta organización',
        },
        {
          title: 'Cuentas activas',
          scopeBadge: 'Estado vigente',
          subtitle: 'Operación regular',
          value: String(clients.filter((c) => c.status === 'active').length || clients.length),
          deltaDirection: 'up',
          accentColor: 'cyan',
          breakdown: 'Con atención vigente',
        },
        {
          title: 'Solicitudes asociadas',
          scopeBadge: 'Sincronizado',
          subtitle: 'Flujos vinculados',
          value: String(requests.length),
          delta: 'En seguimiento',
          deltaDirection: 'up',
          accentColor: 'lime',
          breakdown: 'Vinculadas a las cuentas del directorio',
        },
      ],
    },
    comercial: {
      title: isStarter
        ? 'Oportunidades y Cotizaciones'
        : 'Pipeline Comercial y Conversión a Operaciones',
      subtitle:
        'Embudo comercial estructurado por etapas y conectado directamente con las cuentas del directorio.',
      cta: 'Nueva oportunidad',
      formLabel1: 'Título de la oportunidad o propuesta comercial',
      formLabel2: 'Valor estimado en COP (ej. 45000000)',
      kpis: [
        {
          title: 'Oportunidades activas',
          scopeBadge: 'Embudo comercial',
          subtitle: activeOrganization?.displayName,
          value: String(opportunities.length),
          deltaDirection: 'up',
          accentColor: 'violet',
          breakdown: 'Vinculadas a clientes de la organización',
        },
        {
          title: 'En propuesta / validación',
          scopeBadge: 'Negociación',
          subtitle: 'Alcance técnico y económico',
          value: String(opportunities.filter((o) => o.status !== 'completed').length),
          delta: 'En curso',
          deltaDirection: 'up',
          accentColor: 'cyan',
          breakdown: 'Seguimiento comercial activo',
        },
        {
          title: 'Cerradas / Ganadas',
          scopeBadge: 'Conversión',
          subtitle: 'Paso a operación',
          value: String(opportunities.filter((o) => o.status === 'completed').length),
          delta: 'Incorporadas',
          deltaDirection: 'up',
          accentColor: 'lime',
          breakdown: 'Transferidas al flujo de solicitudes',
        },
      ],
    },
    solicitudes: {
      title: isStarter
        ? 'Bandeja de Solicitudes Directas'
        : 'Gobierno de Solicitudes y Aprobaciones Multinivel',
      subtitle: isStarter
        ? 'Atención directa de requerimientos de clientes sin pasos burocráticos intermedios.'
        : 'Bandeja centralizada sincronizada con el motor de aprobaciones multinivel y SLA por departamento.',
      cta: 'Crear solicitud',
      kpis: [
        {
          title: 'Solicitudes en bandeja',
          scopeBadge: 'Organización activa',
          subtitle: activeOrganization?.displayName,
          value: String(requests.length),
          deltaDirection: 'up',
          accentColor: 'cyan',
          breakdown: 'Registros exclusivos de esta organización',
        },
        {
          title: 'Gestionadas en el período',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: `Corte: ${per?.label || 'Últimos 7 días'}`,
          value: String(per?.solicitudesGestionadas ?? requests.length),
          delta: `${per?.solicitudesResueltas ?? 0} resueltas`,
          deltaDirection: 'up',
          accentColor: 'violet',
          breakdown: 'En el período seleccionado',
        },
        {
          title: 'Cumplimiento SLA',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: 'Atención dentro de plazo',
          value: per?.cumplimientoSla ?? 'Sin datos',
          delta: 'Meta ≥ 90%',
          deltaDirection: 'up',
          accentColor: 'lime',
          breakdown: 'Sincronizado con evolución operativa',
        },
      ],
    },
    procesos: {
      title: isStarter
        ? 'Procesos Básicos y Avisos Automáticos'
        : 'Automatizaciones Corporativas entre Áreas',
      subtitle: isStarter
        ? 'Configura avisos automáticos para tu equipo cuando se crean solicitudes o vencen tareas.'
        : 'Reglas de orquestación automática entre departamentos (Comercial, Operaciones, Calidad y Dirección).',
      cta: 'Nueva regla de automatización',
      formLabel1: 'Nombre de la regla o flujo automatizado',
      formLabel2: 'Descripción operativa del disparador',
      kpis: [
        {
          title: 'Reglas configuradas',
          scopeBadge: 'Suscripción activa',
          subtitle: entitlementsResolved?.contractedPlanName,
          value: String(automationRules.length),
          delta: 'Activas',
          deltaDirection: 'up',
          accentColor: 'violet',
          breakdown: isStarter
            ? 'Automatizaciones básicas de notificación (Plan Starter)'
            : 'Flujos multi-área y notificaciones habilitados (Plan Business)',
        },
        {
          title: 'Ejecuciones del período',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: `En ${per?.label?.toLowerCase() || '7 días'}`,
          value: String(per?.automatizacionesEjecutadas ?? 0),
          deltaDirection: 'up',
          accentColor: 'cyan',
          breakdown: 'Registradas en la auditoría',
        },
        {
          title: 'Alcance de automatización',
          scopeBadge: isStarter ? 'Plan Starter' : 'Plan Business',
          subtitle: 'Nivel de automatización',
          value: isStarter ? 'Directo' : 'Multi-Área',
          deltaDirection: 'up',
          accentColor: 'lime',
          breakdown: isStarter ? 'Avisos dentro del equipo' : 'Flujos entre departamentos',
        },
      ],
    },
    tareas: {
      title: isStarter
        ? 'Tareas del Equipo y Ejecución Diaria'
        : 'Gestión de Tareas Departamentales y SLA',
      subtitle:
        'Haz clic sobre cualquier tarjeta de tarea para alternar su estado entre pendiente y completada en tiempo real.',
      cta: 'Nueva tarea',
      formLabel1: 'Título de la tarea operativa',
      formLabel2: 'Plazo / Vencimiento (ej. Hoy · 17:00 o Mañana · 11:00)',
      kpis: [
        {
          title: 'Tareas registradas',
          scopeBadge: 'Organización activa',
          subtitle: activeOrganization?.displayName,
          value: String(tasks.length),
          delta: `${tasks.filter((t) => t.status !== 'completed').length} abiertas`,
          deltaDirection: 'up',
          accentColor: 'violet',
          breakdown: 'Marca una tarea para cambiar su estado',
        },
        {
          title: 'Completadas en bandeja',
          scopeBadge: 'Estado actual',
          subtitle: 'Cerradas por el equipo',
          value: String(tasks.filter((t) => t.status === 'completed').length),
          deltaDirection: 'up',
          accentColor: 'cyan',
          breakdown: 'Cerradas por el equipo',
        },
        {
          title: 'Total cerradas período',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: 'Histórico del corte',
          value: String(per?.tareasCerradas ?? 0),
          deltaDirection: 'up',
          accentColor: 'lime',
          breakdown: 'Consistente con las métricas del Dashboard',
        },
      ],
    },
    documentos: {
      title: isStarter
        ? 'Repositorio de Documentos y Soportes'
        : 'Control Documental y Versiones',
      subtitle:
        'Archivos privados de la organización, con su versión y responsable.',
      cta: 'Registrar documento',
      formLabel1: 'Título del documento, contrato o procedimiento',
      formLabel2: 'Categoría (Operativo, Comercial, Normativo)',
      kpis: [
        {
          title: 'Documentos en repositorio',
          scopeBadge: 'Repositorio',
          subtitle: 'Archivos privados',
          value: String(documents.length),
          deltaDirection: 'up',
          accentColor: 'violet',
          breakdown: 'Solo visibles para esta organización',
        },
        {
          title: 'Vigentes / Aprobados',
          scopeBadge: 'Control de versión',
          subtitle: 'Validados',
          value: String(
            documents.filter((d) => d.status === 'active' || d.status === 'completed').length
          ),
          deltaDirection: 'up',
          accentColor: 'cyan',
          breakdown: 'Con versión vigente',
        },
        {
          title: 'Capacidad de almacenamiento',
          scopeBadge: entitlementsResolved?.contractedPlanName,
          subtitle: 'Capacidad contratada',
          value: formatStorageMb(entitlementsResolved?.realLimits?.maxStorageMb),
          deltaDirection: 'up',
          accentColor: 'lime',
          breakdown: 'Definida en la suscripción',
        },
      ],
    },
    reportes: {
      title: isStarter
        ? 'Balance Operativo de la Organización'
        : 'Reportes Comparativos e Indicadores por Área',
      subtitle: isStarter
        ? 'Resumen consolidado de solicitudes atendidas, clientes activos y cumplimiento del equipo.'
        : 'Analítica comparativa de cumplimiento SLA entre departamentos, responsables y períodos.',
      cta: 'Nueva solicitud',
      kpis: [
        {
          title: 'Cumplimiento SLA',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: 'Atención dentro de plazo',
          value: per?.cumplimientoSla ?? 'Sin datos',
          delta: 'Meta ≥ 90%',
          deltaDirection: 'up',
          accentColor: 'lime',
          breakdown: `Organización: ${activeOrganization?.displayName}`,
        },
        {
          title: 'Solicitudes gestionadas',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: `En ${per?.label?.toLowerCase() || '7 días'}`,
          value: String(per?.solicitudesGestionadas ?? 0),
          delta: `${per?.solicitudesResueltas ?? 0} resueltas`,
          deltaDirection: 'up',
          accentColor: 'cyan',
          breakdown: 'En el período seleccionado',
        },
        {
          title: 'Tareas cerradas',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: `En ${per?.label?.toLowerCase() || '7 días'}`,
          value: String(per?.tareasCerradas ?? 0),
          deltaDirection: 'up',
          accentColor: 'violet',
          breakdown: 'En el período seleccionado',
        },
      ],
    },
    configuracion: {
      title: isStarter
        ? 'Equipo, Sede Única y Suscripción Starter'
        : 'Gobierno de Departamentos, Sedes y Roles (Business)',
      subtitle: isStarter
        ? 'Administra los colaboradores de tu organización (1 a 15 miembros) y consulta las capacidades de tu plan Starter.'
        : 'Administración de estructura multi-departamento, sedes corporativas, membresías y permisos granulares.',
      cta: isStarter ? null : 'Crear departamento',
      formLabel1: 'Nombre del nuevo departamento',
      formLabel2: 'Código corto (ej. FIN, LOG, RRHH)',
      kpis: [
        {
          title: 'Cuota de colaboradores',
          scopeBadge: entitlementsResolved?.contractedPlanName || 'Suscripción',
          subtitle: collabStatus.rangeLabel || 'Capacidad contratada',
          value: `${collabStatus.current} / ${collabStatus.max}`,
          deltaDirection: 'up',
          accentColor: 'violet',
          progress: collabStatus.usagePercent,
          breakdown: `${members.length} personas registradas`,
        },
        {
          title: 'Estructura de áreas',
          scopeBadge: entitlementsResolved?.realFeatures?.departmentsAndTeams
            ? 'Multi-Departamento'
            : 'Operación Unificada',
          subtitle: `${branches.length} sede(s) activa(s)`,
          value: `${departments.length} área(s)`,
          delta: isStarter ? 'Sede única' : 'Multi-área',
          deltaDirection: 'up',
          accentColor: 'cyan',
          breakdown: departments.map((d) => d.name).join(', '),
        },
        {
          title: 'Modelo de permisos',
          scopeBadge: isStarter ? 'Tres roles fijos' : 'Roles configurables',
          subtitle: activeRole,
          value: isStarter ? 'Directa' : 'Granular',
          deltaDirection: 'up',
          accentColor: 'lime',
          breakdown: isStarter ? 'Administrador, supervisor y colaborador' : 'Permisos por rol y departamento',
        },
      ],
    },
  }

  const meta = moduleConfigs[moduleId] || moduleConfigs.clientes

  return (
    <div className="space-y-6">
      {toast && (
        <ToastNotification
          title={toast.title}
          description={toast.description}
          onClose={() => setToast(null)}
        />
      )}

      {/* CABECERA DEL MÓDULO CON IDENTIDAD VISUAL COREFLOW */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <GeometricAccentBar size="sm" />
            <span className="text-xs font-bold uppercase tracking-wider text-core-violet dark:text-indigo-400">
              {activeOrganization?.displayName} ·{' '}
              {entitlementsResolved?.contractedPlanName || `CoreFlow ${edition}`}
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-core-navy dark:text-white">
            {meta.title}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-core-muted dark:text-slate-400">
            {meta.subtitle}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="secondary" onClick={onBackToDashboard}>
            Volver al inicio
          </Button>
          {meta.cta && (
            <Button
              variant="primary"
              icon={Plus}
              iconPosition="left"
              onClick={handleOpenModuleAction}
            >
              {meta.cta}
            </Button>
          )}
        </div>
      </div>

      {/* PANEL DE ALTA REAL PERSISTENTE EN EL MÓDULO ACTIVO */}
      {createPanelOpen && meta.formLabel1 && (
        <SurfaceCard
          title={`${meta.cta} en ${activeOrganization?.displayName}`}
          subtitle="Se comprueban tus permisos y las capacidades del plan antes de guardar"
        >
          <form
            onSubmit={handleModuleFormSubmit}
            className="grid grid-cols-1 md:grid-cols-12 gap-3.5 mt-2 items-end"
          >
            <div className="md:col-span-5">
              <label className="block text-xs font-semibold mb-1">{meta.formLabel1}</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Ingresa el nombre o descripción..."
                className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/50 dark:bg-[#101228] px-3 text-xs"
              />
            </div>

            <div className="md:col-span-4">
              <label className="block text-xs font-semibold mb-1">{meta.formLabel2}</label>
              <input
                type="text"
                value={formSecondary}
                onChange={(e) => setFormSecondary(e.target.value)}
                placeholder="Valor complementario..."
                className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/50 dark:bg-[#101228] px-3 text-xs"
              />
            </div>

            {moduleId === 'procesos' && (
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold mb-1">Alcance de la regla</label>
                <select
                  value={formScopeType}
                  onChange={(e) => setFormScopeType(e.target.value)}
                  className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/50 dark:bg-[#101228] px-3 text-xs font-semibold"
                >
                  <option value="basic_notification">Notificación básica</option>
                  {!isStarter && (
                    <option value="cross_department_workflow">Flujo entre áreas</option>
                  )}
                </select>
              </div>
            )}

            {moduleId === 'documentos' && !isDemoData && (
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold mb-1">Archivo</label>
                <input
                  type="file"
                  required
                  onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                  className="block w-full text-xs file:mr-2 file:h-10 file:rounded-xl file:border-0 file:bg-core-cloud file:px-3 file:text-xs file:font-semibold"
                />
              </div>
            )}

            {moduleId === 'tareas' && (
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold mb-1">Prioridad operativa</label>
                <select
                  value={formPriority}
                  onChange={(e) => setFormPriority(e.target.value)}
                  className="h-10 w-full rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/50 dark:bg-[#101228] px-3 text-xs font-semibold"
                >
                  <option value="Alta">Alta prioridad</option>
                  <option value="Media">Media prioridad</option>
                  <option value="Baja">Baja prioridad</option>
                </select>
              </div>
            )}

            <div className="md:col-span-3 flex items-center gap-2">
              <Button type="submit" variant="primary" size="md" className="flex-1">
                Guardar registro
              </Button>
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setCreatePanelOpen(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </SurfaceCard>
      )}

      {/* KPIS DEL MÓDULO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {meta.kpis.map((k) => (
          <KpiCard
            key={k.title}
            title={k.title}
            scopeBadge={k.scopeBadge}
            subtitle={k.subtitle}
            value={k.value}
            delta={k.delta}
            deltaDirection={k.deltaDirection}
            accentColor={k.accentColor}
            progress={k.progress}
            breakdown={k.breakdown}
          />
        ))}
      </div>

      {/* =====================================================================
          COMPOSICIÓN ESPECÍFICA 1: MÓDULO CLIENTES (Tarjetas de Cuenta + Ficha)
      ====================================================================== */}
      {moduleId === 'clientes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <SurfaceCard className={`${selectedRecord ? 'lg:col-span-8' : 'lg:col-span-12'} p-5 sm:p-6`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <SearchInput
                placeholder="Buscar cuenta por razón social, NIT o sector..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                onClear={() => setFilterText('')}
                className="w-full sm:w-80"
              />
              <span className="text-xs text-core-muted dark:text-slate-400">
                Selecciona una tarjeta de cuenta para inspeccionar su ficha comercial
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clients
                .filter(
                  (c) =>
                    !filterText ||
                    (c.displayName || c.legalName || '')
                      .toLowerCase()
                      .includes(filterText.toLowerCase()) ||
                    (c.sector || '').toLowerCase().includes(filterText.toLowerCase()) ||
                    (c.code || c.id || '').toLowerCase().includes(filterText.toLowerCase())
                )
                .map((client) => (
                  <ClientAccountCard
                    key={client.id}
                    client={client}
                    requestsCount={requests.filter((r) => r.clientId === client.id).length}
                    onSelect={() =>
                      setSelectedRecord({
                        code: client.code || client.id,
                        name: client.displayName || client.legalName,
                        owner: client.ownerName || 'Coordinación Comercial',
                        area: client.sector || 'Servicios Corporativos',
                        status: client.status || 'active',
                        meta: [
                          client.taxId && `NIT: ${client.taxId}`,
                          client.contactEmail && `Contacto: ${client.contactEmail}`,
                        ]
                          .filter(Boolean)
                          .join(' · '),
                      })
                    }
                  />
                ))}
            </div>
          </SurfaceCard>

          {selectedRecord && (
            <SurfaceCard
              className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between"
              diagonalAccent
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono text-core-violet dark:text-indigo-300">
                    Ficha Comercial · {selectedRecord.code}
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
                    <span className="text-core-muted">Organización propietaria:</span>
                    <strong className="text-core-navy dark:text-white">
                      {activeOrganization?.displayName}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-core-muted">Ejecutivo / Responsable:</span>
                    <strong className="text-core-navy dark:text-white">{selectedRecord.owner}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-core-muted">Sector económico:</span>
                    <strong className="text-core-navy dark:text-white">{selectedRecord.area}</strong>
                  </div>
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-core-border dark:border-[#282C5A] flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedRecord(null)}
                  className="flex-1"
                >
                  Cerrar ficha
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => onOpenNewRequest?.()}
                  className="flex-1"
                >
                  Crear solicitud
                </Button>
              </div>
            </SurfaceCard>
          )}
        </div>
      )}

      {/* =====================================================================
          COMPOSICIÓN ESPECÍFICA 2: MÓDULO TAREAS (Tarjetas de Ejecución Interactivas)
      ====================================================================== */}
      {moduleId === 'tareas' && (
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <SearchInput
              placeholder="Buscar tarea por título, código o responsable..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              onClear={() => setFilterText('')}
              className="w-full sm:w-80"
            />
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: `Todas (${tasks.length})` },
                {
                  id: 'open',
                  label: `Pendientes (${tasks.filter((t) => t.status !== 'completed').length})`,
                },
                {
                  id: 'completed',
                  label: `Completadas (${tasks.filter((t) => t.status === 'completed').length})`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTaskStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    taskStatusFilter === tab.id
                      ? 'bg-core-violet text-white'
                      : 'bg-core-cloud dark:bg-[#101228] text-core-muted dark:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tasks
              .filter((t) => {
                const matchesSearch =
                  !filterText ||
                  t.title.toLowerCase().includes(filterText.toLowerCase()) ||
                  (t.code || t.id).toLowerCase().includes(filterText.toLowerCase())
                const matchesStatus =
                  taskStatusFilter === 'all' ||
                  (taskStatusFilter === 'completed'
                    ? t.status === 'completed'
                    : t.status !== 'completed')
                return matchesSearch && matchesStatus
              })
              .map((task) => (
                <TaskProgressCard
                  key={task.id}
                  task={task}
                  onToggleStatus={async () => {
                    const res = await onToggleTaskStatus?.(task.id)
                    if (res?.ok === false) {
                      setToast({ title: 'No se pudo actualizar la tarea', description: res.error })
                      return
                    }
                    setToast({
                      title: `Estado de tarea ${task.code || task.id} actualizado`,
                      description: 'El equipo ya ve el nuevo estado.',
                    })
                  }}
                />
              ))}
          </div>
        </SurfaceCard>
      )}

      {/* =====================================================================
          COMPOSICIÓN ESPECÍFICA 3: MÓDULO DOCUMENTOS (Tarjetas de Repositorio + Storage)
      ====================================================================== */}
      {moduleId === 'documentos' && (
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <SearchInput
              placeholder="Buscar documento por título, código o categoría..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              onClear={() => setFilterText('')}
              className="w-full sm:w-80"
            />
            <div className="flex flex-wrap items-center gap-1.5">
              {['all', 'Operativo', 'Comercial', 'Normativo'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setDocCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    docCategoryFilter === cat
                      ? 'bg-core-violet text-white'
                      : 'bg-core-cloud dark:bg-[#101228] text-core-muted dark:text-slate-300'
                  }`}
                >
                  {cat === 'all' ? 'Todas las categorías' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {documents
              .filter((d) => {
                const matchesSearch =
                  !filterText ||
                  d.title.toLowerCase().includes(filterText.toLowerCase()) ||
                  (d.code || d.id).toLowerCase().includes(filterText.toLowerCase())
                const matchesCat =
                  docCategoryFilter === 'all' ||
                  (d.category || '').toLowerCase() === docCategoryFilter.toLowerCase()
                return matchesSearch && matchesCat
              })
              .map((doc) => (
                <DocumentRecordCard
                  key={doc.id}
                  doc={doc}
                  onSelect={async () => {
                    if (!onOpenDocument) {
                      setToast({
                        title: doc.title,
                        description: `${doc.category || 'Operativo'} · versión ${doc.version || 'v1.0'}`,
                      })
                      return
                    }
                    // La pestaña se abre antes de esperar: si no, el navegador la bloquea.
                    const tab = window.open('about:blank', '_blank')
                    const res = await onOpenDocument(doc.id)
                    if (res?.ok === false) {
                      tab?.close()
                      setToast({ title: 'No se pudo abrir el documento', description: res.error })
                      return
                    }
                    if (tab) {
                      tab.opener = null
                      tab.location.href = res.data.url
                    }
                  }}
                />
              ))}
          </div>
        </SurfaceCard>
      )}

      {/* =====================================================================
          COMPOSICIÓN ESPECÍFICA 4: MÓDULO COMERCIAL (Pipeline de Oportunidades)
      ====================================================================== */}
      {moduleId === 'comercial' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              stageKey: 'propuesta',
              title: '1. En Propuesta Comercial',
              subtitle: 'Levantamiento y cotización inicial',
              items: opportunities.filter(
                (o) => (o.stage || '').toLowerCase().includes('propuesta') || o.status === 'pending'
              ),
            },
            {
              stageKey: 'validacion',
              title: '2. Validación Técnica y Alcance',
              subtitle: 'Revisión con cliente y área operativa',
              items: opportunities.filter(
                (o) =>
                  (o.stage || '').toLowerCase().includes('validacion') ||
                  (o.status === 'process' && !(o.stage || '').toLowerCase().includes('propuesta'))
              ),
            },
            {
              stageKey: 'cierre',
              title: '3. Cerradas / En Incorporación',
              subtitle: 'Aprobadas y conectadas a solicitudes',
              items: opportunities.filter(
                (o) => o.status === 'completed' || o.status === 'active'
              ),
            },
          ].map((col) => (
            <SurfaceCard
              key={col.stageKey}
              title={col.title}
              subtitle={`${col.items.length} oportunidad(es) · ${col.subtitle}`}
            >
              <div className="space-y-3 mt-2">
                {col.items.length === 0 ? (
                  <p className="text-xs text-core-muted py-6 text-center border border-dashed border-core-border dark:border-[#282C5A] rounded-xl">
                    Sin oportunidades en esta etapa
                  </p>
                ) : (
                  col.items.map((opp) => (
                    <div
                      key={opp.id}
                      className="rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/40 dark:bg-[#12142E] p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono text-core-violet dark:text-indigo-300">
                          {opp.code || opp.id}
                        </span>
                        <StatusBadge status={opp.status || 'process'} size="sm" />
                      </div>
                      <p className="text-sm font-bold text-core-navy dark:text-white">
                        {opp.title}
                      </p>
                      <p className="text-xs text-core-muted dark:text-slate-400">
                        Responsable: {opp.ownerName || 'Gestión Comercial'}
                      </p>
                      <div className="pt-2 border-t border-core-border/70 dark:border-[#282C5A] flex items-center justify-between text-xs">
                        <span className="font-bold text-core-navy dark:text-white tabular-nums">
                          $
                          {Number(opp.estimatedValue || 28000000).toLocaleString('es-CO')} COP
                        </span>
                        <span className="text-[11px] font-semibold text-core-violet dark:text-core-cyan">
                          Probabilidad: {opp.probability || 75}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}

      {/* =====================================================================
          COMPOSICIÓN ESPECÍFICA 5: MÓDULO SOLICITUDES (Bandeja Operativa)
      ====================================================================== */}
      {moduleId === 'solicitudes' && (
        <SurfaceCard className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <SearchInput
              placeholder="Filtrar solicitud por código, asunto, cliente o responsable..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              onClear={() => setFilterText('')}
              className="w-full sm:w-80"
            />
            <span className="text-xs text-core-muted dark:text-slate-400">
              Haz clic en cualquier solicitud para abrir su panel lateral de trazabilidad
            </span>
          </div>

          <div className="space-y-3">
            {requests
              .filter(
                (r) =>
                  !filterText ||
                  r.asunto.toLowerCase().includes(filterText.toLowerCase()) ||
                  r.id.toLowerCase().includes(filterText.toLowerCase()) ||
                  r.cliente.toLowerCase().includes(filterText.toLowerCase())
              )
              .map((req) => (
                <div
                  key={req.id}
                  onClick={() => onSelectRequest?.(req)}
                  className="rounded-xl border border-core-border dark:border-[#282C5A] bg-white dark:bg-[#141733] hover:border-core-violet/50 p-4 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold font-mono text-core-violet dark:text-indigo-300">
                        {req.id}
                      </span>
                      <span className="text-xs font-semibold text-core-navy dark:text-slate-200">
                        · {req.cliente}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-core-cloud dark:bg-[#1F2347] text-[10px] font-semibold text-core-muted dark:text-slate-300">
                        Prioridad {req.prioridad}
                      </span>
                      {!isStarter && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-core-violet/10 text-core-violet dark:text-indigo-300 text-[10px] font-bold">
                          <ShieldCheck className="w-3 h-3" />
                          {req.nivelAprobacion}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-core-navy dark:text-white">{req.asunto}</p>
                    <p className="text-xs text-core-muted dark:text-slate-400">
                      Responsable: <strong>{req.responsable}</strong> ({req.departamento}) · Plazo
                      SLA: {req.vencimiento}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end md:self-center">
                    <StatusBadge status={req.estado} />
                    <Button variant="secondary" size="sm" icon={ArrowUpRight}>
                      Seguimiento
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </SurfaceCard>
      )}

      {/* =====================================================================
          COMPOSICIÓN ESPECÍFICA 6: MÓDULO PROCESOS Y AUTOMATIZACIONES
      ====================================================================== */}
      {moduleId === 'procesos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <SurfaceCard
            className="lg:col-span-8 p-5 sm:p-6"
            title={
              isStarter
                ? 'Reglas de Notificación Directa Activas (Plan Starter)'
                : 'Flujos de Automatización Multi-Departamento (Plan Business)'
            }
            subtitle="Reglas evaluadas automáticamente ante cambios de estado en solicitudes, tareas y documentos"
          >
            <div className="space-y-3 mt-2">
              {automationRules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-xl border border-core-border dark:border-[#282C5A] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-core-violet shrink-0" />
                      <span className="text-xs font-bold font-mono text-core-violet dark:text-indigo-300">
                        {rule.code || rule.id}
                      </span>
                      <span className="text-sm font-bold text-core-navy dark:text-white">
                        {rule.name}
                      </span>
                    </div>
                    <p className="text-xs text-core-muted dark:text-slate-400">
                      {rule.description || rule.meta}
                    </p>
                    <span className="inline-block text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-core-cloud dark:bg-[#101228] text-core-muted">
                      Alcance: {rule.scopeType || rule.area || 'basic_notification'}
                    </span>
                  </div>
                  <StatusBadge status={rule.status || 'active'} />
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard
            className="lg:col-span-4 p-5 sm:p-6"
            title="Capacidades de Automatización por Plan"
            subtitle="Validación real en EntitlementService"
            diagonalAccent
          >
            <div className="space-y-3 mt-2 text-xs">
              <div className="p-3.5 rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/40 dark:bg-[#12142E] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-core-navy dark:text-white">
                    Avisos y alertas directas
                  </span>
                  <StatusBadge status="active" size="sm" />
                </div>
                <p className="text-core-muted dark:text-slate-400">
                  Notificaciones inmediatas al equipo ante nuevas solicitudes o vencimientos.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/40 dark:bg-[#12142E] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-core-navy dark:text-white">
                    Orquestación entre departamentos
                  </span>
                  <StatusBadge status={isStarter ? 'pending' : 'active'} size="sm" />
                </div>
                <p className="text-core-muted dark:text-slate-400">
                  {isStarter
                    ? 'Exclusivo de CoreFlow Business. Si intentas crear una regla multi-área en Starter, el motor de autorizaciones bloqueará la operación.'
                    : 'Habilitado en tu suscripción Business para conectar Comercial, Operaciones y Calidad.'}
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      )}

      {/* =====================================================================
          COMPOSICIÓN ESPECÍFICA 7: MÓDULO REPORTES E INDICADORES
      ====================================================================== */}
      {moduleId === 'reportes' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <SurfaceCard
            className="lg:col-span-7 p-5 sm:p-6"
            title={
              isStarter
                ? 'Resumen de Productividad del Equipo (Starter)'
                : 'Matriz Comparativa de Cumplimiento por Área (Business)'
            }
            subtitle={`Indicadores verificados para ${activeOrganization?.displayName}`}
          >
            {isStarter ? (
              <div className="space-y-3 mt-2">
                {[
                  {
                    label: 'Atención de solicitudes directas',
                    detail: `${requests.length} solicitudes registradas en el período activo`,
                    percent: 92,
                  },
                  {
                    label: 'Ejecución de tareas del equipo',
                    detail: `${tasks.filter((t) => t.status === 'completed').length} de ${
                      tasks.length
                    } tareas cerradas en bandeja`,
                    percent: 84,
                  },
                  {
                    label: 'Formalización documental por cliente',
                    detail: `${documents.length} documentos vigentes en repositorio privado`,
                    percent: 95,
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    className="p-4 rounded-xl border border-core-border dark:border-[#282C5A] space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-core-navy dark:text-white">
                        {metric.label}
                      </span>
                      <span className="font-extrabold text-core-violet dark:text-core-cyan">
                        {metric.percent}%
                      </span>
                    </div>
                    <p className="text-xs text-core-muted dark:text-slate-400">{metric.detail}</p>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-core-cyan to-core-lime"
                        style={{ width: `${metric.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3 mt-2">
                {BUSINESS_AREAS_PERFORMANCE.map((area) => (
                  <div
                    key={area.rol}
                    className="p-4 rounded-xl border border-core-border dark:border-[#282C5A] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-core-navy dark:text-white">
                          {area.departamento} · {area.rol}
                        </p>
                        <p className="text-xs text-core-muted dark:text-slate-400">
                          Resueltas: {area.completadas} de {area.asignadas} asignadas
                        </p>
                      </div>
                      <StatusBadge status={area.estado} size="sm" />
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-core-violet to-core-cyan"
                        style={{ width: `${area.cumplimiento}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard
            className="lg:col-span-5 p-5 sm:p-6"
            title="Cortes Consolidados Auditables"
            subtitle="Reportes generados por MetricsEngineService"
            diagonalAccent
          >
            <div className="space-y-3 mt-2">
              <div className="p-4 rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/40 dark:bg-[#12142E] space-y-1.5">
                <span className="text-xs font-bold font-mono text-core-violet">REP-SLA-01</span>
                <p className="text-sm font-bold text-core-navy dark:text-white">
                  Cumplimiento de Nivel de Servicio ({per?.label || 'Últimos 7 días'})
                </p>
                <p className="text-xs text-core-muted dark:text-slate-400">
                  SLA consolidado: <strong>{per?.cumplimientoSla ?? 'Sin datos'}</strong> ·{' '}
                  {per?.solicitudesResueltas ?? 0} solicitudes resueltas dentro de plazo.
                </p>
              </div>
              <div className="p-4 rounded-xl border border-core-border dark:border-[#282C5A] bg-core-cloud/40 dark:bg-[#12142E] space-y-1.5">
                <span className="text-xs font-bold text-core-violet">Inventario</span>
                <p className="text-sm font-bold text-core-navy dark:text-white">
                  Inventario operativo de la organización
                </p>
                <p className="text-xs text-core-muted dark:text-slate-400">
                  {clients.length} cuentas activas · {opportunities.length} oportunidades ·{' '}
                  {documents.length} documentos.
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      )}

      {/* =====================================================================
          COMPOSICIÓN ESPECÍFICA 8: CONFIGURACIÓN, ESTRUCTURA Y MIEMBROS
      ====================================================================== */}
      {moduleId === 'configuracion' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <SurfaceCard
            className="lg:col-span-6 p-5 sm:p-6"
            title={
              isStarter
                ? 'Estructura Operativa Simplificada (Plan Starter)'
                : 'Departamentos y Sedes Corporativas (Plan Business)'
            }
            subtitle={`${branches.length} sede(s) · ${departments.length} unidad(es) operativa(s)`}
          >
            <div className="space-y-3 mt-2">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-4 rounded-xl border border-core-border dark:border-[#282C5A] flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-core-violet shrink-0" />
                      <span className="text-xs font-bold font-mono text-core-violet dark:text-indigo-300">
                        {dept.code}
                      </span>
                      <span className="text-sm font-bold text-core-navy dark:text-white">
                        {dept.name}
                      </span>
                    </div>
                    <p className="text-xs text-core-muted dark:text-slate-400 mt-1">
                      {dept.description || branches.find((b) => b.id === dept.branchId)?.name || 'Sede principal'}
                    </p>
                  </div>
                  <StatusBadge status={dept.status || 'active'} size="sm" />
                </div>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard
            className="lg:col-span-6 p-5 sm:p-6"
            title={`Miembros Activos (${collabStatus.current}/${collabStatus.max} colaboradores)`}
            subtitle="Personas de la organización y su rol"
          >
            <div className="space-y-3 mt-2">
              {members.map((mem) => (
                <div
                  key={mem.id}
                  className="p-4 rounded-xl border border-core-border dark:border-[#282C5A] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-core-violet/15 text-core-violet dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                      {(mem.displayName || 'US').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-core-navy dark:text-white truncate">
                        {mem.displayName}
                      </p>
                      <p className="text-xs text-core-muted dark:text-slate-400 truncate">
                        {mem.jobTitle} · <strong>{roleLabel(mem.roleCode)}</strong>
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={mem.status || 'active'} size="sm" />
                </div>
              ))}
            </div>
          </SurfaceCard>
        </div>
      )}
    </div>
  )
}
