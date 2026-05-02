import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type CartProduct = {
  id: string
  name: string
  price: number
  image_url: string | null
}

export type CartItem = {
  product: CartProduct
  qty: number
  notes: string
}

type CartState = {
  restaurantId: string | null
  restaurantName: string
  items: Record<string, CartItem>
  addItem: (restaurantId: string, restaurantName: string, product: CartProduct, notes?: string) => void
  removeItem: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
  totalItems: () => number
  subtotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: '',
      items: {},

      addItem: (restaurantId, restaurantName, product, notes = '') => {
        const { restaurantId: currentId, items } = get()
        const newItems =
          currentId && currentId !== restaurantId ? {} : { ...items }
        const existing = newItems[product.id]
        newItems[product.id] = {
          product,
          qty: (existing?.qty ?? 0) + 1,
          notes: existing?.notes ?? notes,
        }
        set({ restaurantId, restaurantName, items: newItems })
      },

      removeItem: (productId) => {
        const items = { ...get().items }
        delete items[productId]
        const restaurantId = Object.keys(items).length === 0 ? null : get().restaurantId
        set({ items, restaurantId: restaurantId ?? null })
      },

      updateQty: (productId, qty) => {
        if (qty <= 0) { get().removeItem(productId); return }
        set(s => ({
          items: { ...s.items, [productId]: { ...s.items[productId], qty } },
        }))
      },

      clearCart: () => set({ restaurantId: null, restaurantName: '', items: {} }),

      totalItems: () => Object.values(get().items).reduce((s, i) => s + i.qty, 0),

      subtotal: () =>
        Object.values(get().items).reduce(
          (s, i) => s + i.product.price * i.qty, 0
        ),
    }),
    {
      name: 'customer-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ restaurantId: s.restaurantId, restaurantName: s.restaurantName, items: s.items }),
    }
  )
)
