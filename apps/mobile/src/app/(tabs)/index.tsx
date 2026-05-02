import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'
import type { RealtimeChannel } from '@supabase/supabase-js'

type OrderItem = { product_name: string; quantity: number }
type Order = {
  id: string
  delivery_address: string
  delivery_lat: number | null
  delivery_lng: number | null
  delivery_fee: number
  subtotal: number
  notes: string | null
  created_at: string
  customers: { full_name: string; phone: string | null } | null
  restaurants: { name: string; address: string; lat: number | null; lng: number | null } | null
  order_items: OrderItem[]
}
type Driver = { id: string; full_name: string; status: string; earnings_rate: number }

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371, toRad = (d: number) => d * Math.PI / 180
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function fmt(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(n)
}

function distLabel(km: number) {
  return km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`
}

export default function AvailableOrdersScreen() {
  const [orders,    setOrders]    = useState<Order[]>([])
  const [driver,    setDriver]    = useState<Driver | null>(null)
  const [activeId,  setActiveId]  = useState<string | null>(null)
  const [location,  setLocation]  = useState<{ lat: number; lng: number } | null>(null)
  const [loading,   setLoading]   = useState(true)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [refreshing,setRefreshing]= useState(false)
  const router = useRouter()

  const getDriver = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const { data } = await supabase
      .from('drivers')
      .select('id, full_name, status, earnings_rate')
      .eq('user_id', user.id)
      .maybeSingle()
    return data as Driver | null
  }

  const getOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select(`
        id, delivery_address, delivery_lat, delivery_lng,
        delivery_fee, subtotal, notes, created_at,
        customers ( full_name, phone ),
        restaurants ( name, address, lat, lng ),
        order_items ( product_name, quantity )
      `)
      .eq('status', 'ready')
      .is('driver_id', null)
      .order('created_at', { ascending: false })
    return (data ?? []) as unknown as Order[]
  }

  const getActiveOrder = async (driverId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('id')
      .eq('driver_id', driverId)
      .in('status', ['picked_up', 'in_transit'])
      .maybeSingle()
    return data?.id ?? null
  }

  const loadAll = useCallback(async () => {
    const [driverData, ordersData] = await Promise.all([getDriver(), getOrders()])
    setDriver(driverData)
    setOrders(ordersData)
    if (driverData) {
      const aid = await getActiveOrder(driverData.id)
      setActiveId(aid)
    }
    setLoading(false)
    setRefreshing(false)
  }, [])

  useEffect(() => {
    loadAll()

    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({}).then(loc =>
          setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude })
        )
      }
    })

    let channel: RealtimeChannel
    const sub = async () => {
      channel = supabase
        .channel('available-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          getOrders().then(setOrders)
        })
        .subscribe()
    }
    sub()
    return () => { channel?.unsubscribe() }
  }, [])

  const handleAccept = (order: Order) => {
    if (!driver) return Alert.alert('Sin perfil', 'No tienes un perfil de repartidor configurado.')
    if (driver.status === 'offline') return Alert.alert('Inactivo', 'Activa tu disponibilidad en el perfil.')
    if (activeId) return Alert.alert('Pedido activo', 'Ya tienes un pedido en curso. Complétalo primero.')

    Alert.alert(
      'Aceptar pedido',
      `¿Recoges en ${order.restaurants?.name ?? 'el restaurante'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            setAccepting(order.id)
            const { error } = await supabase
              .from('orders')
              .update({ driver_id: driver.id, status: 'picked_up' })
              .eq('id', order.id)
              .is('driver_id', null)
            if (error) {
              Alert.alert('Error', 'No se pudo aceptar. Puede que otro repartidor lo tomó.')
            } else {
              setOrders(prev => prev.filter(o => o.id !== order.id))
              setActiveId(order.id)
              router.push(`/order/${order.id}`)
            }
            setAccepting(null)
          },
        },
      ]
    )
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#f97316" /></View>

  const rate = driver?.earnings_rate ?? 0.85

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Pedidos disponibles</Text>
          <Text style={s.headerSub}>{driver?.full_name ?? 'Sin perfil'}</Text>
        </View>
        <View style={[s.badge, driver?.status === 'available' ? s.badgeGreen : s.badgeGray]}>
          <View style={[s.dot, driver?.status === 'available' ? s.dotGreen : s.dotGray]} />
          <Text style={[s.badgeText, driver?.status === 'available' ? s.badgeTextGreen : s.badgeTextGray]}>
            {driver?.status === 'available' ? 'Disponible' : 'Inactivo'}
          </Text>
        </View>
      </View>

      {/* Active order banner */}
      {activeId && (
        <TouchableOpacity style={s.activeBanner} onPress={() => router.push(`/order/${activeId}`)}>
          <Ionicons name="navigate-circle" size={20} color="#fff" />
          <Text style={s.activeBannerText}>Tienes un pedido activo — Ver detalles</Text>
          <Ionicons name="chevron-forward" size={16} color="#fff" />
        </TouchableOpacity>
      )}

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadAll() }} tintColor="#f97316" />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="checkmark-circle-outline" size={54} color="#d1d5db" />
            <Text style={s.emptyTitle}>Sin pedidos disponibles</Text>
            <Text style={s.emptySub}>Los pedidos listos para recoger aparecerán aquí en tiempo real</Text>
          </View>
        }
        renderItem={({ item }) => {
          const rLat = item.restaurants?.lat, rLng = item.restaurants?.lng
          const dist = location && rLat && rLng ? haversine(location.lat, location.lng, rLat, rLng) : null
          const earned = item.delivery_fee * rate

          return (
            <View style={s.card}>
              {/* Restaurant */}
              <View style={s.cardTop}>
                <View style={s.restIcon}>
                  <Ionicons name="restaurant" size={16} color="#f97316" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.restName}>{item.restaurants?.name ?? '—'}</Text>
                  <Text style={s.restAddr} numberOfLines={1}>{item.restaurants?.address ?? '—'}</Text>
                </View>
                {dist != null && <Text style={s.distText}>{distLabel(dist)}</Text>}
              </View>

              <View style={s.divider} />

              {/* Items */}
              <View style={s.row}>
                <Ionicons name="bag-handle-outline" size={13} color="#9ca3af" />
                <Text style={s.itemsText} numberOfLines={2}>
                  {item.order_items.map(i => `${i.quantity}× ${i.product_name}`).join(', ')}
                </Text>
              </View>

              {/* Destination */}
              <View style={s.row}>
                <Ionicons name="location-outline" size={13} color="#9ca3af" />
                <Text style={s.addrText} numberOfLines={2}>{item.delivery_address}</Text>
              </View>

              {/* Customer */}
              <View style={s.row}>
                <Ionicons name="person-outline" size={13} color="#9ca3af" />
                <Text style={s.addrText}>{item.customers?.full_name ?? 'Cliente'}</Text>
              </View>

              {item.notes ? (
                <View style={s.notesBox}>
                  <Ionicons name="chatbubble-ellipses-outline" size={12} color="#f97316" />
                  <Text style={s.notesText}>{item.notes}</Text>
                </View>
              ) : null}

              <View style={s.divider} />

              {/* Earnings */}
              <View style={s.footer}>
                <View>
                  <Text style={s.earnedLabel}>Tus ganancias ({(rate * 100).toFixed(0)}%)</Text>
                  <Text style={s.earnedValue}>{fmt(earned)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.feeLabel}>Tarifa envío</Text>
                  <Text style={s.feeValue}>{fmt(item.delivery_fee)}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[s.acceptBtn, accepting !== null && { opacity: 0.6 }]}
                onPress={() => handleAccept(item)}
                disabled={accepting !== null}
                activeOpacity={0.85}
              >
                {accepting === item.id
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Ionicons name="checkmark-circle" size={19} color="#fff" />
                      <Text style={s.acceptText}>Aceptar pedido</Text>
                    </>
                }
              </TouchableOpacity>
            </View>
          )
        }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: '#fff',
    paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerSub:   { fontSize: 13, color: '#6b7280', marginTop: 2 },
  badge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5,
  },
  badgeGreen: { backgroundColor: '#f0fdf4' },
  badgeGray:  { backgroundColor: '#f3f4f6' },
  dot:        { width: 7, height: 7, borderRadius: 4 },
  dotGreen:   { backgroundColor: '#22c55e' },
  dotGray:    { backgroundColor: '#9ca3af' },
  badgeText:      { fontSize: 12, fontWeight: '600' },
  badgeTextGreen: { color: '#16a34a' },
  badgeTextGray:  { color: '#6b7280' },
  activeBanner: {
    backgroundColor: '#f97316',
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  activeBannerText: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 14 },
  list:  { padding: 16, gap: 12 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#374151' },
  emptySub:   { fontSize: 13, color: '#9ca3af', textAlign: 'center', paddingHorizontal: 40 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  restIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center',
  },
  restName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  restAddr: { fontSize: 12, color: '#9ca3af', marginTop: 1 },
  distText: { fontSize: 13, fontWeight: '700', color: '#f97316' },
  divider:  { height: 1, backgroundColor: '#f3f4f6', marginVertical: 12 },
  row:     { flexDirection: 'row', gap: 6, marginBottom: 7, alignItems: 'flex-start' },
  itemsText: { flex: 1, fontSize: 13, color: '#6b7280', lineHeight: 18 },
  addrText:  { flex: 1, fontSize: 13, color: '#374151', lineHeight: 18 },
  notesBox: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    backgroundColor: '#fff7ed', padding: 8, borderRadius: 8, marginTop: 4, marginBottom: 8,
  },
  notesText: { flex: 1, fontSize: 12, color: '#92400e' },
  footer:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  earnedLabel: { fontSize: 11, color: '#6b7280' },
  earnedValue: { fontSize: 22, fontWeight: '800', color: '#16a34a', marginTop: 2 },
  feeLabel:    { fontSize: 11, color: '#6b7280' },
  feeValue:    { fontSize: 14, fontWeight: '600', color: '#6b7280', marginTop: 2 },
  acceptBtn: {
    backgroundColor: '#f97316', borderRadius: 13,
    paddingVertical: 14, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 14,
    shadowColor: '#f97316', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25, shadowRadius: 6, elevation: 3,
  },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
