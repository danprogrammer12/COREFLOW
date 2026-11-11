/**
 * CLIENTE SIMULADO — NIVEL "SIMULADA"
 * CoreFlow — tests/services/simulatedSupabaseClient.mjs
 *
 * Traduce el subconjunto de la API de supabase-js que usan los servicios a SQL sobre
 * PostgreSQL embebido, con el usuario de la sesión y RLS activa. Valida columnas,
 * políticas y RPC reales. NO reproduce PostgREST, Auth ni la API de Storage: un
 * resultado verde aquí no es una integración real con Supabase.
 */

import { asUser } from '../db/harness.mjs'

const quote = (identifier) => `"${String(identifier).replaceAll('"', '""')}"`
const toError = (err) => ({ message: err.message, code: err.code, details: err.detail ?? null, hint: err.hint ?? null })

class QueryBuilder {
  constructor(client, table) {
    this.client = client
    this.table = table
    this.operation = 'select'
    this.columns = '*'
    this.returning = false
    this.filters = []
    this.orders = []
    this.rowLimit = null
    this.cardinality = 'many'
    this.values = null
    this.onConflict = null
  }

  select(columns = '*') {
    if (columns.includes('(')) {
      throw new Error('El cliente simulado no admite embeds; los servicios tampoco los usan.')
    }
    this.columns = columns
    if (this.operation !== 'select') this.returning = true
    return this
  }

  insert(values) { this.operation = 'insert'; this.values = JSON.parse(JSON.stringify(values)); return this }
  update(values) { this.operation = 'update'; this.values = JSON.parse(JSON.stringify(values)); return this }
  upsert(values, { onConflict } = {}) { this.operation = 'upsert'; this.values = JSON.parse(JSON.stringify(values)); this.onConflict = onConflict; return this }
  eq(column, value) { this.filters.push({ column, op: '=', value }); return this }
  is(column, value) { this.filters.push({ column, op: 'is', value }); return this }
  in(column, values) { this.filters.push({ column, op: 'in', value: values }); return this }
  order(column, { ascending = true } = {}) { this.orders.push(`${quote(column)} ${ascending ? 'asc' : 'desc'}`); return this }
  limit(count) { this.rowLimit = count; return this }
  single() { this.cardinality = 'single'; return this }
  maybeSingle() { this.cardinality = 'maybe'; return this }

  then(resolve, reject) {
    return this._execute().then(resolve, reject)
  }

  _where(params) {
    if (this.filters.length === 0) return ''
    const clauses = this.filters.map(({ column, op, value }) => {
      if (op === 'is') return `${quote(column)} is null`
      if (op === 'in') {
        params.push(value)
        return `${quote(column)}::text = any($${params.length}::text[])`
      }
      params.push(value)
      return `${quote(column)} = $${params.length}`
    })
    return ` where ${clauses.join(' and ')}`
  }

  _sql() {
    const params = []
    const table = `public.${quote(this.table)}`

    if (this.operation === 'select') {
      const limit = this.rowLimit ? ` limit ${Number(this.rowLimit)}` : ''
      const order = this.orders.length ? ` order by ${this.orders.join(', ')}` : ''
      const where = this._where(params)
      return {
        params,
        sql: `select to_jsonb(t) as row from (select ${this.columns} from ${table}${where}${order}${limit}) t`,
      }
    }

    let statement
    if (this.operation === 'update') {
      const sets = Object.entries(this.values).map(([key, value]) => {
        params.push(value)
        return `${quote(key)} = $${params.length}`
      })
      statement = `update ${table} set ${sets.join(', ')}${this._where(params)}`
    } else {
      const entries = Object.entries(this.values).filter(([, value]) => value !== undefined)
      const columns = entries.map(([key]) => quote(key))
      const holders = entries.map(([, value]) => {
        params.push(value)
        return `$${params.length}`
      })
      statement = `insert into ${table} (${columns.join(', ')}) values (${holders.join(', ')})`
      if (this.operation === 'upsert') {
        const targets = this.onConflict.split(',').map((c) => c.trim())
        const updates = columns
          .filter((c) => !targets.map(quote).includes(c))
          .map((c) => `${c} = excluded.${c}`)
        statement += ` on conflict (${targets.map(quote).join(', ')}) do update set ${updates.join(', ')}`
      }
    }

    if (!this.returning) return { sql: statement, params }
    return { params, sql: `with w as (${statement} returning *) select to_jsonb(w) as row from w` }
  }

  async _execute() {
    try {
      const { sql, params } = this._sql()
      const rows = await this.client._query(sql, params)
      const data = rows.map((r) => r.row).filter((r) => r !== undefined)

      if (this.operation !== 'select' && !this.returning) return { data: null, error: null }
      if (this.cardinality === 'many') return { data, error: null }
      if (data.length > 1 || (this.cardinality === 'single' && data.length === 0)) {
        return {
          data: null,
          error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' },
        }
      }
      return { data: data[0] ?? null, error: null }
    } catch (err) {
      return { data: null, error: toError(err) }
    }
  }
}

export function createSimulatedClient(db, { passwords = {}, serviceRole = false } = {}) {
  const listeners = new Set()
  const client = {
    currentUser: null,

    _query(sql, params) {
      return asUser(
        db,
        client.currentUser?.id ?? null,
        async (tx) => (await tx.query(sql, params)).rows,
        { role: serviceRole ? 'service_role' : client.currentUser ? 'authenticated' : 'anon' }
      )
    },

    from: (table) => new QueryBuilder(client, table),

    async rpc(name, args = {}) {
      try {
        const [fn] = (
          await db.query(
            `select t.typtype, t.typname from pg_proc p join pg_type t on t.oid = p.prorettype
              where p.proname = $1 and p.pronamespace = 'public'::regnamespace`,
            [name]
          )
        ).rows
        if (!fn) return { data: null, error: { code: 'PGRST202', message: `No existe la función ${name}` } }

        // supabase-js serializa a JSON: los valores undefined desaparecen, no se vuelven null
        const sent = JSON.parse(JSON.stringify(args))
        const params = Object.values(sent)
        const call = `public.${quote(name)}(${Object.keys(sent).map((k, i) => `${quote(k)} => $${i + 1}`).join(', ')})`
        const sql =
          fn.typtype === 'c'
            ? `select to_jsonb(r) as data from ${call} r`
            : fn.typname === 'void'
              ? `select null::jsonb as data, ${call}`
              : `select ${call} as data`
        const rows = await client._query(sql, params)
        return { data: rows[0]?.data ?? null, error: null }
      } catch (err) {
        return { data: null, error: toError(err) }
      }
    },

    auth: {
      admin: {
        async listUsers({ page = 1, perPage = 50 } = {}) {
          const { rows } = await db.query(
            `select id, email, raw_user_meta_data as user_metadata from auth.users
              order by created_at, id limit $1 offset $2`,
            [perPage, (page - 1) * perPage]
          )
          return { data: { users: rows }, error: null }
        },
        async createUser({ email, password, user_metadata: metadata = {} }) {
          const { rows } = await db.query(
            `insert into auth.users (email, raw_user_meta_data) values ($1, $2)
             returning id, email, raw_user_meta_data as user_metadata`,
            [email, metadata]
          )
          passwords[email] = password
          return { data: { user: rows[0] }, error: null }
        },
        async updateUserById(id, { password, user_metadata: metadata }) {
          const { rows } = await db.query(`select email from auth.users where id = $1`, [id])
          if (password !== undefined) passwords[rows[0].email] = password
          if (metadata !== undefined) {
            await db.query(`update auth.users set raw_user_meta_data = $2 where id = $1`, [id, metadata])
          }
          return { data: { user: { id } }, error: null }
        },
      },
      async signInWithPassword({ email, password }) {
        const { rows } = await db.query(`select id, email from auth.users where lower(email) = lower($1)`, [email])
        if (!rows[0] || passwords[rows[0].email] !== password) {
          return { data: { user: null }, error: { message: 'Invalid login credentials', status: 400 } }
        }
        client.currentUser = rows[0]
        return { data: { user: rows[0], session: {} }, error: null }
      },
      async signOut() {
        client.currentUser = null
        for (const listener of listeners) listener('SIGNED_OUT', null)
        return { error: null }
      },
      async getSession() {
        return { data: { session: client.currentUser ? {} : null }, error: null }
      },
      async getUser() {
        return client.currentUser
          ? { data: { user: client.currentUser }, error: null }
          : { data: { user: null }, error: { message: 'Auth session missing!', status: 400 } }
      },
      async resetPasswordForEmail() {
        return { data: {}, error: null }
      },
      _emit(event) {
        for (const listener of listeners) listener(event, null)
      },
      onAuthStateChange(listener) {
        listeners.add(listener)
        return { data: { subscription: { unsubscribe: () => listeners.delete(listener) } } }
      },
    },

    storage: {
      from: (bucket) => ({
        async upload(path, file) {
          try {
            await client._query(
              `insert into storage.objects (bucket_id, name, metadata) values ($1, $2, $3)`,
              [bucket, path, { size: file.size ?? 0 }]
            )
            return { data: { path }, error: null }
          } catch (err) {
            return { data: null, error: toError(err) }
          }
        },
        async remove(paths) {
          const rows = await client._query(
            `delete from storage.objects where bucket_id = $1 and name = any($2::text[]) returning name`,
            [bucket, paths]
          )
          return { data: rows, error: null }
        },
        async createSignedUrl(path) {
          const rows = await client._query(
            `select name from storage.objects where bucket_id = $1 and name = $2`,
            [bucket, path]
          )
          return rows.length
            ? { data: { signedUrl: `simulated://${path}` }, error: null }
            : { data: null, error: { message: 'Object not found', status: 400 } }
        },
      }),
    },
  }
  return client
}
