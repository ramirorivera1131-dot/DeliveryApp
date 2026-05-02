import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, ScrollView, Linking, Alert,
} from 'react-native'
import MapView, { Marker, Polyline } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { fmt, fmtDate } from '@/utils/format'

type OrderItem = { product_name: string; quantity: number; unit_price: number }
type Order = {
  id: string
  status: string
  delivery_address: string
  delivery_lat: number | null
  delivery_lng: number | null
  delivery_fee: number
  subtotal: number
  notes: string | null
  created_at: string
  restaurants: { name: string; address: string; lat: number | null; lng: number | null } | null
  drivers: { full_name: string; phone: string | null; current_lat: number | null; current_lng: number | null } | null
  order_items: OrderItem[]
}

const STATUS_STEPS = [
  { key: 'pending',    label: 'Pedido recibido',  icon: 'receipt-outline'   as const },
  { key: 'confirmed',  label: 'Confirmado',        icon: 'checkmark-circle-outline' as const },
  { key: 'preparing',  label: 'Preparando',        icon: 'flame-outline'     as const },
  { key: 'ready',      label: 'Listo para recoger',icon: 'bag-check-outline' as const },
  { key: 'picked_up',  label: 'Recogido',          icon: 'bicycle-outline'   as const },
  { key: 'in_transit', label: 'En camino',         icon: 'navigate-outline'  as const },
  { key: 'delivered',  label: 'Entregado',         icon: 'home-outline'      as const },
]

const STATUS_ORDER = STATUS_STEPS.map(s => s.key)

export default function OrderTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const [order,   setOrder]   = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      const { data } = await supabase
        .from('orders')
        .select(`
          id, status, delivery_address, delivery_lat, delivery_lng,
          delivery_fee, subtotal, notes, created_at,
          restaurants ( name, address, lat, lng ),
          drivers ( full_name, phone, current_lat, current_lng ),
          order_items ( product_name, quantity, unit_price )
        `)
        .eq('id', id)
        .single()
      setOrder(data as unknown as Order)
      setLoading(false)
    }

    fetchOrder()

    const channel = supabase
      .channel(`customer-order-${id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        payload => {
          setOrder(prev => prev ? { ...prev, ...payload.new } : null)
          if (payload.new.status === 'delivered') {
            Alert.alert('¡Pedido entregado!', '¡Disfruta tu comida! 🎉')
          }
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'drivers' },
        payload => {
          setOrder(prev => {
            if (!prev?.drivers) return prev
            return {
              ...prev,
              drivers: {
                ...prev.drivers,
                current_lat: payload.new.current_lat,
                current_lng: payload.new.current_lng,
              },
            }
          })
        }
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [id])

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#f97316" /></View>
  if (!order)  return <View style={s.center}><Text style={s.notFound}>Pedido no encontrado</Text></View>

  const rLat = order.restaurants?.lat ?? null
  const rLng = order.restaurants?.lng ?? null
  const dLat = order.delivery_lat
  const dLng = order.delivery_lng
  const drLat = order.drivers?.current_lat ?? null
  const drLng = order.drivers?.current_lng ?? null

  const midLat = dLat ?? rLat ?? 19.43
  const midLng = dLng ?? rLng ?? -99.13
  const latDelta = rLat && dLat ? Math.abs(rLat - dLat) * 2 + 0.02 : 0.06

  const currentIdx = STATUS_ORDER.indexOf(order.status)
  const isDone = order.status === 'delivered'
  const isCancelled = order.status === 'cancelled'

  return (
    <View style={s.container}>
      {/* Map */}
      <MapView
        style={s.map}
        initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: latDelta }}
      >
        {rLat && rLng && (
          <Marker coordinate={{ latitude: rLat, longitude: rLng }} title="Restaurante" pinColor="#f97316" />
        )}
        {dLat && dLng && (
          <Marker coordinate={{ latitude: dLat, longitude: dLng }} title="Tu dirección" pinColor="#22c55e" />
        )}
        {drLat && drLng && (
          <Marker coordinate={{ latitude: drLat, longitude: drLng }} title="Repartidor" pinColor="#3b82f6">
            <View style={s.driverMarker}>
              <Ionicons name="bicycle" size={16} color="#fff" />
            </View>
          </Marker>
        )}
        {rLat && rLng && dLat && dLng && (
          <Polyline
            coordinates={[
              { latitude: rLat, longitude: rLng },
              ...(drLat && drLng ? [{ latitude: drLat, longitude: drLng }] : []),
              { latitude: dLat, longitude: dLng },
            ]}
            strokeColor="#f97316"
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}
      </MapView>

      {/* Back */}
      <TouchableOpacity style={s.backBtn} onPress={() => router.replace('/(tabs)/orders')}>
        <Ionicons name="arrow-back" size={20} color="#111827" />
      </TouchableOpacity>

      {/* Bottom sheet */}
      <View style={s.sheet}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Status progress */}
          <View style={s.progressWrap}>
            {STATUS_STEPS.filter(step => step.key !== 'cancelled').map((step, idx) => {
              const done    = idx <= currentIdx
              const current = idx === currentIdx
              return (
                <View key={step.key} style={s.stepRow}>
                  <View style={[s.stepDot, done && s.stepDotDone, current && s.stepDotCurrent]}>
                    <Ionicons
                      name={step.icon}
                      size={14}
                      color={done ? '#fff' : '#d1d5db'}
                    />
                  </View>
                  {idx < STATUS_STEPS.length - 2 && (
                    <View style={[s.stepLine, idx < currentIdx && s.stepLineDone]} />
                  )}
                  <Text style={[s.stepLabel, current && s.stepLabelCurrent]}>{step.label}</Text>
                </View>
              )
            })}
          </View>

          {isCancelled && (
            <View style={s.cancelledBanner}>
              <Ionicons name="close-circle" size={18} color="#ef4444" />
              <Text style={s.cancelledText}>Este pedido fue cancelado</Text>
            </View>
          )}

          {/* Driver info */}
          {order.drivers && !isDone && !isCancelled && (
            <View style={s.driverCard}>
              <View style={s.driverAvatar}>
                <Text style={s.driverAvatarText}>
                  {order.drivers.full_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.driverName}>{order.drivers.full_name}</Text>
                <Text style={s.driverLabel}>Tu repartidor</Text>
              </View>
              {order.drivers.phone && (
                <TouchableOpacity
                  style={s.callBtn}
                  onPress={() => Linking.openURL(`tel:${order.drivers!.phone}`)}
                >
                  <Ionicons name="call" size={18} color="#fff" />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Items summary */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Artículos</Text>
            {order.order_items.map((item, i) => (
              <View key={i} style={s.itemRow}>
                <Text style={s.itemQty}>{item.quantity}×</Text>
                <Text style={s.itemName}>{item.product_name}</Text>
                <Text style={s.itemPrice}>{fmt(item.unit_price * item.quantity)}</Text>
              </View>
            ))}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal</Text>
              <Text style={s.totalValue}>{fmt(order.subtotal)}</Text>
            </View>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Envío</Text>
              <Text style={s.totalValue}>{fmt(order.delivery_fee)}</Text>
            </View>
            <View style={[s.totalRow, s.grandRow]}>
              <Text style={s.grandLabel}>Total</Text>
              <Text style={s.grandValue}>{fmt(order.subtotal + order.delivery_fee)}</Text>
            </View>
          </View>

          {isDone && (
            <TouchableOpacity style={s.reorderBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={s.reorderText}>Pedir de nuevo</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound:  { fontSize: 14, color: '#6b7280' },
  map:       { flex: 1 },
  driverMarker: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#3b82f6',
    justifyContent: 'center', alignItems: 'center',
  },
  backBtn: {
    position: 'absolute', top: 52, left: 16,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
  },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '55%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
  },
  progressWrap: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 4 },
  stepRow:    { alignItems: 'center', flex: 1, minWidth: 56 },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#f3f4f6', justifyContent: 'center', alignItems: 'center',
  },
  stepDotDone:    { backgroundColor: '#f97316' },
  stepDotCurrent: { backgroundColor: '#f97316', transform: [{ scale: 1.15 }] },
  stepLine:     { position: 'absolute', top: 14, left: '65%', right: '-35%', height: 2, backgroundColor: '#f3f4f6', zIndex: -1 },
  stepLineDone: { backgroundColor: '#f97316' },
  stepLabel:       { fontSize: 9, color: '#9ca3af', textAlign: 'center', marginTop: 4 },
  stepLabelCurrent:{ color: '#f97316', fontWeight: '700' },
  cancelledBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 12,
  },
  cancelledText: { fontSize: 14, color: '#ef4444', fontWeight: '600' },
  driverCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#f9fafb', borderRadius: 14, padding: 12, marginBottom: 14, gap: 10,
  },
  driverAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center',
  },
  driverAvatarText:{ fontSize: 18, fontWeight: '800', color: '#fff' },
  driverName:  { fontSize: 14, fontWeight: '700', color: '#111827' },
  driverLabel: { fontSize: 12, color: '#9ca3af' },
  callBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center',
  },
  section:      { marginTop: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  itemRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  itemQty:  { fontSize: 13, fontWeight: '700', color: '#f97316', width: 28 },
  itemName: { flex: 1, fontSize: 13, color: '#374151' },
  itemPrice:{ fontSize: 13, fontWeight: '600', color: '#374151' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  totalLabel:{ fontSize: 13, color: '#6b7280' },
  totalValue:{ fontSize: 13, fontWeight: '600', color: '#374151' },
  grandRow:  { borderTopWidth: 1, borderTopColor: '#f3f4f6', marginTop: 4, paddingTop: 8 },
  grandLabel:{ fontSize: 15, fontWeight: '700', color: '#111827' },
  grandValue:{ fontSize: 17, fontWeight: '800', color: '#f97316' },
  reorderBtn:  { alignItems: 'center', paddingVertical: 16, marginTop: 8 },
  reorderText: { fontSize: 15, fontWeight: '700', color: '#f97316' },
})
