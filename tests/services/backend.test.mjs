/**
 * NIVEL SIMULADA — Capa de servicios contra migraciones y RLS reales.
 * PostgREST, Auth y Storage están simulados: no equivale a Supabase real.
 */

import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createDatabase, createAuthUser, createPlatformAdmin, seedApprovalStep, seedRequest, seedTenant } from '../db/harness.mjs'
import { createSimulatedClient } from './simulatedSupabaseClient.mjs'
import { createBackendEngine, resolveDataMode } from '../../src/core/backend/index.js'
import { createCoreFlowEngine } from '../../src/core/index.js'

const PASSWORD = 'clave-de-prueba'
const silent = { warn() {} }
let db, biz, other, starter, suspended
let superAdminEmail

const passwords = new Proxy({}, { get: () => PASSWORD })
const engineFor = () => createBackendEngine({ client: createSimulatedClient(db, { passwords }), logger: silent })

async function signedIn(email) {
  const engine = engineFor()
  const result = await engine.authentication.signIn({ email, password: PASSWORD })
  assert.equal(result.ok, true, result.error)
  return engine
}

const expectOk = (result) => {
  assert.equal(result.ok, true, `${result.code}: ${result.error}`)
  return result.data
}
const expectFail = (result, code) => {
  assert.equal(result.ok, false, 'se esperaba un fallo')
  assert.equal(result.code, code, result.error)
}

before(async () => {
  db = await createDatabase()
  const members = [
    { key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' },
    { key: 'ops', role: 'OPS_COORDINATOR', dept: 'OPS' },
    { key: 'specialist', role: 'SPECIALIST', dept: 'OPS' },
    { key: 'viewer', role: 'AUDITOR_VIEWER' },
  ]
  biz = await seedTenant(db, { slug: 'biz', members })
  other = await seedTenant(db, { slug: 'other', members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }] })
  starter = await seedTenant(db, { slug: 'starter', plan: 'starter', departments: [], members: [{ key: 'admin', role: 'ORG_ADMIN' }] })
  suspended = await seedTenant(db, { slug: 'susp', orgStatus: 'suspended', subStatus: 'suspended', members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }] })
  superAdminEmail = 'super@platform.test'
  await createPlatformAdmin(db, superAdminEmail, 'SUPER_ADMIN')
})

after(async () => {
  await db?.close()
})

describe('modo de datos sin fallback', () => {
  test('sin cliente, el motor falla', () => {
    assert.throws(() => createBackendEngine({}), /requiere un cliente/)
  })

  test('supabase-prod sin configuración es un error, no modo local', () => {
    assert.throws(() => resolveDataMode({ requestedMode: 'supabase-prod', isSupabaseConfigured: false }), /requiere VITE_SUPABASE_URL/)
    assert.throws(() => resolveDataMode({ requestedMode: 'otro', isSupabaseConfigured: true }), /no admitido/)
    assert.equal(resolveDataMode({ requestedMode: undefined, isSupabaseConfigured: false }), 'local-dev')
  })

  test('un error 5xx de Auth no se confunde con credenciales inválidas', async () => {
    const client = createSimulatedClient(db, { passwords })
    client.auth.signInWithPassword = async () => ({ data: { user: null }, error: { message: 'Internal error', status: 503 } })
    const engine = createBackendEngine({ client, logger: silent })
    expectFail(await engine.authentication.signIn({ email: 'a@a.test', password: 'x' }), 'BACKEND_UNAVAILABLE')
  })

  test('un fallo de red llega como BACKEND_UNAVAILABLE', async () => {
    const client = createSimulatedClient(db, { passwords })
    client.auth.getSession = async () => { throw new TypeError('Failed to fetch') }
    const engine = createBackendEngine({ client, logger: silent })
    expectFail(await engine.authentication.initialize(), 'BACKEND_UNAVAILABLE')
    assert.equal(engine.getSnapshot().status, 'error')
    assert.equal(engine.getSnapshot().session.isAuthenticated, false)
  })
})

describe('autenticación y sesiones', () => {
  test('credenciales inválidas', async () => {
    const engine = engineFor()
    expectFail(await engine.authentication.signIn({ email: 'nadie@a.test', password: 'x' }), 'AUTH_INVALID_CREDENTIALS')
  })

  test('sesión de tenant con forma compatible', async () => {
    const engine = await signedIn('admin@biz.test')
    const { status, session } = engine.getSnapshot()
    assert.equal(status, 'ready')
    assert.equal(session.accessContext, 'TENANT_WORKSPACE')
    assert.equal(session.activeOrganizationId, biz.orgId)
    assert.equal(session.memberships[0].roleCode, 'ORG_ADMIN')
    assert.equal(session.accessibleOrganizations[0].displayName, 'biz')
  })

  test('sesión de Platform Admin sin organización activa', async () => {
    const engine = await signedIn(superAdminEmail)
    const { session } = engine.getSnapshot()
    assert.equal(session.isPlatformAdmin, true)
    assert.equal(session.accessContext, 'PLATFORM_ADMIN')
    assert.equal(session.activeOrganizationId, null)
  })

  test('sin membresías se rechaza y se cierra la sesión', async () => {
    await createAuthUser(db, 'sin-org@a.test')
    const client = createSimulatedClient(db, { passwords })
    const engine = createBackendEngine({ client, logger: silent })
    expectFail(await engine.authentication.signIn({ email: 'sin-org@a.test', password: PASSWORD }), 'AUTH_NO_ACTIVE_MEMBERSHIP')
    assert.equal(client.currentUser, null)
    assert.equal(engine.getSnapshot().session.isAuthenticated, false)
    assert.equal(engine.getSnapshot().status, 'error')
  })

  test('si falla el cierre tras rechazar la cuenta, se informa ese fallo', async () => {
    await createAuthUser(db, 'sin-org-2@a.test')
    const client = createSimulatedClient(db, { passwords })
    client.auth.signOut = async () => ({ error: { message: 'No se pudo cerrar', status: 400 } })
    const engine = createBackendEngine({ client, logger: silent })
    expectFail(await engine.authentication.signIn({ email: 'sin-org-2@a.test', password: PASSWORD }), 'BACKEND_ERROR')
    assert.equal(engine.getSnapshot().status, 'error')
  })

  test('el listener recarga la sesión ante un inicio en otra pestaña', async () => {
    const client = createSimulatedClient(db, { passwords })
    const engine = createBackendEngine({ client, logger: silent })
    expectOk(await engine.authentication.startSessionListener())
    await client.auth.signInWithPassword({ email: 'ops@biz.test', password: PASSWORD })
    const updated = new Promise((resolve) => {
      const stop = engine.subscribe(() => {
        if (engine.getSnapshot().session.isAuthenticated) { stop(); resolve() }
      })
    })
    client.auth._emit('SIGNED_IN')
    await updated
    assert.equal(engine.getSnapshot().session.user.email, 'ops@biz.test')
  })

  test('initialize restaura la sesión existente y signOut la limpia', async () => {
    const client = createSimulatedClient(db, { passwords })
    await client.auth.signInWithPassword({ email: 'ops@biz.test', password: PASSWORD })
    const engine = createBackendEngine({ client, logger: silent })
    const session = expectOk(await engine.authentication.initialize())
    assert.equal(session.isAuthenticated, true)
    expectOk(await engine.authentication.signOut())
    assert.equal(engine.getSnapshot().session.isAuthenticated, false)
  })

  test('el inicio de sesión queda auditado con el actor real', async () => {
    await signedIn('viewer@biz.test')
    const { rows } = await db.query(
      `select actor_member_id, origin from audit_logs where action = 'SESSION_AUTHENTICATED' and actor_user_id = $1`,
      [biz.users.viewer]
    )
    assert.equal(rows[0].actor_member_id, biz.memberIds.viewer)
    assert.equal(rows[0].origin, 'client')
  })
})

describe('contexto organizacional y capacidades', () => {
  test('el contexto trae lo que usan las vistas', async () => {
    const engine = await signedIn('admin@biz.test')
    const ctx = expectOk(await engine.organizations.getTenantContext(biz.orgId))
    assert.equal(ctx.organization.id, biz.orgId)
    assert.equal(ctx.activeMembership.id, biz.memberIds.admin)
    assert.equal(ctx.activeMembership.roleCode, 'ORG_ADMIN')
    assert.ok(ctx.rolePermissions.length > 0)
    assert.equal(ctx.departments.length, 2)
    assert.equal(ctx.entitlementsResolved.contractedEdition, 'business')
    assert.equal(ctx.entitlementsResolved.realFeatures.multilevelApprovals, true)
    assert.equal(ctx.entitlementsResolved.realLimits.maxCollaborators, 30)
    assert.equal(ctx.entitlementsResolved.collaboratorsStatus.current, 4)
  })

  test('Starter y Business difieren en capacidades', async () => {
    const engine = await signedIn('admin@starter.test')
    const resolved = expectOk(await engine.subscriptions.getEntitlements(starter.orgId))
    assert.equal(resolved.contractedEdition, 'starter')
    assert.equal(resolved.realFeatures.multilevelApprovals, false)
    assert.equal(resolved.realLimits.maxBranches, 1)
  })

  test('no se obtiene el contexto de otro tenant', async () => {
    const engine = await signedIn('admin@other.test')
    expectFail(await engine.organizations.getTenantContext(biz.orgId), 'TENANT_ISOLATION_VIOLATION')
    expectFail(await engine.subscriptions.getEntitlements(biz.orgId), 'TENANT_ISOLATION_VIOLATION')
  })

  test('switchOrganization exige membresía', async () => {
    const engine = await signedIn('admin@other.test')
    expectFail(await engine.organizations.switchOrganization(biz.orgId), 'TENANT_ISOLATION_VIOLATION')
    expectOk(await engine.organizations.switchOrganization(other.orgId))
  })

  test('tenant suspendido: capacidades indican solo lectura', async () => {
    const engine = await signedIn('admin@susp.test')
    const resolved = expectOk(await engine.subscriptions.getEntitlements(suspended.orgId))
    assert.equal(resolved.canWrite, false)
  })
})

describe('fidelidad del cliente simulado', () => {
  test('un argumento RPC undefined se omite, como en supabase-js', async () => {
    const client = createSimulatedClient(db, { passwords })
    await client.auth.signInWithPassword({ email: 'admin@biz.test', password: PASSWORD })
    const { error } = await client.rpc('rpc_get_org_capabilities', { p_org: undefined })
    assert.ok(error, 'una llamada sin el argumento obligatorio debe fallar')
    assert.match(error.message, /does not exist/)
  })
})

describe('autorización para la interfaz', () => {
  test('permisos efectivos con alcance', async () => {
    const engine = await signedIn('specialist@biz.test')
    const permissions = expectOk(await engine.authorization.getEffectivePermissions(biz.orgId))
    assert.equal(permissions.find((p) => p.permissionKey === 'requests:read').scope, 'TEAM_OR_ASSIGNED')
  })

  test('can considera permiso, capacidad y estado', async () => {
    const admin = await signedIn('admin@starter.test')
    assert.deepEqual(
      expectOk(await admin.authorization.can(starter.orgId, 'approvals:validate_level', { requiredFeature: 'multilevelApprovals' })),
      { allowed: false, code: 'ENTITLEMENT_FEATURE_RESTRICTED' }
    )
    const viewer = await signedIn('viewer@biz.test')
    assert.equal(expectOk(await viewer.authorization.can(biz.orgId, 'clients:write')).code, 'RBAC_PERMISSION_DENIED')
    const susp = await signedIn('admin@susp.test')
    assert.equal(expectOk(await susp.authorization.can(suspended.orgId, 'clients:write', { requiresWrite: true })).code, 'SUBSCRIPTION_INACTIVE')
  })
})

describe('organizaciones y membresías', () => {
  test('crear departamento persiste realmente', async () => {
    const engine = await signedIn('admin@biz.test')
    const dept = expectOk(await engine.organizations.createDepartment({ organizationId: biz.orgId, branchId: biz.branchId, code: 'fin', name: 'Finanzas' }))
    const { rows } = await db.query(`select name from departments where id = $1`, [dept.id])
    assert.equal(rows[0].name, 'Finanzas')
  })

  test('Starter no crea departamentos', async () => {
    const engine = await signedIn('admin@starter.test')
    expectFail(await engine.organizations.createDepartment({ organizationId: starter.orgId, branchId: starter.branchId, code: 'x', name: 'x' }), 'RBAC_PERMISSION_DENIED')
  })

  test('cuota de sedes como error tipado', async () => {
    const engine = await signedIn('admin@starter.test')
    expectFail(await engine.organizations.createBranch({ organizationId: starter.orgId, code: 'b2', name: 'Dos' }), 'BRANCH_QUOTA_EXCEEDED')
  })

  test('invitar, aceptar y modificar un miembro', async () => {
    await createAuthUser(db, 'nuevo@biz.test')
    const admin = await signedIn('admin@biz.test')
    const invited = expectOk(await admin.organizations.inviteMember({ organizationId: biz.orgId, email: 'nuevo@biz.test', roleCode: 'SPECIALIST' }))
    assert.equal(invited.status, 'invited')

    const client = createSimulatedClient(db, { passwords })
    await client.auth.signInWithPassword({ email: 'nuevo@biz.test', password: PASSWORD })
    const invitee = createBackendEngine({ client, logger: silent })
    assert.equal(expectOk(await invitee.organizations.acceptInvitation(biz.orgId)).status, 'active')

    const updated = expectOk(await admin.organizations.updateMember({ organizationId: biz.orgId, memberId: invited.id, patch: { jobTitle: 'Analista', roleCode: 'COMMERCIAL_LEAD' } }))
    assert.equal(updated.jobTitle, 'Analista')
    assert.equal(updated.roleId, biz.roleIds.COMMERCIAL_LEAD)
  })

  test('un rol sin permiso no invita', async () => {
    const engine = await signedIn('specialist@biz.test')
    expectFail(await engine.organizations.inviteMember({ organizationId: biz.orgId, email: 'admin@other.test', roleCode: 'SPECIALIST' }), 'RBAC_PERMISSION_DENIED')
  })
})

describe('módulos operativos', () => {
  test('cliente: crear y listar con el contrato de las vistas', async () => {
    const engine = await signedIn('admin@biz.test')
    const created = expectOk(await engine.operationalModules.createClient({ organizationId: biz.orgId, payload: { displayName: 'ACME', taxId: '900' } }))
    assert.equal(created.displayName, 'ACME')
    assert.match(created.code, /^CTA-/)
    assert.equal(created.ownerMemberId, biz.memberIds.admin)
    const list = expectOk(await engine.operationalModules.listClients(biz.orgId))
    assert.ok(list.some((c) => c.id === created.id))
  })

  test('oportunidad vinculada a un cliente', async () => {
    const engine = await signedIn('admin@biz.test')
    const client = expectOk(await engine.operationalModules.createClient({ organizationId: biz.orgId, payload: { displayName: 'Opp' } }))
    const opp = expectOk(await engine.operationalModules.createOpportunity({ organizationId: biz.orgId, payload: { clientId: client.id, title: 'Negocio', estimatedValue: 1000 } }))
    assert.equal(opp.estimatedValue, 1000)
    assert.ok(opp.meta.includes('COP'))
    assert.equal(expectOk(await engine.operationalModules.listOpportunities(biz.orgId)).some((o) => o.id === opp.id), true)
  })

  test('tarea: crear y alternar estado', async () => {
    const engine = await signedIn('ops@biz.test')
    const task = expectOk(await engine.operationalModules.createTask({ organizationId: biz.orgId, payload: { title: 'Revisar' } }))
    assert.equal(task.status, 'pending')
    const toggled = expectOk(await engine.operationalModules.toggleTaskStatus({ organizationId: biz.orgId, taskId: task.id }))
    assert.equal(toggled.status, 'completed')
    const { rows } = await db.query(`select status from tasks where id = $1`, [task.id])
    assert.equal(rows[0].status, 'completed')
  })

  test('tarea: un cambio simultáneo no se pisa', async () => {
    const client = createSimulatedClient(db, { passwords })
    const engine = createBackendEngine({ client, logger: silent })
    expectOk(await engine.authentication.signIn({ email: 'ops@biz.test', password: PASSWORD }))
    const task = expectOk(await engine.operationalModules.createTask({ organizationId: biz.orgId, payload: { title: 'Carrera' } }))

    const original = client._query
    client._query = async (sql, params) => {
      if (sql.startsWith('with w as (update public."tasks"')) {
        await db.query(`update tasks set status = 'active' where id = $1`, [task.id])
      }
      return original(sql, params)
    }
    expectFail(await engine.operationalModules.toggleTaskStatus({ organizationId: biz.orgId, taskId: task.id }), 'UPDATE_NOT_APPLIED')
    const { rows } = await db.query(`select status from tasks where id = $1`, [task.id])
    assert.equal(rows[0].status, 'active')
  })

  test('tarea: un rol que la ve pero no la edita recibe un error, no un éxito', async () => {
    const owner = await signedIn('ops@biz.test')
    const task = expectOk(await owner.operationalModules.createTask({ organizationId: biz.orgId, payload: { title: 'Solo lectura' } }))
    const viewer = await signedIn('viewer@biz.test')
    expectFail(await viewer.operationalModules.toggleTaskStatus({ organizationId: biz.orgId, taskId: task.id }), 'UPDATE_NOT_APPLIED')
  })

  test('tarea ajena al alcance no se modifica', async () => {
    const owner = await signedIn('ops@biz.test')
    const task = expectOk(await owner.operationalModules.createTask({ organizationId: biz.orgId, payload: { title: 'Ajena' } }))
    const specialist = await signedIn('specialist@biz.test')
    expectFail(await specialist.operationalModules.toggleTaskStatus({ organizationId: biz.orgId, taskId: task.id }), 'ENTITY_NOT_FOUND')
  })

  test('documento: sube el archivo, registra y genera URL', async () => {
    const engine = await signedIn('admin@biz.test')
    const doc = expectOk(await engine.operationalModules.createDocument({ organizationId: biz.orgId, payload: { title: 'Contrato', filename: 'contrato final.pdf', fileBlob: { size: 123, type: 'application/pdf' } } }))
    assert.equal(doc.storagePath, `${biz.orgId}/documents/${doc.code}/contrato_final.pdf`)
    assert.equal(Number(doc.sizeBytes), 123)
    const { url } = expectOk(await engine.operationalModules.getDocumentUrl({ organizationId: biz.orgId, documentId: doc.id }))
    assert.ok(url.endsWith('contrato_final.pdf'))
  })

  test('documento: si falla el registro no queda archivo huérfano', async () => {
    const engine = await signedIn('admin@biz.test')
    expectFail(
      await engine.operationalModules.createDocument({ organizationId: biz.orgId, payload: { code: 'ORF', title: 'x', filename: 'x.pdf', status: 'estado-invalido', fileBlob: { size: 1, type: 'application/pdf' } } }),
      'VALIDATION_ERROR'
    )
    const { rows } = await db.query(`select name from storage.objects where name like $1`, [`${biz.orgId}/documents/ORF/%`])
    assert.equal(rows.length, 0)
  })

  test('tenant suspendido no escribe', async () => {
    const engine = await signedIn('admin@susp.test')
    expectFail(await engine.operationalModules.createClient({ organizationId: suspended.orgId, payload: { displayName: 'X' } }), 'RBAC_PERMISSION_DENIED')
  })

  test('sin membresía en la organización se rechaza antes de consultar', async () => {
    const engine = await signedIn('admin@other.test')
    expectFail(await engine.operationalModules.createClient({ organizationId: biz.orgId, payload: { displayName: 'X' } }), 'TENANT_ISOLATION_VIOLATION')
  })
})

describe('solicitudes y aprobaciones', () => {
  test('crear solicitud resuelve nombres y conserva campos en español', async () => {
    const engine = await signedIn('ops@biz.test')
    const created = expectOk(await engine.workflow.createRequest({ organizationId: biz.orgId, payload: { asunto: 'Compra', cliente: 'ACME', departamento: 'OPS', prioridad: 'Alta' } }))
    assert.equal(created.asunto, 'Compra')
    assert.equal(created.cliente, 'ACME')
    assert.equal(created.departamento, 'OPS')
    assert.equal(created.prioridad, 'Alta')
    assert.equal(created.estado, 'process')
    assert.equal(created.responsable, 'ops@biz.test')
    const steps = expectOk(await engine.workflow.listApprovalSteps(biz.orgId, created.id))
    assert.equal(steps.length, 1)
  })

  test('transición explícita y ciclo automático', async () => {
    const id = await seedRequest(db, biz, { code: 'CYC', dept: 'OPS', assigned: 'ops', createdBy: 'ops', status: 'pending' })
    const engine = await signedIn('ops@biz.test')
    assert.equal(expectOk(await engine.workflow.transitionRequest({ organizationId: biz.orgId, requestId: id })).estado, 'process')
    assert.equal(expectOk(await engine.workflow.transitionRequest({ organizationId: biz.orgId, requestId: id, nextStatus: 'active' })).estado, 'active')
  })

  test('no se cierra con aprobaciones pendientes', async () => {
    const id = await seedRequest(db, biz, { code: 'PEN', dept: 'OPS', assigned: 'ops', createdBy: 'ops' })
    await seedApprovalStep(db, biz, id, { order: 1, dept: 'OPS' })
    const engine = await signedIn('ops@biz.test')
    expectFail(await engine.workflow.transitionRequest({ organizationId: biz.orgId, requestId: id, nextStatus: 'completed' }), 'PENDING_APPROVAL_STEPS')
  })

  test('aprobar persiste y devuelve la solicitud actualizada', async () => {
    const id = await seedRequest(db, biz, { code: 'APR', dept: 'OPS', assigned: 'ops', createdBy: 'ops' })
    await seedApprovalStep(db, biz, id, { order: 1, dept: 'OPS' })
    const engine = await signedIn('ops@biz.test')
    const { step, request } = expectOk(await engine.workflow.decideApprovalStep({ organizationId: biz.orgId, requestId: id }))
    assert.equal(step.status, 'approved')
    assert.equal(step.decidedByMemberId, biz.memberIds.ops)
    assert.equal(request.estado, 'active')
    assert.equal(request.nivelAprobacion, 'Validado')
  })

  test('el especialista solo lista lo asignado', async () => {
    await seedRequest(db, biz, { code: 'LST', dept: 'OPS', assigned: 'specialist', createdBy: 'ops' })
    const engine = await signedIn('specialist@biz.test')
    const list = expectOk(await engine.workflow.listRequests(biz.orgId))
    assert.ok(list.length > 0)
    assert.ok(list.every((r) => r.assignedMemberId === biz.memberIds.specialist))
  })
})

describe('automatizaciones', () => {
  test('Business crea entre áreas y cambia estado', async () => {
    const engine = await signedIn('admin@biz.test')
    const rule = expectOk(await engine.automations.createRule({ organizationId: biz.orgId, payload: { name: 'Regla', scopeType: 'cross_department_workflow' } }))
    assert.equal(rule.area, 'Flujo entre áreas (Business)')
    assert.equal(expectOk(await engine.automations.setRuleStatus({ organizationId: biz.orgId, ruleId: rule.id, status: 'pending' })).status, 'pending')
    assert.ok(expectOk(await engine.automations.listRules(biz.orgId)).some((r) => r.id === rule.id))
  })

  test('Starter no crea entre áreas', async () => {
    const engine = await signedIn('admin@starter.test')
    expectFail(await engine.automations.createRule({ organizationId: starter.orgId, payload: { name: 'R', scopeType: 'cross_department_workflow' } }), 'RBAC_PERMISSION_DENIED')
  })
})

describe('auditoría', () => {
  test('lista por organización para quien tiene permiso', async () => {
    const engine = await signedIn('admin@biz.test')
    const logs = expectOk(await engine.audit.listOrganizationLogs(biz.orgId))
    assert.ok(logs.length > 0)
    assert.ok('sanitizedChanges' in logs[0])
    assert.ok('actorRoleCode' in logs[0])
  })

  test('no admite módulos del servidor en eventos de cliente', async () => {
    const engine = await signedIn('admin@biz.test')
    expectFail(await engine.audit.recordClientEvent({ organizationId: biz.orgId, module: 'db.requests', entityType: 'r', entityId: '1', action: 'X', summary: 'x' }), 'VALIDATION_ERROR')
  })
})

describe('Platform Admin', () => {
  test('lista organizaciones con contadores y suscripción', async () => {
    const engine = await signedIn(superAdminEmail)
    const orgs = expectOk(await engine.platformAdmin.listOrganizations())
    const found = orgs.find((o) => o.id === other.orgId)
    assert.equal(found.subscription.planCode, 'business')
    assert.equal(found.branchesCount, 1)
    assert.equal(found.departmentsCount, 2)
    assert.equal(found.activeCollaboratorsCount, 1)

    const withRoles = orgs.find((o) => o.id === biz.orgId)
    assert.deepEqual(withRoles.admins.map((a) => a.id), [biz.memberIds.admin])
    assert.equal(withRoles.admins[0].roleCode, 'ORG_ADMIN')
  })

  test('aprovisiona con las plantillas reales y el administrador puede operar', async () => {
    const adminUserId = await createAuthUser(db, 'dueno@nuevo.test')
    const engine = await signedIn(superAdminEmail)
    const { organization, subscription } = expectOk(await engine.platformAdmin.provisionOrganization({ slug: 'nuevo', displayName: 'Nuevo', planCode: 'business', adminUserId }))
    assert.equal(subscription.planCode, 'business')

    const owner = await signedIn('dueno@nuevo.test')
    const client = expectOk(await owner.operationalModules.createClient({ organizationId: organization.id, payload: { displayName: 'Primero' } }))
    assert.equal(client.organizationId, organization.id)
  })

  test('actualiza suscripción, y la clave de capacidad se canoniza', async () => {
    const t = await seedTenant(db, { slug: 'canon', members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }] })
    const engine = await signedIn(superAdminEmail)
    expectOk(await engine.platformAdmin.updateSubscription({ organizationId: t.orgId, planCode: 'starter', maxCollaboratorsOverride: 3 }))
    expectOk(await engine.platformAdmin.setEntitlement({ organizationId: t.orgId, entitlementKey: 'feature.multiBranch', valueJson: true }))

    const resolved = expectOk(await engine.subscriptions.getEntitlements(t.orgId))
    assert.equal(resolved.contractedEdition, 'starter')
    assert.equal(resolved.realLimits.maxCollaborators, 3)
    assert.equal(resolved.realFeatures.multiBranch, true)
  })

  test('plan: guardar y listar', async () => {
    const engine = await signedIn(superAdminEmail)
    const plans = expectOk(await engine.platformAdmin.listPlans())
    const business = plans.find((p) => p.planCode === 'business')
    const saved = expectOk(await engine.platformAdmin.upsertPlan({ ...business, description: 'Actualizada' }))
    assert.equal(saved.description, 'Actualizada')
    assert.equal(saved.limits.maxCollaborators, 30)
  })

  test('usuarios y auditoría global', async () => {
    const engine = await signedIn(superAdminEmail)
    const users = expectOk(await engine.platformAdmin.listUsers())
    assert.ok(users.platformAdmins.length > 0)
    assert.ok(users.memberships.some((m) => m.organizationName === 'biz' && m.userEmail))
    assert.ok(expectOk(await engine.platformAdmin.listGlobalAudit()).length > 0)
  })

  test('un administrador de tenant no accede', async () => {
    const engine = await signedIn('admin@biz.test')
    expectFail(await engine.platformAdmin.listOrganizations(), 'PLATFORM_ADMIN_REQUIRED')
  })
})

describe('compatibilidad con el contrato de las vistas', () => {
  const local = createCoreFlowEngine({ mode: 'local-dev', persistToBrowser: false })
  const provider = local.dataProvider

  const keysOf = (object) => Object.keys(object).sort()
  const missing = (expected, actual) => keysOf(expected).filter((k) => !(k in actual))

  async function backendRecords() {
    const engine = await signedIn('admin@biz.test')
    const ops = engine.operationalModules
    const client = expectOk(await ops.createClient({ organizationId: biz.orgId, payload: { displayName: 'Contrato' } }))
    return {
      engine,
      request: expectOk(await engine.workflow.createRequest({ organizationId: biz.orgId, payload: { asunto: 'A', cliente: 'B' } })),
      client,
      opportunity: expectOk(await ops.createOpportunity({ organizationId: biz.orgId, payload: { clientId: client.id, title: 'T' } })),
      task: expectOk(await ops.createTask({ organizationId: biz.orgId, payload: { title: 'T' } })),
      document: expectOk(await ops.createDocument({ organizationId: biz.orgId, payload: { title: 'T' } })),
      rule: expectOk(await engine.automations.createRule({ organizationId: biz.orgId, payload: { name: 'N' } })),
    }
  }

  test('los registros traen todos los campos del proveedor local', async () => {
    const session = provider.authenticateByEmail({ email: provider.state.userProfiles.find((u) => provider.state.organizationMembers.some((m) => m.userId === u.id && m.organizationId === 'org-principal' && m.roleCode === 'ORG_ADMIN')).email })
    const orgId = session.activeOrganizationId
    const branchId = provider.getOrganizationContext(orgId).branches[0].id

    const localRecords = {
      request: provider.insertRequest({ organizationId: orgId, branchId, asunto: 'A', cliente: 'B', nivelAprobacion: 'x' }),
      client: provider.insertClient({ organizationId: orgId, displayName: 'C' }),
      opportunity: provider.insertOpportunity({ organizationId: orgId, title: 'T' }),
      task: provider.insertTask({ organizationId: orgId, title: 'T' }),
      document: provider.insertDocument({ organizationId: orgId, title: 'T' }),
      rule: provider.insertAutomationRule({ organizationId: orgId, name: 'N' }),
    }

    const remote = await backendRecords()
    for (const name of Object.keys(localRecords)) {
      assert.deepEqual(missing(localRecords[name], remote[name]), [], `faltan campos en ${name}`)
    }
  })

  test('la sesión y el contexto traen todos los campos del proveedor local', async () => {
    const session = provider.getCurrentSession()
    const localContext = local.organizationService.getActiveTenantContext({ organizationId: session.activeOrganizationId })

    const engine = await signedIn('admin@biz.test')
    assert.deepEqual(missing(session, engine.getSnapshot().session), [])
    const remote = expectOk(await engine.organizations.getTenantContext(biz.orgId))
    assert.deepEqual(missing(localContext, remote), [])
    assert.deepEqual(missing(localContext.entitlementsResolved, remote.entitlementsResolved), [])
    assert.deepEqual(missing(localContext.membership, remote.membership), [])
  })
})
