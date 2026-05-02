'use client'
import { useMemo } from 'react'
import {
  ShoppingBag, DollarSign, Clock, CheckCircle, Star, TrendingUp, AlertTriangle,
} from 'lucide-react'
import { useRestaurant } from '@/hooks/use-restaurant'
import { useTodayOrders, useMonthOrders } from '@/hooks/use-orders'
import { useProducts } from '@/hooks/use-menu'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { RevenueChart, OrdersByHourChart } from '@/components/dashboard/RevenueChart'
import { TopProducts } from '@/components/dashboard/TopProducts'
import { RecentOrdersTable } from '@/components/dashboard/RecentOrdersTable'
import { formatDate } from '@/lib/utils'
import type { Order } from '@/lib/types'

const now = new Date()

function buildDailyRevenue(orders: { created_at: string; subtotal: number; status: string }[]) {
  const map = new Map<string, number>()
  const delivered = orders.filter(o => o.status === 'delivered')
  const days = 30
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.getDate().toString().padStart(2, '0')
    map.set(key, 0)
  }
  for (const o of delivered) {
    const d = new Date(o.created_at)
    const key = d.getDate().toString().padStart(2, '0')
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + o.subtotal)
  }
  return Array.from(map.entries()).map(([day, revenue]) => ({
    day, revenue, orders: 0,
  }))
}

function buildHourlyOrders(orders: { created_at: string }[]) {
  const map = new Map<string, number>()
  for (let h = 0; h < 24; h++) {
    map.set(h.toString().padStart(2, '0'), 0)
  }
  for (const o of orders) {
    const h = new Date(o.created_at).getHours().toString().padStart(2, '0')
    map.set(h, (map.get(h) ?? 0) + 1)
  }
  return Array.from(map.entries()).map(([hour, orders]) => ({ hour: `${hour}h`, orders }))
}

function buildTopProducts(orders: Order[]) {
  const map = new Map<string, { count: number; revenue: number }>()
  for (const o of orders.filter(o => o.status === 'delivered')) {
    for (const item of o.order_items ?? []) {
      const prev = map.get(item.product_name) ?? { count: 0, revenue: 0 }
      map.set(item.product_name, {
        count:   prev.count + item.quantity,
        revenue: prev.revenue + item.subtotal,
      })
    }
  }
  return Array.from(map.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
}

export default function DashboardPage() {
  const { data: restaurant } = useRestaurant()
  const { data: todayOrders = [], isLoading: loadingToday } = useTodayOrders(restaurant?.id)
  const { data: monthOrders = [], isLoading: loadingMonth } = useMonthOrders(
    restaurant?.id, now.getFullYear(), now.getMonth()
  )
  const { data: products = [] } = useProducts(restaurant?.id)

  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const { data: prevOrders = [] } = useMonthOrders(
    restaurant?.id, prevMonthStart.getFullYear(), prevMonthStart.getMonth()
  )

  const loading = loadingToday || loadingMonth

  const kpis = useMemo(() => {
    const delivered     = todayOrders.filter(o => o.status === 'delivered')
    const prevDelivered = prevOrders.filter(o => o.status === 'delivered')

    const todayRevenue  = delivered.reduce((s, o) => s + (o.subtotal ?? 0), 0)
    const prevRevenue   = prevDelivered.reduce((s, o) => s + (o.subtotal ?? 0), 0)
    const avgTicket     = delivered.length ? todayRevenue / delivered.length : 0
    const prevAvgTicket = prevDelivered.length ? prevRevenue / prevDelivered.length : 0
    const acceptance    = todayOrders.length
      ? (todayOrders.filter(o => o.status !== 'cancelled').length / todayOrders.length) * 100
      : 0
    const prevAcceptance = prevOrders.length
      ? (prevOrders.filter(o => o.status !== 'cancelled').length / prevOrders.length) * 100
      : 0

    return { todayRevenue, prevRevenue, todayCount: todayOrders.length, prevCount: prevOrders.length,
      avgTicket, prevAvgTicket, acceptance, prevAcceptance }
  }, [todayOrders, prevOrders])

  const dailyData    = useMemo(() => buildDailyRevenue(monthOrders), [monthOrders])
  const hourlyData   = useMemo(() => buildHourlyOrders(monthOrders), [monthOrders])
  const topProducts  = useMemo(() => buildTopProducts(monthOrders as Order[]), [monthOrders])

  const unavailableProducts  = products.filter(p => !p.is_available).length
  const pendingOrders        = todayOrders.filter(o => o.status === 'pending').length

  const dayLabel = new Intl.DateTimeFormat('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date())

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground capitalize mt-0.5">{dayLabel}</p>
      </div>

      {/* Alerts */}
      {(pendingOrders > 0 || unavailableProducts > 0) && (
        <div className="flex flex-wrap gap-3">
          {pendingOrders > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-2 text-sm text-yellow-800 dark:text-yellow-300">
              <AlertTriangle size={14} />
              <span><strong>{pendingOrders}</strong> pedido{pendingOrders > 1 ? 's' : ''} esperando aceptación</span>
            </div>
          )}
          {unavailableProducts > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 px-3 py-2 text-sm text-orange-800 dark:text-orange-300">
              <AlertTriangle size={14} />
              <span><strong>{unavailableProducts}</strong> producto{unavailableProducts > 1 ? 's' : ''} marcados como no disponibles</span>
            </div>
          )}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        <KpiCard
          title="Pedidos hoy"
          value={kpis.todayCount}
          prev={kpis.prevCount}
          icon={ShoppingBag}
          loading={loading}
          alert={pendingOrders > 0 ? `${pendingOrders} sin atender` : undefined}
        />
        <KpiCard
          title="Ingresos hoy"
          value={kpis.todayRevenue}
          prev={kpis.prevRevenue}
          format="currency"
          icon={DollarSign}
          iconColor="text-green-600"
          loading={loading}
        />
        <KpiCard
          title="Ticket promedio"
          value={kpis.avgTicket}
          prev={kpis.prevAvgTicket}
          format="currency"
          icon={TrendingUp}
          iconColor="text-blue-600"
          loading={loading}
        />
        <KpiCard
          title="Tasa de aceptación"
          value={kpis.acceptance}
          prev={kpis.prevAcceptance}
          format="percent"
          icon={CheckCircle}
          iconColor="text-green-600"
          loading={loading}
        />
        <KpiCard
          title="Entregados hoy"
          value={todayOrders.filter(o => o.status === 'delivered').length}
          prev={prevOrders.filter(o => o.status === 'delivered').length}
          icon={CheckCircle}
          iconColor="text-purple-600"
          loading={loading}
        />
        <KpiCard
          title="Cancelados hoy"
          value={todayOrders.filter(o => o.status === 'cancelled').length}
          prev={prevOrders.filter(o => o.status === 'cancelled').length}
          icon={Clock}
          iconColor="text-red-500"
          loading={loading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <RevenueChart data={dailyData} />
        <OrdersByHourChart data={hourlyData} />
      </div>

      {/* Bottom section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <RecentOrdersTable orders={todayOrders.slice(0, 10) as Parameters<typeof RecentOrdersTable>[0]['orders']} />
        </div>
        <TopProducts products={topProducts} />
      </div>
    </div>
  )
}
