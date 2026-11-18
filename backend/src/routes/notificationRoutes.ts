import { Router } from "express"
import { NotificationController } from "../controllers/notificationController.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = Router()

// All notification routes require authentication
router.use(requireAuth)

router.get("/", NotificationController.getNotifications)
router.patch("/read-all", NotificationController.markAllRead)
router.patch("/:id/read", NotificationController.markRead)
router.delete("/:id", NotificationController.dismissNotification)

export default router

