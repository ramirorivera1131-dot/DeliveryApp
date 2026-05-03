import 'server-only'
import { createAdminClient } from './supabase/admin'
import type { Database } from '@delivery/shared/database.types'

type AuditInsert = Database['public']['Tables']['audit_log']['Insert']
type JsonCol     = AuditInsert['old_data']

export async function logAudit(params: {
  adminUserId?: string | null
  action: string
  entityType: string
  entityId?: string | null
  oldData?: Record<string, unknown> | null
  newData?: Record<string, unknown> | null
  details?: Record<string, unknown>
  ipAddress?: string | null
  userAgent?: string | null
}) {
  try {
    const supabase = createAdminClient()
    const row: AuditInsert = {
      admin_user_id: params.adminUserId ?? null,
      action:        params.action,
      entity_type:   params.entityType,
      entity_id:     params.entityId ?? null,
      old_data:      params.oldData as unknown as JsonCol,
      new_data:      params.newData as unknown as JsonCol,
      details:       (params.details ?? {}) as unknown as JsonCol,
      ip_address:    params.ipAddress ?? null,
      user_agent:    params.userAgent ?? null,
    }
    await supabase.from('audit_log').insert(row)
  } catch (err) {
    console.error('[audit] Failed to write audit log:', err)
  }
}

export async function logAdminAction(
  adminUserId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> = {},
) {
  return logAudit({ adminUserId, action, entityType, entityId, details })
}
