/**
 * APROVISIONAMIENTO IDEMPOTENTE DE LAS CUENTAS INICIALES EN SUPABASE
 * CoreFlow — scripts/provision-coreflow-accounts.mjs
 *
 * Crea o reconcilia Platform Admin, un administrador Starter y uno Business, con sus
 * organizaciones, membresías, roles, permisos y suscripciones.
 *
 * Uso:
 *   node scripts/provision-coreflow-accounts.mjs                  Simulación: solo lee.
 *   node scripts/provision-coreflow-accounts.mjs --apply --confirm-project-ref=<ref>
 *   ... --rotate-passwords                                        Cambia las contraseñas.
 *
 * Seguridad:
 *  - Solo terminal administrativa. Nunca se importa desde el navegador.
 *  - No inventa credenciales ni datos de empresas: todo llega por variables de entorno.
 *  - Solo admite un entorno de desarrollo identificado por su project ref.
 *  - Nunca imprime contraseñas ni claves.
 */

import { existsSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { SYSTEM_ROLE_TEMPLATES } from '../src/core/config/permissionsCatalog.js'

const STARTER_ROLE_COUNT = 3
const USERS_PER_PAGE = 200

export class ProvisioningError extends Error {
  constructor(code, message) {
    super(`${code}: ${message}`)
    this.name = 'ProvisioningError'
    this.code = code
  }
}

export function parseArgs(argv) {
  const confirm = argv.find((a) => a.startsWith('--confirm-project-ref='))
  const known = new Set(['--apply', '--rotate-passwords'])
  const unknown = argv.filter((a) => !known.has(a) && !a.startsWith('--confirm-project-ref='))
  if (unknown.length) {
    throw new ProvisioningError('INVALID_ARGUMENTS', `Argumentos no reconocidos: ${unknown.join(' ')}`)
  }
  return {
    apply: argv.includes('--apply'),
    rotatePasswords: argv.includes('--rotate-passwords'),
    confirmProjectRef: confirm ? confirm.split('=')[1] : null,
  }
}

export function readConfig(env, { requirePasswords = true } = {}) {
  const required = [
    'VITE_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'COREFLOW_TARGET_ENV',
    'COREFLOW_SUPABASE_PROJECT_REF',
    'PROVISION_PLATFORM_ADMIN_EMAIL',
    'PROVISION_STARTER_ADMIN_EMAIL',
    'PROVISION_STARTER_ORG_SLUG',
    'PROVISION_STARTER_ORG_NAME',
    'PROVISION_BUSINESS_ADMIN_EMAIL',
    'PROVISION_BUSINESS_ORG_SLUG',
    'PROVISION_BUSINESS_ORG_NAME',
  ]
  if (requirePasswords) {
    required.push(
      'PROVISION_PLATFORM_ADMIN_PASSWORD',
      'PROVISION_STARTER_ADMIN_PASSWORD',
      'PROVISION_BUSINESS_ADMIN_PASSWORD'
    )
  }

  const missing = required.filter((key) => !env[key])
  if (missing.length) {
    throw new ProvisioningError('MISSING_CONFIGURATION', `Faltan variables: ${missing.join(', ')}`)
  }

  const tenant = (prefix, planCode, adminName) => ({
    planCode,
    slug: env[`PROVISION_${prefix}_ORG_SLUG`],
    displayName: env[`PROVISION_${prefix}_ORG_NAME`],
    legalName: env[`PROVISION_${prefix}_ORG_LEGAL_NAME`] || null,
    taxId: env[`PROVISION_${prefix}_ORG_TAX_ID`] || null,
    sector: env[`PROVISION_${prefix}_ORG_SECTOR`] || null,
    admin: {
      email: env[`PROVISION_${prefix}_ADMIN_EMAIL`],
      password: env[`PROVISION_${prefix}_ADMIN_PASSWORD`] || null,
      fullName: env[`PROVISION_${prefix}_ADMIN_NAME`] || adminName,
    },
  })

  return {
    url: env.VITE_SUPABASE_URL,
    serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
    targetEnv: env.COREFLOW_TARGET_ENV,
    projectRef: env.COREFLOW_SUPABASE_PROJECT_REF,
    platformAdmin: {
      email: env.PROVISION_PLATFORM_ADMIN_EMAIL,
      password: env.PROVISION_PLATFORM_ADMIN_PASSWORD || null,
      fullName: env.PROVISION_PLATFORM_ADMIN_NAME || 'Administración Global CoreFlow',
    },
    tenants: [
      tenant('STARTER', 'starter', 'Administración Starter'),
      tenant('BUSINESS', 'business', 'Administración Business'),
    ],
  }
}

/** Impide apuntar a un proyecto distinto del de desarrollo declarado. */
export function assertSafeTarget({ url, targetEnv, projectRef }, { apply, confirmProjectRef }) {
  if (targetEnv !== 'development') {
    throw new ProvisioningError('UNSAFE_TARGET', 'COREFLOW_TARGET_ENV debe ser "development".')
  }

  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new ProvisioningError('UNSAFE_TARGET', 'VITE_SUPABASE_URL no es una URL válida.')
  }
  // Solo el endpoint estándar: la clave de servicio no debe viajar a otro lugar
  const isStandardEndpoint =
    parsed.protocol === 'https:' &&
    parsed.hostname === `${projectRef}.supabase.co` &&
    parsed.port === '' &&
    parsed.pathname === '/' &&
    parsed.username === '' &&
    parsed.password === '' &&
    parsed.search === '' &&
    parsed.hash === ''
  if (!isStandardEndpoint) {
    throw new ProvisioningError(
      'UNSAFE_TARGET',
      'VITE_SUPABASE_URL debe ser exactamente https://<COREFLOW_SUPABASE_PROJECT_REF>.supabase.co'
    )
  }
  if (apply && confirmProjectRef !== projectRef) {
    throw new ProvisioningError(
      'CONFIRMATION_REQUIRED',
      '--apply exige --confirm-project-ref=<ref> con el project ref exacto.'
    )
  }
}

export function validateRoleTemplates(planCode, templates) {
  const codes = templates.map((t) => t.code)
  if (!codes.includes('ORG_ADMIN')) {
    throw new ProvisioningError('ROLE_TEMPLATES_INVALID', `El plan ${planCode} necesita ORG_ADMIN.`)
  }
  if (planCode === 'starter' && templates.length !== STARTER_ROLE_COUNT) {
    throw new ProvisioningError(
      'STARTER_ROLES_INVALID',
      `Starter requiere exactamente ${STARTER_ROLE_COUNT} roles y se recibieron ${templates.length}. ` +
        'Aplique primero el cambio de la especificación Starter v1.0 en permissionsCatalog.js.'
    )
  }
}

const defaultRoleTemplatesFor = () => Object.values(SYSTEM_ROLE_TEMPLATES)

function check(step, { data, error }) {
  if (error) throw new ProvisioningError('PROVISIONING_FAILED', `${step}: ${error.message}`)
  return data
}

export async function findAuthUser(admin, email) {
  const target = email.toLowerCase()
  for (let page = 1; ; page += 1) {
    const data = check(
      'Consulta de usuarios',
      await admin.auth.admin.listUsers({ page, perPage: USERS_PER_PAGE })
    )
    const found = data.users.find((u) => u.email?.toLowerCase() === target)
    if (found) return found
    if (data.users.length < USERS_PER_PAGE) return null
  }
}

async function ensureAuthUser(admin, account, { rotatePasswords }) {
  const existing = await findAuthUser(admin, account.email)
  if (!existing) {
    const data = check(
      `Creación de ${account.email}`,
      await admin.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: { full_name: account.fullName },
      })
    )
    return { user: data.user, outcome: 'created', passwordChanged: true }
  }

  const attributes = {}
  if (existing.user_metadata?.full_name !== account.fullName) {
    attributes.user_metadata = { ...existing.user_metadata, full_name: account.fullName }
  }
  if (rotatePasswords) attributes.password = account.password
  if (Object.keys(attributes).length) {
    check(
      `Actualización de ${account.email}`,
      await admin.auth.admin.updateUserById(existing.id, attributes)
    )
  }
  return { user: existing, outcome: 'existing', passwordChanged: rotatePasswords }
}

async function upsertProfile(admin, user, fullName) {
  check(
    `Perfil de ${user.email}`,
    await admin
      .from('user_profiles')
      .upsert({ id: user.id, email: user.email, full_name: fullName }, { onConflict: 'id' })
      .select()
      .single()
  )
}

async function assertPlanAvailable(admin, planCode) {
  const plan = check(
    `Plan ${planCode}`,
    await admin.from('plan_catalog').select('*').eq('plan_code', planCode).eq('is_active', true).maybeSingle()
  )
  if (!plan) throw new ProvisioningError('PLAN_NOT_AVAILABLE', `El plan ${planCode} no está activo.`)
}

async function verifyTenant(admin, organizationId, tenant, templates, userId) {
  const from = (table) => admin.from(table).select('*').eq('organization_id', organizationId)
  const [roles, branches, departments, subscription, member] = await Promise.all([
    from('roles').then((r) => check('Verificación de roles', r)),
    from('organization_branches').then((r) => check('Verificación de sedes', r)),
    from('departments').then((r) => check('Verificación de áreas', r)),
    from('organization_subscriptions').maybeSingle().then((r) => check('Verificación de suscripción', r)),
    from('organization_members').eq('user_id', userId).maybeSingle().then((r) => check('Verificación de membresía', r)),
  ])

  const problems = []
  const codes = new Set(roles.map((r) => r.code))
  for (const template of templates) {
    if (!codes.has(template.code)) problems.push(`falta el rol ${template.code}`)
  }
  if (tenant.planCode === 'starter') {
    if (roles.length !== STARTER_ROLE_COUNT) problems.push(`tiene ${roles.length} roles`)
    if (branches.length !== 1) problems.push(`tiene ${branches.length} sedes`)
    if (departments.length !== 1) problems.push(`tiene ${departments.length} áreas`)
  }
  if (!subscription) problems.push('sin suscripción')
  if (!member) problems.push('el administrador no es miembro')
  else if (member.status !== 'active') problems.push(`membresía en estado ${member.status}`)

  if (problems.length) {
    throw new ProvisioningError('VERIFICATION_FAILED', `${tenant.slug}: ${problems.join('; ')}`)
  }
}

/**
 * Valida todo antes de la primera escritura. En modo simulación no escribe nada.
 * Devuelve un informe sin credenciales.
 */
export async function runProvisioning({
  admin,
  config,
  apply = false,
  rotatePasswords = false,
  roleTemplatesFor = defaultRoleTemplatesFor,
}) {
  const adminEmail = config.platformAdmin.email.toLowerCase()
  const seen = new Set([adminEmail])
  for (const tenant of config.tenants) {
    const email = tenant.admin.email.toLowerCase()
    if (seen.has(email)) {
      throw new ProvisioningError('ACCOUNTS_NOT_INDEPENDENT', `El correo ${email} se repite entre cuentas.`)
    }
    seen.add(email)
    validateRoleTemplates(tenant.planCode, roleTemplatesFor(tenant.planCode))
    await assertPlanAvailable(admin, tenant.planCode)
  }

  if (!apply) {
    const report = { mode: 'dry-run', accounts: [], organizations: [] }
    for (const account of [config.platformAdmin, ...config.tenants.map((t) => t.admin)]) {
      const found = await findAuthUser(admin, account.email)
      report.accounts.push({ email: account.email, action: found ? 'reconcile' : 'create' })
    }
    for (const tenant of config.tenants) {
      const org = check(
        `Organización ${tenant.slug}`,
        await admin.from('organizations').select('*').eq('slug', tenant.slug).maybeSingle()
      )
      report.organizations.push({ slug: tenant.slug, plan: tenant.planCode, action: org ? 'reconcile' : 'create' })
    }
    return report
  }

  const report = { mode: 'apply', accounts: [], organizations: [] }

  const platform = await ensureAuthUser(admin, config.platformAdmin, { rotatePasswords })
  await upsertProfile(admin, platform.user, config.platformAdmin.fullName)
  check(
    'Registro de Platform Admin',
    await admin
      .from('platform_admins')
      .upsert(
        {
          user_id: platform.user.id,
          email: platform.user.email,
          full_name: config.platformAdmin.fullName,
          role_level: 'SUPER_ADMIN',
          status: 'active',
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()
  )
  report.accounts.push({ email: platform.user.email, outcome: platform.outcome, passwordChanged: platform.passwordChanged })

  for (const tenant of config.tenants) {
    const result = await ensureAuthUser(admin, tenant.admin, { rotatePasswords })
    await upsertProfile(admin, result.user, tenant.admin.fullName)

    const templates = roleTemplatesFor(tenant.planCode)
    const provisioned = check(
      `Organización ${tenant.slug}`,
      await admin.rpc('rpc_provision_organization', {
        p: {
          slug: tenant.slug,
          display_name: tenant.displayName,
          legal_name: tenant.legalName ?? undefined,
          tax_id: tenant.taxId ?? undefined,
          sector: tenant.sector ?? undefined,
          plan_code: tenant.planCode,
          role_templates: templates,
          admin_user_id: result.user.id,
          notes: 'Aprovisionamiento inicial',
        },
      })
    )

    await verifyTenant(admin, provisioned.organization_id, tenant, templates, result.user.id)
    report.accounts.push({ email: result.user.email, outcome: result.outcome, passwordChanged: result.passwordChanged })
    report.organizations.push({ slug: tenant.slug, plan: tenant.planCode, organizationId: provisioned.organization_id })
  }

  return report
}

function printReport(report) {
  console.log(`Modo: ${report.mode}`)
  for (const a of report.accounts) {
    const detail = a.action ?? `${a.outcome}, contraseña ${a.passwordChanged ? 'establecida' : 'sin cambios'}`
    console.log(`  Cuenta ${a.email}: ${detail}`)
  }
  for (const o of report.organizations) {
    console.log(`  Organización ${o.slug} (${o.plan}): ${o.action ?? o.organizationId}`)
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (existsSync('.env.local')) process.loadEnvFile('.env.local')

  const config = readConfig(process.env, { requirePasswords: args.apply })
  assertSafeTarget(config, args)

  const { createClient } = await import('@supabase/supabase-js')
  const admin = createClient(config.url, config.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  printReport(await runProvisioning({ admin, config, ...args }))
  if (!args.apply) console.log('Simulación terminada: no se escribió nada.')
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`Aprovisionamiento detenido. ${err.message}`)
    process.exitCode = 1
  })
}
