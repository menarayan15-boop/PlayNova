import {
  WatchProgressDTO,
  HistoryItemDTO,
  PaginatedHistoryResult,
  ProgressUpdatePayload,
} from "@/types"
import { OfflineProgressQueue } from "@/utils/offlineQueue"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = new Headers(options.headers || {})

  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include",
  })

  let json: any = null
  try {
    json = await response.json()
  } catch {
    json = { status: "error", message: "Invalid server response" }
  }

  if (!response.ok) {
    const errorMsg = json?.message || `Request failed with status ${response.status}`
    throw new Error(errorMsg)
  }

  return json
}

export const progressApi = {
  /**
   * Save or update progress for a video, with offline queue fallback
   */
  async saveProgress(
    videoId: string,
    payload: ProgressUpdatePayload,
    userId?: string
  ): Promise<WatchProgressDTO | null> {
    try {
      const res = await apiFetch<{ status: string; data: { progress: WatchProgressDTO | null } }>(
        `/api/v1/progress/${videoId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      )
      return res.data?.progress || null
    } catch (err) {
      // If network fails and user is known, save to IndexedDB offline queue
      if (userId && typeof window !== "undefined") {
        console.warn("Progress update failed online, enqueuing for offline sync:", err)
        await OfflineProgressQueue.enqueue(userId, videoId, payload)
      }
      return null
    }
  },

  /**
   * Save progress immediately on beacon (e.g. pagehide / visibilitychange)
   */
  sendBeaconProgress(videoId: string, payload: ProgressUpdatePayload): boolean {
    if (typeof window === "undefined" || !navigator.sendBeacon) return false
    try {
      const url = `${API_BASE_URL}/api/v1/progress/${videoId}`
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" })
      return navigator.sendBeacon(url, blob)
    } catch {
      return false
    }
  },

  /**
   * Get progress for a specific video
   */
  async getProgress(videoId: string): Promise<WatchProgressDTO | null> {
    try {
      const res = await apiFetch<{ status: string; data: { progress: WatchProgressDTO | null } }>(
        `/api/v1/progress/${videoId}`
      )
      return res.data?.progress || null
    } catch {
      return null
    }
  },

  /**
   * Get continue watching list
   */
  async getContinueWatching(limit = 10): Promise<HistoryItemDTO[]> {
    try {
      const res = await apiFetch<{ status: string; data: { items: HistoryItemDTO[] } }>(
        `/api/v1/videos/continue-watching?limit=${limit}`
      )
      return res.data?.items || []
    } catch {
      return []
    }
  },

  /**
   * Get completed videos for "Watch Again"
   */
  async getCompletedVideos(limit = 10): Promise<HistoryItemDTO[]> {
    try {
      const res = await apiFetch<{ status: string; data: { items: HistoryItemDTO[] } }>(
        `/api/v1/videos/completed?limit=${limit}`
      )
      return res.data?.items || []
    } catch {
      return []
    }
  },

  /**
   * Get paginated watch history
   */
  async getHistory(options: {
    page?: number
    limit?: number
    status?: "all" | "completed" | "unfinished"
    search?: string
  } = {}): Promise<PaginatedHistoryResult> {
    const params = new URLSearchParams()
    if (options.page) params.set("page", String(options.page))
    if (options.limit) params.set("limit", String(options.limit))
    if (options.status) params.set("status", options.status)
    if (options.search) params.set("search", options.search)

    const res = await apiFetch<{
      status: string
      data: PaginatedHistoryResult
    }>(`/api/v1/history?${params.toString()}`)

    return res.data
  },

  /**
   * Delete a single video from watch history
   */
  async deleteHistoryItem(videoId: string): Promise<boolean> {
    const res = await apiFetch<{ status: string; message: string; data: { deleted: boolean } }>(
      `/api/v1/history/${videoId}`,
      { method: "DELETE" }
    )
    return Boolean(res.data?.deleted)
  },

  /**
   * Clear entire watch history
   */
  async clearAllHistory(): Promise<number> {
    const res = await apiFetch<{ status: string; message: string; data: { deletedCount: number } }>(
      `/api/v1/history`,
      { method: "DELETE" }
    )
    return res.data?.deletedCount || 0
  },

  /**
   * Sync offline queued items back to backend
   */
  async syncOfflineQueue(userId: string): Promise<number> {
    if (typeof window === "undefined") return 0
    const queue = await OfflineProgressQueue.getQueueForUser(userId)
    if (queue.length === 0) return 0

    let syncedCount = 0
    for (const item of queue) {
      try {
        await apiFetch(`/api/v1/progress/${item.videoId}`, {
          method: "PUT",
          body: JSON.stringify(item.payload),
        })
        await OfflineProgressQueue.remove(item.id)
        syncedCount++
      } catch (err) {
        console.warn("Failed to sync queued progress item, will retry next time", err)
        break // Stop on connection failure so we don't spam
      }
    }
    return syncedCount
  },
}

