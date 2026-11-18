import { Router } from "express"
import {
  getVideos,
  getVideoById,
  searchVideos,
  getSearchSuggestions,
  getRecommendations,
  getRecommendationShelves,
  getSimilarVideos,
  getHomepageFeed,
  getTrendingVideos,
  getRecentlyAdded,
} from "../controllers/videoController.js"
import { ProgressController } from "../controllers/progressController.js"
import { validatePagination } from "../middleware/validateRequest.js"
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js"
import { validateSafeId } from "../middleware/securityMiddleware.js"

const router = Router()

// Specific and parameterized sub-routes
router.get("/videos/homepage", optionalAuth, getHomepageFeed)
router.get("/videos/search", searchVideos)
router.get("/videos/suggestions", getSearchSuggestions)
router.get("/videos/recommendations/shelves", optionalAuth, getRecommendationShelves)
router.get("/videos/recommendations", optionalAuth, getRecommendations)
router.get("/videos/trending", getTrendingVideos)
router.get("/videos/recent", getRecentlyAdded)
router.get("/videos/continue-watching", requireAuth, ProgressController.getContinueWatching)
router.get("/videos/completed", requireAuth, ProgressController.getCompletedVideos)

// Main listing and single item (with safe identifier validation)
router.get("/videos", validatePagination, getVideos)
router.get("/videos/:id/similar", validateSafeId("id"), getSimilarVideos)
router.get("/videos/:id", validateSafeId("id"), getVideoById)

export default router
