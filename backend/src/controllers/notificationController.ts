import { Request, Response, NextFunction } from "express"
import { NotificationService } from "../services/notificationService.js"

export class NotificationController {
  /**
   * GET /api/v1/notifications
   */
  static async getNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const userName = (req as any).user?.fullName || (req as any).user?.name
      await NotificationService.ensureDefaultNotifications(userId, userName)

      const result = await NotificationService.getUserNotifications(userId)
      res.status(200).json({
        status: "success",
        data: result,
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /api/v1/notifications/:id/read
   */
  static async markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      const { id } = req.params

      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const success = await NotificationService.markAsRead(userId, id)
      res.status(200).json({
        status: "success",
        message: success ? "Notification marked as read" : "Notification not found or already read",
        data: { success },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * PATCH /api/v1/notifications/read-all
   */
  static async markAllRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const modifiedCount = await NotificationService.markAllAsRead(userId)
      res.status(200).json({
        status: "success",
        message: "All notifications marked as read",
        data: { modifiedCount },
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * DELETE /api/v1/notifications/:id
   */
  static async dismissNotification(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = (req as any).user?.userId || (req as any).user?.id
      const { id } = req.params

      if (!userId) {
        res.status(401).json({ status: "fail", message: "Unauthorized" })
        return
      }

      const dismissed = await NotificationService.dismissNotification(userId, id)
      res.status(200).json({
        status: "success",
        message: dismissed ? "Notification dismissed" : "Notification not found",
        data: { dismissed },
      })
    } catch (error) {
      next(error)
    }
  }
}

