import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, TrendingUp, Users, RefreshCw } from 'lucide-react'

async function getPaymentsData() {
  const supabase = createAdminClient()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()

  const [{ data: orders }, { data: subs }] = await Promise.all([
    supabase.from('orders')
      .select('id, status, total_amount, delivery_fee, created_at, restaurants(name), drivers(full_name)')
      .eq('status', 'delivered')
      .gte('delivered_at', monthStart)
      .order('created_at', { ascending: false }),
    supabase.from('restaurant_subscriptions')
      .select('*, restaurants(name), subscription_plans(name, price_per_branch_usd)')
      .eq('status', 'active')
      .order('current_period_end', { ascending: false }),
  ])

  return { orders: orders ?? [], subs: subs ?? [] }
}

export default async function PaymentsPage() {
  const { orders, subs } = await getPaymentsData()

  const totalRevenue    = orders.reduce((s, o) => s + o.delivery_fee, 0)
  const totalGmv        = orders.reduce((s, o) => s + (o.total_amount ?? 0), 0)
  const driverPayouts   = orders.reduce((s, o) => s + o.delivery_fee * 0.85, 0)
  const platformRevenue = orders.reduce((s, o) => s + o.delivery_fee * 0.15, 0)
  const subsRevenue     = subs.reduce((s, sub) => s + sub.monthly_total_usd, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pagos y Finanzas</h1>
        <p className="text-muted-foreground text-sm mt-1">Resumen financiero del mes actual</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><DollarSign className="h-3 w-3" /> Ingresos plataforma</p>
          <p className="text-2xl font-bold mt-1 text-primary">{formatCurrency(platformRevenue + subsRevenue)}</p>
          <p className="text-xs text-muted-foreground mt-1">Comisiones + suscripciones</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><TrendingUp className="h-3 w-3" /> GMV del mes</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalGmv)}</p>
          <p className="text-xs text-muted-foreground mt-1">Volumen total transado</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><Users className="h-3 w-3" /> Pago repartidores</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(driverPayouts)}</p>
          <p className="text-xs text-muted-foreground mt-1">85% de tarifas de envío</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><RefreshCw className="h-3 w-3" /> MRR suscripciones</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(subsRevenue)}</p>
          <p className="text-xs text-muted-foreground mt-1">{subs.length} activas</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="commissions">
        <TabsList>
          <TabsTrigger value="commissions">Comisiones de envío ({orders.length})</TabsTrigger>
          <TabsTrigger value="subscriptions">Suscripciones ({subs.length})</TabsTrigger>
          <TabsTrigger value="drivers">Liquidación repartidores</TabsTrigger>
        </TabsList>

        <TabsContent value="commissions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Pedido</TableHead><TableHead>Restaurante</TableHead>
                  <TableHead>Repartidor</TableHead><TableHead>Tarifa</TableHead>
                  <TableHead>Plataforma (15%)</TableHead><TableHead>Repartidor (85%)</TableHead><TableHead>Fecha</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {orders.slice(0, 50).map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                      <TableCell className="text-sm">{(o as { restaurants?: { name: string } | null }).restaurants?.name ?? '—'}</TableCell>
                      <TableCell className="text-sm">{(o as { drivers?: { full_name: string } | null }).drivers?.full_name ?? '—'}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(o.delivery_fee)}</TableCell>
                      <TableCell className="text-green-600 font-medium">{formatCurrency(o.delivery_fee * 0.15)}</TableCell>
                      <TableCell className="text-blue-600 font-medium">{formatCurrency(o.delivery_fee * 0.85)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(o.created_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Restaurante</TableHead><TableHead>Plan</TableHead>
                  <TableHead>Sucursales</TableHead><TableHead>Monto</TableHead><TableHead>Próx. cobro</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {subs.map(sub => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-medium text-sm">{(sub as { restaurants?: { name: string } | null }).restaurants?.name ?? '—'}</TableCell>
                      <TableCell className="text-sm">{(sub as { subscription_plans?: { name: string } | null }).subscription_plans?.name ?? '—'}</TableCell>
                      <TableCell className="text-sm">{sub.branch_count}</TableCell>
                      <TableCell className="font-medium text-primary">{formatCurrency(sub.monthly_total_usd)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{sub.current_period_end.split('T')[0]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground text-center">
                La liquidación automática a repartidores se configurará en la próxima versión con integración a Stripe Connect.
              </p>
              <div className="mt-4 rounded-lg bg-muted p-4">
                <p className="text-sm font-medium">Total pendiente de liquidar este mes</p>
                <p className="text-3xl font-bold text-primary mt-1">{formatCurrency(driverPayouts)}</p>
                <p className="text-xs text-muted-foreground mt-1">{orders.length} entregas completadas</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
