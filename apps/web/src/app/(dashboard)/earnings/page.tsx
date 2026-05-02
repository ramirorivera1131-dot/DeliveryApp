'use client'
import { EarningsView } from '@/components/earnings/EarningsView'
import { useRestaurant, useSubscription } from '@/hooks/use-restaurant'
import { useMonthOrders } from '@/hooks/use-orders'
import { Skeleton } from '@/components/ui/skeleton'

export default function EarningsPage() {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth()

  const { data: restaurant, isLoading: loadingR } = useRestaurant()
  const { data: orders = [],  isLoading: loadingO } = useMonthOrders(restaurant?.id, year, month)
  const { data: subscription }                      = useSubscription(restaurant?.id)

  if (loadingR || loadingO) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-40" />
        <div className="grid grid-cols-3 gap-5">
          {[0, 1, 2].map(i => <Skeleton key={i} className="h-36 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    )
  }

  const delivered    = orders.filter(o => o.status === 'delivered')
  const totalRevenue = delivered.reduce((sum, o) => sum + (o.subtotal ?? 0), 0)
  const totalOrders  = delivered.length
  const avgOrder     = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const dailyData   = Array.from({ length: daysInMonth }, (_, i) => {
    const day          = i + 1
    const dayDelivered = delivered.filter(
      o => new Date(o.delivered_at ?? o.created_at).getDate() === day,
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
