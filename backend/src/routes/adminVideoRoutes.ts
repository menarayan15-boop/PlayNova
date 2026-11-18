import { Router } from "express"
import {
  getAdminVideoInventory,
  validateAdminVideoSource,
  createAdminVideo,
  updateAdminVideo,
} from "../controllers/videoController.js"
import { requireAuth, requireAdmin } from "../middleware/authMiddleware.js"
import { validateSafeId } from "../middleware/securityMiddleware.js"

const router = Router()

// All routes strictly enforce server-side authentication + live DB admin role check
router.use(requireAuth, requireAdmin)

router.get("/", getAdminVideoInventory)
router.post("/validate", validateAdminVideoSource)
router.post("/", createAdminVideo)
router.patch("/:id", validateSafeId("id"), updateAdminVideo)

export default router

