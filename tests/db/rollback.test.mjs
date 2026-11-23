// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * NIVEL SIMULADA — Reversibilidad de las migraciones 008 a 017.
 * Revierte en orden inverso y comprueba que el esquema vuelve al estado de 007,
 * y que después se puede volver a aplicar.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyMigrations, applyRollback, createDatabase } from './harness.mjs'

const SNAPSHOT_QUERIES = {
  policies: `select schemaname, tablename, policyname, permissive, roles::text, cmd, qual, with_check
               from pg_policies where schemaname in ('public', 'storage') order by 1, 2, 3`,
  columns: `select table_name, column_name, data_type, is_nullable, column_default
              from information_schema.columns where table_schema = 'public' order by 1, 2`,
  constraints: `select conrelid::regclass::text as tbl, conname, pg_get_constraintdef(oid) as def
                  from pg_constraint where connamespace = 'public'::regnamespace order by 1, 2`,
  triggers: `select tgrelid::regclass::text as tbl, tgname from pg_trigger
              where not tgisinternal order by 1, 2`,
  functions: `select proname, pg_get_function_identity_arguments(oid) as args from pg_proc
               where pronamespace = 'public'::regnamespace
                 and proname not like 'uuid_%' order by 1, 2`,
}

async function snapshot(db) {
  const result = {}
  for (const [name, sql] of Object.entries(SNAPSHOT_QUERIES)) {
    result[name] = (await db.query(sql)).rows
  }
  return result
}

test('008 a 017 se revierten al esquema de 007 y se pueden reaplicar', async () => {
  const db = await createDatabase({ upTo: 7 })
  try {
    const baseline = await snapshot(db)

    await applyMigrations(db, { from: 7 })
    const migrated = await snapshot(db)
    assert.notDeepEqual(migrated.policies, baseline.policies)

    const triggerFunctions = await db.query(
      `select proname,
              has_function_privilege('anon', oid, 'EXECUTE') as anon,
              has_function_privilege('authenticated', oid, 'EXECUTE') as authenticated
         from pg_proc
        where pronamespace = 'public'::regnamespace
          and proname in ('prevent_audit_log_tampering', 'sync_organization_plan_from_subscription')`
    )
    assert.equal(triggerFunctions.rows.length, 2)
    for (const row of triggerFunctions.rows) {
      assert.equal(row.anon, false, row.proname)
      assert.equal(row.authenticated, false, row.proname)
    }

    for (const number of [17, 16, 15, 14, 13, 12, 11, 10, 9, 8]) {
      await applyRollback(db, number)
    }
    const reverted = await snapshot(db)
    for (const name of Object.keys(SNAPSHOT_QUERIES)) {
      assert.deepEqual(reverted[name], baseline[name], `difiere: ${name}`)
    }

    await applyMigrations(db, { from: 7 })
    assert.deepEqual(await snapshot(db), migrated)
  } finally {
    await db.close()
  }
})
