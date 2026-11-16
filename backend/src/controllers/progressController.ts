import { Request, Response, NextFunction } from "express"
import { ProgressService } from "../services/progressService.js"

export class ProgressController {
  /**
   * GET /api/v1/progress/:videoId
   */
  static async getProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      const { videoId } = req.params

      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const progress = await ProgressService.getProgress(userId, videoId)
      res.status(200).json({
        status: "success",
        data: { progress },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/progress
   */
  static async getAllProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const items = await ProgressService.getAllProgress(userId)
      res.status(200).json({
        status: "success",
        data: { items, count: items.length },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PUT or POST /api/v1/progress/:videoId
   */
  static async upsertProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      const { videoId } = req.params
      const { lastPositionSeconds, durationSeconds, interval, clientVersion } = req.body

      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      if (typeof durationSeconds !== "number" || typeof lastPositionSeconds !== "number") {
        res.status(400).json({
          status: "fail",
          message: "durationSeconds and lastPositionSeconds must be numbers",
        })
        return
      }

      let parsedInterval: [number, number] | undefined = undefined
      if (Array.isArray(interval) && interval.length === 2) {
        parsedInterval = [Number(interval[0]), Number(interval[1])]
      }

      const progress = await ProgressService.upsertProgress(userId, videoId, {
        lastPositionSeconds: Number(lastPositionSeconds),
        durationSeconds: Number(durationSeconds),
        interval: parsedInterval,
        clientVersion: clientVersion ? Number(clientVersion) : undefined,
      })

      if (!progress) {
        res.status(200).json({
          status: "success",
          data: {
            progress: null,
            trackingDisabled: true,
            message: "Watch progress tracking is paused by user preference",
          },
        })
        return
      }

      res.status(200).json({
        status: "success",
        data: { progress },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/v1/progress/:videoId
   */
  static async deleteProgress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      const { videoId } = req.params

      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const deleted = await ProgressService.deleteProgress(userId, videoId)
      res.status(200).json({
        status: "success",
        message: deleted ? "Progress deleted successfully" : "Progress record not found",
        data: { deleted },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/videos/continue-watching
   */
  static async getContinueWatching(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10
      const items = await ProgressService.getContinueWatching(userId, limit)

      res.status(200).json({
        status: "success",
        data: { items, count: items.length },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/videos/completed
   */
  static async getCompletedVideos(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 10
      const items = await ProgressService.getCompletedVideos(userId, limit)

      res.status(200).json({
        status: "success",
        data: { items, count: items.length },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/history
   */
  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const page = req.query.page ? parseInt(String(req.query.page), 10) : 1
      const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 12
      const status = (req.query.status as any) || "all"
      const search = req.query.search ? String(req.query.search) : ""

      const result = await ProgressService.getHistory(userId, {
        page,
        limit,
        status,
        search,
      })

      res.status(200).json({
        status: "success",
        data: {
          items: result.items,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/v1/history/:videoId
   */
  static async deleteHistoryItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      const { videoId } = req.params

      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const deleted = await ProgressService.deleteProgress(userId, videoId)
      res.status(200).json({
        status: "success",
        message: deleted ? "Item removed from history" : "Item not found in history",
        data: { deleted },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/v1/history
   */
  static async clearAllHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const deletedCount = await ProgressService.clearAllHistory(userId)
      res.status(200).json({
        status: "success",
        message: "Watch history cleared successfully",
        data: { deletedCount },
      })
    } catch (error) {
      next(error)
    }
  }
}
