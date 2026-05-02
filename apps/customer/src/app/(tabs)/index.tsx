import { useEffect, useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, FlatList,
  ActivityIndicator, Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { useRestaurants, type Restaurant } from '@/hooks/useRestaurants'
import { RestaurantCard } from '@/components/restaurant/RestaurantCard'
import { CartBar } from '@/components/cart/CartBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { haversineKm } from '@/utils/haversine'
import { supabase } from '@/lib/supabase'

const { width } = Dimensions.get('window')

type UserCoords = { lat: number; lng: number } | null

function useSortedRestaurants(restaurants: Restaurant[], coords: UserCoords) {
  if (!coords) return { near: restaurants, popular: restaurants, promo: restaurants, newR: restaurants }

  const withDist = restaurants.map(r => ({
    ...r,
    dist: r.lat && r.lng ? haversineKm(coords.lat, coords.lng, r.lat, r.lng) : 9999,
  }))

  const near    = [...withDist].sort((a, b) => a.dist - b.dist)
  const popular = [...restaurants].sort(() => Math.random() - 0.5)
  const promo   = [...restaurants].filter((_, i) => i % 2 === 0)
  const newR    = [...restaurants].reverse()

  return { near, popular, promo, newR }
}

function HorizontalCarousel({
  title, data, coords,
}: {
  title: string
  data: (Restaurant & { dist?: number })[]
  coords: UserCoords
}) {
  const router = useRouter()
  return (
    <View style={s.carousel}>
      <Text style={s.carouselTitle}>{title}</Text>
      <FlatList
        data={data}
        keyExtractor={r => r.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, gap: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.carouselCard}
            activeOpacity={0.85}
            onPress={() => router.push(`/restaurant/${item.slug}`)}
          >
            <View style={s.carouselLogo}>
              <Ionicons name="restaurant-outline" size={28} color="#f97316" />
            </View>
            <Text style={s.carouselName} numberOfLines={2}>{item.name}</Text>
            {item.dist !== undefined && item.dist < 9999 && (
              <Text style={s.carouselDist}>{item.dist.toFixed(1)} km</Text>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

export default function HomeScreen() {
  const { data: restaurants = [], isLoading } = useRestaurants()
  const [coords, setCoords] = useState<UserCoords>(null)
  const [search, setSearch] = useState('')
  const [userName, setUserName] = useState('')

  useEffect(() => {
    Location.requestForegroundPermissionsAsync().then(({ status }) => {
      if (status === 'granted') {
        Location.getCurrentPositionAsync({}).then(pos => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        })
      }
    })

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) {
        setUserName(user.user_metadata.full_name.split(' ')[0])
      }
    })
  }, [])

  const filtered = search.trim()
    ? restaurants.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.category ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : null

  const { near, popular, promo, newR } = useSortedRestaurants(restaurants, coords)

  return (
    <View style={s.container}>
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>
              {userName ? `¡Hola, ${userName}! 👋` : '¡Bienvenido!'}
            </Text>
            <Text style={s.sub}>¿Qué quieres comer hoy?</Text>
          </View>
          <View style={s.locBadge}>
            <Ionicons name="location" size={14} color="#f97316" />
            <Text style={s.locText}>{coords ? 'Ubicación activa' : 'Sin ubicación'}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={s.searchRow}>
          <Ionicons name="search-outline" size={18} color="#9ca3af" style={s.searchIcon} />
          <TextInput
            style={s.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar restaurantes o categorías..."
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {isLoading && (
          <View style={s.skeletons}>
            {[1, 2, 3].map(i => <Skeleton key={i} style={s.skeletonCard} />)}
          </View>
        )}

        {filtered ? (
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={s.resultsLabel}>{filtered.length} resultados para "{search}"</Text>
            {filtered.map(r => (
              <RestaurantCard
                key={r.id}
                restaurant={r}
                distanceKm={
                  coords && r.lat && r.lng
                    ? haversineKm(coords.lat, coords.lng, r.lat, r.lng)
                    : undefined
                }
              />
            ))}
          </View>
        ) : (
          <>
            <HorizontalCarousel title="📍 Cerca de ti" data={near} coords={coords} />
            <HorizontalCarousel title="🔥 Más pedidos" data={popular} coords={coords} />
            <HorizontalCarousel title="🎁 Promociones" data={promo} coords={coords} />
            <HorizontalCarousel title="✨ Nuevos" data={newR} coords={coords} />

            {/* All restaurants */}
            <View style={s.allSection}>
              <Text style={s.allTitle}>Todos los restaurantes</Text>
              {restaurants.map(r => (
                <RestaurantCard
                  key={r.id}
                  restaurant={r}
                  distanceKm={
                    coords && r.lat && r.lng
                      ? haversineKm(coords.lat, coords.lng, r.lat, r.lng)
                      : undefined
                  }
                />
              ))}
            </View>
          </>
        )}
      </ScrollView>

      <CartBar />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  scroll:    { paddingBottom: 160 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#fff',
  },
  greeting: { fontSize: 20, fontWeight: '800', color: '#111827' },
  sub:      { fontSize: 14, color: '#6b7280', marginTop: 2 },
  locBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff7ed', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
  },
  locText: { fontSize: 11, color: '#f97316', fontWeight: '600' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 14,
    marginHorizontal: 16, marginVertical: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1.5, borderColor: '#f3f4f6',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  searchIcon:  { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: '#111827' },
  skeletons:   { paddingHorizontal: 16, gap: 10 },
  skeletonCard:{ height: 80, borderRadius: 14, marginBottom: 10 },
  resultsLabel:{ fontSize: 13, color: '#6b7280', marginBottom: 10, marginTop: 4 },
  carousel:    { marginTop: 8, marginBottom: 4 },
  carouselTitle: { fontSize: 17, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginBottom: 12 },
  carouselCard: {
    width: 130, backgroundColor: '#fff', borderRadius: 16,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  carouselLogo: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#fff7ed', justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  carouselName: { fontSize: 12, fontWeight: '700', color: '#111827', textAlign: 'center' },
  carouselDist: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  allSection:   { paddingHorizontal: 16, marginTop: 16 },
  allTitle:     { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
})
