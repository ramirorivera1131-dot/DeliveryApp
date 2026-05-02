'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, ShoppingBag, DollarSign, CreditCard, CheckCircle } from 'lucide-react'

type DayData = { day: string; ventas: number; pedidos: number }
type SubPlan = { display_name: string; price_per_branch_usd: number; features: string[] | null } | null
type SubInfo = { branch_count: number; monthly_total_usd: number; status: string; current_period_end?: string; subscription_plans: SubPlan } | null

type Props = {
  monthLabel: string
  totalRevenue: number
  totalOrders: number
  avgOrder: number
  dailyData: DayData[]
  subscription: SubInfo
}

const STATUS_LABEL: Record<string, string> = {
  active:    'Activa',
  trialing:  'Prueba',
  past_due:  'Vencida',
  cancelled: 'Cancelada',
}

export function EarningsView({ monthLabel, totalRevenue, totalOrders, avgOrder, dailyData, subscription }: Props) {
  const plan = subscription?.subscription_plans

  return (
    <div className="p-8 space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Ganancias</h1>
        <p className="mt-1 text-sm text-muted-foreground capitalize">{monthLabel}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        <StatCard
          icon={<DollarSign className="h-5 w-5" />}
          iconBg="bg-green-500"
          cardBg="bg-green-50 dark:bg-green-950/20"
          label="Ventas del mes"
          value={formatCurrency(totalRevenue)}
          valueColor="text-green-600 dark:text-green-400"
          hint="Solo pedidos entregados"
        />
        <StatCard
          icon={<ShoppingBag className="h-5 w-5" />}
          iconBg="bg-primary"
          cardBg="bg-primary/5"
          label="Pedidos completados"
          value={String(totalOrders)}
          valueColor="text-primary"
          hint={`Promedio ${formatCurrency(avgOrder)} por pedido`}
        />
        <StatCard
          icon={<CreditCard className="h-5 w-5" />}
          iconBg="bg-blue-500"
          cardBg="bg-blue-50 dark:bg-blue-950/20"
          label="Suscripción mensual"
          value={subscription ? formatCurrency(subscription.monthly_total_usd) : '—'}
          valueColor="text-blue-600 dark:text-blue-400"
          hint={
            plan
              ? `Plan ${plan.display_name}${subscription ? ` · ${STATUS_LABEL[subscription.status] ?? subscription.status}` : ''}`
              : 'Sin plan activo'
          }
        />
      </div>

      {/* Chart */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={18} className="text-primary" />
          <h2 className="font-semibold text-foreground">Ventas por día</h2>
        </div>
        {totalOrders === 0 ? (
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            Sin pedidos este mes.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyData} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={v => `$${v}`}
              />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), 'Ventas']}
                labelFormatter={l => `Día ${l}`}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--card))',
                  color: 'hsl(var(--foreground))',
                  fontSize: 12,
                }}
              />
              <Bar dataKey="ventas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Plan features */}
      {plan && (
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold text-foreground mb-4">Plan {plan.display_name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(plan.features as string[] | null)?.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle size={14} className="text-green-500 shrink-0" />
                {feature}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{subscription?.branch_count ?? 1} sucursal(es)</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(plan.price_per_branch_usd)} / sucursal / mes</p>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(subscription?.monthly_total_usd ?? plan.price_per_branch_usd)} / mes
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  icon, iconBg, cardBg, label, value, valueColor, hint,
}: {
  icon: React.ReactNode
  iconBg: string
  cardBg: string
  label: string
  value: string
  valueColor: string
  hint: string
}) {
  return (
    <div className={`rounded-2xl p-6 ${cardBg}`}>
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl text-white mb-4 ${iconBg}`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-2xl font-bold ${valueColor}`}>{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
