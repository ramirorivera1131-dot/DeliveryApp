import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyRestaurant, getActiveOrders } from '@/lib/supabase/queries'
import { OrdersBoard } from '@/components/orders/OrdersBoard'
import type { Order } from '@/components/orders/OrderCard'

export default async function OrdersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const restaurant = await getMyRestaurant()
  if (!restaurant) redirect('/dashboard')

  const orders = await getActiveOrders(restaurant.id)

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <OrdersBoard
        initialOrders={orders as unknown as Order[]}
        restaurantId={restaurant.id}
      />
    </div>
  )
}
