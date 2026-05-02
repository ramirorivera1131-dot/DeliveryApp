'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { Category, Product } from '@/lib/types'

export function useCategories(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['categories', restaurantId],
    queryFn:  async () => {
      if (!restaurantId) return []
      const supabase = createClient()
      const { data } = await supabase
        .from('categories')
        .select('id, name, description, sort_order, is_active')
        .eq('restaurant_id', restaurantId)
        .order('sort_order')
      return (data ?? []) as Category[]
    },
    enabled: !!restaurantId,
  })
}

export function useProducts(restaurantId: string | undefined) {
  return useQuery({
    queryKey: ['products', restaurantId],
    queryFn:  async () => {
      if (!restaurantId) return []
      const supabase = createClient()
      const { data } = await supabase
        .from('products')
        .select('id, name, description, price, image_url, is_available, sort_order, category_id')
        .eq('restaurant_id', restaurantId)
        .order('sort_order')
      return (data ?? []) as Product[]
    },
    enabled: !!restaurantId,
  })
}

export function useUpsertProduct(restaurantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (product: Partial<Product> & { id?: string }) => {
      const supabase = createClient()
      if (product.id) {
        const { id, ...rest } = product
        const { error } = await supabase.from('products').update(rest).eq('id', id!)
        if (error) throw error
      } else {
        const { error } = await supabase.from('products').insert({ ...product, restaurant_id: restaurantId })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', restaurantId] }),
  })
}

export function useDeleteProduct(restaurantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (productId: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('products').delete().eq('id', productId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products', restaurantId] }),
  })
}

export function useToggleProductAvailability(restaurantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ productId, isAvailable }: { productId: string; isAvailable: boolean }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('products')
        .update({ is_available: isAvailable })
        .eq('id', productId)
      if (error) throw error
    },
    onMutate: async ({ productId, isAvailable }) => {
      await qc.cancelQueries({ queryKey: ['products', restaurantId] })
      const prev = qc.getQueryData<Product[]>(['products', restaurantId])
      qc.setQueryData<Product[]>(['products', restaurantId], (old) =>
        old?.map(p => p.id === productId ? { ...p, is_available: isAvailable } : p) ?? []
      )
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) qc.setQueryData(['products', restaurantId], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['products', restaurantId] }),
  })
}

export function useUpsertCategory(restaurantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (cat: Partial<Category> & { id?: string }) => {
      const supabase = createClient()
      if (cat.id) {
        const { id, ...rest } = cat
        const { error } = await supabase.from('categories').update(rest).eq('id', id!)
        if (error) throw error
      } else {
        const { data: existing } = await supabase
          .from('categories')
          .select('sort_order')
          .eq('restaurant_id', restaurantId)
          .order('sort_order', { ascending: false })
          .limit(1)
          .maybeSingle()
        const { error } = await supabase.from('categories').insert({
          ...cat,
          restaurant_id: restaurantId,
          sort_order: ((existing?.sort_order ?? 0) + 1),
        })
        if (error) throw error
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', restaurantId] }),
  })
}

export function useDeleteCategory(restaurantId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (categoryId: string) => {
      const supabase = createClient()
      const { error } = await supabase.from('categories').delete().eq('id', categoryId)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories', restaurantId] }),
  })
}
