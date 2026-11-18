import { Watchlist, IWatchlist, WatchlistDTO } from "../models/Watchlist.js"
import { VideoService, VideoDTO } from "./videoService.js"
import { isDatabaseConnected } from "../config/db.js"

export interface WatchlistPopulatedItem {
  id: string
  userId: string
  videoId: string
  collectionName: string
  addedAt: string
  video: VideoDTO | null
}

export interface WatchlistQueryOptions {
  collection?: string
  search?: string
  sort?: "recent" | "alpha" | "duration"
}

export interface CollectionSummary {
  name: string
  count: number
}

// In-Memory store for offline / unconfigured fallback
const memoryWatchlist: Map<string, { userId: string; videoId: string; collectionName: string; addedAt: Date }> = new Map()

function getMemoryKey(userId: string, videoId: string, collectionName: string): string {
  return `${userId}:${collectionName}:${videoId}`
}

export class WatchlistService {
  /**
   * Add a video to user's watchlist (in a specific collection or default "Watch Later")
   */
  static async addToWatchlist(
    userId: string,
    videoId: string,
    collectionName: string = "Watch Later"
  ): Promise<WatchlistDTO> {
    const video = await VideoService.getVideoById(videoId)
    if (!video) {
      throw new Error(`Video with ID '${videoId}' does not exist`)
    }

    const cleanCollection = collectionName.trim() || "Watch Later"

    if (isDatabaseConnected()) {
      const doc = await Watchlist.findOneAndUpdate(
        { userId, videoId, collectionName: cleanCollection },
        { $setOnInsert: { userId, videoId, collectionName: cleanCollection, addedAt: new Date() } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      )

      return {
        id: doc._id.toString(),
        userId: doc.userId,
        videoId: doc.videoId,
        collectionName: doc.collectionName || cleanCollection,
        addedAt: doc.addedAt.toISOString(),
      }
    } else {
      const key = getMemoryKey(userId, videoId, cleanCollection)
      let item = memoryWatchlist.get(key)
      if (!item) {
        item = { userId, videoId, collectionName: cleanCollection, addedAt: new Date() }
        memoryWatchlist.set(key, item)
      }
      return {
        id: `mem_wl_${userId}_${cleanCollection}_${videoId}`,
        userId: item.userId,
        videoId: item.videoId,
        collectionName: item.collectionName,
        addedAt: item.addedAt.toISOString(),
      }
    }
  }

  /**
   * Remove a video from user's watchlist (from a specific collection or all collections if omitted)
   */
  static async removeFromWatchlist(
    userId: string,
    videoId: string,
    collectionName?: string
  ): Promise<boolean> {
    const filter: any = { userId, videoId }
    if (collectionName) {
      filter.collectionName = collectionName.trim()
    }

    if (isDatabaseConnected()) {
      const res = await Watchlist.deleteMany(filter)
      return res.deletedCount > 0
    } else {
      let deleted = false
      for (const [k, v] of memoryWatchlist.entries()) {
        if (v.userId === userId && v.videoId === videoId) {
          if (!collectionName || v.collectionName === collectionName.trim()) {
            memoryWatchlist.delete(k)
            deleted = true
          }
        }
      }
      return deleted
    }
  }

  /**
   * Check if a video is in user's watchlist
   */
  static async isInWatchlist(
    userId: string,
    videoId: string,
    collectionName?: string
  ): Promise<boolean> {
    const filter: any = { userId, videoId }
    if (collectionName) {
      filter.collectionName = collectionName.trim()
    }

    if (isDatabaseConnected()) {
      const count = await Watchlist.countDocuments(filter)
      return count > 0
    } else {
      for (const v of memoryWatchlist.values()) {
        if (v.userId === userId && v.videoId === videoId) {
          if (!collectionName || v.collectionName === collectionName.trim()) {
            return true
          }
        }
      }
      return false
    }
  }

  /**
   * Get all distinct collection names with video counts for a user
   */
  static async getUserCollections(userId: string): Promise<CollectionSummary[]> {
    if (isDatabaseConnected()) {
      try {
        const counts = await Watchlist.aggregate([
          { $match: { userId } },
          { $group: { _id: "$collectionName", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ])

        const results: CollectionSummary[] = counts.map((c) => ({
          name: c._id || "Watch Later",
          count: c.count,
        }))

        // Ensure "Watch Later" exists as default collection
        if (!results.some((r) => r.name === "Watch Later")) {
          results.unshift({ name: "Watch Later", count: 0 })
        }

        return results
      } catch (err) {
        console.warn("[WatchlistService] aggregate collections error:", err)
      }
    }

    // In-memory fallback
    const counts: Record<string, number> = { "Watch Later": 0 }
    for (const v of memoryWatchlist.values()) {
      if (v.userId === userId) {
        counts[v.collectionName] = (counts[v.collectionName] || 0) + 1
      }
    }

    return Object.entries(counts).map(([name, count]) => ({ name, count }))
  }

  /**
   * Get all watchlist items with video details for a user with collection filter, search, and sorting
   */
  static async getWatchlist(
    userId: string,
    options: WatchlistQueryOptions = {}
  ): Promise<WatchlistPopulatedItem[]> {
    const { collection, search, sort = "recent" } = options
    let rawList: { id: string; userId: string; videoId: string; collectionName: string; addedAt: string }[] = []

    const queryFilter: any = { userId }
    if (collection && collection !== "All") {
      queryFilter.collectionName = collection.trim()
    }

    if (isDatabaseConnected()) {
      const docs = await Watchlist.find(queryFilter).sort({ addedAt: -1 }).lean()
      rawList = docs.map((d: any) => ({
        id: d._id.toString(),
        userId: d.userId,
        videoId: d.videoId,
        collectionName: d.collectionName || "Watch Later",
        addedAt: d.addedAt ? d.addedAt.toISOString() : new Date().toISOString(),
      }))
    } else {
      for (const [k, v] of memoryWatchlist.entries()) {
        if (v.userId === userId) {
          if (!collection || collection === "All" || v.collectionName === collection.trim()) {
            rawList.push({
              id: `mem_wl_${v.userId}_${v.collectionName}_${v.videoId}`,
              userId: v.userId,
              videoId: v.videoId,
              collectionName: v.collectionName,
              addedAt: v.addedAt.toISOString(),
            })
          }
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
          collectionName: item.collectionName,
          addedAt: item.addedAt,
          video,
        }
      })
    )

    let filtered = populated.filter((item): item is WatchlistPopulatedItem => item.video !== null)

    // Optional Search within saved videos
    if (search && search.trim()) {
      const q = search.trim().toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.video?.title.toLowerCase().includes(q) ||
          item.video?.description.toLowerCase().includes(q) ||
          item.video?.category.toLowerCase().includes(q) ||
          item.video?.tags.some((t) => t.toLowerCase().includes(q))
      )
    }

    // Sorting
    if (sort === "alpha") {
      filtered.sort((a, b) => (a.video?.title || "").localeCompare(b.video?.title || ""))
    } else if (sort === "duration") {
      filtered.sort((a, b) => (b.video?.duration || 0) - (a.video?.duration || 0))
    } else {
      // Recent addedAt descending
      filtered.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
    }

    return filtered
  }
}
