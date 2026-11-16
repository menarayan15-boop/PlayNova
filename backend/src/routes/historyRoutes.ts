import { Router } from "express"
import { ProgressController } from "../controllers/progressController.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = Router()

// All history routes require authentication
router.use(requireAuth)

router.get("/", ProgressController.getHistory)
router.delete("/:videoId", ProgressController.deleteHistoryItem)
router.delete("/", ProgressController.clearAllHistory)

export default router
