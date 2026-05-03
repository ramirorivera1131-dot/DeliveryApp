export type AdminRole = 'super_admin' | 'ops_manager' | 'support' | 'accountant' | 'viewer'

export type AdminUser = {
  id: string
  user_id: string
  email: string
  full_name: string
  role: AdminRole
  permissions: string[]
  is_active: boolean
  last_login_at: string | null
  failed_login_attempts: number
  locked_until: string | null
  created_at: string
  updated_at: string
}

export type AuditLog = {
  id: string
  admin_user_id: string | null
  action: string
  entity_type: string
  entity_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  details: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
  admin_users?: { full_name: string; email: string } | null
}

export type SupportTicket = {
  id: string
  ticket_number: string
  requester_type: 'customer' | 'restaurant' | 'driver' | 'other'
  requester_id: string | null
  requester_name: string
  requester_email: string
  category: 'order' | 'payment' | 'account' | 'technical' | 'other'
  subject: string
  description: string
  status: 'new' | 'in_progress' | 'waiting' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null
  related_order_id: string | null
  sla_deadline: string | null
  resolved_at: string | null
  closed_at: string | null
  created_at: string
  updated_at: string
  assigned_admin?: { full_name: string } | null
}

export type TicketMessage = {
  id: string
  ticket_id: string
  sender_type: 'admin' | 'customer' | 'restaurant' | 'driver' | 'system'
  sender_id: string | null
  sender_name: string
  content: string
  is_internal: boolean
  attachments: unknown[]
  created_at: string
}

export type ManualAdjustment = {
  id: string
  admin_user_id: string | null
  entity_type: 'order' | 'driver' | 'restaurant' | 'subscription'
  entity_id: string
  adjustment_type: string
  amount: number | null
  currency: string
  reason: string
  notes: string | null
  status: 'pending' | 'approved' | 'rejected' | 'applied'
  approved_by: string | null
  applied_at: string | null
  created_at: string
}

export type Promotion = {
  id: string
  code: string
  name: string
  description: string | null
  type: 'percentage' | 'fixed' | 'free_delivery'
  value: number
  min_order_amount: number | null
  max_discount_amount: number | null
  usage_limit: number | null
  usage_count: number
  per_user_limit: number
  restaurant_id: string | null
  valid_from: string
  valid_until: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
}

// Domain types (from existing tables)
export type Restaurant = {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  address: string | null
  phone: string | null
  logo_url: string | null
  is_active: boolean
  min_order_amount: number
  created_at: string
  updated_at: string
  profiles?: { email: string; full_name?: string } | null
  restaurant_subscriptions?: RestaurantSubscription[] | null
}

export type RestaurantSubscription = {
  id: string
  restaurant_id: string
  plan_id: string
  branch_count: number
  status: string
  current_period_start: string
  current_period_end: string
  monthly_amount: number
  created_at: string
  subscription_plans?: SubscriptionPlan | null
}

export type SubscriptionPlan = {
  id: string
  name: string
  price_per_branch: number
  max_branches: number | null
  features: string[]
  is_active: boolean
}

export type Driver = {
  id: string
  user_id: string
  full_name: string
  phone: string | null
  vehicle_type: 'bicycle' | 'motorcycle' | 'car'
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_plate: string | null
  status: 'available' | 'busy' | 'offline'
  earnings_rate: number
  rating_average: number | null
  total_deliveries: number
  is_documents_verified: boolean
  created_at: string
  profiles?: { email: string } | null
}

export type Order = {
  id: string
  restaurant_id: string
  customer_id: string
  driver_id: string | null
  branch_id: string | null
  status: string
  subtotal: number
  delivery_fee: number
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
  created_at: string
  updated_at: string
  restaurants?: { name: string; address: string | null } | null
  customers?: { full_name: string; phone: string | null } | null
  drivers?: { full_name: string; phone: string | null } | null
  order_items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

// KPI data types
export type DashboardKpis = {
  ordersToday: number
  ordersTodayChange: number
  grossRevenueToday: number
  grossRevenueTodayChange: number
  gmvToday: number
  gmvTodayChange: number
  activeRestaurants: number
  driversOnline: number
  avgTicketToday: number
  conversionRate: number
  unassignedOrders: number
  pendingTickets: number
  pendingDocuments: number
  expiringSubs: number
}

export type HourlyData = {
  hour: string
  orders: number
  revenue: number
}

export type Alert = {
  id: string
  type: 'order_stuck' | 'driver_conflict' | 'sub_expiring' | 'ticket_pending'
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  link?: string
  created_at: string
}
