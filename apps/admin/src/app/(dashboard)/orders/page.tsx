import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from '@/lib/utils'
import { ShoppingBag, ExternalLink } from 'lucide-react'

async function getOrders() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('orders')
    .select(`
      id, status, total_amount, delivery_fee, created_at, delivery_address,
      restaurants(name),
      customers(full_name),
      drivers(full_name)
    `)
    .order('created_at', { ascending: false })
    .limit(100)
  return data ?? []
}

export default async function OrdersPage() {
  const orders = await getOrders()

  const byStatus = ORDER_STATUS_LABELS
  const counts = Object.keys(byStatus).reduce((acc, st) => {
    acc[st] = orders.filter(o => o.status === st).length
    return acc
  }, {} as Record<string, number>)

  const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit']
  const activeCount    = activeStatuses.reduce((s, st) => s + (counts[st] ?? 0), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pedidos</h1>
        <p className="text-muted-foreground text-sm mt-1">{orders.length} pedidos recientes · {activeCount} activos</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.entries(byStatus).map(([key, cfg]) => (
          counts[key] > 0 && (
            <div key={key} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.color}`}>
              {cfg.label}: {counts[key]}
            </div>
          )
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><ShoppingBag className="h-4 w-4" /> Todos los pedidos</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Restaurante</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Repartidor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">Sin pedidos</TableCell></TableRow>
              )}
              {orders.map(order => {
                const st = ORDER_STATUS_LABELS[order.status]
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{order.id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm font-medium">{(order as { restaurants?: { name: string } | null }).restaurants?.name ?? '—'}</TableCell>
                    <TableCell className="text-sm">{(order as { customers?: { full_name: string } | null }).customers?.full_name ?? '—'}</TableCell>
                    <TableCell className="text-sm">{(order as { drivers?: { full_name: string } | null }).drivers?.full_name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${st?.color ?? ''}`}>
                        {st?.label ?? order.status}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(order.total_amount ?? 0)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(order.created_at)}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/orders/${order.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
