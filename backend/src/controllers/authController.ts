import { Request, Response } from "express"
import { UserService } from "../services/userService.js"
import { setAuthCookies, clearAuthCookies } from "../utils/cookies.js"

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { fullName, email, password } = req.body

      if (!fullName || !email || !password) {
        res.status(400).json({
          status: "error",
          message: "Full name, email address, and password are required",
        })
        return
      }

      const { user, accessToken, refreshToken } = await UserService.register(fullName, email, password)

      // Set secure HttpOnly cookies
      setAuthCookies(res, accessToken, refreshToken)

      res.status(201).json({
        status: "success",
        message: "Registration successful. Welcome to PlayNova!",
        data: {
          user,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed"
      const statusCode = message.includes("already exists") ? 409 : 400
      res.status(statusCode).json({
        status: "error",
        message,
      })
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        res.status(400).json({
          status: "error",
          message: "Email and password are required",
        })
        return
      }

      const { user, accessToken, refreshToken } = await UserService.login(email, password)

      setAuthCookies(res, accessToken, refreshToken)

      res.status(200).json({
        status: "success",
        message: "Sign in successful",
        data: {
          user,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed"
      res.status(401).json({
        status: "error",
        message,
      })
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const rawRefresh = req.cookies?.refresh_token || req.body?.refreshToken
      const userId = req.user?.userId

      if (userId && rawRefresh) {
        await UserService.logout(userId, rawRefresh)
      }

      clearAuthCookies(res)

      res.status(200).json({
        status: "success",
        message: "Logged out successfully",
      })
    } catch {
      clearAuthCookies(res)
      res.status(200).json({
        status: "success",
        message: "Logged out",
      })
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const rawRefresh = req.cookies?.refresh_token || req.body?.refreshToken
      if (!rawRefresh) {
        res.status(401).json({
          status: "error",
          message: "Refresh token not provided in cookie or payload",
        })
        return
      }

      const { user, accessToken, refreshToken } = await UserService.refresh(rawRefresh)
      setAuthCookies(res, accessToken, refreshToken)

      res.status(200).json({
        status: "success",
        message: "Session renewed",
        data: {
          user,
        },
      })
    } catch (error) {
      clearAuthCookies(res)
      const message = error instanceof Error ? error.message : "Failed to renew session"
      res.status(401).json({
        status: "error",
        message,
      })
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          status: "error",
          message: "Not authenticated",
        })
        return
      }

      const user = await UserService.getUserById(req.user.userId)
      if (!user) {
        clearAuthCookies(res)
        res.status(404).json({
          status: "error",
          message: "User account no longer exists",
        })
        return
      }

      res.status(200).json({
        status: "success",
        data: {
          user,
        },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch user session"
      res.status(500).json({
        status: "error",
        message,
      })
    }
  }
}
