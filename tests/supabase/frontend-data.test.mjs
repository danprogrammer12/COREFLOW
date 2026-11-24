// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * NIVEL SUPABASE-REAL — Datos y acciones que consume la interfaz.
 * Inicia sesión con las cuentas aprovisionadas y usa las mismas funciones de carga
 * que SupabaseCoreFlowProvider. Crea datos con marca e2e-ui y no los borra.
 *
 * Uso: COREFLOW_SUPABASE_E2E=1 node --env-file=.env.local --test tests/supabase/frontend-data.test.mjs
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import { createBackendEngine } from '../../src/core/backend/index.js'
import { loadPlatformData, loadTenantData } from '../../src/adapters/react/supabaseData.js'

const SKIP = process.env.COREFLOW_SUPABASE_E2E === '1' ? false : 'Requiere COREFLOW_SUPABASE_E2E=1'
const mark = `e2e-ui-${Date.now()}`

async function signIn(email, password) {
  const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const engine = createBackendEngine({ client, logger: { warn() {}, error() {} } })
  const result = await engine.authentication.signIn({ email, password })
  assert.equal(result.ok, true, result.error)
  return { engine, session: result.data }
}

const checkTenantShape = (data) => {
  for (const key of ['requests', 'clients', 'opportunities', 'tasks', 'documents', 'automationRules', 'auditLogs', 'approvalQueue']) {
    assert.ok(Array.isArray(data[key]), key)
  }
  assert.ok(data.context.organization.displayName)
  assert.ok(data.context.activeMembership.roleCode)
  assert.ok(data.context.entitlementsResolved.collaboratorsStatus.max > 0)
  assert.equal(typeof data.unifiedMetrics.acumulados.clientesTotal, 'number')
  assert.equal(data.unifiedMetrics.periodo.series.labels.length, 7)
}

describe('Interfaz contra Supabase real', { skip: SKIP }, () => {
  test('Starter: carga y escribe, y la capacidad sin configurar se rechaza', async () => {
    const { engine, session } = await signIn(
      process.env.PROVISION_STARTER_ADMIN_EMAIL,
      process.env.PROVISION_STARTER_ADMIN_PASSWORD
    )
    const organizationId = session.activeOrganizationId
    let data = await loadTenantData(engine, organizationId, '7d')
    checkTenantShape(data)
    assert.equal(data.context.entitlementsResolved.contractedEdition, 'starter')
    assert.equal(data.context.entitlementsResolved.realLimits.maxStorageMb, null)

    const before = data.clients.length
    const created = await engine.operationalModules.createClient({
      organizationId,
      payload: { displayName: `Cliente ${mark}`, sector: 'Servicios' },
    })
    assert.equal(created.ok, true, created.error)

    const task = await engine.operationalModules.createTask({
      organizationId,
      payload: { title: `Tarea ${mark}`, priority: 'Alta' },
    })
    assert.equal(task.ok, true, task.error)
    const toggled = await engine.operationalModules.toggleTaskStatus({ organizationId, taskId: task.data.id })
    assert.equal(toggled.ok, true, toggled.error)
    assert.equal(toggled.data.status, 'completed')

    const request = await engine.workflow.createRequest({
      organizationId,
      payload: { asunto: `Solicitud ${mark}`, cliente: `Cliente ${mark}`, prioridad: 'Alta' },
    })
    assert.equal(request.ok, true, request.error)
    const moved = await engine.workflow.transitionRequest({ organizationId, requestId: request.data.id })
    assert.equal(moved.ok, true, moved.error)

    data = await loadTenantData(engine, organizationId, '30d')
    assert.equal(data.clients.length, before + 1)
    assert.equal(data.unifiedMetrics.acumulados.clientesTotal, data.clients.length)

    const file = new Blob(['x'], { type: 'text/plain' })
    const document = await engine.operationalModules.createDocument({
      organizationId,
      payload: { title: `Doc ${mark}`, category: 'Operativo', file, filename: 'a.txt' },
    })
    assert.equal(document.ok, false)
    assert.equal(document.code, 'STORAGE_QUOTA_NOT_CONFIGURED')
  })

  test('Business: carga, crea un documento y lo abre con URL firmada', async () => {
    const { engine, session } = await signIn(
      process.env.PROVISION_BUSINESS_ADMIN_EMAIL,
      process.env.PROVISION_BUSINESS_ADMIN_PASSWORD
    )
    const organizationId = session.activeOrganizationId
    const data = await loadTenantData(engine, organizationId, '7d')
    checkTenantShape(data)
    assert.equal(data.context.entitlementsResolved.contractedEdition, 'business')

    const file = new Blob(['contenido'], { type: 'text/plain' })
    const document = await engine.operationalModules.createDocument({
      organizationId,
      payload: { title: `Doc ${mark}`, category: 'Operativo', file, filename: 'a.txt' },
    })
    assert.equal(document.ok, true, document.error)
    const link = await engine.operationalModules.getDocumentUrl({ organizationId, documentId: document.data.id })
    assert.equal(link.ok, true, link.error)
    assert.match(link.data.url, /^https:/)
  })

  test('Platform Admin: carga organizaciones, planes activos, usuarios y auditoría', async () => {
    const { engine, session } = await signIn(
      process.env.PROVISION_PLATFORM_ADMIN_EMAIL,
      process.env.PROVISION_PLATFORM_ADMIN_PASSWORD
    )
    assert.equal(session.isPlatformAdmin, true)
    const { platformAdminData } = await loadPlatformData(engine)
    assert.ok(platformAdminData.organizations.length >= 2)
    assert.ok(platformAdminData.plans.every((p) => p.planCode !== 'start'))
    assert.ok(platformAdminData.users.memberships.length >= 2)
    assert.ok(platformAdminData.globalAuditLogs.length > 0)
  })

  test('credenciales incorrectas devuelven un error, no una sesión', async () => {
    const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const engine = createBackendEngine({ client, logger: { warn() {}, error() {} } })
    const result = await engine.authentication.signIn({
      email: process.env.PROVISION_STARTER_ADMIN_EMAIL,
      password: 'contraseña-incorrecta',
    })
    assert.equal(result.ok, false)
    assert.equal(result.code, 'AUTH_INVALID_CREDENTIALS')
  })
})
