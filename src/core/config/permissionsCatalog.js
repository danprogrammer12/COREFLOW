/**
 * CATÁLOGO DE ROLES, PERMISOS ATÓMICOS Y ALCANCES DE DATOS (DATA SCOPES)
 * CoreFlow — src/core/config/permissionsCatalog.js
 *
 * Condición 5: Separa usuarios autenticados, perfiles, membresías y roles organizacionales.
 */

export const DATA_SCOPES = Object.freeze({
  ORG_WIDE: 'ORG_WIDE',
  BRANCH_SCOPE: 'BRANCH_SCOPE',
  DEPARTMENT_SCOPE: 'DEPARTMENT_SCOPE',
  TEAM_OR_ASSIGNED: 'TEAM_OR_ASSIGNED',
})

export const ATOMIC_PERMISSIONS = Object.freeze({
  ORG_READ_STRUCTURE: 'org:read_structure',
  ORG_MANAGE_BRANCHES: 'org:manage_branches',
  ORG_MANAGE_DEPARTMENTS: 'org:manage_departments',
  ORG_MANAGE_MEMBERS: 'org:manage_members',
  SECURITY_MANAGE_ROLES: 'security:manage_roles',
  AUDIT_READ_LOGS: 'audit:read_logs',
  CLIENTS_READ: 'clients:read',
  CLIENTS_WRITE: 'clients:write',
  OPPORTUNITIES_READ: 'opportunities:read',
  OPPORTUNITIES_WRITE: 'opportunities:write',
  REQUESTS_READ: 'requests:read',
  REQUESTS_CREATE: 'requests:create',
  REQUESTS_UPDATE: 'requests:update',
  APPROVALS_VALIDATE_LEVEL: 'approvals:validate_level',
  TASKS_READ: 'tasks:read',
  TASKS_WRITE: 'tasks:write',
  DOCUMENTS_READ: 'documents:read',
  DOCUMENTS_WRITE: 'documents:write',
  DOCUMENTS_APPROVE: 'documents:approve',
  AUTOMATIONS_WRITE: 'automations:write',
})

export const SYSTEM_ROLE_TEMPLATES = Object.freeze({
  ORG_ADMIN: {
    code: 'ORG_ADMIN',
    name: 'Administrador Organizacional',
    description: 'Control integral de la organización, estructura, seguridad y flujos.',
    defaultScope: DATA_SCOPES.ORG_WIDE,
    isSystemRole: true,
    permissions: Object.values(ATOMIC_PERMISSIONS).map((perm) => ({
      permissionKey: perm,
      scopeOverride: DATA_SCOPES.ORG_WIDE,
    })),
  },
  OPS_COORDINATOR: {
    code: 'OPS_COORDINATOR',
    name: 'Coordinación de Operaciones',
    description: 'Coordina procesos, solicitudes, tareas y aprobaciones de su área operativa.',
    defaultScope: DATA_SCOPES.DEPARTMENT_SCOPE,
    isSystemRole: true,
    permissions: [
      { permissionKey: ATOMIC_PERMISSIONS.ORG_READ_STRUCTURE, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.AUDIT_READ_LOGS, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
      { permissionKey: ATOMIC_PERMISSIONS.CLIENTS_READ, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.OPPORTUNITIES_READ, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.REQUESTS_READ, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
      { permissionKey: ATOMIC_PERMISSIONS.REQUESTS_CREATE, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
      { permissionKey: ATOMIC_PERMISSIONS.REQUESTS_UPDATE, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
      { permissionKey: ATOMIC_PERMISSIONS.APPROVALS_VALIDATE_LEVEL, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
      { permissionKey: ATOMIC_PERMISSIONS.TASKS_READ, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
      { permissionKey: ATOMIC_PERMISSIONS.TASKS_WRITE, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
      { permissionKey: ATOMIC_PERMISSIONS.DOCUMENTS_READ, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.DOCUMENTS_WRITE, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
      { permissionKey: ATOMIC_PERMISSIONS.DOCUMENTS_APPROVE, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
      { permissionKey: ATOMIC_PERMISSIONS.AUTOMATIONS_WRITE, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
    ],
  },
  COMMERCIAL_LEAD: {
    code: 'COMMERCIAL_LEAD',
    name: 'Líder de Área Comercial',
    description: 'Gestiona clientes, oportunidades y solicitudes comerciales sin aprobar niveles operativos.',
    defaultScope: DATA_SCOPES.DEPARTMENT_SCOPE,
    isSystemRole: true,
    permissions: [
      { permissionKey: ATOMIC_PERMISSIONS.ORG_READ_STRUCTURE, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.CLIENTS_READ, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.CLIENTS_WRITE, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.OPPORTUNITIES_READ, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.OPPORTUNITIES_WRITE, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.REQUESTS_READ, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
      { permissionKey: ATOMIC_PERMISSIONS.REQUESTS_CREATE, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.REQUESTS_UPDATE, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
      { permissionKey: ATOMIC_PERMISSIONS.TASKS_READ, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
      { permissionKey: ATOMIC_PERMISSIONS.TASKS_WRITE, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
      { permissionKey: ATOMIC_PERMISSIONS.DOCUMENTS_READ, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.DOCUMENTS_WRITE, scopeOverride: DATA_SCOPES.DEPARTMENT_SCOPE },
    ],
  },
  SPECIALIST: {
    code: 'SPECIALIST',
    name: 'Especialista Operativo / Documental',
    description: 'Ejecuta solicitudes, tareas y validación documental dentro de sus asignaciones.',
    defaultScope: DATA_SCOPES.TEAM_OR_ASSIGNED,
    isSystemRole: true,
    permissions: [
      { permissionKey: ATOMIC_PERMISSIONS.ORG_READ_STRUCTURE, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.CLIENTS_READ, scopeOverride: DATA_SCOPES.TEAM_OR_ASSIGNED },
      { permissionKey: ATOMIC_PERMISSIONS.REQUESTS_READ, scopeOverride: DATA_SCOPES.TEAM_OR_ASSIGNED },
      { permissionKey: ATOMIC_PERMISSIONS.REQUESTS_UPDATE, scopeOverride: DATA_SCOPES.TEAM_OR_ASSIGNED },
      { permissionKey: ATOMIC_PERMISSIONS.TASKS_READ, scopeOverride: DATA_SCOPES.TEAM_OR_ASSIGNED },
      { permissionKey: ATOMIC_PERMISSIONS.TASKS_WRITE, scopeOverride: DATA_SCOPES.TEAM_OR_ASSIGNED },
      { permissionKey: ATOMIC_PERMISSIONS.DOCUMENTS_READ, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.DOCUMENTS_WRITE, scopeOverride: DATA_SCOPES.TEAM_OR_ASSIGNED },
    ],
  },
  AUDITOR_VIEWER: {
    code: 'AUDITOR_VIEWER',
    name: 'Consulta y Auditoría',
    description: 'Acceso de solo lectura a estructura, indicadores y registros de auditoría.',
    defaultScope: DATA_SCOPES.ORG_WIDE,
    isSystemRole: true,
    permissions: [
      { permissionKey: ATOMIC_PERMISSIONS.ORG_READ_STRUCTURE, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.AUDIT_READ_LOGS, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.CLIENTS_READ, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.OPPORTUNITIES_READ, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.REQUESTS_READ, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.TASKS_READ, scopeOverride: DATA_SCOPES.ORG_WIDE },
      { permissionKey: ATOMIC_PERMISSIONS.DOCUMENTS_READ, scopeOverride: DATA_SCOPES.ORG_WIDE },
    ],
  },
})
