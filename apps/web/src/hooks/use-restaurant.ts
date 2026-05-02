'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Restaurant } from '@/lib/types'

export function useRestaurant() {
  return useQuery({
    queryKey: ['restaurant'],
    queryFn:  async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('restaurants')
        .select('id, name, slug, logo_url, min_order_amount, is_active, description, address')
        .eq('owner_id', user.id)
        .maybeSingle()
      return data as Restaurant | null
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateRestaurant() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (patch: Partial<Restaurant> & { id: string }) => {
      const supabase = createClient()
      const { id, ...rest } = patch
      const { data, error } = await supabase
        .from('restaurants')
        .update(rest)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restaurant'] }),
  })
}

export function useSubscription(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['subscription', restaurantId],
    queryFn:  async () => {
      if (!restaurantId) return null
      const supabase = createClient()
      const { data } = await supabase
        .from('restaurant_subscriptions')
        .select('*, subscription_plans(name, display_name, price_per_branch_usd, features)')
        .eq('restaurant_id', restaurantId)
        .maybeSingle()
      return data
    },
    enabled:   !!restaurantId,
    staleTime: 1000 * 60 * 10,
  })
}
