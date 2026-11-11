/**
 * CLIENTES, OPORTUNIDADES, TAREAS Y DOCUMENTOS
 * CoreFlow — src/core/backend/OperationalModulesService.js
 *
 * Permisos, alcance y estado del tenant los impone RLS. Una operación denegada llega
 * como error tipado; nunca se informa éxito sin que la base lo confirme.
 */

import { BackendError, toBackendError, unwrap } from './result.js'
import { mapClient, mapDocument, mapOpportunity, mapTask } from './mappers.js'

const STORAGE_BUCKET = 'coreflow-documents'

function generateCode(prefix) {
  return `${prefix}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`
}

export class OperationalModulesService {
  constructor({ client, store, organizations }) {
    this.client = client
    this.store = store
    this.organizations = organizations
  }

  // --- Clientes --------------------------------------------------------------
  async listClients(organizationId) {
    return this._list('clients', organizationId, mapClient)
  }

  async createClient({ organizationId, payload }) {
    const member = this._requireMembership(organizationId)
    const displayName = payload.displayName || payload.name
    return this._insert(organizationId, 'clients', mapClient, {
      organization_id: organizationId,
      branch_id: payload.branchId || member.branchId,
      code: payload.code || generateCode('CTA'),
      legal_name: payload.legalName || displayName,
      display_name: displayName,
      tax_id: payload.taxId ?? null,
      sector: payload.sector || 'Servicios',
      status: payload.status || 'active',
      owner_member_id: payload.ownerMemberId || member.id,
      contact_name: payload.contactName ?? null,
      contact_email: payload.contactEmail ?? null,
      contact_phone: payload.contactPhone ?? null,
    })
  }

  // --- Oportunidades ---------------------------------------------------------
  async listOpportunities(organizationId) {
    return this._list('commercial_opportunities', organizationId, mapOpportunity)
  }

  async createOpportunity({ organizationId, payload }) {
    const member = this._requireMembership(organizationId)
    return this._insert(organizationId, 'commercial_opportunities', mapOpportunity, {
      organization_id: organizationId,
      client_id: payload.clientId,
      code: payload.code || generateCode('OP'),
      title: payload.title,
      stage: payload.stage || 'propuesta',
      status: payload.status || 'process',
      estimated_value: Number(payload.estimatedValue ?? 0),
      currency: payload.currency || 'COP',
      probability: Number(payload.probability ?? 50),
      owner_member_id: payload.ownerMemberId || member.id,
      expected_close_label: payload.expectedCloseLabel ?? null,
    })
  }

  // --- Tareas ----------------------------------------------------------------
  async listTasks(organizationId) {
    return this._list('tasks', organizationId, mapTask)
  }

  async createTask({ organizationId, payload }) {
    const member = this._requireMembership(organizationId)
    return this._insert(organizationId, 'tasks', mapTask, {
      organization_id: organizationId,
      code: payload.code || generateCode('TAR'),
      title: payload.title,
      description: payload.description ?? null,
      request_id: payload.requestId || null,
      client_id: payload.clientId || null,
      department_id: payload.departmentId || member.departmentId || null,
      assigned_member_id: payload.assignedMemberId || member.id,
      priority: payload.priority || 'Media',
      status: payload.status || 'pending',
      due_label: payload.dueLabel || 'Hoy · 17:00',
    })
  }

  async toggleTaskStatus({ organizationId, taskId }) {
    const current = await this.client
      .from('tasks')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', taskId)
      .is('deleted_at', null)
      .maybeSingle()
      .then(unwrap)
    if (!current) {
      throw new BackendError('ENTITY_NOT_FOUND', 'La tarea no existe en la organización.')
    }

    // Condicionado al estado leído: si cambió entretanto, no se pisa la otra actualización.
    const [row, directory] = await Promise.all([
      this.client
        .from('tasks')
        .update({ status: current.status === 'completed' ? 'process' : 'completed' })
        .eq('organization_id', organizationId)
        .eq('id', taskId)
        .eq('status', current.status)
        .select()
        .maybeSingle()
        .then(unwrap),
      this.organizations._loadDirectory(organizationId),
    ])
    if (!row) {
      throw new BackendError(
        'UPDATE_NOT_APPLIED',
        'La tarea no se actualizó: cambió mientras tanto o no tiene permiso para modificarla.'
      )
    }
    return mapTask(row, directory)
  }

  // --- Documentos ------------------------------------------------------------
  async listDocuments(organizationId) {
    return this._list('documents', organizationId, mapDocument)
  }

  /** Sube el archivo y registra el documento; si el registro falla, retira el archivo. */
  async createDocument({ organizationId, payload }) {
    const member = this._requireMembership(organizationId)
    const code = payload.code || generateCode('DOC')
    const filename = String(payload.filename || `${payload.title}.pdf`).replace(/[^a-zA-Z0-9._-]/g, '_')
    const storagePath = `${organizationId}/documents/${code}/${filename}`
    const file = payload.fileBlob || null

    if (file) {
      const { error } = await this.client.storage
        .from(STORAGE_BUCKET)
        .upload(storagePath, file, { upsert: false, contentType: file.type })
      if (error) throw toBackendError(error)
    }

    try {
      return await this._insert(organizationId, 'documents', mapDocument, {
        organization_id: organizationId,
        code,
        title: payload.title,
        category: payload.category || 'Operativo',
        version: payload.version || 'v1.0',
        status: payload.status || 'active',
        client_id: payload.clientId || null,
        request_id: payload.requestId || null,
        department_id: payload.departmentId || null,
        uploaded_by_member_id: member.id,
        storage_bucket: STORAGE_BUCKET,
        storage_path: storagePath,
        mime_type: file?.type || payload.mimeType || 'application/pdf',
        size_bytes: file?.size ?? 0,
      })
    } catch (err) {
      if (file) await this.client.storage.from(STORAGE_BUCKET).remove([storagePath])
      throw err
    }
  }

  async getDocumentUrl({ organizationId, documentId, expiresInSeconds = 300 }) {
    const row = await this.client
      .from('documents')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', documentId)
      .maybeSingle()
      .then(unwrap)
    if (!row) throw new BackendError('ENTITY_NOT_FOUND', 'El documento no existe en la organización.')

    const { data, error } = await this.client.storage
      .from(row.storage_bucket)
      .createSignedUrl(row.storage_path, expiresInSeconds)
    if (error) throw toBackendError(error)
    return { url: data.signedUrl, expiresInSeconds }
  }

  // --- Internos --------------------------------------------------------------
  _requireMembership(organizationId) {
    const member = this.store
      .getSnapshot()
      .session.memberships.find((m) => m.organizationId === organizationId)
    if (!member) {
      throw new BackendError('TENANT_ISOLATION_VIOLATION', 'Sin membresía activa en la organización.')
    }
    return member
  }

  async _list(table, organizationId, mapper) {
    const [rows, directory] = await Promise.all([
      this.client
        .from(table)
        .select('*')
        .eq('organization_id', organizationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .then(unwrap),
      this.organizations._loadDirectory(organizationId),
    ])
    return rows.map((r) => mapper(r, directory))
  }

  async _insert(organizationId, table, mapper, values) {
    const [row, directory] = await Promise.all([
      this.client.from(table).insert(values).select().single().then(unwrap),
      this.organizations._loadDirectory(organizationId),
    ])
    return mapper(row, directory)
  }
}
