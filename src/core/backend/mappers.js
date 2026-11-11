/**
 * MAPEADORES ENTRE EL ESQUEMA SQL Y EL CONTRATO QUE CONSUMEN LAS VISTAS
 * CoreFlow — src/core/backend/mappers.js
 *
 * Las vistas leen los campos que produce LocalRelationalProvider (camelCase y, en
 * solicitudes, nombres en español). Estos mapeadores los conservan.
 */

export function toCamelKey(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
}

export function toSnakeKey(key) {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)
}

export function camelizeRow(row) {
  if (!row) return row
  return Object.fromEntries(Object.entries(row).map(([k, v]) => [toCamelKey(k), v]))
}

export function camelizeKeys(object = {}) {
  return camelizeRow(object)
}

/** Clave canónica de `organization_entitlements`: `max_*` y `feature.<snake_case>`. */
export function canonicalEntitlementKey(key) {
  const text = String(key || '')
  if (text.startsWith('feature.')) return `feature.${toSnakeKey(text.slice(8))}`
  return toSnakeKey(text)
}

export function buildDirectory({ departments = [], members = [] }) {
  return {
    departments: new Map(departments.map((d) => [d.id, d])),
    members: new Map(members.map((m) => [m.id, m])),
  }
}

const memberName = (directory, id, fallback) =>
  directory.members.get(id)?.displayName || fallback

const departmentName = (directory, id, fallback) =>
  directory.departments.get(id)?.name || fallback

export function mapMember(row, { profile = null, role = null } = {}) {
  return {
    ...camelizeRow(row),
    roleCode: role?.code || null,
    displayName: profile?.full_name || row.job_title,
    email: profile?.email || null,
  }
}

export function mapRequest(row, directory) {
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    asunto: row.subject,
    cliente: row.client_display_name,
    clienteId: row.client_reference_code,
    branchId: row.branch_id,
    departmentId: row.department_id,
    departamento: departmentName(directory, row.department_id, 'Operación General'),
    assignedMemberId: row.assigned_member_id,
    createdByMemberId: row.created_by_member_id,
    responsable: memberName(directory, row.assigned_member_id, 'Sin asignar'),
    prioridad: row.priority,
    estado: row.status,
    vencimiento: row.due_label,
    nivelAprobacion: row.approval_summary,
    createdAt: row.created_at,
    deletedAt: row.deleted_at,
  }
}

export function mapApprovalStep(row) {
  return camelizeRow(row)
}

export function mapClient(row, directory) {
  return {
    ...camelizeRow(row),
    ownerName: memberName(directory, row.owner_member_id, 'Sin responsable'),
    meta: `Sector: ${row.sector} · NIT ${row.tax_id || 'Sin registrar'}`,
  }
}

export function mapOpportunity(row, directory) {
  const value = Number(row.estimated_value)
  return {
    ...camelizeRow(row),
    estimatedValue: value,
    ownerName: memberName(directory, row.owner_member_id, 'Sin responsable'),
    area: `Etapa: ${row.stage}`,
    meta: `Valor est.: $${value.toLocaleString('es-CO')} ${row.currency}`,
  }
}

export function mapTask(row, directory) {
  return {
    ...camelizeRow(row),
    owner: memberName(directory, row.assigned_member_id, 'Sin asignar'),
    area: departmentName(directory, row.department_id, 'General'),
    meta: `${row.due_label} · Prioridad ${row.priority}`,
  }
}

export function mapDocument(row, directory) {
  return {
    ...camelizeRow(row),
    owner: memberName(directory, row.uploaded_by_member_id, 'Repositorio Documental'),
    meta: `${row.version} · Storage: ${row.storage_path}`,
  }
}

export function mapDocumentVersion(row) {
  return camelizeRow(row)
}

export function mapAutomationRule(row) {
  const isCrossArea = row.scope_type === 'cross_department_workflow'
  return {
    ...camelizeRow(row),
    owner: 'Configuración Organizacional',
    area: isCrossArea ? 'Flujo entre áreas (Business)' : 'Notificación directa',
    meta: `${isCrossArea ? 'Automatización entre áreas' : 'Automatización básica'} · ${
      row.status === 'active' ? 'Activa' : 'Inactiva'
    }`,
  }
}

export function mapAuditLog(row) {
  return { ...camelizeRow(row), changes: row.sanitized_changes }
}

/** Convierte las capacidades calculadas en PostgreSQL al contrato de `entitlementsResolved`. */
export function mapCapabilities(capabilities) {
  const limits = camelizeKeys(capabilities.limits)
  const features = camelizeKeys(capabilities.features)
  const current = Number(capabilities.usage.collaborators)
  const max = Number(limits.maxCollaborators)

  return {
    contractedEdition: capabilities.plan_code,
    normalizedEdition: capabilities.plan_code,
    contractedPlanName: capabilities.plan_name,
    subscriptionStatus: capabilities.subscription_status,
    isSubscriptionActive: Boolean(capabilities.can_write),
    canWrite: Boolean(capabilities.can_write),
    subscriptionValidUntil: capabilities.valid_until,
    realLimits: Object.freeze(limits),
    realFeatures: Object.freeze(features),
    collaboratorsStatus: {
      current,
      max,
      remaining: Math.max(0, max - current),
      usagePercent: max > 0 ? Math.min(100, Math.round((current / max) * 100)) : 100,
      rangeLabel: capabilities.collaborators_range_label,
    },
    usage: {
      collaborators: current,
      branches: Number(capabilities.usage.branches),
      admins: Number(capabilities.usage.admins),
      activeAutomations: Number(capabilities.usage.active_automations),
      storageBytes: Number(capabilities.usage.storage_bytes),
    },
    storageConfigured: limits.maxStorageMb !== null,
    simulationOverlay: null,
    isSimulationActive: false,
    presentationEdition: capabilities.plan_code,
    presentationPlanName: capabilities.plan_name,
    presentationFeatures: Object.freeze({ ...features }),
    defaultApprovalSummary: capabilities.default_approval_summary,
  }
}
