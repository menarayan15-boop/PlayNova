import { Request, Response, NextFunction } from "express"
import { VideoService } from "../services/videoService.js"

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

