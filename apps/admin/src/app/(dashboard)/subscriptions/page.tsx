import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDateOnly, SUB_STATUS_LABELS } from '@/lib/utils'
import { CreditCard, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'

async function getSubscriptionsData() {
  const supabase = createAdminClient()
  const { data: subs } = await supabase
    .from('restaurant_subscriptions')
    .select(`
      *, restaurants(name, is_active),
      subscription_plans(name, price_per_branch_usd)
    `)
    .order('current_period_end', { ascending: true })

  const { data: plans } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)

  return { subs: subs ?? [], plans: plans ?? [] }
}

export default async function SubscriptionsPage() {
  const { subs, plans } = await getSubscriptionsData()

  const active   = subs.filter(s => s.status === 'active')
  const pastDue  = subs.filter(s => s.status === 'past_due')
  const mrr      = active.reduce((s, sub) => s + (sub.monthly_total_usd ?? 0), 0)
  const expiring = subs.filter(s => {
    const end = new Date(s.current_period_end)
    return end <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && s.status === 'active'
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suscripciones</h1>
        <p className="text-muted-foreground text-sm mt-1">{subs.length} restaurantes · {active.length} activos</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">MRR</p>
          <p className="text-2xl font-bold mt-1 text-primary">{formatCurrency(mrr)}</p>
          <p className="text-xs text-muted-foreground mt-1">Ingresos recurrentes mensuales</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><CheckCircle className="h-3 w-3 text-green-600" /> Activas</p>
          <p className="text-2xl font-bold mt-1">{active.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><AlertCircle className="h-3 w-3 text-red-600" /> Vencidas</p>
          <p className="text-2xl font-bold mt-1 text-red-600">{pastDue.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1"><TrendingUp className="h-3 w-3 text-yellow-600" /> Vencen en 7d</p>
          <p className="text-2xl font-bold mt-1 text-yellow-600">{expiring.length}</p>
        </CardContent></Card>
      </div>

      {/* Plans summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {plans.map(plan => {
          const planSubs = active.filter(s => s.plan_id === plan.id)
          return (
            <Card key={plan.id}>
              <CardContent className="p-5">
                <p className="font-semibold">{plan.display_name || plan.name}</p>
                <p className="text-2xl font-bold mt-1">{planSubs.length} <span className="text-sm font-normal text-muted-foreground">restaurantes</span></p>
                <p className="text-xs text-muted-foreground mt-1">{formatCurrency(plan.price_per_branch_usd)}/sucursal/mes</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><CreditCard className="h-4 w-4" /> Todas las suscripciones</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Restaurante</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Sucursales</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Pago mensual</TableHead>
                <TableHead>Próximo cobro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map(sub => {
                const st   = SUB_STATUS_LABELS[sub.status]
                const isExpiring = expiring.some(e => e.id === sub.id)
                return (
                  <TableRow key={sub.id} className={isExpiring ? 'bg-yellow-50/50 dark:bg-yellow-900/10' : ''}>
                    <TableCell className="font-medium text-sm">{(sub as { restaurants?: { name: string } | null }).restaurants?.name ?? '—'}</TableCell>
                    <TableCell className="text-sm">{(sub as { subscription_plans?: { name: string } | null }).subscription_plans?.name ?? '—'}</TableCell>
                    <TableCell className="text-sm">{sub.branch_count}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${st?.color ?? ''}`}>{st?.label ?? sub.status}</span>
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(sub.monthly_total_usd)}</TableCell>
                    <TableCell className={`text-sm ${isExpiring ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>
                      {formatDateOnly(sub.current_period_end)}
                      {isExpiring && ' ⚠'}
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
