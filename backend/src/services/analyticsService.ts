import crypto from "node:crypto"
import { AnalyticsEvent, AnalyticsEventType } from "../models/AnalyticsEvent.js"
import { Video } from "../models/Video.js"
import { UserService } from "./userService.js"
import { VideoService } from "./videoService.js"
import { isDatabaseConnected } from "../config/db.js"
import { recordPlaybackError } from "../utils/metrics.js"

const VIEW_DEDUP_WINDOW_MS = 30 * 60 * 1000 // 30 minutes per viewer-video pair

export interface RecordAnalyticsEventInput {
  videoId: string
  eventType: AnalyticsEventType
  rawSessionId: string
  userId?: string
  watchSeconds?: number
  completionPercentage?: number
  errorMessage?: string
}

export interface AnalyticsDashboardQuery {
  startDate?: Date
  endDate?: Date
  page?: number
  limit?: number
}

function hashSessionKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex").slice(0, 32)
}

export class AnalyticsService {
  /**
   * Record a real video playback analytics event while respecting privacy & deduplicating views
   */
  static async recordEvent(input: RecordAnalyticsEventInput): Promise<{
    recorded: boolean
    reason?: string
  }> {
    const { videoId, eventType, rawSessionId, userId, watchSeconds = 0, completionPercentage = 0, errorMessage } =
      input

    // Respect user privacy preferences (do not track personal viewing if disabled)
    if (userId) {
      const user = await UserService.getUserById(userId)
      if (user?.preferences?.historyTrackingEnabled === false && eventType !== "playback_error") {
        return { recorded: false, reason: "privacy_tracking_disabled" }
      }
    }

    if (eventType === "playback_error") {
      recordPlaybackError()
    }

    if (!isDatabaseConnected()) {
      return { recorded: false, reason: "database_offline" }
    }

    // Verify video exists
    const video = await VideoService.getVideoById(videoId)
    if (!video) {
      return { recorded: false, reason: "video_not_found" }
    }

    const sessionKey = hashSessionKey(userId ? `user:${userId}` : `anon:${rawSessionId}`)

    // Deduplicate view events within 30 minutes per viewer + video
    if (eventType === "view") {
      const cutoff = new Date(Date.now() - VIEW_DEDUP_WINDOW_MS)
      const recentView = await AnalyticsEvent.findOne({
        sessionKey,
        videoId,
        eventType: "view",
        createdAt: { $gte: cutoff },
      })
        .select("_id")
        .maxTimeMS(3000)
        .lean()

      if (recentView) {
        return { recorded: false, reason: "duplicate_view_deduped" }
      }
    }

    // Deduplicate complete events per viewer + video within 30 minutes
    if (eventType === "complete") {
      const cutoff = new Date(Date.now() - VIEW_DEDUP_WINDOW_MS)
      const recentComplete = await AnalyticsEvent.findOne({
        sessionKey,
        videoId,
        eventType: "complete",
        createdAt: { $gte: cutoff },
      })
        .select("_id")
        .maxTimeMS(3000)
        .lean()

      if (recentComplete) {
        return { recorded: false, reason: "duplicate_complete_deduped" }
      }
    }

    const safeWatchSeconds = Math.max(0, Math.min(7200, Number(watchSeconds) || 0))
    const safeCompletion = Math.max(0, Math.min(100, Number(completionPercentage) || 0))
    const safeError =
      eventType === "playback_error" && typeof errorMessage === "string"
        ? errorMessage.trim().slice(0, 200)
        : undefined

    await AnalyticsEvent.create({
      videoId,
      eventType,
      sessionKey,
      watchSeconds: safeWatchSeconds,
      completionPercentage: safeCompletion,
      errorMessage: safeError,
    })

    // Increment catalog view counter on verified unique view
    if (eventType === "view") {
      await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } }).maxTimeMS(3000).catch(() => {})
    }

    return { recorded: true }
  }

  /**
   * Compute aggregated real-event analytics for authorized administrators
   */
  static async getDashboardSummary(query: AnalyticsDashboardQuery = {}) {
    const safePage = Math.max(1, query.page || 1)
    const safeLimit = Math.max(1, Math.min(25, query.limit || 10))
    const skip = (safePage - 1) * safeLimit

    if (!isDatabaseConnected()) {
      return {
        hasData: false,
        summary: {
          totalViews: 0,
          uniqueViewers: 0,
          totalWatchTimeSeconds: 0,
          averageWatchDurationSeconds: 0,
          completionRate: 0,
          totalCompletions: 0,
          playbackErrors: 0,
          playbackErrorRate: 0,
        },
        mostWatchedVideos: [],
        pagination: { page: safePage, limit: safeLimit, total: 0, totalPages: 1 },
        dailyTrends: [],
      }
    }

    const matchStage: Record<string, unknown> = {}
    if (query.startDate || query.endDate) {
      const dateFilter: Record<string, Date> = {}
      if (query.startDate) dateFilter.$gte = query.startDate
      if (query.endDate) dateFilter.$lte = query.endDate
      matchStage.createdAt = dateFilter
    }

    const [summaryAgg, uniqueViewersAgg, videoAgg, trendAgg, allVideos] = await Promise.all([
      AnalyticsEvent.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalViews: { $sum: { $cond: [{ $eq: ["$eventType", "view"] }, 1, 0] } },
            totalCompletions: { $sum: { $cond: [{ $eq: ["$eventType", "complete"] }, 1, 0] } },
            playbackErrors: { $sum: { $cond: [{ $eq: ["$eventType", "playback_error"] }, 1, 0] } },
            totalWatchTimeSeconds: {
              $sum: { $cond: [{ $eq: ["$eventType", "watch_time"] }, "$watchSeconds", 0] },
            },
          },
        },
      ]).option({ maxTimeMS: 5000 }),

      AnalyticsEvent.aggregate([
        { $match: { ...matchStage, eventType: { $in: ["view", "watch_time"] } } },
        { $group: { _id: "$sessionKey" } },
        { $count: "uniqueViewers" },
      ]).option({ maxTimeMS: 5000 }),

      AnalyticsEvent.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: "$videoId",
            views: { $sum: { $cond: [{ $eq: ["$eventType", "view"] }, 1, 0] } },
            completions: { $sum: { $cond: [{ $eq: ["$eventType", "complete"] }, 1, 0] } },
            watchSeconds: {
              $sum: { $cond: [{ $eq: ["$eventType", "watch_time"] }, "$watchSeconds", 0] },
            },
            errors: { $sum: { $cond: [{ $eq: ["$eventType", "playback_error"] }, 1, 0] } },
            uniqueSessions: { $addToSet: "$sessionKey" },
          },
        },
        {
          $project: {
            videoId: "$_id",
            views: 1,
            completions: 1,
            watchSeconds: 1,
            errors: 1,
            uniqueViewers: { $size: "$uniqueSessions" },
          },
        },
        { $sort: { views: -1, watchSeconds: -1 } },
      ]).option({ maxTimeMS: 5000 }),

      AnalyticsEvent.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            views: { $sum: { $cond: [{ $eq: ["$eventType", "view"] }, 1, 0] } },
            completions: { $sum: { $cond: [{ $eq: ["$eventType", "complete"] }, 1, 0] } },
            watchSeconds: {
              $sum: { $cond: [{ $eq: ["$eventType", "watch_time"] }, "$watchSeconds", 0] },
            },
            errors: { $sum: { $cond: [{ $eq: ["$eventType", "playback_error"] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 30 },
      ]).option({ maxTimeMS: 5000 }),

      VideoService.getAllVideos(),
    ])

    const totals = summaryAgg[0] || {
      totalViews: 0,
      totalCompletions: 0,
      playbackErrors: 0,
      totalWatchTimeSeconds: 0,
    }
    const uniqueViewers = uniqueViewersAgg[0]?.uniqueViewers || 0
    const totalViews = totals.totalViews || 0
    const totalCompletions = totals.totalCompletions || 0
    const playbackErrors = totals.playbackErrors || 0
    const totalWatchTimeSeconds = Math.round(totals.totalWatchTimeSeconds || 0)

    const averageWatchDurationSeconds =
      totalViews > 0 ? Math.round(totalWatchTimeSeconds / totalViews) : 0
    const completionRate =
      totalViews > 0 ? Number(Math.min(100, (totalCompletions / totalViews) * 100).toFixed(1)) : 0
    const playbackErrorRate =
      totalViews + playbackErrors > 0
        ? Number(((playbackErrors / (totalViews + playbackErrors)) * 100).toFixed(2))
        : 0

    const videoMap = new Map(allVideos.map((v) => [v.id, v]))
    const totalVideoRows = videoAgg.length
    const paginatedVideos = videoAgg.slice(skip, skip + safeLimit).map((row) => {
      const meta = videoMap.get(row.videoId)
      const rowCompletionRate =
        row.views > 0 ? Number(Math.min(100, (row.completions / row.views) * 100).toFixed(1)) : 0
      return {
        videoId: row.videoId,
        title: meta?.title || row.videoId,
        category: meta?.category || "Unknown",
        views: row.views,
        uniqueViewers: row.uniqueViewers,
        watchSeconds: Math.round(row.watchSeconds),
        completions: row.completions,
        completionRate: rowCompletionRate,
        errors: row.errors,
      }
    })

    const dailyTrends = trendAgg.map((row) => ({
      date: row._id,
      views: row.views,
      completions: row.completions,
      watchSeconds: Math.round(row.watchSeconds),
      errors: row.errors,
    }))

    const hasData = totalViews > 0 || totalWatchTimeSeconds > 0 || playbackErrors > 0

    return {
      hasData,
      summary: {
        totalViews,
        uniqueViewers,
        totalWatchTimeSeconds,
        averageWatchDurationSeconds,
        completionRate,
        totalCompletions,
        playbackErrors,
        playbackErrorRate,
      },
      mostWatchedVideos: paginatedVideos,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total: totalVideoRows,
        totalPages: Math.max(1, Math.ceil(totalVideoRows / safeLimit)),
      },
      dailyTrends,
    }
  }
}

