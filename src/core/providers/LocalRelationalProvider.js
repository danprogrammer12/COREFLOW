/**
 * PROVEEDOR RELACIONAL MULTI-TENANT CON PERSISTENCIA Y TRES CONTEXTOS DE ACCESO
 * CoreFlow — src/core/providers/LocalRelationalProvider.js
 *
 * Implementa el contrato completo IDataProvider para:
 *  A. CoreFlow Platform Admin (Gobierno global, planes en BD, suscripciones, auditoría global)
 *  B. CoreFlow Starter (Organización independiente con suscripción Starter)
 *  C. CoreFlow Business (Organización independiente con suscripción Business)
 */

import { PLANS_CATALOG, normalizeDatabasePlanRow } from '../config/plansCatalog.js'
import { SYSTEM_ROLE_TEMPLATES } from '../config/permissionsCatalog.js'
import { assertSameOrganizationReference } from '../domain/integrityValidator.js'
import { createImmutableAuditRecord } from '../domain/auditSanitizer.js'

const STORAGE_KEY = 'coreflow_saas_relational_state_v2'

function createInitialRelationalSeed() {
  const now = '2026-11-10T14:00:00.000Z'

  // 1. Catálogo de Planes almacenado en Base de Datos (Administrable por Platform Admin)
  const planCatalog = [
    normalizeDatabasePlanRow(PLANS_CATALOG.starter),
    normalizeDatabasePlanRow(PLANS_CATALOG.business),
  ]

  // 2. Perfiles de Usuario y las 3 Cuentas Diferenciadas (Sección 5)
  const userProfiles = [
    // Cuenta 1: Administrador Global de Plataforma (CoreFlow Platform Admin)
    {
      id: 'usr-platform-admin',
      email: 'platform.admin@coreflow.app',
      fullName: 'Administración Global CoreFlow',
      accountType: 'PLATFORM_ADMIN',
      preferredLocale: 'es-CO',
      createdAt: now,
    },
    // Cuenta 2: Administrador de Organización Starter (Exclusivo de org-pyme)
    {
      id: 'usr-starter-admin',
      email: 'admin.starter@unidadpyme.co',
      fullName: 'Dirección Operativa Starter',
      accountType: 'STARTER_ORG_ADMIN',
      preferredLocale: 'es-CO',
      createdAt: now,
    },
    // Cuenta 3: Administrador de Organización Business (Exclusivo de org-principal)
    {
      id: 'usr-business-admin',
      email: 'admin.business@corporativoprincipal.co',
      fullName: 'Dirección Corporativa Business',
      accountType: 'BUSINESS_ORG_ADMIN',
      preferredLocale: 'es-CO',
      createdAt: now,
    },
    // Perfiles operativos adicionales de la organización Business (org-principal)
    {
      id: 'usr-auth-01',
      email: 'acceso.demo@coreflow.app',
      fullName: 'Sesión Ejecutiva CoreFlow',
      accountType: 'MULTI_ORG_TEST',
      preferredLocale: 'es-CO',
      createdAt: now,
    },
    {
      id: 'usr-ops-02',
      email: 'operaciones@corporativoprincipal.co',
      fullName: 'Coordinación Operativa',
      accountType: 'BUSINESS_MEMBER',
      preferredLocale: 'es-CO',
      createdAt: now,
    },
    {
      id: 'usr-com-03',
      email: 'comercial@corporativoprincipal.co',
      fullName: 'Liderazgo Comercial',
      accountType: 'BUSINESS_MEMBER',
      preferredLocale: 'es-CO',
      createdAt: now,
    },
    {
      id: 'usr-doc-04',
      email: 'documental@corporativoprincipal.co',
      fullName: 'Especialista Documental',
      accountType: 'BUSINESS_MEMBER',
      preferredLocale: 'es-CO',
      createdAt: now,
    },
    {
      id: 'usr-cal-05',
      email: 'calidad@corporativoprincipal.co',
      fullName: 'Analista de Calidad y Procesos',
      accountType: 'BUSINESS_MEMBER',
      preferredLocale: 'es-CO',
      createdAt: now,
    },
    {
      id: 'usr-ext-99',
      email: 'externo@otra-organizacion.com',
      fullName: 'Usuario Externo Aislado',
      accountType: 'EXTERNAL',
      preferredLocale: 'es-CO',
      createdAt: now,
    },
  ]

  // 3. Tabla platform_admins (Contexto A: CoreFlow Platform Admin)
  const platformAdmins = [
    {
      id: 'pa-super-01',
      userId: 'usr-platform-admin',
      email: 'platform.admin@coreflow.app',
      fullName: 'Administración Global CoreFlow',
      roleLevel: 'SUPER_ADMIN',
      status: 'active',
      createdAt: now,
    },
  ]

  // 4. Organizaciones Independientes (Tenants)
  const organizations = [
    {
      id: 'org-principal',
      slug: 'entorno-corporativo-business',
      legalName: 'Grupo Corporativo Andino S.A.S.',
      displayName: 'Grupo Corporativo Andino (Business)',
      taxId: '901.420.100-1',
      sector: 'Servicios e Ingeniería Operativa',
      contractedPlanCode: 'business',
      status: 'active',
      timezone: 'America/Bogota',
      activeCollaboratorsCount: 18,
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'org-pyme',
      slug: 'unidad-operativa-starter',
      legalName: 'Soluciones Ágiles del Caribe S.A.S.',
      displayName: 'Soluciones Ágiles del Caribe (Starter)',
      taxId: '901.850.200-4',
      sector: 'Consultoría y Gestión Comercial',
      contractedPlanCode: 'start',
      status: 'active',
      timezone: 'America/Bogota',
      activeCollaboratorsCount: 12,
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'org-aislada',
      slug: 'organizacion-externa-aislada',
      legalName: 'Organización Externa No Autorizada S.A.S.',
      displayName: 'Organización Externa (Sin Membresía)',
      taxId: '901.999.999-9',
      sector: 'Externo',
      contractedPlanCode: 'business',
      status: 'active',
      timezone: 'America/Bogota',
      activeCollaboratorsCount: 20,
      createdAt: now,
      deletedAt: null,
    },
  ]

  // 5. Suscripciones Organizacionales en Base de Datos (organization_subscriptions)
  const organizationSubscriptions = [
    {
      id: 'sub-org-principal',
      organizationId: 'org-principal',
      planCode: 'business',
      status: 'active',
      billingCycle: 'annual',
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2027-01-01T00:00:00.000Z',
      assignedBy: 'usr-platform-admin',
      notes: 'Suscripción corporativa CoreFlow Business activa.',
      updatedAt: now,
    },
    {
      id: 'sub-org-pyme',
      organizationId: 'org-pyme',
      planCode: 'starter',
      status: 'active',
      billingCycle: 'monthly',
      validFrom: '2026-06-01T00:00:00.000Z',
      validUntil: '2027-06-01T00:00:00.000Z',
      assignedBy: 'usr-platform-admin',
      notes: 'Suscripción PYME CoreFlow Starter activa.',
      updatedAt: now,
    },
    {
      id: 'sub-org-aislada',
      organizationId: 'org-aislada',
      planCode: 'business',
      status: 'active',
      billingCycle: 'monthly',
      validFrom: '2026-01-01T00:00:00.000Z',
      validUntil: '2027-01-01T00:00:00.000Z',
      assignedBy: 'usr-platform-admin',
      notes: 'Organización aislada para pruebas de seguridad RLS.',
      updatedAt: now,
    },
  ]

  // 6. Overrides administrables por organización
  const organizationEntitlements = [
    {
      organizationId: 'org-principal',
      entitlementKey: 'max_collaborators',
      valueJson: 30,
      reason: 'Cuota contratada Plan Business',
    },
    {
      organizationId: 'org-pyme',
      entitlementKey: 'max_collaborators',
      valueJson: 15,
      reason: 'Cuota contratada Plan Starter',
    },
  ]

  // 7. Sedes por Organización
  const organizationBranches = [
    {
      id: 'br-prin-01',
      organizationId: 'org-principal',
      code: 'SEDE-CENTRAL',
      name: 'Sede Central Corporativa',
      city: 'Barranquilla',
      isMain: true,
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'br-prin-02',
      organizationId: 'org-principal',
      code: 'SEDE-NORTE',
      name: 'Unidad Operativa Regional Norte',
      city: 'Cartagena',
      isMain: false,
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'br-pyme-01',
      organizationId: 'org-pyme',
      code: 'SEDE-UNICA',
      name: 'Sede Principal PYME',
      city: 'Bogotá',
      isMain: true,
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'br-ext-01',
      organizationId: 'org-aislada',
      code: 'SEDE-EXT',
      name: 'Sede Externa Aislada',
      city: 'Medellín',
      isMain: true,
      status: 'active',
      deletedAt: null,
    },
  ]

  // 8. Departamentos por Organización
  const departments = [
    {
      id: 'dept-prin-ops',
      organizationId: 'org-principal',
      branchId: 'br-prin-01',
      code: 'OPS',
      name: 'Operaciones',
      description: 'Gestión de procesos y cumplimiento operativo',
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'dept-prin-com',
      organizationId: 'org-principal',
      branchId: 'br-prin-01',
      code: 'COM',
      name: 'Comercial',
      description: 'Gestión de clientes y oportunidades comerciales',
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'dept-prin-doc',
      organizationId: 'org-principal',
      branchId: 'br-prin-01',
      code: 'DOC',
      name: 'Documentación',
      description: 'Repositorio central y control de versiones',
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'dept-prin-cal',
      organizationId: 'org-principal',
      branchId: 'br-prin-01',
      code: 'CAL',
      name: 'Calidad',
      description: 'Auditoría interna y validación de entregables',
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'dept-prin-tec',
      organizationId: 'org-principal',
      branchId: 'br-prin-01',
      code: 'TEC',
      name: 'Tecnología',
      description: 'Configuración y reglas de automatización',
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'dept-pyme-gen',
      organizationId: 'org-pyme',
      branchId: 'br-pyme-01',
      code: 'GEN',
      name: 'Operación General',
      description: 'Equipo unificado Plan Starter',
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'dept-ext-ops',
      organizationId: 'org-aislada',
      branchId: 'br-ext-01',
      code: 'EXT-OPS',
      name: 'Operaciones Externas',
      description: 'Departamento de otra organización',
      status: 'active',
      deletedAt: null,
    },
  ]

  // 9. Roles y Permisos por Organización
  const roles = []
  const rolePermissions = []

  for (const orgId of ['org-principal', 'org-pyme', 'org-aislada']) {
    for (const tpl of Object.values(SYSTEM_ROLE_TEMPLATES)) {
      const roleId = `role-${orgId}-${tpl.code.toLowerCase()}`
      roles.push({
        id: roleId,
        organizationId: orgId,
        code: tpl.code,
        name: tpl.name,
        description: tpl.description,
        defaultScope: tpl.defaultScope,
        isSystemRole: true,
      })
      for (const perm of tpl.permissions) {
        rolePermissions.push({
          roleId,
          organizationId: orgId,
          permissionKey: perm.permissionKey,
          scopeOverride: perm.scopeOverride,
        })
      }
    }
  }

  // 10. Membresías Organizacionales (Aislamiento estricto por cuenta)
  const organizationMembers = [
    // Cuenta 3 (Business Admin): exclusiva de org-principal
    {
      id: 'mem-business-owner',
      organizationId: 'org-principal',
      userId: 'usr-business-admin',
      roleId: 'role-org-principal-org_admin',
      roleCode: 'ORG_ADMIN',
      branchId: 'br-prin-01',
      departmentId: 'dept-prin-ops',
      jobTitle: 'Administrador Organizacional Business',
      displayName: 'Dirección Corporativa Business',
      email: 'admin.business@corporativoprincipal.co',
      status: 'active',
      deletedAt: null,
    },
    // Cuenta 2 (Starter Admin): exclusiva de org-pyme
    {
      id: 'mem-starter-owner',
      organizationId: 'org-pyme',
      userId: 'usr-starter-admin',
      roleId: 'role-org-pyme-org_admin',
      roleCode: 'ORG_ADMIN',
      branchId: 'br-pyme-01',
      departmentId: 'dept-pyme-gen',
      jobTitle: 'Administrador Organizacional Starter',
      displayName: 'Dirección Operativa Starter',
      email: 'admin.starter@unidadpyme.co',
      status: 'active',
      deletedAt: null,
    },
    // Miembros operativos de org-principal (Business)
    {
      id: 'mem-prin-admin',
      organizationId: 'org-principal',
      userId: 'usr-auth-01',
      roleId: 'role-org-principal-org_admin',
      roleCode: 'ORG_ADMIN',
      branchId: 'br-prin-01',
      departmentId: 'dept-prin-ops',
      jobTitle: 'Administrador Organizacional',
      displayName: 'Dirección de Proyecto',
      email: 'acceso.demo@coreflow.app',
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'mem-prin-ops',
      organizationId: 'org-principal',
      userId: 'usr-ops-02',
      roleId: 'role-org-principal-ops_coordinator',
      roleCode: 'OPS_COORDINATOR',
      branchId: 'br-prin-01',
      departmentId: 'dept-prin-ops',
      jobTitle: 'Coordinación de Operaciones',
      displayName: 'Coordinación de Operaciones',
      email: 'operaciones@corporativoprincipal.co',
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'mem-prin-com',
      organizationId: 'org-principal',
      userId: 'usr-com-03',
      roleId: 'role-org-principal-commercial_lead',
      roleCode: 'COMMERCIAL_LEAD',
      branchId: 'br-prin-01',
      departmentId: 'dept-prin-com',
      jobTitle: 'Líder de Área Comercial',
      displayName: 'Líder de Gestión Comercial',
      email: 'comercial@corporativoprincipal.co',
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'mem-prin-doc',
      organizationId: 'org-principal',
      userId: 'usr-doc-04',
      roleId: 'role-org-principal-specialist',
      roleCode: 'SPECIALIST',
      branchId: 'br-prin-01',
      departmentId: 'dept-prin-doc',
      jobTitle: 'Especialista Documental',
      displayName: 'Especialista Documental',
      email: 'documental@corporativoprincipal.co',
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'mem-prin-cal',
      organizationId: 'org-principal',
      userId: 'usr-cal-05',
      roleId: 'role-org-principal-ops_coordinator',
      roleCode: 'OPS_COORDINATOR',
      branchId: 'br-prin-01',
      departmentId: 'dept-prin-cal',
      jobTitle: 'Analista de Calidad y Procesos',
      displayName: 'Analista de Calidad y Procesos',
      email: 'calidad@corporativoprincipal.co',
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'mem-pyme-admin',
      organizationId: 'org-pyme',
      userId: 'usr-auth-01',
      roleId: 'role-org-pyme-org_admin',
      roleCode: 'ORG_ADMIN',
      branchId: 'br-pyme-01',
      departmentId: 'dept-pyme-gen',
      jobTitle: 'Coordinador General PYME',
      displayName: 'Coordinación General (Starter)',
      email: 'acceso.demo@coreflow.app',
      status: 'active',
      deletedAt: null,
    },
    {
      id: 'mem-ext-admin',
      organizationId: 'org-aislada',
      userId: 'usr-ext-99',
      roleId: 'role-org-aislada-org_admin',
      roleCode: 'ORG_ADMIN',
      branchId: 'br-ext-01',
      departmentId: 'dept-ext-ops',
      jobTitle: 'Administrador Externo',
      displayName: 'Administrador Externo',
      email: 'externo@otra-organizacion.com',
      status: 'active',
      deletedAt: null,
    },
  ]

  // 11. Clientes aislados por Organización (clients)
  const clients = [
    // Clientes de org-principal (Business)
    {
      id: 'CTA-012',
      organizationId: 'org-principal',
      branchId: 'br-prin-01',
      code: 'CTA-012',
      legalName: 'Cuenta Corporativa A S.A.S.',
      displayName: 'Cuenta Corporativa A (Sector Servicios)',
      taxId: '900.112.334-1',
      sector: 'Servicios Corporativos',
      ownerMemberId: 'mem-prin-ops',
      ownerName: 'Coordinación de Operaciones',
      contactName: 'Dirección de Operaciones',
      contactEmail: 'contacto@corporativa-a.co',
      status: 'active',
      meta: '2 solicitudes vinculadas (SOL-458, SOL-455) · 12 documentos',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'CTA-019',
      organizationId: 'org-principal',
      branchId: 'br-prin-01',
      code: 'CTA-019',
      legalName: 'Cuenta Empresarial B Ltda.',
      displayName: 'Cuenta Empresarial B (Sector Operativo)',
      taxId: '900.219.445-2',
      sector: 'Operaciones Industriales',
      ownerMemberId: 'mem-prin-com',
      ownerName: 'Líder de Gestión Comercial',
      contactName: 'Gerencia de Planta',
      contactEmail: 'operaciones@empresarial-b.co',
      status: 'process',
      meta: '1 solicitud activa (SOL-459) · 2 oportunidades',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'CTA-024',
      organizationId: 'org-principal',
      branchId: 'br-prin-01',
      code: 'CTA-024',
      legalName: 'Organización Asociada C S.A.',
      displayName: 'Organización Asociada C (Consultoría)',
      taxId: '900.324.556-3',
      sector: 'Consultoría Técnica',
      ownerMemberId: 'mem-prin-doc',
      ownerName: 'Especialista Documental',
      contactName: 'Coordinación de Proyectos',
      contactEmail: 'proyectos@asociada-c.co',
      status: 'active',
      meta: '1 solicitud activa (SOL-460) · Acuerdo vigente',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'CTA-031',
      organizationId: 'org-principal',
      branchId: 'br-prin-02',
      code: 'CTA-031',
      legalName: 'Entidad Corporativa D S.A.S.',
      displayName: 'Entidad Corporativa D (Soporte)',
      taxId: '900.431.667-4',
      sector: 'Soporte e Infraestructura',
      ownerMemberId: 'mem-prin-cal',
      ownerName: 'Analista de Calidad y Procesos',
      contactName: 'Auditoría Interna',
      contactEmail: 'calidad@entidad-d.co',
      status: 'pending',
      meta: '1 solicitud en revisión (SOL-461)',
      createdAt: now,
      deletedAt: null,
    },
    // Clientes de org-pyme (Starter — 100% aislados)
    {
      id: 'CTA-101',
      organizationId: 'org-pyme',
      branchId: 'br-pyme-01',
      code: 'CTA-101',
      legalName: 'Distribuidora del Norte S.A.S.',
      displayName: 'Cuenta PYME 01 (Servicios Profesionales)',
      taxId: '901.101.111-5',
      sector: 'Servicios Profesionales',
      ownerMemberId: 'mem-starter-owner',
      ownerName: 'Dirección Operativa Starter',
      contactName: 'Administración General',
      contactEmail: 'gerencia@pyme01.co',
      status: 'active',
      meta: 'Solicitud activa SOL-101 · Flujo directo Starter',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'CTA-102',
      organizationId: 'org-pyme',
      branchId: 'br-pyme-01',
      code: 'CTA-102',
      legalName: 'Comercializadora Andina PYME Ltda.',
      displayName: 'Cuenta PYME 02 (Distribución)',
      taxId: '901.102.222-6',
      sector: 'Distribución Comercial',
      ownerMemberId: 'mem-starter-owner',
      ownerName: 'Dirección Operativa Starter',
      contactName: 'Jefatura de Compras',
      contactEmail: 'compras@pyme02.co',
      status: 'active',
      meta: 'Solicitud completada SOL-102 · Entregables al día',
      createdAt: now,
      deletedAt: null,
    },
  ]

  // 12. Oportunidades Comerciales por Organización (commercial_opportunities)
  const opportunities = [
    // Business (org-principal)
    {
      id: 'OP-204',
      organizationId: 'org-principal',
      clientId: 'CTA-012',
      code: 'OP-204',
      title: 'Implementación de flujo corporativo multi-área',
      ownerMemberId: 'mem-prin-com',
      ownerName: 'Líder de Gestión Comercial',
      stage: 'validacion_tecnica',
      area: 'Etapa: Validación técnica',
      status: 'process',
      estimatedValue: 48500000,
      currency: 'COP',
      probability: 80,
      meta: 'Vinculada a Cuenta Corporativa A · Prioridad Alta',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'OP-209',
      organizationId: 'org-principal',
      clientId: 'CTA-019',
      code: 'OP-209',
      title: 'Actualización de alcance operativo anual',
      ownerMemberId: 'mem-prin-ops',
      ownerName: 'Coordinación de Operaciones',
      stage: 'propuesta',
      area: 'Etapa: Propuesta enviada',
      status: 'pending',
      estimatedValue: 32000000,
      currency: 'COP',
      probability: 65,
      meta: 'Vinculada a Cuenta Empresarial B · Revisión documental',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'OP-198',
      organizationId: 'org-principal',
      clientId: 'CTA-024',
      code: 'OP-198',
      title: 'Estandarización de procesos de atención',
      ownerMemberId: 'mem-prin-admin',
      ownerName: 'Dirección de Proyecto',
      stage: 'ganada',
      area: 'Etapa: Incorporada',
      status: 'completed',
      estimatedValue: 64000000,
      currency: 'COP',
      probability: 100,
      meta: 'Transferida a Operaciones (SOL-455)',
      createdAt: now,
      deletedAt: null,
    },
    // Starter (org-pyme)
    {
      id: 'OP-301',
      organizationId: 'org-pyme',
      clientId: 'CTA-101',
      code: 'OP-301',
      title: 'Renovación de paquete anual de consultoría PYME',
      ownerMemberId: 'mem-starter-owner',
      ownerName: 'Dirección Operativa Starter',
      stage: 'propuesta',
      area: 'Etapa: Propuesta enviada',
      status: 'active',
      estimatedValue: 14500000,
      currency: 'COP',
      probability: 75,
      meta: 'Vinculada a Cuenta PYME 01 · Cierre estimado este mes',
      createdAt: now,
      deletedAt: null,
    },
  ]

  // 13. Solicitudes Operativas Separadas por Organización
  const requests = [
    {
      id: 'SOL-458',
      organizationId: 'org-principal',
      code: 'SOL-458',
      asunto: 'Parametrización de flujo de atención y seguimiento comercial',
      cliente: 'Cuenta Corporativa A (Sector Servicios)',
      clienteId: 'CTA-012',
      branchId: 'br-prin-01',
      departmentId: 'dept-prin-ops',
      departamento: 'Operaciones',
      assignedMemberId: 'mem-prin-ops',
      responsable: 'Coordinación de Operaciones',
      prioridad: 'Alta',
      estado: 'process',
      vencimiento: 'Hoy · 17:30',
      nivelAprobacion: 'Nivel 2 · Coordinación Operativa',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'SOL-459',
      organizationId: 'org-principal',
      code: 'SOL-459',
      asunto: 'Actualización de anexo documental y matriz de permisos',
      cliente: 'Cuenta Empresarial B (Sector Operativo)',
      clienteId: 'CTA-019',
      branchId: 'br-prin-01',
      departmentId: 'dept-prin-doc',
      departamento: 'Documentación',
      assignedMemberId: 'mem-prin-doc',
      responsable: 'Especialista Documental',
      prioridad: 'Media',
      estado: 'pending',
      vencimiento: 'Mañana · 11:00',
      nivelAprobacion: 'Nivel 1 · Revisión Documental',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'SOL-460',
      organizationId: 'org-principal',
      code: 'SOL-460',
      asunto: 'Activación de reglas de notificación y asignación automática',
      cliente: 'Organización Asociada C (Consultoría)',
      clienteId: 'CTA-024',
      branchId: 'br-prin-01',
      departmentId: 'dept-prin-tec',
      departamento: 'Tecnología',
      assignedMemberId: 'mem-prin-admin',
      responsable: 'Dirección de Proyecto',
      prioridad: 'Alta',
      estado: 'active',
      vencimiento: 'En tiempo (48h)',
      nivelAprobacion: 'Validado',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'SOL-461',
      organizationId: 'org-principal',
      code: 'SOL-461',
      asunto: 'Validación de requisitos en entregable trimestral',
      cliente: 'Entidad Corporativa D (Soporte)',
      clienteId: 'CTA-031',
      branchId: 'br-prin-01',
      departmentId: 'dept-prin-cal',
      departamento: 'Calidad',
      assignedMemberId: 'mem-prin-cal',
      responsable: 'Analista de Calidad y Procesos',
      prioridad: 'Prioritaria',
      estado: 'error',
      vencimiento: 'Requiere revisión',
      nivelAprobacion: 'Observación en Nivel 2',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'SOL-455',
      organizationId: 'org-principal',
      code: 'SOL-455',
      asunto: 'Cierre de incorporación inicial y configuración de entorno',
      cliente: 'Cuenta Corporativa A (Sector Servicios)',
      clienteId: 'CTA-012',
      branchId: 'br-prin-01',
      departmentId: 'dept-prin-ops',
      departamento: 'Operaciones',
      assignedMemberId: 'mem-prin-ops',
      responsable: 'Coordinación de Operaciones',
      prioridad: 'Media',
      estado: 'completed',
      vencimiento: 'Finalizado',
      nivelAprobacion: 'Validado',
      createdAt: now,
      deletedAt: null,
    },
    // Solicitudes de org-pyme (Starter)
    {
      id: 'SOL-101',
      organizationId: 'org-pyme',
      code: 'SOL-101',
      asunto: 'Incorporación de cliente y carga de propuesta comercial',
      cliente: 'Cuenta PYME 01 (Servicios Profesionales)',
      clienteId: 'CTA-101',
      branchId: 'br-pyme-01',
      departmentId: 'dept-pyme-gen',
      departamento: 'Operación General',
      assignedMemberId: 'mem-starter-owner',
      responsable: 'Dirección Operativa Starter',
      prioridad: 'Alta',
      estado: 'process',
      vencimiento: 'Hoy · 16:00',
      nivelAprobacion: 'Flujo directo (Plan Starter)',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'SOL-102',
      organizationId: 'org-pyme',
      code: 'SOL-102',
      asunto: 'Entrega de informe mensual de actividades',
      cliente: 'Cuenta PYME 02 (Distribución)',
      clienteId: 'CTA-102',
      branchId: 'br-pyme-01',
      departmentId: 'dept-pyme-gen',
      departamento: 'Operación General',
      assignedMemberId: 'mem-starter-owner',
      responsable: 'Dirección Operativa Starter',
      prioridad: 'Media',
      estado: 'completed',
      vencimiento: 'Finalizado',
      nivelAprobacion: 'Flujo directo (Plan Starter)',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'SOL-103',
      organizationId: 'org-pyme',
      code: 'SOL-103',
      asunto: 'Actualización de documentos de soporte de cuenta',
      cliente: 'Cuenta PYME 03 (Comercio)',
      clienteId: 'CTA-101',
      branchId: 'br-pyme-01',
      departmentId: 'dept-pyme-gen',
      departamento: 'Operación General',
      assignedMemberId: 'mem-starter-owner',
      responsable: 'Dirección Operativa Starter',
      prioridad: 'Media',
      estado: 'active',
      vencimiento: 'En tiempo (24h)',
      nivelAprobacion: 'Flujo directo (Plan Starter)',
      createdAt: now,
      deletedAt: null,
    },
    // Solicitud de org-aislada
    {
      id: 'SOL-999',
      organizationId: 'org-aislada',
      code: 'SOL-999',
      asunto: 'Registro confidencial de otra organización',
      cliente: 'Cuenta Confidencial Externa',
      clienteId: 'CTA-999',
      branchId: 'br-ext-01',
      departmentId: 'dept-ext-ops',
      departamento: 'Operaciones Externas',
      assignedMemberId: 'mem-ext-admin',
      responsable: 'Administrador Externo',
      prioridad: 'Alta',
      estado: 'active',
      vencimiento: 'Confidencial',
      nivelAprobacion: 'Validado',
      createdAt: now,
      deletedAt: null,
    },
  ]

  // 14. Pasos de Aprobación Multinivel
  const approvalSteps = [
    {
      id: 'apr-step-458-1',
      organizationId: 'org-principal',
      requestId: 'SOL-458',
      stepOrder: 1,
      stepLabel: 'Nivel 1 · Revisión Comercial',
      targetDepartmentId: 'dept-prin-com',
      status: 'approved',
    },
    {
      id: 'apr-step-458-2',
      organizationId: 'org-principal',
      requestId: 'SOL-458',
      stepOrder: 2,
      stepLabel: 'Nivel 2 · Coordinación Operativa',
      targetDepartmentId: 'dept-prin-ops',
      status: 'pending',
    },
    {
      id: 'apr-step-459-1',
      organizationId: 'org-principal',
      requestId: 'SOL-459',
      stepOrder: 1,
      stepLabel: 'Nivel 1 · Revisión Documental',
      targetDepartmentId: 'dept-prin-doc',
      status: 'pending',
    },
  ]

  // 15. Tareas Operativas por Organización (tasks)
  const tasks = [
    // Business (org-principal)
    {
      id: 'TAR-301',
      organizationId: 'org-principal',
      code: 'TAR-301',
      title: 'Verificar lista de chequeo de solicitud #SOL-458',
      requestId: 'SOL-458',
      clientId: 'CTA-012',
      departmentId: 'dept-prin-ops',
      assignedMemberId: 'mem-prin-ops',
      owner: 'Coordinación de Operaciones',
      area: 'Operaciones',
      priority: 'Alta',
      status: 'process',
      dueLabel: 'Hoy · 17:30',
      meta: 'Vence hoy 17:30 · Prioridad Alta',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'TAR-304',
      organizationId: 'org-principal',
      code: 'TAR-304',
      title: 'Cargar versión revisada de anexo técnico (#SOL-459)',
      requestId: 'SOL-459',
      clientId: 'CTA-019',
      departmentId: 'dept-prin-doc',
      assignedMemberId: 'mem-prin-doc',
      owner: 'Especialista Documental',
      area: 'Documentación',
      priority: 'Media',
      status: 'pending',
      dueLabel: 'Mañana · 11:00',
      meta: 'Vence mañana 11:00 · Prioridad Media',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'TAR-299',
      organizationId: 'org-principal',
      code: 'TAR-299',
      title: 'Confirmar permisos de acceso de Cuenta Corporativa A',
      requestId: 'SOL-455',
      clientId: 'CTA-012',
      departmentId: 'dept-prin-tec',
      assignedMemberId: 'mem-prin-admin',
      owner: 'Dirección de Proyecto',
      area: 'Tecnología',
      priority: 'Media',
      status: 'completed',
      dueLabel: 'Finalizada',
      meta: 'Cerrada hoy · Vinculada a SOL-455',
      createdAt: now,
      deletedAt: null,
    },
    // Starter (org-pyme)
    {
      id: 'TAR-101',
      organizationId: 'org-pyme',
      code: 'TAR-101',
      title: 'Validar RUT y cámara de comercio de Cuenta PYME 01',
      requestId: 'SOL-101',
      clientId: 'CTA-101',
      departmentId: 'dept-pyme-gen',
      assignedMemberId: 'mem-starter-owner',
      owner: 'Dirección Operativa Starter',
      area: 'Operación General',
      priority: 'Alta',
      status: 'process',
      dueLabel: 'Hoy · 16:00',
      meta: 'Vinculada a SOL-101 · Flujo Starter',
      createdAt: now,
      deletedAt: null,
    },
  ]

  // 16. Documentos con Rutas de Storage Privado Aisladas por Tenant (documents)
  const documents = [
    {
      id: 'DOC-089',
      organizationId: 'org-principal',
      code: 'DOC-089',
      title: 'Procedimiento Estandarizado de Incorporación v2.4',
      category: 'Normativo',
      version: 'v2.4',
      status: 'completed',
      clientId: 'CTA-012',
      requestId: 'SOL-455',
      departmentId: 'dept-prin-ops',
      uploadedByMemberId: 'mem-prin-ops',
      owner: 'Coordinación de Operaciones',
      storageBucket: 'coreflow-documents',
      storagePath: 'org-principal/documents/DOC-089/procedimiento-incorporacion-v2.4.pdf',
      meta: 'Aprobado · Bucket privado: org-principal/documents/DOC-089/',
      createdAt: now,
      deletedAt: null,
    },
    {
      id: 'DOC-092',
      organizationId: 'org-principal',
      code: 'DOC-092',
      title: 'Anexo Técnico y Matriz de Alcance (#SOL-459)',
      category: 'Operativo',
      version: 'v1.2',
      status: 'pending',
      clientId: 'CTA-019',
      requestId: 'SOL-459',
      departmentId: 'dept-prin-doc',
      uploadedByMemberId: 'mem-prin-doc',
      owner: 'Especialista Documental',
      storageBucket: 'coreflow-documents',
      storagePath: 'org-principal/documents/DOC-092/anexo-tecnico-sol-459.pdf',
      meta: 'Pendiente de firma en Nivel 1 · Vinculado a Cuenta Empresarial B',
      createdAt: now,
      deletedAt: null,
    },
    // Documento de org-pyme (Starter)
    {
      id: 'DOC-201',
      organizationId: 'org-pyme',
      code: 'DOC-201',
      title: 'Propuesta de Servicios Profesionales PYME 01',
      category: 'Comercial',
      version: 'v1.0',
      status: 'active',
      clientId: 'CTA-101',
      requestId: 'SOL-101',
      departmentId: 'dept-pyme-gen',
      uploadedByMemberId: 'mem-starter-owner',
      owner: 'Dirección Operativa Starter',
      storageBucket: 'coreflow-documents',
      storagePath: 'org-pyme/documents/DOC-201/propuesta-pyme-01.pdf',
      meta: 'Vigente · Bucket privado: org-pyme/documents/DOC-201/',
      createdAt: now,
      deletedAt: null,
    },
  ]

  // 17. Reglas de Automatización y Procesos por Organización
  const automationRules = [
    // Business (incluye cross_department_workflow)
    {
      id: 'FLU-01',
      organizationId: 'org-principal',
      code: 'FLU-01',
      name: 'Incorporación y parametrización de cliente corporativo',
      description: 'Transfiere automáticamente oportunidades ganadas desde Comercial hacia Operaciones y Documentación.',
      triggerEvent: 'opportunity.stage_changed_to_won',
      scopeType: 'cross_department_workflow',
      sourceDepartmentId: 'dept-prin-com',
      targetDepartmentId: 'dept-prin-ops',
      owner: 'Coordinación de Operaciones',
      area: 'Comercial → Operaciones → Documentación',
      status: 'active',
      executionsCount: 18,
      meta: 'Flujo entre áreas Business · 18 ejecuciones registradas',
    },
    {
      id: 'FLU-02',
      organizationId: 'org-principal',
      code: 'FLU-02',
      name: 'Validación y aprobación documental multinivel',
      description: 'Notifica y asigna revisión secuencial entre Documentación y Calidad.',
      triggerEvent: 'document.status_pending',
      scopeType: 'cross_department_workflow',
      sourceDepartmentId: 'dept-prin-doc',
      targetDepartmentId: 'dept-prin-cal',
      owner: 'Especialista Documental',
      area: 'Documentación → Calidad',
      status: 'process',
      executionsCount: 11,
      meta: 'Aprobación multinivel activa · 11 ejecuciones',
    },
    // Starter (solo basic_notification)
    {
      id: 'FLU-101',
      organizationId: 'org-pyme',
      code: 'FLU-101',
      name: 'Notificación directa de nueva solicitud recibida',
      description: 'Envía aviso inmediato al coordinador cuando ingresa una solicitud de cliente.',
      triggerEvent: 'request.created',
      scopeType: 'basic_notification',
      sourceDepartmentId: 'dept-pyme-gen',
      targetDepartmentId: 'dept-pyme-gen',
      owner: 'Dirección Operativa Starter',
      area: 'Operación General (Directo)',
      status: 'active',
      executionsCount: 14,
      meta: 'Automatización esencial Starter · 14 ejecuciones',
    },
  ]

  // 18. Auditoría inicial protegida
  const auditLogs = [
    createImmutableAuditRecord({
      id: 'aud-init-01',
      organizationId: 'org-principal',
      actorUserId: 'usr-business-admin',
      actorMemberId: 'mem-business-owner',
      actorRoleCode: 'ORG_ADMIN',
      module: 'core.tenancy',
      entityType: 'organization',
      entityId: 'org-principal',
      action: 'TENANT_INITIALIZED',
      summary: 'Organización Business inicializada con suscripción activa, departamentos y RLS.',
      changes: { contractedPlan: 'business', activeMembers: 18 },
      createdAt: now,
    }),
    createImmutableAuditRecord({
      id: 'aud-init-02',
      organizationId: 'org-pyme',
      actorUserId: 'usr-starter-admin',
      actorMemberId: 'mem-starter-owner',
      actorRoleCode: 'ORG_ADMIN',
      module: 'core.tenancy',
      entityType: 'organization',
      entityId: 'org-pyme',
      action: 'TENANT_INITIALIZED',
      summary: 'Organización Starter inicializada con suscripción activa y aislamiento multi-tenant.',
      changes: { contractedPlan: 'starter', activeMembers: 12 },
      createdAt: now,
    }),
  ]

  return {
    authenticatedUserId: 'usr-business-admin',
    activeOrganizationId: 'org-principal',
    planCatalog,
    platformAdmins,
    userProfiles,
    organizations,
    organizationSubscriptions,
    organizationEntitlements,
    organizationBranches,
    departments,
    roles,
    rolePermissions,
    organizationMembers,
    clients,
    opportunities,
    requests,
    approvalSteps,
    tasks,
    documents,
    automationRules,
    auditLogs,
  }
}

export class LocalRelationalProvider {
  constructor({ persistToBrowser = true } = {}) {
    this.providerName = 'LocalRelationalProvider (Persistencia Relacional)'
    this.persistToBrowser =
      persistToBrowser && typeof window !== 'undefined' && Boolean(window.localStorage)
    this.state = this._loadState()
  }

  _loadState() {
    if (this.persistToBrowser) {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (
            parsed &&
            Array.isArray(parsed.organizations) &&
            Array.isArray(parsed.organizationMembers) &&
            Array.isArray(parsed.planCatalog)
          ) {
            parsed.auditLogs = (parsed.auditLogs || []).map((log) =>
              createImmutableAuditRecord(log)
            )
            return parsed
          }
        }
      } catch {
        // Fallback a semilla limpia
      }
    }
    return createInitialRelationalSeed()
  }

  _saveState() {
    if (this.persistToBrowser) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state))
      } catch {
        // Ignorar límite de cuota local
      }
    }
  }

  resetDemoSeed() {
    this.state = createInitialRelationalSeed()
    this._saveState()
    return this.state
  }

  // ---------------------------------------------------------------------------
  // AUTENTICACIÓN Y GESTIÓN DE SESIÓN DE LAS 3 CUENTAS (Sección 2 y 5)
  // ---------------------------------------------------------------------------
  authenticateByEmail({ email }) {
    const cleanEmail = String(email || '').trim().toLowerCase()
    const profile = this.state.userProfiles.find(
      (u) => u.email.toLowerCase() === cleanEmail
    )

    if (!profile) {
      const err = new Error(
        `AUTH_INVALID_CREDENTIALS: No existe una cuenta registrada para "${cleanEmail}".`
      )
      err.code = 'AUTH_INVALID_CREDENTIALS'
      throw err
    }

    this.state.authenticatedUserId = profile.id

    const platformAdmin = this.state.platformAdmins.find(
      (pa) => pa.userId === profile.id && pa.status === 'active'
    )

    if (!platformAdmin) {
      const userMemberships = this.state.organizationMembers.filter(
        (m) => m.userId === profile.id && m.status === 'active' && !m.deletedAt
      )
      if (userMemberships.length === 0) {
        const err = new Error(
          `AUTH_NO_ACTIVE_MEMBERSHIP: El usuario "${cleanEmail}" no tiene membresías activas ni rol de administrador de plataforma.`
        )
        err.code = 'AUTH_NO_ACTIVE_MEMBERSHIP'
        throw err
      }
      this.state.activeOrganizationId = userMemberships[0].organizationId
    }

    this._saveState()
    return this.getCurrentSession()
  }

  signOut() {
    this.state.authenticatedUserId = null
    this._saveState()
    return { signedOut: true }
  }

  _assertActiveMembership(targetOrganizationId) {
    const orgId = targetOrganizationId || this.state.activeOrganizationId
    const userId = this.state.authenticatedUserId

    // Si es Platform Admin, tiene permiso de inspección administrativa pero las operaciones de negocio de un tenant exigen membresía
    const membership = this.state.organizationMembers.find(
      (m) =>
        m.organizationId === orgId &&
        m.userId === userId &&
        m.status === 'active' &&
        !m.deletedAt
    )

    if (!membership) {
      const err = new Error(
        `TENANT_ISOLATION_VIOLATION: El usuario autenticado (${userId}) no posee una membresía activa en la organización "${orgId}". Acceso denegado por política RLS.`
      )
      err.code = 'TENANT_ISOLATION_VIOLATION'
      throw err
    }

    return membership
  }

  getCurrentSession() {
    const user =
      this.state.userProfiles.find((u) => u.id === this.state.authenticatedUserId) || null

    if (!user) {
      return {
        isAuthenticated: false,
        isPlatformAdmin: false,
        accessContext: 'UNAUTHENTICATED',
        user: null,
        platformAdminRecord: null,
        memberships: [],
        accessibleOrganizations: [],
        activeOrganizationId: null,
      }
    }

    const platformAdminRecord =
      this.state.platformAdmins.find(
        (pa) => pa.userId === user.id && pa.status === 'active'
      ) || null

    const memberships = this.state.organizationMembers.filter(
      (m) => m.userId === user.id && m.status === 'active' && !m.deletedAt
    )
    const accessibleOrgs = memberships
      .map((m) => this.state.organizations.find((o) => o.id === m.organizationId))
      .filter(Boolean)

    const isPlatformAdmin = Boolean(platformAdminRecord)

    return {
      isAuthenticated: true,
      isPlatformAdmin,
      accessContext: isPlatformAdmin ? 'PLATFORM_ADMIN' : 'TENANT_WORKSPACE',
      user,
      platformAdminRecord,
      memberships,
      accessibleOrganizations: accessibleOrgs,
      activeOrganizationId: isPlatformAdmin
        ? null
        : this.state.activeOrganizationId || accessibleOrgs[0]?.id || null,
    }
  }

  switchActiveOrganization(organizationId) {
    const membership = this._assertActiveMembership(organizationId)
    this.state.activeOrganizationId = organizationId
    this._saveState()
    return {
      activeOrganizationId: organizationId,
      membership,
    }
  }

  getOrganizationContext(organizationId = this.state.activeOrganizationId) {
    const membership = this._assertActiveMembership(organizationId)
    const organization = this.state.organizations.find((o) => o.id === organizationId)
    const subscription =
      this.state.organizationSubscriptions.find(
        (s) => s.organizationId === organizationId
      ) || null
    const branches = this.state.organizationBranches.filter(
      (b) => b.organizationId === organizationId && !b.deletedAt
    )
    const departments = this.state.departments.filter(
      (d) => d.organizationId === organizationId && !d.deletedAt
    )
    const members = this.state.organizationMembers.filter(
      (m) => m.organizationId === organizationId && !m.deletedAt
    )
    const entitlements = this.state.organizationEntitlements.filter(
      (e) => e.organizationId === organizationId
    )
    const roles = this.state.roles.filter((r) => r.organizationId === organizationId)
    const rolePermissions = this.state.rolePermissions.filter(
      (rp) => rp.organizationId === organizationId
    )

    return {
      organization,
      subscription,
      planCatalog: this.state.planCatalog,
      membership,
      branches,
      departments,
      members,
      entitlements,
      roles,
      rolePermissions,
    }
  }

  // ---------------------------------------------------------------------------
  // OPERACIONES DE COREFLOW PLATFORM ADMIN (Sección 2.A y Sección 3)
  // ---------------------------------------------------------------------------
  listPlanCatalog() {
    return this.state.planCatalog.map((p) => normalizeDatabasePlanRow(p))
  }

  upsertPlanCatalog(planPayload) {
    const normalized = normalizeDatabasePlanRow(planPayload)
    const existingIdx = this.state.planCatalog.findIndex(
      (p) => p.planCode === normalized.planCode
    )
    if (existingIdx >= 0) {
      this.state.planCatalog[existingIdx] = normalized
    } else {
      this.state.planCatalog.push(normalized)
    }
    this._saveState()
    return normalized
  }

  listAllOrganizationsForPlatformAdmin() {
    return this.state.organizations
      .filter((o) => !o.deletedAt)
      .map((org) => {
        const subscription =
          this.state.organizationSubscriptions.find(
            (s) => s.organizationId === org.id
          ) || null
        const entitlements = this.state.organizationEntitlements.filter(
          (e) => e.organizationId === org.id
        )
        const members = this.state.organizationMembers.filter(
          (m) => m.organizationId === org.id && !m.deletedAt
        )
        const branches = this.state.organizationBranches.filter(
          (b) => b.organizationId === org.id && !b.deletedAt
        )
        const departments = this.state.departments.filter(
          (d) => d.organizationId === org.id && !d.deletedAt
        )
        return {
          ...org,
          subscription,
          entitlements,
          membersCount: members.length,
          branchesCount: branches.length,
          departmentsCount: departments.length,
          admins: members.filter((m) => m.roleCode === 'ORG_ADMIN'),
        }
      })
  }

  createOrganizationByPlatformAdmin(payload) {
    const now = new Date().toISOString()
    const orgId = payload.id || `org-${String(payload.slug || Date.now()).toLowerCase()}`
    const planCode = payload.planCode || 'starter'
    const planDef =
      this.state.planCatalog.find((p) => p.planCode === planCode) ||
      PLANS_CATALOG.starter

    const newOrg = {
      id: orgId,
      slug: payload.slug || orgId,
      legalName: payload.legalName || payload.displayName,
      displayName: payload.displayName,
      taxId: payload.taxId || '901.000.000-0',
      sector: payload.sector || 'Servicios',
      contractedPlanCode: planCode,
      status: 'active',
      timezone: 'America/Bogota',
      activeCollaboratorsCount: Number(payload.activeCollaboratorsCount || 1),
      createdAt: now,
      deletedAt: null,
    }

    const newSub = {
      id: `sub-${orgId}`,
      organizationId: orgId,
      planCode,
      status: payload.subscriptionStatus || 'active',
      billingCycle: payload.billingCycle || 'monthly',
      validFrom: now,
      validUntil: payload.validUntil || '2027-12-31T00:00:00.000Z',
      assignedBy: this.state.authenticatedUserId,
      notes: payload.notes || `Suscripción inicial ${planDef.displayName}`,
      updatedAt: now,
    }

    const mainBranch = {
      id: `br-${orgId}-main`,
      organizationId: orgId,
      code: 'SEDE-PRINCIPAL',
      name: 'Sede Principal',
      city: payload.city || 'Bogotá',
      isMain: true,
      status: 'active',
      deletedAt: null,
    }

    const mainDept = {
      id: `dept-${orgId}-gen`,
      organizationId: orgId,
      branchId: mainBranch.id,
      code: 'GEN',
      name: 'Operación General',
      description: 'Área principal de la organización',
      status: 'active',
      deletedAt: null,
    }

    this.state.organizations.push(newOrg)
    this.state.organizationSubscriptions.push(newSub)
    this.state.organizationBranches.push(mainBranch)
    this.state.departments.push(mainDept)
    this.state.organizationEntitlements.push({
      organizationId: orgId,
      entitlementKey: 'max_collaborators',
      valueJson: planDef.limits.maxCollaborators,
      reason: `Cuota inicial ${planDef.displayName}`,
    })

    // Instanciar roles base para la nueva organización
    for (const tpl of Object.values(SYSTEM_ROLE_TEMPLATES)) {
      const roleId = `role-${orgId}-${tpl.code.toLowerCase()}`
      this.state.roles.push({
        id: roleId,
        organizationId: orgId,
        code: tpl.code,
        name: tpl.name,
        description: tpl.description,
        defaultScope: tpl.defaultScope,
        isSystemRole: true,
      })
      for (const perm of tpl.permissions) {
        this.state.rolePermissions.push({
          roleId,
          organizationId: orgId,
          permissionKey: perm.permissionKey,
          scopeOverride: perm.scopeOverride,
        })
      }
    }

    if (payload.adminEmail) {
      const adminUserId = `usr-admin-${orgId}`
      this.state.userProfiles.push({
        id: adminUserId,
        email: payload.adminEmail,
        fullName: payload.adminFullName || `Administrador ${payload.displayName}`,
        accountType: 'ORG_ADMIN',
        preferredLocale: 'es-CO',
        createdAt: now,
      })
      this.state.organizationMembers.push({
        id: `mem-${orgId}-admin`,
        organizationId: orgId,
        userId: adminUserId,
        roleId: `role-${orgId}-org_admin`,
        roleCode: 'ORG_ADMIN',
        branchId: mainBranch.id,
        departmentId: mainDept.id,
        jobTitle: 'Administrador Organizacional',
        displayName: payload.adminFullName || `Administrador ${payload.displayName}`,
        email: payload.adminEmail,
        status: 'active',
        deletedAt: null,
      })
    }

    this._saveState()
    return { organization: newOrg, subscription: newSub }
  }

  updateSubscriptionByPlatformAdmin({
    organizationId,
    planCode,
    status = 'active',
    billingCycle = 'monthly',
    validUntil,
    maxCollaboratorsOverride = null,
    notes = '',
    assignedBy = null,
  }) {
    const org = this.state.organizations.find((o) => o.id === organizationId)
    if (!org) {
      throw new Error(`ORG_NOT_FOUND: La organización "${organizationId}" no existe.`)
    }

    org.contractedPlanCode = planCode
    org.status = status === 'suspended' ? 'suspended' : 'active'

    const existingSubIdx = this.state.organizationSubscriptions.findIndex(
      (s) => s.organizationId === organizationId
    )
    const updatedSub = {
      id: existingSubIdx >= 0 ? this.state.organizationSubscriptions[existingSubIdx].id : `sub-${organizationId}`,
      organizationId,
      planCode,
      status,
      billingCycle,
      validFrom:
        existingSubIdx >= 0
          ? this.state.organizationSubscriptions[existingSubIdx].validFrom
          : new Date().toISOString(),
      validUntil: validUntil || '2027-12-31T00:00:00.000Z',
      assignedBy,
      notes,
      updatedAt: new Date().toISOString(),
    }

    if (existingSubIdx >= 0) {
      this.state.organizationSubscriptions[existingSubIdx] = updatedSub
    } else {
      this.state.organizationSubscriptions.push(updatedSub)
    }

    const planDef =
      this.state.planCatalog.find((p) => p.planCode === planCode) ||
      PLANS_CATALOG[planCode] ||
      PLANS_CATALOG.starter

    const targetMaxCollab =
      typeof maxCollaboratorsOverride === 'number'
        ? maxCollaboratorsOverride
        : planDef.limits.maxCollaborators

    this.upsertEntitlementByPlatformAdmin({
      organizationId,
      entitlementKey: 'max_collaborators',
      valueJson: targetMaxCollab,
      reason: `Sincronización de suscripción (${planCode})`,
      updatedBy: assignedBy,
    })

    this._saveState()
    return updatedSub
  }

  upsertEntitlementByPlatformAdmin({
    organizationId,
    entitlementKey,
    valueJson,
    reason = '',
  }) {
    const idx = this.state.organizationEntitlements.findIndex(
      (e) =>
        e.organizationId === organizationId && e.entitlementKey === entitlementKey
    )
    const entry = {
      organizationId,
      entitlementKey,
      valueJson,
      reason,
      updatedAt: new Date().toISOString(),
    }
    if (idx >= 0) {
      this.state.organizationEntitlements[idx] = entry
    } else {
      this.state.organizationEntitlements.push(entry)
    }
    this._saveState()
    return entry
  }

  listAllUsersForPlatformAdmin() {
    return {
      platformAdmins: this.state.platformAdmins,
      userProfiles: this.state.userProfiles,
      memberships: this.state.organizationMembers.map((m) => {
        const org = this.state.organizations.find((o) => o.id === m.organizationId)
        const profile = this.state.userProfiles.find((u) => u.id === m.userId)
        return {
          ...m,
          organizationName: org?.displayName || m.organizationId,
          userEmail: profile?.email || m.email,
          userFullName: profile?.fullName || m.displayName,
        }
      }),
    }
  }

  listGlobalAuditLogsForPlatformAdmin() {
    return this.state.auditLogs
  }

  // ---------------------------------------------------------------------------
  // SOLICITUDES Y APROBACIONES (Aisladas por organización)
  // ---------------------------------------------------------------------------
  listRequests(organizationId = this.state.activeOrganizationId) {
    this._assertActiveMembership(organizationId)
    return this.state.requests.filter(
      (r) => r.organizationId === organizationId && !r.deletedAt
    )
  }

  listApprovalSteps(organizationId = this.state.activeOrganizationId, requestId = null) {
    this._assertActiveMembership(organizationId)
    return this.state.approvalSteps.filter(
      (s) =>
        s.organizationId === organizationId &&
        (!requestId || s.requestId === requestId)
    )
  }

  insertRequest(payload) {
    const orgId = payload.organizationId || this.state.activeOrganizationId
    this._assertActiveMembership(orgId)

    assertSameOrganizationReference({
      sourceEntityName: 'Request',
      targetEntityName: 'OrganizationBranch',
      targetCollection: this.state.organizationBranches,
      targetId: payload.branchId,
      expectedOrganizationId: orgId,
    })

    if (payload.departmentId) {
      assertSameOrganizationReference({
        sourceEntityName: 'Request',
        targetEntityName: 'Department',
        targetCollection: this.state.departments,
        targetId: payload.departmentId,
        expectedOrganizationId: orgId,
      })
    }

    if (payload.assignedMemberId) {
      assertSameOrganizationReference({
        sourceEntityName: 'Request',
        targetEntityName: 'OrganizationMember',
        targetCollection: this.state.organizationMembers,
        targetId: payload.assignedMemberId,
        expectedOrganizationId: orgId,
      })
    }

    const orgRequests = this.state.requests.filter((r) => r.organizationId === orgId)
    const baseNumber = orgId === 'org-principal' ? 458 : 101
    const nextCode = payload.code || `SOL-${baseNumber + orgRequests.length}`

    const created = {
      id: nextCode,
      organizationId: orgId,
      code: nextCode,
      asunto: payload.asunto,
      cliente: payload.cliente,
      clienteId: payload.clienteId || 'CTA-GEN',
      branchId: payload.branchId,
      departmentId: payload.departmentId || null,
      departamento: payload.departamento || 'Operación General',
      assignedMemberId: payload.assignedMemberId,
      responsable: payload.responsable,
      prioridad: payload.prioridad || 'Media',
      estado: payload.estado || 'process',
      vencimiento: payload.vencimiento || 'En tiempo (48h)',
      nivelAprobacion: payload.nivelAprobacion,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    }

    this.state.requests = [created, ...this.state.requests]
    this._saveState()
    return created
  }

  updateRequest(organizationId, requestId, patch) {
    this._assertActiveMembership(organizationId)
    const existing = assertSameOrganizationReference({
      sourceEntityName: 'RequestUpdate',
      targetEntityName: 'Request',
      targetCollection: this.state.requests,
      targetId: requestId,
      expectedOrganizationId: organizationId,
    })

    if (patch.departmentId) {
      assertSameOrganizationReference({
        sourceEntityName: 'RequestUpdate',
        targetEntityName: 'Department',
        targetCollection: this.state.departments,
        targetId: patch.departmentId,
        expectedOrganizationId: organizationId,
      })
    }

    const updated = {
      ...existing,
      ...patch,
      id: existing.id,
      organizationId: existing.organizationId,
    }
    this.state.requests = this.state.requests.map((r) =>
      r.id === requestId && r.organizationId === organizationId ? updated : r
    )
    this._saveState()
    return updated
  }

  // ---------------------------------------------------------------------------
  // MÓDULOS OPERATIVOS: CLIENTES, COMERCIAL, TAREAS, DOCUMENTOS, AUTOMATIZACIONES
  // ---------------------------------------------------------------------------
  listClients(organizationId = this.state.activeOrganizationId) {
    this._assertActiveMembership(organizationId)
    return (this.state.clients || []).filter(
      (c) => c.organizationId === organizationId && !c.deletedAt
    )
  }

  insertClient(payload) {
    const orgId = payload.organizationId || this.state.activeOrganizationId
    this._assertActiveMembership(orgId)

    if (payload.branchId) {
      assertSameOrganizationReference({
        sourceEntityName: 'Client',
        targetEntityName: 'OrganizationBranch',
        targetCollection: this.state.organizationBranches,
        targetId: payload.branchId,
        expectedOrganizationId: orgId,
      })
    }

    const orgClients = this.listClients(orgId)
    const nextCode = payload.code || `CTA-${orgId === 'org-principal' ? 40 + orgClients.length : 110 + orgClients.length}`
    const created = {
      id: nextCode,
      organizationId: orgId,
      branchId: payload.branchId || this.state.organizationBranches.find((b) => b.organizationId === orgId)?.id,
      code: nextCode,
      legalName: payload.legalName || payload.displayName || payload.name,
      displayName: payload.displayName || payload.name,
      taxId: payload.taxId || '901.000.111-1',
      sector: payload.sector || 'Servicios',
      ownerMemberId: payload.ownerMemberId || null,
      ownerName: payload.ownerName || 'Coordinación General',
      contactName: payload.contactName || '',
      contactEmail: payload.contactEmail || '',
      status: payload.status || 'active',
      meta: payload.meta || `Sector: ${payload.sector || 'Servicios'} · NIT ${payload.taxId || 'Registrado'}`,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    }

    this.state.clients = [created, ...(this.state.clients || [])]
    this._saveState()
    return created
  }

  listOpportunities(organizationId = this.state.activeOrganizationId) {
    this._assertActiveMembership(organizationId)
    return (this.state.opportunities || []).filter(
      (o) => o.organizationId === organizationId && !o.deletedAt
    )
  }

  insertOpportunity(payload) {
    const orgId = payload.organizationId || this.state.activeOrganizationId
    this._assertActiveMembership(orgId)

    if (payload.clientId) {
      assertSameOrganizationReference({
        sourceEntityName: 'CommercialOpportunity',
        targetEntityName: 'Client',
        targetCollection: this.state.clients,
        targetId: payload.clientId,
        expectedOrganizationId: orgId,
      })
    }

    const orgOpps = this.listOpportunities(orgId)
    const nextCode = payload.code || `OP-${orgId === 'org-principal' ? 215 + orgOpps.length : 310 + orgOpps.length}`
    const created = {
      id: nextCode,
      organizationId: orgId,
      clientId: payload.clientId || null,
      code: nextCode,
      title: payload.title,
      ownerMemberId: payload.ownerMemberId || null,
      ownerName: payload.ownerName || 'Gestión Comercial',
      stage: payload.stage || 'propuesta',
      area: `Etapa: ${payload.stage || 'Propuesta enviada'}`,
      status: payload.status || 'process',
      estimatedValue: Number(payload.estimatedValue || 25000000),
      currency: payload.currency || 'COP',
      probability: Number(payload.probability || 60),
      meta: payload.meta || `Valor est.: $${Number(payload.estimatedValue || 25000000).toLocaleString('es-CO')} COP`,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    }

    this.state.opportunities = [created, ...(this.state.opportunities || [])]
    this._saveState()
    return created
  }

  listTasks(organizationId = this.state.activeOrganizationId) {
    this._assertActiveMembership(organizationId)
    return (this.state.tasks || []).filter(
      (t) => t.organizationId === organizationId && !t.deletedAt
    )
  }

  insertTask(payload) {
    const orgId = payload.organizationId || this.state.activeOrganizationId
    this._assertActiveMembership(orgId)

    if (payload.departmentId) {
      assertSameOrganizationReference({
        sourceEntityName: 'Task',
        targetEntityName: 'Department',
        targetCollection: this.state.departments,
        targetId: payload.departmentId,
        expectedOrganizationId: orgId,
      })
    }

    const orgTasks = this.listTasks(orgId)
    const nextCode = payload.code || `TAR-${orgId === 'org-principal' ? 310 + orgTasks.length : 110 + orgTasks.length}`
    const created = {
      id: nextCode,
      organizationId: orgId,
      code: nextCode,
      title: payload.title,
      requestId: payload.requestId || null,
      clientId: payload.clientId || null,
      departmentId: payload.departmentId || null,
      assignedMemberId: payload.assignedMemberId || null,
      owner: payload.owner || 'Coordinación Operativa',
      area: payload.area || 'Operaciones',
      priority: payload.priority || 'Media',
      status: payload.status || 'pending',
      dueLabel: payload.dueLabel || 'Mañana · 17:00',
      meta: `${payload.dueLabel || 'Mañana · 17:00'} · Prioridad ${payload.priority || 'Media'}`,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    }

    this.state.tasks = [created, ...(this.state.tasks || [])]
    this._saveState()
    return created
  }

  updateTask(organizationId, taskId, patch) {
    this._assertActiveMembership(organizationId)
    const existing = assertSameOrganizationReference({
      sourceEntityName: 'TaskUpdate',
      targetEntityName: 'Task',
      targetCollection: this.state.tasks,
      targetId: taskId,
      expectedOrganizationId: organizationId,
    })

    const updated = { ...existing, ...patch, id: existing.id, organizationId }
    this.state.tasks = this.state.tasks.map((t) =>
      t.id === taskId && t.organizationId === organizationId ? updated : t
    )
    this._saveState()
    return updated
  }

  listDocuments(organizationId = this.state.activeOrganizationId) {
    this._assertActiveMembership(organizationId)
    return (this.state.documents || []).filter(
      (d) => d.organizationId === organizationId && !d.deletedAt
    )
  }

  insertDocument(payload) {
    const orgId = payload.organizationId || this.state.activeOrganizationId
    this._assertActiveMembership(orgId)

    const orgDocs = this.listDocuments(orgId)
    const nextCode = payload.code || `DOC-${orgId === 'org-principal' ? 95 + orgDocs.length : 210 + orgDocs.length}`
    const cleanFile = String(payload.filename || payload.title || 'documento.pdf')
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '-')

    const storagePath = `${orgId}/documents/${nextCode}/${cleanFile}`
    const created = {
      id: nextCode,
      organizationId: orgId,
      code: nextCode,
      title: payload.title,
      category: payload.category || 'Operativo',
      version: payload.version || 'v1.0',
      status: payload.status || 'active',
      clientId: payload.clientId || null,
      requestId: payload.requestId || null,
      uploadedByMemberId: payload.uploadedByMemberId || null,
      owner: payload.owner || 'Repositorio Documental',
      storageBucket: 'coreflow-documents',
      storagePath,
      meta: `${payload.version || 'v1.0'} · Storage: ${storagePath}`,
      createdAt: new Date().toISOString(),
      deletedAt: null,
    }

    this.state.documents = [created, ...(this.state.documents || [])]
    this._saveState()
    return created
  }

  listAutomationRules(organizationId = this.state.activeOrganizationId) {
    this._assertActiveMembership(organizationId)
    return (this.state.automationRules || []).filter(
      (r) => r.organizationId === organizationId
    )
  }

  insertAutomationRule(payload) {
    const orgId = payload.organizationId || this.state.activeOrganizationId
    this._assertActiveMembership(orgId)

    const orgRules = this.listAutomationRules(orgId)
    const nextCode = payload.code || `FLU-${orgId === 'org-principal' ? 10 + orgRules.length : 110 + orgRules.length}`
    const created = {
      id: nextCode,
      organizationId: orgId,
      code: nextCode,
      name: payload.name,
      description: payload.description || 'Regla automatizada configurada en el entorno.',
      triggerEvent: payload.triggerEvent || 'request.created',
      scopeType: payload.scopeType || 'basic_notification',
      owner: payload.owner || 'Configuración Organizacional',
      area:
        payload.scopeType === 'cross_department_workflow'
          ? 'Flujo entre áreas (Business)'
          : 'Notificación directa',
      status: 'active',
      executionsCount: 1,
      meta: `${
        payload.scopeType === 'cross_department_workflow'
          ? 'Automatización entre áreas'
          : 'Automatización básica'
      } · Activa`,
    }

    this.state.automationRules = [created, ...(this.state.automationRules || [])]
    this._saveState()
    return created
  }

  // ---------------------------------------------------------------------------
  // AUDITORÍA PROTEGIDA APPEND-ONLY
  // ---------------------------------------------------------------------------
  appendAuditLog(auditPayload) {
    const session = this.getCurrentSession()
    const orgId = auditPayload.organizationId || this.state.activeOrganizationId

    if (!session.isPlatformAdmin) {
      this._assertActiveMembership(orgId)
    }

    const immutableRecord = createImmutableAuditRecord({
      ...auditPayload,
      organizationId: orgId || 'org-principal',
    })

    this.state.auditLogs = [immutableRecord, ...this.state.auditLogs]
    this._saveState()
    return immutableRecord
  }

  listAuditLogs(organizationId = this.state.activeOrganizationId) {
    const session = this.getCurrentSession()
    if (!session.isPlatformAdmin) {
      this._assertActiveMembership(organizationId)
    }
    return this.state.auditLogs.filter((log) => log.organizationId === organizationId)
  }

  updateAuditLog() {
    const err = new Error(
      'SECURITY_POLICY_VIOLATION: audit_logs es inmutable (append-only). No se permite UPDATE sobre registros de auditoría.'
    )
    err.code = 'AUDIT_IMMUTABILITY_VIOLATION'
    throw err
  }

  deleteAuditLog() {
    const err = new Error(
      'SECURITY_POLICY_VIOLATION: audit_logs es inmutable (append-only). No se permite DELETE sobre registros de auditoría.'
    )
    err.code = 'AUDIT_IMMUTABILITY_VIOLATION'
    throw err
  }
}
