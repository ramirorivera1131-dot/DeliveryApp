import { StatusBadge } from '@/components/ui/Badge'
import { formatRelativeTime, formatCurrency } from '@/lib/utils'

type OrderRow = {
  id: string
  status: string
  subtotal: number
  delivery_address: string
  created_at: string
  order_items: { product_name: string; quantity: number }[]
}

export function RecentOrdersTable({ orders }: { orders: OrderRow[] }) {
  if (orders.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-gray-100 p-16 text-center">
        <p className="text-sm text-gray-400">Sin pedidos hoy todavía.</p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-white border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Pedidos recientes</h2>
        <span className="text-xs text-gray-400">{orders.length} hoy</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs font-medium text-gray-400 bg-gray-50 border-b border-gray-100">
              <th className="text-left px-6 py-3">Pedido</th>
              <th className="text-left px-6 py-3">Dirección</th>
              <th className="text-left px-6 py-3">Items</th>
              <th className="text-left px-6 py-3">Estado</th>
              <th className="text-right px-6 py-3">Subtotal</th>
              <th className="text-right px-6 py-3">Hora</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono text-gray-500 text-xs">
                  #{order.id.slice(0, 8).toUpperCase()}
                </td>
                <td className="px-6 py-4 text-gray-700 max-w-[200px] truncate">
                  {order.delivery_address}
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {order.order_items?.length ?? 0} productos
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-6 py-4 font-semibold text-gray-900 text-right">
                  {formatCurrency(order.subtotal)}
                </td>
                <td className="px-6 py-4 text-gray-400 text-xs text-right whitespace-nowrap">
                  {formatRelativeTime(order.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
