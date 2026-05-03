import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDateOnly, SUB_STATUS_LABELS } from '@/lib/utils'
import { Store, Plus, ExternalLink } from 'lucide-react'
import type { Restaurant } from '@/lib/types'

async function getRestaurants() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('restaurants')
    .select(`
      id, name, slug, phone, is_active, created_at,
      profiles(email),
      restaurant_subscriptions(
        status, monthly_amount, current_period_end, branch_count,
        subscription_plans(name)
      )
    `)
    .order('created_at', { ascending: false })
  return (data ?? []) as unknown as Restaurant[]
}

export default async function RestaurantsPage() {
  const restaurants = await getRestaurants()
  const active   = restaurants.filter(r => r.is_active).length
  const inactive = restaurants.filter(r => !r.is_active).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Restaurantes</h1>
          <p className="text-muted-foreground text-sm mt-1">{restaurants.length} total · {active} activos · {inactive} inactivos</p>
        </div>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Registrar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total', value: restaurants.length, color: 'text-foreground' },
          { label: 'Activos', value: active, color: 'text-green-600' },
          { label: 'Inactivos', value: inactive, color: 'text-red-600' },
          { label: 'Con plan activo', value: restaurants.filter(r => r.restaurant_subscriptions?.[0]?.status === 'active').length, color: 'text-primary' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Store className="h-4 w-4" /> Lista de restaurantes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurante</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Sucursales</TableHead>
                <TableHead>Estado suscripción</TableHead>
                <TableHead>Pago mensual</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {restaurants.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No hay restaurantes registrados
                  </TableCell>
                </TableRow>
              )}
              {restaurants.map(restaurant => {
                const sub    = restaurant.restaurant_subscriptions?.[0]
                const plan   = sub?.subscription_plans
                const subSt  = SUB_STATUS_LABELS[sub?.status ?? '']
                return (
                  <TableRow key={restaurant.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-sm">{restaurant.name}</p>
                        <p className="text-xs text-muted-foreground">{restaurant.profiles?.email ?? '—'}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{plan?.name ?? '—'}</TableCell>
                    <TableCell className="text-sm">{sub?.branch_count ?? '—'}</TableCell>
                    <TableCell>
                      {subSt ? (
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${subSt.color}`}>
                          {subSt.label}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {sub?.monthly_amount ? formatCurrency(sub.monthly_amount) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={restaurant.is_active ? 'success' : 'destructive'}>
                        {restaurant.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDateOnly(restaurant.created_at)}</TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/restaurants/${restaurant.id}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
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
