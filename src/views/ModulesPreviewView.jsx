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
  X,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import {
  Button,
  KpiCard,
  SurfaceCard,
  StatusBadge,
  SearchInput,
  ToastNotification,
  GeometricAccentBar,
} from '../components/ui/Primitives'

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
}) {
  const [filterText, setFilterText] = useState('')
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [createPanelOpen, setCreatePanelOpen] = useState(false)
  const [toast, setToast] = useState(null)

  // Estado para el formulario dinámico según el módulo activo
  const [formTitle, setFormTitle] = useState('')
  const [formSecondary, setFormSecondary] = useState('')
  const [formScopeType, setFormScopeType] = useState('basic_notification')
  const [formPriority, setFormPriority] = useState('Media')

  const acum = unifiedMetrics?.acumulados
  const per = unifiedMetrics?.periodo
  const collabStatus = entitlementsResolved?.collaboratorsStatus || {
    current: activeOrganization?.activeCollaboratorsCount || 12,
    max: edition === 'business' ? 30 : 15,
  }

  const handleOpenModuleAction = () => {
    if (moduleId === 'solicitudes') {
      onOpenNewRequest?.()
      return
    }
    setCreatePanelOpen((v) => !v)
  }

  const handleModuleFormSubmit = (e) => {
    e.preventDefault()
    if (!formTitle.trim()) return

    let res = { ok: true }
    if (moduleId === 'clientes') {
      res = onCreateClient?.({
        displayName: formTitle.trim(),
        sector: formSecondary.trim() || 'Servicios Corporativos',
        status: 'active',
      })
    } else if (moduleId === 'comercial') {
      res = onCreateOpportunity?.({
        title: formTitle.trim(),
        clientId: clients[0]?.id || null,
        stage: 'propuesta',
        estimatedValue: Number(formSecondary) || 28000000,
      })
    } else if (moduleId === 'tareas') {
      res = onCreateTask?.({
        title: formTitle.trim(),
        priority: formPriority,
        dueLabel: formSecondary.trim() || 'Mañana · 17:00',
      })
    } else if (moduleId === 'documentos') {
      res = onCreateDocument?.({
        title: formTitle.trim(),
        category: formSecondary.trim() || 'Operativo',
        version: 'v1.0',
      })
    } else if (moduleId === 'procesos') {
      res = onCreateAutomationRule?.({
        name: formTitle.trim(),
        description: formSecondary.trim() || 'Regla automatizada configurada en el módulo.',
        scopeType: formScopeType,
      })
    } else if (moduleId === 'configuracion') {
      res = onCreateDepartment?.({
        code: (formSecondary || formTitle.slice(0, 3)).toUpperCase(),
        name: formTitle.trim(),
        branchId: branches[0]?.id,
      })
    }

    if (res && res.ok === false) {
      setToast({
        title: 'Operación rechazada por política de plan o permisos',
        description: res.error,
      })
      return
    }

    setFormTitle('')
    setFormSecondary('')
    setCreatePanelOpen(false)
    setToast({
      title: 'Registro persistido en la organización activa',
      description: `Se guardó bajo el tenant "${activeOrganization?.displayName}" y se registró en auditoría protegida.`,
    })
  }

  const moduleConfigs = {
    clientes: {
      title: 'Gestión de Clientes y Fichas Organizacionales',
      subtitle:
        'Directorio multi-tenant aislado por organización con cuentas, contactos autorizados y solicitudes asociadas.',
      cta: 'Registrar cuenta',
      formLabel1: 'Razón social / Nombre de la cuenta',
      formLabel2: 'Sector empresarial',
      kpis: [
        {
          title: 'Cuentas en directorio',
          scopeBadge: 'Persistencia Tenant',
          subtitle: activeOrganization?.displayName || 'Organización activa',
          value: String(clients.length),
          delta: per?.deltas?.clientes ?? '+12%',
          deltaDirection: 'up',
          accentColor: 'violet',
          icon: Users,
          progress: 82,
          breakdown: `Aisladas bajo ID ${activeOrganization?.id}`,
        },
        {
          title: 'Cuentas activas',
          scopeBadge: 'Estado vigente',
          subtitle: 'Operación regular',
          value: String(clients.filter((c) => c.status === 'active').length),
          delta: 'Verificadas',
          deltaDirection: 'up',
          accentColor: 'cyan',
          icon: Briefcase,
          progress: 78,
          breakdown: 'Con contratos y acuerdos activos',
        },
        {
          title: 'Solicitudes del tenant',
          scopeBadge: 'Sincronizado',
          subtitle: 'Flujos vinculados',
          value: String(requests.length),
          delta: 'En tiempo',
          deltaDirection: 'up',
          accentColor: 'lime',
          icon: Inbox,
          progress: 88,
          breakdown: 'Claves foráneas compuestas verificadas',
        },
      ],
      rows: clients.map((c) => ({
        code: c.code || c.id,
        name: c.displayName || c.legalName,
        owner: c.ownerName || 'Coordinación General',
        area: c.sector || 'Servicios',
        status: c.status || 'active',
        meta: c.meta || `NIT: ${c.taxId || 'Registrado'} · ${c.contactEmail || ''}`,
      })),
    },
    comercial: {
      title: 'Gestión Comercial y Oportunidades',
      subtitle:
        'Seguimiento estructurado de oportunidades comerciales vinculadas a clientes de la misma organización.',
      cta: 'Nueva oportunidad',
      formLabel1: 'Título de la oportunidad comercial',
      formLabel2: 'Valor estimado (COP)',
      kpis: [
        {
          title: 'Oportunidades del tenant',
          scopeBadge: 'Embudo activo',
          subtitle: activeOrganization?.displayName,
          value: String(opportunities.length),
          delta: per?.deltas?.oportunidades ?? '+8%',
          deltaDirection: 'up',
          accentColor: 'violet',
          icon: Briefcase,
          progress: 74,
          breakdown: 'Vinculadas a clientes de la organización',
        },
        {
          title: 'En propuesta / validación',
          scopeBadge: 'Estado activo',
          subtitle: 'Alcance técnico',
          value: String(
            opportunities.filter((o) => o.status !== 'completed').length
          ),
          delta: 'En curso',
          deltaDirection: 'up',
          accentColor: 'cyan',
          icon: GitBranch,
          progress: 70,
          breakdown: 'Seguimiento comercial activo',
        },
        {
          title: 'Cerradas / Ganadas',
          scopeBadge: 'Conversión',
          subtitle: 'Paso a operación',
          value: String(
            opportunities.filter((o) => o.status === 'completed').length
          ),
          delta: 'Incorporadas',
          deltaDirection: 'up',
          accentColor: 'lime',
          icon: Users,
          progress: 90,
          breakdown: 'Transferidas al flujo de solicitudes',
        },
      ],
      rows: opportunities.map((o) => ({
        code: o.code || o.id,
        name: o.title,
        owner: o.ownerName || 'Gestión Comercial',
        area: o.area || `Etapa: ${o.stage}`,
        status: o.status || 'process',
        meta: o.meta || `Probabilidad: ${o.probability}%`,
      })),
    },
    solicitudes: {
      title: 'Gestión y Seguimiento de Solicitudes',
      subtitle:
        'Bandeja centralizada sincronizada con el motor de flujos y aprobaciones de la organización activa.',
      cta: 'Crear solicitud',
      kpis: [
        {
          title: 'Solicitudes del tenant',
          scopeBadge: 'Bandeja activa',
          subtitle: activeOrganization?.displayName,
          value: String(requests.length),
          delta: 'Aislamiento RLS',
          deltaDirection: 'up',
          accentColor: 'cyan',
          icon: Inbox,
          progress: 84,
          breakdown: 'Registros exclusivos de esta organización',
        },
        {
          title: 'Solicitudes gestionadas',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: `Corte: ${per?.label || 'Últimos 7 días'}`,
          value: String(per?.solicitudesGestionadas ?? requests.length),
          delta: `${per?.solicitudesResueltas ?? 1} resueltas`,
          deltaDirection: 'up',
          accentColor: 'violet',
          icon: CheckSquare,
          progress: 88,
          breakdown: 'Calculadas por MetricsEngineService',
        },
        {
          title: 'Cumplimiento SLA',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: 'Atención dentro de plazo',
          value: per?.cumplimientoSla ?? '94.2%',
          delta: 'Meta ≥ 90%',
          deltaDirection: 'up',
          accentColor: 'lime',
          icon: FileText,
          progress: 94,
          breakdown: 'Sincronizado con evolución de procesos',
        },
      ],
      rows: requests.map((r) => ({
        code: r.id,
        name: r.asunto,
        owner: r.responsable,
        area: r.departamento,
        status: r.estado,
        meta: `${r.cliente} · Plazo: ${r.vencimiento} · ${r.nivelAprobacion}`,
        rawRequest: r,
      })),
    },
    procesos: {
      title: 'Procesos y Reglas de Automatización',
      subtitle:
        'Configuración de flujos automatizados según las capacidades contratadas en la suscripción de la organización.',
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
          icon: GitBranch,
          progress: 90,
          breakdown:
            edition === 'business'
              ? 'Flujos multi-área y notificaciones habilitados'
              : 'Automatizaciones básicas de notificación (Plan Starter)',
        },
        {
          title: 'Ejecuciones del período',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: `En ${per?.label?.toLowerCase() || '7 días'}`,
          value: String(per?.automatizacionesEjecutadas ?? 14),
          delta: 'Verificadas',
          deltaDirection: 'up',
          accentColor: 'cyan',
          icon: Settings,
          progress: 85,
          breakdown: 'Trazabilidad registrada en auditoría',
        },
        {
          title: 'Cumplimiento SLA',
          scopeBadge: 'Eficiencia',
          subtitle: 'Indicador operativo',
          value: per?.cumplimientoSla ?? '94.2%',
          delta: 'Óptimo',
          deltaDirection: 'up',
          accentColor: 'lime',
          icon: BarChart3,
          progress: 94,
          breakdown: 'Meta organizacional ≥ 90%',
        },
      ],
      rows: automationRules.map((rule) => ({
        code: rule.code || rule.id,
        name: rule.name,
        owner: rule.owner || 'Configuración Organizacional',
        area: rule.area || rule.scopeType,
        status: rule.status || 'active',
        meta: rule.meta || rule.description,
      })),
    },
    tareas: {
      title: 'Gestión de Tareas y Calendario Operativo',
      subtitle:
        'Actividades operativas asignadas a miembros de la organización con seguimiento de estado y vencimiento.',
      cta: 'Nueva tarea',
      formLabel1: 'Título de la tarea operativa',
      formLabel2: 'Plazo / Vencimiento (ej. Mañana · 16:00)',
      kpis: [
        {
          title: 'Tareas registradas',
          scopeBadge: 'Tenant activo',
          subtitle: activeOrganization?.displayName,
          value: String(tasks.length),
          delta: `${tasks.filter((t) => t.status !== 'completed').length} abiertas`,
          deltaDirection: 'up',
          accentColor: 'violet',
          icon: CheckSquare,
          progress: 76,
          breakdown: 'Haz clic en una tarea para alternar su estado',
        },
        {
          title: 'Completadas en bandeja',
          scopeBadge: 'Estado actual',
          subtitle: 'Cerradas por el equipo',
          value: String(tasks.filter((t) => t.status === 'completed').length),
          delta: 'En tiempo',
          deltaDirection: 'up',
          accentColor: 'cyan',
          icon: Inbox,
          progress: 80,
          breakdown: 'Persistidas en el almacén relacional',
        },
        {
          title: 'Total cerradas período',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: 'Histórico del corte',
          value: String(per?.tareasCerradas ?? 18),
          delta: '+14%',
          deltaDirection: 'up',
          accentColor: 'lime',
          icon: FileText,
          progress: 91,
          breakdown: 'Sincronizado con el gráfico de evolución',
        },
      ],
      rows: tasks.map((t) => ({
        code: t.code || t.id,
        name: t.title,
        owner: t.owner || 'Coordinación Operativa',
        area: t.dueLabel || t.area,
        status: t.status,
        meta: t.meta || `Prioridad: ${t.priority}`,
        rawTask: t,
      })),
    },
    documentos: {
      title: 'Gestión Documental y Storage Privado',
      subtitle:
        'Repositorio con rutas aisladas por organización ({organization_id}/documents/{code}/{filename}) en el bucket privado coreflow-documents.',
      cta: 'Registrar documento',
      formLabel1: 'Título del documento o entregable',
      formLabel2: 'Categoría (Normativo, Comercial, Operativo)',
      kpis: [
        {
          title: 'Documentos en repositorio',
          scopeBadge: 'Storage Privado',
          subtitle: 'Bucket: coreflow-documents',
          value: String(documents.length),
          delta: 'Aislados por RLS',
          deltaDirection: 'up',
          accentColor: 'violet',
          icon: FileText,
          progress: 92,
          breakdown: `Prefijo obligatorio: ${activeOrganization?.id}/documents/`,
        },
        {
          title: 'Vigentes / Aprobados',
          scopeBadge: 'Control de versión',
          subtitle: 'Validados',
          value: String(
            documents.filter((d) => d.status === 'active' || d.status === 'completed')
              .length
          ),
          delta: 'Verificados',
          deltaDirection: 'up',
          accentColor: 'cyan',
          icon: ShieldCheck,
          progress: 88,
          breakdown: 'Integridad documental activa',
        },
        {
          title: 'Cuota de Storage',
          scopeBadge: entitlementsResolved?.contractedPlanName,
          subtitle: 'Capacidad contratada',
          value: `${Math.round(
            (entitlementsResolved?.realLimits?.maxStorageMb || 5120) / 1024
          )} GB`,
          delta: 'Disponible',
          deltaDirection: 'up',
          accentColor: 'lime',
          icon: CheckSquare,
          progress: 35,
          breakdown: 'Política storage.objects verificada por membresía',
        },
      ],
      rows: documents.map((d) => ({
        code: d.code || d.id,
        name: d.title,
        owner: d.owner || 'Repositorio Documental',
        area: `${d.category} · ${d.version}`,
        status: d.status,
        meta: d.meta || `Storage: ${d.storagePath}`,
      })),
    },
    reportes: {
      title: 'Reportes e Indicadores Organizacionales',
      subtitle:
        'Métricas consolidadas de desempeño operativo, tiempos de atención y evolución por período para la organización activa.',
      cta: 'Nueva solicitud',
      kpis: [
        {
          title: 'Cumplimiento SLA',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: 'Atención dentro de plazo',
          value: per?.cumplimientoSla ?? '94.2%',
          delta: 'Meta ≥ 90%',
          deltaDirection: 'up',
          accentColor: 'lime',
          icon: BarChart3,
          progress: 94,
          breakdown: `Organización: ${activeOrganization?.displayName}`,
        },
        {
          title: 'Solicitudes gestionadas',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: `En ${per?.label?.toLowerCase() || '7 días'}`,
          value: String(per?.solicitudesGestionadas ?? 20),
          delta: `${per?.solicitudesResueltas ?? 16} resueltas`,
          deltaDirection: 'up',
          accentColor: 'cyan',
          icon: Inbox,
          progress: 84,
          breakdown: 'Sincronizado con el Dashboard principal',
        },
        {
          title: 'Tareas cerradas',
          scopeBadge: per?.shortLabel || 'Período: 7 días',
          subtitle: `En ${per?.label?.toLowerCase() || '7 días'}`,
          value: String(per?.tareasCerradas ?? 18),
          delta: 'Verificadas',
          deltaDirection: 'up',
          accentColor: 'violet',
          icon: CheckSquare,
          progress: 91,
          breakdown: 'Validado por áreas operativas',
        },
      ],
      rows: [
        {
          code: 'REP-01',
          name: `Balance operativo consolidado (${per?.label || 'Últimos 7 días'}) — ${activeOrganization?.displayName}`,
          owner: activeRole,
          area: per?.shortLabel || '7 días',
          status: 'completed',
          meta: `${per?.solicitudesGestionadas ?? 20} solicitudes · ${
            per?.tareasCerradas ?? 18
          } tareas cerradas`,
        },
        {
          code: 'REP-02',
          name: 'Indicadores de atención de solicitudes y cumplimiento SLA',
          owner: activeRole,
          area: 'Tiempo real',
          status: 'active',
          meta: `Cumplimiento actual: ${per?.cumplimientoSla ?? '94.2%'} · Clientes activos: ${clients.length}`,
        },
      ],
    },
    configuracion: {
      title: 'Configuración Organizacional, Estructura y Suscripción',
      subtitle:
        'Administración de sedes, departamentos, miembros y capacidades contratadas en PostgreSQL.',
      cta: 'Crear departamento',
      formLabel1: 'Nombre del nuevo departamento (Requiere Plan Business)',
      formLabel2: 'Código corto (ej. FIN, LOG, RRHH)',
      kpis: [
        {
          title: 'Cuota de colaboradores',
          scopeBadge: entitlementsResolved?.contractedPlanName || 'Suscripción',
          subtitle: collabStatus.rangeLabel || 'Capacidad contratada',
          value: `${collabStatus.current} / ${collabStatus.max}`,
          delta: entitlementsResolved?.subscriptionStatus || 'active',
          deltaDirection: 'up',
          accentColor: 'violet',
          icon: Users,
          progress: collabStatus.usagePercent || 65,
          breakdown: `${members.length} membresías registradas en organization_members`,
        },
        {
          title: 'Departamentos activos',
          scopeBadge: entitlementsResolved?.realFeatures?.departmentsAndTeams
            ? 'Habilitado en Plan'
            : 'Restringido en Starter',
          subtitle: `${branches.length} sede(s) operativa(s)`,
          value: `${departments.length} área(s)`,
          delta: edition === 'business' ? 'Multi-área' : 'Área única',
          deltaDirection: 'up',
          accentColor: 'cyan',
          icon: Settings,
          progress: edition === 'business' ? 100 : 40,
          breakdown: departments.map((d) => d.name).join(', '),
        },
        {
          title: 'Rol de membresía actual',
          scopeBadge: 'Autorización RBAC',
          subtitle: activeRole,
          value: edition === 'business' ? 'Granular' : 'Directo',
          delta: 'Verificado RLS',
          deltaDirection: 'up',
          accentColor: 'lime',
          icon: GitBranch,
          progress: 100,
          breakdown: `Tenant ID: ${activeOrganization?.id}`,
        },
      ],
      rows: [
        ...departments.map((d) => ({
          code: `DEPT-${d.code}`,
          name: `Departamento: ${d.name}`,
          owner: `Sede: ${d.branchId}`,
          area: edition === 'business' ? 'Departamento Business' : 'Área General Starter',
          status: d.status || 'active',
          meta: d.description || 'Unidad organizacional aislada por tenant',
        })),
        ...members.map((m) => ({
          code: m.id.toUpperCase(),
          name: `Miembro: ${m.displayName} (${m.jobTitle})`,
          owner: m.email || m.userId,
          area: `Rol: ${m.roleCode}`,
          status: m.status || 'active',
          meta: `Membresía activa en ${activeOrganization?.displayName}`,
        })),
      ],
    },
  }

  const meta = moduleConfigs[moduleId] || moduleConfigs.clientes
  const filteredRows = meta.rows.filter(
    (r) =>
      !filterText ||
      r.name.toLowerCase().includes(filterText.toLowerCase()) ||
      r.code.toLowerCase().includes(filterText.toLowerCase()) ||
      r.owner.toLowerCase().includes(filterText.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {toast && (
        <ToastNotification
          title={toast.title}
          description={toast.description}
          onClose={() => setToast(null)}
        />
      )}

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

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" onClick={onBackToDashboard}>
            Volver al Dashboard
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            iconPosition="left"
            onClick={handleOpenModuleAction}
          >
            {meta.cta}
          </Button>
        </div>
      </div>

      {/* PANEL DE ALTA REAL PERSISTENTE EN EL MÓDULO ACTIVO */}
      {createPanelOpen && meta.formLabel1 && (
        <SurfaceCard
          title={`${meta.cta} en ${activeOrganization?.displayName}`}
          subtitle="El registro se valida contra permisos RBAC, capacidades del plan suscrito y claves foráneas del tenant activo"
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
                  <option value="basic_notification">Notificación Básica (Starter/Business)</option>
                  <option value="cross_department_workflow">
                    Flujo entre Áreas (Exige Business)
                  </option>
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
            icon={k.icon}
            progress={k.progress}
            breakdown={k.breakdown}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <SurfaceCard className={`${selectedRecord ? 'lg:col-span-8' : 'lg:col-span-12'} p-5 sm:p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <SearchInput
              placeholder="Filtrar por código, descripción o responsable..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              onClear={() => setFilterText('')}
              className="w-full sm:w-80"
            />
            <span className="text-xs text-core-muted dark:text-slate-400">
              Registros aislados de <strong>{activeOrganization?.displayName}</strong> · Haz clic en
              una fila para inspeccionar
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-core-border dark:border-[#282C5A] text-[11px] font-bold uppercase tracking-wider text-core-muted dark:text-slate-400">
                  <th className="py-3 px-3">Código</th>
                  <th className="py-3 px-3">Registro / Descripción</th>
                  <th className="py-3 px-3 hidden sm:table-cell">Responsable / Clasificación</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-core-border/70 dark:divide-[#282C5A] text-xs sm:text-sm">
                {filteredRows.map((row) => (
                  <tr
                    key={row.code}
                    onClick={() => {
                      if (row.rawRequest && onSelectRequest) {
                        onSelectRequest(row.rawRequest)
                      } else if (row.rawTask && onToggleTaskStatus) {
                        onToggleTaskStatus(row.rawTask.id)
                      } else {
                        setSelectedRecord(row)
                      }
                    }}
                    className={`cursor-pointer transition-colors ${
                      selectedRecord?.code === row.code
                        ? 'bg-core-violet/6 dark:bg-core-violet/15'
                        : 'hover:bg-core-cloud/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <td className="py-3.5 px-3 font-bold text-core-violet dark:text-indigo-300 whitespace-nowrap tabular-nums">
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
                        {row.rawTask ? 'Alternar estado' : 'Ficha'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SurfaceCard>

        {selectedRecord && (
          <SurfaceCard
            className="lg:col-span-4 p-5 sm:p-6 flex flex-col justify-between"
            diagonalAccent
          >
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
                  <span className="text-core-muted">Organización propietaria:</span>
                  <strong className="text-core-navy dark:text-white">
                    {activeOrganization?.displayName}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-core-muted">Responsable:</span>
                  <strong className="text-core-navy dark:text-white">{selectedRecord.owner}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-core-muted">Clasificación:</span>
                  <strong className="text-core-navy dark:text-white">{selectedRecord.area}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-core-muted">Suscripción activa:</span>
                  <strong className="text-core-violet dark:text-indigo-300 uppercase">
                    {entitlementsResolved?.contractedPlanName}
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
              <Button
                variant="primary"
                size="sm"
                className="flex-1"
                onClick={handleOpenModuleAction}
              >
                {meta.cta}
              </Button>
            </div>
          </SurfaceCard>
        )}
      </div>
    </div>
  )
}
