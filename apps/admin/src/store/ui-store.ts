import { create } from 'zustand'

interface UIStore {
  sidebarOpen:    boolean
  sidebarCollapsed: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar:  () => void
  toggleCollapse: () => void
  commandOpen:    boolean
  setCommandOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen:    false,
  sidebarCollapsed: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar:  () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
  toggleCollapse: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  commandOpen:    false,
  setCommandOpen: (open) => set({ commandOpen: open }),
}))
