import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useCartStore } from '@/store/cart'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/components/ui/Toast'
import { haversineKm } from '@/utils/haversine'
import { deliveryFee } from '@/utils/delivery-fee'
import { fmt } from '@/utils/format'

export default function CartScreen() {
  const router = useRouter()
  const { show } = useToast()
  const { items, restaurantName, restaurantId, updateQty, removeItem, clearCart, subtotal } = useCartStore()
  const [address,    setAddress]    = useState('')
  const [notes,      setNotes]      = useState('')
  const [fee,        setFee]        = useState(2.5)
  const [loading,    setLoading]    = useState(false)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [restCoords, setRestCoords] = useState<{ lat: number; lng: number } | null>(null)

  const cartItems = Object.values(items)
  const sub       = subtotal()
  const total     = sub + fee

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('customers').select('id').eq('user_id', user.id).maybeSingle()
      if (data) setCustomerId(data.id)

      if (restaurantId) {
        const { data: r } = await supabase
          .from('restaurants').select('lat, lng').eq('id', restaurantId).single()
        if (r?.lat && r?.lng) setRestCoords({ lat: r.lat, lng: r.lng })
      }

      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({})
        if (restCoords) {
          const km = haversineKm(pos.coords.latitude, pos.coords.longitude, restCoords.lat, restCoords.lng)
          setFee(deliveryFee(km))
        }
      }
    }
    init()
  }, [restaurantId, restCoords?.lat])

  const handleOrder = async () => {
    if (!address.trim()) { show('Ingresa tu dirección de entrega', 'error'); return }
    if (!customerId)     { show('Debes iniciar sesión', 'error'); return }
    if (sub < 1)         { show('Carrito vacío', 'error'); return }

    setLoading(true)

    let delivLat: number | null = null
    let delivLng: number | null = null
    try {
      const result = await Location.geocodeAsync(address.trim())
      if (result.length > 0) { delivLat = result[0].latitude; delivLng = result[0].longitude }
    } catch (_) {}

    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        customer_id:      customerId,
        restaurant_id:    restaurantId,
        status:           'pending',
        delivery_address: address.trim(),
        delivery_lat:     delivLat,
        delivery_lng:     delivLng,
        delivery_fee:     fee,
        subtotal:         sub,
        notes:            notes.trim() || null,
      })
      .select('id')
      .single()

    if (error || !order) { show('Error al crear el pedido', 'error'); setLoading(false); return }

    const orderItems = cartItems.map(i => ({
      order_id:     order.id,
      product_id:   i.product.id,
      product_name: i.product.name,
      quantity:     i.qty,
      unit_price:   i.product.price,
      notes:        i.notes || null,
    }))

    await supabase.from('order_items').insert(orderItems)

    clearCart()
    setLoading(false)
    router.replace(`/order/${order.id}`)
  }

  if (cartItems.length === 0) {
    return (
      <View style={s.empty}>
        <Ionicons name="cart-outline" size={56} color="#e5e7eb" />
        <Text style={s.emptyText}>Tu carrito está vacío</Text>
        <TouchableOpacity style={s.emptyBtn} onPress={() => router.back()}>
          <Text style={s.emptyBtnText}>Seguir explorando</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close" size={22} color="#111827" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Tu pedido</Text>
        <TouchableOpacity onPress={() => Alert.alert('Vaciar carrito', '¿Seguro?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Vaciar', style: 'destructive', onPress: clearCart },
        ])}>
          <Text style={s.clearText}>Vaciar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Restaurant */}
        <View style={s.restRow}>
          <Ionicons name="restaurant-outline" size={16} color="#f97316" />
          <Text style={s.restName}>{restaurantName}</Text>
        </View>

        {/* Items */}
        {cartItems.map(item => (
          <View key={item.product.id} style={s.itemCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.itemName}>{item.product.name}</Text>
              {item.notes ? <Text style={s.itemNotes}>{item.notes}</Text> : null}
              <Text style={s.itemPrice}>{fmt(item.product.price * item.qty)}</Text>
            </View>
            <View style={s.qtyRow}>
              <TouchableOpacity
                style={s.qtyBtn}
                onPress={() => updateQty(item.product.id, item.qty - 1)}
              >
                <Ionicons name="remove" size={16} color="#f97316" />
              </TouchableOpacity>
              <Text style={s.qtyNum}>{item.qty}</Text>
              <TouchableOpacity
                style={s.qtyBtn}
                onPress={() => updateQty(item.product.id, item.qty + 1)}
              >
                <Ionicons name="add" size={16} color="#f97316" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Address */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Dirección de entrega</Text>
          <TextInput
            style={s.addressInput}
            value={address}
            onChangeText={setAddress}
            placeholder="Calle, número, colonia..."
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>

        {/* Notes */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Notas del pedido (opcional)</Text>
          <TextInput
            style={s.addressInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Instrucciones especiales para el repartidor..."
            placeholderTextColor="#9ca3af"
            multiline
          />
        </View>

        {/* Summary */}
        <View style={s.summary}>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Subtotal</Text>
            <Text style={s.summaryValue}>{fmt(sub)}</Text>
          </View>
          <View style={s.summaryRow}>
            <Text style={s.summaryLabel}>Costo de envío</Text>
            <Text style={s.summaryValue}>{fmt(fee)}</Text>
          </View>
          <View style={[s.summaryRow, s.totalRow]}>
            <Text style={s.totalLabel}>Total</Text>
            <Text style={s.totalValue}>{fmt(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Place order */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.orderBtn, loading && s.orderBtnDisabled]}
          onPress={handleOrder}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.orderBtnText}>Hacer pedido · {fmt(total)}</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyText: { fontSize: 16, color: '#9ca3af', fontWeight: '600' },
  emptyBtn: { marginTop: 8, backgroundColor: '#f97316', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  closeBtn:    { padding: 4 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#111827' },
  clearText:   { fontSize: 13, color: '#ef4444', fontWeight: '600' },
  scroll:    { padding: 16, paddingBottom: 120 },
  restRow:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  restName:  { fontSize: 14, fontWeight: '700', color: '#374151' },
  itemCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  itemName:  { fontSize: 14, fontWeight: '700', color: '#111827' },
  itemNotes: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '800', color: '#f97316', marginTop: 4 },
  qtyRow:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16,
    borderWidth: 1.5, borderColor: '#f97316',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyNum: { fontSize: 16, fontWeight: '700', color: '#111827', minWidth: 22, textAlign: 'center' },
  section:      { marginTop: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  addressInput: {
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5,
    borderColor: '#e5e7eb', paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: '#111827', minHeight: 60, textAlignVertical: 'top',
  },
  summary: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2, gap: 10,
  },
  summaryRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  summaryLabel:{ fontSize: 13, color: '#6b7280' },
  summaryValue:{ fontSize: 13, fontWeight: '600', color: '#374151' },
  totalRow:    { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  totalLabel:  { fontSize: 15, fontWeight: '700', color: '#111827' },
  totalValue:  { fontSize: 18, fontWeight: '800', color: '#f97316' },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff', padding: 16, paddingBottom: 32,
    borderTopWidth: 1, borderTopColor: '#f3f4f6',
  },
  orderBtn: {
    backgroundColor: '#f97316', borderRadius: 16, paddingVertical: 18, alignItems: 'center',
    shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  orderBtnDisabled: { opacity: 0.6 },
  orderBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
})
