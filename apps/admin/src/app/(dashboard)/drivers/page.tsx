import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatDateOnly, DRIVER_STATUS_LABELS } from '@/lib/utils'
import { Bike, Star, ExternalLink } from 'lucide-react'

async function getDrivers() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('drivers')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function DriversPage() {
  const drivers = await getDrivers()
  const online   = drivers.filter(d => d.status === 'available' || d.status === 'busy').length
  const inactive = drivers.filter(d => !d.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Repartidores</h1>
          <p className="text-muted-foreground text-sm mt-1">{drivers.length} total · {online} en línea · {inactive} inactivos</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total',      value: drivers.length,                                icon: Bike },
          { label: 'En línea',  value: online,                                         icon: Bike },
          { label: 'Inactivos', value: inactive,                                       icon: Bike },
          { label: 'Activos',   value: drivers.filter(d => d.is_active).length,       icon: Bike },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-xl font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Bike className="h-4 w-4" /> Lista de repartidores</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Repartidor</TableHead>
                <TableHead>Vehículo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Calificación</TableHead>
                <TableHead>Carreras</TableHead>
                <TableHead>Comisión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">Sin repartidores registrados</TableCell>
                </TableRow>
              )}
              {drivers.map(driver => {
                const st = DRIVER_STATUS_LABELS[driver.status]
                return (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{driver.full_name}</p>
                        <p className="text-xs text-muted-foreground">{driver.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{driver.vehicle_type}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${st?.color ?? ''}`}>
                        {st?.label ?? driver.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        —
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">—</TableCell>
                    <TableCell className="text-sm">{Math.round(driver.earnings_rate * 100)}%</TableCell>
                    <TableCell>
                      <Badge variant={driver.is_active ? 'success' : 'destructive'}>{driver.is_active ? 'Activo' : 'Inactivo'}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateOnly(driver.created_at)}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/drivers/${driver.id}`}><ExternalLink className="h-3.5 w-3.5" /></Link>
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
