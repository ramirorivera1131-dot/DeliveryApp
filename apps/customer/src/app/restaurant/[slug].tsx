import { useRef, useState } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, Modal, TextInput, ActivityIndicator, Alert,
  SectionList, Animated,
} from 'react-native'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useRestaurant, type Product } from '@/hooks/useRestaurant'
import { CartBar } from '@/components/cart/CartBar'
import { Skeleton } from '@/components/ui/Skeleton'
import { useCartStore } from '@/store/cart'
import { useToast } from '@/components/ui/Toast'
import { fmt } from '@/utils/format'

function ProductModal({
  product,
  restaurantId,
  restaurantName,
  onClose,
}: {
  product: Product
  restaurantId: string
  restaurantName: string
  onClose: () => void
}) {
  const { addItem, items } = useCartStore()
  const { show } = useToast()
  const [qty,   setQty]   = useState(Math.max(items[product.id]?.qty ?? 0, 1))
  const [notes, setNotes] = useState(items[product.id]?.notes ?? '')
  const { restaurantId: cartRestId } = useCartStore()

  const handleAdd = () => {
    if (cartRestId && cartRestId !== restaurantId) {
      Alert.alert(
        'Vaciar carrito',
        'Tienes productos de otro restaurante. ¿Deseas vaciarlo y agregar este?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Vaciar y agregar',
            onPress: () => {
              useCartStore.getState().clearCart()
              for (let i = 0; i < qty; i++) {
                addItem(restaurantId, restaurantName, { id: product.id, name: product.name, price: product.price, image_url: product.image_url }, notes)
              }
              show('Agregado al carrito', 'success')
              onClose()
            },
          },
        ]
      )
      return
    }
    for (let i = 0; i < qty; i++) {
      addItem(restaurantId, restaurantName, { id: product.id, name: product.name, price: product.price, image_url: product.image_url }, notes)
    }
    show('Agregado al carrito', 'success')
    onClose()
  }

  return (
    <View style={ms.overlay}>
      <TouchableOpacity style={ms.backdrop} onPress={onClose} />
      <View style={ms.sheet}>
        {product.image_url && (
          <Image source={product.image_url} style={ms.image} contentFit="cover" />
        )}
        <View style={ms.content}>
          <Text style={ms.name}>{product.name}</Text>
          {product.description && <Text style={ms.desc}>{product.description}</Text>}
          <Text style={ms.price}>{fmt(product.price)}</Text>

          <Text style={ms.notesLabel}>Notas especiales (opcional)</Text>
          <TextInput
            style={ms.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Sin cebolla, extra salsa..."
            placeholderTextColor="#9ca3af"
            multiline
          />

          <View style={ms.qtyRow}>
            <TouchableOpacity style={ms.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
              <Ionicons name="remove" size={20} color="#f97316" />
            </TouchableOpacity>
            <Text style={ms.qtyNum}>{qty}</Text>
            <TouchableOpacity style={ms.qtyBtn} onPress={() => setQty(q => q + 1)}>
              <Ionicons name="add" size={20} color="#f97316" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={ms.addBtn} onPress={handleAdd} activeOpacity={0.85}>
            <Text style={ms.addBtnText}>Agregar {qty > 1 ? `(${qty})` : ''} — {fmt(product.price * qty)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

export default function RestaurantScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>()
  const router   = useRouter()
  const { data: restaurant, isLoading } = useRestaurant(slug)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [activeCategory, setActiveCategory] = useState('')
  const categoryRef = useRef<ScrollView>(null)
  const listRef     = useRef<SectionList>(null)

  if (isLoading) {
    return (
      <View style={s.container}>
        <View style={s.headerSkeleton}>
          <Skeleton style={{ width: 60, height: 60, borderRadius: 30, marginBottom: 12 }} />
          <Skeleton style={{ width: 160, height: 20, marginBottom: 8 }} />
          <Skeleton style={{ width: 100, height: 14 }} />
        </View>
        <View style={{ padding: 16, gap: 12 }}>
          {[1, 2, 3].map(i => <Skeleton key={i} style={{ height: 72, borderRadius: 14 }} />)}
        </View>
      </View>
    )
  }

  if (!restaurant) {
    return (
      <View style={s.center}>
        <Text style={s.notFound}>Restaurante no encontrado</Text>
      </View>
    )
  }

  const sections = restaurant.menu.map(cat => ({ title: cat.name, data: cat.products }))
  const categories = restaurant.menu.map(c => c.name)

  const handleCategoryPress = (cat: string, idx: number) => {
    setActiveCategory(cat)
    listRef.current?.scrollToLocation({ sectionIndex: idx, itemIndex: 0, animated: true })
  }

  return (
    <View style={s.container}>
      <SectionList
        ref={listRef}
        sections={sections}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 160 }}
        ListHeaderComponent={
          <>
            {/* Restaurant hero */}
            <View style={s.hero}>
              <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                <Ionicons name="arrow-back" size={20} color="#111827" />
              </TouchableOpacity>
              <View style={s.heroContent}>
                <Image
                  source={restaurant.logo_url ?? 'https://placehold.co/80x80/f97316/fff?text=🍴'}
                  style={s.logo}
                  contentFit="cover"
                />
                <Text style={s.restName}>{restaurant.name}</Text>
                {restaurant.category && <Text style={s.restCat}>{restaurant.category}</Text>}
                <View style={s.metaRow}>
                  <Ionicons name="location-outline" size={13} color="#9ca3af" />
                  <Text style={s.metaText} numberOfLines={1}>{restaurant.address}</Text>
                </View>
                <Text style={s.minOrder}>Pedido mínimo: {fmt(restaurant.min_order_amount)}</Text>
              </View>
            </View>

            {/* Category sticky tabs */}
            <ScrollView
              ref={categoryRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.catScroll}
              contentContainerStyle={s.catContent}
            >
              {categories.map((cat, idx) => (
                <TouchableOpacity
                  key={cat}
                  style={[s.catTab, activeCategory === cat && s.catTabActive]}
                  onPress={() => handleCategoryPress(cat, idx)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.catText, activeCategory === cat && s.catTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text style={s.sectionTitle}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={s.productCard}
            activeOpacity={0.85}
            onPress={() => setSelectedProduct(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={s.productName}>{item.name}</Text>
              {item.description && (
                <Text style={s.productDesc} numberOfLines={2}>{item.description}</Text>
              )}
              <Text style={s.productPrice}>{fmt(item.price)}</Text>
            </View>
            {item.image_url ? (
              <Image source={item.image_url} style={s.productImg} contentFit="cover" />
            ) : (
              <View style={s.productImgPlaceholder}>
                <Ionicons name="image-outline" size={22} color="#d1d5db" />
              </View>
            )}
            <TouchableOpacity
              style={s.addMinibtn}
              onPress={() => setSelectedProduct(item)}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <CartBar />

      {selectedProduct && (
        <Modal transparent animationType="slide" onRequestClose={() => setSelectedProduct(null)}>
          <ProductModal
            product={selectedProduct}
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            onClose={() => setSelectedProduct(null)}
          />
        </Modal>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center:    { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound:  { fontSize: 14, color: '#6b7280' },
  hero: {
    backgroundColor: '#fff',
    paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  headerSkeleton: { backgroundColor: '#fff', alignItems: 'center', paddingTop: 60, paddingBottom: 20 },
  backBtn: {
    position: 'absolute', top: 52, left: 16, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 4,
  },
  heroContent: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  logo:    { width: 72, height: 72, borderRadius: 18, marginBottom: 10, backgroundColor: '#f3f4f6' },
  restName:{ fontSize: 20, fontWeight: '800', color: '#111827', textAlign: 'center' },
  restCat: { fontSize: 13, color: '#f97316', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  metaText:{ fontSize: 12, color: '#9ca3af', flex: 1, textAlign: 'center' },
  minOrder:{ fontSize: 12, color: '#6b7280', marginTop: 6, fontWeight: '600' },
  catScroll: { backgroundColor: '#fff' },
  catContent:{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  catTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  catTabActive: { backgroundColor: '#f97316' },
  catText:       { fontSize: 13, color: '#6b7280', fontWeight: '600' },
  catTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 8 },
  productCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 8,
    borderRadius: 14, padding: 14, gap: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  productName:  { fontSize: 14, fontWeight: '700', color: '#111827' },
  productDesc:  { fontSize: 12, color: '#6b7280', marginTop: 3, lineHeight: 18 },
  productPrice: { fontSize: 14, fontWeight: '800', color: '#f97316', marginTop: 6 },
  productImg:   { width: 72, height: 72, borderRadius: 10, backgroundColor: '#f3f4f6' },
  productImgPlaceholder: {
    width: 72, height: 72, borderRadius: 10, backgroundColor: '#f9fafb',
    justifyContent: 'center', alignItems: 'center',
  },
  addMinibtn: {
    position: 'absolute', bottom: 12, right: 12,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#f97316', justifyContent: 'center', alignItems: 'center',
  },
})

const ms = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15, shadowRadius: 16, elevation: 20,
  },
  image:   { width: '100%', height: 200 },
  content: { padding: 20 },
  name:    { fontSize: 20, fontWeight: '800', color: '#111827', marginBottom: 6 },
  desc:    { fontSize: 14, color: '#6b7280', lineHeight: 20, marginBottom: 10 },
  price:   { fontSize: 22, fontWeight: '800', color: '#f97316', marginBottom: 16 },
  notesLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6 },
  notesInput: {
    borderWidth: 1.5, borderColor: '#e5e7eb', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#111827',
    minHeight: 60, textAlignVertical: 'top', marginBottom: 16,
  },
  qtyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 16 },
  qtyBtn: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1.5, borderColor: '#f97316',
    justifyContent: 'center', alignItems: 'center',
  },
  qtyNum: { fontSize: 20, fontWeight: '800', color: '#111827', minWidth: 32, textAlign: 'center' },
  addBtn: {
    backgroundColor: '#f97316', borderRadius: 14, paddingVertical: 16, alignItems: 'center',
    shadowColor: '#f97316', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 4,
  },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
