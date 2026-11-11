/**
 * SERVICIO DE CAPACIDADES, PLANES Y CUOTAS ADMINISTRABLES DESDE BASE DE DATOS
 * CoreFlow — src/core/services/EntitlementService.js
 *
 * Resuelve los planes desde PostgreSQL (`plan_catalog` + `organization_subscriptions`
 * + `organization_entitlements`).
 * Garantiza que las autorizaciones y cuotas provengan siempre del plan suscrito
 * real de la organización en la base de datos.
 */

import { resolvePlanDefinition } from '../config/plansCatalog.js'

export class EntitlementService {
  resolveEntitlements({
    organization,
    subscription = null,
    planCatalog = null,
    entitlementOverrides = [],
    simulationOverlay = null,
  }) {
    const rawPlanCode =
      subscription?.planCode ||
      subscription?.plan_code ||
      organization?.contractedPlanCode ||
      organization?.contracted_plan_code ||
      'starter'

    const contractedPlan = resolvePlanDefinition(rawPlanCode, planCatalog)
    const contractedPlanCode = contractedPlan.planCode

    // Verificar si la suscripción está activa o suspendida/vencida
    const subscriptionStatus =
      subscription?.status || organization?.status || 'active'
    const isSubscriptionActive = ['active', 'trialing', 'trial'].includes(
      subscriptionStatus
    )

    // Aplicar overrides administrables de `organization_entitlements`
    const effectiveLimits = { ...contractedPlan.limits }
    const effectiveFeatures = { ...contractedPlan.features }

    for (const override of entitlementOverrides) {
      const key = override.entitlementKey || override.entitlement_key || ''
      const val = override.valueJson !== undefined ? override.valueJson : override.value_json

      if (key === 'max_collaborators' && typeof val === 'number') {
        effectiveLimits.maxCollaborators = val
      } else if (key === 'max_branches' && typeof val === 'number') {
        effectiveLimits.maxBranches = val
      } else if (key === 'max_storage_mb' && typeof val === 'number') {
        effectiveLimits.maxStorageMb = val
      } else if (key.startsWith('feature.') && typeof val === 'boolean') {
        const featureName = key.replace('feature.', '')
        effectiveFeatures[featureName] = val
      }
    }

    // Si la suscripción está suspendida o cancelada, desactivar capacidades avanzadas de mutación
    if (!isSubscriptionActive) {
      effectiveFeatures.multiBranch = false
      effectiveFeatures.departmentsAndTeams = false
      effectiveFeatures.multilevelApprovals = false
      effectiveFeatures.crossAreaAutomations = false
    }

    const isSimulationActive = Boolean(
      simulationOverlay && simulationOverlay !== rawPlanCode && simulationOverlay !== contractedPlanCode
    )
    const presentationPlan = isSimulationActive
      ? resolvePlanDefinition(simulationOverlay, planCatalog)
      : contractedPlan

    const currentCollaborators =
      organization?.activeCollaboratorsCount ??
      organization?.active_collaborators_count ??
      1
    const quotaUsageRatio = Math.min(
      100,
      Math.round((currentCollaborators / effectiveLimits.maxCollaborators) * 100)
    )

    return {
      contractedEdition: rawPlanCode,
      normalizedEdition: contractedPlanCode === 'start' ? 'starter' : contractedPlanCode,
      contractedPlanName: contractedPlan.displayName,
      subscriptionStatus,
      isSubscriptionActive,
      subscriptionValidUntil: subscription?.validUntil || subscription?.valid_until || null,
      realLimits: Object.freeze(effectiveLimits),
      realFeatures: Object.freeze(effectiveFeatures),
      collaboratorsStatus: {
        current: currentCollaborators,
        max: effectiveLimits.maxCollaborators,
        remaining: Math.max(0, effectiveLimits.maxCollaborators - currentCollaborators),
        usagePercent: quotaUsageRatio,
        rangeLabel: contractedPlan.collaboratorsRangeLabel,
      },
      simulationOverlay: isSimulationActive ? simulationOverlay : null,
      isSimulationActive,
      presentationEdition: isSimulationActive ? simulationOverlay : rawPlanCode,
      presentationPlanName: presentationPlan.displayName,
      presentationFeatures: Object.freeze({ ...presentationPlan.features }),
      defaultApprovalSummary: contractedPlan.defaultApprovalSummary,
    }
  }

  assertContractedFeatureEnabled({
    organization,
    subscription = null,
    planCatalog = null,
    entitlementOverrides = [],
    featureKey,
    simulationOverlay = null,
  }) {
    const resolved = this.resolveEntitlements({
      organization,
      subscription,
      planCatalog,
      entitlementOverrides,
      simulationOverlay,
    })

    if (!resolved.isSubscriptionActive) {
      const err = new Error(
        `SUBSCRIPTION_INACTIVE: La suscripción de la organización se encuentra en estado "${resolved.subscriptionStatus}".`
      )
      err.code = 'SUBSCRIPTION_INACTIVE'
      throw err
    }

    if (!resolved.realFeatures[featureKey]) {
      const err = new Error(
        `ENTITLEMENT_RESTRICTION: La capacidad "${featureKey}" no está habilitada en la suscripción activa de la organización (${resolved.contractedPlanName}).`
      )
      err.code = 'ENTITLEMENT_FEATURE_RESTRICTED'
      err.details = {
        featureKey,
        contractedEdition: resolved.contractedEdition,
        simulationOverlay: resolved.simulationOverlay,
      }
      throw err
    }

    return true
  }

  assertCollaboratorQuotaAvailable({
    organization,
    subscription = null,
    planCatalog = null,
    entitlementOverrides = [],
    currentCollaboratorsCount,
    additionalCount = 1,
  }) {
    const resolved = this.resolveEntitlements({
      organization,
      subscription,
      planCatalog,
      entitlementOverrides,
    })
    const current =
      typeof currentCollaboratorsCount === 'number'
        ? currentCollaboratorsCount
        : resolved.collaboratorsStatus.current
    const projected = current + additionalCount

    if (projected > resolved.realLimits.maxCollaborators) {
      const err = new Error(
        `QUOTA_EXCEEDED: La organización "${organization?.displayName || organization?.id}" alcanzaría ${projected} colaboradores, superando el límite de ${resolved.realLimits.maxCollaborators} colaboradores de su plan ${resolved.contractedPlanName}.`
      )
      err.code = 'COLLABORATOR_QUOTA_EXCEEDED'
      err.details = {
        current,
        additionalCount,
        maxAllowed: resolved.realLimits.maxCollaborators,
        contractedEdition: resolved.contractedEdition,
      }
      throw err
    }

    return {
      allowed: true,
      projected,
      maxAllowed: resolved.realLimits.maxCollaborators,
    }
  }
}
