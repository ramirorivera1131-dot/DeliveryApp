import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { logAudit } from '@/lib/audit'
import { z } from 'zod'

const bodySchema = z.object({
  restaurantId: z.string().uuid(),
  isActive:     z.boolean(),
  reason:       z.string().min(1).max(500).optional(),
})

export async function POST(req: NextRequest) {
  const adminId   = req.headers.get('x-admin-id')
  const adminRole = req.headers.get('x-admin-role')
  if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['super_admin', 'ops_manager'].includes(adminRole ?? ''))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body   = await req.json().catch(() => null)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { restaurantId, isActive, reason } = parsed.data
  const supabase = createAdminClient()

  const { data: prev, error: fetchErr } = await supabase
    .from('restaurants')
    .select('id, name, is_active')
    .eq('id', restaurantId)
    .single()
  if (fetchErr || !prev) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })

  const { error } = await supabase
    .from('restaurants')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', restaurantId)
  if (error) return NextResponse.json({ error: 'Update failed' }, { status: 500 })

  await logAudit({
    adminUserId: adminId,
    action:      isActive ? 'restaurant_activated' : 'restaurant_suspended',
    entityType:  'restaurant',
    entityId:    restaurantId,
    oldData:     { is_active: prev.is_active },
    newData:     { is_active: isActive },
    details:     reason ? { reason } : undefined,
    ipAddress:   req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? undefined,
  })

  return NextResponse.json({ ok: true })
}
