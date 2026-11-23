// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * ARNÉS DE PRUEBAS DE BASE DE DATOS — NIVEL "SIMULADA"
 * CoreFlow — tests/db/harness.mjs
 *
 * Ejecuta las migraciones reales sobre PostgreSQL embebido (PGlite).
 * Simula lo que Supabase provee por fuera de las migraciones: roles, `auth.uid()`,
 * `auth.users` y `storage`. Estos resultados NO equivalen a una integración real
 * con Supabase: no cubren Auth, PostgREST ni la API de Storage.
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp'
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto'
import { getRoleTemplatesForPlan } from '../../src/core/config/permissionsCatalog.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const MIGRATIONS_DIR = join(ROOT, 'supabase', 'migrations')
const ROLLBACKS_DIR = join(ROOT, 'supabase', 'rollbacks')

const SUPABASE_STUB = `
  create role anon nologin noinherit;
  create role authenticated nologin noinherit;
  create role service_role nologin noinherit bypassrls;

  create schema extensions;
  create extension "uuid-ossp" schema extensions;
  create extension pgcrypto schema extensions;
  grant usage on schema extensions to anon, authenticated, service_role;
  grant execute on all functions in schema extensions to anon, authenticated, service_role;

  create schema auth;
  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    raw_user_meta_data jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  );
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create function auth.role() returns text language sql stable as $$
    select nullif(current_setting('request.jwt.claim.role', true), '')
  $$;
  grant usage on schema auth to anon, authenticated, service_role;
  grant execute on all functions in schema auth to anon, authenticated, service_role;

  create schema storage;
  create table storage.buckets (
    id text primary key,
    name text not null,
    public boolean not null default false,
    file_size_limit bigint,
    allowed_mime_types text[]
  );
  create table storage.objects (
    id uuid primary key default gen_random_uuid(),
    bucket_id text references storage.buckets(id),
    name text not null,
    owner uuid,
    owner_id text,
    metadata jsonb,
    created_at timestamptz not null default now(),
    unique (bucket_id, name)
  );
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$
    select (string_to_array(name, '/'))[1 : array_length(string_to_array(name, '/'), 1) - 1]
  $$;
  grant usage on schema storage to anon, authenticated, service_role;
  grant all on all tables in schema storage to anon, authenticated, service_role;
  grant execute on all functions in schema storage to anon, authenticated, service_role;

  grant usage on schema public to anon, authenticated, service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
  alter default privileges in schema public grant all on functions to anon, authenticated, service_role;
`

export function listMigrations() {
  return readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()
}

export async function applySqlFile(db, path) {
  const sql = readFileSync(path, 'utf8')
  await db.transaction(async (tx) => {
    await tx.exec(sql)
  })
}

export async function applyMigrations(db, { upTo = Infinity, from = 0 } = {}) {
  for (const file of listMigrations()) {
    const number = Number.parseInt(file, 10)
    if (number <= from || number > upTo) continue
    try {
      await applySqlFile(db, join(MIGRATIONS_DIR, file))
    } catch (err) {
      throw new Error(`Falló la migración ${file}: ${err.message}`)
    }
  }
}

export async function applyRollback(db, number) {
  const prefix = String(number).padStart(3, '0')
  const file = readdirSync(ROLLBACKS_DIR).find((f) => f.startsWith(prefix))
  if (!file || !existsSync(join(ROLLBACKS_DIR, file))) {
    throw new Error(`No existe rollback para la migración ${prefix}`)
  }
  await applySqlFile(db, join(ROLLBACKS_DIR, file))
}

export async function createDatabase({ upTo = Infinity } = {}) {
  const db = new PGlite({ extensions: { uuid_ossp, pgcrypto } })
  await db.exec(SUPABASE_STUB)
  await db.exec(`set search_path = "$user", public, extensions`)
  try {
    await applyMigrations(db, { upTo })
  } catch (err) {
    await db.close()
    throw err
  }
  return db
}

/** Ejecuta `fn` como un usuario de la API, en una transacción con RLS activa. */
export async function asUser(db, userId, fn, { role = 'authenticated' } = {}) {
  return db.transaction(async (tx) => {
    await tx.query(
      `select set_config('request.jwt.claim.sub', $1, true),
              set_config('request.jwt.claim.role', $2, true)`,
      [userId || '', role]
    )
    await tx.exec(`set local role ${role}`)
    return fn(tx)
  })
}

export async function createAuthUser(db, email) {
  const { rows } = await db.query(
    `insert into auth.users (email, raw_user_meta_data)
     values ($1, jsonb_build_object('full_name', $1::text)) returning id`,
    [email]
  )
  const id = rows[0].id
  await db.query(
    `insert into user_profiles (id, email, full_name) values ($1, $2, $2)
     on conflict (id) do nothing`,
    [id, email]
  )
  return id
}

export async function createPlatformAdmin(db, email, roleLevel) {
  const userId = await createAuthUser(db, email)
  await db.query(
    `insert into platform_admins (user_id, email, full_name, role_level)
     values ($1, $2, $2, $3)`,
    [userId, email, roleLevel]
  )
  return userId
}

/**
 * Crea un tenant como superusuario, con las plantillas reales de roles de su plan.
 * `members`: [{ key, role, dept }]. Devuelve los ids por clave.
 */
export async function seedTenant(
  db,
  {
    slug,
    plan = 'business',
    orgStatus = 'active',
    subStatus = 'active',
    validUntil = null,
    departments = ['OPS', 'COM'],
    members = [],
  }
) {
  const one = async (sql, params) => (await db.query(sql, params)).rows[0]

  const org = await one(
    `insert into organizations (slug, legal_name, display_name, contracted_plan_code, status)
     values ($1, $1, $1, $2, $3) returning id`,
    [slug, plan, orgStatus]
  )
  const orgId = org.id

  await db.query(
    `insert into organization_subscriptions (organization_id, plan_code, status, valid_until)
     values ($1, $2, $3, coalesce($4::timestamptz, now() + interval '1 year'))`,
    [orgId, plan, subStatus, validUntil]
  )

  const branch = await one(
    `insert into organization_branches (organization_id, code, name, is_main)
     values ($1, 'MAIN', 'Sede Principal', true) returning id`,
    [orgId]
  )

  const deptIds = {}
  for (const code of departments) {
    const row = await one(
      `insert into departments (organization_id, branch_id, code, name)
       values ($1, $2, $3, $3) returning id`,
      [orgId, branch.id, code]
    )
    deptIds[code] = row.id
  }

  const roleIds = {}
  for (const template of getRoleTemplatesForPlan(plan)) {
    const role = await one(
      `insert into roles (organization_id, code, name, default_scope, is_system_role)
       values ($1, $2, $3, $4, true) returning id`,
      [orgId, template.code, template.name, template.defaultScope]
    )
    roleIds[template.code] = role.id
    for (const perm of template.permissions) {
      await db.query(
        `insert into role_permissions (role_id, organization_id, permission_key, scope_override)
         values ($1, $2, $3, $4)`,
        [role.id, orgId, perm.permissionKey, perm.scopeOverride]
      )
    }
  }

  const users = {}
  const memberIds = {}
  for (const m of members) {
    const userId = await createAuthUser(db, `${m.key}@${slug}.test`)
    const row = await one(
      `insert into organization_members
         (organization_id, user_id, role_id, branch_id, department_id, job_title)
       values ($1, $2, $3, $4, $5, $6) returning id`,
      [orgId, userId, roleIds[m.role], branch.id, m.dept ? deptIds[m.dept] : null, m.role]
    )
    users[m.key] = userId
    memberIds[m.key] = row.id
  }

  return { orgId, branchId: branch.id, deptIds, roleIds, users, memberIds }
}

/** Inserta una solicitud como superusuario, para preparar escenarios. */
export async function seedRequest(db, t, { code, dept, assigned, createdBy, status = 'process' }) {
  const { rows } = await db.query(
    `insert into requests
       (organization_id, code, subject, client_display_name, branch_id, department_id,
        assigned_member_id, created_by_member_id, status, due_label, approval_summary)
     values ($1, $2, $2, 'Cliente', $3, $4, $5, $6, $7, 'Hoy', 'Pendiente') returning id`,
    [t.orgId, code, t.branchId, dept ? t.deptIds[dept] : null,
     t.memberIds[assigned], t.memberIds[createdBy], status]
  )
  return rows[0].id
}

export async function seedApprovalStep(db, t, requestId, { order, dept, status = 'pending' }) {
  const { rows } = await db.query(
    `insert into approval_steps
       (organization_id, request_id, step_order, step_label, target_department_id, status)
     values ($1, $2, $3, 'Nivel', $4, $5) returning id`,
    [t.orgId, requestId, order, dept ? t.deptIds[dept] : null, status]
  )
  return rows[0].id
}
