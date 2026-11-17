import { VideoItem } from "@/types"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"

export interface WatchlistEntry {
  id: string
  videoId: string
  addedAt: string
  video: VideoItem
}

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("playnova_token") || localStorage.getItem("token")
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function fetchWatchlistApi(): Promise<WatchlistEntry[]> {
  try {
    const authHeaders = getAuthHeader()
    if (!authHeaders.Authorization) return []

    const res = await fetch(`${API_BASE_URL}/api/v1/watchlist`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    })

    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch (err) {
    console.warn("[watchlistApi] fetchWatchlist error:", err)
    return []
  }
}

export async function addToWatchlistApi(videoId: string): Promise<WatchlistEntry | null> {
  try {
    const authHeaders = getAuthHeader()
    if (!authHeaders.Authorization) return null

    const res = await fetch(`${API_BASE_URL}/api/v1/watchlist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ videoId }),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.data || null
  } catch (err) {
    console.warn("[watchlistApi] addToWatchlist error:", err)
    return null
  }
}

export async function removeFromWatchlistApi(videoId: string): Promise<boolean> {
  try {
    const authHeaders = getAuthHeader()
    if (!authHeaders.Authorization) return false

    const res = await fetch(`${API_BASE_URL}/api/v1/watchlist/${videoId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    })

    if (!res.ok) return false
    const data = await res.json()
    return data.status === "success"
  } catch (err) {
    console.warn("[watchlistApi] removeFromWatchlist error:", err)
    return false
  }
}

export async function checkWatchlistApi(videoId: string): Promise<boolean> {
  try {
    const authHeaders = getAuthHeader()
    if (!authHeaders.Authorization) return false

    const res = await fetch(`${API_BASE_URL}/api/v1/watchlist/${videoId}/check`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
    })

    if (!res.ok) return false
    const data = await res.json()
    return Boolean(data.data?.inWatchlist)
  } catch (err) {
    return false
  }
}
