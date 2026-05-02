'use client'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate, timeAgo, getStatusConfig } from '@/lib/utils'
import { MapPin, Phone, Clock, Package, MessageSquare } from 'lucide-react'
import { useState } from 'react'
import type { Order } from '@/lib/types'

type Props = {
  order: Order | null
  onClose: () => void
  onUpdateStatus: (id: string, status: string) => void
  onReject: (id: string) => void
}

export function OrderDetailModal({ order, onClose, onUpdateStatus, onReject }: Props) {
  const [loading, setLoading] = useState(false)
  if (!order) return null

  const cfg    = getStatusConfig(order.status)
  const isDone = ['delivered', 'cancelled'].includes(order.status)

  const handleAction = async () => {
    if (!cfg.next) return
    setLoading(true)
    await onUpdateStatus(order.id, cfg.next)
    setLoading(false)
    onClose()
  }

  return (
    <Modal
      isOpen={!!order}
      onClose={onClose}
      title={`Pedido #${order.id.slice(0, 8).toUpperCase()}`}
      description={`${formatDate(order.created_at)} · ${timeAgo(order.created_at)}`}
      size="md"
      footer={
        !isDone ? (
          <>
            {order.status === 'pending' && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => { onReject(order.id); onClose() }}
              >
                Rechazar
              </Button>
            )}
            {cfg.next && (
              <Button loading={loading} onClick={handleAction}>
                {cfg.nextLabel}
              </Button>
            )}
          </>
        ) : undefined
      }
    >
      <div className="space-y-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          <StatusBadge status={order.status} />
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock size={11} />
            Recibido {timeAgo(order.created_at)}
          </span>
        </div>

        {/* Customer */}
        <div className="rounded-lg border border-border p-3 space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Cliente</p>
          <p className="text-sm font-medium text-foreground">{order.customers?.full_name ?? 'Sin nombre'}</p>
          {order.customers?.phone && (
            <a
              href={`tel:${order.customers.phone}`}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              <Phone size={13} />
              {order.customers.phone}
            </a>
          )}
          <div className="flex items-start gap-1.5 text-sm text-muted-foreground pt-0.5">
            <MapPin size={13} className="shrink-0 mt-0.5" />
            {order.delivery_address}
          </div>
        </div>

        {/* Order items */}
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <Package size={12} />
            Productos
          </p>
          <div className="rounded-lg border border-border overflow-hidden">
            {order.order_items?.map((item, i) => (
              <div key={item.id ?? i} className="flex items-center justify-between px-3 py-2.5 border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {item.quantity}× {item.product_name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {formatCurrency(item.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        {order.notes && (
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5 flex gap-2">
            <MessageSquare size={14} className="text-primary shrink-0 mt-0.5" />
            <p className="text-sm text-foreground">{order.notes}</p>
          </div>
        )}

        {/* Totals */}
        <div className="rounded-lg border border-border p-3 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Costo de envío</span>
            <span className="text-foreground">{formatCurrency(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between text-sm font-bold border-t border-border pt-1.5 mt-1.5">
            <span className="text-foreground">Total</span>
            <span className="text-foreground">{formatCurrency(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}
