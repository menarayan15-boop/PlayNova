import { Router } from "express"
import { AnalyticsController } from "../controllers/analyticsController.js"
import { optionalAuth, requireAuth, requireAdmin } from "../middleware/authMiddleware.js"

const router = Router()

router.post("/events", optionalAuth, AnalyticsController.recordEvent)
router.get("/dashboard", requireAuth, requireAdmin, AnalyticsController.getDashboard)

export default router

