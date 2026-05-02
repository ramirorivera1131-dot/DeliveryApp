import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMyRestaurant, getTodayOrders } from '@/lib/supabase/queries'
import { formatCurrency } from '@/lib/utils'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable'
import { ShoppingBag, DollarSign, Clock, CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const restaurant = await getMyRestaurant()
  if (!restaurant) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 text-sm">No tienes un restaurante configurado.</p>
          <p className="text-gray-400 text-xs mt-1">Contacta al administrador para activar tu cuenta.</p>
        </div>
      </div>
    )
  }

  const orders = await getTodayOrders(restaurant.id)

  const delivered = orders.filter((o) => o.status === 'delivered')
  const active    = orders.filter((o) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status))
  const cancelled = orders.filter((o) => o.status === 'cancelled')
  const revenue   = delivered.reduce((sum, o) => sum + (o.subtotal ?? 0), 0)
  const avgOrder  = delivered.length > 0 ? revenue / delivered.length : 0

  const dayLabel = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date())

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-400 capitalize">{dayLabel}</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <StatsCard
          title="Pedidos hoy"
          value={orders.length.toString()}
          sub={`${cancelled.length} cancelados`}
          icon={ShoppingBag}
          color="orange"
        />
        <StatsCard
          title="Ingresos hoy"
          value={formatCurrency(revenue)}
          sub={`Promedio ${formatCurrency(avgOrder)}`}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="En proceso"
          value={active.length.toString()}
          sub="Necesitan atención"
          icon={Clock}
          color="yellow"
          pulse={active.length > 0}
        />
        <StatsCard
          title="Completados"
          value={delivered.length.toString()}
          sub="Entregados hoy"
          icon={CheckCircle}
          color="blue"
        />
      </div>

      <RecentOrdersTable orders={orders as Parameters<typeof RecentOrdersTable>[0]['orders']} />
    </div>
  )
}
