"use client"

import { create } from "zustand"
import { VideoItem } from "@/types"
import {
  WatchlistEntry,
  WatchlistFilterOptions,
  fetchWatchlistApi,
  fetchWatchlistCollectionsApi,
  addToWatchlistApi,
  removeFromWatchlistApi,
} from "@/services/watchlistApi"

interface WatchlistState {
  items: WatchlistEntry[]
  savedVideoIds: string[]
  collections: string[]
  activeCollection: string
  searchQuery: string
  sortBy: "recent" | "alpha" | "duration"
  isLoading: boolean
  hasLoaded: boolean
  setActiveCollection: (collection: string) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: "recent" | "alpha" | "duration") => void
  fetchWatchlist: (options?: WatchlistFilterOptions) => Promise<void>
  fetchCollections: () => Promise<void>
  isInWatchlist: (videoId: string) => boolean
  toggleWatchlist: (video: VideoItem, collectionName?: string) => Promise<boolean>
  addToCollection: (video: VideoItem, collectionName: string) => Promise<boolean>
  removeItem: (videoId: string, collectionName?: string) => Promise<boolean>
}

export const useWatchlistStore = create<WatchlistState>((set, get) => ({
  items: [],
  savedVideoIds: [],
  collections: ["Watch Later", "Favorites"],
  activeCollection: "All",
  searchQuery: "",
  sortBy: "recent",
  isLoading: false,
  hasLoaded: false,

  setActiveCollection: (collection: string) => {
    set({ activeCollection: collection })
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query })
  },

  setSortBy: (sort: "recent" | "alpha" | "duration") => {
    set({ sortBy: sort })
  },

  fetchCollections: async () => {
    if (typeof window === "undefined") return
    const collections = await fetchWatchlistCollectionsApi()
    set({ collections })
  },

  fetchWatchlist: async (options?: WatchlistFilterOptions) => {
    if (typeof window === "undefined") return
    // Prevent duplicate concurrent network requests when many VideoCards mount simultaneously
    if (!options && get().isLoading) return

    set({ isLoading: true })
    try {
      const [items, collections] = await Promise.all([
        fetchWatchlistApi(options),
        fetchWatchlistCollectionsApi(),
      ])
      const savedVideoIds = Array.from(new Set(items.map((entry) => entry.videoId)))
      set({ items, savedVideoIds, collections, isLoading: false, hasLoaded: true })
    } catch {
      set({ isLoading: false, hasLoaded: true })
    }
  },

  isInWatchlist: (videoId: string) => {
    return get().savedVideoIds.includes(videoId)
  },

  toggleWatchlist: async (video: VideoItem, collectionName = "Watch Later"): Promise<boolean> => {
    const isSaved = get().isInWatchlist(video.id)

    if (isSaved) {
      set((state) => ({
        items: state.items.filter((item) => item.videoId !== video.id),
        savedVideoIds: state.savedVideoIds.filter((id) => id !== video.id),
      }))

      const success = await removeFromWatchlistApi(video.id)
      if (!success) {
        await get().fetchWatchlist()
        return true
      }
      return false
    } else {
      return get().addToCollection(video, collectionName)
    }
  },

  addToCollection: async (video: VideoItem, collectionName: string): Promise<boolean> => {
    const cleanCollection = collectionName.trim() || "Watch Later"
    const optimisticEntry: WatchlistEntry = {
      id: `temp-${video.id}-${cleanCollection}`,
      videoId: video.id,
      collectionName: cleanCollection,
      addedAt: new Date().toISOString(),
      video,
    }

    set((state) => {
      const existsInSame = state.items.some(
        (i) => i.videoId === video.id && (i.collectionName || "Watch Later") === cleanCollection
      )
      const nextCollections = state.collections.includes(cleanCollection)
        ? state.collections
        : [...state.collections, cleanCollection]

      return {
        items: existsInSame ? state.items : [optimisticEntry, ...state.items],
        savedVideoIds: state.savedVideoIds.includes(video.id)
          ? state.savedVideoIds
          : [...state.savedVideoIds, video.id],
        collections: nextCollections,
      }
    })

    const result = await addToWatchlistApi(video.id, cleanCollection)
    if (!result) {
      await get().fetchWatchlist()
      return false
    }
    return true
  },

  removeItem: async (videoId: string, collectionName?: string): Promise<boolean> => {
    set((state) => {
      const nextItems = collectionName
        ? state.items.filter(
            (item) => !(item.videoId === videoId && (item.collectionName || "Watch Later") === collectionName)
          )
        : state.items.filter((item) => item.videoId !== videoId)
      const nextSavedIds = Array.from(new Set(nextItems.map((i) => i.videoId)))
      return {
        items: nextItems,
        savedVideoIds: nextSavedIds,
      }
    })

    const success = await removeFromWatchlistApi(videoId, collectionName)
    if (!success) {
      await get().fetchWatchlist()
      return false
    }
    return true
  },
}))
