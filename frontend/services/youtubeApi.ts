import { VideoItem, VideoCategory } from "@/types"
import { buildApiUrl } from "@/utils/apiConfig"

export interface YouTubeStatusResponse {
  configured: boolean
  regionCode: string
  quota: {
    dayUtc: string
    estimatedUnitsUsed: number
    dailyLimit: number
    quotaExceeded: boolean
  }
  cache: {
    entries: number
    hits: number
    apiCalls: number
  }
  categoriesCount: number
}

export interface YouTubeSearchParams {
  query?: string
  category?: string
  uploadDate?: "today" | "week" | "month" | "year" | "any"
  duration?: "short" | "medium" | "long" | "any"
  order?: "relevance" | "date" | "viewCount" | "rating"
  regionCode?: string
  lang?: string
  pageToken?: string
  limit?: number
}

export interface YouTubeListResponse {
  ok: boolean
  status: number
  code?: string
  message?: string
  items: VideoItem[]
  nextPageToken: string | null
  prevPageToken: string | null
  totalResults: number
  cached?: boolean
}

export interface YouTubeHomepageResponse {
  configured: boolean
  code?: string
  featured: VideoItem[]
  trending: VideoItem[]
  latestUploads: VideoItem[]
  categoryRows: { category: VideoCategory; items: VideoItem[] }[]
  shortVideos: VideoItem[]
  uniqueCount: number
  cached?: boolean
}

export async function getYouTubeStatusApi(): Promise<YouTubeStatusResponse | null> {
  try {
    const res = await fetch(buildApiUrl("/api/v1/youtube/status"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data || null
  } catch {
    return null
  }
}

export async function getYouTubeHomepageApi(): Promise<YouTubeHomepageResponse | null> {
  try {
    const res = await fetch(buildApiUrl("/api/v1/youtube/homepage"), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    })
    if (!res.ok) return null
    const json = await res.json()
    return json.data || null
  } catch {
    return null
  }
}

export async function searchYouTubeApi(params: YouTubeSearchParams = {}): Promise<YouTubeListResponse> {
  const rawUrl = buildApiUrl("/api/v1/youtube/search")
  const url = new URL(rawUrl, "http://localhost:5001")

  if (params.query) url.searchParams.set("q", params.query)
  if (params.category && params.category !== "All") url.searchParams.set("category", params.category)
  if (params.uploadDate && params.uploadDate !== "any") url.searchParams.set("uploadDate", params.uploadDate)
  if (params.duration && params.duration !== "any") url.searchParams.set("duration", params.duration)
  if (params.order) url.searchParams.set("order", params.order)
  if (params.regionCode) url.searchParams.set("regionCode", params.regionCode)
  if (params.lang) url.searchParams.set("lang", params.lang)
  if (params.pageToken) url.searchParams.set("pageToken", params.pageToken)
  if (params.limit) url.searchParams.set("limit", String(params.limit))

  try {
    const target = rawUrl.startsWith("http") ? url.toString() : `${rawUrl}?${url.searchParams.toString()}`
    const res = await fetch(target, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        code: json?.code,
        message: json?.message || "YouTube search unavailable",
        items: [],
        nextPageToken: null,
        prevPageToken: null,
        totalResults: 0,
      }
    }
    return {
      ok: true,
      status: res.status,
      items: json.data?.items || [],
      nextPageToken: json.data?.nextPageToken || null,
      prevPageToken: json.data?.prevPageToken || null,
      totalResults: json.data?.totalResults || 0,
      cached: json.data?.cached,
    }
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error reaching YouTube search service",
      items: [],
      nextPageToken: null,
      prevPageToken: null,
      totalResults: 0,
    }
  }
}

export async function getYouTubeShortsApi(pageToken?: string, limit = 12): Promise<YouTubeListResponse> {
  const rawUrl = buildApiUrl("/api/v1/youtube/shorts")
  const url = new URL(rawUrl, "http://localhost:5001")
  url.searchParams.set("limit", String(limit))
  if (pageToken) url.searchParams.set("pageToken", pageToken)

  try {
    const target = rawUrl.startsWith("http") ? url.toString() : `${rawUrl}?${url.searchParams.toString()}`
    const res = await fetch(target, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        code: json?.code,
        message: json?.message || "Short Videos feed unavailable",
        items: [],
        nextPageToken: null,
        prevPageToken: null,
        totalResults: 0,
      }
    }
    return {
      ok: true,
      status: res.status,
      items: json.data?.items || [],
      nextPageToken: json.data?.nextPageToken || null,
      prevPageToken: json.data?.prevPageToken || null,
      totalResults: json.data?.totalResults || 0,
      cached: json.data?.cached,
    }
  } catch {
    return {
      ok: false,
      status: 0,
      message: "Network error loading Short Videos",
      items: [],
      nextPageToken: null,
      prevPageToken: null,
      totalResults: 0,
    }
  }
}

export async function getYouTubeRelatedApi(videoId: string): Promise<VideoItem[]> {
  try {
    const res = await fetch(buildApiUrl(`/api/v1/youtube/video/${encodeURIComponent(videoId)}/related`), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.data || []
  } catch {
    return []
  }
}

