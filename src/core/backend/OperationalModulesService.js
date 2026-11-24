// © 2026 Webcore Solutions · CoreFlow · Uso confidencial. Prohibida su copia o redistribución sin autorización escrita.
/**
 * CLIENTES, OPORTUNIDADES, TAREAS Y DOCUMENTOS
 * CoreFlow — src/core/backend/OperationalModulesService.js
 *
 * Permisos, alcance y estado del tenant los impone RLS. Una operación denegada llega
 * como error tipado; nunca se informa éxito sin que la base lo confirme.
 */

import { BackendError, toBackendError, unwrap } from './result.js'
import { mapClient, mapDocument, mapDocumentVersion, mapOpportunity, mapTask } from './mappers.js'

const STORAGE_BUCKET = 'coreflow-documents'

function generateCode(prefix) {
  return `${prefix}-${crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase()}`
}

export class OperationalModulesService {
  constructor({ client, store, organizations, subscriptions }) {
    this.client = client
    this.store = store
    this.organizations = organizations
    this.subscriptions = subscriptions
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

  async updateClient({ organizationId, clientId, patch }) {
    const allowed = {}
    const columns = {
      displayName: 'display_name',
      legalName: 'legal_name',
      taxId: 'tax_id',
      sector: 'sector',
      status: 'status',
      ownerMemberId: 'owner_member_id',
      contactName: 'contact_name',
      contactEmail: 'contact_email',
      contactPhone: 'contact_phone',
      notes: 'notes',
    }
    for (const [key, column] of Object.entries(columns)) {
      if (patch[key] !== undefined) allowed[column] = patch[key]
    }
    return this._update('clients', organizationId, clientId, allowed, mapClient)
  }

  /** Archivar conserva el registro y su historial. */
  async archiveClient({ organizationId, clientId }) {
    await this.client
      .rpc('rpc_archive_client', { p_org: organizationId, p_client: clientId })
      .then(unwrap)
    return { archived: true, clientId }
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

  async updateTask({ organizationId, taskId, patch }) {
    const allowed = {}
    const columns = {
      title: 'title',
      description: 'description',
      assignedMemberId: 'assigned_member_id',
      priority: 'priority',
      dueLabel: 'due_label',
      requestId: 'request_id',
      clientId: 'client_id',
    }
    for (const [key, column] of Object.entries(columns)) {
      if (patch[key] !== undefined) allowed[column] = patch[key]
    }
    return this._update('tasks', organizationId, taskId, allowed, mapTask)
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

  /** Sube el archivo y crea el documento con su primera versión. Sin archivo no hay documento. */
  async createDocument({ organizationId, payload }) {
    this._requireMembership(organizationId)
    const file = this._requireFile(payload.file || payload.fileBlob)
    await this._requireStorageConfigured(organizationId)

    const documentId = crypto.randomUUID()
    const storagePath = this._versionPath(organizationId, documentId, payload.filename || file.name || payload.title)
    await this._upload(storagePath, file)

    try {
      const [row, directory] = await Promise.all([
        this.client
          .rpc('rpc_create_document', {
            p_org: organizationId,
            p_document: documentId,
            p_storage_path: storagePath,
            p_payload: {
              code: payload.code,
              title: payload.title,
              category: payload.category,
              status: payload.status,
              client_id: payload.clientId,
              request_id: payload.requestId,
              task_id: payload.taskId,
              opportunity_id: payload.opportunityId,
              department_id: payload.departmentId,
              comment: payload.comment,
            },
          })
          .then(unwrap),
        this.organizations._loadDirectory(organizationId),
      ])
      return mapDocument(row, directory)
    } catch (err) {
      await this.client.storage.from(STORAGE_BUCKET).remove([storagePath])
      throw err
    }
  }

  async addDocumentVersion({ organizationId, documentId, file, filename, comment = null }) {
    this._requireMembership(organizationId)
    const blob = this._requireFile(file)
    await this._requireStorageConfigured(organizationId)

    const storagePath = this._versionPath(organizationId, documentId, filename || blob.name || 'documento')
    await this._upload(storagePath, blob)

    try {
      const row = await this.client
        .rpc('rpc_add_document_version', {
          p_org: organizationId,
          p_document: documentId,
          p_storage_path: storagePath,
          p_comment: comment,
        })
        .then(unwrap)
      return mapDocumentVersion(row)
    } catch (err) {
      await this.client.storage.from(STORAGE_BUCKET).remove([storagePath])
      throw err
    }
  }

  async listDocumentVersions({ organizationId, documentId }) {
    const rows = await this.client
      .from('document_versions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('document_id', documentId)
      .order('version_number', { ascending: false })
      .then(unwrap)
    return rows.map(mapDocumentVersion)
  }

  /** Sin `versionId`, entrega la versión vigente. */
  async getDocumentUrl({ organizationId, documentId, versionId = null, expiresInSeconds = 300 }) {
    const row = await this.client
      .from('documents')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('id', documentId)
      .is('deleted_at', null)
      .maybeSingle()
      .then(unwrap)
    if (!row) throw new BackendError('ENTITY_NOT_FOUND', 'El documento no existe en la organización.')

    let path = row.storage_path
    if (versionId) {
      const version = await this.client
        .from('document_versions')
        .select('*')
        .eq('document_id', documentId)
        .eq('id', versionId)
        .maybeSingle()
        .then(unwrap)
      if (!version) throw new BackendError('ENTITY_NOT_FOUND', 'La versión no existe.')
      path = version.storage_path
    }

    const { data, error } = await this.client.storage
      .from(row.storage_bucket)
      .createSignedUrl(path, expiresInSeconds)
    if (error) throw toBackendError(error)
    return { url: data.signedUrl, expiresInSeconds }
  }

  // --- Internos --------------------------------------------------------------
  _requireFile(file) {
    if (!file) throw new BackendError('DOCUMENT_FILE_REQUIRED', 'Selecciona el archivo del documento.')
    return file
  }

  async _requireStorageConfigured(organizationId) {
    const resolved = await this.subscriptions.getEntitlements(organizationId)
    if (!resolved.storageConfigured) {
      throw new BackendError(
        'STORAGE_QUOTA_NOT_CONFIGURED',
        'La capacidad de almacenamiento de la organización aún no está configurada.'
      )
    }
  }

  /** Cada versión tiene su propia carpeta: nunca se sobrescribe un archivo. */
  _versionPath(organizationId, documentId, filename) {
    const clean = String(filename).replace(/[^a-zA-Z0-9._-]/g, '_')
    return `${organizationId}/documents/${documentId}/${crypto.randomUUID()}/${clean}`
  }

  async _upload(path, file) {
    const { error } = await this.client.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { upsert: false, contentType: file.type })
    if (error) throw toBackendError(error)
  }

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

  async _update(table, organizationId, id, values, mapper) {
    const [row, directory] = await Promise.all([
      this.client
        .from(table)
        .update(values)
        .eq('organization_id', organizationId)
        .eq('id', id)
        .select()
        .maybeSingle()
        .then(unwrap),
      this.organizations._loadDirectory(organizationId),
    ])
    if (!row) {
      throw new BackendError('UPDATE_NOT_APPLIED', 'El registro no se actualizó: no existe o no tiene permiso.')
    }
    return mapper(row, directory)
  }

  async _insert(organizationId, table, mapper, values) {
    const [row, directory] = await Promise.all([
      this.client.from(table).insert(values).select().single().then(unwrap),
      this.organizations._loadDirectory(organizationId),
    ])
    return mapper(row, directory)
  }
}
