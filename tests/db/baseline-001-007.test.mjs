// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * NIVEL SIMULADA — Línea base de las migraciones 001 a 007.
 * Cada prueba demuestra una brecha de la auditoría: pasa si la brecha EXISTE
 * en el esquema anterior a la migración 008.
 */

import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import {
  asUser,
  createDatabase,
  createPlatformAdmin,
  seedApprovalStep,
  seedRequest,
  seedTenant,
} from './harness.mjs'

let db
let biz
let starter
let suspended

before(async () => {
  db = await createDatabase({ upTo: 7 })
  biz = await seedTenant(db, {
    slug: 'biz',
    members: [
      { key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' },
      { key: 'ops', role: 'OPS_COORDINATOR', dept: 'OPS' },
      { key: 'specialist', role: 'SPECIALIST', dept: 'OPS' },
    ],
  })
  starter = await seedTenant(db, {
    slug: 'starter',
    plan: 'starter',
    members: [{ key: 'admin', role: 'ORG_ADMIN' }],
  })
  suspended = await seedTenant(db, {
    slug: 'susp',
    orgStatus: 'suspended',
    subStatus: 'suspended',
    members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }],
  })
})

after(async () => {
  await db?.close()
})

test('las siete migraciones se aplican sobre una base vacía', async () => {
  const { rows } = await db.query(
    `select count(*)::int as n from information_schema.tables where table_schema = 'public'`
  )
  assert.ok(rows[0].n >= 20)
})

test('duplicidad: start y starter quedan activos a la vez', async () => {
  const { rows } = await db.query(
    `select plan_code from plan_catalog where is_active and plan_code in ('start','starter')`
  )
  assert.equal(rows.length, 2)
})

test('F1: ON DELETE SET NULL compuesto falla por organization_id NOT NULL', async () => {
  const t = await seedTenant(db, {
    slug: 'f1',
    members: [{ key: 'owner', role: 'ORG_ADMIN', dept: 'OPS' }],
  })
  await db.query(
    `insert into clients (organization_id, branch_id, code, legal_name, display_name, owner_member_id)
     values ($1, $2, 'C1', 'C', 'C', $3)`,
    [t.orgId, t.branchId, t.memberIds.owner]
  )
  await assert.rejects(
    db.query(`delete from organization_members where id = $1`, [t.memberIds.owner]),
    /null value in column "organization_id"/
  )
})

test('S1: se aprueba un paso de otro departamento por escritura directa', async () => {
  const requestId = await seedRequest(db, biz, {
    code: 'S1', dept: 'COM', assigned: 'ops', createdBy: 'ops',
  })
  const stepId = await seedApprovalStep(db, biz, requestId, { order: 1, dept: 'COM' })
  await asUser(db, biz.users.ops, async (tx) => {
    const res = await tx.query(
      `update approval_steps set status = 'approved' where id = $1`, [stepId]
    )
    assert.equal(res.affectedRows, 1)
  })
})

test('S2: una solicitud cambia a un estado arbitrario por escritura directa', async () => {
  const requestId = await seedRequest(db, biz, {
    code: 'S2', dept: 'OPS', assigned: 'ops', createdBy: 'ops', status: 'completed',
  })
  await asUser(db, biz.users.ops, async (tx) => {
    const res = await tx.query(
      `update requests set status = 'pending', approval_summary = 'Validado' where id = $1`,
      [requestId]
    )
    assert.equal(res.affectedRows, 1)
  })
})

test('S3: un tenant suspendido sigue escribiendo', async () => {
  await asUser(db, suspended.users.admin, async (tx) => {
    const res = await tx.query(
      `insert into clients (organization_id, branch_id, code, legal_name, display_name)
       values ($1, $2, 'SUSP', 'C', 'C')`,
      [suspended.orgId, suspended.branchId]
    )
    assert.equal(res.affectedRows, 1)
  })
})

test('S4: un especialista lee solicitudes que no tiene asignadas', async () => {
  const requestId = await seedRequest(db, biz, {
    code: 'S4', dept: 'COM', assigned: 'ops', createdBy: 'ops',
  })
  await asUser(db, biz.users.specialist, async (tx) => {
    const { rows } = await tx.query(`select id from requests where id = $1`, [requestId])
    assert.equal(rows.length, 1)
  })
})

test('S5: se supera la cuota de sedes del plan Starter', async () => {
  await asUser(db, starter.users.admin, async (tx) => {
    const res = await tx.query(
      `insert into organization_branches (organization_id, code, name) values ($1, 'B2', 'Dos')`,
      [starter.orgId]
    )
    assert.equal(res.affectedRows, 1)
  })
})

test('S6: un PLATFORM_AUDITOR modifica el catálogo de planes', async () => {
  const auditor = await createPlatformAdmin(db, 'auditor@platform.test', 'PLATFORM_AUDITOR')
  await asUser(db, auditor, async (tx) => {
    const res = await tx.query(
      `update plan_catalog set price_monthly_usd = 1 where plan_code = 'business'`
    )
    assert.equal(res.affectedRows, 1)
  })
})

test('S8: se registra auditoría a nombre de otro miembro', async () => {
  await asUser(db, biz.users.specialist, async (tx) => {
    const res = await tx.query(
      `insert into audit_logs
         (organization_id, actor_user_id, actor_member_id, actor_role_code,
          module, entity_type, entity_id, action, summary)
       values ($1, $2, $3, 'ORG_ADMIN', 'm', 'e', '1', 'FORGED', 'falso')`,
      [biz.orgId, biz.users.specialist, biz.memberIds.admin]
    )
    assert.equal(res.affectedRows, 1)
  })
})

test('D1: una función de seguridad revela capacidades de otro tenant', async () => {
  await asUser(db, starter.users.admin, async (tx) => {
    const { rows } = await tx.query(
      `select app_org_has_feature($1, 'multi_branch') as enabled`, [biz.orgId]
    )
    assert.equal(rows[0].enabled, true)
  })
})

test('aislamiento: un tenant no lee las solicitudes de otro (ya funcionaba)', async () => {
  const requestId = await seedRequest(db, biz, {
    code: 'ISO', dept: 'OPS', assigned: 'ops', createdBy: 'ops',
  })
  await asUser(db, starter.users.admin, async (tx) => {
    const { rows } = await tx.query(`select id from requests where id = $1`, [requestId])
    assert.equal(rows.length, 0)
  })
})
