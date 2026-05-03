import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { formatCurrency, formatDate, ORDER_STATUS_LABELS } from '@/lib/utils'
import { ArrowLeft, MapPin, Clock, Store, User, Bike, Package } from 'lucide-react'

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'in_transit', 'delivered']

async function getOrder(id: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('orders')
    .select(`
      *, restaurants(name, address, phone),
      customers(full_name, phone),
      drivers(full_name, phone, vehicle_type),
      order_items(*)
    `)
    .eq('id', id)
    .single()
  return data
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id }  = await params
  const order   = await getOrder(id)
  if (!order) notFound()

  const st = ORDER_STATUS_LABELS[order.status]
  const currentStep = STATUS_FLOW.indexOf(order.status)

  const timestamps: { label: string; value: string | null }[] = [
    { label: 'Creado',    value: order.created_at },
    { label: 'Confirmado', value: order.confirmed_at },
    { label: 'Preparando', value: order.preparing_at },
    { label: 'Listo',     value: order.ready_at },
    { label: 'Recogido',  value: order.picked_up_at },
    { label: 'Entregado', value: order.delivered_at },
    { label: 'Cancelado', value: order.cancelled_at },
  ].filter(t => t.value)

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/orders"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono">#{order.id.slice(0, 8).toUpperCase()}</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${st?.color ?? ''}`}>{st?.label}</span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">{formatDate(order.created_at)}</p>
        </div>
      </div>

      {/* Status timeline */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Línea de tiempo</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FLOW.filter(s => s !== 'cancelled').map((s, i) => {
              const done = currentStep >= i && order.status !== 'cancelled'
              const cfg  = ORDER_STATUS_LABELS[s]
              return (
                <div key={s} className="flex items-center gap-2">
                  <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all ${done ? cfg.color : 'bg-muted text-muted-foreground'}`}>
                    {done && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                    {cfg.label}
                  </div>
                  {i < STATUS_FLOW.filter(s => s !== 'cancelled').length - 1 && (
                    <div className={`h-0.5 w-4 ${done && currentStep > i ? 'bg-primary' : 'bg-border'}`} />
                  )}
                </div>
              )
            })}
          </div>
          {timestamps.length > 0 && (
            <div className="mt-4 space-y-1">
              {timestamps.map(t => (
                <div key={t.label} className="flex items-center gap-3 text-xs">
                  <span className="w-20 text-muted-foreground">{t.label}</span>
                  <span className="font-mono">{formatDate(t.value!)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Participants */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Participantes</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
                <Store className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Restaurante</p>
                <p className="font-medium text-sm">{order.restaurants?.name ?? '—'}</p>
                <p className="text-xs text-muted-foreground">{order.restaurants?.address ?? ''}</p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                <p className="font-medium text-sm">{order.customers?.full_name ?? '—'}</p>
                {order.customers?.phone && <p className="text-xs text-muted-foreground">{order.customers.phone}</p>}
              </div>
            </div>
            <Separator />
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                <Bike className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Repartidor</p>
                <p className="font-medium text-sm">{order.drivers?.full_name ?? <span className="text-muted-foreground italic">No asignado</span>}</p>
                {order.drivers?.phone && <p className="text-xs text-muted-foreground">{order.drivers.phone}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financials */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Desglose financiero</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal productos</span><span>{formatCurrency(order.subtotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tarifa de envío</span><span>{formatCurrency(order.delivery_fee)}</span></div>
            <Separator />
            <div className="flex justify-between font-bold"><span>Total</span><span>{formatCurrency(order.total_amount ?? 0)}</span></div>
            <Separator />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Ganancia repartidor (85%)</span><span>{formatCurrency(order.delivery_fee * 0.85)}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Comisión plataforma (15%)</span><span>{formatCurrency(order.delivery_fee * 0.15)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order items */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Artículos del pedido</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {order.order_items?.map(item => (
            <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-primary">{item.quantity}×</span>
                <span className="text-sm">{item.product_name}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatCurrency(item.subtotal ?? item.unit_price * item.quantity)}</p>
                <p className="text-xs text-muted-foreground">{formatCurrency(item.unit_price)} c/u</p>
              </div>
            </div>
          ))}
          {order.notes && (
            <div className="mt-3 rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground font-medium mb-1">Notas del cliente:</p>
              <p className="text-sm">{order.notes}</p>
            </div>
          )}
          <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{order.delivery_address}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
