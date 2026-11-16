import { create } from "zustand"
import { HistoryItemDTO, WatchProgressDTO, PaginatedHistoryResult } from "@/types"
import { progressApi } from "@/services/progressApi"

interface ProgressStoreState {
  continueWatching: HistoryItemDTO[]
  completedVideos: HistoryItemDTO[]
  historyItems: HistoryItemDTO[]
  historyPagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  activeProgressMap: Record<string, WatchProgressDTO>
  isLoadingContinue: boolean
  isLoadingHistory: boolean
  error: string | null
}

interface ProgressStoreActions {
  fetchContinueWatching: (limit?: number) => Promise<void>
  fetchCompletedVideos: (limit?: number) => Promise<void>
  fetchHistory: (options?: {
    page?: number
    limit?: number
    status?: "all" | "completed" | "unfinished"
    search?: string
  }) => Promise<void>
  deleteHistoryItem: (videoId: string) => Promise<boolean>
  clearAllHistory: () => Promise<boolean>
  removeFromContinueWatching: (videoId: string) => Promise<boolean>
  updateLocalProgress: (videoId: string, progress: WatchProgressDTO) => void
  fetchVideoProgress: (videoId: string) => Promise<WatchProgressDTO | null>
}

export const useProgressStore = create<ProgressStoreState & ProgressStoreActions>(
  (set, get) => ({
    continueWatching: [],
    completedVideos: [],
    historyItems: [],
    historyPagination: {
      total: 0,
      page: 1,
      limit: 12,
      totalPages: 1,
    },
    activeProgressMap: {},
    isLoadingContinue: false,
    isLoadingHistory: false,
    error: null,

    fetchContinueWatching: async (limit = 10) => {
      set({ isLoadingContinue: true, error: null })
      try {
        const items = await progressApi.getContinueWatching(limit)
        set({ continueWatching: items, isLoadingContinue: false })
      } catch (err: any) {
        set({ isLoadingContinue: false, error: err.message || "Failed to load continue watching" })
      }
    },

    fetchCompletedVideos: async (limit = 10) => {
      try {
        const items = await progressApi.getCompletedVideos(limit)
        set({ completedVideos: items })
      } catch (err: any) {
        console.warn("Could not fetch completed videos", err)
      }
    },

    fetchHistory: async (options = {}) => {
      set({ isLoadingHistory: true, error: null })
      try {
        const res = await progressApi.getHistory(options)
        set({
          historyItems: res.items,
          historyPagination: res.pagination,
          isLoadingHistory: false,
        })
      } catch (err: any) {
        set({ isLoadingHistory: false, error: err.message || "Failed to load watch history" })
      }
    },

    deleteHistoryItem: async (videoId: string) => {
      try {
        await progressApi.deleteHistoryItem(videoId)
        // Optimistically update lists
        set((state) => ({
          historyItems: state.historyItems.filter((i) => i.progress.videoId !== videoId),
          continueWatching: state.continueWatching.filter((i) => i.progress.videoId !== videoId),
          completedVideos: state.completedVideos.filter((i) => i.progress.videoId !== videoId),
          historyPagination: {
            ...state.historyPagination,
            total: Math.max(0, state.historyPagination.total - 1),
          },
        }))
        return true
      } catch (err: any) {
        set({ error: err.message || "Failed to delete history item" })
        return false
      }
    },

    clearAllHistory: async () => {
      try {
        await progressApi.clearAllHistory()
        set({
          historyItems: [],
          continueWatching: [],
          completedVideos: [],
          activeProgressMap: {},
          historyPagination: { total: 0, page: 1, limit: 12, totalPages: 1 },
        })
        return true
      } catch (err: any) {
        set({ error: err.message || "Failed to clear history" })
        return false
      }
    },

    removeFromContinueWatching: async (videoId: string) => {
      return get().deleteHistoryItem(videoId)
    },

    updateLocalProgress: (videoId: string, progress: WatchProgressDTO) => {
      set((state) => ({
        activeProgressMap: {
          ...state.activeProgressMap,
          [videoId]: progress,
        },
      }))
    },

    fetchVideoProgress: async (videoId: string) => {
      try {
        const progress = await progressApi.getProgress(videoId)
        if (progress) {
          get().updateLocalProgress(videoId, progress)
        }
        return progress
      } catch {
        return null
      }
    },
  })
)

