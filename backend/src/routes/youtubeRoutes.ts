import { Router } from "express"
import { YouTubeController } from "../controllers/youtubeController.js"
import { validateSafeId } from "../middleware/securityMiddleware.js"

const router = Router()

router.get("/status", YouTubeController.getStatus)
router.get("/categories", YouTubeController.getCategories)
router.get("/homepage", YouTubeController.homepage)
router.get("/search", YouTubeController.search)
router.get("/trending", YouTubeController.trending)
router.get("/shorts", YouTubeController.shorts)
router.get("/category/:slug", validateSafeId("slug"), YouTubeController.byCategory)
router.get("/video/:videoId/related", validateSafeId("videoId"), YouTubeController.getRelated)
router.get("/video/:videoId", validateSafeId("videoId"), YouTubeController.getVideo)

export default router

