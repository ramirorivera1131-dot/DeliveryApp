import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { supabase } from '@/lib/supabase'

type Delivery = {
  id: string
  delivery_fee: number
  delivery_address: string
  delivered_at: string | null
  created_at: string
  restaurants: { name: string } | null
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' }).format(n)

const fmtDate = (s: string) =>
  new Intl.DateTimeFormat('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(s))

export default function HistoryScreen() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [driverId,   setDriverId]   = useState<string | null>(null)
  const [rate,       setRate]       = useState(0.85)

  const fetchDeliveries = async (dId?: string) => {
    const id = dId ?? driverId
    if (!id) return

    const monthStart = new Date(
      new Date().getFullYear(), new Date().getMonth(), 1
    ).toISOString()

    const { data } = await supabase
      .from('orders')
      .select('id, delivery_fee, delivery_address, delivered_at, created_at, restaurants(name)')
      .eq('driver_id', id)
      .eq('status', 'delivered')
      .gte('created_at', monthStart)
      .order('delivered_at', { ascending: false, nullsFirst: false })

    setDeliveries((data ?? []) as unknown as Delivery[])
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('drivers')
        .select('id, earnings_rate')
        .eq('user_id', user.id)
        .maybeSingle()
      if (data) {
        setDriverId(data.id)
        setRate(data.earnings_rate ?? 0.85)
        await fetchDeliveries(data.id)
      } else {
        setLoading(false)
      }
    }
    init()
  }, [])

  const today = new Date().toDateString()
  const todayList   = deliveries.filter(d => new Date(d.delivered_at ?? d.created_at).toDateString() === today)
  const todayEarned = todayList.reduce((s, d) => s + d.delivery_fee * rate, 0)
  const monthEarned = deliveries.reduce((s, d) => s + d.delivery_fee * rate, 0)
  const monthLabel  = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric' }).format(new Date())

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#f97316" /></View>

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Mis ganancias</Text>
        <Text style={s.headerSub}>{monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1)}</Text>
      </View>

      {/* Stats cards */}
      <View style={s.statsRow}>
        <View style={s.statCard}>
          <View style={[s.statIcon, { backgroundColor: '#fff7ed' }]}>
            <Ionicons name="today-outline" size={18} color="#f97316" />
          </View>
          <Text style={s.statLabel}>Hoy</Text>
          <Text style={s.statValue}>{fmt(todayEarned)}</Text>
          <Text style={s.statSub}>{todayList.length} carrera{todayList.length !== 1 ? 's' : ''}</Text>
        </View>
        <View style={s.statCard}>
          <View style={[s.statIcon, { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="calendar-outline" size={18} color="#22c55e" />
          </View>
          <Text style={s.statLabel}>Este mes</Text>
          <Text style={[s.statValue, { color: '#16a34a' }]}>{fmt(monthEarned)}</Text>
          <Text style={s.statSub}>{deliveries.length} carrera{deliveries.length !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <View style={s.commRow}>
        <Ionicons name="information-circle-outline" size={13} color="#9ca3af" />
        <Text style={s.commText}>Recibes el {(rate * 100).toFixed(0)}% del costo de envío por carrera</Text>
      </View>

      <FlatList
        data={deliveries}
        keyExtractor={d => d.id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDeliveries() }} tintColor="#f97316" />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="time-outline" size={48} color="#e5e7eb" />
            <Text style={s.emptyText}>Sin entregas este mes</Text>
          </View>
        }
        renderItem={({ item }) => {
          const earned  = item.delivery_fee * rate
          const isToday = new Date(item.delivered_at ?? item.created_at).toDateString() === today
          return (
            <View style={s.card}>
              <View style={s.cardLeft}>
                <View style={[s.cardIcon, isToday && s.cardIconToday]}>
                  <Ionicons name="bicycle-outline" size={16} color={isToday ? '#f97316' : '#9ca3af'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.restName}>{item.restaurants?.name ?? '—'}</Text>
                  <Text style={s.addr} numberOfLines={1}>{item.delivery_address}</Text>
                  <Text style={s.time}>{fmtDate(item.delivered_at ?? item.created_at)}</Text>
                </View>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.earned}>{fmt(earned)}</Text>
                <Text style={s.fee}>de {fmt(item.delivery_fee)}</Text>
              </View>
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
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  headerSub:   { fontSize: 13, color: '#6b7280', marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 12, padding: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', marginBottom: 10,
  },
  statLabel: { fontSize: 12, color: '#6b7280' },
  statValue: { fontSize: 20, fontWeight: '800', color: '#f97316', marginTop: 4 },
  statSub:   { fontSize: 11, color: '#9ca3af', marginTop: 3 },
  commRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 16, marginBottom: 4 },
  commText:  { fontSize: 12, color: '#9ca3af', flex: 1 },
  list:      { padding: 16, gap: 8 },
  empty:     { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  cardLeft:     { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cardIcon:     { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
  cardIconToday:{ backgroundColor: '#fff7ed' },
  restName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  addr:     { fontSize: 12, color: '#6b7280', marginTop: 1 },
  time:     { fontSize: 11, color: '#9ca3af', marginTop: 3 },
  earned:   { fontSize: 16, fontWeight: '800', color: '#16a34a' },
  fee:      { fontSize: 11, color: '#9ca3af', marginTop: 2 },
})
