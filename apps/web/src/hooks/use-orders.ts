'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Order } from '@/lib/types'

const ORDER_SELECT = `
  id, status, subtotal, delivery_fee, total_amount,
  delivery_address, notes, created_at, delivered_at,
  customers ( full_name, phone ),
  order_items ( id, product_name, quantity, unit_price, subtotal )
`

export function useActiveOrders(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'active', restaurantId],
    queryFn:  async () => {
      if (!restaurantId) return []
      const supabase = createClient()
      const { data } = await supabase
        .from('orders')
        .select(ORDER_SELECT)
        .eq('restaurant_id', restaurantId)
        .not('status', 'in', '("delivered","cancelled")')
        .order('created_at', { ascending: false })
      return (data ?? []) as unknown as Order[]
    },
    enabled: !!restaurantId,
    staleTime: 0,
  })
}

export function useTodayOrders(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['orders', 'today', restaurantId],
    queryFn:  async () => {
      if (!restaurantId) return []
      const supabase = createClient()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { data } = await supabase
        .from('orders')
        .select(ORDER_SELECT)
        .eq('restaurant_id', restaurantId)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false })
      return (data ?? []) as unknown as Order[]
    },
    enabled: !!restaurantId,
    staleTime: 0,
  })
}

export function useMonthOrders(restaurantId: string | undefined, year: number, month: number) {
  return useQuery({
    queryKey: ['orders', 'month', restaurantId, year, month],
    queryFn:  async () => {
      if (!restaurantId) return []
      const supabase = createClient()
      const start = new Date(year, month, 1).toISOString()
      const end   = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
      const { data } = await supabase
        .from('orders')
        .select('id, subtotal, delivery_fee, total_amount, status, created_at, delivered_at')
        .eq('restaurant_id', restaurantId)
        .gte('created_at', start)
        .lte('created_at', end)
        .order('created_at', { ascending: true })
      return data ?? []
    },
    enabled: !!restaurantId,
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateOrderStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const supabase = createClient()
      const patch: Record<string, unknown> = { status }
      if (status === 'delivered') patch.delivered_at = new Date().toISOString()
      const { error } = await supabase.from('orders').update(patch).eq('id', orderId)
      if (error) throw error
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orders'] })
    },
  })
}
