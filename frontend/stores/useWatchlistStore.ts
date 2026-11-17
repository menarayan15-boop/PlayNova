"use client"

import { create } from "zustand"
import { VideoItem } from "@/types"
import {
  WatchlistEntry,
  fetchWatchlistApi,
  addToWatchlistApi,
  removeFromWatchlistApi,
} from "@/services/watchlistApi"

interface WatchlistState {
  items: WatchlistEntry[]
  savedVideoIds: string[]
  isLoading: boolean
  hasLoaded: boolean
  fetchWatchlist: () => Promise<void>
  isInWatchlist: (videoId: string) => boolean
  toggleWatchlist: (video: VideoItem) => Promise<boolean>
  removeItem: (videoId: string) => Promise<boolean>
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: [],
  savedVideoIds: [],
  isLoading: false,
  hasLoaded: false,

  fetchWatchlist: async () => {
    if (typeof window === "undefined") return
    const token = localStorage.getItem("playnova_token") || localStorage.getItem("token")
    if (!token) {
      set({ items: [], savedVideoIds: [], hasLoaded: true })
      return
    }

    set({ isLoading: true })
    try {
      const items = await fetchWatchlistApi()
      const savedVideoIds = items.map((entry) => entry.videoId)
      set({ items, savedVideoIds, isLoading: false, hasLoaded: true })
    } catch (err) {
      set({ isLoading: false, hasLoaded: true })
    }
  },

  isInWatchlist: (videoId: string) => {
    return get().savedVideoIds.includes(videoId)
  },

  toggleWatchlist: async (video: VideoItem): Promise<boolean> => {
    const isSaved = get().isInWatchlist(video.id)

    if (isSaved) {
      // Optimistic removal
      set((state) => ({
        items: state.items.filter((item) => item.videoId !== video.id),
        savedVideoIds: state.savedVideoIds.filter((id) => id !== video.id),
      }))

      const success = await removeFromWatchlistApi(video.id)
      if (!success) {
        // Rollback on failure
        await get().fetchWatchlist()
        return true
      }
      return false
    } else {
      // Optimistic addition
      const optimisticEntry: WatchlistEntry = {
        id: `temp-${video.id}`,
        videoId: video.id,
        addedAt: new Date().toISOString(),
        video,
      }

      set((state) => ({
        items: [optimisticEntry, ...state.items],
        savedVideoIds: [...state.savedVideoIds, video.id],
      }))

      const result = await addToWatchlistApi(video.id)
      if (!result) {
        // Rollback on failure
        set((state) => ({
          items: state.items.filter((item) => item.videoId !== video.id),
          savedVideoIds: state.savedVideoIds.filter((id) => id !== video.id),
        }))
        return false
      }
      return true
    }
  },

  removeItem: async (videoId: string): Promise<boolean> => {
    set((state) => ({
      items: state.items.filter((item) => item.videoId !== videoId),
      savedVideoIds: state.savedVideoIds.filter((id) => id !== videoId),
    }))

    const success = await removeFromWatchlistApi(videoId)
    if (!success) {
      await get().fetchWatchlist()
      return false
    }
    return true
  },
}))
