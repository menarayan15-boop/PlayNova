import { Router } from "express"
import { getVideos, getVideoById } from "../controllers/videoController.js"
import { ProgressController } from "../controllers/progressController.js"
import { validatePagination } from "../middleware/validateRequest.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = Router()

// Specific video routes before :id parameter
router.get("/videos/continue-watching", requireAuth, ProgressController.getContinueWatching)
router.get("/videos/completed", requireAuth, ProgressController.getCompletedVideos)

router.get("/videos", validatePagination, getVideos)
router.get("/videos/:id", getVideoById)

export default router
