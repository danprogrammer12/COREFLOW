/**
 * REGISTRO DE CONSENTIMIENTO Y SOLICITUDES DE PRIVACIDAD
 * CoreFlow — src/core/backend/PrivacyService.js
 *
 * Depende de la migración propuesta supabase/proposed/018_privacy_consent_and_requests.sql,
 * que NO está aplicada. La interfaz solo usa este servicio con
 * VITE_COREFLOW_PRIVACY_SYNC=on, después de aplicar y probar esa migración.
 */

import { unwrap } from './result.js'

export class PrivacyService {
  constructor({ client, store }) {
    this.client = client
    this.store = store
  }

  /** Registra una decisión de cookies. El servidor añade el usuario desde auth.uid(). */
  async recordConsent(record) {
    const { session } = this.store.getSnapshot()
    return this.client
      .rpc('rpc_record_cookie_consent', {
        p: {
          consent_id: record.consentId,
          visitor_id: record.visitorId,
          organization_id: session.activeOrganizationId || null,
          accepted: record.accepted,
          rejected: record.rejected,
          method: record.method,
          policy_version: record.policyVersion,
          notice_version: record.noticeVersion,
          decided_at: record.updatedAt,
        },
      })
      .then(unwrap)
  }

  async submitRequest({ requestType, fullName, email, organizationName = null, detail }) {
    const { session } = this.store.getSnapshot()
    return this.client
      .rpc('rpc_submit_privacy_request', {
        p: {
          request_type: requestType,
          full_name: fullName,
          email,
          organization_name: organizationName,
          organization_id: session.activeOrganizationId || null,
          detail,
        },
      })
      .then(unwrap)
  }

  async listMyConsents() {
    return this.client
      .from('privacy_consents')
      .select('consent_id, accepted, rejected, method, policy_version, notice_version, decided_at')
      .order('decided_at', { ascending: false })
      .then(unwrap)
  }
}
