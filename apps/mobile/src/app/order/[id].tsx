import { useEffect, useRef, useCallback } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ScrollView, Linking, Platform, ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import MapView, { Marker, Polyline, type Region } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useTheme, PRIMARY, SUCCESS } from '@/lib/theme'
import { useOrder, useUpdateOrderStatus } from '@/hooks/use-orders'
import { useDriverLocation } from '@/hooks/use-location'
import { useQueryClient } from '@tanstack/react-query'
import { formatCurrency, haversine, distanceLabel, estimatedMinutes } from '@/lib/utils'
import { ORDER_STATUS_CONFIG } from '@/components/ui/StatusBadge'
import type { Order } from '@/lib/types'

function openMaps(lat: number | null, lng: number | null, address: string) {
  if (lat && lng) {
    const url = Platform.OS === 'ios'
      ? `maps://?daddr=${lat},${lng}`
      : `geo:${lat},${lng}?q=${lat},${lng}`
    Linking.canOpenURL(url).then(ok =>
      Linking.openURL(ok ? url : `https://maps.google.com/?q=${lat},${lng}`)
    )
  } else {
    Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`)
  }
}

const STATUS_STEPS = ['picked_up', 'in_transit', 'delivered'] as const
const STEP_LABELS  = { picked_up: 'En restaurante', in_transit: 'En camino', delivered: 'Entregado' }

function ProgressBar({ status, t }: { status: string; t: ReturnType<typeof useTheme> }) {
  const current = STATUS_STEPS.indexOf(status as never)
  return (
    <View style={[ps.wrap, { backgroundColor: t.surface, borderColor: t.cardBorder }]}>
      {STATUS_STEPS.map((step, i) => {
        const done    = i <= current
        const isCurrent = i === current
        return (
          <View key={step} style={ps.stepWrap}>
            <View style={[ps.dot, done ? { backgroundColor: isCurrent ? PRIMARY : SUCCESS } : { backgroundColor: t.border }]}>
              {done && !isCurrent && <Ionicons name="checkmark" size={11} color="#fff" />}
              {isCurrent && <View style={[ps.activeDot]} />}
            </View>
            <Text style={[ps.stepLabel, { color: isCurrent ? PRIMARY : done ? SUCCESS : t.textTertiary }]}>
              {STEP_LABELS[step]}
            </Text>
            {i < STATUS_STEPS.length - 1 && (
              <View style={[ps.line, { backgroundColor: i < current ? SUCCESS : t.border }]} />
            )}
          </View>
        )
      })}
    </View>
  )
}

const ps = StyleSheet.create({
  wrap:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 14 },
  stepWrap:{ flex: 1, alignItems: 'center', gap: 5, position: 'relative' },
  dot:     { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  activeDot:{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  stepLabel:{ fontSize: 10, fontWeight: '700', textAlign: 'center' },
  line:    { position: 'absolute', top: 12, left: '55%', right: '-45%', height: 2, zIndex: -1 },
})

export default function OrderScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>()
  const router  = useRouter()
  const t       = useTheme()
  const qc      = useQueryClient()
  const mapRef  = useRef<MapView>(null)
  const { location } = useDriverLocation()

  const { data: order, isLoading } = useOrder(id)
  const updateStatus = useUpdateOrderStatus()

  // Real-time order updates
  useEffect(() => {
    if (!id) return
    const ch: RealtimeChannel = supabase
      .channel(`order-rt-${id}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        payload => {
          qc.setQueryData<Order | null>(['order', id], o => o ? { ...o, ...payload.new } : null)
          if (payload.new.status === 'delivered') {
            Toast.show({ type: 'success', text1: '¡Entrega completada!', text2: '¡Buen trabajo!', position: 'top' })
            setTimeout(() => router.replace('/(tabs)'), 2000)
          }
        }
      )
      .subscribe()
    return () => { ch.unsubscribe() }
  }, [id, qc, router])

  const handleUpdateStatus = useCallback(() => {
    if (!order) return
    const cfg = ORDER_STATUS_CONFIG[order.status]
    if (!cfg.next) return

    const isDelivery = cfg.next === 'delivered'
    const doUpdate = async () => {
      try {
        await updateStatus.mutateAsync({ orderId: order.id, status: cfg.next! })
        Toast.show({ type: 'success', text1: cfg.nextLabel ?? 'Estado actualizado', position: 'bottom' })
        if (isDelivery) {
          setTimeout(() => router.replace('/(tabs)'), 1500)
        }
      } catch {
        Toast.show({ type: 'error', text1: 'Error al actualizar estado', position: 'bottom' })
      }
    }

    if (isDelivery) {
      Alert.alert(
        'Confirmar entrega',
        '¿Confirmas que entregaste el pedido al cliente?',
        [{ text: 'Cancelar', style: 'cancel' }, { text: 'Confirmar', onPress: doUpdate }]
      )
    } else {
      doUpdate()
    }
  }, [order, updateStatus, router])

  if (isLoading || !order) {
    return (
      <View style={[s.center, { backgroundColor: t.background }]}>
        <ActivityIndicator size="large" color={PRIMARY} />
      </View>
    )
  }

  const rLat = order.restaurants?.lat ?? null
  const rLng = order.restaurants?.lng ?? null
  const dLat = order.delivery_lat
  const dLng = order.delivery_lng

  const midLat   = rLat && dLat ? (rLat + dLat) / 2 : (rLat ?? 19.43)
  const midLng   = rLng && dLng ? (rLng + dLng) / 2 : (rLng ?? -99.13)
  const latDelta = rLat && dLat ? Math.abs(rLat - dLat) * 2.2 + 0.01 : 0.05

  const cfg      = ORDER_STATUS_CONFIG[order.status]
  const isDone   = order.status === 'delivered' || order.status === 'cancelled'
  const earned   = order.delivery_fee * 0.85

  const distToRest   = location && rLat && rLng ? haversine(location.lat, location.lng, rLat, rLng) : null
  const distToDest   = rLat && dLat && rLng && dLng ? haversine(rLat, rLng, dLat, dLng) : null
  const etaRestMins  = distToRest ? estimatedMinutes(distToRest) : null
  const etaDestMins  = distToDest ? estimatedMinutes(distToDest) : null

  const polyline = [
    ...(rLat && rLng ? [{ latitude: rLat, longitude: rLng }] : []),
    ...(dLat && dLng ? [{ latitude: dLat, longitude: dLng }] : []),
  ]

  return (
    <View style={[s.container, { backgroundColor: t.background }]}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={s.map}
        initialRegion={{ latitude: midLat, longitude: midLng, latitudeDelta: latDelta, longitudeDelta: latDelta }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {rLat && rLng && (
          <Marker coordinate={{ latitude: rLat, longitude: rLng }} title={order.restaurants?.name ?? 'Restaurante'}>
            <View style={s.markerRest}>
              <Ionicons name="restaurant" size={14} color="#fff" />
            </View>
          </Marker>
        )}
        {dLat && dLng && (
          <Marker coordinate={{ latitude: dLat, longitude: dLng }} title={order.customers?.full_name ?? 'Destino'}>
            <View style={s.markerDest}>
              <Ionicons name="location" size={14} color="#fff" />
            </View>
          </Marker>
        )}
        {polyline.length === 2 && (
          <Polyline
            coordinates={polyline}
            strokeColor={PRIMARY}
            strokeWidth={3}
            lineDashPattern={[6, 4]}
          />
        )}
      </MapView>

      {/* Back + order id overlay */}
      <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={20} color={t.text} />
      </TouchableOpacity>
      <View style={[s.orderIdPill, { backgroundColor: t.card }]}>
        <Text style={[s.orderIdText, { color: t.textSecondary }]}>
          #{order.id.slice(0, 8).toUpperCase()}
        </Text>
      </View>

      {/* Bottom sheet */}
      <View style={[s.sheet, { backgroundColor: t.card }]}>
        <View style={s.sheetHandle} />
        <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
          {/* Progress */}
          <ProgressBar status={order.status} t={t} />

          {/* Earnings & ETA */}
          <View style={[s.earningsEta, { backgroundColor: t.surface, borderColor: t.cardBorder }]}>
            <View style={s.etaStat}>
              <Text style={[s.etaLabel, { color: t.textTertiary }]}>Tus ganancias</Text>
              <Text style={[s.earningsVal, { color: t.success }]}>{formatCurrency(earned)}</Text>
            </View>
            {(etaRestMins || etaDestMins) && (
              <View style={[s.etaDivider, { backgroundColor: t.border }]} />
            )}
            {order.status === 'picked_up' && etaRestMins != null && (
              <View style={s.etaStat}>
                <Text style={[s.etaLabel, { color: t.textTertiary }]}>Al restaurante</Text>
                <Text style={[s.etaValue, { color: t.text }]}>~{etaRestMins} min</Text>
              </View>
            )}
            {order.status === 'in_transit' && etaDestMins != null && (
              <View style={s.etaStat}>
                <Text style={[s.etaLabel, { color: t.textTertiary }]}>Al cliente</Text>
                <Text style={[s.etaValue, { color: t.text }]}>~{etaDestMins} min</Text>
              </View>
            )}
          </View>

          {/* Pickup location */}
          <TouchableOpacity
            style={[s.locCard, { backgroundColor: t.surface, borderColor: t.cardBorder }]}
            onPress={() => openMaps(rLat, rLng, order.restaurants?.address ?? '')}
            activeOpacity={0.75}
          >
            <View style={[s.locIcon, { backgroundColor: t.primaryLight }]}>
              <Ionicons name="restaurant" size={18} color={PRIMARY} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.locLabel, { color: t.textTertiary }]}>Recoger en</Text>
              <Text style={[s.locName, { color: t.text }]}>{order.restaurants?.name}</Text>
              <Text style={[s.locAddr, { color: t.textSecondary }]} numberOfLines={1}>
                {order.restaurants?.address}
              </Text>
            </View>
            <Ionicons name="navigate-outline" size={18} color={PRIMARY} />
          </TouchableOpacity>

          {/* Delivery location */}
          <TouchableOpacity
            style={[s.locCard, { backgroundColor: t.surface, borderColor: t.cardBorder }]}
            onPress={() => openMaps(dLat, dLng, order.delivery_address)}
            activeOpacity={0.75}
          >
            <View style={[s.locIcon, { backgroundColor: t.successLight }]}>
              <Ionicons name="location" size={18} color={SUCCESS} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.locLabel, { color: t.textTertiary }]}>Entregar a</Text>
              <Text style={[s.locName, { color: t.text }]}>{order.customers?.full_name}</Text>
              <Text style={[s.locAddr, { color: t.textSecondary }]} numberOfLines={2}>
                {order.delivery_address}
              </Text>
            </View>
            <Ionicons name="navigate-outline" size={18} color={SUCCESS} />
          </TouchableOpacity>

          {/* Order items */}
          <View style={[s.itemsCard, { backgroundColor: t.surface, borderColor: t.cardBorder }]}>
            <Text style={[s.itemsTitle, { color: t.textSecondary }]}>Artículos</Text>
            {order.order_items.map((item, i) => (
              <View key={item.id ?? i} style={[s.itemRow, { borderBottomColor: t.divider }]}>
                <Text style={[s.itemQty, { color: PRIMARY }]}>{item.quantity}×</Text>
                <Text style={[s.itemName, { color: t.text }]}>{item.product_name}</Text>
                <Text style={[s.itemPrice, { color: t.textSecondary }]}>{formatCurrency(item.subtotal)}</Text>
              </View>
            ))}
            <View style={s.itemTotalRow}>
              <Text style={[s.itemTotalLabel, { color: t.textSecondary }]}>Subtotal pedido</Text>
              <Text style={[s.itemTotalValue, { color: t.text }]}>{formatCurrency(order.subtotal)}</Text>
            </View>
          </View>

          {/* Notes */}
          {order.notes && (
            <View style={[s.notesCard, { backgroundColor: t.primaryLight }]}>
              <Ionicons name="chatbubble-ellipses" size={13} color={PRIMARY} />
              <Text style={[s.notesText, { color: '#92400e' }]}>{order.notes}</Text>
            </View>
          )}

          {/* Call buttons */}
          <View style={s.callRow}>
            {order.customers?.phone && (
              <TouchableOpacity
                style={[s.callBtn, { borderColor: t.border, backgroundColor: t.card }]}
                onPress={() => Linking.openURL(`tel:${order.customers!.phone}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={17} color={t.text} />
                <Text style={[s.callText, { color: t.text }]}>Llamar cliente</Text>
              </TouchableOpacity>
            )}
            {order.restaurants?.phone && (
              <TouchableOpacity
                style={[s.callBtn, { borderColor: t.border, backgroundColor: t.card }]}
                onPress={() => Linking.openURL(`tel:${order.restaurants!.phone}`)}
                activeOpacity={0.7}
              >
                <Ionicons name="call-outline" size={17} color={t.text} />
                <Text style={[s.callText, { color: t.text }]}>Llamar restaurante</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Action button */}
          {cfg.next && !isDone && (
            <TouchableOpacity
              style={[
                s.actionBtn,
                { backgroundColor: cfg.next === 'delivered' ? SUCCESS : PRIMARY },
                updateStatus.isPending && s.actionDisabled,
              ]}
              onPress={handleUpdateStatus}
              disabled={updateStatus.isPending}
              activeOpacity={0.85}
            >
              {updateStatus.isPending
                ? <ActivityIndicator color="#fff" />
                : (
                  <>
                    <Ionicons
                      name={cfg.next === 'delivered' ? 'checkmark-circle' : 'arrow-forward-circle'}
                      size={21}
                      color="#fff"
                    />
                    <Text style={s.actionText}>{cfg.nextLabel}</Text>
                  </>
                )
              }
            </TouchableOpacity>
          )}

          {isDone && (
            <TouchableOpacity style={s.doneBtn} onPress={() => router.replace('/(tabs)')}>
              <Text style={[s.doneBtnText, { color: PRIMARY }]}>Volver a pedidos disponibles</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 16 }} />
        </ScrollView>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  map:       { flex: 1 },
  backBtn: {
    position: 'absolute', top: 52, left: 16,
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 8,
  },
  orderIdPill: {
    position: 'absolute', top: 52, right: 16,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 6, elevation: 6,
  },
  orderIdText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 20, maxHeight: '60%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 12,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#d1d5db',
    alignSelf: 'center', marginBottom: 16,
  },
  earningsEta: {
    flexDirection: 'row', borderRadius: 14, padding: 14,
    borderWidth: 1, marginBottom: 14, gap: 12,
  },
  etaStat:    { flex: 1, alignItems: 'center' },
  etaLabel:   { fontSize: 11, marginBottom: 3 },
  earningsVal:{ fontSize: 22, fontWeight: '800' },
  etaValue:   { fontSize: 20, fontWeight: '800' },
  etaDivider: { width: 1 },
  locCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 12, marginBottom: 10, borderWidth: 1,
  },
  locIcon: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  locLabel:{ fontSize: 11, marginBottom: 1 },
  locName: { fontSize: 14, fontWeight: '700' },
  locAddr: { fontSize: 12, marginTop: 1 },
  itemsCard: {
    borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1,
  },
  itemsTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  itemRow:    { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 7, marginBottom: 7, borderBottomWidth: 1 },
  itemQty:    { width: 28, fontSize: 14, fontWeight: '800' },
  itemName:   { flex: 1, fontSize: 13 },
  itemPrice:  { fontSize: 13, fontWeight: '600' },
  itemTotalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 4 },
  itemTotalLabel:{ fontSize: 13 },
  itemTotalValue:{ fontSize: 14, fontWeight: '700' },
  notesCard: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    padding: 12, borderRadius: 12, marginBottom: 10,
  },
  notesText: { flex: 1, fontSize: 12, lineHeight: 17 },
  callRow:   { flexDirection: 'row', gap: 10, marginBottom: 10 },
  callBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderWidth: 1.5, borderRadius: 12, paddingVertical: 12,
  },
  callText: { fontSize: 13, fontWeight: '600' },
  markerRest: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: PRIMARY, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  markerDest: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: SUCCESS, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 16, paddingVertical: 17, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
  },
  actionDisabled: { opacity: 0.6 },
  actionText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  doneBtn:    { alignItems: 'center', paddingVertical: 16 },
  doneBtnText:{ fontSize: 14, fontWeight: '700' },
})
