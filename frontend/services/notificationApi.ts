import { buildApiUrl } from "@/utils/apiConfig"

export interface NotificationItem {
  id: string
  userId: string
  title: string
  message: string
  type: "recommendation" | "system" | "release" | "watchlist"
  link?: string
  read: boolean
  createdAt: string
}

export interface NotificationsResponse {
  items: NotificationItem[]
  unreadCount: number
}

function getOptionalAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("playnova_token") || localStorage.getItem("token")
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function fetchNotificationsApi(): Promise<NotificationsResponse> {
  try {
    const res = await fetch(buildApiUrl("/api/v1/notifications"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getOptionalAuthHeader(),
      },
      credentials: "include",
    })

    if (!res.ok) return { items: [], unreadCount: 0 }
    const data = await res.json()
    return data.data || { items: [], unreadCount: 0 }
  } catch (err) {
    console.warn("[notificationApi] fetchNotifications error:", err)
    return { items: [], unreadCount: 0 }
  }
}

export async function markNotificationAsReadApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(buildApiUrl(`/api/v1/notifications/${id}/read`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getOptionalAuthHeader(),
      },
      credentials: "include",
    })

    return res.ok
  } catch (err) {
    console.warn("[notificationApi] markNotificationAsRead error:", err)
    return false
  }
}

export async function markAllNotificationsAsReadApi(): Promise<boolean> {
  try {
    const res = await fetch(buildApiUrl("/api/v1/notifications/read-all"), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getOptionalAuthHeader(),
      },
      credentials: "include",
    })

    return res.ok
  } catch (err) {
    console.warn("[notificationApi] markAllNotificationsAsRead error:", err)
    return false
  }
}

export async function dismissNotificationApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(buildApiUrl(`/api/v1/notifications/${id}`), {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getOptionalAuthHeader(),
      },
      credentials: "include",
    })

    return res.ok
  } catch (err) {
    console.warn("[notificationApi] dismissNotification error:", err)
    return false
  }
}
