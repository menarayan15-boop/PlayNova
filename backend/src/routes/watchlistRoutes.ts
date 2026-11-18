import { Router } from "express"
import { WatchlistController } from "../controllers/watchlistController.js"
import { requireAuth, optionalAuth } from "../middleware/authMiddleware.js"

const router = Router()

router.get("/collections", requireAuth, WatchlistController.getCollections)
router.get("/check/:videoId", optionalAuth, WatchlistController.checkWatchlist)
router.get("/:videoId/check", optionalAuth, WatchlistController.checkWatchlist)
router.get("/", requireAuth, WatchlistController.getWatchlist)
router.post("/:videoId", requireAuth, WatchlistController.addToWatchlist)
router.post("/", requireAuth, WatchlistController.addToWatchlist)
router.delete("/:videoId", requireAuth, WatchlistController.removeFromWatchlist)

export default router
