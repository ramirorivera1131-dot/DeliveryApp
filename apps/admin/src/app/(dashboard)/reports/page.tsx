import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RevenueChart } from '@/components/reports/RevenueChart'
import { BarChart3, Download, FileText, TrendingUp, Users, Store, Bike } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

async function getReportsData() {
  const supabase = createAdminClient()
  const last30   = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: orders }, { data: restaurants }, { data: drivers }] = await Promise.all([
    supabase.from('orders').select('id, status, total_amount, delivery_fee, created_at, restaurant_id, driver_id').gte('created_at', last30),
    supabase.from('restaurants').select('id, name, is_active'),
    supabase.from('drivers').select('id, full_name, earnings_rate'),
  ])

  const delivered    = orders?.filter(o => o.status === 'delivered') ?? []
  const dailyRevenue = new Map<string, number>()
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    dailyRevenue.set(d.toISOString().split('T')[0], 0)
  }
  delivered.forEach(o => {
    const day = o.created_at.split('T')[0]
    if (dailyRevenue.has(day)) dailyRevenue.set(day, (dailyRevenue.get(day) ?? 0) + o.delivery_fee * 0.15)
  })

  // Top restaurants
  const restaurantCounts = new Map<string, number>()
  delivered.forEach(o => {
    if (o.restaurant_id) restaurantCounts.set(o.restaurant_id, (restaurantCounts.get(o.restaurant_id) ?? 0) + 1)
  })
  const topRestaurants = restaurants
    ?.map(r => ({ ...r, count: restaurantCounts.get(r.id) ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5) ?? []

  // Top drivers
  const driverEarnings = new Map<string, number>()
  delivered.forEach(o => {
    if (o.driver_id) driverEarnings.set(o.driver_id, (driverEarnings.get(o.driver_id) ?? 0) + o.delivery_fee)
  })
  const topDrivers = drivers
    ?.map(d => ({ ...d, earnings: (driverEarnings.get(d.id) ?? 0) * d.earnings_rate }))
    .sort((a, b) => b.earnings - a.earnings)
    .slice(0, 5) ?? []

  return {
    chartData:      Array.from(dailyRevenue.entries()).map(([date, revenue]) => ({ date: date.slice(5), revenue })),
    totalRevenue:   delivered.reduce((s, o) => s + o.delivery_fee * 0.15, 0),
    totalGmv:       delivered.reduce((s, o) => s + (o.total_amount ?? 0), 0),
    totalOrders:    delivered.length,
    topRestaurants,
    topDrivers,
  }
}

export default async function ReportsPage() {
  const { chartData, totalRevenue, totalGmv, totalOrders, topRestaurants, topDrivers } = await getReportsData()

  const REPORT_CARDS = [
    { title: 'Ventas mensuales',        icon: TrendingUp, description: 'Ingresos desglosados por día y semana' },
    { title: 'Top restaurantes',        icon: Store,      description: 'Restaurantes con más pedidos del mes' },
    { title: 'Top repartidores',        icon: Bike,       description: 'Repartidores con más entregas' },
    { title: 'Análisis de cohortes',    icon: Users,      description: 'Retención y comportamiento de clientes' },
    { title: 'Horarios pico',           icon: BarChart3,  description: 'Distribución de pedidos por hora y día' },
    { title: 'Productos más vendidos',  icon: FileText,   description: 'Ranking de productos por volumen de ventas' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reportes</h1>
          <p className="text-muted-foreground text-sm mt-1">Análisis y estadísticas de los últimos 30 días</p>
        </div>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" /> Exportar
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Ingresos plataforma</p>
          <p className="text-2xl font-bold mt-1 text-primary">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-muted-foreground mt-1">Comisiones 30d</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">GMV total</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalGmv)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground">Pedidos entregados</p>
          <p className="text-2xl font-bold mt-1">{totalOrders}</p>
        </CardContent></Card>
      </div>

      {/* Revenue chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ingresos de plataforma — últimos 30 días</CardTitle>
          <CardDescription>Comisiones del 15% sobre tarifas de envío</CardDescription>
        </CardHeader>
        <CardContent>
          <RevenueChart data={chartData} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top restaurants */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Store className="h-4 w-4" /> Top restaurantes</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topRestaurants.map((r, i) => (
              <div key={r.id} className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                <p className="text-sm font-medium flex-1 truncate">{r.name}</p>
                <p className="text-sm font-bold text-primary">{r.count} pedidos</p>
              </div>
            ))}
            {!topRestaurants.length && <p className="text-sm text-muted-foreground">Sin datos</p>}
          </CardContent>
        </Card>

        {/* Top drivers */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Bike className="h-4 w-4" /> Top repartidores</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topDrivers.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3">
                <span className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                <p className="text-sm font-medium flex-1 truncate">{d.full_name}</p>
                <p className="text-sm font-bold text-primary">{formatCurrency(d.earnings)}</p>
              </div>
            ))}
            {!topDrivers.length && <p className="text-sm text-muted-foreground">Sin datos</p>}
          </CardContent>
        </Card>
      </div>

      {/* Report cards */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Reportes predefinidos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {REPORT_CARDS.map(r => (
            <Card key={r.title} className="cursor-pointer hover:shadow-md transition-shadow group">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <r.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{r.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.description}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="mt-3 w-full justify-between text-xs">
                  Generar reporte <Download className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
