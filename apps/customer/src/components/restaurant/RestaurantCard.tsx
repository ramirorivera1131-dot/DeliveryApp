import { Image } from 'expo-image'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter } from 'expo-router'
import type { Restaurant } from '@/hooks/useRestaurants'
import { fmt } from '@/utils/format'

type Props = { restaurant: Restaurant; distanceKm?: number }

export function RestaurantCard({ restaurant, distanceKm }: Props) {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={s.card}
      activeOpacity={0.85}
      onPress={() => router.push(`/restaurant/${restaurant.slug}`)}
    >
      <Image
        source={restaurant.logo_url ?? 'https://placehold.co/120x120/f97316/fff?text=🍴'}
        style={s.logo}
        contentFit="cover"
      />
      <View style={s.info}>
        <Text style={s.name} numberOfLines={1}>{restaurant.name}</Text>
        {restaurant.category && (
          <Text style={s.cat}>{restaurant.category}</Text>
        )}
        <View style={s.meta}>
          {distanceKm !== undefined && (
            <Text style={s.metaText}>{distanceKm.toFixed(1)} km</Text>
          )}
          <Text style={s.metaText}>Min. {fmt(restaurant.min_order_amount)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    padding: 12, marginBottom: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  logo:  { width: 56, height: 56, borderRadius: 12, backgroundColor: '#f3f4f6' },
  info:  { flex: 1, marginLeft: 12 },
  name:  { fontSize: 15, fontWeight: '700', color: '#111827' },
  cat:   { fontSize: 12, color: '#f97316', marginTop: 2 },
  meta:  { flexDirection: 'row', gap: 10, marginTop: 4 },
  metaText: { fontSize: 11, color: '#9ca3af' },
})
