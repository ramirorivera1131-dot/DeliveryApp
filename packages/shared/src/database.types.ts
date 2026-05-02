// Auto-generado con: npm run db:types
// No editar manualmente.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          role: 'admin' | 'restaurant_owner' | 'driver' | 'customer'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      restaurants: {
        Row: {
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
        Insert: Omit<Database['public']['Tables']['restaurants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['restaurants']['Insert']>
      }
      categories: {
        Row: {
          id: string
          restaurant_id: string
          name: string
          description: string | null
          image_url: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      products: {
        Row: {
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
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['products']['Insert']>
      }
      customers: {
        Row: {
          id: string
          full_name: string
          phone: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['customers']['Insert']>
      }
      customer_addresses: {
        Row: {
          id: string
          customer_id: string
          label: string
          address: string
          lat: number | null
          lng: number | null
          is_default: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['customer_addresses']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['customer_addresses']['Insert']>
      }
      drivers: {
        Row: {
          id: string
          user_id: string
          full_name: string
          phone: string
          avatar_url: string | null
          vehicle_type: 'bicycle' | 'motorcycle' | 'car'
          earnings_rate: number
          status: 'available' | 'busy' | 'offline'
          current_lat: number | null
          current_lng: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['drivers']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['drivers']['Insert']>
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          restaurant_id: string
          driver_id: string | null
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
          subtotal: number
          delivery_fee: number
          discount_amount: number
          total_amount: number
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
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'total_amount' | 'confirmed_at' | 'preparing_at' | 'ready_at' | 'picked_up_at' | 'delivered_at' | 'cancelled_at' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['orders']['Insert']>
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          product_image_url: string | null
          unit_price: number
          quantity: number
          subtotal: number
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'subtotal'>
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>
      }
      commissions: {
        Row: {
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
          status: 'pending' | 'paid'
          restaurant_paid_at: string | null
          driver_paid_at: string | null
          created_at: string
        }
        Insert: never  // solo el sistema puede insertar (trigger)
        Update: Pick<Database['public']['Tables']['commissions']['Row'], 'status' | 'restaurant_paid_at' | 'driver_paid_at'>
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean }
      my_driver_id: { Args: Record<string, never>; Returns: string | null }
      owns_restaurant: { Args: { restaurant_id: string }; Returns: boolean }
    }
    Enums: {
      order_status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled'
      driver_status: 'available' | 'busy' | 'offline'
      vehicle_type: 'bicycle' | 'motorcycle' | 'car'
      commission_status: 'pending' | 'paid'
    }
  }
}
