// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * NIVEL SIMULADA — Especificación Starter v1.0, versiones de documentos y métricas.
 * PostgreSQL embebido con Auth y Storage simulados: no equivale a Supabase real.
 * La concurrencia de cuotas no se ejercita aquí: una sola conexión no la reproduce.
 */

import { test, before, after, describe } from 'node:test'
import assert from 'node:assert/strict'
import { asUser, createAuthUser, createDatabase, seedRequest, seedTenant } from './harness.mjs'
import { getRoleTemplatesForPlan } from '../../src/core/config/permissionsCatalog.js'

const RLS_DENIED = /row-level security policy/
const BUCKET = 'coreflow-documents'
let db, starter, biz

const rowsOf = async (tx, sql, params) => (await tx.query(sql, params)).rows
const count = async (sql, params) => (await db.query(sql, params)).rows[0].n
const rule = (tx, t, code, status = 'active') =>
  tx.query(
    `insert into automation_rules (organization_id, code, name, description, trigger_event, status)
     values ($1, $2, 'n', 'd', 'e', $3)`,
    [t.orgId, code, status]
  )
const setStorage = (t, mb) =>
  db.query(
    `insert into organization_entitlements (organization_id, entitlement_key, value_json)
     values ($1, 'max_storage_mb', $2) on conflict (organization_id, entitlement_key) do update set value_json = excluded.value_json`,
    [t.orgId, mb]
  )
const putObject = (t, documentId, name, userId, size = 100) =>
  asUser(db, userId, (tx) =>
    tx.query(
      `insert into storage.objects (bucket_id, name, owner_id, metadata) values ($1, $2, $3, $4)`,
      [BUCKET, `${t.orgId}/documents/${documentId}/${name}`, userId, { size, mimetype: 'application/pdf' }]
    )
  )
const newId = async () => (await db.query(`select gen_random_uuid() as id`)).rows[0].id

before(async () => {
  db = await createDatabase()
  starter = await seedTenant(db, {
    slug: 'st',
    plan: 'starter',
    departments: ['GEN'],
    members: [
      { key: 'admin', role: 'ORG_ADMIN', dept: 'GEN' },
      { key: 'supervisor', role: 'SUPERVISOR', dept: 'GEN' },
      { key: 'collab', role: 'COLLABORATOR', dept: 'GEN' },
      { key: 'collab2', role: 'COLLABORATOR', dept: 'GEN' },
    ],
  })
  biz = await seedTenant(db, {
    slug: 'bz',
    members: [
      { key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' },
      { key: 'viewer', role: 'AUDITOR_VIEWER' },
    ],
  })
})

after(async () => {
  await db?.close()
})

describe('catálogo Starter', () => {
  test('sin IA, sin capacidad fija, con los nuevos límites', async () => {
    const [{ limits_json: limits, features_json: features }] = await rowsOf(db, `select limits_json, features_json from plan_catalog where plan_code = 'starter'`)
    assert.equal(features.ai_assistant, false)
    assert.equal('max_storage_mb' in limits, false)
    assert.equal(limits.max_collaborators, 15)
    assert.equal(limits.max_branches, 1)
    assert.equal(limits.max_admins, 2)
    assert.equal(limits.max_active_automations, 3)
  })

  test('las capacidades indican almacenamiento sin configurar', async () => {
    await asUser(db, starter.users.admin, async (tx) => {
      const [{ c }] = await rowsOf(tx, `select rpc_get_org_capabilities($1) c`, [starter.orgId])
      assert.equal(c.limits.max_storage_mb, null)
      assert.equal(c.limits.max_admins, 2)
      assert.equal(c.features.ai_assistant, false)
    })
  })

  test('Starter tiene exactamente 3 roles', () => {
    assert.deepEqual(getRoleTemplatesForPlan('starter').map((t) => t.code), ['ORG_ADMIN', 'SUPERVISOR', 'COLLABORATOR'])
  })

  test('no se pueden crear otros roles en Starter', async () => {
    await assert.rejects(
      db.query(`insert into roles (organization_id, code, name, default_scope) values ($1, 'OTRO', 'x', 'ORG_WIDE')`, [starter.orgId]),
      /ROLE_NOT_ALLOWED_IN_PLAN/
    )
  })

  test('la organización conserva exactamente sus 3 roles', async () => {
    await assert.rejects(
      db.query(`update roles set code = 'OPS_COORDINATOR' where organization_id = $1 and code = 'SUPERVISOR'`, [starter.orgId]),
      /ROLE_NOT_ALLOWED_IN_PLAN/
    )
    const rows = await rowsOf(db, `select code from roles where organization_id = $1 order by code`, [starter.orgId])
    assert.deepEqual(rows.map((r) => r.code), ['COLLABORATOR', 'ORG_ADMIN', 'SUPERVISOR'])
  })

  test('los roles fijos no se editan desde la API', async () => {
    await asUser(db, starter.users.admin, async (tx) => {
      assert.equal((await tx.query(`update roles set name = 'x' where organization_id = $1`, [starter.orgId])).affectedRows, 0)
    })
  })

  test('el miembro nuevo queda en el área general', async () => {
    await createAuthUser(db, 'area@st.test')
    await asUser(db, starter.users.admin, async (tx) => {
      const [{ m }] = await rowsOf(tx, `select to_jsonb(rpc_invite_member($1, 'area@st.test', 'COLLABORATOR')) m`, [starter.orgId])
      assert.equal(m.department_id, starter.deptIds.GEN)
    })
  })
})

describe('máximo de administradores', () => {
  test('no se supera con invitaciones ni con cambios de rol', async () => {
    const t = await seedTenant(db, {
      slug: 'adm',
      plan: 'starter',
      departments: ['GEN'],
      members: [
        { key: 'a1', role: 'ORG_ADMIN', dept: 'GEN' },
        { key: 'a2', role: 'ORG_ADMIN', dept: 'GEN' },
        { key: 'c1', role: 'COLLABORATOR', dept: 'GEN' },
      ],
    })
    await createAuthUser(db, 'tercero@adm.test')
    await asUser(db, t.users.a1, async (tx) => {
      await assert.rejects(tx.query(`select rpc_invite_member($1, 'tercero@adm.test', 'ORG_ADMIN')`, [t.orgId]), /ADMIN_QUOTA_EXCEEDED/)
    })
    await asUser(db, t.users.a1, async (tx) => {
      await assert.rejects(tx.query(`select rpc_update_member($1, $2, '{"role_code":"ORG_ADMIN"}')`, [t.orgId, t.memberIds.c1]), /ADMIN_QUOTA_EXCEEDED/)
    })
  })

  test('liberar un cupo permite promover', async () => {
    const t = await seedTenant(db, {
      slug: 'adm2',
      plan: 'starter',
      departments: ['GEN'],
      members: [
        { key: 'a1', role: 'ORG_ADMIN', dept: 'GEN' },
        { key: 'a2', role: 'ORG_ADMIN', dept: 'GEN' },
        { key: 'c1', role: 'COLLABORATOR', dept: 'GEN' },
      ],
    })
    await asUser(db, t.users.a1, async (tx) => {
      await tx.query(`select rpc_update_member($1, $2, '{"status":"suspended"}')`, [t.orgId, t.memberIds.a2])
      await tx.query(`select rpc_update_member($1, $2, '{"role_code":"ORG_ADMIN"}')`, [t.orgId, t.memberIds.c1])
    })
  })

  test('Business no tiene ese límite', async () => {
    const t = await seedTenant(db, {
      slug: 'adm3',
      members: [1, 2, 3].map((i) => ({ key: `a${i}`, role: 'ORG_ADMIN', dept: 'OPS' })),
    })
    assert.equal(Object.keys(t.memberIds).length, 3)
  })
})

describe('máximo de automatizaciones activas', () => {
  test('no se crea una cuarta activa, pero sí inactiva', async () => {
    const t = await seedTenant(db, { slug: 'aut', plan: 'starter', departments: ['GEN'], members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'GEN' }] })
    await asUser(db, t.users.admin, async (tx) => {
      for (const code of ['R1', 'R2', 'R3']) await rule(tx, t, code)
    })
    await asUser(db, t.users.admin, async (tx) => {
      await assert.rejects(rule(tx, t, 'R4'), /AUTOMATION_QUOTA_EXCEEDED/)
    })
    await asUser(db, t.users.admin, async (tx) => rule(tx, t, 'R5', 'pending'))
  })

  test('no se activa una cuarta y al desactivar se libera el cupo', async () => {
    const t = await seedTenant(db, { slug: 'aut2', plan: 'starter', departments: ['GEN'], members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'GEN' }] })
    await asUser(db, t.users.admin, async (tx) => {
      for (const code of ['R1', 'R2', 'R3']) await rule(tx, t, code)
      await rule(tx, t, 'R4', 'pending')
    })
    await asUser(db, t.users.admin, async (tx) => {
      await assert.rejects(tx.query(`update automation_rules set status = 'active' where code = 'R4' and organization_id = $1`, [t.orgId]), /AUTOMATION_QUOTA_EXCEEDED/)
    })
    await asUser(db, t.users.admin, async (tx) => {
      await tx.query(`update automation_rules set status = 'pending' where code = 'R1' and organization_id = $1`, [t.orgId])
      const res = await tx.query(`update automation_rules set status = 'active' where code = 'R4' and organization_id = $1`, [t.orgId])
      assert.equal(res.affectedRows, 1)
    })
  })

  test('un plan con override admite el valor configurado', async () => {
    const t = await seedTenant(db, { slug: 'aut3', plan: 'starter', departments: ['GEN'], members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'GEN' }] })
    await db.query(`insert into organization_entitlements (organization_id, entitlement_key, value_json) values ($1, 'max_active_automations', '1')`, [t.orgId])
    await asUser(db, t.users.admin, async (tx) => rule(tx, t, 'R1'))
    await asUser(db, t.users.admin, async (tx) => {
      await assert.rejects(rule(tx, t, 'R2'), /AUTOMATION_QUOTA_EXCEEDED/)
    })
  })
})

describe('alcance de roles Starter', () => {
  test('el Colaborador solo gestiona tareas asignadas', async () => {
    const insertTask = (code, member) =>
      db.query(
        `insert into tasks (organization_id, code, title, assigned_member_id) values ($1, $2, 't', $3) returning id`,
        [starter.orgId, code, member]
      )
    const mine = (await insertTask('T-MINE', starter.memberIds.collab)).rows[0].id
    const other = (await insertTask('T-OTHER', starter.memberIds.collab2)).rows[0].id

    await asUser(db, starter.users.collab, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from tasks where id = $1`, [mine])).length, 1)
      assert.equal((await rowsOf(tx, `select id from tasks where id = $1`, [other])).length, 0)
      assert.equal((await tx.query(`update tasks set status = 'completed' where id = $1`, [other])).affectedRows, 0)
    })
    await asUser(db, starter.users.supervisor, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from tasks where id = $1`, [other])).length, 1)
    })
  })

  test('Supervisor y Colaborador no gestionan automatizaciones ni colaboradores', async () => {
    for (const key of ['supervisor', 'collab']) {
      await asUser(db, starter.users[key], async (tx) => {
        await assert.rejects(rule(tx, starter, `X-${key}`), RLS_DENIED)
      })
      await asUser(db, starter.users[key], async (tx) => {
        await assert.rejects(tx.query(`select rpc_invite_member($1, 'area@st.test', 'COLLABORATOR')`, [starter.orgId]), /RBAC_PERMISSION_DENIED/)
      })
    }
  })
})

describe('documentos y versiones', () => {
  const create = (t, user, id, path, payload = { title: 'Contrato' }) =>
    asUser(db, user, async (tx) => (await rowsOf(tx, `select to_jsonb(rpc_create_document($1, $2, $3, $4)) d`, [t.orgId, id, path, payload]))[0].d)
  const path = (t, id, name) => `${t.orgId}/documents/${id}/${name}`

  test('sin capacidad configurada no se sube ni se registra', async () => {
    const id = await newId()
    await assert.rejects(putObject(starter, id, 'v1/a.pdf', starter.users.admin), RLS_DENIED)
    await assert.rejects(create(starter, starter.users.admin, id, path(starter, id, 'v1/a.pdf')), /STORAGE_QUOTA_NOT_CONFIGURED/)
  })

  test('con capacidad configurada se crea con versión 1 y tamaño real', async () => {
    await setStorage(starter, 10)
    const id = await newId()
    await putObject(starter, id, 'v1/a.pdf', starter.users.admin, 321)
    const doc = await create(starter, starter.users.admin, id, path(starter, id, 'v1/a.pdf'))
    assert.equal(doc.version, 'v1.0')
    assert.equal(Number(doc.size_bytes), 321)
    assert.ok(doc.current_version_id)
  })

  test('registrar sin archivo en Storage falla', async () => {
    const id = await newId()
    await assert.rejects(create(biz, biz.users.admin, id, path(biz, id, 'no/existe.pdf')), /STORAGE_OBJECT_NOT_FOUND/)
  })

  test('una ruta ajena al documento se rechaza', async () => {
    const id = await newId()
    const otherId = await newId()
    await putObject(biz, otherId, 'v1/a.pdf', biz.users.admin)
    await assert.rejects(create(biz, biz.users.admin, id, path(biz, otherId, 'v1/a.pdf')), /VALIDATION_ERROR/)
  })

  test('las versiones se numeran, conservan y actualizan la vigente', async () => {
    const id = await newId()
    await putObject(biz, id, 'a/1.pdf', biz.users.admin, 10)
    await create(biz, biz.users.admin, id, path(biz, id, 'a/1.pdf'))
    await putObject(biz, id, 'b/2.pdf', biz.users.admin, 20)
    await asUser(db, biz.users.admin, (tx) => tx.query(`select rpc_add_document_version($1, $2, $3, 'Cambios')`, [biz.orgId, id, path(biz, id, 'b/2.pdf')]))

    const versions = await rowsOf(db, `select version_number, size_bytes::int s, comment from document_versions where document_id = $1 order by 1`, [id])
    assert.deepEqual(versions, [
      { version_number: 1, s: 10, comment: null },
      { version_number: 2, s: 20, comment: 'Cambios' },
    ])
    const [doc] = await rowsOf(db, `select version, storage_path from documents where id = $1`, [id])
    assert.equal(doc.version, 'v2.0')
    assert.equal(doc.storage_path, path(biz, id, 'b/2.pdf'))
  })

  test('las versiones son inmutables y no se insertan directamente', async () => {
    const id = await newId()
    await putObject(biz, id, 'i/1.pdf', biz.users.admin)
    await create(biz, biz.users.admin, id, path(biz, id, 'i/1.pdf'))
    await assert.rejects(db.query(`update document_versions set comment = 'x' where document_id = $1`, [id]), /inmutables/)
    await assert.rejects(db.query(`delete from document_versions where document_id = $1`, [id]), /inmutables/)
    await asUser(db, biz.users.admin, async (tx) => {
      await assert.rejects(
        tx.query(
          `insert into document_versions (organization_id, document_id, version_number, storage_path, size_bytes, mime_type, uploaded_by_member_id)
           values ($1, $2, 9, 'x', 0, 'a', $3)`,
          [biz.orgId, id, biz.memberIds.admin]
        ),
        RLS_DENIED
      )
    })
  })

  test('no se editan los campos de versión del documento', async () => {
    const id = await newId()
    await putObject(biz, id, 'e/1.pdf', biz.users.admin)
    await create(biz, biz.users.admin, id, path(biz, id, 'e/1.pdf'))
    await asUser(db, biz.users.admin, async (tx) => {
      await assert.rejects(tx.query(`update documents set storage_path = 'x' where id = $1`, [id]), /permission denied/)
    })
    await asUser(db, biz.users.admin, async (tx) => {
      assert.equal((await tx.query(`update documents set title = 'Nuevo' where id = $1`, [id])).affectedRows, 1)
    })
  })

  test('el documento no admite inserción directa', async () => {
    await asUser(db, biz.users.admin, async (tx) => {
      await assert.rejects(
        tx.query(`insert into documents (organization_id, code, title, storage_path, uploaded_by_member_id) values ($1, 'D', 't', 'p', $2)`, [biz.orgId, biz.memberIds.admin]),
        RLS_DENIED
      )
    })
  })

  test('un documento se asocia a tareas y oportunidades del mismo tenant', async () => {
    const task = (await db.query(`insert into tasks (organization_id, code, title) values ($1, 'T-DOC', 't') returning id`, [biz.orgId])).rows[0].id
    const id = await newId()
    await putObject(biz, id, 'as/1.pdf', biz.users.admin)
    const doc = await create(biz, biz.users.admin, id, path(biz, id, 'as/1.pdf'), { title: 'T', task_id: task })
    assert.equal(doc.task_id, task)

    const foreign = (await db.query(`insert into tasks (organization_id, code, title) values ($1, 'T-OTRO', 't') returning id`, [starter.orgId])).rows[0].id
    const id2 = await newId()
    await putObject(biz, id2, 'as/2.pdf', biz.users.admin)
    await assert.rejects(create(biz, biz.users.admin, id2, path(biz, id2, 'as/2.pdf'), { title: 'T', task_id: foreign }), /violates foreign key/)
  })

  test('un archivo registrado no se borra ni se reemplaza', async () => {
    const id = await newId()
    await putObject(biz, id, 'p/1.pdf', biz.users.admin)
    await create(biz, biz.users.admin, id, path(biz, id, 'p/1.pdf'))
    await asUser(db, biz.users.admin, async (tx) => {
      assert.equal((await tx.query(`delete from storage.objects where name = $1`, [path(biz, id, 'p/1.pdf')])).affectedRows, 0)
      assert.equal((await tx.query(`update storage.objects set metadata = '{}' where name = $1`, [path(biz, id, 'p/1.pdf')])).affectedRows, 0)
    })
  })

  test('quien subió un archivo sin registrar puede retirarlo', async () => {
    const id = await newId()
    await putObject(starter, id, 'o/1.pdf', starter.users.collab)
    await asUser(db, starter.users.collab2, async (tx) => {
      assert.equal((await tx.query(`delete from storage.objects where name = $1`, [path(starter, id, 'o/1.pdf')])).affectedRows, 0)
    })
    await asUser(db, starter.users.collab, async (tx) => {
      assert.equal((await tx.query(`delete from storage.objects where name = $1`, [path(starter, id, 'o/1.pdf')])).affectedRows, 1)
    })
  })

  test('otro tenant no lee el archivo ni la versión', async () => {
    const id = await newId()
    await putObject(biz, id, 's/1.pdf', biz.users.admin)
    await create(biz, biz.users.admin, id, path(biz, id, 's/1.pdf'))
    await asUser(db, starter.users.admin, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from storage.objects where name = $1`, [path(biz, id, 's/1.pdf')])).length, 0)
      assert.equal((await rowsOf(tx, `select id from document_versions where document_id = $1`, [id])).length, 0)
    })
  })

  test('un archivo sin registrar solo lo ve quien lo subió', async () => {
    const id = await newId()
    await putObject(starter, id, 'u/1.pdf', starter.users.collab)
    const name = path(starter, id, 'u/1.pdf')
    await asUser(db, starter.users.collab, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from storage.objects where name = $1`, [name])).length, 1)
    })
    for (const key of ['collab2', 'admin']) {
      await asUser(db, starter.users[key], async (tx) => {
        assert.equal((await rowsOf(tx, `select id from storage.objects where name = $1`, [name])).length, 0)
      })
    }
  })

  test('no se registra un archivo que subió otra persona', async () => {
    const id = await newId()
    await putObject(starter, id, 'x/1.pdf', starter.users.collab)
    await assert.rejects(create(starter, starter.users.admin, id, path(starter, id, 'x/1.pdf')), /STORAGE_OBJECT_NOT_FOUND/)
  })

  test('un archivo registrado sigue el alcance de su documento', async () => {
    const t = await seedTenant(db, {
      slug: 'scope-doc',
      members: [
        { key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' },
        { key: 'other', role: 'OPS_COORDINATOR', dept: 'COM' },
      ],
    })
    await db.query(`update role_permissions set scope_override = 'DEPARTMENT_SCOPE' where organization_id = $1 and permission_key = 'documents:read' and role_id = $2`, [t.orgId, t.roleIds.OPS_COORDINATOR])
    const id = await newId()
    await putObject(t, id, 'a/1.pdf', t.users.admin)
    await create(t, t.users.admin, id, path(t, id, 'a/1.pdf'), { title: 'Interno', department_id: t.deptIds.OPS })
    await asUser(db, t.users.other, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from storage.objects where name = $1`, [path(t, id, 'a/1.pdf')])).length, 0)
    })
    await asUser(db, t.users.admin, async (tx) => {
      assert.equal((await rowsOf(tx, `select id from storage.objects where name = $1`, [path(t, id, 'a/1.pdf')])).length, 1)
    })
  })

  test('un rol sin permiso de escritura no añade versiones', async () => {
    const id = await newId()
    await putObject(biz, id, 'r/1.pdf', biz.users.admin)
    await create(biz, biz.users.admin, id, path(biz, id, 'r/1.pdf'))
    await asUser(db, biz.users.viewer, async (tx) => {
      await assert.rejects(tx.query(`select rpc_add_document_version($1, $2, 'x')`, [biz.orgId, id]), /RBAC_PERMISSION_DENIED/)
    })
  })
})

describe('métricas', () => {
  const metrics = (t, user, period = '7d') =>
    asUser(db, user, async (tx) => (await rowsOf(tx, `select rpc_get_org_metrics($1, $2) m`, [t.orgId, period]))[0].m)

  test('una organización vacía da ceros reales, sin cifras inventadas', async () => {
    const t = await seedTenant(db, { slug: 'mt0', members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }] })
    const m = await metrics(t, t.users.admin)
    assert.equal(m.acumulados.clientesTotal, 0)
    assert.equal(m.acumulados.documentosTotales, 0)
    assert.equal(m.periodo.solicitudesResueltas, 0)
    assert.deepEqual(m.periodo.series.solicitudes, [0, 0, 0, 0, 0, 0, 0])
    assert.equal(m.periodo.cumplimientoSla, 'N/D')
    assert.equal(m.periodo.deltas.clientes, 'N/D')
  })

  test('los indicadores reflejan los registros', async () => {
    const t = await seedTenant(db, { slug: 'mt1', members: [{ key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' }] })
    await db.query(`insert into clients (organization_id, branch_id, code, legal_name, display_name) values ($1, $2, 'C1', 'c', 'c')`, [t.orgId, t.branchId])
    await seedRequest(db, t, { code: 'Q1', dept: 'OPS', assigned: 'admin', createdBy: 'admin' })
    await seedRequest(db, t, { code: 'Q2', dept: 'OPS', assigned: 'admin', createdBy: 'admin', status: 'completed' })
    const m = await metrics(t, t.users.admin)
    assert.equal(m.acumulados.clientesTotal, 1)
    assert.equal(m.acumulados.solicitudesEnSeguimiento, 1)
    assert.equal(m.periodo.solicitudesResueltas, 1)
    assert.equal(m.periodo.series.solicitudes.reduce((a, b) => a + b, 0), 2)
  })

  test('cada rol ve las cifras de lo que puede leer', async () => {
    const t = await seedTenant(db, {
      slug: 'mt2',
      plan: 'starter',
      departments: ['GEN'],
      members: [
        { key: 'admin', role: 'ORG_ADMIN', dept: 'GEN' },
        { key: 'collab', role: 'COLLABORATOR', dept: 'GEN' },
      ],
    })
    await seedRequest(db, t, { code: 'Q1', dept: 'GEN', assigned: 'admin', createdBy: 'admin' })
    assert.equal((await metrics(t, t.users.admin)).acumulados.solicitudesEnSeguimiento, 1)
    assert.equal((await metrics(t, t.users.collab)).acumulados.solicitudesEnSeguimiento, 0)
  })

  test('las métricas respetan el alcance en cada categoría', async () => {
    const t = await seedTenant(db, {
      slug: 'mt3',
      members: [
        { key: 'admin', role: 'ORG_ADMIN', dept: 'OPS' },
        { key: 'ops', role: 'OPS_COORDINATOR', dept: 'OPS' },
        { key: 'spec', role: 'SPECIALIST', dept: 'COM' },
      ],
    })
    await seedRequest(db, t, { code: 'R-OPS', dept: 'OPS', assigned: 'admin', createdBy: 'admin' })
    await seedRequest(db, t, { code: 'R-COM', dept: 'COM', assigned: 'admin', createdBy: 'admin' })
    await db.query(
      `insert into tasks (organization_id, code, title, department_id, assigned_member_id)
       values ($1, 'T-OPS', 't', $2, $4), ($1, 'T-COM', 't', $3, $4)`,
      [t.orgId, t.deptIds.OPS, t.deptIds.COM, t.memberIds.admin]
    )
    await db.query(
      `insert into clients (organization_id, branch_id, code, legal_name, display_name, owner_member_id)
       values ($1, $2, 'C-A', 'c', 'c', $3), ($1, $2, 'C-B', 'c', 'c', $4)`,
      [t.orgId, t.branchId, t.memberIds.admin, t.memberIds.spec]
    )

    const admin = await metrics(t, t.users.admin)
    assert.equal(admin.acumulados.solicitudesEnSeguimiento, 2)
    assert.equal(admin.acumulados.tareasPendientesActuales, 2)
    assert.equal(admin.acumulados.clientesTotal, 2)

    const ops = await metrics(t, t.users.ops)
    assert.equal(ops.acumulados.solicitudesEnSeguimiento, 1)
    assert.equal(ops.acumulados.tareasPendientesActuales, 1)

    const spec = await metrics(t, t.users.spec)
    assert.equal(spec.acumulados.solicitudesEnSeguimiento, 0)
    assert.equal(spec.acumulados.tareasPendientesActuales, 0)
    assert.equal(spec.acumulados.clientesTotal, 1)
  })

  test('los tres períodos responden y uno inválido se rechaza', async () => {
    for (const period of ['7d', '30d', 'trimestre']) {
      const m = await metrics(biz, biz.users.admin, period)
      assert.equal(m.periodo.series.labels.length, 7)
      assert.equal(m.periodInfo.yTicks.length, 5)
    }
    await assert.rejects(metrics(biz, biz.users.admin, 'otro'), /VALIDATION_ERROR/)
  })

  test('otro tenant no consulta las métricas', async () => {
    await assert.rejects(metrics(biz, starter.users.admin), /TENANT_ISOLATION_VIOLATION/)
  })

  test('no existe en el catálogo ningún plan con IA en Starter', async () => {
    assert.equal(await count(`select count(*)::int n from plan_catalog where plan_code = 'starter' and (features_json ->> 'ai_assistant')::boolean`), 0)
  })
})
