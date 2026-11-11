/**
 * MOTOR ASÍNCRONO CONTRA SUPABASE
 * CoreFlow — src/core/backend/index.js
 *
 * Convive con el motor local de src/core/index.js. Aún no está conectado a la
 * interfaz: CoreFlowContext.jsx se integrará en una entrega coordinada.
 * Nunca recurre al proveedor local: sin cliente válido, falla.
 */

import { BackendError, exposeService } from './result.js'
import { SessionStore } from './SessionStore.js'
import { AuthenticationService } from './AuthenticationService.js'
import { AuditService } from './AuditService.js'
import { SubscriptionService } from './SubscriptionService.js'
import { OrganizationService } from './OrganizationService.js'
import { AuthorizationService } from './AuthorizationService.js'
import { WorkflowService } from './WorkflowService.js'
import { OperationalModulesService } from './OperationalModulesService.js'
import { AutomationService } from './AutomationService.js'
import { PlatformAdminService } from './PlatformAdminService.js'
import { MetricsService } from './MetricsService.js'

export const DATA_MODES = Object.freeze({
  LOCAL: 'local-dev',
  SUPABASE: 'supabase-prod',
})

/**
 * Determina el modo de datos de forma explícita. Un valor desconocido, o Supabase
 * sin configuración, es un error: no se degrada al proveedor local.
 */
export function resolveDataMode({ requestedMode, isSupabaseConfigured }) {
  const mode = requestedMode || DATA_MODES.LOCAL
  if (!Object.values(DATA_MODES).includes(mode)) {
    throw new BackendError('INVALID_DATA_MODE', `Modo de datos no admitido: "${mode}".`)
  }
  if (mode === DATA_MODES.SUPABASE && !isSupabaseConfigured) {
    throw new BackendError(
      'SUPABASE_CLIENT_NOT_CONFIGURED',
      'El modo supabase-prod requiere VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.'
    )
  }
  return mode
}

export function createBackendEngine({ client, storage = null, logger = console } = {}) {
  if (!client) {
    throw new BackendError(
      'SUPABASE_CLIENT_NOT_CONFIGURED',
      'createBackendEngine requiere un cliente de Supabase configurado.'
    )
  }

  const store = new SessionStore({ storage })
  const audit = new AuditService({ client, logger })
  const subscriptions = new SubscriptionService({ client })
  const organizations = new OrganizationService({ client, store, subscriptions, audit })

  return {
    subscribe: store.subscribe,
    getSnapshot: store.getSnapshot,
    authentication: exposeService(new AuthenticationService({ client, store, audit })),
    organizations: exposeService(organizations),
    authorization: exposeService(new AuthorizationService({ client, store, subscriptions })),
    subscriptions: exposeService(subscriptions),
    workflow: exposeService(new WorkflowService({ client, organizations })),
    operationalModules: exposeService(new OperationalModulesService({ client, store, organizations, subscriptions })),
    metrics: exposeService(new MetricsService({ client })),
    automations: exposeService(new AutomationService({ client })),
    audit: exposeService(audit),
    platformAdmin: exposeService(new PlatformAdminService({ client, store })),
  }
}
