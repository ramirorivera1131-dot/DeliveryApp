export type DriverStatus   = 'available' | 'busy' | 'offline'
export type OrderStatus    = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
export type VehicleType    = 'bicycle' | 'motorcycle' | 'car'

export type Driver = {
  id: string
  user_id: string
  full_name: string
  phone: string | null
  vehicle_type: VehicleType
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_color: string | null
  vehicle_plate: string | null
  avatar_url: string | null
  status: DriverStatus
  earnings_rate: number
  rating_average: number | null
  total_deliveries: number
  is_documents_verified: boolean
}

export type OrderItem = {
  id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export type Order = {
  id: string
  status: OrderStatus
  delivery_fee: number
  subtotal: number
  total_amount: number
  delivery_address: string
  delivery_lat: number | null
  delivery_lng: number | null
  notes: string | null
  created_at: string
  delivered_at: string | null
  restaurants: {
    name: string
    address: string
    phone: string | null
    logo_url: string | null
    lat: number | null
    lng: number | null
  } | null
  customers: {
    full_name: string
    phone: string | null
  } | null
  order_items: OrderItem[]
}

export type DeliveryRecord = {
  id: string
  delivery_fee: number
  delivery_address: string
  delivered_at: string | null
  created_at: string
  distance_km: number | null
  restaurants: { name: string } | null
}
