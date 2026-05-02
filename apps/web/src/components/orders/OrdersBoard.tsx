'use client'
import { useEffect, useCallback, useState, useRef } from 'react'
import { Wifi, WifiOff, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useActiveOrders, useUpdateOrderStatus } from '@/hooks/use-orders'
import { useUIStore } from '@/store/ui-store'
import { OrderCard } from './OrderCard'
import { OrderDetailModal } from './OrderDetailModal'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import type { Order } from '@/lib/types'

const COLUMNS = [
  { id: 'new',       label: 'Nuevos',       statuses: ['pending'],               color: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  { id: 'accepted',  label: 'Aceptados',    statuses: ['confirmed'],              color: 'bg-blue-400',   badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { id: 'cooking',   label: 'En cocina',    statuses: ['preparing'],              color: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  { id: 'ready',     label: 'Listos',       statuses: ['ready', 'picked_up'],     color: 'bg-purple-400', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { id: 'delivered', label: 'Entregados',   statuses: ['delivered'],              color: 'bg-green-400',  badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
]

const ORDER_SELECT = `id, status, subtotal, delivery_fee, total_amount, delivery_address, notes, created_at, delivered_at, customers(full_name,phone), order_items(id,product_name,quantity,unit_price,subtotal)`

export function OrdersBoard({ restaurantId }: { restaurantId: string }) {
  const { data: initial = [], isLoading } = useActiveOrders(restaurantId)
  const updateMutation = useUpdateOrderStatus()
  const [orders,      setOrders]      = useState<Order[]>([])
  const [connected,   setConnected]   = useState(false)
  const [activeCol,   setActiveCol]   = useState<string | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const addNotification = useUIStore(s => s.addNotification)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const syncedRef   = useRef(false)

  // Sync initial data once
  useEffect(() => {
    if (initial.length > 0 && !syncedRef.current) {
      setOrders(initial)
      syncedRef.current = true
    }
  }, [initial])

  // Notification sound
  const playSound = useCallback(() => {
    try {
      const ctx = audioCtxRef.current ?? (audioCtxRef.current = new AudioContext())
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.3)
    } catch (_) {}
  }, [])

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()
    const channel  = supabase
      .channel(`board-${restaurantId}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase.from('orders').select(ORDER_SELECT).eq('id', payload.new.id).single()
            if (data) {
              setOrders(prev => [data as unknown as Order, ...prev])
              playSound()
              addNotification({ message: `Nuevo pedido #${data.id.slice(0, 8).toUpperCase()}`, type: 'order' })
              toast.info('¡Nuevo pedido recibido!', { duration: 5000 })
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id))
          }
        }
      )
      .subscribe(status => setConnected(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId, playSound, addNotification])

  const handleUpdateStatus = useCallback(async (orderId: string, newStatus: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o))
    try {
      await updateMutation.mutateAsync({ orderId, status: newStatus })
      toast.success('Estado actualizado')
    } catch {
      toast.error('No se pudo actualizar el estado')
    }
  }, [updateMutation])

  const handleReject = useCallback(async (orderId: string) => {
    await handleUpdateStatus(orderId, 'cancelled')
  }, [handleUpdateStatus])

  const visibleOrders = activeCol
    ? orders.filter(o => COLUMNS.find(c => c.id === activeCol)?.statuses.includes(o.status))
    : orders

  const activeCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
        <div>
          <h1 className="text-lg font-bold text-foreground">Pedidos en tiempo real</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeCount} pedido{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Column filters */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setActiveCol(null)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                !activeCol ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Filter size={11} />
              Todos
            </button>
            {COLUMNS.map(col => {
              const count = orders.filter(o => col.statuses.includes(o.status)).length
              return (
                <button
                  key={col.id}
                  onClick={() => setActiveCol(activeCol === col.id ? null : col.id)}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                    activeCol === col.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {col.label}
                  {count > 0 && (
                    <span className={cn('rounded-full px-1.5 min-w-[18px] text-center', col.badge)}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          {/* Live indicator */}
          <div className={cn(
            'flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border',
            connected
              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
              : 'bg-secondary text-muted-foreground border-border',
          )}>
            {connected
              ? <><Wifi size={12} className="animate-pulse" />En vivo</>
              : <><WifiOff size={12} />Conectando…</>
            }
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="grid grid-cols-5 gap-3 h-full">
            {COLUMNS.map(col => <Skeleton key={col.id} className="h-full min-h-[400px] rounded-xl" />)}
          </div>
        ) : activeCol ? (
          <div className="max-w-sm mx-auto space-y-3">
            {visibleOrders.length === 0 ? (
              <EmptyColumn />
            ) : (
              visibleOrders.map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  onOpenDetail={setDetailOrder}
                />
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-3 h-full min-h-[400px]">
            {COLUMNS.map(col => {
              const colOrders = orders.filter(o => col.statuses.includes(o.status))
              return (
                <div key={col.id} className="flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className={cn('h-2 w-2 rounded-full', col.color)} />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        {col.label}
                      </span>
                    </div>
                    <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold', col.badge)}>
                      {colOrders.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5">
                    {colOrders.length === 0 ? (
                      <EmptyColumn />
                    ) : (
                      colOrders.map(order => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onUpdateStatus={handleUpdateStatus}
                          onOpenDetail={setDetailOrder}
                        />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <OrderDetailModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onUpdateStatus={handleUpdateStatus}
        onReject={handleReject}
      />
    </div>
  )
}

function EmptyColumn() {
  return (
    <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-border">
      <p className="text-xs text-muted-foreground">Vacío</p>
    </div>
  )
}
