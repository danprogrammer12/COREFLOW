/**
 * ESTADO DE SESIÓN OBSERVABLE, SIN DEPENDENCIA DE REACT
 * CoreFlow — src/core/backend/SessionStore.js
 *
 * Expone `subscribe` y `getSnapshot`, compatibles con `useSyncExternalStore`.
 * Estados: idle · loading · ready · error.
 */

export const UNAUTHENTICATED_SESSION = Object.freeze({
  isAuthenticated: false,
  isPlatformAdmin: false,
  accessContext: 'UNAUTHENTICATED',
  user: null,
  platformAdminRecord: null,
  memberships: [],
  accessibleOrganizations: [],
  activeOrganizationId: null,
})

const ACTIVE_ORG_KEY = 'coreflow_active_organization'

export class SessionStore {
  constructor({ storage = null } = {}) {
    this.storage = storage
    this.listeners = new Set()
    this.snapshot = Object.freeze({
      status: 'idle',
      session: UNAUTHENTICATED_SESSION,
      error: null,
    })
  }

  subscribe = (listener) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  _set(patch) {
    this.snapshot = Object.freeze({ ...this.snapshot, ...patch })
    for (const listener of this.listeners) listener()
  }

  setLoading() {
    this._set({ status: 'loading', error: null })
  }

  setSession(session) {
    this._set({ status: 'ready', session, error: null })
  }

  setError(failure) {
    this._set({ status: 'error', error: { message: failure.message, code: failure.code } })
  }

  clear() {
    this.writeActiveOrganization(null)
    this._set({ status: 'ready', session: UNAUTHENTICATED_SESSION, error: null })
  }

  readActiveOrganization() {
    try {
      return this.storage?.getItem(ACTIVE_ORG_KEY) || null
    } catch {
      return null
    }
  }

  writeActiveOrganization(organizationId) {
    try {
      if (organizationId) this.storage?.setItem(ACTIVE_ORG_KEY, organizationId)
      else this.storage?.removeItem(ACTIVE_ORG_KEY)
    } catch {
      // El almacenamiento del navegador puede no estar disponible; la sesión sigue en memoria.
    }
  }
}
