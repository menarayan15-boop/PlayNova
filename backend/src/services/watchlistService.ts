import { Watchlist, IWatchlist, WatchlistDTO } from "../models/Watchlist.js"
import { VideoService, VideoDTO } from "./videoService.js"
import { isDatabaseConnected } from "../config/db.js"

export interface WatchlistPopulatedItem {
  id: string
  userId: string
  videoId: string
  addedAt: string
  video: VideoDTO | null
}

// In-Memory store for offline / unconfigured fallback
const memoryWatchlist: Map<string, { userId: string; videoId: string; addedAt: Date }> = new Map()

function getMemoryKey(userId: string, videoId: string): string {
  return `${userId}:${videoId}`
}

export class WatchlistService {
  /**
   * Add a video to user's watchlist
   */
  static async addToWatchlist(userId: string, videoId: string): Promise<WatchlistDTO> {
    const video = await VideoService.getVideoById(videoId)
    if (!video) {
      throw new Error(`Video with ID '${videoId}' does not exist`)
    }

    if (isDatabaseConnected()) {
      const doc = await Watchlist.findOneAndUpdate(
        { userId, videoId },
        { $setOnInsert: { userId, videoId, addedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )

      return {
        id: doc._id.toString(),
        userId: doc.userId,
        videoId: doc.videoId,
        addedAt: doc.addedAt.toISOString(),
      }
    } else {
      const key = getMemoryKey(userId, videoId)
      let item = memoryWatchlist.get(key)
      if (!item) {
        item = { userId, videoId, addedAt: new Date() }
        memoryWatchlist.set(key, item)
      }
      return {
        id: `mem_wl_${userId}_${videoId}`,
        userId: item.userId,
        videoId: item.videoId,
        addedAt: item.addedAt.toISOString(),
      }
    }
  }

  /**
   * Remove a video from user's watchlist
   */
  static async removeFromWatchlist(userId: string, videoId: string): Promise<boolean> {
    if (isDatabaseConnected()) {
      const res = await Watchlist.deleteOne({ userId, videoId })
      return res.deletedCount > 0
    } else {
      const key = getMemoryKey(userId, videoId)
      return memoryWatchlist.delete(key)
    }
  }

  /**
   * Check if a video is in user's watchlist
   */
  static async isInWatchlist(userId: string, videoId: string): Promise<boolean> {
    if (isDatabaseConnected()) {
      const count = await Watchlist.countDocuments({ userId, videoId })
      return count > 0
    } else {
      const key = getMemoryKey(userId, videoId)
      return memoryWatchlist.has(key)
    }
  }

  /**
   * Get all watchlist items with video details for a user
   */
  static async getWatchlist(userId: string): Promise<WatchlistPopulatedItem[]> {
    let rawList: { id: string; userId: string; videoId: string; addedAt: string }[] = []

    if (isDatabaseConnected()) {
      const docs = await Watchlist.find({ userId }).sort({ addedAt: -1 }).lean()
      rawList = docs.map((d) => ({
        id: d._id.toString(),
        userId: d.userId,
        videoId: d.videoId,
        addedAt: d.addedAt ? d.addedAt.toISOString() : new Date().toISOString(),
      }))
    } else {
      for (const [k, v] of memoryWatchlist.entries()) {
        if (k.startsWith(`${userId}:`)) {
          rawList.push({
            id: `mem_wl_${v.userId}_${v.videoId}`,
            userId: v.userId,
            videoId: v.videoId,
            addedAt: v.addedAt.toISOString(),
          })
        }
      }
      rawList.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    }

    // Populate video details
    const populated = await Promise.all(
      rawList.map(async (item) => {
        const video = await VideoService.getVideoById(item.videoId)
        return {
          id: item.id,
          userId: item.userId,
          videoId: item.videoId,
          addedAt: item.addedAt,
          video,
        }
      })
    )

    // Filter out items where the video may have been deleted
    return populated.filter((item) => item.video !== null)
  }
}

