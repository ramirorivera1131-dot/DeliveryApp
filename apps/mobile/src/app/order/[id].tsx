import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView, Linking, Platform,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import MapView, { Marker, Polyline } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'

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
  customers: { full_name: string; phone: string | null } | null
  restaurants: { name: string; address: string; lat: number | null; lng: number | null } | null
  order_items: OrderItem[]
}

const STATUS_LABEL: Record<string, string> = {
  ready:      'Listo para recoger',
  picked_up:  'Recogido — ir al cliente',
  in_transit: 'En camino',
  delivered:  'Entregado ✓',
}

const NEXT: Record<string, { label: string; next: string; color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = {
  picked_up:  { label: 'Salir hacia cliente',  next: 'in_transit', color: '#f97316', icon: 'arrow-forward-circle' },
  in_transit: { label: 'Confirmar entrega',     next: 'delivered',  color: '#22c55e', icon: 'checkmark-circle'      },
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(n)

function openMaps(lat: number | null, lng: number | null, address: string) {
  if (lat && lng) {
    const url = Platform.OS === 'ios'
      ? `maps://?daddr=${lat},${lng}`
      : `google.navigation:q=${lat},${lng}`
    Linking.canOpenURL(url).then(ok =>
      Linking.openURL(ok ? url : `https://maps.google.com/?q=${lat},${lng}`)
    )
  } else {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`)
  }
}

export default function OrderScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>()
  const router  = useRouter()
  const [order,    setOrder]    = useState<Order | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState(false)
  const [rate,     setRate]     = useState(0.85)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('drivers').select('earnings_rate').eq('user_id', user.id).maybeSingle()
        if (data) setRate(data.earnings_rate ?? 0.85)
      }
      await fetchOrder()
    }
    init()

    const channel = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        payload => {
          setOrder(prev => prev ? { ...prev, status: payload.new.status } : null)
          if (payload.new.status === 'delivered') {
            Alert.alert('¡Entrega completada!', '¡Buen trabajo! Ganancia registrada.', [
              { text: 'OK', onPress: () => router.back() },
            ])
          }
        }
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [id])

  const fetchOrder = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        id, status, delivery_address, delivery_lat, delivery_lng,
        delivery_fee, subtotal, notes,
        customers ( full_name, phone ),
        restaurants ( name, address, lat, lng ),
        order_items ( product_name, quantity, unit_price )
      `)
      .eq('id', id)
      .single()
    setOrder(data as unknown as Order)
    setLoading(false)
  }

  const handleUpdateStatus = () => {
    if (!order) return
    const step = NEXT[order.status]
    if (!step) return
    if (step.next === 'delivered') {
      Alert.alert('Confirmar entrega', '¿Confirmas que entregaste el pedido al cliente?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Confirmar', onPress: doUpdate },
      ])
    } else {
      doUpdate()
    }
  }

  const doUpdate = async () => {
    if (!order) return
    const step = NEXT[order.status]
    setUpdating(true)
    const { error } = await supabase.from('orders').update({ status: step.next }).eq('id', order.id)
    if (!error) setOrder(prev => prev ? { ...prev, status: step.next } : null)
    setUpdating(false)
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#f97316" /></View>
  if (!order)  return <View style={s.center}><Text style={s.notFound}>Pedido no encontrado</Text></View>

  const rLat = order.restaurants?.lat ?? null
  const rLng = order.restaurants?.lng ?? null
  const dLat = order.delivery_lat
  const dLng = order.delivery_lng

  const midLat   = rLat && dLat ? (rLat + dLat) / 2 : (rLat ?? 19.43)
  const midLng   = rLng && dLng ? (rLng + dLng) / 2 : (rLng ?? -99.13)
  const latDelta = rLat && dLat ? Math.abs(rLat - dLat) * 2 + 0.01 : 0.05

  const step    = NEXT[order.status]
  const earned  = order.delivery_fee * rate
  const isDone  = order.status === 'delivered'

  return (
    <View style={s.container}>
      {/* Map */}
      <MapView
        style={s.map}
        initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: latDelta }}
      >
        {rLat && rLng && (
          <Marker
            coordinate={{ latitude: rLat, longitude: rLng }}
            title={order.restaurants?.name ?? 'Restaurante'}
            pinColor="#f97316"
          />
        )}
        {dLat && dLng && (
          <Marker
            coordinate={{ latitude: dLat, longitude: dLng }}
            title={order.customers?.full_name ?? 'Destino'}
            pinColor="#22c55e"
          />
        )}
        {rLat && rLng && dLat && dLng && (
          <Polyline
            coordinates={[
              { latitude: rLat, longitude: rLng },
              { latitude: dLat, longitude: dLng },
            ]}
            strokeColor="#f97316"
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}
      </MapView>

      {/* Back */}
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color="#111827" />
      </TouchableOpacity>

      {/* Bottom sheet */}
      <View style={s.sheet}>
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Status + earnings */}
          <View style={s.topRow}>
            <View style={[s.statusPill, isDone && s.statusPillGreen]}>
              <Text style={[s.statusText, isDone && s.statusTextGreen]}>
                {STATUS_LABEL[order.status] ?? order.status}
              </Text>
            </View>
            <Text style={s.earned}>{fmt(earned)}</Text>
          </View>

          {/* Pickup */}
          <TouchableOpacity
            style={s.locCard}
            onPress={() => openMaps(rLat, rLng, order.restaurants?.address ?? '')}
            activeOpacity={0.75}
          >
            <View style={[s.locIcon, { backgroundColor: '#fff7ed' }]}>
              <Ionicons name="restaurant" size={18} color="#f97316" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.locLabel}>Recoger en</Text>
              <Text style={s.locName}>{order.restaurants?.name}</Text>
              <Text style={s.locAddr} numberOfLines={1}>{order.restaurants?.address}</Text>
            </View>
            <Ionicons name="navigate-outline" size={18} color="#f97316" />
          </TouchableOpacity>

          {/* Delivery */}
          <TouchableOpacity
            style={s.locCard}
            onPress={() => openMaps(dLat, dLng, order.delivery_address)}
            activeOpacity={0.75}
          >
            <View style={[s.locIcon, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="location" size={18} color="#22c55e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.locLabel}>Entregar a</Text>
              <Text style={s.locName}>{order.customers?.full_name}</Text>
              <Text style={s.locAddr} numberOfLines={2}>{order.delivery_address}</Text>
            </View>
            <Ionicons name="navigate-outline" size={18} color="#22c55e" />
          </TouchableOpacity>

          {/* Items */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Artículos del pedido</Text>
            {order.order_items.map((item, i) => (
              <View key={i} style={s.itemRow}>
                <Text style={s.itemQty}>{item.quantity}×</Text>
                <Text style={s.itemName}>{item.product_name}</Text>
                <Text style={s.itemPrice}>{fmt(item.unit_price * item.quantity)}</Text>
              </View>
            ))}
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>Subtotal pedido</Text>
              <Text style={s.totalValue}>{fmt(order.subtotal)}</Text>
            </View>
          </View>

          {order.notes && (
            <View style={s.notesCard}>
              <Ionicons name="chatbubble-ellipses" size={13} color="#f97316" />
              <Text style={s.notesText}>{order.notes}</Text>
            </View>
          )}

          {/* Call customer */}
          <TouchableOpacity
            style={s.callBtn}
            onPress={() => {
              const ph = order.customers?.phone
              if (!ph) return Alert.alert('Sin teléfono', 'El cliente no registró teléfono.')
              Linking.openURL(`tel:${ph}`)
            }}
          >
            <Ionicons name="call-outline" size={18} color="#374151" />
            <Text style={s.callText}>Llamar al cliente</Text>
          </TouchableOpacity>

          {/* Progress action */}
          {step && (
            <TouchableOpacity
              style={[s.actionBtn, { backgroundColor: step.color }, updating && { opacity: 0.6 }]}
              onPress={handleUpdateStatus}
              disabled={updating}
              activeOpacity={0.85}
            >
              {updating
                ? <ActivityIndicator color="#fff" />
                : <>
                    <Ionicons name={step.icon} size={20} color="#fff" />
                    <Text style={s.actionText}>{step.label}</Text>
                  </>
              }
            </TouchableOpacity>
          )}

          {isDone && (
            <TouchableOpacity style={s.doneBtn} onPress={() => router.back()}>
              <Text style={s.doneBtnText}>Volver a pedidos disponibles</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound:  { fontSize: 14, color: '#6b7280' },
  map:       { flex: 1 },
  backBtn: {
    position: 'absolute', top: 52, left: 16,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 6,
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, maxHeight: '58%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 10,
  },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statusPill: {
    backgroundColor: '#fff7ed', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  statusPillGreen: { backgroundColor: '#f0fdf4' },
  statusText:      { fontSize: 13, fontWeight: '600', color: '#ea580c' },
  statusTextGreen: { color: '#16a34a' },
  earned: { fontSize: 20, fontWeight: '800', color: '#16a34a' },
  locCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, marginBottom: 10,
  },
  locIcon: { width: 42, height: 42, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  locLabel: { fontSize: 11, color: '#9ca3af', marginBottom: 1 },
  locName:  { fontSize: 14, fontWeight: '700', color: '#111827' },
  locAddr:  { fontSize: 12, color: '#6b7280', marginTop: 1 },
  section:      { marginTop: 4, marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  itemRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 5 },
  itemQty:  { fontSize: 13, fontWeight: '700', color: '#f97316', width: 28 },
  itemName: { flex: 1, fontSize: 13, color: '#374151' },
  itemPrice:{ fontSize: 13, fontWeight: '600', color: '#374151' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 8, marginTop: 4,
  },
  totalLabel: { fontSize: 13, color: '#6b7280' },
  totalValue: { fontSize: 13, fontWeight: '700', color: '#111827' },
  notesCard: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    backgroundColor: '#fff7ed', padding: 10, borderRadius: 10, marginBottom: 12,
  },
  notesText: { flex: 1, fontSize: 12, color: '#92400e' },
  callBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 12,
    paddingVertical: 13, marginBottom: 10,
  },
  callText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
  },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  doneBtn:     { alignItems: 'center', paddingVertical: 14 },
  doneBtnText: { fontSize: 14, fontWeight: '600', color: '#f97316' },
})
