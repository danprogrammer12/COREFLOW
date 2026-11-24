// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * MOTOR ANALÍTICO UNIFICADO POR ORGANIZACIÓN (ACUMULADOS VS CORTE TEMPORAL)
 * CoreFlow — src/core/services/MetricsEngineService.js
 *
 * Condición 4 y 9: Calcula los indicadores acumulados (inventario actual del tenant)
 * y los indicadores de corte temporal (7d, 30d, trimestre) aislados por organización.
 * 100% desacoplado de React.
 */

const TENANT_INVENTORY_BASE = Object.freeze({
  'org-principal': {
    initialRequestCount: 5,
    historicalActiveBacklog: 4,
    acumuladosBase: {
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
    },
    periods: {
      '7d': {
        id: '7d',
        label: 'Últimos 7 días',
        shortLabel: 'Período: 7 días',
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Hoy'],
        maxScale: 16,
        yTicks: [0, 4, 8, 12, 16],
        solicitudes: [5, 6, 5, 8, 7, 6, 5],
        tareas: [4, 5, 6, 5, 7, 6, 5],
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
        solicitudes: [18, 22, 20, 25, 24, 27, 28],
        tareas: [16, 19, 21, 22, 23, 23, 24],
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
        solicitudes: [52, 58, 64, 68, 72, 75, 79],
        tareas: [48, 54, 58, 62, 66, 70, 74],
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
    },
  },
  'org-pyme': {
    initialRequestCount: 3,
    historicalActiveBacklog: 2,
    acumuladosBase: {
      clientesTotal: 19,
      clientesActivos: 15,
      clientesIncorporacion: 4,
      oportunidadesActivas: 7,
      oportunidadesPropuesta: 4,
      oportunidadesValidacion: 3,
      tareasPendientesActuales: 11,
      tareasHoy: 4,
      tareasSemana: 7,
      documentosTotales: 54,
      documentosVigentes: 51,
      documentosRevision: 3,
    },
    periods: {
      '7d': {
        id: '7d',
        label: 'Últimos 7 días',
        shortLabel: 'Período: 7 días',
        labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Hoy'],
        maxScale: 12,
        yTicks: [0, 3, 6, 9, 12],
        solicitudes: [2, 3, 2, 4, 3, 3, 3],
        tareas: [2, 2, 3, 3, 3, 2, 3],
        automatizaciones: [1, 2, 2, 2, 3, 2, 2],
        baseResueltasPeriodo: 15,
        cumplimientoSla: '92.5%',
        deltas: {
          clientes: '+9%',
          oportunidades: '+6%',
          tareas: '-4% rezago',
          documentos: '+11%',
        },
      },
      '30d': {
        id: '30d',
        label: 'Últimos 30 días',
        shortLabel: 'Período: 30 días',
        labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6', 'Actual'],
        maxScale: 20,
        yTicks: [0, 5, 10, 15, 20],
        solicitudes: [8, 9, 10, 11, 10, 12, 12],
        tareas: [7, 8, 9, 10, 10, 11, 11],
        automatizaciones: [5, 6, 7, 7, 8, 8, 9],
        baseResueltasPeriodo: 67,
        cumplimientoSla: '93.4%',
        deltas: {
          clientes: '+14%',
          oportunidades: '+10%',
          tareas: '-8% rezago',
          documentos: '+17%',
        },
      },
      trimestre: {
        id: 'trimestre',
        label: 'Trimestre actual',
        shortLabel: 'Período: Trimestre',
        labels: ['Mes 1·A', 'Mes 1·B', 'Mes 2·A', 'Mes 2·B', 'Mes 3·A', 'Mes 3·B', 'Cierre'],
        maxScale: 48,
        yTicks: [0, 12, 24, 36, 48],
        solicitudes: [22, 24, 26, 28, 30, 32, 34],
        tareas: [20, 22, 24, 26, 28, 29, 31],
        automatizaciones: [15, 17, 19, 20, 22, 23, 25],
        baseResueltasPeriodo: 191,
        cumplimientoSla: '94.1%',
        deltas: {
          clientes: '+24%',
          oportunidades: '+16%',
          tareas: '-12% rezago',
          documentos: '+28%',
        },
      },
    },
  },
})

export class MetricsEngineService {
  computeOrganizationMetrics({
    organizationId = 'org-principal',
    requests = [],
    period = '7d',
    entitlementsResolved = null,
  } = {}) {
    const tenantProfile =
      TENANT_INVENTORY_BASE[organizationId] || TENANT_INVENTORY_BASE['org-principal']
    const basePeriod =
      tenantProfile.periods[period] || tenantProfile.periods['7d']

    // Filtrar estrictamente solicitudes que pertenezcan a la organización activa
    const scopedRequests = requests.filter(
      (r) => !r.organizationId || r.organizationId === organizationId
    )

    const extraCreated = Math.max(
      0,
      scopedRequests.length - tenantProfile.initialRequestCount
    )
    const completedInList = scopedRequests.filter((r) => r.estado === 'completed').length
    const activeInList = scopedRequests.filter((r) => r.estado !== 'completed').length
    const pendingValidationCount = scopedRequests.filter(
      (r) => r.estado === 'pending' || r.estado === 'error'
    ).length

    const solicitudesEnSeguimiento =
      tenantProfile.historicalActiveBacklog + 1 + activeInList
    const solicitudesResueltasPeriodo =
      basePeriod.baseResueltasPeriodo + completedInList
    const totalSolicitudesGestionadasPeriodo =
      solicitudesResueltasPeriodo + (solicitudesEnSeguimiento - 1)

    const solicitudesSeries = [...basePeriod.solicitudes]
    solicitudesSeries[solicitudesSeries.length - 1] += extraCreated

    const totalTareasCerradasPeriodo = basePeriod.tareas.reduce((a, b) => a + b, 0)
    const totalAutomatizacionesPeriodo = basePeriod.automatizaciones.reduce(
      (a, b) => a + b,
      0
    )

    return {
      organizationId,
      periodInfo: basePeriod,
      acumulados: {
        ...tenantProfile.acumuladosBase,
        solicitudesEnSeguimiento,
        pendingValidationCount,
      },
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
      entitlementsResolved,
    }
  }
}
