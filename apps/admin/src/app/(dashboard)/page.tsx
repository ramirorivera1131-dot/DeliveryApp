import {
  ShoppingBag, DollarSign, TrendingUp, Store, Bike,
  Receipt, Percent, AlertTriangle, HeadphonesIcon, FileCheck,
} from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { HourlyChart } from '@/components/dashboard/HourlyChart'
import { AlertsFeed } from '@/components/dashboard/AlertsFeed'
import { AuditFeed } from '@/components/dashboard/AuditFeed'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { pctChange } from '@/lib/utils'
import type { Alert, HourlyData, AuditLog } from '@/lib/types'

async function getDashboardData() {
  const supabase = createAdminClient()
  const now      = new Date()
  const todayStart  = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const yesterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString()
  const yesterEnd   = todayStart

  const [
    { data: todayOrders },
    { data: yesterOrders },
    { data: restaurants },
    { data: drivers },
    { data: stuckOrders },
    { data: pendingTickets },
    { data: pendingDocs },
    { data: expiringSubs },
    { data: recentLogs },
  ] = await Promise.all([
    supabase.from('orders').select('id, total_amount, delivery_fee, status, created_at').gte('created_at', todayStart),
    supabase.from('orders').select('id, total_amount, delivery_fee, status').gte('created_at', yesterStart).lt('created_at', yesterEnd),
    supabase.from('restaurants').select('id, is_active').eq('is_active', true),
    supabase.from('drivers').select('id, status'),
    supabase.from('orders')
      .select('id')
      .eq('status', 'ready')
      .is('driver_id', null)
      .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
    supabase.from('support_tickets').select('id').in('status', ['new', 'in_progress']),
    supabase.from('drivers').select('id').eq('is_active', false),
    supabase.from('restaurant_subscriptions')
      .select('id')
      .lt('current_period_end', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .eq('status', 'active'),
    supabase.from('audit_log')
      .select('*, admin_users(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  const todayDelivered  = todayOrders?.filter(o => o.status === 'delivered') ?? []
  const yesterDelivered = yesterOrders?.filter(o => o.status === 'delivered') ?? []

  const ordersToday        = todayOrders?.length ?? 0
  const ordersYest         = yesterOrders?.length ?? 0
  const grossRevenueToday  = todayDelivered.reduce((s, o) => s + (o.delivery_fee ?? 0), 0)
  const grossRevenueYest   = yesterDelivered.reduce((s, o) => s + (o.delivery_fee ?? 0), 0)
  const gmvToday           = todayDelivered.reduce((s, o) => s + (o.total_amount ?? 0), 0)
  const gmvYest            = yesterDelivered.reduce((s, o) => s + (o.total_amount ?? 0), 0)
  const avgTicketToday     = todayDelivered.length > 0 ? gmvToday / todayDelivered.length : 0
  const avgTicketYest      = yesterDelivered.length > 0 ? gmvYest / yesterDelivered.length : 0
  const conversionRate     = ordersToday > 0 ? Math.round((todayDelivered.length / ordersToday) * 100) : 0
  const driversOnline      = drivers?.filter(d => d.status === 'available' || d.status === 'busy').length ?? 0

  // Build hourly data
  const hourlyMap = new Map<string, number>()
  for (let h = 0; h < 24; h++) hourlyMap.set(`${String(h).padStart(2, '0')}:00`, 0)
  todayOrders?.forEach(o => {
    const h = new Date(o.created_at).getHours()
    const key = `${String(h).padStart(2, '0')}:00`
    hourlyMap.set(key, (hourlyMap.get(key) ?? 0) + 1)
  })
  const hourlyData: HourlyData[] = Array.from(hourlyMap.entries()).map(([hour, orders]) => ({ hour, orders, revenue: 0 }))

  // Build alerts
  const alerts: Alert[] = []
  if ((stuckOrders?.length ?? 0) > 0) alerts.push({
    id: 'stuck', type: 'order_stuck',
    title: `${stuckOrders!.length} pedido(s) sin repartidor`,
    description: 'Sin asignar hace más de 5 minutos',
    severity: 'high', link: '/orders?status=ready',
    created_at: new Date().toISOString(),
  })
  if ((pendingTickets?.length ?? 0) > 0) alerts.push({
    id: 'tickets', type: 'ticket_pending',
    title: `${pendingTickets!.length} ticket(s) de soporte abiertos`,
    description: 'Requieren atención del equipo',
    severity: 'medium', link: '/support',
    created_at: new Date().toISOString(),
  })
  if ((pendingDocs?.length ?? 0) > 0) alerts.push({
    id: 'docs', type: 'driver_conflict',
    title: `${pendingDocs!.length} repartidor(es) sin documentos`,
    description: 'Documentos pendientes de validación',
    severity: 'medium', link: '/drivers?filter=unverified',
    created_at: new Date().toISOString(),
  })
  if ((expiringSubs?.length ?? 0) > 0) alerts.push({
    id: 'subs', type: 'sub_expiring',
    title: `${expiringSubs!.length} suscripción(es) vencen en 7 días`,
    description: 'Revisar y contactar restaurantes',
    severity: 'low', link: '/subscriptions?filter=expiring',
    created_at: new Date().toISOString(),
  })

  return {
    kpis: {
      ordersToday, ordersChange: pctChange(ordersToday, ordersYest),
      grossRevenueToday, grossRevenueChange: pctChange(grossRevenueToday, grossRevenueYest),
      gmvToday, gmvChange: pctChange(gmvToday, gmvYest),
      activeRestaurants: restaurants?.length ?? 0,
      driversOnline,
      avgTicketToday, avgTicketChange: pctChange(avgTicketToday, avgTicketYest),
      conversionRate,
    },
    hourlyData,
    alerts,
    recentLogs: (recentLogs ?? []) as AuditLog[],
  }
}

export default async function DashboardHome() {
  const { kpis, hourlyData, alerts, recentLogs } = await getDashboardData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inicio</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen operativo en tiempo real</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Pedidos hoy"         value={kpis.ordersToday}       change={kpis.ordersChange}       icon={ShoppingBag}  iconBg="bg-primary/10" />
        <KpiCard title="Ingresos brutos hoy" value={kpis.grossRevenueToday} change={kpis.grossRevenueChange} icon={DollarSign}   iconBg="bg-emerald-100 dark:bg-emerald-900/30" isCurrency />
        <KpiCard title="GMV hoy"             value={kpis.gmvToday}          change={kpis.gmvChange}          icon={TrendingUp}   iconBg="bg-blue-100 dark:bg-blue-900/30" isCurrency />
        <KpiCard title="Ticket promedio"     value={kpis.avgTicketToday}    change={kpis.avgTicketChange}    icon={Receipt}      iconBg="bg-purple-100 dark:bg-purple-900/30" isCurrency />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard title="Restaurantes activos" value={kpis.activeRestaurants} icon={Store} iconBg="bg-orange-100 dark:bg-orange-900/30" />
        <KpiCard title="Repartidores en línea" value={kpis.driversOnline}   icon={Bike}  iconBg="bg-cyan-100 dark:bg-cyan-900/30" />
        <KpiCard title="Tasa de conversión"   value={`${kpis.conversionRate}%`} icon={Percent} iconBg="bg-indigo-100 dark:bg-indigo-900/30" />
      </div>

      {/* Charts & Alerts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Pedidos por hora — hoy</CardTitle>
            <CardDescription>Distribución horaria del día actual</CardDescription>
          </CardHeader>
          <CardContent>
            <HourlyChart data={hourlyData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Alertas operativas
              {alerts.length > 0 && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                  {alerts.length}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlertsFeed alerts={alerts} />
          </CardContent>
        </Card>
      </div>

      {/* Audit log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-muted-foreground" />
            Últimas acciones del equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AuditFeed logs={recentLogs} />
        </CardContent>
      </Card>
    </div>
  )
}
