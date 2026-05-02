import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Driver, DriverStatus } from '@/lib/types'

const DRIVER_SELECT = 'id, user_id, full_name, phone, vehicle_type, vehicle_brand, vehicle_model, vehicle_color, vehicle_plate, avatar_url, status, earnings_rate, rating_average, total_deliveries, is_documents_verified'

export function useDriver() {
  return useQuery({
    queryKey: ['driver'],
    queryFn:  async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      const { data } = await supabase
        .from('drivers')
        .select(DRIVER_SELECT)
        .eq('user_id', user.id)
        .maybeSingle()
      return data as Driver | null
    },
    staleTime: 1000 * 60 * 5,
  })
}

export function useUpdateDriverStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ driverId, status }: { driverId: string; status: DriverStatus }) => {
      const { error } = await supabase.from('drivers').update({ status }).eq('id', driverId)
      if (error) throw error
    },
    onMutate: async ({ status }) => {
      const prev = qc.getQueryData<Driver | null>(['driver'])
      qc.setQueryData<Driver | null>(['driver'], d => d ? { ...d, status } : null)
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(['driver'], ctx.prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['driver'] }),
  })
}

export function useUpdateDriverProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<Driver> & { id: string }) => {
      const { error } = await supabase.from('drivers').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver'] }),
  })
}
