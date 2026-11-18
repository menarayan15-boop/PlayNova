import { Notification, INotification, NotificationDTO } from "../models/Notification.js"
import { isDatabaseConnected } from "../config/db.js"

// In-Memory fallback store
const inMemoryNotifications: Map<string, any[]> = new Map()

function toNotificationDTO(doc: any): NotificationDTO {
  return {
    id: String(doc._id || doc.id),
    userId: doc.userId,
    title: doc.title,
    message: doc.message,
    type: doc.type || "system",
    link: doc.link || "",
    read: Boolean(doc.read),
    createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : String(doc.createdAt),
  }
}

export class NotificationService {
  /**
   * Seed welcome & initial tip notifications for new or empty accounts
   */
  static async ensureDefaultNotifications(userId: string, userName?: string): Promise<void> {
    if (!userId) return

    const count = await this.getNotificationCount(userId)
    if (count > 0) return

    const welcomeTitle = userName ? `Welcome to PlayNova, ${userName.split(" ")[0]}!` : "Welcome to PlayNova!"
    const defaultNotes = [
      {
        userId,
        title: welcomeTitle,
        message: "Your cinematic streaming canvas is ready. Discover curated 4K UHD masterpieces with seamless HTML5 controls.",
        type: "system" as const,
        link: "/explore",
        read: false,
      },
      {
        userId,
        title: "Recommended for You: Deep Space Exploration",
        message: "Based on trending community interest in astrophysics, check out Cosmic Horizons in stunning clarity.",
        type: "recommendation" as const,
        link: "/watch?id=nova-01",
        read: false,
      },
    ]

    if (isDatabaseConnected()) {
      try {
        await Notification.insertMany(defaultNotes)
        return
      } catch (err) {
        console.warn("[NotificationService] Mongo insert error:", err)
      }
    }

    const memList = inMemoryNotifications.get(userId) || []
    defaultNotes.forEach((n, idx) => {
      memList.push({ ...n, _id: `mem-notif-${Date.now()}-${idx}`, createdAt: new Date() })
    })
    inMemoryNotifications.set(userId, memList)
  }

  static async getNotificationCount(userId: string): Promise<number> {
    if (isDatabaseConnected()) {
      try {
        return await Notification.countDocuments({ userId })
      } catch {
        // fallback
      }
    }
    return (inMemoryNotifications.get(userId) || []).length
  }

  /**
   * Get all notifications for user
   */
  static async getUserNotifications(userId: string): Promise<{ items: NotificationDTO[]; unreadCount: number }> {
    await this.ensureDefaultNotifications(userId)

    if (isDatabaseConnected()) {
      try {
        const docs = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(30).lean()
        const items = docs.map(toNotificationDTO)
        const unreadCount = items.filter((n) => !n.read).length
        return { items, unreadCount }
      } catch (err) {
        console.warn("[NotificationService] Mongo query error:", err)
      }
    }

    const memList = inMemoryNotifications.get(userId) || []
    const items = [...memList].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(toNotificationDTO)
    return {
      items,
      unreadCount: items.filter((n) => !n.read).length,
    }
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    if (isDatabaseConnected()) {
      try {
        const res = await Notification.updateOne({ _id: notificationId, userId }, { $set: { read: true } })
        return res.modifiedCount > 0
      } catch (err) {
        console.warn("[NotificationService] markAsRead error:", err)
      }
    }

    const memList = inMemoryNotifications.get(userId) || []
    const target = memList.find((n) => String(n._id || n.id) === notificationId)
    if (target) {
      target.read = true
      return true
    }
    return false
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string): Promise<number> {
    if (isDatabaseConnected()) {
      try {
        const res = await Notification.updateMany({ userId, read: false }, { $set: { read: true } })
        return res.modifiedCount
      } catch (err) {
        console.warn("[NotificationService] markAllAsRead error:", err)
      }
    }

    const memList = inMemoryNotifications.get(userId) || []
    let modified = 0
    memList.forEach((n) => {
      if (!n.read) {
        n.read = true
        modified++
      }
    })
    return modified
  }

  /**
   * Dismiss/delete a notification
   */
  static async dismissNotification(userId: string, notificationId: string): Promise<boolean> {
    if (isDatabaseConnected()) {
      try {
        const res = await Notification.deleteOne({ _id: notificationId, userId })
        return res.deletedCount > 0
      } catch (err) {
        console.warn("[NotificationService] dismissNotification error:", err)
      }
    }

    const memList = inMemoryNotifications.get(userId) || []
    const initialLen = memList.length
    const filtered = memList.filter((n) => String(n._id || n.id) !== notificationId)
    inMemoryNotifications.set(userId, filtered)
    return filtered.length < initialLen
  }

  /**
   * Create an automated notification
   */
  static async createNotification(
    userId: string,
    title: string,
    message: string,
    type: "recommendation" | "category" | "watchlist" | "system" = "system",
    link?: string
  ): Promise<NotificationDTO> {
    if (isDatabaseConnected()) {
      try {
        const doc = await Notification.create({
          userId,
          title,
          message,
          type,
          link: link || "",
          read: false,
        })
        return toNotificationDTO(doc)
      } catch (err) {
        console.warn("[NotificationService] createNotification Mongo error:", err)
      }
    }

    const memList = inMemoryNotifications.get(userId) || []
    const newEntry = {
      _id: `mem-notif-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      userId,
      title,
      message,
      type,
      link: link || "",
      read: false,
      createdAt: new Date(),
    }
    memList.unshift(newEntry)
    inMemoryNotifications.set(userId, memList)
    return toNotificationDTO(newEntry)
  }
}

