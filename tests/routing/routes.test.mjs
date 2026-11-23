// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * NIVEL UNITARIO — Rutas públicas (src/lib/routes.js).
 * Lógica pura: parseo de rutas, redirección de hash heredado, metadatos SEO y sitemap.
 */

import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  LEGAL_PAGES,
  SITEMAP_PATHS,
  canonicalUrl,
  getRouteMeta,
  legacyHashToPath,
  normalizePath,
  parseRoute,
} from '../../src/lib/routes.js'
import { LEGAL_DOCUMENTS } from '../../src/legal/documents.js'

describe('Parseo de rutas', () => {
  test('rutas conocidas', () => {
    assert.equal(parseRoute('/').name, 'landing')
    assert.equal(parseRoute('/acceso').name, 'acceso')
    assert.equal(parseRoute('/demo').name, 'demo')
    assert.deepEqual(parseRoute('/legal/cookies'), { name: 'legal', slug: 'cookies', path: '/legal/cookies' })
  })

  test('/legal abre privacidad y la barra final se ignora', () => {
    assert.equal(parseRoute('/legal').slug, 'privacidad')
    assert.equal(parseRoute('/acceso/').name, 'acceso')
    assert.equal(parseRoute('//demo//').name, 'demo')
    assert.equal(normalizePath(''), '/')
  })

  test('rutas desconocidas son notfound', () => {
    for (const p of ['/nada', '/legal/inventado', '/legal/privacidad/extra', '/acceso/x']) {
      assert.equal(parseRoute(p).name, 'notfound', p)
    }
  })
})

describe('Hash heredado', () => {
  test('rutas con hash pasan a ruta normal', () => {
    assert.equal(legacyHashToPath('#/acceso'), '/acceso')
    assert.equal(legacyHashToPath('#/demo'), '/demo')
    assert.equal(legacyHashToPath('#/'), '/')
    assert.equal(legacyHashToPath('#/legal/privacidad'), '/legal/privacidad')
    assert.equal(legacyHashToPath('#/legal/derechos/'), '/legal/derechos')
  })

  test('anclas de sección y fragmentos de Supabase no se tocan', () => {
    for (const h of ['', '#', '#planes', '#funciones', '#access_token=abc&type=recovery', undefined]) {
      assert.equal(legacyHashToPath(h), null, String(h))
    }
  })
})

describe('Metadatos SEO', () => {
  test('landing y legal son indexables; acceso, demo y 404 llevan noindex', () => {
    assert.equal(getRouteMeta(parseRoute('/')).indexable, true)
    assert.equal(getRouteMeta(parseRoute('/legal/terminos')).indexable, true)
    assert.equal(getRouteMeta(parseRoute('/acceso')).indexable, false)
    assert.equal(getRouteMeta(parseRoute('/demo')).indexable, false)
    assert.equal(getRouteMeta(parseRoute('/x')).indexable, false)
  })

  test('cada ruta tiene título y descripción propios; el 404 no tiene canonical', () => {
    const metas = ['/', '/acceso', '/demo', '/legal/privacidad', '/legal/cookies'].map((p) => getRouteMeta(parseRoute(p)))
    assert.equal(new Set(metas.map((m) => m.title)).size, metas.length)
    for (const m of metas) assert.ok(m.description.length > 20)
    assert.equal(getRouteMeta(parseRoute('/x')).path, null)
  })

  test('canonical usa la URL de producción', () => {
    assert.equal(canonicalUrl('/'), 'https://coreflowwebcore.vercel.app/')
    assert.equal(canonicalUrl('/acceso'), 'https://coreflowwebcore.vercel.app/acceso')
  })
})

describe('Coherencia con los archivos del proyecto', () => {
  test('LEGAL_PAGES coincide con los documentos legales', () => {
    for (const d of LEGAL_DOCUMENTS) assert.equal(LEGAL_PAGES[d.slug], d.title, d.slug)
    assert.deepEqual(Object.keys(LEGAL_PAGES).sort(), [...LEGAL_DOCUMENTS.map((d) => d.slug), 'derechos'].sort())
  })

  test('sitemap.xml lista exactamente las rutas indexables', () => {
    const xml = readFileSync(new URL('../../public/sitemap.xml', import.meta.url), 'utf8')
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    assert.deepEqual(locs, SITEMAP_PATHS.map(canonicalUrl))
  })

  test('vercel.json mantiene los headers de caché y añade el fallback SPA', () => {
    const cfg = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'))
    const sources = cfg.headers.map((h) => h.source)
    assert.ok(sources.includes('/assets/(.*)') && sources.includes('/fonts/(.*)'))
    const re = new RegExp(`^${cfg.rewrites[0].source}$`)
    for (const p of ['/acceso', '/demo', '/legal/privacidad', '/inexistente', '/']) assert.ok(re.test(p), p)
    for (const p of ['/assets/index-abc.js', '/fonts/inter-latin.woff2', '/favicon.svg', '/robots.txt', '/brand/x.svg']) {
      assert.ok(!re.test(p.slice(0)), p)
    }
  })
})
