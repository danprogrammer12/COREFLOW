/**
 * NIVEL SIMULADA — Script de aprovisionamiento sobre migraciones reales.
 * La API de administración de Auth está simulada: no equivale a Supabase real.
 */

import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import { createAuthUser, createDatabase } from '../db/harness.mjs'
import { createSimulatedClient } from './simulatedSupabaseClient.mjs'
import { SYSTEM_ROLE_TEMPLATES } from '../../src/core/config/permissionsCatalog.js'
import {
  assertSafeTarget,
  findAuthUser,
  parseArgs,
  readConfig,
  runProvisioning,
} from '../../scripts/provision-coreflow-accounts.mjs'

const REF = 'abcdefghijklmnop'
const SECRET = 'clave-de-prueba-larga'

const STARTER_TEMPLATES = [
  SYSTEM_ROLE_TEMPLATES.ORG_ADMIN,
  { code: 'SUPERVISOR', name: 'Supervisor', defaultScope: 'ORG_WIDE', permissions: [] },
  { code: 'COLLABORATOR', name: 'Colaborador', defaultScope: 'ORG_WIDE', permissions: [] },
]
const roleTemplatesFor = (plan) =>
  plan === 'starter' ? STARTER_TEMPLATES : Object.values(SYSTEM_ROLE_TEMPLATES)

const env = (suffix) => ({
  VITE_SUPABASE_URL: `https://${REF}.supabase.co`,
  SUPABASE_SERVICE_ROLE_KEY: 'clave-servicio',
  COREFLOW_TARGET_ENV: 'development',
  COREFLOW_SUPABASE_PROJECT_REF: REF,
  PROVISION_PLATFORM_ADMIN_EMAIL: `pa-${suffix}@a.test`,
  PROVISION_PLATFORM_ADMIN_PASSWORD: SECRET,
  PROVISION_STARTER_ADMIN_EMAIL: `st-${suffix}@a.test`,
  PROVISION_STARTER_ADMIN_PASSWORD: SECRET,
  PROVISION_STARTER_ORG_SLUG: `st-${suffix}`,
  PROVISION_STARTER_ORG_NAME: `Starter ${suffix}`,
  PROVISION_BUSINESS_ADMIN_EMAIL: `bz-${suffix}@a.test`,
  PROVISION_BUSINESS_ADMIN_PASSWORD: SECRET,
  PROVISION_BUSINESS_ORG_SLUG: `bz-${suffix}`,
  PROVISION_BUSINESS_ORG_NAME: `Business ${suffix}`,
})

let db
let passwords
let admin

const count = async (sql, params) => (await db.query(sql, params)).rows[0].n
const totals = async () => ({
  users: await count(`select count(*)::int n from auth.users`),
  orgs: await count(`select count(*)::int n from organizations`),
  admins: await count(`select count(*)::int n from platform_admins`),
  members: await count(`select count(*)::int n from organization_members`),
})

before(async () => {
  db = await createDatabase()
  passwords = {}
  admin = createSimulatedClient(db, { passwords, serviceRole: true })
})

after(async () => {
  await db?.close()
})

describe('configuración y protección del destino', () => {
  test('informa las variables que faltan sin mostrar valores', () => {
    assert.throws(
      () => readConfig({ SUPABASE_SERVICE_ROLE_KEY: 'valor-secreto' }),
      (err) => err.code === 'MISSING_CONFIGURATION' && err.message.includes('VITE_SUPABASE_URL') && !err.message.includes('valor-secreto')
    )
  })

  test('la simulación no exige contraseñas; aplicar sí', () => {
    const noPasswords = { ...env('x') }
    delete noPasswords.PROVISION_PLATFORM_ADMIN_PASSWORD
    assert.ok(readConfig(noPasswords, { requirePasswords: false }))
    assert.throws(() => readConfig(noPasswords, { requirePasswords: true }), /PROVISION_PLATFORM_ADMIN_PASSWORD/)
  })

  test('rechaza un entorno que no sea development', () => {
    const config = { url: `https://${REF}.supabase.co`, targetEnv: 'production', projectRef: REF }
    assert.throws(() => assertSafeTarget(config, { apply: false }), /UNSAFE_TARGET/)
  })

  test('rechaza una URL de otro proyecto', () => {
    const config = { url: 'https://otroproyecto.supabase.co', targetEnv: 'development', projectRef: REF }
    assert.throws(() => assertSafeTarget(config, { apply: false }), /UNSAFE_TARGET/)
  })

  test('solo admite el endpoint HTTPS estándar del proyecto', () => {
    for (const url of [
      `http://${REF}.supabase.co`,
      `https://${REF}.supabase.co:8443`,
      `https://${REF}.supabase.co/otra-ruta`,
      `https://usuario:clave@${REF}.supabase.co`,
      `https://${REF}.supabase.co?x=1`,
    ]) {
      assert.throws(() => assertSafeTarget({ url, targetEnv: 'development', projectRef: REF }, { apply: false }), /UNSAFE_TARGET/, url)
    }
  })

  test('aplicar exige confirmar el project ref exacto', () => {
    const config = { url: `https://${REF}.supabase.co`, targetEnv: 'development', projectRef: REF }
    assert.throws(() => assertSafeTarget(config, { apply: true, confirmProjectRef: null }), /CONFIRMATION_REQUIRED/)
    assert.throws(() => assertSafeTarget(config, { apply: true, confirmProjectRef: 'otro' }), /CONFIRMATION_REQUIRED/)
    assert.doesNotThrow(() => assertSafeTarget(config, { apply: true, confirmProjectRef: REF }))
  })

  test('por defecto es simulación y rechaza argumentos desconocidos', () => {
    assert.equal(parseArgs([]).apply, false)
    assert.throws(() => parseArgs(['--aply']), /INVALID_ARGUMENTS/)
  })
})

describe('validación previa a escribir', () => {
  test('con las plantillas actuales, Starter se bloquea antes de escribir', async () => {
    const config = readConfig(env('block'))
    const before_ = await totals()
    await assert.rejects(runProvisioning({ admin, config, apply: true }), /STARTER_ROLES_INVALID/)
    assert.deepEqual(await totals(), before_)
  })

  test('las cuentas deben ser independientes', async () => {
    const values = env('dup')
    values.PROVISION_BUSINESS_ADMIN_EMAIL = values.PROVISION_PLATFORM_ADMIN_EMAIL
    await assert.rejects(
      runProvisioning({ admin, config: readConfig(values), apply: true, roleTemplatesFor }),
      /ACCOUNTS_NOT_INDEPENDENT/
    )
  })

  test('la simulación no escribe nada', async () => {
    const before_ = await totals()
    const report = await runProvisioning({ admin, config: readConfig(env('dry')), roleTemplatesFor })
    assert.equal(report.mode, 'dry-run')
    assert.ok(report.accounts.every((a) => a.action === 'create'))
    assert.deepEqual(await totals(), before_)
  })
})

describe('ejecución', () => {
  test('crea las tres identidades y las dos organizaciones', async () => {
    const report = await runProvisioning({ admin, config: readConfig(env('one')), apply: true, roleTemplatesFor })
    assert.equal(report.accounts.length, 3)
    assert.ok(report.accounts.every((a) => a.outcome === 'created'))

    const starter = report.organizations.find((o) => o.plan === 'starter')
    assert.equal(await count(`select count(*)::int n from roles where organization_id = $1`, [starter.organizationId]), 3)
    assert.equal(await count(`select count(*)::int n from organization_branches where organization_id = $1`, [starter.organizationId]), 1)
    assert.equal(await count(`select count(*)::int n from departments where organization_id = $1`, [starter.organizationId]), 1)
    assert.equal(await count(`select count(*)::int n from organization_members where organization_id = $1 and status = 'active'`, [starter.organizationId]), 1)
    assert.equal(await count(`select count(*)::int n from platform_admins where email = 'pa-one@a.test'`), 1)
  })

  test('es idempotente y no toca las contraseñas', async () => {
    const config = readConfig(env('two'))
    const first = await runProvisioning({ admin, config, apply: true, roleTemplatesFor })
    const before_ = await totals()
    passwords['st-two@a.test'] = 'valor-previo'

    const second = await runProvisioning({ admin, config, apply: true, roleTemplatesFor })
    assert.deepEqual(await totals(), before_)
    assert.deepEqual(second.organizations, first.organizations)
    assert.ok(second.accounts.every((a) => a.outcome === 'existing' && a.passwordChanged === false))
    assert.equal(passwords['st-two@a.test'], 'valor-previo')
  })

  test('--rotate-passwords sí cambia la contraseña y lo informa', async () => {
    const config = readConfig(env('three'))
    await runProvisioning({ admin, config, apply: true, roleTemplatesFor })
    passwords['st-three@a.test'] = 'valor-previo'

    const report = await runProvisioning({ admin, config, apply: true, rotatePasswords: true, roleTemplatesFor })
    assert.equal(passwords['st-three@a.test'], SECRET)
    assert.ok(report.accounts.every((a) => a.passwordChanged))
  })

  test('el informe nunca incluye contraseñas ni claves', async () => {
    const report = await runProvisioning({ admin, config: readConfig(env('four')), apply: true, roleTemplatesFor })
    const text = JSON.stringify(report)
    assert.ok(!text.includes(SECRET))
    assert.ok(!text.includes('clave-servicio'))
  })

  test('encuentra usuarios más allá de la primera página', async () => {
    for (let i = 0; i < 205; i += 1) await createAuthUser(db, `relleno-${i}@a.test`)
    const found = await findAuthUser(admin, 'relleno-204@a.test')
    assert.equal(found?.email, 'relleno-204@a.test')
  })

  test('un error de la base detiene el proceso, no informa éxito', async () => {
    const failing = createSimulatedClient(db, { passwords, serviceRole: true })
    const realRpc = failing.rpc
    failing.rpc = async (name, args) =>
      name === 'rpc_provision_organization'
        ? { data: null, error: { message: 'fallo simulado' } }
        : realRpc(name, args)
    await assert.rejects(
      runProvisioning({ admin: failing, config: readConfig(env('five')), apply: true, roleTemplatesFor }),
      /PROVISIONING_FAILED.*fallo simulado/
    )
  })

  test('la verificación final detecta una membresía inactiva', async () => {
    const config = readConfig(env('six'))
    const report = await runProvisioning({ admin, config, apply: true, roleTemplatesFor })
    const starter = report.organizations.find((o) => o.plan === 'starter')
    await db.query(`update organization_members set status = 'suspended' where organization_id = $1`, [starter.organizationId])
    await assert.rejects(runProvisioning({ admin, config, apply: true, roleTemplatesFor }), /VERIFICATION_FAILED/)
  })
})
