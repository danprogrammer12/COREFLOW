/**
 * PROVEEDOR DE PRODUCCIÓN SUPABASE (PostgreSQL + RLS + Auth + Storage Privado)
 * CoreFlow — src/core/providers/SupabaseDataProvider.js
 *
 * Implementa el contrato completo IDataProvider contra Supabase:
 *  - Autenticación real con Supabase Auth (`signInWithPassword`, `signOut`)
 *  - Resolución de los 3 contextos (`platform_admins`, `organization_members`, `organization_subscriptions`)
 *  - Administración global de planes y suscripciones (`plan_catalog`, `organization_subscriptions`)
 *  - Persistencia multi-tenant con RLS en todos los módulos operativos
 *  - Almacenamiento privado en Supabase Storage (`coreflow-documents`)
 */

import { createImmutableAuditRecord } from '../domain/auditSanitizer.js'
import { normalizeDatabasePlanRow } from '../config/plansCatalog.js'

export class SupabaseDataProvider {
  constructor({ supabaseClient, storageBucket = 'coreflow-documents' } = {}) {
    this.providerName = 'SupabaseDataProvider (PostgreSQL + RLS + Storage)'
    this.client = supabaseClient || null
    this.storageBucket = storageBucket
    this.activeOrganizationId = null
  }

  _requireClient() {
    if (!this.client) {
      const err = new Error(
        'SUPABASE_CLIENT_NOT_CONFIGURED: Configure VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en su archivo .env.local.'
      )
      err.code = 'SUPABASE_CLIENT_NOT_CONFIGURED'
      throw err
    }
    return this.client
  }

  buildTenantStoragePath({ organizationId, moduleName, entityId, filename }) {
    const orgId = organizationId || this.activeOrganizationId
    if (!orgId || !moduleName || !entityId || !filename) {
      const err = new Error(
        'STORAGE_PATH_INVALID: Se requiere organizationId, moduleName, entityId y filename para garantizar el aislamiento en Supabase Storage.'
      )
      err.code = 'STORAGE_PATH_INVALID'
      throw err
    }
    const cleanFilename = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_')
    return `${orgId}/${moduleName}/${entityId}/${cleanFilename}`
  }

  async authenticateByEmail({ email, password }) {
    const client = this._requireClient()
    const { data, error } = await client.auth.signInWithPassword({
      email: String(email || '').trim(),
      password: String(password || ''),
    })
    if (error || !data?.user) {
      const err = new Error(
        error?.message || 'AUTH_INVALID_CREDENTIALS: Credenciales inválidas en Supabase Auth.'
      )
      err.code = 'AUTH_INVALID_CREDENTIALS'
      throw err
    }
    return this.getCurrentSession()
  }

  async signOut() {
    const client = this._requireClient()
    await client.auth.signOut()
    this.activeOrganizationId = null
    return { signedOut: true }
  }

  async getCurrentSession() {
    const client = this._requireClient()
    const { data: authData, error: authErr } = await client.auth.getUser()
    if (authErr || !authData?.user) {
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

    const userId = authData.user.id

    // 1. Verificar si pertenece a platform_admins (Contexto A)
    const { data: platformAdminRecord } = await client
      .from('platform_admins')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    // 2. Consultar membresías organizacionales (Contextos B y C)
    const { data: memberships, error: memErr } = await client
      .from('organization_members')
      .select('*, organizations(*), roles(*)')
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null)

    if (memErr) throw memErr

    const accessibleOrganizations = (memberships || [])
      .map((m) => m.organizations)
      .filter(Boolean)

    const isPlatformAdmin = Boolean(platformAdminRecord)

    if (!isPlatformAdmin && !this.activeOrganizationId && accessibleOrganizations.length > 0) {
      this.activeOrganizationId = accessibleOrganizations[0].id
    }

    return {
      isAuthenticated: true,
      isPlatformAdmin,
      accessContext: isPlatformAdmin ? 'PLATFORM_ADMIN' : 'TENANT_WORKSPACE',
      user: {
        id: userId,
        email: authData.user.email,
        fullName:
          platformAdminRecord?.full_name ||
          authData.user.user_metadata?.full_name ||
          authData.user.email,
      },
      platformAdminRecord: platformAdminRecord || null,
      memberships: memberships || [],
      accessibleOrganizations,
      activeOrganizationId: isPlatformAdmin ? null : this.activeOrganizationId,
    }
  }

  async switchActiveOrganization(organizationId) {
    const client = this._requireClient()
    const { data: authData } = await client.auth.getUser()
    const userId = authData?.user?.id

    const { data: membership, error } = await client
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single()

    if (error || !membership) {
      const err = new Error(
        `TENANT_ISOLATION_VIOLATION: El usuario autenticado no posee membresía activa en la organización "${organizationId}".`
      )
      err.code = 'TENANT_ISOLATION_VIOLATION'
      throw err
    }

    this.activeOrganizationId = organizationId
    return {
      activeOrganizationId: organizationId,
      membership,
    }
  }

  async getOrganizationContext(organizationId = this.activeOrganizationId) {
    const client = this._requireClient()
    const [orgRes, subRes, plansRes, branchRes, deptRes, memRes, entRes, roleRes] =
      await Promise.all([
        client.from('organizations').select('*').eq('id', organizationId).single(),
        client
          .from('organization_subscriptions')
          .select('*')
          .eq('organization_id', organizationId)
          .maybeSingle(),
        client.from('plan_catalog').select('*').eq('is_active', true),
        client
          .from('organization_branches')
          .select('*')
          .eq('organization_id', organizationId)
          .is('deleted_at', null),
        client
          .from('departments')
          .select('*')
          .eq('organization_id', organizationId)
          .is('deleted_at', null),
        client
          .from('organization_members')
          .select('*')
          .eq('organization_id', organizationId)
          .is('deleted_at', null),
        client
          .from('organization_entitlements')
          .select('*')
          .eq('organization_id', organizationId),
        client
          .from('roles')
          .select('*, role_permissions(*)')
          .eq('organization_id', organizationId),
      ])

    if (orgRes.error || !orgRes.data) {
      const err = new Error(
        `TENANT_ISOLATION_VIOLATION: Acceso rechazado por RLS para la organización "${organizationId}".`
      )
      err.code = 'TENANT_ISOLATION_VIOLATION'
      throw err
    }

    return {
      organization: orgRes.data,
      subscription: subRes.data || null,
      planCatalog: (plansRes.data || []).map((p) => normalizeDatabasePlanRow(p)),
      branches: branchRes.data || [],
      departments: deptRes.data || [],
      members: memRes.data || [],
      entitlements: entRes.data || [],
      roles: roleRes.data || [],
    }
  }

  // ---------------------------------------------------------------------------
  // PLATFORM ADMIN OPERATIONS
  // ---------------------------------------------------------------------------
  async listPlanCatalog() {
    const client = this._requireClient()
    const { data, error } = await client
      .from('plan_catalog')
      .select('*')
      .order('price_monthly_usd', { ascending: true })
    if (error) throw error
    return (data || []).map((row) => normalizeDatabasePlanRow(row))
  }

  async upsertPlanCatalog(planPayload) {
    const client = this._requireClient()
    const normalized = normalizeDatabasePlanRow(planPayload)
    const { data, error } = await client
      .from('plan_catalog')
      .upsert({
        plan_code: normalized.planCode,
        display_name: normalized.displayName,
        description: normalized.description,
        price_monthly_usd: normalized.priceMonthlyUsd,
        collaborators_range_label: normalized.collaboratorsRangeLabel,
        default_approval_summary: normalized.defaultApprovalSummary,
        limits_json: {
          max_collaborators: normalized.limits.maxCollaborators,
          max_branches: normalized.limits.maxBranches,
          max_storage_mb: normalized.limits.maxStorageMb,
        },
        features_json: {
          multi_branch: normalized.features.multiBranch,
          departments_and_teams: normalized.features.departmentsAndTeams,
          granular_permissions: normalized.features.granularPermissions,
          multilevel_approvals: normalized.features.multilevelApprovals,
          cross_area_automations: normalized.features.crossAreaAutomations,
          responsible_indicators: normalized.features.responsibleIndicators,
          basic_automations: normalized.features.basicAutomations,
          ai_assistant: normalized.features.aiAssistant,
        },
        is_active: normalized.isActive,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return normalizeDatabasePlanRow(data)
  }

  async listAllOrganizationsForPlatformAdmin() {
    const client = this._requireClient()
    const { data, error } = await client
      .from('organizations')
      .select('*, organization_subscriptions(*), organization_entitlements(*)')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async createOrganizationByPlatformAdmin(payload) {
    const client = this._requireClient()
    const { data: org, error: orgErr } = await client
      .from('organizations')
      .insert({
        slug: payload.slug,
        legal_name: payload.legalName || payload.displayName,
        display_name: payload.displayName,
        tax_id: payload.taxId,
        sector: payload.sector,
        contracted_plan_code: payload.planCode || 'starter',
        status: 'active',
      })
      .select()
      .single()

    if (orgErr) throw orgErr

    const { data: sub, error: subErr } = await client
      .from('organization_subscriptions')
      .insert({
        organization_id: org.id,
        plan_code: payload.planCode || 'starter',
        status: payload.subscriptionStatus || 'active',
        billing_cycle: payload.billingCycle || 'monthly',
        valid_until: payload.validUntil || new Date(Date.now() + 31536000000).toISOString(),
        notes: payload.notes || '',
      })
      .select()
      .single()

    if (subErr) throw subErr
    return { organization: org, subscription: sub }
  }

  async updateSubscriptionByPlatformAdmin({
    organizationId,
    planCode,
    status = 'active',
    billingCycle = 'monthly',
    validUntil,
    notes = '',
    assignedBy = null,
  }) {
    const client = this._requireClient()
    const { data, error } = await client
      .from('organization_subscriptions')
      .upsert(
        {
          organization_id: organizationId,
          plan_code: planCode,
          status,
          billing_cycle: billingCycle,
          valid_until: validUntil,
          assigned_by: assignedBy,
          notes,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'organization_id' }
      )
      .select()
      .single()

    if (error) throw error
    return data
  }

  async upsertEntitlementByPlatformAdmin({
    organizationId,
    entitlementKey,
    valueJson,
    reason = '',
    updatedBy = null,
  }) {
    const client = this._requireClient()
    const { data, error } = await client
      .from('organization_entitlements')
      .upsert({
        organization_id: organizationId,
        entitlement_key: entitlementKey,
        value_json: valueJson,
        reason,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async listAllUsersForPlatformAdmin() {
    const client = this._requireClient()
    const [adminsRes, profilesRes, membersRes] = await Promise.all([
      client.from('platform_admins').select('*'),
      client.from('user_profiles').select('*'),
      client.from('organization_members').select('*, organizations(display_name)'),
    ])
    return {
      platformAdmins: adminsRes.data || [],
      userProfiles: profilesRes.data || [],
      memberships: membersRes.data || [],
    }
  }

  async listGlobalAuditLogsForPlatformAdmin() {
    const client = this._requireClient()
    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) throw error
    return data || []
  }

  // ---------------------------------------------------------------------------
  // TENANT OPERATIONAL MODULES
  // ---------------------------------------------------------------------------
  async listRequests(organizationId = this.activeOrganizationId) {
    const client = this._requireClient()
    const { data, error } = await client
      .from('requests')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async listApprovalSteps(organizationId = this.activeOrganizationId, requestId = null) {
    const client = this._requireClient()
    let query = client
      .from('approval_steps')
      .select('*')
      .eq('organization_id', organizationId)
      .order('step_order', { ascending: true })

    if (requestId) {
      query = query.eq('request_id', requestId)
    }

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  async insertRequest(payload) {
    const client = this._requireClient()
    const orgId = payload.organizationId || this.activeOrganizationId
    const { data, error } = await client
      .from('requests')
      .insert({
        organization_id: orgId,
        code: payload.code,
        title: payload.asunto,
        client_reference: payload.cliente,
        branch_id: payload.branchId,
        department_id: payload.departmentId || null,
        assigned_member_id: payload.assignedMemberId,
        priority: payload.prioridad || 'Media',
        status: payload.estado || 'process',
        due_label: payload.vencimiento || 'En tiempo (48h)',
        approval_summary: payload.nivelAprobacion,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateRequest(organizationId, requestId, patch) {
    const client = this._requireClient()
    const { data, error } = await client
      .from('requests')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', requestId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async listClients(organizationId = this.activeOrganizationId) {
    const client = this._requireClient()
    const { data, error } = await client
      .from('clients')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async insertClient(payload) {
    const client = this._requireClient()
    const orgId = payload.organizationId || this.activeOrganizationId
    const { data, error } = await client
      .from('clients')
      .insert({
        organization_id: orgId,
        branch_id: payload.branchId,
        code: payload.code,
        legal_name: payload.legalName || payload.displayName,
        display_name: payload.displayName,
        tax_id: payload.taxId,
        sector: payload.sector || 'Servicios',
        status: payload.status || 'active',
        owner_member_id: payload.ownerMemberId,
        contact_name: payload.contactName,
        contact_email: payload.contactEmail,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async listOpportunities(organizationId = this.activeOrganizationId) {
    const client = this._requireClient()
    const { data, error } = await client
      .from('commercial_opportunities')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async insertOpportunity(payload) {
    const client = this._requireClient()
    const orgId = payload.organizationId || this.activeOrganizationId
    const { data, error } = await client
      .from('commercial_opportunities')
      .insert({
        organization_id: orgId,
        client_id: payload.clientId,
        code: payload.code,
        title: payload.title,
        stage: payload.stage || 'propuesta',
        status: payload.status || 'process',
        estimated_value: payload.estimatedValue || 0,
        currency: payload.currency || 'COP',
        probability: payload.probability || 50,
        owner_member_id: payload.ownerMemberId,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async listTasks(organizationId = this.activeOrganizationId) {
    const client = this._requireClient()
    const { data, error } = await client
      .from('tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async insertTask(payload) {
    const client = this._requireClient()
    const orgId = payload.organizationId || this.activeOrganizationId
    const { data, error } = await client
      .from('tasks')
      .insert({
        organization_id: orgId,
        code: payload.code,
        title: payload.title,
        request_id: payload.requestId || null,
        client_id: payload.clientId || null,
        department_id: payload.departmentId || null,
        assigned_member_id: payload.assignedMemberId || null,
        priority: payload.priority || 'Media',
        status: payload.status || 'pending',
        due_label: payload.dueLabel || 'Hoy · 17:00',
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async updateTask(organizationId, taskId, patch) {
    const client = this._requireClient()
    const { data, error } = await client
      .from('tasks')
      .update(patch)
      .eq('organization_id', organizationId)
      .eq('id', taskId)
      .select()
      .single()
    if (error) throw error
    return data
  }

  async listDocuments(organizationId = this.activeOrganizationId) {
    const client = this._requireClient()
    const { data, error } = await client
      .from('documents')
      .select('*')
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async insertDocument(payload) {
    const client = this._requireClient()
    const orgId = payload.organizationId || this.activeOrganizationId
    const storagePath = this.buildTenantStoragePath({
      organizationId: orgId,
      moduleName: 'documents',
      entityId: payload.code || 'DOC',
      filename: payload.filename || `${payload.title}.pdf`,
    })

    if (payload.fileBlob) {
      const { error: uploadErr } = await client.storage
        .from(this.storageBucket)
        .upload(storagePath, payload.fileBlob, { upsert: true })
      if (uploadErr) throw uploadErr
    }

    const { data, error } = await client
      .from('documents')
      .insert({
        organization_id: orgId,
        code: payload.code,
        title: payload.title,
        category: payload.category || 'Operativo',
        version: payload.version || 'v1.0',
        status: payload.status || 'active',
        client_id: payload.clientId || null,
        request_id: payload.requestId || null,
        department_id: payload.departmentId || null,
        uploaded_by_member_id: payload.uploadedByMemberId || null,
        storage_bucket: this.storageBucket,
        storage_path: storagePath,
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async listAutomationRules(organizationId = this.activeOrganizationId) {
    const client = this._requireClient()
    const { data, error } = await client
      .from('automation_rules')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  }

  async insertAutomationRule(payload) {
    const client = this._requireClient()
    const orgId = payload.organizationId || this.activeOrganizationId
    const { data, error } = await client
      .from('automation_rules')
      .insert({
        organization_id: orgId,
        code: payload.code,
        name: payload.name,
        description: payload.description,
        trigger_event: payload.triggerEvent || 'request.created',
        scope_type: payload.scopeType || 'basic_notification',
        source_department_id: payload.sourceDepartmentId || null,
        target_department_id: payload.targetDepartmentId || null,
        status: 'active',
      })
      .select()
      .single()
    if (error) throw error
    return data
  }

  async appendAuditLog(auditPayload) {
    const client = this._requireClient()
    const orgId = auditPayload.organizationId || this.activeOrganizationId
    const sanitized = createImmutableAuditRecord({
      ...auditPayload,
      organizationId: orgId || '00000000-0000-0000-0000-000000000000',
    })

    const { data, error } = await client
      .from('audit_logs')
      .insert({
        organization_id: auditPayload.organizationId || this.activeOrganizationId || null,
        actor_user_id: sanitized.actorUserId,
        actor_member_id: sanitized.actorMemberId,
        actor_role_code: sanitized.actorRoleCode,
        module: sanitized.module,
        entity_type: sanitized.entityType,
        entity_id: sanitized.entityId,
        action: sanitized.action,
        summary: sanitized.summary,
        sanitized_changes: sanitized.sanitizedChanges,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  async listAuditLogs(organizationId = this.activeOrganizationId) {
    const client = this._requireClient()
    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  updateAuditLog() {
    const err = new Error(
      'SECURITY_POLICY_VIOLATION: audit_logs es protegida por trigger trg_protect_audit_logs. No se permite UPDATE.'
    )
    err.code = 'AUDIT_IMMUTABILITY_VIOLATION'
    throw err
  }

  deleteAuditLog() {
    const err = new Error(
      'SECURITY_POLICY_VIOLATION: audit_logs es protegida por trigger trg_protect_audit_logs. No se permite DELETE.'
    )
    err.code = 'AUDIT_IMMUTABILITY_VIOLATION'
    throw err
  }
}
