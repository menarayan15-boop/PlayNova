import { Request, Response, NextFunction } from "express"
import { VideoService, VideoSearchOptions } from "../services/videoService.js"

export async function getVideos(req: Request, res: Response, next: NextFunction) {
  try {
    const category = req.query.category as string | undefined
    const videos = await VideoService.getAllVideos(category)
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
    res.status(200).json({
      status: "success",
      count: videos.length,
      data: videos,
    })
  } catch (error) {
    next(error)
  }
}
