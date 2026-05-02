'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Notification = {
  id: string
  message: string
  type: 'order' | 'alert' | 'info'
  read: boolean
  createdAt: string
}

type UIState = {
  sidebarCollapsed: boolean
  notifications: Notification[]
  unreadCount: number
  toggleSidebar: () => void
  setSidebarCollapsed: (v: boolean) => void
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void
  markAllRead: () => void
  clearNotifications: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      notifications:   [],
      unreadCount:     0,

      toggleSidebar: () =>
        set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),

      addNotification: (n) => {
        const notification: Notification = {
          ...n,
          id:        crypto.randomUUID(),
          read:      false,
          createdAt: new Date().toISOString(),
        }
        set(s => ({
          notifications: [notification, ...s.notifications].slice(0, 50),
          unreadCount:   s.unreadCount + 1,
        }))
      },

      markAllRead: () =>
        set(s => ({
          notifications: s.notifications.map(n => ({ ...n, read: true })),
          unreadCount:   0,
        })),

      clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
    }),
    {
      name: 'delivery-ui',
      partialize: (s) => ({ sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
)
