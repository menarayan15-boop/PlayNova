import { Router } from "express"
import { ProgressController } from "../controllers/progressController.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = Router()

// All progress routes require authentication
router.use(requireAuth)

router.get("/", ProgressController.getAllProgress)
router.get("/:videoId", ProgressController.getProgress)
router.put("/:videoId", ProgressController.upsertProgress)
router.post("/:videoId", ProgressController.upsertProgress)
router.delete("/:videoId", ProgressController.deleteProgress)

export default router
