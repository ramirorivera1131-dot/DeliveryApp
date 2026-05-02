import { createClient } from './server'

export async function getMyRestaurant() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, min_order_amount, is_active')
    .eq('owner_id', user.id)
    .maybeSingle()
  return data
}

export async function getTodayOrders(restaurantId: string) {
  const supabase = await createClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const { data } = await supabase
    .from('orders')
    .select(`
      id, status, subtotal, delivery_fee, total_amount,
      delivery_address, notes, created_at,
      customers ( full_name, phone ),
      order_items ( id, product_name, quantity, unit_price, subtotal )
    `)
    .eq('restaurant_id', restaurantId)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getActiveOrders(restaurantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('orders')
    .select(`
      id, status, subtotal, delivery_fee, total_amount,
      delivery_address, notes, created_at,
      customers ( full_name, phone ),
      order_items ( id, product_name, quantity, unit_price, subtotal )
    `)
    .eq('restaurant_id', restaurantId)
    .not('status', 'in', '("delivered","cancelled")')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getMonthOrders(restaurantId: string, year: number, month: number) {
  const supabase = await createClient()
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
}

export async function getRestaurantSubscription(restaurantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('restaurant_subscriptions')
    .select('*, subscription_plans ( name, display_name, price_per_branch_usd, features )')
    .eq('restaurant_id', restaurantId)
    .maybeSingle()
  return data
}

export async function getCategories(restaurantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('categories')
    .select('id, name, description, sort_order, is_active')
    .eq('restaurant_id', restaurantId)
    .order('sort_order')
  return data ?? []
}

export async function getProducts(restaurantId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, description, price, image_url, is_available, sort_order, category_id')
    .eq('restaurant_id', restaurantId)
    .order('sort_order')
  return data ?? []
}
