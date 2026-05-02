import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Order, DeliveryRecord, OrderStatus } from '@/lib/types'

const ORDER_SELECT = `
  id, status, delivery_address, delivery_lat, delivery_lng,
  delivery_fee, subtotal, total_amount, notes, created_at, delivered_at,
  customers ( full_name, phone ),
  restaurants ( name, address, phone, logo_url, lat, lng ),
  order_items ( id, product_name, quantity, unit_price, subtotal )
`

export function useAvailableOrders() {
  return useQuery({
    queryKey: ['orders', 'available'],
    queryFn:  async () => {
      const { data } = await supabase
        .from('orders')
        .select(ORDER_SELECT)
        .eq('status', 'ready')
        .is('driver_id', null)
        .order('created_at', { ascending: false })
      return (data ?? []) as unknown as Order[]
    },
    staleTime: 0,
    refetchInterval: 30_000,
  })
}

export function useActiveOrder(driverId: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'active', driverId],
    queryFn:  async () => {
      if (!driverId) return null
      const { data } = await supabase
        .from('orders')
        .select(ORDER_SELECT)
        .eq('driver_id', driverId)
        .in('status', ['picked_up', 'in_transit'])
        .maybeSingle()
      return data ? (data as unknown as Order) : null
    },
    enabled:  !!driverId,
    staleTime: 0,
  })
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn:  async () => {
      if (!orderId) return null
      const { data } = await supabase
        .from('orders')
        .select(ORDER_SELECT)
        .eq('id', orderId)
        .single()
      return data ? (data as unknown as Order) : null
    },
    enabled:  !!orderId,
    staleTime: 0,
  })
}

export function useDeliveryHistory(driverId: string | undefined, period: 'today' | 'week' | 'month' | 'all') {
  return useQuery({
    queryKey: ['deliveries', driverId, period],
    queryFn:  async () => {
      if (!driverId) return []
      let query = supabase
        .from('orders')
        .select('id, delivery_fee, delivery_address, delivered_at, created_at, restaurants(name)')
        .eq('driver_id', driverId)
        .eq('status', 'delivered')
        .order('delivered_at', { ascending: false, nullsFirst: false })

      const now   = new Date()
      if (period === 'today') {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
        query = query.gte('created_at', start)
      } else if (period === 'week') {
        const d = new Date(now)
        d.setDate(d.getDate() - 7)
        query = query.gte('created_at', d.toISOString())
      } else if (period === 'month') {
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
        query = query.gte('created_at', start)
      }

      const { data } = await query
      return (data ?? []) as unknown as DeliveryRecord[]
    },
    enabled:  !!driverId,
    staleTime: 1000 * 60 * 2,
  })
}

export function useAcceptOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, driverId }: { orderId: string; driverId: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ driver_id: driverId, status: 'picked_up' })
        .eq('id', orderId)
        .is('driver_id', null)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const patch: Record<string, unknown> = { status }
      if (status === 'delivered') patch.delivered_at = new Date().toISOString()
      const { error } = await supabase.from('orders').update(patch).eq('id', orderId)
      if (error) throw error
    },
    onMutate: async ({ orderId, status }) => {
      const prev = qc.getQueryData<Order | null>(['order', orderId])
      qc.setQueryData<Order | null>(['order', orderId], o => o ? { ...o, status } : null)
      return { prev }
    },
    onError: (_, vars, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(['order', vars.orderId], ctx.prev)
    },
    onSettled: (_, __, vars) => {
      qc.invalidateQueries({ queryKey: ['order', vars.orderId] })
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
