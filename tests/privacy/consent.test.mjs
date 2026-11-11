/**
 * NIVEL UNITARIO — Consentimiento de cookies (src/core/privacy/consent.js).
 * Cubre los escenarios de navegador sin depender de React ni de un navegador real.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  CONSENT_STORAGE_KEY,
  COOKIE_NOTICE_VERSION,
  createConsentManager,
  readConsent,
} from '../../src/core/privacy/consent.js'

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    keys: () => [...data.keys()],
  }
}

let counter = 0
const ids = () => `id-${++counter}`
const fixedNow = (iso) => () => new Date(iso)

describe('Consentimiento de cookies', () => {
  test('1. primera visita: no hay decisión y lo opcional está bloqueado', () => {
    const manager = createConsentManager({ storage: memoryStorage(), randomId: ids })
    assert.equal(manager.hasDecision(), false)
    assert.equal(manager.isAllowed('necessary'), true)
    for (const category of ['functional', 'analytics', 'marketing']) {
      assert.equal(manager.isAllowed(category), false, category)
    }
  })

  test('no se ejecuta nada opcional antes del consentimiento', () => {
    const manager = createConsentManager({ storage: memoryStorage(), randomId: ids })
    let analyticsRuns = 0
    let marketingRuns = 0
    manager.runWhenAllowed('analytics', () => analyticsRuns++)
    manager.runWhenAllowed('marketing', () => marketingRuns++)
    assert.equal(analyticsRuns + marketingRuns, 0)

    manager.save({ analytics: true })
    assert.equal(analyticsRuns, 1)
    assert.equal(marketingRuns, 0, 'marketing sigue bloqueado')
  })

  test('2. aceptar todas habilita todas las categorías', () => {
    const storage = memoryStorage()
    const manager = createConsentManager({ storage, randomId: ids })
    const record = manager.acceptAll()
    assert.deepEqual(record.accepted, ['necessary', 'functional', 'analytics', 'marketing'])
    assert.deepEqual(record.rejected, [])
    assert.equal(record.method, 'accept_all')
    assert.equal(record.noticeVersion, COOKIE_NOTICE_VERSION)
  })

  test('3. rechazar opcionales deja solo las necesarias', () => {
    const manager = createConsentManager({ storage: memoryStorage(), randomId: ids })
    const record = manager.rejectOptional()
    assert.deepEqual(record.accepted, ['necessary'])
    assert.deepEqual(record.rejected, ['functional', 'analytics', 'marketing'])
    assert.equal(manager.writePreference('coreflow_ui_theme', 'dark'), false)
  })

  test('4. preferencias personalizadas aceptan solo lo marcado', () => {
    const manager = createConsentManager({ storage: memoryStorage(), randomId: ids })
    const record = manager.save({ functional: true, marketing: false, desconocida: true })
    assert.deepEqual(record.accepted, ['necessary', 'functional'])
    assert.deepEqual(record.rejected, ['analytics', 'marketing'])
    assert.equal(manager.writePreference('coreflow_ui_theme', 'dark'), true)
    assert.equal(manager.readPreference('coreflow_ui_theme'), 'dark')
  })

  test('5. modificar o retirar el consentimiento borra lo que guardaba esa categoría', () => {
    const storage = memoryStorage()
    const manager = createConsentManager({ storage, randomId: ids, now: fixedNow('2026-11-11T10:00:00Z') })
    const first = manager.save({ functional: true })
    manager.writePreference('coreflow_ui_theme', 'dark')

    const later = createConsentManager({ storage, randomId: ids, now: fixedNow('2026-11-12T10:00:00Z') })
    const withdrawn = later.withdraw()
    assert.equal(storage.getItem('coreflow_ui_theme'), null)
    assert.equal(withdrawn.method, 'withdraw')
    assert.equal(withdrawn.visitorId, first.visitorId, 'mismo navegador')
    assert.equal(withdrawn.firstDecidedAt, first.firstDecidedAt)
    assert.notEqual(withdrawn.updatedAt, first.updatedAt)
    assert.notEqual(withdrawn.consentId, first.consentId, 'cada decisión tiene su identificador')
  })

  test('6. cerrar sesión no borra la decisión del navegador', () => {
    const storage = memoryStorage()
    createConsentManager({ storage, randomId: ids }).rejectOptional()
    // Cerrar sesión borra la sesión de Supabase, no la decisión de cookies.
    storage.removeItem('coreflow_supabase_auth_token')
    const again = createConsentManager({ storage, randomId: ids })
    assert.equal(again.hasDecision(), true)
  })

  test('7. otro navegador no hereda la decisión', () => {
    createConsentManager({ storage: memoryStorage(), randomId: ids }).acceptAll()
    const otherBrowser = createConsentManager({ storage: memoryStorage(), randomId: ids })
    assert.equal(otherBrowser.hasDecision(), false)
  })

  test('el registro local no contiene datos personales ni credenciales', () => {
    const storage = memoryStorage()
    createConsentManager({ storage, randomId: ids }).acceptAll()
    const stored = JSON.parse(storage.getItem(CONSENT_STORAGE_KEY))
    assert.deepEqual(Object.keys(stored).sort(), [
      'accepted', 'consentId', 'expiresAt', 'firstDecidedAt', 'method',
      'noticeVersion', 'policyVersion', 'rejected', 'updatedAt', 'visitorId',
    ])
    assert.doesNotMatch(JSON.stringify(stored), /@|token|password|email/i)
  })

  test('un aviso nuevo, un registro vencido o dañado vuelven a pedir la decisión', () => {
    const storage = memoryStorage()
    createConsentManager({ storage, randomId: ids, now: fixedNow('2026-01-01T00:00:00Z') }).acceptAll()
    assert.equal(readConsent(storage, new Date('2027-01-02T00:00:00Z')), null, 'vencido')

    const stored = JSON.parse(storage.getItem(CONSENT_STORAGE_KEY))
    storage.setItem(CONSENT_STORAGE_KEY, JSON.stringify({ ...stored, noticeVersion: 'anterior' }))
    assert.equal(readConsent(storage, new Date('2026-02-01T00:00:00Z')), null, 'otra versión')

    storage.setItem(CONSENT_STORAGE_KEY, '{no es json')
    assert.equal(readConsent(storage), null, 'dañado')
  })

  test('sin almacenamiento disponible la decisión vale para la sesión y no falla', () => {
    const broken = {
      getItem() { throw new Error('bloqueado') },
      setItem() { throw new Error('bloqueado') },
      removeItem() { throw new Error('bloqueado') },
    }
    const manager = createConsentManager({ storage: broken, randomId: ids })
    manager.acceptAll()
    assert.equal(manager.isAllowed('analytics'), true)
  })

  test('cada decisión se entrega para su registro', () => {
    const recorded = []
    const manager = createConsentManager({ storage: memoryStorage(), randomId: ids, onRecord: (r) => recorded.push(r) })
    manager.rejectOptional()
    manager.save({ functional: true })
    assert.deepEqual(recorded.map((r) => r.method), ['reject_optional', 'custom'])
  })
})
