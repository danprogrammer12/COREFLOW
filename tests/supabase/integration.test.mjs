/**
 * NIVEL SUPABASE-REAL — Verificaciones contra el proyecto CoreFlow Development.
 *
 * NO se ejecuta por defecto. Requiere COREFLOW_SUPABASE_E2E=1, las variables de
 * .env.local y un proyecto de desarrollo con las migraciones aplicadas. Crea datos
 * identificados por una marca de ejecución y no los borra: la auditoría los retiene.
 *
 * Uso: COREFLOW_SUPABASE_E2E=1 npm run test:supabase
 */

import { describe, test, before } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'
import { createBackendEngine } from '../../src/core/backend/index.js'
import { SYSTEM_ROLE_TEMPLATES } from '../../src/core/config/permissionsCatalog.js'
import { assertSafeTarget } from '../../scripts/provision-coreflow-accounts.mjs'

if (existsSync('.env.local')) process.loadEnvFile('.env.local')

const ENABLED = process.env.COREFLOW_SUPABASE_E2E === '1'
const SKIP = ENABLED ? false : 'Requiere COREFLOW_SUPABASE_E2E=1 y un proyecto de desarrollo'

const URL_ = process.env.VITE_SUPABASE_URL
const ANON = process.env.VITE_SUPABASE_ANON_KEY
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'coreflow-documents'
const RUN = Date.now().toString(36)
const options = { auth: { autoRefreshToken: false, persistSession: false } }
const silent = { warn() {} }

const newClient = () => createClient(URL_, ANON, options)
const password = () => `${crypto.randomUUID()}Aa1!`

let service
const accounts = {}
let orgA
let orgB

async function createAccount(key) {
  const email = `e2e-${RUN}-${key}@coreflow.test`
  const pass = password()
  const { data, error } = await service.auth.admin.createUser({ email, password: pass, email_confirm: true })
  assert.ifError(error)
  accounts[key] = { id: data.user.id, email, pass }
  return accounts[key]
}

async function provision(key, adminKey) {
  const { data, error } = await service.rpc('rpc_provision_organization', {
    p: {
      slug: `e2e-${RUN}-${key}`,
      display_name: `E2E ${key}`,
      plan_code: 'business',
      role_templates: Object.values(SYSTEM_ROLE_TEMPLATES),
      admin_user_id: accounts[adminKey].id,
    },
  })
  assert.ifError(error)
  return data
}

async function signedClient(key) {
  const client = newClient()
  const { error } = await client.auth.signInWithPassword({ email: accounts[key].email, password: accounts[key].pass })
  assert.ifError(error)
  return client
}

async function setEntitlement(organizationId, key, value) {
  const { error } = await service
    .from('organization_entitlements')
    .upsert({ organization_id: organizationId, entitlement_key: key, value_json: value }, { onConflict: 'organization_id,entitlement_key' })
  assert.ifError(error)
}

const fulfilled = (results) => results.filter((r) => r.ok).length

describe('Supabase real', { skip: SKIP }, () => {
  before(async () => {
    assertSafeTarget(
      { url: URL_, targetEnv: process.env.COREFLOW_TARGET_ENV, projectRef: process.env.COREFLOW_SUPABASE_PROJECT_REF },
      { apply: false }
    )
    service = createClient(URL_, SERVICE, options)
    await createAccount('a')
    await createAccount('b')
    orgA = await provision('a', 'a')
    orgB = await provision('b', 'b')
    await setEntitlement(orgA.organization_id, 'max_storage_mb', 50)
  })

  describe('Auth', () => {
    test('credenciales inválidas', async () => {
      const { error } = await newClient().auth.signInWithPassword({ email: accounts.a.email, password: 'incorrecta' })
      assert.ok(error)
    })

    test('el perfil se crea por trigger en auth.users', async () => {
      const { data, error } = await service.from('user_profiles').select('*').eq('id', accounts.a.id).maybeSingle()
      assert.ifError(error)
      assert.equal(data.email, accounts.a.email)
    })

    test('inicio, sesión y cierre con la capa de servicios', async () => {
      const client = newClient()
      const engine = createBackendEngine({ client, logger: silent })
      const signed = await engine.authentication.signIn({ email: accounts.a.email, password: accounts.a.pass })
      assert.equal(signed.ok, true, signed.error)
      assert.equal(signed.data.activeOrganizationId, orgA.organization_id)

      const context = await engine.organizations.getTenantContext(orgA.organization_id)
      assert.equal(context.ok, true, context.error)

      assert.equal((await engine.authentication.signOut()).ok, true)
      const { data } = await client.auth.getSession()
      assert.equal(data.session, null)
    })
  })

  describe('PostgREST y permisos efectivos', () => {
    test('anon no obtiene datos de tenants', async () => {
      const { data, error } = await newClient().from('organizations').select('*')
      // Dos formas válidas de denegar: sin filas por RLS o sin permiso sobre la tabla
      if (error) assert.equal(error.code, '42501', error.message)
      else assert.deepEqual(data, [])
    })

    test('anon no invoca RPC', async () => {
      const { error } = await newClient().rpc('rpc_get_org_capabilities', { p_org: orgA.organization_id })
      assert.ok(error)
    })

    test('el esquema private no está expuesto', async () => {
      const client = await signedClient('a')
      const { error } = await client.schema('private').rpc('org_can_write', { p_org: orgA.organization_id })
      assert.ok(error)
    })

    test('las funciones antiguas no son invocables', async () => {
      const client = await signedClient('a')
      const { error } = await client.rpc('app_org_has_feature', { target_org_id: orgB.organization_id, feature_key: 'multi_branch' })
      assert.ok(error)
    })

    test('no se inserta auditoría directamente', async () => {
      const client = await signedClient('a')
      const { error } = await client.from('audit_logs').insert({
        organization_id: orgA.organization_id,
        actor_user_id: accounts.a.id,
        actor_role_code: 'X',
        module: 'm',
        entity_type: 'e',
        entity_id: '1',
        action: 'FORGED',
        summary: 'x',
      })
      assert.ok(error)
    })
  })

  describe('RLS y aislamiento', () => {
    test('un tenant no lee a otro', async () => {
      const client = await signedClient('a')
      const { data, error } = await client.from('organizations').select('*').eq('id', orgB.organization_id)
      assert.ifError(error)
      assert.deepEqual(data, [])
    })

    test('un tenant no escribe en otro', async () => {
      const client = await signedClient('a')
      const { error } = await client.from('clients').insert({
        organization_id: orgB.organization_id,
        branch_id: orgB.branch_id,
        code: `X-${RUN}`,
        legal_name: 'x',
        display_name: 'x',
      })
      assert.ok(error)
    })

    test('una solicitud no cambia de estado por escritura directa', async () => {
      const client = newClient()
      const engine = createBackendEngine({ client, logger: silent })
      await engine.authentication.signIn({ email: accounts.a.email, password: accounts.a.pass })
      const created = await engine.workflow.createRequest({ organizationId: orgA.organization_id, payload: { asunto: 'Directa', cliente: 'E2E' } })
      assert.equal(created.ok, true, created.error)

      const { data, error } = await client.from('requests').update({ status: 'completed' }).eq('id', created.data.id).select()
      assert.ifError(error)
      assert.deepEqual(data, [])

      const stored = await service.from('requests').select('status').eq('id', created.data.id).single()
      assert.ifError(stored.error)
      assert.equal(stored.data.status, 'process')
    })
  })

  describe('Storage', () => {
    const file = () => new Blob(['coreflow'], { type: 'text/plain' })

    test('carga y URL firmada en el tenant propio', async () => {
      const client = await signedClient('a')
      const path = `${orgA.organization_id}/documents/${RUN}/a.txt`
      const { error } = await client.storage.from(BUCKET).upload(path, file())
      assert.ifError(error)
      const signed = await client.storage.from(BUCKET).createSignedUrl(path, 60)
      assert.ifError(signed.error)
      assert.equal((await fetch(signed.data.signedUrl)).status, 200)
    })

    test('no se carga en el prefijo de otro tenant ni en una ruta inválida', async () => {
      const client = await signedClient('a')
      assert.ok((await client.storage.from(BUCKET).upload(`${orgB.organization_id}/documents/${RUN}/b.txt`, file())).error)
      assert.ok((await client.storage.from(BUCKET).upload(`no-es-uuid/${RUN}.txt`, file())).error)
    })

    test('otro tenant no obtiene URL firmada y el bucket no es público', async () => {
      const path = `${orgA.organization_id}/documents/${RUN}/privado.txt`
      const owner = await signedClient('a')
      assert.ifError((await owner.storage.from(BUCKET).upload(path, file())).error)

      const stranger = await signedClient('b')
      assert.ok((await stranger.storage.from(BUCKET).createSignedUrl(path, 60)).error)

      const { data } = owner.storage.from(BUCKET).getPublicUrl(path)
      const response = await fetch(data.publicUrl)
      assert.ok([400, 401, 403, 404].includes(response.status), `estado inesperado: ${response.status}`)
      assert.ok(!(await response.text()).includes('coreflow'), 'el contenido del archivo no debe entregarse')
    })
  })

  describe('Concurrencia con conexiones reales', () => {
    async function engineFor(key) {
      const engine = createBackendEngine({ client: newClient(), logger: silent })
      const signed = await engine.authentication.signIn({ email: accounts[key].email, password: accounts[key].pass })
      assert.equal(signed.ok, true, signed.error)
      return engine
    }

    test('invitaciones simultáneas no superan la cuota', async () => {
      await createAccount('qa')
      const org = await provision('quota', 'qa')
      await setEntitlement(org.organization_id, 'max_collaborators', 3)
      const invited = await Promise.all(Array.from({ length: 6 }, (_, i) => createAccount(`inv${i}`)))

      const engine = await engineFor('qa')
      const results = await Promise.all(
        invited.map((u) => engine.organizations.inviteMember({ organizationId: org.organization_id, email: u.email, roleCode: 'SPECIALIST' }))
      )
      assert.equal(fulfilled(results), 2)
      assert.ok(results.filter((r) => !r.ok).every((r) => r.code === 'COLLABORATOR_QUOTA_EXCEEDED'))

      const stored = await service
        .from('organization_members')
        .select('id')
        .eq('organization_id', org.organization_id)
        .in('status', ['active', 'invited'])
      assert.ifError(stored.error)
      assert.equal(stored.data.length, 3)
    })

    test('sedes simultáneas no superan la cuota', async () => {
      await createAccount('qb')
      const org = await provision('branches', 'qb')
      await setEntitlement(org.organization_id, 'max_branches', 2)

      const engine = await engineFor('qb')
      const results = await Promise.all(
        Array.from({ length: 5 }, (_, i) => engine.organizations.createBranch({ organizationId: org.organization_id, code: `B${i}`, name: `Sede ${i}` }))
      )
      assert.equal(fulfilled(results), 1)
      assert.ok(results.filter((r) => !r.ok).every((r) => r.code === 'BRANCH_QUOTA_EXCEEDED'))

      const stored = await service
        .from('organization_branches')
        .select('id')
        .eq('organization_id', org.organization_id)
        .eq('status', 'active')
      assert.ifError(stored.error)
      assert.equal(stored.data.length, 2)
    })

    test('una aprobación simultánea se decide una sola vez', async () => {
      const engine = await engineFor('a')
      const context = await engine.organizations.getTenantContext(orgA.organization_id)
      const created = await engine.workflow.createRequest({
        organizationId: orgA.organization_id,
        payload: { asunto: 'Carrera', cliente: 'E2E', departmentId: context.data.departments[0].id },
      })
      assert.equal(created.ok, true, created.error)
      const steps = await engine.workflow.listApprovalSteps(orgA.organization_id, created.data.id)

      const results = await Promise.all(
        Array.from({ length: 4 }, () => engine.workflow.decideApprovalStep({ organizationId: orgA.organization_id, requestId: created.data.id, stepId: steps.data[0].id }))
      )
      assert.equal(fulfilled(results), 1)
      assert.ok(results.filter((r) => !r.ok).every((r) => r.code === 'INVALID_STATE_TRANSITION'))

      const stored = await service.from('approval_steps').select('status, decided_at').eq('id', steps.data[0].id).single()
      assert.ifError(stored.error)
      assert.equal(stored.data.status, 'approved')
      assert.ok(stored.data.decided_at)
    })

    test('RIESGO ABIERTO: medir el exceso de cuota de almacenamiento', async () => {
      await createAccount('qs')
      const org = await provision('storage', 'qs')
      await setEntitlement(org.organization_id, 'max_storage_mb', 1)
      const client = await signedClient('qs')
      const blob = new Blob([new Uint8Array(900 * 1024)], { type: 'text/plain' })

      const results = await Promise.all(
        Array.from({ length: 5 }, (_, i) => client.storage.from(BUCKET).upload(`${org.organization_id}/documents/${RUN}/${i}.txt`, blob))
      )
      const stored = results.filter((r) => !r.error).length
      console.log(`[RIESGO] Cuota 1 MB: ${stored} cargas simultáneas de 900 KB aceptadas.`)
      assert.ok(stored >= 1)
    })

    test('máximo de automatizaciones activas', { todo: 'Pendiente de la migración 014' }, () => {})
    test('máximo de administradores', { todo: 'Pendiente de la migración 014' }, () => {})
    test('historial de versiones de documentos', { todo: 'Pendiente de la migración 015' }, () => {})
  })
})
