import { Request, Response, NextFunction } from "express"
import { VideoService, VideoSearchOptions } from "../services/videoService.js"
import { validateVideoSource, normalizeSourceUrl } from "../utils/videoValidation.js"
import { Video } from "../models/Video.js"

export async function getVideos(req: Request, res: Response, next: NextFunction) {
  try {
    const category = req.query.category as string | undefined
    const videos = await VideoService.getAllVideos(category)
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60")
    res.status(200).json({
      status: "success",
      count: videos.length,
      data: videos,
    })
  } catch (error) {
    next(error)
  }
}

export async function getVideoById(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const video = await VideoService.getVideoById(id)

    if (!video) {
      return res.status(404).json({
        status: "error",
        message: `Video with ID '${id}' not found`,
      })
    }

    res.status(200).json({
      status: "success",
      data: video,
    })
  } catch (error) {
    next(error)
  }
}

export async function searchVideos(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.query.q || req.query.query || "") as string
    const category = req.query.category as string | undefined
    const duration = req.query.duration as "short" | "medium" | "long" | "any" | undefined
    const popularity = req.query.popularity as "popular" | "any" | undefined
    const dateRange = req.query.dateRange as "week" | "month" | "year" | "any" | undefined
    const sort = (req.query.sort || "relevant") as "relevant" | "recent" | "views" | "alpha"
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 12

    const searchOptions: VideoSearchOptions = {
      query,
      category,
      duration,
      popularity,
      dateRange,
      sort,
      page,
      limit,
    }

    const results = await VideoService.searchVideos(searchOptions)
    res.status(200).json({
      status: "success",
      data: results,
    })
  } catch (error) {
    next(error)
  }
}

export async function getSearchSuggestions(req: Request, res: Response, next: NextFunction) {
  try {
    const query = (req.query.q || req.query.query || "") as string
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 6

    const data = await VideoService.getSearchSuggestions(query, limit)
    res.status(200).json({
      status: "success",
      data,
    })
  } catch (error) {
    next(error)
  }
}

export async function getRecommendations(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id || undefined
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 8

    const recommendations = await VideoService.getPersonalizedRecommendations(userId, limit)
    res.status(200).json({
      status: "success",
      count: recommendations.length,
      data: recommendations,
    })
  } catch (error) {
    next(error)
  }
}

export async function getTrendingVideos(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 8
    const videos = await VideoService.getTrendingVideos(limit)
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60")
    res.status(200).json({
      status: "success",
      count: videos.length,
      data: videos,
    })
  } catch (error) {
    next(error)
  }
}

export async function getRecentlyAdded(req: Request, res: Response, next: NextFunction) {
  try {
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 8
    const videos = await VideoService.getRecentlyAdded(limit)
    res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60")
    res.status(200).json({
      status: "success",
      count: videos.length,
      data: videos,
    })
  } catch (error) {
    next(error)
  }
}

export async function getRecommendationShelves(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id || undefined
    const shelves = await VideoService.getPersonalizedShelves(userId)
    res.status(200).json({
      status: "success",
      data: shelves,
    })
  } catch (error) {
    next(error)
  }
}

export async function getSimilarVideos(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 4
    const items = await VideoService.getSimilarVideos(id, limit)
    res.status(200).json({
      status: "success",
      count: items.length,
      data: items,
    })
  } catch (error) {
    next(error)
  }
}

export async function getHomepageFeed(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId || (req as any).user?.id || undefined
    const sessionSeed = typeof req.query.seed === "string" ? req.query.seed.slice(0, 32) : undefined
    const feed = await VideoService.getHomepageFeed(userId, sessionSeed)
    if (!userId) {
      res.setHeader("Cache-Control", "public, max-age=30, stale-while-revalidate=60")
    }
    res.status(200).json({
      status: "success",
      data: feed,
    })
  } catch (error) {
    next(error)
  }
}

// =========================================================================
// Admin Video Management Controllers (Protected by requireAuth + requireAdmin)
// =========================================================================

export async function getAdminVideoInventory(req: Request, res: Response, next: NextFunction) {
  try {
    const status = req.query.status ? String(req.query.status) : "all"
    const category = req.query.category ? String(req.query.category) : "All"
    const page = req.query.page ? parseInt(String(req.query.page), 10) : 1
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20

    const data = await VideoService.getAdminInventory({ status, category, page, limit })
    res.status(200).json({ status: "success", data })
  } catch (error) {
    next(error)
  }
}

export async function validateAdminVideoSource(req: Request, res: Response, next: NextFunction) {
  try {
    const { videoUrl, thumbnailUrl } = req.body || {}
    if (typeof videoUrl !== "string" || typeof thumbnailUrl !== "string") {
      res.status(400).json({ status: "error", message: "videoUrl and thumbnailUrl are required" })
      return
    }

    const normalizedUrl = normalizeSourceUrl(videoUrl)
    const duplicate = await Video.findOne({ normalizedSourceUrl: normalizedUrl })
      .select("_id title status")
      .maxTimeMS(4000)
      .lean()

    const validation = await validateVideoSource(videoUrl, thumbnailUrl)
    res.status(200).json({
      status: "success",
      data: {
        valid: validation.valid,
        normalizedSourceUrl: validation.normalizedSourceUrl,
        details: validation.details,
        duplicate: duplicate
          ? { id: String(duplicate._id), title: duplicate.title, status: duplicate.status }
          : null,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function createAdminVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration,
      category,
      categories,
      tags,
      sourceProvider,
      sourceAttribution,
      license,
      featured,
      publishImmediately,
    } = req.body || {}

    if (!title || !description || !videoUrl || !thumbnailUrl || !category) {
      res.status(400).json({
        status: "error",
        message: "title, description, videoUrl, thumbnailUrl, and category are required",
      })
      return
    }

    const created = await VideoService.createAdminVideo({
      title,
      description,
      videoUrl,
      thumbnailUrl,
      duration: Number(duration) || 120,
      category,
      categories,
      tags,
      sourceProvider,
      sourceAttribution,
      license,
      featured,
      publishImmediately,
    })

    res.status(201).json({
      status: "success",
      message: "Video validated and added to catalog",
      data: created,
    })
  } catch (error) {
    next(error)
  }
}

export async function updateAdminVideo(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const updated = await VideoService.updateAdminVideo(id, req.body || {})
    if (!updated) {
      res.status(404).json({ status: "error", message: `Video '${id}' not found` })
      return
    }
    res.status(200).json({
      status: "success",
      message: "Video updated successfully",
      data: updated,
    })
  } catch (error) {
    next(error)
  }
}
