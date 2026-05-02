'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { OrderCard, type Order } from './OrderCard'
import { Spinner } from '@/components/ui/Spinner'
import { Wifi, WifiOff } from 'lucide-react'

const COLUMNS = [
  { id: 'new',       label: 'Nuevos',     statuses: ['pending'],              color: 'border-t-yellow-400' },
  { id: 'cooking',   label: 'En cocina',  statuses: ['confirmed','preparing'], color: 'border-t-orange-400' },
  { id: 'ready',     label: 'Listos',     statuses: ['ready'],                color: 'border-t-purple-400' },
  { id: 'delivered', label: 'Entregados', statuses: ['delivered'],             color: 'border-t-green-400'  },
]

type Props = { initialOrders: Order[]; restaurantId: string }

export function OrdersBoard({ initialOrders, restaurantId }: Props) {
  const [orders,      setOrders]      = useState<Order[]>(initialOrders)
  const [connected,   setConnected]   = useState(false)
  const [activeFilter, setFilter]     = useState<string | null>(null)

  // Real-time subscription
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`orders-${restaurantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            // Fetch full order with joins
            const { data } = await supabase
              .from('orders')
              .select('id, status, subtotal, delivery_fee, total_amount, delivery_address, notes, created_at, customers(full_name,phone), order_items(id,product_name,quantity,unit_price,subtotal)')
              .eq('id', payload.new.id)
              .single()
            if (data) setOrders((prev) => [data as unknown as Order, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((o) => (o.id === payload.new.id ? { ...o, ...payload.new } : o)),
            )
          }
        },
      )
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'))

    return () => { supabase.removeChannel(channel) }
  }, [restaurantId])

  const updateStatus = useCallback(async (orderId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
  }, [])

  const visibleOrders = activeFilter
    ? orders.filter((o) => COLUMNS.find((c) => c.id === activeFilter)?.statuses.includes(o.status))
    : orders

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-white">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Pedidos en tiempo real</h1>
          <p className="text-xs text-gray-400 mt-0.5">{orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length} pedidos activos</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Column filters */}
          <div className="flex gap-1">
            {COLUMNS.map((col) => {
              const count = orders.filter((o) => col.statuses.includes(o.status)).length
              return (
                <button
                  key={col.id}
                  onClick={() => setFilter(activeFilter === col.id ? null : col.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activeFilter === col.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {col.label} {count > 0 && <span className="ml-1 opacity-75">({count})</span>}
                </button>
              )
            })}
          </div>
          {/* Connection indicator */}
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg ${connected ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
            {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
            {connected ? 'En vivo' : 'Conectando…'}
          </div>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-auto p-6">
        {activeFilter ? (
          /* Single column view when filtered */
          <div className="max-w-sm mx-auto space-y-3">
            {visibleOrders.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-12">Sin pedidos en esta categoría.</p>
            ) : (
              visibleOrders.map((order) => (
                <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
              ))
            )}
          </div>
        ) : (
          /* Kanban columns */
          <div className="grid grid-cols-4 gap-4 h-full">
            {COLUMNS.map((col) => {
              const colOrders = orders.filter((o) => col.statuses.includes(o.status))
              return (
                <div key={col.id} className="flex flex-col min-h-0">
                  <div className={`flex items-center justify-between mb-3 pb-2 border-b-2 ${col.color}`}>
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                      {col.label}
                    </span>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      {colOrders.length}
                    </span>
                  </div>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                    {colOrders.length === 0 ? (
                      <div className="flex items-center justify-center h-24 rounded-xl border-2 border-dashed border-gray-200">
                        <p className="text-xs text-gray-300">Vacío</p>
                      </div>
                    ) : (
                      colOrders.map((order) => (
                        <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
