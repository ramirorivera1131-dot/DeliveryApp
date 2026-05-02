import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyRestaurant, getMonthOrders, getRestaurantSubscription } from '@/lib/supabase/queries'
import { EarningsView } from '@/components/earnings/EarningsView'

export default async function EarningsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const restaurant = await getMyRestaurant()
  if (!restaurant) redirect('/dashboard')

  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()   // 0-indexed

  const [orders, subscription] = await Promise.all([
    getMonthOrders(restaurant.id, year, month),
    getRestaurantSubscription(restaurant.id),
  ])

  const delivered    = orders.filter((o) => o.status === 'delivered')
  const totalRevenue = delivered.reduce((sum, o) => sum + (o.subtotal ?? 0), 0)
  const totalOrders  = delivered.length
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Build daily data for the chart
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1
    const dayDelivered = delivered.filter(
      (o) => new Date(o.delivered_at ?? o.created_at).getDate() === day,
    )
    return {
      day:     day.toString(),
      ventas:  dayDelivered.reduce((sum, o) => sum + (o.subtotal ?? 0), 0),
      pedidos: dayDelivered.length,
    }
  })

  const monthLabel = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(now)

  return (
    <EarningsView
      monthLabel={monthLabel}
      totalRevenue={totalRevenue}
      totalOrders={totalOrders}
      avgOrder={avgOrder}
      dailyData={dailyData}
      subscription={subscription as Parameters<typeof EarningsView>[0]['subscription']}
    />
  )
}
