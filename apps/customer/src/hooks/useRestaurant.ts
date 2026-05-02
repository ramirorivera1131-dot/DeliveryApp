import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string
  is_available: boolean
}

export type MenuCategory = {
  name: string
  products: Product[]
}

export type RestaurantDetail = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  address: string
  lat: number | null
  lng: number | null
  min_order_amount: number
  category: string | null
  menu: MenuCategory[]
}

async function fetchRestaurant(slug: string): Promise<RestaurantDetail> {
  const { data: r, error } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, address, lat, lng, min_order_amount, category')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error) throw error

  const { data: products, error: pErr } = await supabase
    .from('products')
    .select('id, name, description, price, image_url, category, is_available')
    .eq('restaurant_id', r.id)
    .eq('is_available', true)
    .order('category')
    .order('name')

  if (pErr) throw pErr

  const categoryMap = new Map<string, Product[]>()
  for (const p of products ?? []) {
    const cat = (p as Product).category ?? 'General'
    if (!categoryMap.has(cat)) categoryMap.set(cat, [])
    categoryMap.get(cat)!.push(p as Product)
  }

  return {
    ...r,
    address: (r as any).address ?? '',
    category: (r as any).category ?? null,
    menu: Array.from(categoryMap.entries()).map(([name, prods]) => ({ name, products: prods })),
  } as RestaurantDetail
}

export function useRestaurant(slug: string) {
  return useQuery({
    queryKey: ['restaurant', slug],
    queryFn: () => fetchRestaurant(slug),
    enabled: !!slug,
  })
}
