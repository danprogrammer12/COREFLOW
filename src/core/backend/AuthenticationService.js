/**
 * AUTENTICACIÓN Y SESIONES CONTRA SUPABASE AUTH
 * CoreFlow — src/core/backend/AuthenticationService.js
 */

import { BackendError, toBackendError, unwrap } from './result.js'
import { UNAUTHENTICATED_SESSION } from './SessionStore.js'
import { mapMember, camelizeRow } from './mappers.js'

export class AuthenticationService {
  constructor({ client, store, audit }) {
    this.client = client
    this.store = store
    this.audit = audit
  }

  /** Restaura la sesión al arrancar. Un fallo de red es un error visible, nunca "sin sesión". */
  async initialize() {
    this.store.setLoading()
    try {
      const { data, error } = await this.client.auth.getSession()
      if (error) throw toBackendError(error)
      if (!data?.session) {
        this.store.setSession(UNAUTHENTICATED_SESSION)
        return UNAUTHENTICATED_SESSION
      }
      return await this._loadAndStore()
    } catch (err) {
      const failure = toBackendError(err)
      this.store.setError(failure)
      throw failure
    }
  }

  async signIn({ email, password }) {
    this.store.setLoading()
    try {
      const { data, error } = await this.client.auth.signInWithPassword({
        email: String(email || '').trim(),
        password: String(password || ''),
      })
      if (error || !data?.user) {
        const failure = toBackendError(error)
        throw failure.code === 'BACKEND_UNAVAILABLE'
          ? failure
          : new BackendError('AUTH_INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.', error)
      }

      const session = await this._loadAndStore()
      if (!session.isPlatformAdmin && session.memberships.length === 0) {
        // Si el cierre falla, la sesión sigue viva en Auth: se informa ese fallo real.
        const { error: signOutError } = await this.client.auth.signOut()
        if (signOutError) throw toBackendError(signOutError)
        this.store.clear()
        throw new BackendError(
          'AUTH_NO_ACTIVE_MEMBERSHIP',
          'La cuenta no tiene membresías activas ni rol de plataforma.'
        )
      }

      await this.audit._recordBestEffort({
        organizationId: session.activeOrganizationId,
        module: 'core.auth',
        entityType: 'session',
        entityId: session.user.id,
        action: 'SESSION_AUTHENTICATED',
        summary: `Inicio de sesión en contexto ${session.accessContext}.`,
        changes: { accessContext: session.accessContext },
      })
      return session
    } catch (err) {
      const failure = toBackendError(err)
      this.store.setError(failure)
      throw failure
    }
  }

  async signOut() {
    const { error } = await this.client.auth.signOut()
    if (error) throw toBackendError(error)
    this.store.clear()
    return { signedOut: true }
  }

  getSession() {
    return this.store.getSnapshot().session
  }

  /** La respuesta no revela si el correo existe. */
  async requestPasswordReset({ email, redirectTo }) {
    const { error } = await this.client.auth.resetPasswordForEmail(String(email || '').trim(), {
      redirectTo,
    })
    if (error && toBackendError(error).code === 'BACKEND_UNAVAILABLE') {
      throw toBackendError(error)
    }
    return { requested: true }
  }

  /** Mantiene el estado alineado con Auth. Devuelve la función para cancelar. */
  startSessionListener() {
    const { data } = this.client.auth.onAuthStateChange((event) => {
      // No se llama a Supabase dentro del callback: su bloqueo interno puede interbloquearse.
      setTimeout(() => {
        if (event === 'SIGNED_OUT') {
          this.store.clear()
        } else if (['SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
          this._loadAndStore().catch((err) => this.store.setError(toBackendError(err)))
        }
      }, 0)
    })
    return () => data?.subscription?.unsubscribe()
  }

  async _loadAndStore() {
    const session = await this._buildSession()
    this.store.setSession(session)
    return session
  }

  async _buildSession() {
    const { data: authData, error: authError } = await this.client.auth.getUser()
    if (authError) {
      const failure = toBackendError(authError)
      if (failure.code === 'BACKEND_UNAVAILABLE') throw failure
      return UNAUTHENTICATED_SESSION
    }
    if (!authData?.user) return UNAUTHENTICATED_SESSION

    const userId = authData.user.id
    const [adminRow, profile, memberRows] = await Promise.all([
      this.client
        .from('platform_admins')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .maybeSingle()
        .then(unwrap),
      this.client.from('user_profiles').select('*').eq('id', userId).maybeSingle().then(unwrap),
      this.client
        .from('organization_members')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .is('deleted_at', null)
        .then(unwrap),
    ])

    const members = memberRows || []
    const [organizations, roles] = members.length
      ? await Promise.all([
          this.client
            .from('organizations')
            .select('*')
            .in('id', members.map((m) => m.organization_id))
            .then(unwrap),
          this.client
            .from('roles')
            .select('*')
            .in('id', members.map((m) => m.role_id))
            .then(unwrap),
        ])
      : [[], []]

    const accessibleOrganizations = organizations.map(camelizeRow)
    const accessibleIds = new Set(accessibleOrganizations.map((o) => o.id))
    const memberships = members
      .filter((m) => accessibleIds.has(m.organization_id))
      .map((m) => mapMember(m, { profile, role: roles.find((r) => r.id === m.role_id) }))

    const isPlatformAdmin = Boolean(adminRow)
    const previous = this.store.getSnapshot().session.activeOrganizationId
    const persisted = this.store.readActiveOrganization()
    const activeOrganizationId = isPlatformAdmin
      ? null
      : [previous, persisted, accessibleOrganizations[0]?.id].find(
          (id) => id && accessibleIds.has(id)
        ) || null

    this.store.writeActiveOrganization(activeOrganizationId)

    return {
      isAuthenticated: true,
      isPlatformAdmin,
      accessContext: isPlatformAdmin ? 'PLATFORM_ADMIN' : 'TENANT_WORKSPACE',
      user: {
        id: userId,
        email: authData.user.email,
        fullName: profile?.full_name || authData.user.email,
      },
      platformAdminRecord: camelizeRow(adminRow) || null,
      memberships,
      accessibleOrganizations,
      activeOrganizationId,
    }
  }
}
