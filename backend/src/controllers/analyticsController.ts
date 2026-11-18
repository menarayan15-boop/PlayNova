import { Request, Response, NextFunction } from "express"
import { AnalyticsService } from "../services/analyticsService.js"
import { AnalyticsEventType } from "../models/AnalyticsEvent.js"

const VALID_EVENT_TYPES = new Set<AnalyticsEventType>([
  "view",
  "watch_time",
  "complete",
  "playback_error",
])

export class AnalyticsController {
  /**
   * POST /api/v1/analytics/events
   */
  static async recordEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { videoId, eventType, watchSeconds, completionPercentage, errorMessage, sessionId } =
        req.body || {}

      if (typeof videoId !== "string" || !/^[a-zA-Z0-9_-]{2,64}$/.test(videoId)) {
        res.status(400).json({ status: "error", message: "Valid videoId is required" })
        return
      }

      if (typeof eventType !== "string" || !VALID_EVENT_TYPES.has(eventType as AnalyticsEventType)) {
        res.status(400).json({ status: "error", message: "Invalid analytics eventType" })
        return
      }

      const userId = req.user?.userId
      const rawSessionId =
        typeof sessionId === "string" && sessionId.trim().length > 0
          ? sessionId.trim().slice(0, 64)
          : `${req.ip || "anon"}-${req.headers["user-agent"] || "ua"}`

      const result = await AnalyticsService.recordEvent({
        videoId,
        eventType: eventType as AnalyticsEventType,
        rawSessionId,
        userId,
        watchSeconds: typeof watchSeconds === "number" ? watchSeconds : 0,
        completionPercentage: typeof completionPercentage === "number" ? completionPercentage : 0,
        errorMessage: typeof errorMessage === "string" ? errorMessage : undefined,
      })

      res.status(202).json({
        status: "success",
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/analytics/dashboard (Admin only)
   */
  static async getDashboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10
      const range = String(req.query.range || "30d")

      let startDate: Date | undefined
      const endDate = new Date()

      if (req.query.startDate) {
        const parsed = new Date(String(req.query.startDate))
        if (!isNaN(parsed.getTime())) startDate = parsed
      } else if (range === "7d") {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      } else if (range === "30d") {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      } else if (range === "90d") {
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      }

      const dashboard = await AnalyticsService.getDashboardSummary({
        startDate,
        endDate,
        page: isNaN(page) ? 1 : page,
        limit: isNaN(limit) ? 10 : limit,
      })

      res.status(200).json({
        status: "success",
        data: dashboard,
      })
    } catch (error) {
      next(error)
    }
  }
}

