import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate, formatDateOnly, DRIVER_STATUS_LABELS, ORDER_STATUS_LABELS } from '@/lib/utils'
import { ArrowLeft, Bike, Star, ShieldCheck, ShieldAlert } from 'lucide-react'
import type { Driver } from '@/lib/types'

async function getDriver(id: string) {
  const supabase = createAdminClient()
  const [{ data: driver }, { data: orders }] = await Promise.all([
    supabase.from('drivers').select('*, profiles(email)').eq('id', id).single(),
    supabase.from('orders')
      .select('id, status, total_amount, delivery_fee, created_at, restaurants(name)')
      .eq('driver_id', id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])
  return { driver: driver as Driver | null, orders: orders ?? [] }
}

export default async function DriverDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { driver, orders } = await getDriver(id)
  if (!driver) notFound()

  const st        = DRIVER_STATUS_LABELS[driver.status]
  const delivered = orders.filter(o => o.status === 'delivered')
  const earnings  = delivered.reduce((s, o) => s + (o as { delivery_fee: number }).delivery_fee * driver.earnings_rate, 0)

  function Row({ label, value, mono }: { label: string; value: string | number; mono?: boolean }) {
    return (
      <div className="flex justify-between items-start gap-2">
        <span className="text-xs text-muted-foreground shrink-0">{label}</span>
        <span className={`text-sm text-right ${mono ? 'font-mono text-xs' : 'font-medium'}`}>{value}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Button asChild variant="ghost" size="icon">
          <Link href="/drivers"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{driver.full_name}</h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${st?.color ?? ''}`}>{st?.label}</span>
            {driver.is_documents_verified
              ? <Badge variant="success" className="gap-1"><ShieldCheck className="h-3 w-3" /> Verificado</Badge>
              : <Badge variant="destructive" className="gap-1"><ShieldAlert className="h-3 w-3" /> Sin verificar</Badge>}
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Registrado {formatDateOnly(driver.created_at)} · {driver.total_deliveries} carreras totales
          </p>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="orders">Historial ({orders.length})</TabsTrigger>
          <TabsTrigger value="earnings">Ganancias</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Bike className="h-4 w-4" /> Datos personales</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Row label="Nombre"    value={driver.full_name} />
                <Row label="Teléfono"  value={driver.phone ?? '—'} />
                <Row label="Vehículo"  value={driver.vehicle_type} />
                <Row label="Marca"     value={driver.vehicle_brand ?? '—'} />
                <Row label="Modelo"    value={driver.vehicle_model ?? '—'} />
                <Row label="Placa"     value={driver.vehicle_plate ?? '—'} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Métricas</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Row label="Calificación" value={driver.rating_average?.toFixed(2) ?? '—'} />
                <Row label="Total carreras" value={driver.total_deliveries} />
                <Row label="Comisión" value={`${Math.round(driver.earnings_rate * 100)}%`} />
                <Row label="Documentos" value={driver.is_documents_verified ? '✓ Verificados' : '✗ Pendientes'} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="orders" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Pedido</TableHead><TableHead>Restaurante</TableHead>
                  <TableHead>Estado</TableHead><TableHead>Tarifa</TableHead><TableHead>Fecha</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {orders.slice(0, 30).map(o => {
                    const st = ORDER_STATUS_LABELS[o.status]
                    return (
                      <TableRow key={o.id}>
                        <TableCell className="font-mono text-xs">{o.id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">{(o as { restaurants?: { name: string } | null }).restaurants?.name ?? '—'}</TableCell>
                        <TableCell><span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${st?.color ?? ''}`}>{st?.label ?? o.status}</span></TableCell>
                        <TableCell className="text-sm">{formatCurrency((o as { delivery_fee: number }).delivery_fee)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{formatDate(o.created_at)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earnings" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Carreras completadas', value: delivered.length },
              { label: 'Ganancias estimadas',  value: formatCurrency(earnings) },
              { label: 'Comisión aplicada',    value: `${Math.round(driver.earnings_rate * 100)}%` },
            ].map(m => (
              <Card key={m.label}>
                <CardContent className="p-5">
                  <p className="text-xs text-muted-foreground">{m.label}</p>
                  <p className="text-2xl font-bold mt-1">{m.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
