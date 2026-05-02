'use client'
import { cn, formatCurrency, timeAgo, getStatusConfig } from '@/lib/utils'
import { MapPin, Clock, ChevronDown, ChevronUp, Phone } from 'lucide-react'
import { useState } from 'react'
import type { Order } from '@/lib/types'

type Props = {
  order: Order
  onUpdateStatus: (id: string, status: string) => void
  onOpenDetail: (order: Order) => void
}

export function OrderCard({ order, onUpdateStatus, onOpenDetail }: Props) {
  const [expanded, setExpanded] = useState(false)
  const cfg  = getStatusConfig(order.status)
  const next = cfg.next

  const borderColor: Record<string, string> = {
    pending:   'border-l-yellow-400',
    confirmed: 'border-l-blue-400',
    preparing: 'border-l-orange-400',
    ready:     'border-l-purple-400',
    delivered: 'border-l-green-400',
    cancelled: 'border-l-red-300',
  }

  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card border-l-4 overflow-hidden transition-shadow hover:shadow-md cursor-pointer',
        borderColor[order.status] ?? 'border-l-border',
      )}
      onClick={() => onOpenDetail(order)}
    >
      {/* Header */}
      <div className="flex items-start justify-between px-4 pt-4 pb-2">
        <div>
          <p className="font-mono text-[11px] text-muted-foreground">#{order.id.slice(0, 8).toUpperCase()}</p>
          <p className="font-semibold text-foreground text-sm mt-0.5">
            {order.customers?.full_name ?? 'Cliente'}
          </p>
          {order.customers?.phone && (
            <a
              href={`tel:${order.customers.phone}`}
              onClick={e => e.stopPropagation()}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-0.5"
            >
              <Phone size={10} />
              {order.customers.phone}
            </a>
          )}
        </div>
        <span className={cn('text-xs font-medium rounded-full px-2 py-0.5 border', cfg.bg, cfg.color)}>
          {cfg.label}
        </span>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2 px-4 pb-2">
        <MapPin size={12} className="text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{order.delivery_address}</p>
      </div>

      {/* Time + total */}
      <div className="flex items-center justify-between px-4 pb-3">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock size={11} />
          {timeAgo(order.created_at)}
        </span>
        <span className="text-sm font-bold text-foreground">{formatCurrency(order.subtotal)}</span>
      </div>

      {/* Items toggle */}
      <button
        onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
        className="flex w-full items-center justify-between px-4 py-2 border-t border-border text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
      >
        <span>{order.order_items?.length ?? 0} producto{(order.order_items?.length ?? 0) !== 1 ? 's' : ''}</span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <ul className="px-4 pb-3 space-y-1 border-t border-border/50 bg-accent/20">
          {order.order_items?.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-xs pt-1">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{item.quantity}×</span> {item.product_name}
              </span>
              <span className="text-muted-foreground">{formatCurrency(item.subtotal)}</span>
            </li>
          ))}
          {order.notes && (
            <li className="mt-1.5 text-xs text-primary bg-primary/10 rounded-lg px-2 py-1.5">
              📝 {order.notes}
            </li>
          )}
        </ul>
      )}

      {/* Action button */}
      {next && (
        <div className="px-4 pb-4 pt-2" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => onUpdateStatus(order.id, next)}
            className={cn(
              'w-full h-8 rounded-lg text-xs font-semibold transition-colors',
              next === 'delivered'
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground',
            )}
          >
            {cfg.nextLabel}
          </button>
        </div>
      )}
    </div>
  )
}

export type { Order }
