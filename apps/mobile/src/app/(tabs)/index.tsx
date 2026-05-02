import { useEffect, useCallback, useRef } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, Animated, Switch, Alert, Platform, Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useTheme, PRIMARY, SUCCESS } from '@/lib/theme'
import { useDriver, useUpdateDriverStatus } from '@/hooks/use-driver'
import { useAvailableOrders, useActiveOrder, useAcceptOrder } from '@/hooks/use-orders'
import { useDriverLocation } from '@/hooks/use-location'
import { useQueryClient } from '@tanstack/react-query'
import { formatCurrency, distanceLabel, haversine } from '@/lib/utils'
import { SkeletonCard } from '@/components/ui/Skeleton'
import type { Order } from '@/lib/types'

export default function AvailableOrdersScreen() {
  const t      = useTheme()
  const router = useRouter()
  const qc     = useQueryClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const toggleAnim = useRef(new Animated.Value(0)).current

  const { data: driver, isLoading: loadingDriver, refetch: refetchDriver } = useDriver()
  const { data: orders = [], isLoading: loadingOrders, refetch: refetchOrders } = useAvailableOrders()
  const { data: activeOrder } = useActiveOrder(driver?.id)
  const { location }          = useDriverLocation()
  const updateStatus          = useUpdateDriverStatus()
  const acceptOrder           = useAcceptOrder()

  const isAvailable = driver?.status === 'available'

  // Animate toggle
  useEffect(() => {
    Animated.spring(toggleAnim, {
      toValue:         isAvailable ? 1 : 0,
      useNativeDriver: true,
      tension:         80, friction: 10,
    }).start()
  }, [isAvailable])

  // Real-time subscriptions
  useEffect(() => {
    const ch = supabase
      .channel('available-orders-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        qc.invalidateQueries({ queryKey: ['orders', 'available'] })
        qc.invalidateQueries({ queryKey: ['orders', 'active'] })
      })
      .subscribe()
    channelRef.current = ch
    return () => { ch.unsubscribe() }
  }, [qc])

  const handleRefresh = useCallback(() => {
    refetchOrders()
    refetchDriver()
  }, [refetchOrders, refetchDriver])

  const handleToggleAvailability = async () => {
    if (!driver) return
    const next = isAvailable ? 'offline' : 'available'
    await updateStatus.mutateAsync({ driverId: driver.id, status: next })
    Toast.show({
      type:  'success',
      text1: next === 'available' ? '¡Estás disponible!' : 'Ahora estás inactivo',
      text2: next === 'available' ? 'Los pedidos cercanos aparecerán aquí' : 'No recibirás pedidos nuevos',
      position: 'bottom',
    })
  }

  const handleAccept = (order: Order) => {
    if (!driver) { Toast.show({ type: 'error', text1: 'Sin perfil de repartidor', position: 'bottom' }); return }
    if (!isAvailable) { Toast.show({ type: 'info', text1: 'Activa tu disponibilidad primero', position: 'bottom' }); return }
    if (activeOrder) { Toast.show({ type: 'info', text1: 'Ya tienes un pedido activo', position: 'bottom' }); return }

    Alert.alert(
      'Aceptar pedido',
      `¿Confirmas recoger en ${order.restaurants?.name ?? 'el restaurante'}?\n\nGanarás ${formatCurrency(order.delivery_fee * (driver.earnings_rate))}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            try {
              await acceptOrder.mutateAsync({ orderId: order.id, driverId: driver.id })
              Toast.show({ type: 'success', text1: '¡Pedido aceptado!', text2: 'En camino al restaurante', position: 'bottom' })
              router.push(`/order/${order.id}`)
            } catch {
              Toast.show({ type: 'error', text1: 'No se pudo aceptar', text2: 'Otro repartidor lo tomó antes', position: 'bottom' })
            }
          },
        },
      ]
    )
  }

  const handleOpenMaps = (lat: number | null, lng: number | null, address: string) => {
    if (!lat || !lng) return
    const url = Platform.OS === 'ios'
      ? `maps://?daddr=${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}`
    Linking.canOpenURL(url).then(ok =>
      Linking.openURL(ok ? url : `https://maps.google.com/?q=${lat},${lng}`)
    )
  }

  const loading = loadingDriver || loadingOrders

  const toggleScale = toggleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] })

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: t.background }]} edges={['top']}>
      {/* Header */}
      <View style={[s.header, { backgroundColor: t.headerBg, borderBottomColor: t.border }]}>
        <View>
          <Text style={[s.headerTitle, { color: t.text }]}>
            {isAvailable ? 'Pedidos disponibles' : 'Estás inactivo'}
          </Text>
          <Text style={[s.headerSub, { color: t.textSecondary }]}>
            {driver?.full_name ?? '—'}
          </Text>
        </View>
        <Animated.View style={{ transform: [{ scale: toggleScale }] }}>
          <TouchableOpacity
            style={[s.availToggle, { backgroundColor: isAvailable ? t.successLight : t.surface }]}
            onPress={handleToggleAvailability}
            disabled={updateStatus.isPending}
            activeOpacity={0.8}
          >
            <View style={[s.availDot, { backgroundColor: isAvailable ? SUCCESS : t.textTertiary }]} />
            <Text style={[s.availText, { color: isAvailable ? t.success : t.textSecondary }]}>
              {isAvailable ? 'Activo' : 'Inactivo'}
            </Text>
            <Switch
              value={isAvailable}
              onValueChange={handleToggleAvailability}
              trackColor={{ false: t.border, true: '#bbf7d0' }}
              thumbColor={isAvailable ? SUCCESS : '#d1d5db'}
              ios_backgroundColor={t.border}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Active order banner */}
      {activeOrder && (
        <TouchableOpacity
          style={[s.activeBanner, { backgroundColor: PRIMARY }]}
          onPress={() => router.push(`/order/${activeOrder.id}`)}
          activeOpacity={0.9}
        >
          <Ionicons name="navigate-circle" size={20} color="#fff" />
          <Text style={s.activeBannerText}>
            Pedido activo — {activeOrder.restaurants?.name ?? 'Ver detalles'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      )}

      {/* Order count */}
      {isAvailable && !loading && orders.length > 0 && (
        <View style={[s.countBar, { backgroundColor: t.surface }]}>
          <View style={[s.countDot, { backgroundColor: PRIMARY }]} />
          <Text style={[s.countText, { color: t.textSecondary }]}>
            {orders.length} pedido{orders.length !== 1 ? 's' : ''} disponible{orders.length !== 1 ? 's' : ''} cerca de ti
          </Text>
        </View>
      )}

      <FlatList
        data={loading ? [] : (isAvailable ? orders : [])}
        keyExtractor={o => o.id}
        contentContainerStyle={[s.list, { paddingBottom: 32 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={handleRefresh}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
        ListHeaderComponent={loading ? (
          <View style={{ gap: 12 }}>
            {[0, 1, 2].map(i => <SkeletonCard key={i} />)}
          </View>
        ) : null}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              {isAvailable ? (
                <>
                  <View style={[s.emptyIcon, { backgroundColor: t.surface }]}>
                    <Ionicons name="bicycle-outline" size={40} color={t.textTertiary} />
                  </View>
                  <Text style={[s.emptyTitle, { color: t.text }]}>Sin pedidos por ahora</Text>
                  <Text style={[s.emptySub, { color: t.textSecondary }]}>
                    Los pedidos nuevos aparecen en tiempo real.{'\n'}Las zonas más activas son el centro y zonas comerciales.
                  </Text>
                </>
              ) : (
                <>
                  <View style={[s.emptyIcon, { backgroundColor: t.surface }]}>
                    <Ionicons name="pause-circle-outline" size={40} color={t.textTertiary} />
                  </View>
                  <Text style={[s.emptyTitle, { color: t.text }]}>Estás inactivo</Text>
                  <Text style={[s.emptySub, { color: t.textSecondary }]}>
                    Activa tu disponibilidad para empezar a recibir pedidos
                  </Text>
                  <TouchableOpacity
                    style={[s.activateBtn, { backgroundColor: PRIMARY }]}
                    onPress={handleToggleAvailability}
                  >
                    <Text style={s.activateBtnText}>Activar disponibilidad</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const rLat   = item.restaurants?.lat
          const rLng   = item.restaurants?.lng
          const dist   = location && rLat && rLng ? haversine(location.lat, location.lng, rLat, rLng) : null
          const earned = item.delivery_fee * (driver?.earnings_rate ?? 0.85)
          const mins   = dist ? Math.round((dist / 25) * 60 + 5) : null

          return (
            <View style={[s.card, { backgroundColor: t.card, borderColor: t.cardBorder }]}>
              {/* Restaurant row */}
              <View style={s.cardTop}>
                <View style={[s.restIcon, { backgroundColor: t.primaryLight }]}>
                  <Ionicons name="restaurant" size={17} color={PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.restName, { color: t.text }]}>{item.restaurants?.name ?? '—'}</Text>
                  <Text style={[s.restAddr, { color: t.textTertiary }]} numberOfLines={1}>
                    {item.restaurants?.address ?? '—'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 2 }}>
                  {dist != null && (
                    <Text style={[s.distText, { color: PRIMARY }]}>{distanceLabel(dist)}</Text>
                  )}
                  {mins != null && (
                    <Text style={[s.minsText, { color: t.textTertiary }]}>~{mins} min</Text>
                  )}
                </View>
              </View>

              <View style={[s.divider, { backgroundColor: t.divider }]} />

              {/* Info rows */}
              <View style={s.infoRow}>
                <Ionicons name="bag-handle-outline" size={13} color={t.textTertiary} />
                <Text style={[s.infoText, { color: t.textSecondary }]} numberOfLines={2}>
                  {item.order_items.map(i => `${i.quantity}× ${i.product_name}`).join(', ')}
                </Text>
              </View>
              <View style={s.infoRow}>
                <Ionicons name="location-outline" size={13} color={t.textTertiary} />
                <Text style={[s.infoText, { color: t.text }]} numberOfLines={2}>{item.delivery_address}</Text>
              </View>
              <View style={s.infoRow}>
                <Ionicons name="person-outline" size={13} color={t.textTertiary} />
                <Text style={[s.infoText, { color: t.textSecondary }]}>{item.customers?.full_name ?? 'Cliente'}</Text>
              </View>

              {item.notes && (
                <View style={[s.notesBox, { backgroundColor: t.primaryLight }]}>
                  <Ionicons name="chatbubble-ellipses-outline" size={12} color={PRIMARY} />
                  <Text style={[s.notesText, { color: '#92400e' }]}>{item.notes}</Text>
                </View>
              )}

              <View style={[s.divider, { backgroundColor: t.divider }]} />

              {/* Earnings */}
              <View style={s.earningsRow}>
                <View>
                  <Text style={[s.earnLabel, { color: t.textSecondary }]}>
                    Tus ganancias ({Math.round((driver?.earnings_rate ?? 0.85) * 100)}%)
                  </Text>
                  <Text style={[s.earnValue, { color: t.success }]}>{formatCurrency(earned)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.feeLabel, { color: t.textTertiary }]}>Tarifa envío</Text>
                  <Text style={[s.feeValue, { color: t.textSecondary }]}>{formatCurrency(item.delivery_fee)}</Text>
                </View>
              </View>

              {/* Maps shortcut */}
              <TouchableOpacity
                style={[s.mapsBtn, { borderColor: t.border }]}
                onPress={() => handleOpenMaps(rLat ?? null, rLng ?? null, item.restaurants?.address ?? '')}
                activeOpacity={0.7}
              >
                <Ionicons name="map-outline" size={14} color={t.textSecondary} />
                <Text style={[s.mapsBtnText, { color: t.textSecondary }]}>Ver en mapa</Text>
              </TouchableOpacity>

              {/* Accept */}
              <TouchableOpacity
                style={[s.acceptBtn, acceptOrder.isPending && s.acceptDisabled]}
                onPress={() => handleAccept(item)}
                disabled={acceptOrder.isPending}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={19} color="#fff" />
                <Text style={s.acceptText}>Aceptar pedido</Text>
              </TouchableOpacity>
            </View>
          )
        }}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  headerSub:   { fontSize: 12, marginTop: 2 },
  availToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  availDot:  { width: 7, height: 7, borderRadius: 4 },
  availText: { fontSize: 12, fontWeight: '700' },
  activeBanner: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 18, paddingVertical: 13, gap: 8,
  },
  activeBannerText: { flex: 1, color: '#fff', fontWeight: '700', fontSize: 14 },
  countBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 18, paddingVertical: 8,
  },
  countDot:  { width: 7, height: 7, borderRadius: 4 },
  countText: { fontSize: 12, fontWeight: '600' },
  list: { padding: 16, gap: 14 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32, gap: 10 },
  emptyIcon:  { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  emptySub:   { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  activateBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  activateBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: {
    borderRadius: 18, padding: 16, borderWidth: 1,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  cardTop:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  restIcon: { width: 38, height: 38, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  restName: { fontSize: 15, fontWeight: '700' },
  restAddr: { fontSize: 12, marginTop: 1 },
  distText: { fontSize: 14, fontWeight: '800' },
  minsText: { fontSize: 11 },
  divider:  { height: 1, marginVertical: 12 },
  infoRow:  { flexDirection: 'row', gap: 6, marginBottom: 7, alignItems: 'flex-start' },
  infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
  notesBox: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    padding: 8, borderRadius: 8, marginTop: 4, marginBottom: 8,
  },
  notesText:   { flex: 1, fontSize: 12 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  earnLabel: { fontSize: 11 },
  earnValue: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  feeLabel:  { fontSize: 11 },
  feeValue:  { fontSize: 14, fontWeight: '600', marginTop: 2 },
  mapsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, borderWidth: 1, borderRadius: 10, paddingVertical: 9, marginTop: 12,
  },
  mapsBtnText: { fontSize: 12, fontWeight: '600' },
  acceptBtn: {
    backgroundColor: PRIMARY, borderRadius: 14,
    paddingVertical: 15, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 10,
    shadowColor: PRIMARY, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  acceptDisabled: { opacity: 0.6 },
  acceptText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})
