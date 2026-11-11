/**
 * PROCEDIMIENTO SEGURO DE APROVISIONAMIENTO DE LAS TRES CUENTAS EN SUPABASE AUTH
 * CoreFlow — scripts/provision-coreflow-accounts.mjs
 *
 * IMPORTANTE (Sección 4 y 5):
 * 1. Este script se ejecuta EXCLUSIVAMENTE desde terminal administrativa (Node.js CLI).
 * 2. Jamás es importado por el código cliente (`src/`).
 * 3. No inventa credenciales: exige que el administrador defina explícitamente
 *    las variables `PROVISION_*` y `SUPABASE_SERVICE_ROLE_KEY` en su `.env.local`.
 */

import { createClient } from '@supabase/supabase-js'

const requiredEnvVars = [
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'PROVISION_PLATFORM_ADMIN_EMAIL',
  'PROVISION_PLATFORM_ADMIN_PASSWORD',
  'PROVISION_STARTER_ADMIN_EMAIL',
  'PROVISION_STARTER_ADMIN_PASSWORD',
  'PROVISION_BUSINESS_ADMIN_EMAIL',
  'PROVISION_BUSINESS_ADMIN_PASSWORD',
]

function validateEnvironment() {
  const missing = requiredEnvVars.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.error('======================================================================')
    console.error(' COREFLOW — APROVISIONAMIENTO DETENIDO: VARIABLES REQUERIDAS FALTANTES')
    console.error('======================================================================')
    console.error('Por seguridad, este script no inventa contraseñas ni credenciales.')
    console.error('Defina las siguientes variables en su archivo .env.local antes de ejecutar:')
    for (const k of missing) {
      console.error(`  - ${k}`)
    }
    process.exit(1)
  }
}

async function ensureAuthUser(adminClient, { email, password, fullName }) {
  const { data: existingList, error: listErr } = await adminClient.auth.admin.listUsers()
  if (listErr) throw listErr

  const existing = existingList.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )

  if (existing) {
    console.log(`✔ Usuario Auth ya existente: ${email} (${existing.id})`)
    return existing
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })
  if (error) throw error
  console.log(`✔ Usuario Auth creado: ${email} (${data.user.id})`)
  return data.user
}

async function runProvisioning() {
  validateEnvironment()

  const supabaseAdmin = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  console.log('Iniciando aprovisionamiento seguro de los 3 contextos de CoreFlow...\n')

  // 1. Cuenta 1: Administrador Global de Plataforma
  const platformUser = await ensureAuthUser(supabaseAdmin, {
    email: process.env.PROVISION_PLATFORM_ADMIN_EMAIL,
    password: process.env.PROVISION_PLATFORM_ADMIN_PASSWORD,
    fullName: 'Administración Global CoreFlow',
  })

  await supabaseAdmin.from('user_profiles').upsert({
    id: platformUser.id,
    email: platformUser.email,
    full_name: 'Administración Global CoreFlow',
  })

  await supabaseAdmin.from('platform_admins').upsert(
    {
      user_id: platformUser.id,
      email: platformUser.email,
      full_name: 'Administración Global CoreFlow',
      role_level: 'SUPER_ADMIN',
      status: 'active',
    },
    { onConflict: 'user_id' }
  )

  // 2. Cuenta 2: Administrador de Organización Starter
  const starterUser = await ensureAuthUser(supabaseAdmin, {
    email: process.env.PROVISION_STARTER_ADMIN_EMAIL,
    password: process.env.PROVISION_STARTER_ADMIN_PASSWORD,
    fullName: 'Dirección Operativa Starter',
  })

  await supabaseAdmin.from('user_profiles').upsert({
    id: starterUser.id,
    email: starterUser.email,
    full_name: 'Dirección Operativa Starter',
  })

  const { data: starterOrg } = await supabaseAdmin
    .from('organizations')
    .upsert(
      {
        slug: 'unidad-operativa-starter',
        legal_name: 'Soluciones Ágiles del Caribe S.A.S.',
        display_name: 'Soluciones Ágiles del Caribe (Starter)',
        tax_id: '901.850.200-4',
        sector: 'Consultoría y Gestión Comercial',
        contracted_plan_code: 'starter',
        status: 'active',
      },
      { onConflict: 'slug' }
    )
    .select()
    .single()

  await supabaseAdmin.from('organization_subscriptions').upsert(
    {
      organization_id: starterOrg.id,
      plan_code: 'starter',
      status: 'active',
      billing_cycle: 'monthly',
      assigned_by: platformUser.id,
      notes: 'Aprovisionamiento inicial CoreFlow Starter',
    },
    { onConflict: 'organization_id' }
  )

  // 3. Cuenta 3: Administrador de Organización Business
  const businessUser = await ensureAuthUser(supabaseAdmin, {
    email: process.env.PROVISION_BUSINESS_ADMIN_EMAIL,
    password: process.env.PROVISION_BUSINESS_ADMIN_PASSWORD,
    fullName: 'Dirección Corporativa Business',
  })

  await supabaseAdmin.from('user_profiles').upsert({
    id: businessUser.id,
    email: businessUser.email,
    full_name: 'Dirección Corporativa Business',
  })

  const { data: businessOrg } = await supabaseAdmin
    .from('organizations')
    .upsert(
      {
        slug: 'entorno-corporativo-business',
        legal_name: 'Grupo Corporativo Andino S.A.S.',
        display_name: 'Grupo Corporativo Andino (Business)',
        tax_id: '901.420.100-1',
        sector: 'Servicios e Ingeniería Operativa',
        contracted_plan_code: 'business',
        status: 'active',
      },
      { onConflict: 'slug' }
    )
    .select()
    .single()

  await supabaseAdmin.from('organization_subscriptions').upsert(
    {
      organization_id: businessOrg.id,
      plan_code: 'business',
      status: 'active',
      billing_cycle: 'annual',
      assigned_by: platformUser.id,
      notes: 'Aprovisionamiento inicial CoreFlow Business',
    },
    { onConflict: 'organization_id' }
  )

  console.log('\n✅ Aprovisionamiento completado exitosamente.')
}

runProvisioning().catch((err) => {
  console.error('Error durante el aprovisionamiento:', err.message)
  process.exit(1)
})
