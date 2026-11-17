import { VideoItem, VideoCategory } from "@/types"
import { buildApiUrl } from "@/utils/apiConfig"

export interface SearchOptions {
  query?: string
  category?: string
  duration?: "short" | "medium" | "long" | "any"
  popularity?: "popular" | "any"
  dateRange?: "week" | "month" | "year" | "any"
  sort?: "relevant" | "recent" | "views" | "alpha"
  page?: number
  limit?: number
}

export interface PaginatedVideosResponse {
  items: VideoItem[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface SearchSuggestionsResponse {
  suggestions: string[]
  videos: VideoItem[]
}

export interface RecommendationOptions {
  limit?: number
  token?: string
}

export async function searchVideosApi(options: SearchOptions): Promise<PaginatedVideosResponse> {
  const rawUrl = buildApiUrl("/api/v1/videos/search")
  const url = new URL(rawUrl, "http://localhost:5001")

  if (options.query) url.searchParams.set("q", options.query)
  if (options.category && options.category !== "All") url.searchParams.set("category", options.category)
  if (options.duration && options.duration !== "any") url.searchParams.set("duration", options.duration)
  if (options.popularity && options.popularity !== "any") url.searchParams.set("popularity", options.popularity)
  if (options.dateRange && options.dateRange !== "any") url.searchParams.set("dateRange", options.dateRange)
  if (options.sort) url.searchParams.set("sort", options.sort)
  if (options.page) url.searchParams.set("page", String(options.page))
  if (options.limit) url.searchParams.set("limit", String(options.limit))

  try {
    const fetchTarget = rawUrl.startsWith("http") ? url.toString() : `${rawUrl}?${url.searchParams.toString()}`
    const res = await fetch(fetchTarget, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
      throw new Error(`Search failed with status: ${res.status}`)
    }

    const data = await res.json()
    if (data.status === "success" && data.data) {
      return data.data
    }
    return { items: [], total: 0, page: 1, limit: 12, totalPages: 0 }
  } catch (err) {
    console.warn("[videoApi] searchVideosApi error:", err)
    return { items: [], total: 0, page: 1, limit: 12, totalPages: 0 }
  }
}

export async function getSearchSuggestionsApi(query: string): Promise<SearchSuggestionsResponse> {
  if (!query || query.trim().length === 0) {
    return { suggestions: [], videos: [] }
  }

  const rawUrl = buildApiUrl("/api/v1/videos/suggestions")
  const url = new URL(rawUrl, "http://localhost:5001")
  url.searchParams.set("q", query.trim())

  try {
    const fetchTarget = rawUrl.startsWith("http") ? url.toString() : `${rawUrl}?${url.searchParams.toString()}`
    const res = await fetch(fetchTarget, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) return { suggestions: [], videos: [] }
    const data = await res.json()
    return data.data || { suggestions: [], videos: [] }
  } catch (err) {
    return { suggestions: [], videos: [] }
  }
}

export async function getRecommendationsApi(options: RecommendationOptions = {}): Promise<VideoItem[]> {
  const rawUrl = buildApiUrl("/api/v1/videos/recommendations")
  const url = new URL(rawUrl, "http://localhost:5001")
  if (options.limit) url.searchParams.set("limit", String(options.limit))

  const token =
    options.token ||
    (typeof window !== "undefined"
      ? localStorage.getItem("playnova_token") || localStorage.getItem("token")
      : null)

  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const fetchTarget = rawUrl.startsWith("http") ? url.toString() : `${rawUrl}?${url.searchParams.toString()}`
    const res = await fetch(fetchTarget, {
      method: "GET",
      headers,
      credentials: "include",
    })

    if (!res.ok) throw new Error("Failed to load recommendations")
    const data = await res.json()
    return data.data || []
  } catch (err) {
    return []
  }
}

export async function getTrendingVideosApi(limit: number = 8): Promise<VideoItem[]> {
  const rawUrl = buildApiUrl("/api/v1/videos/trending")
  const url = new URL(rawUrl, "http://localhost:5001")
  url.searchParams.set("limit", String(limit))

  try {
    const fetchTarget = rawUrl.startsWith("http") ? url.toString() : `${rawUrl}?${url.searchParams.toString()}`
    const res = await fetch(fetchTarget, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) throw new Error("Failed to load trending videos")
    const data = await res.json()
    return data.data || []
  } catch (err) {
    return []
  }
}

export async function getRecentlyAddedVideosApi(limit: number = 8): Promise<VideoItem[]> {
  const rawUrl = buildApiUrl("/api/v1/videos/recent")
  const url = new URL(rawUrl, "http://localhost:5001")
  url.searchParams.set("limit", String(limit))

  try {
    const fetchTarget = rawUrl.startsWith("http") ? url.toString() : `${rawUrl}?${url.searchParams.toString()}`
    const res = await fetch(fetchTarget, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) throw new Error("Failed to load recent videos")
    const data = await res.json()
    return data.data || []
  } catch (err) {
    return []
  }
}
