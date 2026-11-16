import { Router } from "express"
import { getVideos, getVideoById } from "../controllers/videoController.js"
import { validatePagination } from "../middleware/validateRequest.js"

const router = Router()

router.get("/videos", validatePagination, getVideos)
router.get("/videos/:id", getVideoById)

export default router

