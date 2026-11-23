/**
 * Rutas públicas de CoreFlow: lógica pura (sin DOM ni React) para poder probarla en Node.
 * El hook y la navegación viven en router.js.
 */

export const SITE_URL = 'https://coreflowwebcore.vercel.app'

/** Debe coincidir con LEGAL_DOCUMENTS (lo verifica tests/routing/routes.test.mjs); se duplica para no cargar los textos legales en el bundle principal. */
export const LEGAL_PAGES = {
  privacidad: 'Política de privacidad',
  cookies: 'Política de cookies',
  terminos: 'Términos y condiciones de uso',
  'tratamiento-datos': 'Política de tratamiento de datos personales',
  'aviso-legal': 'Aviso legal',
  derechos: 'Tus derechos',
}
export const DEFAULT_LEGAL_SLUG = 'privacidad'

const LANDING_TITLE = 'CoreFlow — Organiza. Conecta. Evoluciona.'
const LANDING_DESCRIPTION =
  'CoreFlow centraliza clientes, oportunidades, solicitudes, tareas y documentos de tu organización en una sola plataforma modular, por Webcore.'

/** Quita barras repetidas y la final; '' y '/' son la raíz. */
export function normalizePath(pathname = '/') {
  const clean = String(pathname || '/').replace(/\/{2,}/g, '/').replace(/\/+$/, '')
  return clean === '' ? '/' : clean
}

/** Convierte un pathname en { name, slug, path }. */
export function parseRoute(pathname) {
  const path = normalizePath(pathname)
  if (path === '/') return { name: 'landing', slug: null, path }
  if (path === '/acceso') return { name: 'acceso', slug: null, path }
  if (path === '/demo') return { name: 'demo', slug: null, path }
  if (path === '/legal') return { name: 'legal', slug: DEFAULT_LEGAL_SLUG, path }
  const match = /^\/legal\/([^/]+)$/.exec(path)
  if (match && Object.prototype.hasOwnProperty.call(LEGAL_PAGES, match[1])) {
    return { name: 'legal', slug: match[1], path }
  }
  return { name: 'notfound', slug: null, path }
}

/**
 * Enlaces antiguos con hash de ruta (#/acceso, #/legal/privacidad) → ruta normal.
 * Los anclas de sección (#planes) y los fragmentos de Supabase (#access_token=…) devuelven null.
 */
export function legacyHashToPath(hash) {
  if (typeof hash !== 'string' || !hash.startsWith('#/')) return null
  const [rawPath] = hash.slice(1).split('?')
  return normalizePath(rawPath)
}

/** Metadatos SEO por ruta. path null = sin canonical (404). */
export function getRouteMeta(route) {
  switch (route.name) {
    case 'landing':
      return { title: LANDING_TITLE, description: LANDING_DESCRIPTION, path: '/', indexable: true }
    case 'acceso':
      return {
        title: 'Acceso · CoreFlow',
        description: 'Inicia sesión en tu espacio de trabajo de CoreFlow.',
        path: '/acceso',
        indexable: false,
      }
    case 'demo':
      return {
        title: 'Explora la demo · CoreFlow',
        description: 'Recorre CoreFlow Starter y Business con datos de ejemplo, sin registro.',
        path: '/demo',
        indexable: false,
      }
    case 'legal':
      return {
        title: `${LEGAL_PAGES[route.slug]} · CoreFlow`,
        description: `${LEGAL_PAGES[route.slug]} de CoreFlow, la plataforma de gestión organizacional de Webcore.`,
        path: `/legal/${route.slug}`,
        indexable: true,
      }
    default:
      return {
        title: 'Página no encontrada · CoreFlow',
        description: 'La página que buscas no existe en CoreFlow.',
        path: null,
        indexable: false,
      }
  }
}

export const canonicalUrl = (path) => (path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`)

/** Rutas del sitemap.xml: solo las indexables. */
export const SITEMAP_PATHS = ['/', ...Object.keys(LEGAL_PAGES).map((slug) => `/legal/${slug}`)]
