// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * NIVEL SIMULADA — Migración propuesta 018 (consentimiento y solicitudes de privacidad).
 * Se aplica sobre 001–017 en PostgreSQL embebido. No se ejecuta contra Supabase.
 */

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { applySqlFile, asUser, createDatabase, createPlatformAdmin, seedTenant } from './harness.mjs'

const PROPOSED = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'supabase', 'proposed')

const consent = (overrides = {}) => ({
  consent_id: crypto.randomUUID(),
  visitor_id: crypto.randomUUID(),
  accepted: ['necessary', 'functional'],
  rejected: ['analytics', 'marketing'],
  method: 'custom',
  policy_version: '2026-11-11-borrador',
  notice_version: '2026-11-11-borrador',
  decided_at: new Date().toISOString(),
  ...overrides,
})

const request = (overrides = {}) => ({
  request_type: 'consulta',
  full_name: 'Titular de Prueba',
  email: 'titular@example.com',
  detail: 'Quiero conocer mis datos.',
  ...overrides,
})

describe('Migración propuesta 018', () => {
  let db
  let a
  let b
  let auditor

  before(async () => {
    db = await createDatabase()
    await applySqlFile(db, join(PROPOSED, '018_privacy_consent_and_requests.sql'))
    a = await seedTenant(db, { slug: 'org-a', members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }] })
    b = await seedTenant(db, { slug: 'org-b', members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }] })
    auditor = await createPlatformAdmin(db, 'auditor@coreflow.test', 'PLATFORM_AUDITOR')
  })
  after(() => db?.close())

  const record = (userId, payload, role = 'authenticated') =>
    asUser(db, userId, (tx) => tx.query('select public.rpc_record_cookie_consent($1::jsonb) as id', [JSON.stringify(payload)]), { role })

  test('9. un visitante sin cuenta registra su decisión pero no puede leer ninguna', async () => {
    const payload = consent()
    await record(null, payload, 'anon')
    const row = (await db.query('select subject_type, user_id from privacy_consents where consent_id = $1', [payload.consent_id])).rows[0]
    assert.equal(row.subject_type, 'visitor')
    assert.equal(row.user_id, null)

    await assert.rejects(asUser(db, null, (tx) => tx.query('select * from privacy_consents'), { role: 'anon' }))
  })

  test('el usuario lo fija el servidor y cada uno ve solo lo suyo', async () => {
    await record(a.users.admin, consent())
    await record(b.users.admin, consent())
    const own = await asUser(db, a.users.admin, (tx) => tx.query('select user_id from privacy_consents'))
    assert.ok(own.rows.length >= 1)
    assert.ok(own.rows.every((r) => r.user_id === a.users.admin))
  })

  test('8. no se mezcla con otra organización: una organización ajena se descarta', async () => {
    const own = consent({ organization_id: a.orgId })
    const foreign = consent({ organization_id: b.orgId })
    await record(a.users.admin, own)
    await record(a.users.admin, foreign)
    const rows = (
      await db.query('select consent_id, organization_id from privacy_consents where consent_id = any($1)', [[own.consent_id, foreign.consent_id]])
    ).rows
    assert.equal(rows.find((r) => r.consent_id === own.consent_id).organization_id, a.orgId)
    assert.equal(rows.find((r) => r.consent_id === foreign.consent_id).organization_id, null)
  })

  test('el registro es inmutable y repetir el mismo identificador no lo duplica', async () => {
    const payload = consent()
    await record(a.users.admin, payload)
    await record(a.users.admin, payload)
    const count = (await db.query('select count(*)::int as n from privacy_consents where consent_id = $1', [payload.consent_id])).rows[0].n
    assert.equal(count, 1)
    await assert.rejects(db.query('update privacy_consents set method = $1 where consent_id = $2', ['accept_all', payload.consent_id]), /inmutable/)
    await assert.rejects(db.query('delete from privacy_consents where consent_id = $1', [payload.consent_id]), /inmutable/)
    await assert.rejects(asUser(db, a.users.admin, (tx) => tx.query('insert into privacy_consents (consent_id) values (gen_random_uuid())')))
  })

  test('no se puede registrar el rechazo de las necesarias ni categorías inventadas', async () => {
    await assert.rejects(record(a.users.admin, consent({ accepted: ['functional'], rejected: ['necessary'] })))
    await assert.rejects(record(a.users.admin, consent({ accepted: ['necessary', 'rastreo'] })))
  })

  test('una fecha futura enviada por el cliente se ajusta al momento del registro', async () => {
    const payload = consent({ decided_at: '2099-01-01T00:00:00Z' })
    await record(a.users.admin, payload)
    const row = (await db.query('select decided_at <= now() as ok from privacy_consents where consent_id = $1', [payload.consent_id])).rows[0]
    assert.equal(row.ok, true)
  })

  test('Platform Admin de auditoría puede leer los consentimientos', async () => {
    const rows = await asUser(db, auditor, (tx) => tx.query('select count(*)::int as n from privacy_consents'))
    assert.ok(rows.rows[0].n >= 3)
  })

  const submit = (userId, payload, role = 'authenticated') =>
    asUser(db, userId, (tx) => tx.query('select * from public.rpc_submit_privacy_request($1::jsonb)', [JSON.stringify(payload)]), { role })

  test('10. una solicitud de derechos queda registrada con su plazo legal', async () => {
    const consulta = (await submit(null, request(), 'anon')).rows[0]
    assert.equal(consulta.legal_term_days, 10)
    assert.equal(consulta.status, 'received')
    const reclamo = (await submit(a.users.admin, request({ request_type: 'reclamo', organization_id: a.orgId }))).rows[0]
    assert.equal(reclamo.legal_term_days, 15)
    assert.equal(reclamo.user_id, a.users.admin)
    assert.equal(reclamo.organization_id, a.orgId)
  })

  test('las solicitudes no se leen ni se cambian sin permiso', async () => {
    await assert.rejects(asUser(db, null, (tx) => tx.query('select * from privacy_requests'), { role: 'anon' }))
    const others = await asUser(db, b.users.admin, (tx) => tx.query('select * from privacy_requests'))
    assert.equal(others.rows.length, 0, 'otro usuario no ve solicitudes ajenas')
    const changed = await asUser(db, a.users.admin, (tx) => tx.query(`update privacy_requests set status = 'closed' returning id`))
    assert.equal(changed.rows.length, 0, 'el titular no cierra su propia solicitud')
    await assert.rejects(asUser(db, a.users.admin, (tx) => tx.query('delete from privacy_requests')))
  })

  test('datos inválidos se rechazan', async () => {
    await assert.rejects(submit(null, request({ email: 'sin-arroba' }), 'anon'))
    await assert.rejects(submit(null, request({ request_type: 'otro' }), 'anon'))
    await assert.rejects(submit(null, request({ detail: 'x' }), 'anon'))
  })

  test('la reversión deja el esquema sin rastro de 018', async () => {
    await applySqlFile(db, join(PROPOSED, '018_privacy_consent_and_requests.down.sql'))
    const left = (
      await db.query(`select count(*)::int as n from pg_tables where schemaname = 'public' and tablename like 'privacy_%'`)
    ).rows[0].n
    assert.equal(left, 0)
  })
})
