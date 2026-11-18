"use client"

import { create } from "zustand"
import {
  NotificationItem,
  fetchNotificationsApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  dismissNotificationApi,
} from "@/services/notificationApi"

interface NotificationState {
  items: NotificationItem[]
  unreadCount: number
  isLoading: boolean
  hasFetched: boolean
  fetchNotifications: () => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  dismiss: (id: string) => Promise<void>
  clearLocal: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  items: [],
  unreadCount: 0,
  isLoading: false,
  hasFetched: false,

  fetchNotifications: async () => {
    set({ isLoading: true })
    try {
      const data = await fetchNotificationsApi()
      set({
        items: data.items,
        unreadCount: data.unreadCount,
        isLoading: false,
        hasFetched: true,
      })
    } catch {
      set({ isLoading: false, hasFetched: true })
    }
  },

  markAsRead: async (id: string) => {
    const prev = get().items
    const target = prev.find((n) => n.id === id)
    if (!target || target.read) return

    // Optimistic update
    const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    const unreadCount = updated.filter((n) => !n.read).length
    set({ items: updated, unreadCount })

    await markNotificationAsReadApi(id)
  },

  markAllAsRead: async () => {
    const prev = get().items
    const updated = prev.map((n) => ({ ...n, read: true }))
    set({ items: updated, unreadCount: 0 })

    await markAllNotificationsAsReadApi()
  },

  dismiss: async (id: string) => {
    const prev = get().items
    const updated = prev.filter((n) => n.id !== id)
    const unreadCount = updated.filter((n) => !n.read).length
    set({ items: updated, unreadCount })

    await dismissNotificationApi(id)
  },

  clearLocal: () => {
    set({ items: [], unreadCount: 0, hasFetched: false })
  },
}))

