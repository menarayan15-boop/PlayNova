import { buildApiUrl } from "@/utils/apiConfig"

export type AnalyticsEventType = "view" | "watch_time" | "complete" | "playback_error"

export interface AnalyticsDashboardData {
  hasData: boolean
  summary: {
    totalViews: number
    uniqueViewers: number
    totalWatchTimeSeconds: number
    averageWatchDurationSeconds: number
    completionRate: number
    totalCompletions: number
    playbackErrors: number
    playbackErrorRate: number
  }
  mostWatchedVideos: {
    videoId: string
    title: string
    category: string
    views: number
    uniqueViewers: number
    watchSeconds: number
    completions: number
    completionRate: number
    errors: number
  }[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  dailyTrends: {
    date: string
    views: number
    completions: number
    watchSeconds: number
    errors: number
  }[]
}

function getOrCreateClientSessionId(): string {
  if (typeof window === "undefined") return "ssr"
  try {
    let id = sessionStorage.getItem("playnova_analytics_sid")
    if (!id) {
      id = `sid_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
      sessionStorage.setItem("playnova_analytics_sid", id)
    }
    return id
  } catch {
    return "anon"
  }
}

export async function recordAnalyticsEventApi(payload: {
  videoId: string
  eventType: AnalyticsEventType
  watchSeconds?: number
  completionPercentage?: number
  errorMessage?: string
}): Promise<void> {
  try {
    await fetch(buildApiUrl("/api/v1/analytics/events"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({
        ...payload,
        sessionId: getOrCreateClientSessionId(),
      }),
    })
  } catch {
    // Non-blocking analytics
  }
}

export async function fetchAnalyticsDashboardApi(options: {
  range?: "7d" | "30d" | "90d" | "all"
  page?: number
  limit?: number
} = {}): Promise<{ ok: boolean; status: number; data?: AnalyticsDashboardData; message?: string }> {
  try {
    const rawUrl = buildApiUrl("/api/v1/analytics/dashboard")
    const url = new URL(rawUrl, "http://localhost:5001")
    if (options.range) url.searchParams.set("range", options.range)
    if (options.page) url.searchParams.set("page", String(options.page))
    if (options.limit) url.searchParams.set("limit", String(options.limit))

    const target = rawUrl.startsWith("http") ? url.toString() : `${rawUrl}?${url.searchParams.toString()}`
    const res = await fetch(target, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })

    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        message: json?.message || "Unable to load analytics dashboard",
      }
    }
    return {
      ok: true,
      status: res.status,
      data: json.data,
    }
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error while loading analytics dashboard",
    }
  }
}

