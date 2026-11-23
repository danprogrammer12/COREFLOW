// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * FÁBRICA Y VALIDADOR DE PROVEEDORES DE DATOS
 * CoreFlow — src/core/providers/createDataProvider.js
 *
 * Garantiza que tanto LocalRelationalProvider (desarrollo/demostración)
 * como SupabaseDataProvider (producción) cumplan el contrato IDataProvider.
 */

import { LocalRelationalProvider } from './LocalRelationalProvider.js'
import { SupabaseDataProvider } from './SupabaseDataProvider.js'

const REQUIRED_PROVIDER_METHODS = [
  'getCurrentSession',
  'authenticateByEmail',
  'signOut',
  'switchActiveOrganization',
  'getOrganizationContext',
  'listPlanCatalog',
  'upsertPlanCatalog',
  'listAllOrganizationsForPlatformAdmin',
  'createOrganizationByPlatformAdmin',
  'updateSubscriptionByPlatformAdmin',
  'upsertEntitlementByPlatformAdmin',
  'listAllUsersForPlatformAdmin',
  'listGlobalAuditLogsForPlatformAdmin',
  'listClients',
  'insertClient',
  'listOpportunities',
  'insertOpportunity',
  'listTasks',
  'insertTask',
  'updateTask',
  'listDocuments',
  'insertDocument',
  'listAutomationRules',
  'insertAutomationRule',
  'listRequests',
  'listApprovalSteps',
  'insertRequest',
  'updateRequest',
  'appendAuditLog',
  'listAuditLogs',
  'updateAuditLog',
  'deleteAuditLog',
]

export function assertDataProviderContract(provider) {
  if (!provider || typeof provider !== 'object') {
    throw new Error('PROVIDER_CONTRACT_ERROR: Proveedor de datos nulo o inválido.')
  }

  for (const methodName of REQUIRED_PROVIDER_METHODS) {
    if (typeof provider[methodName] !== 'function') {
      throw new Error(
        `PROVIDER_CONTRACT_ERROR: El proveedor "${provider.providerName || 'Unknown'}" no implementa el método obligatorio "${methodName}()".`
      )
    }
  }

  return provider
}

export function createDataProvider({ mode = 'local-dev', supabaseClient = null, persistToBrowser = true } = {}) {
  const provider =
    mode === 'supabase-prod'
      ? new SupabaseDataProvider({ supabaseClient })
      : new LocalRelationalProvider({ persistToBrowser })

  return assertDataProviderContract(provider)
}
