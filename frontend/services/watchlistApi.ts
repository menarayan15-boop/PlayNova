import { VideoItem } from "@/types"
import { buildApiUrl } from "@/utils/apiConfig"

export interface WatchlistEntry {
  id: string
  videoId: string
  collectionName?: string
  addedAt: string
  video: VideoItem
}

export interface WatchlistFilterOptions {
  collection?: string
  search?: string
  sort?: "recent" | "alpha" | "duration"
}

function getOptionalAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const token = localStorage.getItem("playnova_token") || localStorage.getItem("token")
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export async function fetchWatchlistApi(options: WatchlistFilterOptions = {}): Promise<WatchlistEntry[]> {
  try {
    const rawUrl = buildApiUrl("/api/v1/watchlist")
    const url = new URL(rawUrl, "http://localhost:5001")
    if (options.collection && options.collection !== "All") {
      url.searchParams.set("collection", options.collection)
    }
    if (options.search) {
      url.searchParams.set("search", options.search)
    }
    if (options.sort) {
      url.searchParams.set("sort", options.sort)
    }

    const fetchTarget = rawUrl.startsWith("http") ? url.toString() : `${rawUrl}?${url.searchParams.toString()}`

    const res = await fetch(fetchTarget, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getOptionalAuthHeader(),
      },
      credentials: "include",
    })

    if (!res.ok) return []
    const data = await res.json()
    return data.data || []
  } catch (err) {
    console.warn("[watchlistApi] fetchWatchlist error:", err)
    return []
  }
}

export async function fetchWatchlistCollectionsApi(): Promise<string[]> {
  try {
    const res = await fetch(buildApiUrl("/api/v1/watchlist/collections"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getOptionalAuthHeader(),
      },
      credentials: "include",
    })

    if (!res.ok) return ["Watch Later", "Favorites"]
    const data = await res.json()
    const raw = data.data || []
    const names = raw
      .map((entry: string | { name?: string }) => (typeof entry === "string" ? entry : entry?.name))
      .filter((name: unknown): name is string => typeof name === "string" && name.trim().length > 0)
    return names.length > 0 ? names : ["Watch Later", "Favorites"]
  } catch (err) {
    console.warn("[watchlistApi] fetchWatchlistCollections error:", err)
    return ["Watch Later", "Favorites"]
  }
}

export async function addToWatchlistApi(
  videoId: string,
  collectionName: string = "Watch Later"
): Promise<WatchlistEntry | null> {
  try {
    const res = await fetch(buildApiUrl("/api/v1/watchlist"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getOptionalAuthHeader(),
      },
      credentials: "include",
      body: JSON.stringify({ videoId, collectionName }),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.data?.item || null
  } catch (err) {
    console.warn("[watchlistApi] addToWatchlist error:", err)
    return null
  }
}

export async function removeFromWatchlistApi(videoId: string, collection?: string): Promise<boolean> {
  try {
    const rawUrl = buildApiUrl(`/api/v1/watchlist/${videoId}`)
    const url = new URL(rawUrl, "http://localhost:5001")
    if (collection) {
      url.searchParams.set("collection", collection)
    }

    const fetchTarget = rawUrl.startsWith("http") ? url.toString() : `${rawUrl}?${url.searchParams.toString()}`

    const res = await fetch(fetchTarget, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...getOptionalAuthHeader(),
      },
      credentials: "include",
    })

    if (!res.ok) return false
    const data = await res.json()
    return data.status === "success"
  } catch (err) {
    console.warn("[watchlistApi] removeFromWatchlist error:", err)
    return false
  }
}

export async function checkWatchlistApi(videoId: string, collection?: string): Promise<boolean> {
  try {
    const rawUrl = buildApiUrl(`/api/v1/watchlist/${videoId}/check`)
    const url = new URL(rawUrl, "http://localhost:5001")
    if (collection) {
      url.searchParams.set("collection", collection)
    }

    const fetchTarget = rawUrl.startsWith("http") ? url.toString() : `${rawUrl}?${url.searchParams.toString()}`

    const res = await fetch(fetchTarget, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getOptionalAuthHeader(),
      },
      credentials: "include",
    })

    if (!res.ok) return false
    const data = await res.json()
    return Boolean(data.data?.inWatchlist)
  } catch (err) {
    return false
  }
}
