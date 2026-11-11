/**
 * NIVEL SIMULADA — Seguridad y reglas de negocio tras las migraciones 008 a 012.
 * PostgreSQL embebido con Auth y Storage simulados: no equivale a Supabase real.
 */

import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  asUser,
  createAuthUser,
  createDatabase,
  createPlatformAdmin,
  seedApprovalStep,
  seedRequest,
  seedTenant,
} from './harness.mjs'
import { SYSTEM_ROLE_TEMPLATES } from '../../src/core/config/permissionsCatalog.js'

const TEMPLATES = Object.values(SYSTEM_ROLE_TEMPLATES)
const RLS_DENIED = /row-level security policy/
let db, biz, other, starter, suspended, expired
let superAdmin, opsAdmin, auditor

const rowsOf = async (tx, sql, params) => (await tx.query(sql, params)).rows
const insertClient = (tx, t, code) =>
  tx.query(
    `insert into clients (organization_id, branch_id, code, legal_name, display_name)
     values ($1, $2, $3, 'C', 'C')`,
    [t.orgId, t.branchId, code]
  )

before(async () => {
  db = await createDatabase()
  biz = await seedTenant(db, {
    slug: 'biz',
    members: [
      { key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' },
      { key: 'ops', role: 'OPS_COORDINATOR', dept: 'OPS' },
      { key: 'com', role: 'COMMERCIAL_LEAD', dept: 'COM' },
      { key: 'specialist', role: 'SPECIALIST', dept: 'OPS' },
      { key: 'viewer', role: 'AUDITOR_VIEWER' },
    ],
  })
  other = await seedTenant(db, {
    slug: 'other',
    members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }],
  })
  starter = await seedTenant(db, {
    slug: 'starter',
    plan: 'starter',
    departments: [],
    members: [
      { key: 'admin', role: 'ORG_ADMIN' },
      { key: 'specialist', role: 'SPECIALIST' },
    ],
  })
  suspended = await seedTenant(db, {
    slug: 'susp',
    orgStatus: 'suspended',
    subStatus: 'suspended',
    members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }],
  })
  expired = await seedTenant(db, {
    slug: 'exp',
    validUntil: '2020-01-01T00:00:00Z',
    members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }],
  })
  superAdmin = await createPlatformAdmin(db, 'super@platform.test', 'SUPER_ADMIN')
  opsAdmin = await createPlatformAdmin(db, 'ops@platform.test', 'PLATFORM_OPS')
  auditor = await createPlatformAdmin(db, 'auditor@platform.test', 'PLATFORM_AUDITOR')
})

after(async () => {
  await db?.close()
})

describe('planes y fuente de verdad', () => {
  test('starter es el único plan de entrada activo', async () => {
    const rows = await rowsOf(db, `select plan_code, is_active from plan_catalog where plan_code in ('start','starter') order by 1`)
    assert.deepEqual(rows, [
      { plan_code: 'start', is_active: false },
      { plan_code: 'starter', is_active: true },
    ])
  })

  test('start no se puede reactivar ni asignar', async () => {
    await assert.rejects(db.query(`update plan_catalog set is_active = true where plan_code = 'start'`), /plan_catalog_start_retired/)
    await assert.rejects(
      db.query(`update organization_subscriptions set plan_code = 'start' where organization_id = $1`, [starter.orgId]),
      /subscriptions_plan_not_retired/
    )
  })

  test('el plan no se escribe en organizations; se deriva de la suscripción', async () => {
    await assert.rejects(
      db.query(`update organizations set contracted_plan_code = 'starter' where id = $1`, [other.orgId]),
      /PLAN_SOURCE_VIOLATION/
    )
    const t = await seedTenant(db, { slug: 'sync', members: [] })
    await db.query(`update organization_subscriptions set plan_code = 'starter' where organization_id = $1`, [t.orgId])
    const [org] = await rowsOf(db, `select contracted_plan_code from organizations where id = $1`, [t.orgId])
    assert.equal(org.contracted_plan_code, 'starter')
  })
})

describe('integridad', () => {
  test('F1: borrar un miembro anula solo la columna opcional', async () => {
    const t = await seedTenant(db, { slug: 'f1', members: [{ key: 'owner', role: 'ORG_ADMIN', dept: 'OPS' }] })
    await db.query(
      `insert into clients (organization_id, branch_id, code, legal_name, display_name, owner_member_id)
       values ($1, $2, 'C1', 'C', 'C', $3)`,
      [t.orgId, t.branchId, t.memberIds.owner]
    )
    await db.query(`delete from organization_members where id = $1`, [t.memberIds.owner])
    const [client] = await rowsOf(db, `select organization_id, owner_member_id from clients where code = 'C1' and organization_id = $1`, [t.orgId])
    assert.equal(client.owner_member_id, null)
    assert.equal(client.organization_id, t.orgId)
  })

  test('organization_id es inmutable', async () => {
    const requestId = await seedRequest(db, biz, { code: 'IMM', dept: 'OPS', assigned: 'ops', createdBy: 'ops' })
    await assert.rejects(
      db.query(`update requests set organization_id = $1 where id = $2`, [other.orgId, requestId]),
      /organization_id es inmutable|violates foreign key/
    )
  })

  test('una clave foránea no cruza tenants', async () => {
    await asUser(db, biz.users.admin, async (tx) => {
      await assert.rejects(
        tx.query(
          `insert into clients (organization_id, branch_id, code, legal_name, display_name, owner_member_id)
           values ($1, $2, 'X', 'C', 'C', $3)`,
          [biz.orgId, biz.branchId, other.memberIds.admin]
        ),
        /violates foreign key/
      )
    })
  })

  test('updated_at se actualiza solo', async () => {
    const [{ updated_at: before_ }] = await rowsOf(db, `select updated_at from organizations where id = $1`, [biz.orgId])
    await db.query(`update organizations set sector = 'X' where id = $1`, [biz.orgId])
    const [{ updated_at: after_ }] = await rowsOf(db, `select updated_at from organizations where id = $1`, [biz.orgId])
    assert.ok(new Date(after_) > new Date(before_))
  })

  test('alta y cambio de correo en Auth sincronizan el perfil', async () => {
    const { rows } = await db.query(`insert into auth.users (email) values ('nuevo@a.test') returning id`)
    const id = rows[0].id
    await db.query(`update auth.users set email = 'cambiado@a.test' where id = $1`, [id])
    const [profile] = await rowsOf(db, `select email from user_profiles where id = $1`, [id])
    assert.equal(profile.email, 'cambiado@a.test')
  })
})

describe('aislamiento entre organizaciones', () => {
  test('no se leen ni se escriben datos de otro tenant', async () => {
    const requestId = await seedRequest(db, biz, { code: 'ISO', dept: 'OPS', assigned: 'ops', createdBy: 'ops' })
    await asUser(db, other.users.admin, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from requests where id = $1`, [requestId])).length, 0)
      assert.equal((await rowsOf(tx, `select id from organizations where id = $1`, [biz.orgId])).length, 0)
    })
    await asUser(db, other.users.admin, async (tx) => {
      await assert.rejects(insertClient(tx, biz, 'INV'), RLS_DENIED)
    })
  })

  test('las RPC rechazan organizaciones ajenas', async () => {
    await asUser(db, other.users.admin, async (tx) => {
      await assert.rejects(
        tx.query(`select rpc_create_request($1, '{"subject":"a","client_display_name":"b"}')`, [biz.orgId]),
        /TENANT_ISOLATION_VIOLATION/
      )
    })
  })

  test('un usuario anónimo no obtiene datos', async () => {
    await asUser(db, null, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from organizations`)).length, 0)
    }, { role: 'anon' })
  })

  test('D1: las funciones de seguridad no son invocables desde la API', async () => {
    await asUser(db, starter.users.admin, async (tx) => {
      await assert.rejects(tx.query(`select app_org_has_feature($1, 'multi_branch')`, [biz.orgId]), /permission denied/)
    })
    await asUser(db, null, async (tx) => {
      await assert.rejects(tx.query(`select private.org_can_write($1)`, [biz.orgId]), /permission denied/)
    }, { role: 'anon' })
  })
})

describe('tenant suspendido o vencido', () => {
  for (const [name, get] of [['suspendido', () => suspended], ['vencido', () => expired]]) {
    test(`${name}: lee pero no escribe`, async () => {
      const t = get()
      await db.query(
        `insert into clients (organization_id, branch_id, code, legal_name, display_name)
         values ($1, $2, 'PRE', 'C', 'C')`,
        [t.orgId, t.branchId]
      )
      await asUser(db, t.users.admin, async (tx) => {
        assert.equal((await rowsOf(tx, `select id from clients where code = 'PRE'`)).length, 1)
      })
      await asUser(db, t.users.admin, async (tx) => {
        await assert.rejects(insertClient(tx, t, 'NEW'), RLS_DENIED)
      })
      await asUser(db, t.users.admin, async (tx) => {
        await assert.rejects(
          tx.query(`select rpc_create_request($1, '{"subject":"a","client_display_name":"b"}')`, [t.orgId]),
          /SUBSCRIPTION_INACTIVE/
        )
      })
    })
  }
})

describe('permisos y alcance de datos', () => {
  test('S4: el especialista solo lee lo asignado', async () => {
    const hidden = await seedRequest(db, biz, { code: 'S4H', dept: 'OPS', assigned: 'ops', createdBy: 'ops' })
    const mine = await seedRequest(db, biz, { code: 'S4M', dept: 'OPS', assigned: 'specialist', createdBy: 'ops' })
    await asUser(db, biz.users.specialist, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from requests where id = $1`, [hidden])).length, 0)
      assert.equal((await rowsOf(tx, `select id from requests where id = $1`, [mine])).length, 1)
    })
  })

  test('el coordinador lee su departamento y no otro', async () => {
    const own = await seedRequest(db, biz, { code: 'DOWN', dept: 'OPS', assigned: 'specialist', createdBy: 'admin' })
    const foreign = await seedRequest(db, biz, { code: 'DFOR', dept: 'COM', assigned: 'com', createdBy: 'admin' })
    await asUser(db, biz.users.ops, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from requests where id = $1`, [own])).length, 1)
      assert.equal((await rowsOf(tx, `select id from requests where id = $1`, [foreign])).length, 0)
    })
  })

  test('sin permisos granulares (Starter) el alcance es toda la organización', async () => {
    const { rows } = await db.query(
      `insert into requests (organization_id, code, subject, client_display_name, branch_id,
         assigned_member_id, created_by_member_id, due_label, approval_summary)
       values ($1, 'ST1', 's', 'c', $2, $3, $3, 'Hoy', 'x') returning id`,
      [starter.orgId, starter.branchId, starter.memberIds.admin]
    )
    await asUser(db, starter.users.specialist, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from requests where id = $1`, [rows[0].id])).length, 1)
    })
  })

  test('un rol sin permiso de escritura no crea clientes', async () => {
    await asUser(db, biz.users.viewer, async (tx) => {
      await assert.rejects(insertClient(tx, biz, 'VW'), RLS_DENIED)
    })
  })

  test('el rol de consulta no sube documentos', async () => {
    await asUser(db, biz.users.viewer, async (tx) => {
      await assert.rejects(
        tx.query(
          `insert into documents (organization_id, code, title, storage_path, uploaded_by_member_id)
           values ($1, 'D1', 't', $2, $3)`,
          [biz.orgId, `${biz.orgId}/documents/D1/a.pdf`, biz.memberIds.viewer]
        ),
        RLS_DENIED
      )
    })
  })

  test('un documento no puede apuntar a la ruta de otro tenant', async () => {
    await asUser(db, biz.users.admin, async (tx) => {
      await assert.rejects(
        tx.query(
          `insert into documents (organization_id, code, title, storage_path, uploaded_by_member_id)
           values ($1, 'D2', 't', $2, $3)`,
          [biz.orgId, `${other.orgId}/documents/D2/a.pdf`, biz.memberIds.admin]
        ),
        RLS_DENIED
      )
    })
  })
})

describe('capacidades Starter y Business', () => {
  const insertRule = (tx, t, code, scope) =>
    tx.query(
      `insert into automation_rules (organization_id, code, name, description, trigger_event, scope_type)
       values ($1, $2, 'n', 'd', 'e', $3)`,
      [t.orgId, code, scope]
    )

  test('automatización entre áreas: Business sí, Starter no', async () => {
    await asUser(db, biz.users.admin, async (tx) => {
      assert.equal((await insertRule(tx, biz, 'AR1', 'cross_department_workflow')).affectedRows, 1)
    })
    await asUser(db, starter.users.admin, async (tx) => {
      await assert.rejects(insertRule(tx, starter, 'AR2', 'cross_department_workflow'), RLS_DENIED)
    })
    await asUser(db, starter.users.admin, async (tx) => {
      assert.equal((await insertRule(tx, starter, 'AR3', 'basic_notification')).affectedRows, 1)
    })
  })

  test('Starter no crea departamentos', async () => {
    await asUser(db, starter.users.admin, async (tx) => {
      await assert.rejects(
        tx.query(`insert into departments (organization_id, branch_id, code, name) values ($1, $2, 'D', 'D')`, [starter.orgId, starter.branchId]),
        RLS_DENIED
      )
    })
  })

  test('un override con valor no booleano no rompe la evaluación', async () => {
    const t = await seedTenant(db, { slug: 'badov', members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }] })
    await db.query(
      `insert into organization_entitlements (organization_id, entitlement_key, value_json)
       values ($1, 'feature.cross_area_automations', '"no-booleano"')`,
      [t.orgId]
    )
    await asUser(db, t.users.admin, async (tx) => {
      assert.equal((await insertRule(tx, t, 'OV', 'cross_department_workflow')).affectedRows, 1)
    })
  })
})

describe('cuotas', () => {
  test('S5: Starter no supera su límite de sedes', async () => {
    await asUser(db, starter.users.admin, async (tx) => {
      await assert.rejects(
        tx.query(`insert into organization_branches (organization_id, code, name) values ($1, 'B2', 'Dos')`, [starter.orgId]),
        /BRANCH_QUOTA_EXCEEDED/
      )
    })
  })

  test('Business admite más sedes', async () => {
    await asUser(db, biz.users.admin, async (tx) => {
      const res = await tx.query(`insert into organization_branches (organization_id, code, name) values ($1, 'B2', 'Dos')`, [biz.orgId])
      assert.equal(res.affectedRows, 1)
    })
  })

  test('no se supera el límite de colaboradores, incluidos invitados', async () => {
    const t = await seedTenant(db, { slug: 'quota', members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }] })
    await db.query(
      `insert into organization_entitlements (organization_id, entitlement_key, value_json)
       values ($1, 'max_collaborators', '2')`,
      [t.orgId]
    )
    await createAuthUser(db, 'q1@quota.test')
    await createAuthUser(db, 'q2@quota.test')
    await asUser(db, t.users.admin, async (tx) => {
      await tx.query(`select rpc_invite_member($1, 'q1@quota.test', 'SPECIALIST')`, [t.orgId])
    })
    await asUser(db, t.users.admin, async (tx) => {
      await assert.rejects(
        tx.query(`select rpc_invite_member($1, 'q2@quota.test', 'SPECIALIST')`, [t.orgId]),
        /COLLABORATOR_QUOTA_EXCEEDED/
      )
    })
  })
})

describe('membresías', () => {
  test('S7: no se insertan membresías por escritura directa', async () => {
    const user = await createAuthUser(db, 'direct@a.test')
    await asUser(db, biz.users.admin, async (tx) => {
      await assert.rejects(
        tx.query(
          `insert into organization_members (organization_id, user_id, role_id, branch_id, job_title)
           values ($1, $2, $3, $4, 'x')`,
          [biz.orgId, user, biz.roleIds.ORG_ADMIN, biz.branchId]
        ),
        RLS_DENIED
      )
    })
  })

  test('invitación y aceptación', async () => {
    const user = await createAuthUser(db, 'invitado@a.test')
    await asUser(db, biz.users.admin, async (tx) => {
      await tx.query(`select rpc_invite_member($1, 'invitado@a.test', 'SPECIALIST')`, [biz.orgId])
    })
    await asUser(db, user, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from clients`)).length, 0)
      await tx.query(`select rpc_accept_invitation($1)`, [biz.orgId])
    })
    const [m] = await rowsOf(db, `select status from organization_members where user_id = $1`, [user])
    assert.equal(m.status, 'active')
  })

  test('no se acepta una invitación en un tenant suspendido', async () => {
    const user = await createAuthUser(db, 'inv-susp@a.test')
    await db.query(
      `insert into organization_members (organization_id, user_id, role_id, branch_id, job_title, status)
       values ($1, $2, $3, $4, 'x', 'invited')`,
      [suspended.orgId, user, suspended.roleIds.SPECIALIST, suspended.branchId]
    )
    await asUser(db, user, async (tx) => {
      await assert.rejects(tx.query(`select rpc_accept_invitation($1)`, [suspended.orgId]), /SUBSCRIPTION_INACTIVE/)
    })
  })

  test('nadie asigna un rol con más permisos que el propio', async () => {
    const t = await seedTenant(db, { slug: 'esc', members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }] })
    const { rows } = await db.query(
      `insert into roles (organization_id, code, name, default_scope) values ($1, 'HR', 'HR', 'ORG_WIDE') returning id`,
      [t.orgId]
    )
    await db.query(`insert into role_permissions (role_id, organization_id, permission_key) values ($1, $2, 'org:manage_members')`, [rows[0].id, t.orgId])
    const hr = await createAuthUser(db, 'hr@esc.test')
    await db.query(
      `insert into organization_members (organization_id, user_id, role_id, branch_id, job_title) values ($1, $2, $3, $4, 'hr')`,
      [t.orgId, hr, rows[0].id, t.branchId]
    )
    await createAuthUser(db, 'target@esc.test')
    await asUser(db, hr, async (tx) => {
      await assert.rejects(
        tx.query(`select rpc_invite_member($1, 'target@esc.test', 'ORG_ADMIN')`, [t.orgId]),
        /RBAC_PERMISSION_DENIED/
      )
    })
  })

  test('la organización conserva al menos un administrador', async () => {
    const t = await seedTenant(db, { slug: 'last', members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }] })
    await asUser(db, t.users.admin, async (tx) => {
      await assert.rejects(
        tx.query(`select rpc_update_member($1, $2, '{"status":"suspended"}')`, [t.orgId, t.memberIds.admin]),
        /LAST_ADMIN_PROTECTED/
      )
    })
  })

  test('S11: el correo no se edita desde el perfil, otros campos sí', async () => {
    await asUser(db, biz.users.specialist, async (tx) => {
      assert.equal((await tx.query(`update user_profiles set full_name = 'Nuevo' where id = $1`, [biz.users.specialist])).affectedRows, 1)
    })
    await asUser(db, biz.users.specialist, async (tx) => {
      await assert.rejects(tx.query(`update user_profiles set email = 'x@x.test' where id = $1`, [biz.users.specialist]), /permission denied/)
    })
  })
})

describe('solicitudes y aprobaciones', () => {
  test('S2: la escritura directa no cambia el estado', async () => {
    const id = await seedRequest(db, biz, { code: 'DIR', dept: 'OPS', assigned: 'ops', createdBy: 'ops' })
    await asUser(db, biz.users.admin, async (tx) => {
      assert.equal((await tx.query(`update requests set status = 'completed' where id = $1`, [id])).affectedRows, 0)
    })
  })

  test('creación con paso de aprobación por defecto en Business', async () => {
    await asUser(db, biz.users.ops, async (tx) => {
      const payload = { subject: 'Nueva', client_display_name: 'Cli', department_id: biz.deptIds.OPS }
      const [{ rpc_create_request: req }] = await rowsOf(tx, `select rpc_create_request($1, $2) `, [biz.orgId, payload])
      assert.ok(req)
      const [{ n }] = await rowsOf(tx, `select count(*)::int n from approval_steps a join requests r on r.id = a.request_id where r.subject = 'Nueva'`)
      assert.equal(n, 1)
    })
  })

  test('Starter crea solicitudes sin niveles de aprobación', async () => {
    await asUser(db, starter.users.admin, async (tx) => {
      await tx.query(`select rpc_create_request($1, '{"subject":"Inicial","client_display_name":"Cli"}')`, [starter.orgId])
      const [{ n }] = await rowsOf(tx, `select count(*)::int n from approval_steps a join requests r on r.id = a.request_id where r.subject = 'Inicial'`)
      assert.equal(n, 0)
    })
  })

  test('transición inválida', async () => {
    const id = await seedRequest(db, biz, { code: 'TI', dept: 'OPS', assigned: 'ops', createdBy: 'ops', status: 'completed' })
    await asUser(db, biz.users.ops, async (tx) => {
      await assert.rejects(tx.query(`select rpc_transition_request($1, $2, 'error')`, [biz.orgId, id]), /INVALID_STATE_TRANSITION/)
    })
  })

  test('no se cierra con aprobaciones pendientes', async () => {
    const id = await seedRequest(db, biz, { code: 'TP', dept: 'OPS', assigned: 'ops', createdBy: 'ops' })
    await seedApprovalStep(db, biz, id, { order: 1, dept: 'OPS' })
    await asUser(db, biz.users.ops, async (tx) => {
      await assert.rejects(tx.query(`select rpc_transition_request($1, $2, 'completed')`, [biz.orgId, id]), /PENDING_APPROVAL_STEPS/)
    })
  })

  test('el alcance se aplica en la transición', async () => {
    const id = await seedRequest(db, biz, { code: 'TS', dept: 'COM', assigned: 'com', createdBy: 'com' })
    await asUser(db, biz.users.ops, async (tx) => {
      await assert.rejects(tx.query(`select rpc_transition_request($1, $2, 'active')`, [biz.orgId, id]), /SCOPE_RESTRICTION_VIOLATION/)
    })
  })

  test('S1: la escritura directa no aprueba pasos', async () => {
    const id = await seedRequest(db, biz, { code: 'S1D', dept: 'OPS', assigned: 'ops', createdBy: 'ops' })
    const step = await seedApprovalStep(db, biz, id, { order: 1, dept: 'OPS' })
    await asUser(db, biz.users.ops, async (tx) => {
      assert.equal((await tx.query(`update approval_steps set status = 'approved' where id = $1`, [step])).affectedRows, 0)
    })
  })

  test('S1: no se aprueba un paso de otro departamento', async () => {
    const id = await seedRequest(db, biz, { code: 'S1O', dept: 'COM', assigned: 'ops', createdBy: 'ops' })
    const step = await seedApprovalStep(db, biz, id, { order: 1, dept: 'COM' })
    await asUser(db, biz.users.ops, async (tx) => {
      await assert.rejects(tx.query(`select rpc_decide_approval_step($1, $2, 'approved')`, [biz.orgId, step]), /SCOPE_RESTRICTION_VIOLATION/)
    })
  })

  test('los niveles se aprueban en orden y activan la solicitud', async () => {
    const id = await seedRequest(db, biz, { code: 'SEQ', dept: 'OPS', assigned: 'ops', createdBy: 'ops' })
    const first = await seedApprovalStep(db, biz, id, { order: 1, dept: 'OPS' })
    const second = await seedApprovalStep(db, biz, id, { order: 2, dept: 'OPS' })
    await asUser(db, biz.users.ops, async (tx) => {
      await assert.rejects(tx.query(`select rpc_decide_approval_step($1, $2, 'approved')`, [biz.orgId, second]), /PENDING_APPROVAL_STEPS/)
    })
    await asUser(db, biz.users.ops, async (tx) => {
      await tx.query(`select rpc_decide_approval_step($1, $2, 'approved')`, [biz.orgId, first])
      await tx.query(`select rpc_decide_approval_step($1, $2, 'approved')`, [biz.orgId, second])
    })
    const [req] = await rowsOf(db, `select status, approval_summary from requests where id = $1`, [id])
    assert.deepEqual(req, { status: 'active', approval_summary: 'Validado' })
  })

  test('el rechazo marca la solicitud en error', async () => {
    const id = await seedRequest(db, biz, { code: 'REJ', dept: 'OPS', assigned: 'ops', createdBy: 'ops' })
    const step = await seedApprovalStep(db, biz, id, { order: 1, dept: 'OPS' })
    await asUser(db, biz.users.ops, async (tx) => {
      await tx.query(`select rpc_decide_approval_step($1, $2, 'rejected', 'No cumple')`, [biz.orgId, step])
    })
    const [req] = await rowsOf(db, `select status from requests where id = $1`, [id])
    assert.equal(req.status, 'error')
  })
})

describe('auditoría', () => {
  test('S8: no se inserta auditoría directamente', async () => {
    await asUser(db, biz.users.specialist, async (tx) => {
      await assert.rejects(
        tx.query(
          `insert into audit_logs (organization_id, actor_user_id, actor_member_id, actor_role_code,
             module, entity_type, entity_id, action, summary)
           values ($1, $2, $3, 'ORG_ADMIN', 'm', 'e', '1', 'FORGED', 'x')`,
          [biz.orgId, biz.users.specialist, biz.memberIds.admin]
        ),
        RLS_DENIED
      )
    })
  })

  test('los cambios registran al actor real', async () => {
    await asUser(db, biz.users.admin, async (tx) => insertClient(tx, biz, 'AUD'))
    const [log] = await rowsOf(
      db,
      `select actor_user_id, actor_member_id, actor_role_code, origin from audit_logs
        where action = 'CLIENTS_INSERT' and sanitized_changes ->> 'code' = 'AUD'`
    )
    assert.deepEqual(log, {
      actor_user_id: biz.users.admin,
      actor_member_id: biz.memberIds.admin,
      actor_role_code: 'ORG_ADMIN',
      origin: 'server',
    })
  })

  test('los eventos de cliente se sanean y conservan al actor real', async () => {
    await asUser(db, biz.users.specialist, async (tx) => {
      await tx.query(
        `select rpc_record_client_event($1, 'core.auth', 'session', 's1', 'LOGIN', 'x', $2)`,
        [biz.orgId, { password: 'nope', nested: { api_key: 'nope', ok: 1 } }]
      )
    })
    const [log] = await rowsOf(db, `select actor_member_id, origin, sanitized_changes from audit_logs where action = 'LOGIN'`)
    assert.equal(log.actor_member_id, biz.memberIds.specialist)
    assert.equal(log.origin, 'client')
    assert.deepEqual(log.sanitized_changes, { password: '[REDACTED]', nested: { api_key: '[REDACTED]', ok: 1 } })
  })

  test('los eventos de cliente no admiten módulos del servidor', async () => {
    await asUser(db, biz.users.specialist, async (tx) => {
      await assert.rejects(
        tx.query(`select rpc_record_client_event($1, 'db.requests', 'r', '1', 'X', 'x')`, [biz.orgId]),
        /VALIDATION_ERROR/
      )
    })
  })

  test('la auditoría es inmutable', async () => {
    await assert.rejects(db.query(`update audit_logs set summary = 'x'`), /inmutable/)
    await assert.rejects(db.query(`delete from audit_logs`), /inmutable/)
    await assert.rejects(db.query(`truncate audit_logs`), /inmutable/)
  })
})

describe('Platform Admin', () => {
  test('S6: el auditor lee pero no modifica', async () => {
    await asUser(db, auditor, async (tx) => {
      assert.ok((await rowsOf(tx, `select id from organizations`)).length > 0)
      assert.equal((await tx.query(`update plan_catalog set price_monthly_usd = 1 where plan_code = 'business'`)).affectedRows, 0)
      assert.equal((await tx.query(`update organization_subscriptions set notes = 'x' where organization_id = $1`, [biz.orgId])).affectedRows, 0)
    })
  })

  test('PLATFORM_OPS gestiona suscripciones pero no el catálogo', async () => {
    await asUser(db, opsAdmin, async (tx) => {
      assert.equal((await tx.query(`update organization_subscriptions set notes = 'ops' where organization_id = $1`, [biz.orgId])).affectedRows, 1)
      assert.equal((await tx.query(`update plan_catalog set price_monthly_usd = 1 where plan_code = 'business'`)).affectedRows, 0)
    })
  })

  test('SUPER_ADMIN gestiona el catálogo', async () => {
    await asUser(db, superAdmin, async (tx) => {
      assert.equal((await tx.query(`update plan_catalog set description = 'd' where plan_code = 'business'`)).affectedRows, 1)
    })
  })

  test('es independiente de las membresías y no lee datos operativos', async () => {
    await seedRequest(db, biz, { code: 'PA', dept: 'OPS', assigned: 'ops', createdBy: 'ops' })
    await asUser(db, superAdmin, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from requests`)).length, 0)
      assert.equal((await rowsOf(tx, `select id from clients`)).length, 0)
    })
  })

  test('un administrador de tenant no gestiona la plataforma', async () => {
    await asUser(db, biz.users.admin, async (tx) => {
      assert.equal((await tx.query(`update organization_subscriptions set plan_code = 'business' where organization_id = $1`, [biz.orgId])).affectedRows, 0)
      assert.equal((await tx.query(`update organizations set status = 'active' where id = $1`, [biz.orgId])).affectedRows, 0)
    })
    await asUser(db, biz.users.admin, async (tx) => {
      await assert.rejects(
        tx.query(`insert into platform_admins (user_id, email, full_name) values ($1, 'a@a.test', 'a')`, [biz.users.admin]),
        RLS_DENIED
      )
    })
  })
})

describe('Storage', () => {
  const upload = (tx, name, size = 10) =>
    tx.query(
      `insert into storage.objects (bucket_id, name, metadata) values ('coreflow-documents', $1, $2)`,
      [name, { size }]
    )

  test('se sube dentro del tenant propio', async () => {
    await asUser(db, biz.users.admin, async (tx) => {
      assert.equal((await upload(tx, `${biz.orgId}/documents/D/a.pdf`)).affectedRows, 1)
    })
  })

  test('no se sube al prefijo de otro tenant', async () => {
    await asUser(db, biz.users.admin, async (tx) => {
      await assert.rejects(upload(tx, `${other.orgId}/documents/D/a.pdf`), RLS_DENIED)
    })
  })

  test('una ruta que no sea UUID se deniega sin error de conversión', async () => {
    await asUser(db, biz.users.admin, async (tx) => {
      await assert.rejects(upload(tx, `no-es-uuid/a.pdf`), RLS_DENIED)
    })
  })

  test('otro tenant no lee el archivo', async () => {
    await db.query(`insert into storage.objects (bucket_id, name, metadata) values ('coreflow-documents', $1, '{"size":1}')`, [`${biz.orgId}/documents/R/r.pdf`])
    await asUser(db, other.users.admin, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from storage.objects where name like $1`, [`${biz.orgId}/%`])).length, 0)
    })
  })

  test('se bloquea la carga con la cuota agotada', async () => {
    const t = await seedTenant(db, { slug: 'stq', members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }] })
    await db.query(`insert into organization_entitlements (organization_id, entitlement_key, value_json) values ($1, 'max_storage_mb', '1')`, [t.orgId])
    await db.query(`insert into storage.objects (bucket_id, name, metadata) values ('coreflow-documents', $1, '{"size":1048576}')`, [`${t.orgId}/documents/F/full.pdf`])
    await asUser(db, t.users.admin, async (tx) => {
      await assert.rejects(upload(tx, `${t.orgId}/documents/F/more.pdf`), RLS_DENIED)
    })
  })
})

describe('aprovisionamiento', () => {
  const params = (slug, extra = {}) => ({
    slug, display_name: slug, plan_code: 'starter', role_templates: TEMPLATES, ...extra,
  })

  test('crea la estructura completa y deja operar al administrador', async () => {
    const admin = await createAuthUser(db, 'prov@a.test')
    let result
    await asUser(db, superAdmin, async (tx) => {
      const rows = await rowsOf(tx, `select rpc_provision_organization($1) as r`, [params('prov', { admin_user_id: admin })])
      result = rows[0].r
    })
    const counts = await rowsOf(
      db,
      `select (select count(*)::int from roles where organization_id = $1) roles,
              (select count(*)::int from organization_branches where organization_id = $1) branches,
              (select count(*)::int from departments where organization_id = $1) departments,
              (select count(*)::int from organization_members where organization_id = $1) members,
              (select plan_code from organization_subscriptions where organization_id = $1) plan`,
      [result.organization_id]
    )
    assert.deepEqual(counts[0], { roles: TEMPLATES.length, branches: 1, departments: 1, members: 1, plan: 'starter' })
    await asUser(db, admin, async (tx) => {
      const res = await tx.query(
        `insert into clients (organization_id, branch_id, code, legal_name, display_name) values ($1, $2, 'P1', 'C', 'C')`,
        [result.organization_id, result.branch_id]
      )
      assert.equal(res.affectedRows, 1)
    })
  })

  test('es idempotente', async () => {
    const admin = await createAuthUser(db, 'idem@a.test')
    const run = () =>
      asUser(db, null, async (tx) => (await rowsOf(tx, `select rpc_provision_organization($1) as r`, [params('idem', { admin_user_id: admin })]))[0].r, { role: 'service_role' })
    const first = await run()
    const second = await run()
    assert.deepEqual(first, second)
    const [{ n }] = await rowsOf(db, `select count(*)::int n from organization_members where organization_id = $1`, [first.organization_id])
    assert.equal(n, 1)
  })

  test('desde la API no se altera un tenant existente', async () => {
    const before_ = await rowsOf(db, `select count(*)::int n from organization_members where organization_id = $1`, [biz.orgId])
    for (const admin of [opsAdmin, superAdmin]) {
      await asUser(db, admin, async (tx) => {
        await assert.rejects(
          tx.query(`select rpc_provision_organization($1)`, [params('biz', { role_templates: [{ code: 'ORG_ADMIN', name: 'x', defaultScope: 'ORG_WIDE', permissions: [] }] })]),
          /ORGANIZATION_ALREADY_EXISTS/
        )
      })
    }
    assert.deepEqual(await rowsOf(db, `select count(*)::int n from organization_members where organization_id = $1`, [biz.orgId]), before_)
  })

  test('un Platform Admin no se hace administrador de un tenant', async () => {
    await asUser(db, opsAdmin, async (tx) => {
      await assert.rejects(
        tx.query(`select rpc_provision_organization($1)`, [params('selfadmin', { admin_user_id: opsAdmin })]),
        /Platform Admin no puede ser administrador/
      )
    })
  })

  test('repetir el aprovisionamiento no reactiva ni extiende una suscripción', async () => {
    const run = () =>
      asUser(db, null, async (tx) => (await rowsOf(tx, `select rpc_provision_organization($1) as r`, [params('rerun')]))[0].r, { role: 'service_role' })
    const { organization_id: orgId } = await run()
    await db.query(
      `update organization_subscriptions set status = 'suspended', valid_until = '2021-01-01' where organization_id = $1`,
      [orgId]
    )
    await run()
    const [sub] = await rowsOf(db, `select status, valid_until from organization_subscriptions where organization_id = $1`, [orgId])
    assert.equal(sub.status, 'suspended')
    assert.equal(new Date(sub.valid_until).getUTCFullYear(), 2021)
  })

  test('se rechaza a quien no es Platform Admin y al nivel auditor', async () => {
    for (const user of [biz.users.admin, auditor]) {
      await asUser(db, user, async (tx) => {
        await assert.rejects(tx.query(`select rpc_provision_organization($1)`, [params('no')]), /PLATFORM_ADMIN_REQUIRED/)
      })
    }
  })

  test('no admite el plan retirado start', async () => {
    await asUser(db, superAdmin, async (tx) => {
      await assert.rejects(tx.query(`select rpc_provision_organization($1)`, [params('old', { plan_code: 'start' })]), /PLAN_NOT_AVAILABLE/)
    })
  })
})
