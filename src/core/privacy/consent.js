// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * CONSENTIMIENTO DE COOKIES Y ALMACENAMIENTO LOCAL
 * CoreFlow — src/core/privacy/consent.js
 *
 * Sin dependencias de React. Reglas:
 * - Solo las categorías necesarias funcionan sin consentimiento.
 * - Las demás quedan desactivadas hasta una decisión expresa y se pueden retirar.
 * - El registro local no guarda datos personales: un identificador aleatorio del
 *   navegador, las categorías y las versiones de los textos aceptados.
 * - Un cambio de versión del aviso o de la política vuelve a pedir la decisión.
 */

export const COOKIE_NOTICE_VERSION = '2026-11-11-borrador'
export const PRIVACY_POLICY_VERSION = '2026-11-11-borrador'
export const CONSENT_STORAGE_KEY = 'coreflow_cookie_consent'
/** La decisión se vuelve a pedir pasado este plazo. */
export const CONSENT_MAX_AGE_DAYS = 365

export const COOKIE_CATEGORIES = Object.freeze([
  {
    id: 'necessary',
    required: true,
    name: 'Necesarias',
    description:
      'Permiten iniciar sesión, mantener la sesión segura, recordar la organización activa y guardar esta misma decisión. Sin ellas la plataforma no funciona, por eso no se pueden desactivar.',
  },
  {
    id: 'functional',
    required: false,
    name: 'Funcionales',
    description:
      'Recuerdan preferencias de interfaz, como el tema claro u oscuro. Si las rechazas, CoreFlow funciona igual y vuelve a los valores predeterminados en cada visita.',
  },
  {
    id: 'analytics',
    required: false,
    name: 'Analíticas',
    description:
      'Medirían el uso y el rendimiento para mejorar el servicio. Hoy CoreFlow no usa ninguna herramienta analítica.',
  },
  {
    id: 'marketing',
    required: false,
    name: 'Marketing',
    description:
      'Servirían para publicidad o seguimiento comercial. Hoy CoreFlow no usa ninguna herramienta publicitaria.',
  },
])

export const OPTIONAL_CATEGORY_IDS = Object.freeze(
  COOKIE_CATEGORIES.filter((c) => !c.required).map((c) => c.id)
)

/** Claves que cada categoría opcional escribe; se borran al retirar el consentimiento. */
export const CATEGORY_STORAGE_KEYS = Object.freeze({
  functional: ['coreflow_ui_theme'],
  analytics: [],
  marketing: [],
})

const DAY_MS = 86400000

function safeRead(storage) {
  try {
    return storage?.getItem(CONSENT_STORAGE_KEY) ?? null
  } catch {
    return null
  }
}

function defaultRandomId() {
  return globalThis.crypto?.randomUUID?.() || `cf-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}

/** Normaliza una elección: solo categorías opcionales conocidas y valores booleanos. */
export function normalizeChoices(choices = {}) {
  return Object.fromEntries(OPTIONAL_CATEGORY_IDS.map((id) => [id, choices[id] === true]))
}

export function createConsentRecord({ choices, previous = null, method, now = new Date(), randomId = defaultRandomId }) {
  const normalized = normalizeChoices(choices)
  const timestamp = now.toISOString()
  return {
    consentId: randomId(),
    visitorId: previous?.visitorId || randomId(),
    accepted: ['necessary', ...OPTIONAL_CATEGORY_IDS.filter((id) => normalized[id])],
    rejected: OPTIONAL_CATEGORY_IDS.filter((id) => !normalized[id]),
    method,
    policyVersion: PRIVACY_POLICY_VERSION,
    noticeVersion: COOKIE_NOTICE_VERSION,
    firstDecidedAt: previous?.firstDecidedAt || timestamp,
    updatedAt: timestamp,
    expiresAt: new Date(now.getTime() + CONSENT_MAX_AGE_DAYS * DAY_MS).toISOString(),
  }
}

/**
 * Lee la decisión guardada. Devuelve null si no existe, está dañada, venció o
 * corresponde a otra versión de los textos: en todos esos casos se vuelve a preguntar.
 */
export function readConsent(storage, now = new Date()) {
  const raw = safeRead(storage)
  if (!raw) return null
  try {
    const record = JSON.parse(raw)
    const valid =
      record &&
      Array.isArray(record.accepted) &&
      Array.isArray(record.rejected) &&
      record.noticeVersion === COOKIE_NOTICE_VERSION &&
      record.policyVersion === PRIVACY_POLICY_VERSION &&
      new Date(record.expiresAt).getTime() > now.getTime()
    return valid ? record : null
  } catch {
    return null
  }
}

export function isCategoryAllowed(record, category) {
  if (category === 'necessary') return true
  return Boolean(record?.accepted?.includes(category))
}

/** Gestor observable: compatible con useSyncExternalStore. */
export function createConsentManager({ storage = null, now = () => new Date(), randomId = defaultRandomId, onRecord = null } = {}) {
  let record = readConsent(storage, now())
  const listeners = new Set()
  const pending = []

  const emit = () => {
    for (const listener of listeners) listener()
  }

  const runPending = () => {
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      if (isCategoryAllowed(record, pending[i].category)) {
        const [task] = pending.splice(i, 1)
        task.run()
      }
    }
  }

  const removeKeysOf = (categories) => {
    for (const category of categories) {
      for (const key of CATEGORY_STORAGE_KEYS[category] || []) {
        try {
          storage?.removeItem(key)
        } catch {
          // Sin acceso al almacenamiento no hay nada que borrar.
        }
      }
    }
  }

  const decide = (choices, method) => {
    const previous = record
    record = createConsentRecord({ choices, previous, method, now: now(), randomId })
    try {
      storage?.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record))
    } catch {
      // La decisión sigue vigente en esta sesión aunque no se pueda guardar.
    }
    removeKeysOf(record.rejected)
    runPending()
    emit()
    onRecord?.(record)
    return record
  }

  return {
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    getSnapshot: () => record,
    hasDecision: () => record !== null,
    isAllowed: (category) => isCategoryAllowed(record, category),
    acceptAll: () => decide(Object.fromEntries(OPTIONAL_CATEGORY_IDS.map((id) => [id, true])), 'accept_all'),
    rejectOptional: () => decide({}, 'reject_optional'),
    save: (choices) => decide(choices, 'custom'),
    /** Retirar equivale a rechazar todo lo opcional y borrar lo que esas categorías guardaron. */
    withdraw: () => decide({}, 'withdraw'),
    /**
     * Ejecuta `run` solo cuando la categoría está permitida. Si aún no lo está, queda
     * en espera; nunca se ejecuta antes del consentimiento.
     */
    runWhenAllowed(category, run) {
      if (isCategoryAllowed(record, category)) {
        run()
        return () => {}
      }
      const task = { category, run }
      pending.push(task)
      return () => {
        const index = pending.indexOf(task)
        if (index >= 0) pending.splice(index, 1)
      }
    },
    /** Lectura y escritura de preferencias funcionales, bloqueadas sin consentimiento. */
    readPreference(key) {
      if (!isCategoryAllowed(record, 'functional')) return null
      try {
        return storage?.getItem(key) ?? null
      } catch {
        return null
      }
    },
    writePreference(key, value) {
      if (!isCategoryAllowed(record, 'functional')) return false
      try {
        storage?.setItem(key, value)
        return true
      } catch {
        return false
      }
    },
  }
}
