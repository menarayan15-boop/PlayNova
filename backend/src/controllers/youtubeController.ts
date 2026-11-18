import { Request, Response, NextFunction } from "express"
import {
  YouTubeService,
  YOUTUBE_CATEGORIES,
  YouTubeApiError,
} from "../services/youtubeService.js"

function handleYouTubeError(err: unknown, res: Response, next: NextFunction): void {
  if (err instanceof YouTubeApiError) {
    res.status(err.statusCode).json({
      status: "error",
      code: err.code,
      configured: YouTubeService.isConfigured(),
      message: err.message,
    })
    return
  }
  next(err)
}

export class YouTubeController {
  /**
   * GET /api/v1/youtube/status
   */
  static getStatus(_req: Request, res: Response): void {
    res.status(200).json({
      status: "success",
      data: YouTubeService.getStatus(),
    })
  }

  /**
   * GET /api/v1/youtube/categories
   */
  static getCategories(_req: Request, res: Response): void {
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.status(200).json({
      status: "success",
      count: YOUTUBE_CATEGORIES.length,
      data: YOUTUBE_CATEGORIES.map((c) => ({
        name: c.name,
        slug: c.slug,
        description: c.description,
      })),
    })
  }

  /**
   * GET /api/v1/youtube/search
   */
  static async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = String(req.query.q || req.query.query || "").trim()
      const category = req.query.category ? String(req.query.category) : undefined
      const uploadDate = (req.query.uploadDate || "any") as "today" | "week" | "month" | "year" | "any"
      const duration = (req.query.duration || "any") as "short" | "medium" | "long" | "any"
      const order = (req.query.order || req.query.sort || "relevance") as
        | "relevance"
        | "date"
        | "viewCount"
        | "rating"
      const regionCode = req.query.regionCode ? String(req.query.regionCode).slice(0, 2) : undefined
      const relevanceLanguage = req.query.lang ? String(req.query.lang).slice(0, 5) : undefined
      const pageToken = req.query.pageToken ? String(req.query.pageToken).slice(0, 64) : undefined
      const maxResults = req.query.limit ? parseInt(String(req.query.limit), 10) : 12

      const validOrder = ["relevance", "date", "viewCount", "rating"].includes(order)
        ? order
        : "relevance"

      const data = await YouTubeService.searchVideos({
        query,
        category,
        uploadDate,
        duration,
        order: validOrder,
        regionCode,
        relevanceLanguage,
        pageToken,
        maxResults: isNaN(maxResults) ? 12 : maxResults,
      })

      res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=300")
      res.status(200).json({ status: "success", data })
    } catch (err) {
      handleYouTubeError(err, res, next)
    }
  }

  /**
   * GET /api/v1/youtube/trending
   */
  static async trending(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = req.query.category ? String(req.query.category) : undefined
      const regionCode = req.query.regionCode ? String(req.query.regionCode).slice(0, 2) : undefined
      const pageToken = req.query.pageToken ? String(req.query.pageToken).slice(0, 64) : undefined
      const maxResults = req.query.limit ? parseInt(String(req.query.limit), 10) : 12

      const data = await YouTubeService.getTrending({
        category,
        regionCode,
        pageToken,
        maxResults: isNaN(maxResults) ? 12 : maxResults,
      })

      res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=600")
      res.status(200).json({ status: "success", data })
    } catch (err) {
      handleYouTubeError(err, res, next)
    }
  }

  /**
   * GET /api/v1/youtube/category/:slug
   */
  static async byCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { slug } = req.params
      const meta = YouTubeService.findCategoryMeta(slug)
      if (!meta) {
        res.status(404).json({ status: "error", message: `Category '${slug}' not found` })
        return
      }

      const pageToken = req.query.pageToken ? String(req.query.pageToken).slice(0, 64) : undefined
      const maxResults = req.query.limit ? parseInt(String(req.query.limit), 10) : 12

      // Prefer 1-unit trending chart when category has a native YouTube categoryId and no search keyword
      const data = meta.youtubeCategoryId
        ? await YouTubeService.getTrending({
            category: meta.name,
            pageToken,
            maxResults: isNaN(maxResults) ? 12 : maxResults,
          })
        : await YouTubeService.searchVideos({
            category: meta.name,
            pageToken,
            maxResults: isNaN(maxResults) ? 12 : maxResults,
          })

      res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=600")
      res.status(200).json({
        status: "success",
        category: meta.name,
        data,
      })
    } catch (err) {
      handleYouTubeError(err, res, next)
    }
  }

  /**
   * GET /api/v1/youtube/shorts
   */
  static async shorts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pageToken = req.query.pageToken ? String(req.query.pageToken).slice(0, 64) : undefined
      const maxResults = req.query.limit ? parseInt(String(req.query.limit), 10) : 12
      const data = await YouTubeService.getShortVideos(pageToken, isNaN(maxResults) ? 12 : maxResults)
      res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=600")
      res.status(200).json({ status: "success", data })
    } catch (err) {
      handleYouTubeError(err, res, next)
    }
  }

  /**
   * GET /api/v1/youtube/homepage
   */
  static async homepage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!YouTubeService.isConfigured()) {
        res.status(200).json({
          status: "success",
          data: {
            configured: false,
            code: "YOUTUBE_API_KEY_MISSING",
            featured: [],
            trending: [],
            latestUploads: [],
            categoryRows: [],
            shortVideos: [],
            uniqueCount: 0,
          },
        })
        return
      }

      const regionCode = req.query.regionCode ? String(req.query.regionCode).slice(0, 2) : undefined
      const data = await YouTubeService.getYouTubeHomepageFeed(regionCode)
      res.setHeader("Cache-Control", "public, max-age=120, stale-while-revalidate=600")
      res.status(200).json({ status: "success", data })
    } catch (err) {
      handleYouTubeError(err, res, next)
    }
  }

  /**
   * GET /api/v1/youtube/video/:videoId
   */
  static async getVideo(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.videoId
      const ytId = rawId.startsWith("yt_") ? rawId.slice(3) : rawId
      const video = await YouTubeService.ensurePersistedYouTubeVideo(ytId)
      if (!video) {
        res.status(404).json({
          status: "error",
          message: "YouTube video is unavailable, private, region-restricted, or embedding is disabled.",
        })
        return
      }
      res.status(200).json({ status: "success", data: video })
    } catch (err) {
      handleYouTubeError(err, res, next)
    }
  }

  /**
   * GET /api/v1/youtube/video/:videoId/related
   */
  static async getRelated(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawId = req.params.videoId
      const ytId = rawId.startsWith("yt_") ? rawId.slice(3) : rawId
      const video = await YouTubeService.getVideoByYouTubeId(ytId)
      if (!video) {
        res.status(200).json({ status: "success", data: [] })
        return
      }

      const query = video.tags.filter((t) => t !== "youtube").slice(0, 3).join(" ") || video.category
      const searchRes = await YouTubeService.searchVideos({
        query,
        category: video.category,
        maxResults: 8,
      })

      const related = searchRes.items.filter((v) => v.id !== video.id).slice(0, 6)
      res.status(200).json({ status: "success", data: related })
    } catch (err) {
      handleYouTubeError(err, res, next)
    }
  }
}

