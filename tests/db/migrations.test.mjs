/**
 * NIVEL SIMULADA — Cadena completa de migraciones y regresión de la migración 003.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { asUser, createDatabase, listMigrations, seedTenant } from './harness.mjs'

const MIGRATION_003 = join(
  dirname(fileURLToPath(import.meta.url)),
  '..', '..', 'supabase', 'migrations', '003_audit_and_security_rls.sql'
)

test('001 a 012 existen, son consecutivas y se ejecutan en orden desde cero', async () => {
  const numbers = listMigrations().map((f) => Number.parseInt(f, 10))
  assert.deepEqual(numbers, Array.from({ length: 12 }, (_, i) => i + 1))

  const db = await createDatabase()
  try {
    const { rows } = await db.query(
      `select count(*)::int as n from pg_policies where policyname like 'cf: %'`
    )
    assert.ok(rows[0].n > 0)
  } finally {
    await db.close()
  }
})

test('regresión 003: el archivo usa la conversión a uuid[]', () => {
  const sql = readFileSync(MIGRATION_003, 'utf8')
  assert.match(sql, /any\(\(select app_user_active_org_ids\(\)\)::uuid\[\]\)/)
  assert.doesNotMatch(sql, /any\(\(select app_user_active_org_ids\(\)\)\)/)
})

test('regresión 003: la forma sin conversión es inválida en PostgreSQL', async () => {
  const db = await createDatabase({ upTo: 0 })
  try {
    await db.exec(`create function f() returns uuid[] language sql as $$ select '{}'::uuid[] $$`)
    await assert.rejects(
      db.query(`select gen_random_uuid() = any((select f()))`),
      /operator does not exist: uuid = uuid\[\]/
    )
    const { rows } = await db.query(`select gen_random_uuid() = any((select f())::uuid[]) as r`)
    assert.equal(rows[0].r, false)
  } finally {
    await db.close()
  }
})

test('regresión 003: la política corregida filtra perfiles por tenant', async () => {
  const db = await createDatabase({ upTo: 7 })
  try {
    const a = await seedTenant(db, {
      slug: 'a',
      members: [
        { key: 'one', role: 'ORG_ADMIN', dept: 'OPS' },
        { key: 'two', role: 'SPECIALIST', dept: 'OPS' },
      ],
    })
    const b = await seedTenant(db, {
      slug: 'b',
      members: [{ key: 'one', role: 'ORG_ADMIN', dept: 'OPS' }],
    })
    await asUser(db, a.users.one, async (tx) => {
      const peer = await tx.query(`select id from user_profiles where id = $1`, [a.users.two])
      const stranger = await tx.query(`select id from user_profiles where id = $1`, [b.users.one])
      assert.equal(peer.rows.length, 1)
      assert.equal(stranger.rows.length, 0)
    })
  } finally {
    await db.close()
  }
})
