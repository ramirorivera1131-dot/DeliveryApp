'use client'
import { cn, formatCurrency, formatRelativeTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

type OrderItem = { id: string; product_name: string; quantity: number; unit_price: number; subtotal: number }
type Customer  = { full_name: string; phone: string | null } | null

export type Order = {
  id: string
  status: string
  subtotal: number
  delivery_fee: number
  total_amount: number
  delivery_address: string
  notes: string | null
  created_at: string
  customers: Customer
  order_items: OrderItem[]
}

type Props = {
  order: Order
  onUpdateStatus: (id: string, status: string) => Promise<void>
}

const NEXT_STATUS: Record<string, { label: string; status: string; variant: 'primary' | 'success' }> = {
  pending:   { label: 'Aceptar pedido',  status: 'preparing', variant: 'primary'  },
  confirmed: { label: 'Iniciar cocina',  status: 'preparing', variant: 'primary'  },
  preparing: { label: 'Marcar listo ✓', status: 'ready',     variant: 'success'  },
}

export function OrderCard({ order, onUpdateStatus }: Props) {
  const [expanded, setExpanded]   = useState(false)
  const [loading, setLoading]     = useState(false)
  const next = NEXT_STATUS[order.status]

  const handleAction = async () => {
    if (!next) return
    setLoading(true)
    await onUpdateStatus(order.id, next.status)
    setLoading(false)
  }

  return (
    <div className={cn(
      'rounded-2xl bg-white border transition-shadow hover:shadow-md',
      order.status === 'pending'   && 'border-yellow-300 shadow-yellow-50',
      order.status === 'preparing' && 'border-orange-200',
      order.status === 'ready'     && 'border-purple-200',
      order.status === 'delivered' && 'border-green-200 opacity-75',
      !['pending','preparing','ready','delivered'].includes(order.status) && 'border-gray-200',
    )}>
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-3">
        <div>
          <p className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="font-semibold text-gray-900 text-sm mt-0.5">
            {order.customers?.full_name ?? 'Cliente'}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 px-4 pb-3">
        <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
        <p className="text-xs text-gray-500 leading-relaxed">{order.delivery_address}</p>
      </div>

      {/* Time + totals */}
      <div className="flex items-center justify-between px-4 pb-3">
        <span className="flex items-center gap-1 text-xs text-gray-400">
          <Clock size={12} />
          {formatRelativeTime(order.created_at)}
        </span>
        <span className="text-sm font-bold text-gray-900">{formatCurrency(order.subtotal)}</span>
      </div>

      {/* Items toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-2 border-t border-gray-100 text-xs text-gray-500 hover:bg-gray-50"
      >
        <span>{order.order_items?.length ?? 0} productos</span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <ul className="px-4 pb-3 space-y-1.5 border-t border-gray-50">
          {order.order_items?.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">
                <span className="font-medium text-gray-800">{item.quantity}×</span> {item.product_name}
              </span>
              <span className="text-gray-500">{formatCurrency(item.subtotal)}</span>
            </li>
          ))}
          {order.notes && (
            <li className="mt-2 text-xs text-orange-600 bg-orange-50 rounded-lg px-2 py-1">
              📝 {order.notes}
            </li>
          )}
        </ul>
      )}

      {/* Action */}
      {next && (
        <div className="px-4 pb-4 pt-2">
          <Button
            variant={next.variant}
            size="sm"
            className="w-full"
            onClick={handleAction}
            isLoading={loading}
          >
            {next.label}
          </Button>
        </div>
      )}
    </div>
  )
}
