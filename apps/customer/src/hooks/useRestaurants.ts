import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type Restaurant = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  lat: number | null
  lng: number | null
  min_order_amount: number
  category: string | null
}

async function fetchRestaurants(): Promise<Restaurant[]> {
  const { data, error } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, lat, lng, min_order_amount, category')
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return (data ?? []) as Restaurant[]
}

export function useRestaurants() {
  return useQuery({
    queryKey: ['restaurants'],
    queryFn: fetchRestaurants,
  })
}
