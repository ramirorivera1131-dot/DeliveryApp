import { StatusBadge } from '@/components/ui/Badge'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ShoppingBag } from 'lucide-react'

type OrderRow = {
  id: string
  status: string
  subtotal: number
  delivery_address: string
  created_at: string
  customers?: { full_name: string } | null
  order_items: { product_name: string; quantity: number }[]
}

export function RecentOrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Pedidos recientes</CardTitle>
        <span className="text-xs text-muted-foreground">{orders.length} hoy</span>
      </CardHeader>
      <CardContent className="p-0">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
            <ShoppingBag size={28} className="opacity-30" />
            <p className="text-sm">Sin pedidos hoy todavía</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-medium text-muted-foreground">
                  <th className="text-left px-5 py-3">Pedido</th>
                  <th className="text-left px-5 py-3">Cliente</th>
                  <th className="text-left px-5 py-3">Estado</th>
                  <th className="text-right px-5 py-3">Total</th>
                  <th className="text-right px-5 py-3">Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-accent/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-muted-foreground">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-5 py-3.5 max-w-[160px]">
                      <p className="font-medium text-foreground truncate">
                        {order.customers?.full_name ?? 'Cliente'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{order.delivery_address}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-foreground text-right">
                      {formatCurrency(order.subtotal)}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted-foreground text-right whitespace-nowrap">
                      {formatRelativeTime(order.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
