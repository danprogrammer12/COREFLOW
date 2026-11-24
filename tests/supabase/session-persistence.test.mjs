// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * NIVEL SUPABASE-REAL — «Mantener sesión activa».
 * Con la casilla marcada la sesión va a localStorage; sin marcar, a sessionStorage.
 *
 * Uso: COREFLOW_SUPABASE_E2E=1 node --env-file=.env.local --test tests/supabase/session-persistence.test.mjs
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'

const SKIP = process.env.COREFLOW_SUPABASE_E2E === '1' ? false : 'Requiere COREFLOW_SUPABASE_E2E=1'
const KEY = 'coreflow_supabase_auth_token'

function memoryStorage() {
  const data = new Map()
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  }
}

test('la casilla decide dónde se guarda la sesión', { skip: SKIP }, async () => {
  globalThis.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage(), location: { href: 'http://localhost/' } }
  const { getSupabaseClient, setSessionPersistence } = await import('../../src/lib/supabaseClient.js')
  const client = getSupabaseClient()
  const credentials = {
    email: process.env.PROVISION_STARTER_ADMIN_EMAIL,
    password: process.env.PROVISION_STARTER_ADMIN_PASSWORD,
  }

  setSessionPersistence(false)
  assert.equal((await client.auth.signInWithPassword(credentials)).error, null)
  assert.ok(window.sessionStorage.getItem(KEY), 'sin la casilla: sessionStorage')
  assert.equal(window.localStorage.getItem(KEY), null)
  await client.auth.signOut()
  assert.equal(window.sessionStorage.getItem(KEY), null, 'cerrar sesión la borra')

  setSessionPersistence(true)
  assert.equal((await client.auth.signInWithPassword(credentials)).error, null)
  assert.ok(window.localStorage.getItem(KEY), 'con la casilla: localStorage')
  assert.equal(window.sessionStorage.getItem(KEY), null)
  await client.auth.signOut()
  assert.equal(window.localStorage.getItem(KEY), null)
})
