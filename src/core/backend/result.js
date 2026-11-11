/**
 * CONTRATO DE RESULTADOS Y ERRORES DE LA CAPA BACKEND
 * CoreFlow — src/core/backend/result.js
 *
 * Toda operación pública devuelve `{ ok: true, data }` o `{ ok: false, error, code }`,
 * la misma forma que usan hoy las acciones del contexto de React.
 */

export class BackendError extends Error {
  constructor(code, message, cause = null) {
    super(message)
    this.name = 'BackendError'
    this.code = code
    this.cause = cause
  }
}

const DATABASE_CODES = Object.freeze({
  42501: 'RBAC_PERMISSION_DENIED',
  23505: 'DUPLICATE_ENTITY',
  23503: 'INVALID_REFERENCE',
  23514: 'VALIDATION_ERROR',
  '22P02': 'VALIDATION_ERROR',
  PGRST116: 'ENTITY_NOT_FOUND',
})

function isNetworkFailure(err) {
  return (
    err?.name === 'AuthRetryableFetchError' ||
    err?.status === 0 ||
    err?.status >= 500 ||
    /failed to fetch|fetch failed|network\s?error|load failed/i.test(String(err?.message || ''))
  )
}

export function toBackendError(err) {
  if (err instanceof BackendError) return err

  const message = String(err?.message || err || 'Error desconocido')
  if (isNetworkFailure(err)) {
    return new BackendError('BACKEND_UNAVAILABLE', 'No fue posible conectar con el servidor.', err)
  }

  // Las funciones de PostgreSQL lanzan "CODIGO: descripción"
  const prefixed = message.match(/^([A-Z][A-Z0-9_]+):\s*([\s\S]*)$/)
  if (prefixed) return new BackendError(prefixed[1], prefixed[2], err)

  if (err?.code && DATABASE_CODES[err.code]) {
    return new BackendError(DATABASE_CODES[err.code], message, err)
  }
  return new BackendError('BACKEND_ERROR', message, err)
}

/** Lanza si la respuesta de Supabase trae error; si no, devuelve `data`. */
export function unwrap({ data, error }) {
  if (error) throw toBackendError(error)
  return data
}

export async function run(operation) {
  try {
    return { ok: true, data: await operation() }
  } catch (err) {
    const failure = toBackendError(err)
    return { ok: false, error: failure.message, code: failure.code }
  }
}

/** Expone los métodos públicos de un servicio envueltos en el contrato de resultados. */
export function exposeService(instance) {
  const api = {}
  for (const name of Object.getOwnPropertyNames(Object.getPrototypeOf(instance))) {
    if (name === 'constructor' || name.startsWith('_')) continue
    api[name] = (...args) => run(() => instance[name](...args))
  }
  return Object.freeze(api)
}
