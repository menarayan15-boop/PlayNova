import { Router } from "express"
import {
  getVideos,
  getVideoById,
  searchVideos,
  getSearchSuggestions,
  getRecommendations,
  getTrendingVideos,
  getRecentlyAdded,
} from "../controllers/videoController.js"
import { ProgressController } from "../controllers/progressController.js"
import { validatePagination } from "../middleware/validateRequest.js"
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js"

const router = Router()

// Specific and parameterized sub-routes
router.get("/videos/search", searchVideos)
router.get("/videos/suggestions", getSearchSuggestions)
router.get("/videos/recommendations", optionalAuth, getRecommendations)
router.get("/videos/trending", getTrendingVideos)
router.get("/videos/recent", getRecentlyAdded)
router.get("/videos/continue-watching", requireAuth, ProgressController.getContinueWatching)
router.get("/videos/completed", requireAuth, ProgressController.getCompletedVideos)

// Main listing and single item
router.get("/videos", validatePagination, getVideos)
router.get("/videos/:id", getVideoById)

export default router
