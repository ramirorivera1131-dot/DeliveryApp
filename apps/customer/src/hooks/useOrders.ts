import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type OrderSummary = {
  id: string
  status: string
  delivery_address: string
  delivery_fee: number
  subtotal: number
  created_at: string
  delivered_at: string | null
  restaurants: { name: string; logo_url: string | null } | null
}

async function fetchOrders(userId: string): Promise<OrderSummary[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, delivery_address, delivery_fee, subtotal, created_at, delivered_at, restaurants(name, logo_url)')
    .eq('customer_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? []) as unknown as OrderSummary[]
}

export function useOrders(userId: string | undefined) {
  return useQuery({
    queryKey: ['orders', userId],
    queryFn: () => fetchOrders(userId!),
    enabled: !!userId,
  })
}
