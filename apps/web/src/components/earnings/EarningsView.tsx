'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, ShoppingBag, DollarSign, CreditCard } from 'lucide-react'

type DayData  = { day: string; ventas: number; pedidos: number }
type SubPlan  = { display_name: string; price_per_branch_usd: number; features: string[] | null } | null
type SubInfo  = { branch_count: number; monthly_total_usd: number; status: string; subscription_plans: SubPlan } | null

type Props = {
  monthLabel: string
  totalRevenue: number
  totalOrders: number
  avgOrder: number
  dailyData: DayData[]
  subscription: SubInfo
}

const STATUS_LABEL: Record<string, string> = {
  active:   'Activa',
  trialing: 'Prueba',
  past_due: 'Vencida',
  cancelled: 'Cancelada',
}

export function EarningsView({ monthLabel, totalRevenue, totalOrders, avgOrder, dailyData, subscription }: Props) {
  const plan = subscription?.subscription_plans

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Ganancias</h1>
        <p className="mt-1 text-sm text-gray-400 capitalize">{monthLabel}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
        <div className="rounded-2xl bg-green-50 p-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-green-500 text-white mb-4">
            <DollarSign className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-gray-500">Ventas del mes</p>
          <p className="mt-0.5 text-2xl font-bold text-green-600">{formatCurrency(totalRevenue)}</p>
          <p className="mt-1 text-xs text-gray-400">100% de los pedidos entregados</p>
        </div>

        <div className="rounded-2xl bg-orange-50 p-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white mb-4">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-gray-500">Pedidos completados</p>
          <p className="mt-0.5 text-2xl font-bold text-orange-600">{totalOrders}</p>
          <p className="mt-1 text-xs text-gray-400">Promedio {formatCurrency(avgOrder)} por pedido</p>
        </div>

        <div className="rounded-2xl bg-blue-50 p-6">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white mb-4">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium text-gray-500">Suscripción mensual</p>
          <p className="mt-0.5 text-2xl font-bold text-blue-600">
            {subscription ? formatCurrency(subscription.monthly_total_usd) : '—'}
          </p>
          <p className="mt-1 text-xs text-gray-400">
            {plan ? `Plan ${plan.display_name}` : 'Sin plan activo'}
            {subscription && (
              <span className={`ml-2 font-medium ${subscription.status === 'active' ? 'text-green-500' : 'text-yellow-500'}`}>
                · {STATUS_LABEL[subscription.status] ?? subscription.status}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="rounded-2xl bg-white border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={18} className="text-orange-500" />
          <h2 className="font-semibold text-gray-900">Ventas por día</h2>
        </div>
        {totalOrders === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
            Sin pedidos este mes.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyData} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v}`}
              />
              <Tooltip
                formatter={(v: number) => [formatCurrency(v), 'Ventas']}
                labelFormatter={(l) => `Día ${l}`}
                contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', fontSize: 12 }}
              />
              <Bar dataKey="ventas" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Plan features */}
      {plan && (
        <div className="rounded-2xl bg-white border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Plan {plan.display_name}</h2>
          <div className="grid grid-cols-2 gap-2">
            {(plan.features as string[] | null)?.map((feature, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-green-500 font-bold">✓</span>
                {feature}
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">{subscription?.branch_count ?? 1} sucursal(es)</p>
              <p className="text-xs text-gray-400">{formatCurrency(plan.price_per_branch_usd)} / sucursal / mes</p>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {formatCurrency(subscription?.monthly_total_usd ?? plan.price_per_branch_usd)} / mes
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
