/**
 * FUENTE DE DATOS DEMOSTRATIVOS CENTRALIZADA Y MOTOR DE REGLAS DE EDICIÓN / PERMISOS
 * CoreFlow — Fase 1 Validada
 *
 * Nota: Todos los datos aquí definidos son demostrativos de referencia operativa.
 * Se distingue explícitamente entre:
 *  - Indicadores de Inventario / Acumulado Actual (estado presente de la organización)
 *  - Indicadores de Corte Temporal (7 días, 30 días, Trimestre actual)
 */

export const EDITION_RULES = {
  start: {
    id: 'start',
    name: 'CoreFlow Starter',
    collaboratorsRange: '1 a 15 colaboradores',
    maxCollaborators: 15,
    activeCollaborators: 12,
    features: {
      departmentFilter: false,
      multilevelApproval: false,
      crossAreaAutomation: false,
      responsibleIndicators: false,
      granularPermissions: false,
      basicAutomations: true,
      aiAssistant: true,
    },
    defaultApprovalLabel: 'Flujo directo (Plan Start)',
  },
  business: {
    id: 'business',
    name: 'CoreFlow Business',
    collaboratorsRange: '16 a 30 colaboradores',
    maxCollaborators: 30,
    activeCollaborators: 18,
    features: {
      departmentFilter: true,
      multilevelApproval: true,
      crossAreaAutomation: true,
      responsibleIndicators: true,
      granularPermissions: true,
      basicAutomations: true,
      aiAssistant: true,
    },
    defaultApprovalLabel: 'Nivel 1 · Revisión de Área',
  },
}

export const ROLES_CONFIG = {
  'Administrador Organizacional': {
    id: 'admin',
    label: 'Administrador Organizacional',
    canCreateRequest: true,
    canChangeStatus: true,
    canApproveMultilevel: true,
    canConfigureOrg: true,
    allowedDepartments: 'all',
  },
  'Coordinación de Operaciones': {
    id: 'ops_coord',
    label: 'Coordinación de Operaciones',
    canCreateRequest: true,
    canChangeStatus: true,
    canApproveMultilevel: true,
    canConfigureOrg: false,
    allowedDepartments: ['Operaciones', 'Calidad', 'Documentación'],
  },
  'Líder de Área Comercial': {
    id: 'sales_lead',
    label: 'Líder de Área Comercial',
    canCreateRequest: true,
    canChangeStatus: true,
    canApproveMultilevel: false, // No tiene permiso para aprobar nivel 2 operativo
    canConfigureOrg: false,
    allowedDepartments: ['Comercial'],
  },
}

/**
 * Evalúa en la lógica si una acción está permitida según la edición (Start/Business) y el rol activo
 */
export function checkCapability(edition, roleName, capability) {
  const plan = EDITION_RULES[edition] || EDITION_RULES.start
  const role = ROLES_CONFIG[roleName] || ROLES_CONFIG['Administrador Organizacional']

  switch (capability) {
    case 'departmentFilter':
      return {
        allowed: plan.features.departmentFilter,
        reason: plan.features.departmentFilter
          ? 'Habilitado en edición Business'
          : 'El filtrado por departamentos requiere CoreFlow Business (16–30 colaboradores).',
      }
    case 'multilevelApproval':
      if (!plan.features.multilevelApproval) {
        return {
          allowed: false,
          reason: 'Las aprobaciones multinivel son exclusivas de CoreFlow Business.',
        }
      }
      if (!role.canApproveMultilevel) {
        return {
          allowed: false,
          reason: `El rol "${role.label}" no posee permisos granulares para validar niveles de aprobación operativa.`,
        }
      }
      return { allowed: true, reason: 'Permiso de aprobación multinivel activo.' }

    case 'responsibleIndicators':
      return {
        allowed: plan.features.responsibleIndicators,
        reason: plan.features.responsibleIndicators
          ? 'Habilitado en edición Business'
          : 'Los indicadores por responsable y área requieren CoreFlow Business.',
      }

    case 'crossAreaAutomation':
      return {
        allowed: plan.features.crossAreaAutomation,
        reason: plan.features.crossAreaAutomation
          ? 'Reglas entre áreas habilitadas'
          : 'En CoreFlow Starter se aplican automatizaciones básicas de notificación directa.',
      }

    default:
      return { allowed: true, reason: 'Capacidad estándar activa.' }
  }
}

/**
 * Datos base de solicitudes operativas (sincronizados entre Dashboard y módulos)
 */
export const INITIAL_REQUESTS_DATA = [
  {
    id: 'SOL-458',
    asunto: 'Parametrización de flujo de atención y seguimiento comercial',
    cliente: 'Cuenta Corporativa A (Sector Servicios)',
    clienteId: 'CTA-012',
    responsable: 'Coordinación de Operaciones',
    departamento: 'Operaciones',
    prioridad: 'Alta',
    estado: 'process',
    vencimiento: 'Hoy · 17:30',
    nivelAprobacion: 'Nivel 2 · Coordinación Operativa',
    tareasVinculadas: 3,
    documentosVinculados: 2,
  },
  {
    id: 'SOL-459',
    asunto: 'Actualización de anexo documental y matriz de permisos',
    cliente: 'Cuenta Empresarial B (Sector Operativo)',
    clienteId: 'CTA-019',
    responsable: 'Especialista Documental',
    departamento: 'Documentación',
    prioridad: 'Media',
    estado: 'pending',
    vencimiento: 'Mañana · 11:00',
    nivelAprobacion: 'Nivel 1 · Revisión Documental',
    tareasVinculadas: 2,
    documentosVinculados: 4,
  },
  {
    id: 'SOL-460',
    asunto: 'Activación de reglas de notificación y asignación automática',
    cliente: 'Organización Asociada C (Consultoría)',
    clienteId: 'CTA-024',
    responsable: 'Dirección de Proyecto',
    departamento: 'Tecnología',
    prioridad: 'Alta',
    estado: 'active',
    vencimiento: 'En tiempo (48h)',
    nivelAprobacion: 'Validado',
    tareasVinculadas: 1,
    documentosVinculados: 1,
  },
  {
    id: 'SOL-461',
    asunto: 'Validación de requisitos en entregable trimestral',
    cliente: 'Entidad Corporativa D (Soporte)',
    clienteId: 'CTA-031',
    responsable: 'Analista de Calidad y Procesos',
    departamento: 'Calidad',
    prioridad: 'Prioritaria',
    estado: 'error',
    vencimiento: 'Requiere revisión',
    nivelAprobacion: 'Observación en Nivel 2',
    tareasVinculadas: 2,
    documentosVinculados: 3,
  },
  {
    id: 'SOL-455',
    asunto: 'Cierre de incorporación inicial y configuración de entorno',
    cliente: 'Cuenta Corporativa A (Sector Servicios)',
    clienteId: 'CTA-012',
    responsable: 'Coordinación de Operaciones',
    departamento: 'Operaciones',
    prioridad: 'Media',
    estado: 'completed',
    vencimiento: 'Finalizado',
    nivelAprobacion: 'Validado',
    tareasVinculadas: 4,
    documentosVinculados: 3,
  },
]

/**
 * Series temporales por corte (7d, 30d, trimestre)
 * Nota: Los totales del período se recalculan dinámicamente cuando el usuario crea o completa solicitudes en la sesión.
 */
export const PERIOD_SERIES_BASE = {
  '7d': {
    id: '7d',
    label: 'Últimos 7 días',
    shortLabel: 'Período: 7 días',
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Hoy'],
    maxScale: 16,
    yTicks: [0, 4, 8, 12, 16],
    // Suma base = 42 gestionadas (33 cerradas en días previos + 9 en la bandeja/cierre actual)
    solicitudes: [5, 6, 5, 8, 7, 6, 5],
    // Suma base = 38 tareas completadas en 7 días
    tareas: [4, 5, 6, 5, 7, 6, 5],
    // Suma base = 29 ejecuciones automatizadas en 7 días
    automatizaciones: [3, 4, 4, 5, 5, 4, 4],
    baseResueltasPeriodo: 33,
    cumplimientoSla: '94.2%',
    deltas: {
      clientes: '+12%',
      oportunidades: '+8%',
      tareas: '-5% rezago',
      documentos: '+18%',
    },
  },
  '30d': {
    id: '30d',
    label: 'Últimos 30 días',
    shortLabel: 'Período: 30 días',
    labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Actual'],
    maxScale: 32,
    yTicks: [0, 8, 16, 24, 32],
    // Suma base = 164 gestionadas en 30 días
    solicitudes: [18, 22, 20, 25, 24, 27, 28],
    // Suma base = 148 tareas completadas en 30 días
    tareas: [16, 19, 21, 22, 23, 23, 24],
    // Suma base = 118 ejecuciones automatizadas en 30 días
    automatizaciones: [12, 14, 16, 17, 19, 20, 20],
    baseResueltasPeriodo: 155,
    cumplimientoSla: '95.1%',
    deltas: {
      clientes: '+19%',
      oportunidades: '+14%',
      tareas: '-11% rezago',
      documentos: '+26%',
    },
  },
  trimestre: {
    id: 'trimestre',
    label: 'Trimestre actual',
    shortLabel: 'Período: Trimestre',
    labels: ['Mes 1·A', 'Mes 1·B', 'Mes 2·A', 'Mes 2·B', 'Mes 3·A', 'Mes 3·B', 'Cierre'],
    maxScale: 90,
    yTicks: [0, 22, 45, 68, 90],
    // Suma base = 468 gestionadas en el trimestre
    solicitudes: [52, 58, 64, 68, 72, 75, 79],
    // Suma base = 432 tareas completadas en el trimestre
    tareas: [48, 54, 58, 62, 66, 70, 74],
    // Suma base = 356 ejecuciones automatizadas en el trimestre
    automatizaciones: [38, 44, 48, 52, 55, 58, 61],
    baseResueltasPeriodo: 459,
    cumplimientoSla: '96.0%',
    deltas: {
      clientes: '+34%',
      oportunidades: '+22%',
      tareas: '-18% rezago',
      documentos: '+41%',
    },
  },
}

/**
 * Calcula las métricas unificadas para el Dashboard, el Sidebar, el Gráfico y las vistas preliminares de Módulos
 */
export function computeUnifiedMetrics(requests, period = '7d', edition = 'business') {
  const basePeriod = PERIOD_SERIES_BASE[period] || PERIOD_SERIES_BASE['7d']
  const extraCreated = Math.max(0, requests.length - INITIAL_REQUESTS_DATA.length)

  const completedInList = requests.filter((r) => r.estado === 'completed').length
  const activeInList = requests.filter((r) => r.estado !== 'completed').length
  const pendingValidationCount = requests.filter(
    (r) => r.estado === 'pending' || r.estado === 'error'
  ).length

  // Las solicitudes en seguimiento activo son las 5 históricas de otras áreas + las activas en la tabla principal
  const solicitudesEnSeguimiento = 5 + activeInList

  // Las resueltas del período suman la base histórica del período + las completadas en la bandeja
  const solicitudesResueltasPeriodo = basePeriod.baseResueltasPeriodo + completedInList
  const totalSolicitudesGestionadasPeriodo =
    solicitudesResueltasPeriodo + (solicitudesEnSeguimiento - 1) // 34 + 8 = 42 en estado inicial 7d

  // Ajustar el último punto de la serie de solicitudes si se crearon nuevas en la sesión
  const solicitudesSeries = [...basePeriod.solicitudes]
  solicitudesSeries[solicitudesSeries.length - 1] += extraCreated

  const totalTareasCerradasPeriodo = basePeriod.tareas.reduce((a, b) => a + b, 0)
  const totalAutomatizacionesPeriodo = basePeriod.automatizaciones.reduce((a, b) => a + b, 0)

  return {
    periodInfo: basePeriod,
    // 1. Indicadores Acumulados / Estado Actual (Inventario vivo)
    acumulados: {
      clientesTotal: 48,
      clientesActivos: 38,
      clientesIncorporacion: 10,
      oportunidadesActivas: 16,
      oportunidadesPropuesta: 9,
      oportunidadesValidacion: 7,
      tareasPendientesActuales: 24,
      tareasHoy: 8,
      tareasSemana: 16,
      documentosTotales: 132,
      documentosVigentes: 126,
      documentosRevision: 6,
      solicitudesEnSeguimiento,
      pendingValidationCount,
    },
    // 2. Indicadores del Período Seleccionado (7d, 30d o Trimestre)
    periodo: {
      label: basePeriod.label,
      shortLabel: basePeriod.shortLabel,
      solicitudesGestionadas: totalSolicitudesGestionadasPeriodo,
      solicitudesResueltas: solicitudesResueltasPeriodo,
      tareasCerradas: totalTareasCerradasPeriodo,
      automatizacionesEjecutadas: totalAutomatizacionesPeriodo,
      cumplimientoSla: basePeriod.cumplimientoSla,
      deltas: basePeriod.deltas,
      series: {
        labels: basePeriod.labels,
        maxScale: basePeriod.maxScale,
        yTicks: basePeriod.yTicks,
        solicitudes: solicitudesSeries,
        tareas: basePeriod.tareas,
        automatizaciones: basePeriod.automatizaciones,
      },
    },
    editionRules: EDITION_RULES[edition] || EDITION_RULES.start,
  }
}

export const INITIAL_ACTIVITY_FEED = [
  {
    id: 'act-1',
    title: 'Cuenta corporativa incorporada al directorio',
    detail: 'Ficha organizacional y contacto principal vinculados al flujo comercial',
    time: 'Hace 2 horas',
    category: 'Clientes',
    status: 'active',
    iconType: 'user',
    linkedRequestId: 'SOL-460',
  },
  {
    id: 'act-2',
    title: 'Solicitud #SOL-458 asignada a Operaciones',
    detail: 'Requerimiento operativo derivado con prioridad alta y SLA de 24h',
    time: 'Hace 4 horas',
    category: 'Solicitudes',
    status: 'process',
    iconType: 'request',
    linkedRequestId: 'SOL-458',
  },
  {
    id: 'act-3',
    title: 'Procedimiento estandarizado validado',
    detail: 'Documento normativo aprobado en el repositorio central',
    time: 'Hace 6 horas',
    category: 'Documentos',
    status: 'completed',
    iconType: 'doc',
    linkedRequestId: 'SOL-459',
  },
  {
    id: 'act-4',
    title: 'Verificación de entregables completada',
    detail: 'Lista de control operativa cerrada sin observaciones pendientes',
    time: 'Hace 8 horas',
    category: 'Tareas',
    status: 'completed',
    iconType: 'check',
    linkedRequestId: 'SOL-455',
  },
]

export const BUSINESS_AREAS_PERFORMANCE = [
  {
    rol: 'Coordinación de Operaciones',
    departamento: 'Área de Operaciones y Procesos',
    asignadas: 14,
    completadas: 13,
    cumplimiento: 93,
    estado: 'active',
  },
  {
    rol: 'Líder de Gestión Comercial',
    departamento: 'Área Comercial y Oportunidades',
    asignadas: 11,
    completadas: 9,
    cumplimiento: 86,
    estado: 'process',
  },
  {
    rol: 'Especialista Documental',
    departamento: 'Área de Gestión Documental',
    asignadas: 9,
    completadas: 9,
    cumplimiento: 100,
    estado: 'completed',
  },
  {
    rol: 'Analista de Calidad y Procesos',
    departamento: 'Área de Control y Calidad',
    asignadas: 8,
    completadas: 6,
    cumplimiento: 78,
    estado: 'pending',
  },
]
