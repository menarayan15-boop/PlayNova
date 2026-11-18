import { Router } from "express"
import { UserController } from "../controllers/userController.js"
import { requireAuth } from "../middleware/authMiddleware.js"

const router = Router()

router.get("/me", requireAuth, UserController.getProfile)
router.patch("/me", requireAuth, UserController.updateProfile)
router.patch("/me/password", requireAuth, UserController.changePassword)
router.get("/me/preferences", requireAuth, UserController.getPreferences)
router.patch("/me/preferences", requireAuth, UserController.updatePreferences)
router.get("/me/sessions", requireAuth, UserController.getSessions)
router.post("/me/sessions/revoke-all", requireAuth, UserController.revokeAllSessions)
router.get("/me/export", requireAuth, UserController.exportAccountData)
router.post("/me/delete", requireAuth, UserController.deleteAccount)

export default router
