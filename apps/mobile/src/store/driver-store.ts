import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'
import type { Driver } from '@/lib/types'

interface DriverStore {
  driver: Driver | null
  activeOrderId: string | null
  setDriver: (d: Driver | null) => void
  setActiveOrderId: (id: string | null) => void
  clearStore: () => void
}

export const useDriverStore = create<DriverStore>()(
  persist(
    (set) => ({
      driver:        null,
      activeOrderId: null,
      setDriver:       (driver)        => set({ driver }),
      setActiveOrderId:(activeOrderId) => set({ activeOrderId }),
      clearStore:    () => set({ driver: null, activeOrderId: null }),
    }),
    {
      name:    'driver-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ activeOrderId: s.activeOrderId }),
    }
  )
)
