import { Request, Response, NextFunction } from "express"
import { WatchlistService } from "../services/watchlistService.js"

export class WatchlistController {
  /**
   * GET /api/v1/watchlist
   */
  static async getWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const collection = req.query.collection ? String(req.query.collection) : undefined
      const search = req.query.search ? String(req.query.search) : undefined
      const sort = (req.query.sort as any) || "recent"

      const items = await WatchlistService.getWatchlist(userId, { collection, search, sort })
      res.status(200).json({
        status: "success",
        count: items.length,
        data: items,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/watchlist/collections
   */
  static async getCollections(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const collections = await WatchlistService.getUserCollections(userId)
      res.status(200).json({
        status: "success",
        data: collections,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * POST /api/v1/watchlist
   * POST /api/v1/watchlist/:videoId
   */
  static async addToWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      const videoId = req.params.videoId || req.body?.videoId
      const collectionName = req.body?.collectionName || "Watch Later"

      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      if (!videoId) {
        res.status(400).json({ status: "fail", message: "videoId is required" })
        return
      }

      const item = await WatchlistService.addToWatchlist(userId, videoId, collectionName)
      res.status(201).json({
        status: "success",
        message: `Video added to ${collectionName}`,
        data: { item },
      })
    } catch (error: any) {
      if (error?.message?.includes("does not exist")) {
        res.status(404).json({ status: "error", message: error.message })
        return
      }
      next(error)
    }
  }

  /**
   * DELETE /api/v1/watchlist/:videoId
   */
  static async removeFromWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      const { videoId } = req.params
      const collection = req.query.collection ? String(req.query.collection) : undefined

      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const removed = await WatchlistService.removeFromWatchlist(userId, videoId, collection)
      res.status(200).json({
        status: "success",
        message: removed ? "Video removed from watchlist" : "Video was not in watchlist",
        data: { removed },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * GET /api/v1/watchlist/check/:videoId
   * GET /api/v1/watchlist/:videoId/check
   */
  static async checkWatchlist(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      const { videoId } = req.params
      const collection = req.query.collection ? String(req.query.collection) : undefined

      if (!userId) {
        res.status(200).json({
          status: "success",
          data: { inWatchlist: false },
        })
        return
      }

      const inWatchlist = await WatchlistService.isInWatchlist(userId, videoId, collection)
      res.status(200).json({
        status: "success",
        data: { inWatchlist },
      })
    } catch (error) {
      next(error)
    }
  }
}
