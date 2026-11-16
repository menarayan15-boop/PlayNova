import { Router } from "express"
import { UserController } from "../controllers/userController.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = Router()

router.get("/me", requireAuth, UserController.getProfile)
router.patch("/me", requireAuth, UserController.updateProfile)
router.patch("/me/password", requireAuth, UserController.changePassword)
router.get("/me/preferences", requireAuth, UserController.getPreferences)
router.patch("/me/preferences", requireAuth, UserController.updatePreferences)

export default router

