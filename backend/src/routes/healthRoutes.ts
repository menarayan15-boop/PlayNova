import { Router } from "express"
import { getHealth, getHealthMetrics } from "../controllers/healthController.js"
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js"

const router = Router()

router.get("/health", getHealth)
router.get("/health/metrics", requireAuth, requireAdmin, getHealthMetrics)

export default router
