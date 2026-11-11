/**
 * Textos visibles para valores internos del sistema.
 * Los códigos siguen viajando sin cambios entre servicios; aquí solo se traducen
 * para mostrarlos a las personas.
 */

const ROLE_LABELS = Object.freeze({
  SUPER_ADMIN: 'Superadministrador',
  PLATFORM_OPS: 'Operaciones de plataforma',
  PLATFORM_AUDITOR: 'Auditor de plataforma',
  ORG_ADMIN: 'Administrador',
  SUPERVISOR: 'Supervisor',
  COLLABORATOR: 'Colaborador',
  OPS_COORDINATOR: 'Coordinador de operaciones',
  COMMERCIAL_LEAD: 'Líder comercial',
  SPECIALIST: 'Especialista',
})

const FEATURE_LABELS = Object.freeze({
  multiBranch: 'Varias sedes',
  departmentsAndTeams: 'Departamentos y equipos',
  granularPermissions: 'Permisos detallados',
  multilevelApprovals: 'Aprobaciones por niveles',
  crossAreaAutomations: 'Automatizaciones entre áreas',
  responsibleIndicators: 'Indicadores por responsable',
  basicAutomations: 'Automatizaciones básicas',
  aiAssistant: 'Asistente de IA',
})

const AUDIT_ACTION_LABELS = Object.freeze({
  TENANT_INITIALIZED: 'Organización inicializada',
  TENANT_CONTEXT_SWITCHED: 'Cambio de organización activa',
  SESSION_AUTHENTICATED: 'Inicio de sesión',
  ACCESS_DENIED: 'Acceso denegado',
  REQUEST_CREATED: 'Solicitud creada',
  REQUEST_STATUS_TRANSITIONED: 'Cambio de estado de solicitud',
  APPROVAL_STEP_VALIDATED: 'Aprobación registrada',
  DEPARTMENT_CREATED: 'Departamento creado',
  PLAN_CATALOG_UPSERTED: 'Plan guardado',
  ORGANIZATION_CREATED: 'Organización creada',
  SUBSCRIPTION_UPDATED: 'Suscripción actualizada',
  ENTITLEMENT_OVERRIDE_UPDATED: 'Capacidad ajustada',
  CLIENT_CREATED: 'Cliente creado',
  OPPORTUNITY_CREATED: 'Oportunidad creada',
  TASK_CREATED: 'Tarea creada',
  TASK_STATUS_UPDATED: 'Cambio de estado de tarea',
  DOCUMENT_REGISTERED: 'Documento registrado',
  AUTOMATION_RULE_CREATED: 'Automatización creada',
})

function humanize(code) {
  const text = String(code ?? '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export const roleLabel = (code) => ROLE_LABELS[code] || humanize(code)
export const featureLabel = (key) => FEATURE_LABELS[key] || humanize(key)
export const auditActionLabel = (action) => AUDIT_ACTION_LABELS[action] || humanize(action)

export const STORAGE_NOT_CONFIGURED = 'Pendiente de configuración'

/** Una capacidad sin valor no equivale a cero: significa que aún no se ha definido. */
export function formatStorageMb(mb) {
  if (typeof mb !== 'number' || !Number.isFinite(mb) || mb <= 0) return STORAGE_NOT_CONFIGURED
  return mb >= 1024 ? `${Math.round(mb / 1024)} GB` : `${mb} MB`
}
