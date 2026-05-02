import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity, RefreshControl,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useOrders } from '@/hooks/useOrders'
import { fmt, fmtDate } from '@/utils/format'

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:    { label: 'Pendiente',   color: '#f59e0b' },
  confirmed:  { label: 'Confirmado',  color: '#3b82f6' },
  preparing:  { label: 'Preparando',  color: '#8b5cf6' },
  ready:      { label: 'Listo',       color: '#f97316' },
  picked_up:  { label: 'Recogido',    color: '#f97316' },
  in_transit: { label: 'En camino',   color: '#0ea5e9' },
  delivered:  { label: 'Entregado',   color: '#22c55e' },
  cancelled:  { label: 'Cancelado',   color: '#ef4444' },
}

export default function OrdersScreen() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | undefined>()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id))
  }, [])

  const { data: orders = [], isLoading, refetch, isRefetching } = useOrders(userId)

  if (isLoading) {
    return <View style={s.center}><ActivityIndicator size="large" color="#f97316" /></View>
  }

  const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status))
  const past   = orders.filter(o =>  ['delivered', 'cancelled'].includes(o.status))

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Mis pedidos</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        contentContainerStyle={s.list}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#f97316" />
        }
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="receipt-outline" size={48} color="#e5e7eb" />
            <Text style={s.emptyText}>Sin pedidos aún</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/(tabs)')}>
              <Text style={s.emptyBtnText}>Explorar restaurantes</Text>
            </TouchableOpacity>
          </View>
        }
        ListHeaderComponent={
          active.length > 0 ? (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Pedidos activos</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const st = STATUS_LABEL[item.status] ?? { label: item.status, color: '#6b7280' }
          const isActive = !['delivered', 'cancelled'].includes(item.status)
          return (
            <TouchableOpacity
              style={[s.card, isActive && s.cardActive]}
              activeOpacity={0.85}
              onPress={() => isActive ? router.push(`/order/${item.id}`) : null}
            >
              <View style={s.cardTop}>
                <View style={s.restInfo}>
                  <Text style={s.restName}>{item.restaurants?.name ?? '—'}</Text>
                  <Text style={s.addr} numberOfLines={1}>{item.delivery_address}</Text>
                </View>
                <View style={[s.pill, { backgroundColor: st.color + '20' }]}>
                  <Text style={[s.pillText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>
              <View style={s.cardBottom}>
                <Text style={s.time}>{fmtDate(item.created_at)}</Text>
                <View style={s.amounts}>
                  <Text style={s.amountLabel}>Total:</Text>
                  <Text style={s.amountValue}>{fmt(item.subtotal + item.delivery_fee)}</Text>
                </View>
              </View>
              {isActive && (
                <View style={s.trackRow}>
                  <Ionicons name="radio-outline" size={14} color="#f97316" />
                  <Text style={s.trackText}>Toca para ver en tiempo real</Text>
                </View>
              )}
            </TouchableOpacity>
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
    backgroundColor: '#fff', paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  list:  { padding: 16, gap: 10 },
  section:      { marginBottom: 4 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  empty:      { alignItems: 'center', paddingTop: 80, gap: 8 },
  emptyText:  { fontSize: 14, color: '#9ca3af' },
  emptyBtn:   { marginTop: 12, backgroundColor: '#f97316', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText:{ fontSize: 14, fontWeight: '700', color: '#fff' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardActive: { borderWidth: 1.5, borderColor: '#fed7aa' },
  cardTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  restInfo:   { flex: 1, marginRight: 10 },
  restName:   { fontSize: 15, fontWeight: '700', color: '#111827' },
  addr:       { fontSize: 12, color: '#6b7280', marginTop: 2 },
  pill:       { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  pillText:   { fontSize: 12, fontWeight: '700' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  time:       { fontSize: 11, color: '#9ca3af' },
  amounts:    { flexDirection: 'row', gap: 4, alignItems: 'center' },
  amountLabel:{ fontSize: 12, color: '#6b7280' },
  amountValue:{ fontSize: 14, fontWeight: '700', color: '#111827' },
  trackRow:   { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  trackText:  { fontSize: 12, color: '#f97316', fontWeight: '600' },
})
