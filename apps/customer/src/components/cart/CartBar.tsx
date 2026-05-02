import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useCartStore } from '@/store/cart'
import { fmt } from '@/utils/format'

export function CartBar() {
  const router = useRouter()
  const { totalItems, subtotal, restaurantName } = useCartStore()
  const count = totalItems()
  const total = subtotal()

  if (count === 0) return null

  return (
    <TouchableOpacity style={s.bar} onPress={() => router.push('/cart')} activeOpacity={0.9}>
      <View style={s.badge}>
        <Text style={s.badgeText}>{count}</Text>
      </View>
      <Text style={s.rest} numberOfLines={1}>{restaurantName}</Text>
      <View style={s.right}>
        <Text style={s.total}>{fmt(total)}</Text>
        <Ionicons name="chevron-forward" size={16} color="#fff" />
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute', bottom: 90, left: 16, right: 16,
    backgroundColor: '#f97316', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16,
    shadowColor: '#f97316', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
    zIndex: 100,
  },
  badge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', marginRight: 10,
  },
  badgeText: { fontSize: 13, fontWeight: '800', color: '#f97316' },
  rest:  { flex: 1, fontSize: 14, fontWeight: '700', color: '#fff' },
  right: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  total: { fontSize: 14, fontWeight: '700', color: '#fff' },
})
