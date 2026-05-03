import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate, formatDateOnly, ORDER_STATUS_LABELS, SUB_STATUS_LABELS } from '@/lib/utils'
import { ArrowLeft, Store, MapPin, Phone, Mail, Star, Package } from 'lucide-react'
import { RestaurantActions } from '@/components/restaurants/RestaurantActions'

async function getRestaurant(id: string) {
  const supabase = createAdminClient()
  const [{ data: restaurant }, { data: orders }, { data: subs }] = await Promise.all([
    supabase.from('restaurants').select(`
      *,
      restaurant_subscriptions(*, subscription_plans(*)),
      branches(id, name, address, is_active)
    `).eq('id', id).single(),
    supabase.from('orders')
      .select('id, status, total_amount, delivery_fee, created_at, customers(full_name)')
      .eq('restaurant_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('restaurant_subscriptions')
      .select('*, subscription_plans(*)')
      .eq('restaurant_id', id)
      .order('created_at', { ascending: false }),
  ])
  return { restaurant, orders, subs }
}

export default async function RestaurantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { restaurant, orders, subs } = await getRestaurant(id)
  if (!restaurant) notFound()

  const sub      = subs?.[0]
  const branches = restaurant.branches ?? []
  const delivered = orders?.filter(o => o.status === 'delivered') ?? []
  const monthRevenue = delivered.reduce((s: number, o: { total_amount: number | null }) => s + (o.total_amount ?? 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/restaurants"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{restaurant.name}</h1>
            <Badge variant={restaurant.is_active ? 'success' : 'destructive'}>
              {restaurant.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Registrado {formatDateOnly(restaurant.created_at)} · ID: <span className="font-mono text-xs">{restaurant.id.slice(0, 12)}…</span>
          </p>
        </div>
        <RestaurantActions restaurant={restaurant as never} adminId="" />
      </div>

      <Tabs defaultValue="info">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="branches">Sucursales ({branches.length})</TabsTrigger>
          <TabsTrigger value="orders">Pedidos ({orders?.length ?? 0})</TabsTrigger>
          <TabsTrigger value="subscriptions">Suscripción</TabsTrigger>
        </TabsList>

        {/* Info tab */}
        <TabsContent value="info" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Store className="h-4 w-4" /> Datos del negocio</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Row label="Nombre" value={restaurant.name} />
                <Row label="Slug" value={restaurant.slug} mono />
                <Row label="Teléfono" value={restaurant.phone ?? '—'} />
                <Row label="Dirección" value={restaurant.address ?? '—'} />
                <Row label="Pedido mínimo" value={formatCurrency(restaurant.min_order_amount)} />
                <Row label="Descripción" value={restaurant.description ?? '—'} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Mail className="h-4 w-4" /> Propietario</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Row label="Correo" value="—" />
                <Row label="User ID" value={restaurant.owner_id.slice(0, 16) + '…'} mono />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Métricas del mes</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Metric label="Pedidos" value={orders?.length ?? 0} />
                <Metric label="Entregados" value={delivered.length} />
                <Metric label="Ingresos" value={formatCurrency(monthRevenue)} />
                <Metric label="Sucursales" value={branches.length} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Branches tab */}
        <TabsContent value="branches" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Dirección</TableHead><TableHead>Estado</TableHead></TableRow></TableHeader>
                <TableBody>
                  {branches.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Sin sucursales</TableCell></TableRow>}
                  {branches.map((b: { id: string; name: string; address: string; is_active: boolean }) => (
                    <TableRow key={b.id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{b.address}</TableCell>
                      <TableCell><Badge variant={b.is_active ? 'success' : 'secondary'}>{b.is_active ? 'Activa' : 'Inactiva'}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders tab */}
        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Pedido</TableHead><TableHead>Cliente</TableHead><TableHead>Estado</TableHead><TableHead>Total</TableHead><TableHead>Fecha</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(orders ?? []).slice(0, 30).map((o: { id: string; status: string; total_amount: number | null; created_at: string; customers?: { full_name: string } | null }) => {
                    const st = ORDER_STATUS_LABELS[o.status]
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{o.customers?.full_name ?? '—'}</TableCell>
                        <TableCell><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${st?.color ?? ''}`}>{st?.label ?? o.status}</span></TableCell>
                        <TableCell className="font-medium">{formatCurrency(o.total_amount ?? 0)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(o.created_at)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscriptions tab */}
        <TabsContent value="subscriptions" className="mt-4">
          <div className="space-y-4">
            {subs?.map((s: { id: string; status: string; monthly_total_usd: number | null; branch_count: number; current_period_start: string; current_period_end: string; subscription_plans?: { display_name: string; name: string } | null }) => {
              const st = SUB_STATUS_LABELS[s.status]
              return (
                <Card key={s.id}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{s.subscription_plans?.display_name ?? s.subscription_plans?.name ?? 'Plan desconocido'}</p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${st?.color ?? ''}`}>{st?.label ?? s.status}</span>
                    </div>
                    <Separator />
                    <div className="grid grid-cols-2 gap-3">
                      <Row label="Pago mensual" value={formatCurrency(s.monthly_total_usd ?? 0)} />
                      <Row label="Sucursales" value={s.branch_count} />
                      <Row label="Inicio período" value={formatDateOnly(s.current_period_start)} />
                      <Row label="Fin período" value={formatDateOnly(s.current_period_end)} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Row({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-sm text-right ${mono ? 'font-mono text-xs' : 'font-medium'}`}>{value}</span>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  )
}
