/**
 * CATÁLOGO BASE Y RESOLUTOR DINÁMICO DE PLANES, CAPACIDADES Y CUOTAS
 * CoreFlow — src/core/config/plansCatalog.js
 *
 * Los planes se almacenan y administran en PostgreSQL (`plan_catalog` y
 * `organization_subscriptions`). Este módulo provee la estructura base
 * normalizada y el mapeo entre el esquema SQL y el motor de capacidades.
 */

const STARTER_DEFINITION = Object.freeze({
  planCode: 'starter',
  displayName: 'CoreFlow Starter',
  description:
    'Suscripción para organizaciones de 1 a 15 colaboradores con gestión centralizada de clientes, comercial, solicitudes, tareas y documentos.',
  priceMonthlyUsd: 49,
  collaboratorsRangeLabel: '1 a 15 colaboradores',
  limits: {
    maxCollaborators: 15,
    maxBranches: 1,
    maxStorageMb: null,
    maxAdmins: 2,
    maxActiveAutomations: 3,
  },
  features: {
    multiBranch: false,
    departmentsAndTeams: false,
    granularPermissions: false,
    multilevelApprovals: false,
    crossAreaAutomations: false,
    responsibleIndicators: false,
    basicAutomations: true,
    aiAssistant: false,
  },
  defaultApprovalSummary: 'Flujo directo (Plan Starter)',
  isActive: true,
})

const BUSINESS_DEFINITION = Object.freeze({
  planCode: 'business',
  displayName: 'CoreFlow Business',
  description:
    'Suscripción empresarial de 16 a 30+ colaboradores con departamentos y equipos, permisos granulares, aprobaciones multinivel, automatizaciones entre áreas e indicadores por responsable.',
  priceMonthlyUsd: 129,
  collaboratorsRangeLabel: '16 a 30 colaboradores',
  limits: {
    maxCollaborators: 30,
    maxBranches: 10,
    maxStorageMb: 25600,
    maxAdmins: null,
    maxActiveAutomations: null,
  },
  features: {
    multiBranch: true,
    departmentsAndTeams: true,
    granularPermissions: true,
    multilevelApprovals: true,
    crossAreaAutomations: true,
    responsibleIndicators: true,
    basicAutomations: true,
    aiAssistant: true,
  },
  defaultApprovalSummary: 'Nivel 1 · Revisión de Área',
  isActive: true,
})

/** Un límite sin valor es null: no aplica o aún no está configurado. */
function optionalNumber(value) {
  return value === null || value === undefined || value === '' ? null : Number(value)
}

export const PLANS_CATALOG = Object.freeze({
  starter: STARTER_DEFINITION,
  start: { ...STARTER_DEFINITION, planCode: 'start' },
  business: BUSINESS_DEFINITION,
})

/**
 * Normaliza un registro proveniente de la tabla PostgreSQL `plan_catalog`
 * hacia la estructura estándar del motor de capacidades.
 */
export function normalizeDatabasePlanRow(row) {
  if (!row) return STARTER_DEFINITION
  const limits = row.limits || row.limits_json || {}
  const features = row.features || row.features_json || {}

  return {
    planCode: row.planCode || row.plan_code || 'starter',
    displayName: row.displayName || row.display_name || 'CoreFlow Plan',
    description: row.description || '',
    priceMonthlyUsd: Number(row.priceMonthlyUsd ?? row.price_monthly_usd ?? 0),
    collaboratorsRangeLabel:
      row.collaboratorsRangeLabel ||
      row.collaborators_range_label ||
      `1 a ${limits.maxCollaborators || limits.max_collaborators || 15} colaboradores`,
    limits: {
      maxCollaborators: Number(limits.maxCollaborators ?? limits.max_collaborators ?? 15),
      maxBranches: Number(limits.maxBranches ?? limits.max_branches ?? 1),
      maxStorageMb: optionalNumber(limits.maxStorageMb ?? limits.max_storage_mb),
      maxAdmins: optionalNumber(limits.maxAdmins ?? limits.max_admins),
      maxActiveAutomations: optionalNumber(limits.maxActiveAutomations ?? limits.max_active_automations),
    },
    features: {
      multiBranch: Boolean(features.multiBranch ?? features.multi_branch ?? false),
      departmentsAndTeams: Boolean(
        features.departmentsAndTeams ?? features.departments_and_teams ?? false
      ),
      granularPermissions: Boolean(
        features.granularPermissions ?? features.granular_permissions ?? false
      ),
      multilevelApprovals: Boolean(
        features.multilevelApprovals ?? features.multilevel_approvals ?? false
      ),
      crossAreaAutomations: Boolean(
        features.crossAreaAutomations ?? features.cross_area_automations ?? false
      ),
      responsibleIndicators: Boolean(
        features.responsibleIndicators ?? features.responsible_indicators ?? false
      ),
      basicAutomations: Boolean(
        features.basicAutomations ?? features.basic_automations ?? true
      ),
      aiAssistant: Boolean(features.aiAssistant ?? features.ai_assistant ?? false),
    },
    defaultApprovalSummary:
      row.defaultApprovalSummary ||
      row.default_approval_summary ||
      'Flujo estándar',
    isActive: row.isActive ?? row.is_active ?? true,
  }
}

export function resolvePlanDefinition(planCode, customPlansCatalog = null) {
  const normalizedCode = planCode === 'start' ? 'starter' : planCode
  if (customPlansCatalog && Array.isArray(customPlansCatalog)) {
    const found = customPlansCatalog.find(
      (p) => p.planCode === planCode || p.planCode === normalizedCode || p.plan_code === planCode
    )
    if (found) return normalizeDatabasePlanRow(found)
  }
  return PLANS_CATALOG[planCode] || PLANS_CATALOG[normalizedCode] || STARTER_DEFINITION
}
