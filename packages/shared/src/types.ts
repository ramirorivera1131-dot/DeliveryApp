export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'cancelled'

export type DriverStatus = 'available' | 'busy' | 'offline'
export type VehicleType = 'bicycle' | 'motorcycle' | 'car'
export type CommissionStatus = 'pending' | 'paid'
export type UserRole = 'admin' | 'restaurant_owner' | 'driver' | 'customer'

export interface Profile {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface Restaurant {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  phone: string | null
  email: string | null
  address: string
  lat: number | null
  lng: number | null
  /** Porcentaje que retiene el restaurante (0–1). Ej: 0.80 → 80% */
  earnings_rate: number
  delivery_fee: number
  min_order_amount: number
  estimated_delivery_min: number
  delivery_radius_km: number | null
  is_active: boolean
  is_open: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  restaurant_id: string
  name: string
  description: string | null
  image_url: string | null
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface Product {
  id: string
  restaurant_id: string
  category_id: string | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Customer {
  id: string
  full_name: string
  phone: string | null
  avatar_url: string | null
  created_at: string
}

export interface CustomerAddress {
  id: string
  customer_id: string
  label: string
  address: string
  lat: number | null
  lng: number | null
  is_default: boolean
  created_at: string
}

export interface Driver {
  id: string
  user_id: string
  full_name: string
  phone: string
  avatar_url: string | null
  vehicle_type: VehicleType
  /** Porcentaje que retiene el repartidor del cargo de envío (0–1). Ej: 0.85 → 85% */
  earnings_rate: number
  status: DriverStatus
  current_lat: number | null
  current_lng: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  customer_id: string
  restaurant_id: string
  driver_id: string | null
  status: OrderStatus
  subtotal: number
  delivery_fee: number
  discount_amount: number
  total_amount: number        // columna generada (subtotal + delivery_fee - discount)
  delivery_address: string
  delivery_lat: number | null
  delivery_lng: number | null
  notes: string | null
  confirmed_at: string | null
  preparing_at: string | null
  ready_at: string | null
  picked_up_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string | null   // null si el producto fue eliminado
  product_name: string        // snapshot
  product_image_url: string | null
  unit_price: number
  quantity: number
  subtotal: number            // columna generada (unit_price * quantity)
  notes: string | null
}

export interface Commission {
  id: string
  order_id: string
  restaurant_id: string
  restaurant_earnings_rate: number
  restaurant_earnings: number
  platform_earnings_from_restaurant: number
  driver_id: string | null
  driver_earnings_rate: number | null
  driver_earnings: number | null
  platform_earnings_from_delivery: number | null
  order_subtotal: number
  delivery_fee: number
  total_platform_earnings: number
  status: CommissionStatus
  restaurant_paid_at: string | null
  driver_paid_at: string | null
  created_at: string
}
