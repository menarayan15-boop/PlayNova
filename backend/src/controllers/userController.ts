import { Request, Response } from "express"
import { UserService } from "../services/userService.js"

export class UserController {
  /**
   * GET /api/v1/users/me
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: "error", message: "Not authenticated" })
        return
      }

      const user = await UserService.getUserById(req.user.userId)
      if (!user) {
        res.status(404).json({ status: "error", message: "User not found" })
        return
      }

      res.status(200).json({
        status: "success",
        data: { user },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load profile"
      res.status(500).json({ status: "error", message })
    }
  }

  /**
   * PATCH /api/v1/users/me
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: "error", message: "Not authenticated" })
        return
      }

      const { fullName, avatarUrl } = req.body
      const updated = await UserService.updateProfile(req.user.userId, { fullName, avatarUrl })

      res.status(200).json({
        status: "success",
        message: "Profile updated successfully",
        data: { user: updated },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update profile"
      res.status(400).json({ status: "error", message })
    }
  }

  /**
   * PATCH /api/v1/users/me/password
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: "error", message: "Not authenticated" })
        return
      }

      const { currentPassword, newPassword } = req.body
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          status: "error",
          message: "Both current password and new password are required",
        })
        return
      }

      await UserService.changePassword(req.user.userId, currentPassword, newPassword)

      res.status(200).json({
        status: "success",
        message: "Password changed successfully. All other device sessions have been revoked.",
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to change password"
      res.status(400).json({ status: "error", message })
    }
  }

  /**
   * GET /api/v1/users/me/preferences
   */
  static async getPreferences(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: "error", message: "Not authenticated" })
        return
      }

      const preferences = await UserService.getPreferences(req.user.userId)
      res.status(200).json({
        status: "success",
        data: { preferences },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch preferences"
      res.status(500).json({ status: "error", message })
    }
  }

  /**
   * PATCH /api/v1/users/me/preferences
   */
  static async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ status: "error", message: "Not authenticated" })
        return
      }

      const updated = await UserService.updatePreferences(req.user.userId, req.body)
      res.status(200).json({
        status: "success",
        message: "Preferences updated",
        data: { preferences: updated },
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update preferences"
      res.status(400).json({ status: "error", message })
    }
  }
}

