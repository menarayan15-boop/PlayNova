import { Router } from "express"
import { AuthController } from "../controllers/authController.js"
import { requireAuth } from "../middleware/authMiddleware.js"
import { authRateLimiter } from "../middleware/rateLimiter.js"

const router = Router()

router.post("/register", authRateLimiter, AuthController.register)
router.post("/login", authRateLimiter, AuthController.login)
router.post("/logout", AuthController.logout)
router.post("/refresh", AuthController.refresh)
router.get("/me", requireAuth, AuthController.getMe)

export default router
