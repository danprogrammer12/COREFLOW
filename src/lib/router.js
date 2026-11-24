/**
 * Router mínimo sobre History API, sin dependencias.
 * El estado es location.pathname; cambia con navigate() o con atrás/adelante (popstate).
 */
import { useSyncExternalStore } from 'react'
import { legacyHashToPath, normalizePath, parseRoute } from './routes.js'

const listeners = new Set()
let snapshot = typeof window === 'undefined' ? '/' : normalizePath(window.location.pathname)

const emit = () => {
  const next = normalizePath(window.location.pathname)
  if (next === snapshot) return
  snapshot = next
  listeners.forEach((l) => l())
}

const subscribe = (listener) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Tras cambiar de ruta: al ancla si hay #fragmento, si no al inicio. Reintenta porque las vistas son lazy. */
function scrollAfterNavigation(hash) {
  const id = hash ? decodeURIComponent(hash.slice(1)) : ''
  let tries = 0
  const apply = () => {
    const el = id ? document.getElementById(id) : null
    if (el) {
      el.scrollIntoView({ block: 'start' })
    } else if (!id || tries >= 20) {
      window.scrollTo(0, 0)
    } else {
      tries += 1
      requestAnimationFrame(apply)
    }
  }
  requestAnimationFrame(apply)
}

export function navigate(to, { replace = false } = {}) {
  const url = new URL(to, window.location.origin)
  if (url.origin !== window.location.origin) {
    window.location.assign(to)
    return
  }
  const path = normalizePath(url.pathname)
  const target = path + url.search + url.hash
  const current = window.location.pathname + window.location.search + window.location.hash
  if (target === current) return
  const pathChanged = path !== normalizePath(window.location.pathname)
  window.history[replace ? 'replaceState' : 'pushState'](null, '', target)
  emit()
  if (pathChanged || url.hash) scrollAfterNavigation(url.hash)
}

/** Pathname actual normalizado (lectura síncrona, para callbacks asíncronos). */
export const getPath = () => snapshot

/** Hook: ruta parseada ({ name, slug, path }); se actualiza con navigate y con atrás/adelante. */
export function useRoute() {
  const path = useSyncExternalStore(subscribe, () => snapshot, () => '/')
  return parseRoute(path)
}

/** Convierte los clics en <a href="/..."> internos en navegación sin recarga. */
function onDocumentClick(e) {
  if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
  const a = e.target instanceof Element ? e.target.closest('a[href]') : null
  if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
  const href = a.getAttribute('href')
  if (!href || !href.startsWith('/') || href.startsWith('//')) return
  e.preventDefault()
  navigate(href)
}

/** Instala popstate, la redirección de hash heredado y la intercepción de enlaces. Devuelve la limpieza. */
export function installRouter() {
  const redirectLegacyHash = () => {
    const legacy = legacyHashToPath(window.location.hash)
    if (legacy !== null) navigate(legacy + window.location.search, { replace: true })
  }
  const onPop = () => {
    emit()
    redirectLegacyHash()
  }
  redirectLegacyHash()
  window.addEventListener('popstate', onPop)
  window.addEventListener('hashchange', redirectLegacyHash)
  document.addEventListener('click', onDocumentClick)
  return () => {
    window.removeEventListener('popstate', onPop)
    window.removeEventListener('hashchange', redirectLegacyHash)
    document.removeEventListener('click', onDocumentClick)
  }
}

/** Mantiene title, description, canonical y robots acordes a la ruta (la landing estática ya los trae en index.html). */
export function applyRouteMeta(meta, canonicalUrl) {
  document.title = meta.title
  const upsert = (selector, create) => document.head.querySelector(selector) || document.head.appendChild(create())
  const tag = (name, attrs) => () => {
    const el = document.createElement(name)
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
    return el
  }
  upsert('meta[name="description"]', tag('meta', { name: 'description' })).setAttribute('content', meta.description)
  const robots = upsert('meta[name="robots"]', tag('meta', { name: 'robots' }))
  robots.setAttribute('content', meta.indexable ? 'index, follow' : 'noindex, follow')
  const canonical = document.head.querySelector('link[rel="canonical"]')
  if (meta.path === null) canonical?.remove()
  else upsert('link[rel="canonical"]', tag('link', { rel: 'canonical' })).setAttribute('href', canonicalUrl)
  const og = (prop, value) =>
    upsert(`meta[property="${prop}"]`, tag('meta', { property: prop })).setAttribute('content', value)
  og('og:title', meta.title)
  og('og:description', meta.description)
  if (meta.path !== null) og('og:url', canonicalUrl)
}
