/**
 * PUNTO DE ENTRADA DEL NÚCLEO ARQUITECTÓNICO DE COREFLOW (100% DESACOPLADO DE REACT)
 * CoreFlow — src/core/index.js
 */

import { createDataProvider } from './providers/createDataProvider.js'
import { EntitlementService } from './services/EntitlementService.js'
import { AuditService } from './services/AuditService.js'
import { AuthorizationService } from './services/AuthorizationService.js'
import { OrganizationService } from './services/OrganizationService.js'
import { WorkflowContractService } from './services/WorkflowContractService.js'
import { MetricsEngineService } from './services/MetricsEngineService.js'
import { PlatformAdminService } from './services/PlatformAdminService.js'
import { OperationalModulesService } from './services/OperationalModulesService.js'

export function createCoreFlowEngine({
  mode = 'local-dev',
  supabaseClient = null,
  persistToBrowser = true,
} = {}) {
  const dataProvider = createDataProvider({
    mode,
    supabaseClient,
    persistToBrowser,
  })

  const entitlementService = new EntitlementService()
  const auditService = new AuditService({ dataProvider })
  const authorizationService = new AuthorizationService({
    entitlementService,
    auditService,
  })
  const organizationService = new OrganizationService({
    dataProvider,
    entitlementService,
    authorizationService,
    auditService,
  })
  const workflowService = new WorkflowContractService({
    dataProvider,
    organizationService,
    authorizationService,
    auditService,
  })
  const operationalModulesService = new OperationalModulesService({
    dataProvider,
    organizationService,
    authorizationService,
    auditService,
  })
  const platformAdminService = new PlatformAdminService({
    dataProvider,
    auditService,
  })
  const metricsService = new MetricsEngineService()

  return {
    dataProvider,
    entitlementService,
    auditService,
    authorizationService,
    organizationService,
    workflowService,
    operationalModulesService,
    platformAdminService,
    metricsService,
  }
}

export * from './config/plansCatalog.js'
export * from './config/permissionsCatalog.js'
export * from './domain/auditSanitizer.js'
export * from './domain/integrityValidator.js'
export * from './domain/requestStateMachine.js'
