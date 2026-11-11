/**
 * CARGA DE DATOS DESDE EL MOTOR DE SUPABASE, SIN DEPENDENCIA DE REACT
 * CoreFlow — src/adapters/react/supabaseData.js
 *
 * Una lectura fallida interrumpe la carga completa: la interfaz muestra el error
 * en vez de pintar una organización vacía como si no tuviera datos.
 */

function required(result) {
  if (result.ok) return result.data
  const failure = new Error(result.error)
  failure.code = result.code
  throw failure
}

/** Primer paso sin decidir de cada solicitud, en la forma que usa la cola de aprobaciones. */
export function buildApprovalQueue(steps, requests) {
  const open = steps.filter((s) => s.status === 'pending' || s.status === 'process')
  return requests.flatMap((request) => {
    const own = open.filter((s) => s.requestId === request.id)
    if (own.length === 0) return []
    const current = own.reduce((a, b) => (a.stepOrder <= b.stepOrder ? a : b))
    const total = steps.filter((s) => s.requestId === request.id).length
    return [
      {
        id: request.code || request.id,
        reqId: request.id,
        titulo: request.asunto,
        ruta: request.departamento,
        etapaActual: `Nivel ${current.stepOrder} de ${total} (${current.stepLabel})`,
        estado: current.status,
      },
    ]
  })
}

export async function loadTenantData(engine, organizationId, period) {
  const [context, requests, clients, opportunities, tasks, documents, automationRules, auditLogs, steps] =
    (
      await Promise.all([
        engine.organizations.getTenantContext(organizationId),
        engine.workflow.listRequests(organizationId),
        engine.operationalModules.listClients(organizationId),
        engine.operationalModules.listOpportunities(organizationId),
        engine.operationalModules.listTasks(organizationId),
        engine.operationalModules.listDocuments(organizationId),
        engine.automations.listRules(organizationId),
        engine.audit.listOrganizationLogs(organizationId),
        engine.workflow.listApprovalSteps(organizationId),
      ])
    ).map(required)

  const unifiedMetrics = required(
    await engine.metrics.getOrganizationMetrics({
      organizationId,
      period,
      entitlementsResolved: context.entitlementsResolved,
    })
  )

  return {
    context,
    requests,
    clients,
    opportunities,
    tasks,
    documents,
    automationRules,
    auditLogs,
    approvalQueue: buildApprovalQueue(steps, requests),
    unifiedMetrics,
  }
}

export async function loadPlatformData(engine) {
  const [plans, organizations, users, globalAuditLogs] = (
    await Promise.all([
      engine.platformAdmin.listPlans(),
      engine.platformAdmin.listOrganizations(),
      engine.platformAdmin.listUsers(),
      engine.platformAdmin.listGlobalAudit(),
    ])
  ).map(required)

  return {
    platformAdminData: {
      // `start` es un código retirado: no se ofrece para asignar.
      plans: plans.filter((plan) => plan.isActive !== false),
      organizations,
      users,
      globalAuditLogs,
    },
  }
}
