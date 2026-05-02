export type Restaurant = {
  id: string
  name: string
  slug: string
  logo_url: string | null
  min_order_amount: number
  is_active: boolean
  address?: string
  lat?: number | null
  lng?: number | null
  category?: string | null
  description?: string | null
  cover_url?: string | null
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'

export type OrderItem = {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
  notes?: string | null
}

export type Order = {
  id: string
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  total_amount: number
  delivery_address: string
  notes: string | null
  created_at: string
  delivered_at: string | null
  driver_id?: string | null
  customers: { full_name: string; phone: string | null } | null
  order_items: OrderItem[]
}

export type Category = {
  id: string
  name: string
  description: string | null
  sort_order: number
  is_active: boolean
}

export type Product = {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  sort_order: number
  category_id: string | null
  restaurant_id?: string
}

export type SubscriptionPlan = {
  name: string
  display_name: string
  price_per_branch_usd: number
  features: string[] | Record<string, unknown>
}

export type Subscription = {
  id: string
  status: 'active' | 'past_due' | 'cancelled' | 'trialing'
  branch_count: number
  monthly_total_usd: number
  current_period_end: string
  subscription_plans: SubscriptionPlan | null
}

export type KpiData = {
  value: number
  prev: number
  label: string
  format?: 'number' | 'currency' | 'percent' | 'minutes'
}
