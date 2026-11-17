import {
  WatchProgress,
  IWatchProgress,
  WatchProgressDTO,
  mergeIntervals,
  calculateUniqueCoverageSeconds,
} from "../models/WatchProgress.js"
import { UserService } from "./userService.js"
import { VideoService, VideoDTO } from "./videoService.js"
import { isDatabaseConnected } from "../config/db.js"

export interface HistoryItemDTO {
  progress: WatchProgressDTO
  video: VideoDTO | null
}

export interface PaginatedHistoryResult {
  items: HistoryItemDTO[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ProgressUpdateInput {
  lastPositionSeconds: number
  durationSeconds: number
  interval?: [number, number]
  clientVersion?: number
}

// In-Memory store for when MONGODB_URI is not provided
const memoryProgress: Map<string, IWatchProgress> = new Map()

function getMemoryKey(userId: string, videoId: string): string {
  return `${userId}:${videoId}`
}

function toWatchProgressDTO(p: any): WatchProgressDTO {
  return {
    id: p._id ? p._id.toString() : p.id || `${p.userId}:${p.videoId}`,
    userId: p.userId,
    videoId: p.videoId,
    lastPositionSeconds: p.lastPositionSeconds,
    durationSeconds: p.durationSeconds,
    furthestPositionSeconds: p.furthestPositionSeconds || 0,
    watchedIntervals: p.watchedIntervals || [],
    completionPercentage: p.completionPercentage || 0,
    watchedPercentage: p.completionPercentage || 0,
    isCompleted: Boolean(p.isCompleted),
    completed: Boolean(p.isCompleted),
    firstWatchedAt: p.firstWatchedAt instanceof Date ? p.firstWatchedAt.toISOString() : p.firstWatchedAt,
    lastWatchedAt: p.lastWatchedAt instanceof Date ? p.lastWatchedAt.toISOString() : p.lastWatchedAt,
    completedAt: p.completedAt instanceof Date ? p.completedAt.toISOString() : p.completedAt ? String(p.completedAt) : null,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt ? String(p.updatedAt) : new Date().toISOString(),
    version: p.version || 1,
  }
}

export class ProgressService {
  /**
   * Upsert watch progress with interval coverage and completion calculation
   */
  static async upsertProgress(
    userId: string,
    videoId: string,
    input: ProgressUpdateInput
  ): Promise<WatchProgressDTO | null> {
    // 1. Check user privacy preferences
    const user = await UserService.getUserById(userId)
    if (user && user.preferences && user.preferences.historyTrackingEnabled === false) {
      return null // History tracking is disabled by user
    }

    const completionThreshold = user?.preferences?.completionThreshold || 90
    const duration = Math.max(1, input.durationSeconds || 0)
    const position = Math.max(0, Math.min(input.lastPositionSeconds || 0, duration))
    const now = new Date()

    if (isDatabaseConnected()) {
      let record = await WatchProgress.findOne({ userId, videoId })

      if (record) {
        // Append new interval if provided
        let intervals = record.watchedIntervals || []
        if (input.interval && input.interval[1] > input.interval[0]) {
          intervals = mergeIntervals([...intervals, input.interval])
        }

        const uniqueSeconds = calculateUniqueCoverageSeconds(intervals)
        const completionPct = Math.min(100, Math.round((uniqueSeconds / duration) * 100))
        const isNowCompleted = record.isCompleted || completionPct >= completionThreshold

        record.lastPositionSeconds = position
        record.durationSeconds = duration
        record.furthestPositionSeconds = Math.max(record.furthestPositionSeconds, position)
        record.watchedIntervals = intervals
        record.completionPercentage = completionPct
        if (isNowCompleted && !record.isCompleted) {
          record.isCompleted = true
          record.completedAt = now
        }
        record.lastWatchedAt = now
        record.version = (record.version || 1) + 1

        await record.save()
        return toWatchProgressDTO(record)
      } else {
        let intervals: [number, number][] = []
        if (input.interval && input.interval[1] > input.interval[0]) {
          intervals = [input.interval]
        } else if (position > 0) {
          intervals = [[0, position]]
        }

        const uniqueSeconds = calculateUniqueCoverageSeconds(intervals)
        const completionPct = Math.min(100, Math.round((uniqueSeconds / duration) * 100))
        const isCompleted = completionPct >= completionThreshold

        record = new WatchProgress({
          userId,
          videoId,
          lastPositionSeconds: position,
          durationSeconds: duration,
          furthestPositionSeconds: position,
          watchedIntervals: intervals,
          completionPercentage: completionPct,
          isCompleted,
          completedAt: isCompleted ? now : null,
          firstWatchedAt: now,
          lastWatchedAt: now,
          version: 1,
        })

        await record.save()
        return toWatchProgressDTO(record)
      }
    } else {
      // In-memory fallback
      const key = getMemoryKey(userId, videoId)
      let record = memoryProgress.get(key)

      if (record) {
        let intervals = record.watchedIntervals || []
        if (input.interval && input.interval[1] > input.interval[0]) {
          intervals = mergeIntervals([...intervals, input.interval])
        }

        const uniqueSeconds = calculateUniqueCoverageSeconds(intervals)
        const completionPct = Math.min(100, Math.round((uniqueSeconds / duration) * 100))
        const isNowCompleted = record.isCompleted || completionPct >= completionThreshold

        record.lastPositionSeconds = position
        record.durationSeconds = duration
        record.furthestPositionSeconds = Math.max(record.furthestPositionSeconds, position)
        record.watchedIntervals = intervals
        record.completionPercentage = completionPct
        if (isNowCompleted && !record.isCompleted) {
          record.isCompleted = true
          record.completedAt = now
        }
        record.lastWatchedAt = now
        record.version = (record.version || 1) + 1
        record.updatedAt = now

        return toWatchProgressDTO(record)
      } else {
        let intervals: [number, number][] = []
        if (input.interval && input.interval[1] > input.interval[0]) {
          intervals = [input.interval]
        } else if (position > 0) {
          intervals = [[0, position]]
        }

        const uniqueSeconds = calculateUniqueCoverageSeconds(intervals)
        const completionPct = Math.min(100, Math.round((uniqueSeconds / duration) * 100))
        const isCompleted = completionPct >= completionThreshold

        const memObj: any = {
          id: "prog_" + Date.now().toString(36),
          userId,
          videoId,
          lastPositionSeconds: position,
          durationSeconds: duration,
          furthestPositionSeconds: position,
          watchedIntervals: intervals,
          completionPercentage: completionPct,
          isCompleted,
          completedAt: isCompleted ? now : null,
          firstWatchedAt: now,
          lastWatchedAt: now,
          version: 1,
          createdAt: now,
          updatedAt: now,
        }

        memoryProgress.set(key, memObj)
        return toWatchProgressDTO(memObj)
      }
    }
  }

  /**
   * Get progress for a specific video
   */
  static async getProgress(userId: string, videoId: string): Promise<WatchProgressDTO | null> {
    if (isDatabaseConnected()) {
      const record = await WatchProgress.findOne({ userId, videoId })
      return record ? toWatchProgressDTO(record) : null
    } else {
      const record = memoryProgress.get(getMemoryKey(userId, videoId))
      return record ? toWatchProgressDTO(record) : null
    }
  }

  /**
   * Get all progress items for a user
   */
  static async getAllProgress(userId: string): Promise<WatchProgressDTO[]> {
    if (isDatabaseConnected()) {
      const records = await WatchProgress.find({ userId }).sort({ lastWatchedAt: -1 })
      return records.map(toWatchProgressDTO)
    } else {
      const list: WatchProgressDTO[] = []
      for (const [k, v] of memoryProgress.entries()) {
        if (k.startsWith(`${userId}:`)) {
          list.push(toWatchProgressDTO(v))
        }
      }
      return list.sort(
        (a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
      )
    }
  }

  /**
   * Get unfinished Continue Watching videos
   */
  static async getContinueWatching(userId: string, limit = 10): Promise<HistoryItemDTO[]> {
    const allVideos = await VideoService.getAllVideos()
    const videoMap = new Map(allVideos.map((v) => [v.id, v]))

    let progressList: WatchProgressDTO[] = []

    if (isDatabaseConnected()) {
      const records = await WatchProgress.find({
        userId,
        isCompleted: false,
        lastPositionSeconds: { $gt: 5 }, // Filter out accidental clicks (< 5s)
        completionPercentage: { $lt: 95 },
      })
        .sort({ lastWatchedAt: -1 })
        .limit(limit)

      progressList = records.map(toWatchProgressDTO)
    } else {
      for (const [k, v] of memoryProgress.entries()) {
        if (
          k.startsWith(`${userId}:`) &&
          !v.isCompleted &&
          v.lastPositionSeconds > 5 &&
          v.completionPercentage < 95
        ) {
          progressList.push(toWatchProgressDTO(v))
        }
      }
      progressList.sort(
        (a, b) => new Date(b.lastWatchedAt).getTime() - new Date(a.lastWatchedAt).getTime()
      )
      progressList = progressList.slice(0, limit)
    }

    return progressList.map((progress) => ({
      progress,
      video: videoMap.get(progress.videoId) || null,
    }))
  }

  /**
   * Get completed videos for "Watch Again" section
   */
  static async getCompletedVideos(userId: string, limit = 10): Promise<HistoryItemDTO[]> {
    const allVideos = await VideoService.getAllVideos()
    const videoMap = new Map(allVideos.map((v) => [v.id, v]))

    let progressList: WatchProgressDTO[] = []

    if (isDatabaseConnected()) {
      const records = await WatchProgress.find({
        userId,
        isCompleted: true,
      })
        .sort({ completedAt: -1, lastWatchedAt: -1 })
        .limit(limit)

      progressList = records.map(toWatchProgressDTO)
    } else {
      for (const [k, v] of memoryProgress.entries()) {
        if (k.startsWith(`${userId}:`) && v.isCompleted) {
          progressList.push(toWatchProgressDTO(v))
        }
      }
      progressList.sort((a, b) => {
        const timeA = new Date(a.completedAt || a.lastWatchedAt).getTime()
        const timeB = new Date(b.completedAt || b.lastWatchedAt).getTime()
        return timeB - timeA
      })
      progressList = progressList.slice(0, limit)
    }

    return progressList.map((progress) => ({
      progress,
      video: videoMap.get(progress.videoId) || null,
    }))
  }

  /**
   * Get paginated watch history with filtering and search
   */
  static async getHistory(
    userId: string,
    options: {
      page?: number
      limit?: number
      status?: "all" | "completed" | "unfinished"
      search?: string
    } = {}
  ): Promise<PaginatedHistoryResult> {
    const page = Math.max(1, options.page || 1)
    const limit = Math.max(1, Math.min(50, options.limit || 12))
    const status = options.status || "all"
    const search = (options.search || "").trim().toLowerCase()

    const allVideos = await VideoService.getAllVideos()
    const videoMap = new Map(allVideos.map((v) => [v.id, v]))

    let userProgress = await this.getAllProgress(userId)

    // Filter by completion status
    if (status === "completed") {
      userProgress = userProgress.filter((p) => p.isCompleted)
    } else if (status === "unfinished") {
      userProgress = userProgress.filter((p) => !p.isCompleted)
    }

    // Filter by search query on video title or category
    let itemsWithVideos: HistoryItemDTO[] = userProgress.map((p) => ({
      progress: p,
      video: videoMap.get(p.videoId) || null,
    }))

    if (search) {
      itemsWithVideos = itemsWithVideos.filter(({ video }) => {
        if (!video) return false
        return (
          video.title.toLowerCase().includes(search) ||
          video.category.toLowerCase().includes(search) ||
          video.tags.some((t) => t.toLowerCase().includes(search))
        )
      })
    }

    const total = itemsWithVideos.length
    const totalPages = Math.ceil(total / limit) || 1
    const startIndex = (page - 1) * limit
    const paginatedItems = itemsWithVideos.slice(startIndex, startIndex + limit)

    return {
      items: paginatedItems,
      total,
      page,
      limit,
      totalPages,
    }
  }

  /**
   * Delete a single video from user's progress/history
   */
  static async deleteProgress(userId: string, videoId: string): Promise<boolean> {
    if (isDatabaseConnected()) {
      const res = await WatchProgress.deleteOne({ userId, videoId })
      return res.deletedCount > 0
    } else {
      return memoryProgress.delete(getMemoryKey(userId, videoId))
    }
  }

  /**
   * Clear all watch history for user
   */
  static async clearAllHistory(userId: string): Promise<number> {
    if (isDatabaseConnected()) {
      const res = await WatchProgress.deleteMany({ userId })
      return res.deletedCount
    } else {
      let count = 0
      for (const key of memoryProgress.keys()) {
        if (key.startsWith(`${userId}:`)) {
          memoryProgress.delete(key)
          count++
        }
      }
      return count
    }
  }
}

