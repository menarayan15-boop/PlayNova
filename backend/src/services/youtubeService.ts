import { config } from "../config/env.js"
import { Video, VideoCategoryType, VALID_VIDEO_CATEGORIES } from "../models/Video.js"
import { VideoDTO } from "./videoService.js"
import { isDatabaseConnected } from "../config/db.js"
import { logger } from "../utils/logger.js"

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3"

export interface YouTubeCategoryMeta {
  name: VideoCategoryType
  slug: string
  query: string
  youtubeCategoryId?: string
  durationFilter?: "short" | "medium" | "long" | "any"
  description: string
}

export const YOUTUBE_CATEGORIES: YouTubeCategoryMeta[] = [
  {
    name: "Gaming",
    slug: "gaming",
    query: "gaming gameplay review esports",
    youtubeCategoryId: "20",
    description: "Gameplay showcases, developer deep-dives, and gaming highlights.",
  },
  {
    name: "Music",
    slug: "music",
    query: "official music video live session",
    youtubeCategoryId: "10",
    description: "Official music videos, live acoustic performances, and concerts.",
  },
  {
    name: "Movies and Trailers",
    slug: "movies-and-trailers",
    query: "official movie trailer cinema teaser",
    description: "Official theatrical trailers, teasers, and film previews.",
  },
  {
    name: "Entertainment",
    slug: "entertainment",
    query: "entertainment showcase pop culture",
    youtubeCategoryId: "24",
    description: "Trending entertainment, behind-the-scenes features, and shows.",
  },
  {
    name: "Comedy",
    slug: "comedy",
    query: "stand up comedy sketch",
    youtubeCategoryId: "23",
    description: "Stand-up sets, sketches, and lighthearted comedic storytelling.",
  },
  {
    name: "Technology",
    slug: "technology",
    query: "technology innovation hardware review",
    youtubeCategoryId: "28",
    description: "Hardware breakthroughs, consumer tech reviews, and engineering.",
  },
  {
    name: "AI and Programming",
    slug: "ai-and-programming",
    query: "artificial intelligence software engineering coding tutorial",
    description: "AI research breakdowns, web development, and software engineering.",
  },
  {
    name: "Science",
    slug: "science",
    query: "science explained physics biology discovery",
    youtubeCategoryId: "28",
    description: "Physics, biology, chemistry, and scientific explainers.",
  },
  {
    name: "Space",
    slug: "space",
    query: "space astronomy telescope astrophysics",
    description: "Space exploration, cosmology, rockets, and deep-space missions.",
  },
  {
    name: "Nature",
    slug: "nature",
    query: "nature wildlife earth documentary 4k",
    youtubeCategoryId: "15",
    description: "Wildlife cinematography, oceans, forests, and Earth's ecosystems.",
  },
  {
    name: "Travel and Vlogs",
    slug: "travel-and-vlogs",
    query: "travel vlog cinematic city guide",
    youtubeCategoryId: "19",
    description: "Destination guides, cultural journeys, and visual travelogues.",
  },
  {
    name: "Food and Cooking",
    slug: "food-and-cooking",
    query: "cooking recipe culinary chef technique",
    description: "Chef techniques, global recipes, and culinary craft.",
  },
  {
    name: "Fitness",
    slug: "fitness",
    query: "fitness workout mobility training",
    description: "Guided workouts, athletic conditioning, and wellness routines.",
  },
  {
    name: "Sports",
    slug: "sports",
    query: "sports highlights tactical analysis",
    youtubeCategoryId: "17",
    description: "Match highlights, athletic stories, and tactical breakdowns.",
  },
  {
    name: "Podcasts",
    slug: "podcasts",
    query: "video podcast interview conversation",
    description: "Long-form interviews, creator conversations, and panel discussions.",
  },
  {
    name: "Education",
    slug: "education",
    query: "education lecture university explainer",
    youtubeCategoryId: "27",
    description: "Structured lectures, STEM learning, and visual deep-dives.",
  },
  {
    name: "News",
    slug: "news",
    query: "world news science technology report",
    youtubeCategoryId: "25",
    description: "Current affairs, investigative reporting, and global briefings.",
  },
  {
    name: "Documentaries",
    slug: "documentaries",
    query: "mini documentary history science investigation",
    description: "Investigative documentaries covering history, engineering, and culture.",
  },
  {
    name: "Short Videos",
    slug: "short-videos",
    query: "quick science tech creative highlights",
    durationFilter: "short",
    description: "Bite-sized vertical and short-duration embeddable videos.",
  },
]

export class YouTubeApiError extends Error {
  statusCode: number
  code: string

  constructor(statusCode: number, code: string, message: string) {
    super(message)
    this.statusCode = statusCode
    this.code = code
  }
}

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export interface YouTubeSearchOptions {
  query?: string
  category?: string
  uploadDate?: "today" | "week" | "month" | "year" | "any"
  duration?: "short" | "medium" | "long" | "any"
  order?: "relevance" | "date" | "viewCount" | "rating"
  regionCode?: string
  relevanceLanguage?: string
  pageToken?: string
  maxResults?: number
}

export interface YouTubePaginatedResult {
  items: VideoDTO[]
  nextPageToken: string | null
  prevPageToken: string | null
  totalResults: number
  cached: boolean
}

const YT_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/

/**
 * Parse ISO 8601 duration (e.g. PT1H4M12S, PT45S) into seconds
 */
export function parseIso8601Duration(iso?: string): number {
  if (!iso || typeof iso !== "string") return 0
  const match = iso.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) return 0
  const hours = parseInt(match[1] || "0", 10)
  const mins = parseInt(match[2] || "0", 10)
  const secs = parseInt(match[3] || "0", 10)
  return hours * 3600 + mins * 60 + secs
}

function pickBestThumbnail(thumbnails: any, videoId: string): string {
  return (
    thumbnails?.maxres?.url ||
    thumbnails?.standard?.url ||
    thumbnails?.high?.url ||
    thumbnails?.medium?.url ||
    thumbnails?.default?.url ||
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
  )
}

function mapYouTubeCategoryIdToPlayNova(ytCatId?: string, fallback: VideoCategoryType = "Entertainment"): VideoCategoryType {
  const map: Record<string, VideoCategoryType> = {
    "1": "Movies and Trailers",
    "10": "Music",
    "15": "Nature",
    "17": "Sports",
    "19": "Travel and Vlogs",
    "20": "Gaming",
    "22": "Entertainment",
    "23": "Comedy",
    "24": "Entertainment",
    "25": "News",
    "26": "Education",
    "27": "Education",
    "28": "Technology",
  }
  return (ytCatId && map[ytCatId]) || fallback
}

function computePublishedAfter(uploadDate?: string): string | undefined {
  if (!uploadDate || uploadDate === "any") return undefined
  const now = Date.now()
  const msMap: Record<string, number> = {
    today: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
  }
  const offset = msMap[uploadDate]
  return offset ? new Date(now - offset).toISOString() : undefined
}

export class YouTubeService {
  private static cache = new Map<string, CacheEntry<any>>()
  private static inFlight = new Map<string, Promise<any>>()
  private static paginationSeen = new Map<string, { ids: Set<string>; expiresAt: number }>()

  // Quota tracking (resets automatically at UTC midnight)
  private static quotaDay = new Date().toISOString().slice(0, 10)
  private static quotaUnitsUsed = 0
  private static cacheHits = 0
  private static apiCalls = 0
  private static quotaExceededFlag = false

  static isConfigured(): boolean {
    return Boolean(config.youtubeApiKey && config.youtubeApiKey.length >= 16)
  }

  private static resetQuotaIfNewDay(): void {
    const today = new Date().toISOString().slice(0, 10)
    if (today !== this.quotaDay) {
      this.quotaDay = today
      this.quotaUnitsUsed = 0
      this.quotaExceededFlag = false
    }
  }

  private static trackQuota(units: number): void {
    this.resetQuotaIfNewDay()
    this.quotaUnitsUsed += units
    this.apiCalls++
  }

  static getStatus() {
    this.resetQuotaIfNewDay()
    return {
      configured: this.isConfigured(),
      regionCode: config.youtubeRegionCode,
      quota: {
        dayUtc: this.quotaDay,
        estimatedUnitsUsed: this.quotaUnitsUsed,
        dailyLimit: config.youtubeDailyQuotaLimit,
        quotaExceeded: this.quotaExceededFlag,
      },
      cache: {
        entries: this.cache.size,
        hits: this.cacheHits,
        apiCalls: this.apiCalls,
      },
      categoriesCount: YOUTUBE_CATEGORIES.length,
    }
  }

  static findCategoryMeta(nameOrSlug?: string): YouTubeCategoryMeta | undefined {
    if (!nameOrSlug) return undefined
    const needle = nameOrSlug.trim().toLowerCase()
    return YOUTUBE_CATEGORIES.find(
      (c) => c.name.toLowerCase() === needle || c.slug === needle
    )
  }

  private static getCached<T>(key: string): T | null {
    const hit = this.cache.get(key)
    if (!hit) return null
    if (hit.expiresAt <= Date.now()) {
      this.cache.delete(key)
      return null
    }
    this.cacheHits++
    return hit.value as T
  }

  private static setCached<T>(key: string, value: T, ttlMs: number): void {
    // Keep cache bounded to 400 entries to protect server RAM
    if (this.cache.size >= 400) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) this.cache.delete(oldestKey)
    }
    this.cache.set(key, { value, expiresAt: Date.now() + ttlMs })
  }

  /**
   * Execute deduplicated YouTube Data API v3 GET request with quota & error handling
   */
  private static async callYouTubeApi(
    endpoint: string,
    params: Record<string, string>,
    quotaCost: number
  ): Promise<any> {
    if (!this.isConfigured()) {
      throw new YouTubeApiError(
        503,
        "YOUTUBE_API_KEY_MISSING",
        "YouTube Data API v3 is not configured. Set YOUTUBE_API_KEY in backend/.env to enable live YouTube discovery."
      )
    }

    this.resetQuotaIfNewDay()
    if (this.quotaExceededFlag || this.quotaUnitsUsed + quotaCost > config.youtubeDailyQuotaLimit) {
      throw new YouTubeApiError(
        429,
        "YOUTUBE_QUOTA_EXCEEDED",
        "Daily YouTube Data API quota limit reached. Showing cached or PlayNova library videos instead."
      )
    }

    const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`)
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") {
        url.searchParams.set(k, v)
      }
    }
    url.searchParams.set("key", config.youtubeApiKey)

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 10000)

    try {
      const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      })
      clearTimeout(timer)

      const json: any = await res.json().catch(() => ({}))

      if (!res.ok) {
        const reason = json?.error?.errors?.[0]?.reason || ""
        const apiMessage = json?.error?.message || `YouTube API returned HTTP ${res.status}`

        if (
          res.status === 403 &&
          (reason === "quotaExceeded" || reason === "dailyLimitExceeded" || reason === "rateLimitExceeded")
        ) {
          this.quotaExceededFlag = true
          logger.warn("YouTube Data API quota exceeded", { reason })
          throw new YouTubeApiError(
            429,
            "YOUTUBE_QUOTA_EXCEEDED",
            "YouTube API daily quota has been reached. Please try again later."
          )
        }

        if (res.status === 400 || res.status === 403) {
          logger.warn("YouTube Data API rejected request", { status: res.status, reason })
          throw new YouTubeApiError(
            res.status === 403 ? 503 : 400,
            reason || "YOUTUBE_API_ERROR",
            apiMessage.replace(config.youtubeApiKey, "[REDACTED]")
          )
        }

        throw new YouTubeApiError(502, "YOUTUBE_UPSTREAM_ERROR", "YouTube API temporarily unavailable.")
      }

      this.trackQuota(quotaCost)
      return json
    } catch (err: any) {
      clearTimeout(timer)
      if (err instanceof YouTubeApiError) throw err
      if (err?.name === "AbortError") {
        throw new YouTubeApiError(504, "YOUTUBE_TIMEOUT", "YouTube API request timed out.")
      }
      throw new YouTubeApiError(502, "YOUTUBE_NETWORK_ERROR", "Unable to reach YouTube Data API.")
    }
  }

  /**
   * Transform a verified YouTube `videos.list` item into PlayNova's unified VideoDTO
   */
  private static toPlayNovaVideoDTO(
    item: any,
    categoryOverride?: VideoCategoryType,
    regionCode = config.youtubeRegionCode
  ): VideoDTO | null {
    const ytId = typeof item?.id === "string" ? item.id : item?.id?.videoId
    if (!ytId || !YT_ID_REGEX.test(ytId)) return null

    // Verify playback & embed availability strictly
    const status = item.status || {}
    if (status.embeddable === false) return null
    if (status.privacyStatus && status.privacyStatus !== "public") return null
    if (status.uploadStatus && status.uploadStatus === "rejected") return null

    // Check region restrictions
    const regionRestriction = item.contentDetails?.regionRestriction
    if (regionRestriction) {
      if (Array.isArray(regionRestriction.blocked) && regionRestriction.blocked.includes(regionCode)) {
        return null
      }
      if (Array.isArray(regionRestriction.allowed) && !regionRestriction.allowed.includes(regionCode)) {
        return null
      }
    }

    const snippet = item.snippet || {}
    const duration = parseIso8601Duration(item.contentDetails?.duration)
    const views = parseInt(item.statistics?.viewCount || "0", 10) || 0
    const category = categoryOverride || mapYouTubeCategoryIdToPlayNova(snippet.categoryId, "Entertainment")
    const isShortForm = category === "Short Videos" || (duration > 0 && duration <= 65)

    const rawTags: string[] = Array.isArray(snippet.tags) ? snippet.tags : []
    const tags = Array.from(
      new Set([
        category.toLowerCase(),
        ...rawTags.map((t) => String(t).trim().toLowerCase()).filter((t) => t.length >= 2 && t.length <= 28),
        "youtube",
      ])
    ).slice(0, 8)

    return {
      id: `yt_${ytId}`,
      title: String(snippet.title || "Untitled Video").trim().slice(0, 220),
      description: String(snippet.description || snippet.title || "").trim().slice(0, 1200),
      videoUrl: `https://www.youtube.com/watch?v=${ytId}`,
      normalizedSourceUrl: `https://www.youtube.com/watch?v=${ytId}`,
      sourceType: "youtube",
      externalVideoId: ytId,
      channelTitle: snippet.channelTitle || "YouTube Creator",
      channelId: snippet.channelId || undefined,
      embeddable: true,
      isShortForm,
      thumbnailUrl: pickBestThumbnail(snippet.thumbnails, ytId),
      duration,
      category,
      categories: [category],
      views,
      featured: false,
      quality: [item.contentDetails?.definition === "hd" ? "1080p" : "720p"],
      tags,
      sourceProvider: "YouTube",
      sourceAttribution: snippet.channelTitle ? `${snippet.channelTitle} (via YouTube)` : "YouTube",
      license: status.license === "creativeCommon" ? "Creative Commons (YouTube)" : "Standard YouTube Embed License",
      status: "published",
      validationStatus: "verified",
      createdAt: snippet.publishedAt || new Date().toISOString(),
    } as VideoDTO
  }

  /**
   * Batch hydrate raw YouTube video IDs via single 1-unit `videos.list` call to verify embeddability, duration, and stats
   */
  private static async hydrateVideoIds(
    videoIds: string[],
    categoryOverride?: VideoCategoryType,
    regionCode = config.youtubeRegionCode
  ): Promise<VideoDTO[]> {
    const uniqueIds = Array.from(new Set(videoIds.filter((id) => YT_ID_REGEX.test(id)))).slice(0, 50)
    if (uniqueIds.length === 0) return []

    const json = await this.callYouTubeApi(
      "videos",
      {
        part: "snippet,contentDetails,statistics,status",
        id: uniqueIds.join(","),
        maxResults: String(uniqueIds.length),
      },
      1
    )

    const out: VideoDTO[] = []
    const seen = new Set<string>()
    for (const item of json.items || []) {
      const dto = this.toPlayNovaVideoDTO(item, categoryOverride, regionCode)
      if (dto && !seen.has(dto.id)) {
        seen.add(dto.id)
        out.push(dto)
      }
    }
    return out
  }

  /**
   * Smart YouTube Search (type=video, videoEmbeddable=true, cached 15m, query deduplicated)
   * Does NOT write search results to MongoDB!
   */
  static async searchVideos(options: YouTubeSearchOptions = {}): Promise<YouTubePaginatedResult> {
    const cleanQuery = (options.query || "").trim()
    const catMeta = this.findCategoryMeta(options.category)
    const effectiveQuery = cleanQuery || catMeta?.query || "science technology nature music"
    const effectiveDuration =
      options.duration && options.duration !== "any"
        ? options.duration
        : catMeta?.durationFilter || "any"
    const effectiveOrder = options.order || "relevance"
    const regionCode = (options.regionCode || config.youtubeRegionCode || "US").toUpperCase()
    const relevanceLanguage = (options.relevanceLanguage || "en").toLowerCase()
    const maxResults = Math.max(1, Math.min(25, options.maxResults || 12))
    const publishedAfter = computePublishedAfter(options.uploadDate)

    const baseChainKey = JSON.stringify({
      fn: "search",
      q: effectiveQuery.toLowerCase(),
      cat: catMeta?.slug || "",
      dur: effectiveDuration,
      order: effectiveOrder,
      pub: options.uploadDate || "any",
      reg: regionCode,
      lang: relevanceLanguage,
    })

    const cacheKey = JSON.stringify({
      base: baseChainKey,
      pt: options.pageToken || "",
      max: maxResults,
    })

    const cached = this.getCached<YouTubePaginatedResult>(cacheKey)
    if (cached) {
      return { ...cached, cached: true }
    }

    // Deduplicate identical concurrent in-flight requests
    const existingFlight = this.inFlight.get(cacheKey)
    if (existingFlight) {
      return existingFlight
    }

    const work = (async (): Promise<YouTubePaginatedResult> => {
      const params: Record<string, string> = {
        part: "snippet",
        type: "video",
        videoEmbeddable: "true",
        safeSearch: "moderate",
        q: effectiveQuery,
        order: effectiveOrder,
        regionCode,
        relevanceLanguage,
        maxResults: String(maxResults),
      }
      if (catMeta?.youtubeCategoryId && !cleanQuery) {
        params.videoCategoryId = catMeta.youtubeCategoryId
      }
      if (effectiveDuration !== "any") {
        params.videoDuration = effectiveDuration
      }
      if (publishedAfter) {
        params.publishedAfter = publishedAfter
      }
      if (options.pageToken) {
        params.pageToken = options.pageToken
      }

      const searchJson = await this.callYouTubeApi("search", params, 100)
      const rawIds: string[] = (searchJson.items || [])
        .map((it: any) => it?.id?.videoId)
        .filter((id: unknown): id is string => typeof id === "string")

      const hydrated = await this.hydrateVideoIds(rawIds, catMeta?.name, regionCode)

      // Prevent YouTube search.list cross-page repeats across pageToken pagination
      let chainEntry = this.paginationSeen.get(baseChainKey)
      if (!options.pageToken || !chainEntry || chainEntry.expiresAt <= Date.now()) {
        chainEntry = { ids: new Set<string>(), expiresAt: Date.now() + 15 * 60 * 1000 }
        this.paginationSeen.set(baseChainKey, chainEntry)
      }

      const dedupedItems = hydrated.filter((v) => {
        if (chainEntry!.ids.has(v.id)) return false
        chainEntry!.ids.add(v.id)
        return true
      })

      const result: YouTubePaginatedResult = {
        items: dedupedItems,
        nextPageToken: searchJson.nextPageToken || null,
        prevPageToken: searchJson.prevPageToken || null,
        totalResults: searchJson.pageInfo?.totalResults || dedupedItems.length,
        cached: false,
      }

      this.setCached(cacheKey, result, 15 * 60 * 1000) // 15 min cache
      return result
    })()

    this.inFlight.set(cacheKey, work)
    try {
      return await work
    } finally {
      this.inFlight.delete(cacheKey)
    }
  }

  /**
   * Fetch YouTube Trending (`chart=mostPopular`) — costs only 1 quota unit! Cached 30m.
   */
  static async getTrending(options: {
    regionCode?: string
    category?: string
    pageToken?: string
    maxResults?: number
  } = {}): Promise<YouTubePaginatedResult> {
    const regionCode = (options.regionCode || config.youtubeRegionCode || "US").toUpperCase()
    const catMeta = this.findCategoryMeta(options.category)
    const maxResults = Math.max(1, Math.min(25, options.maxResults || 12))

    const cacheKey = JSON.stringify({
      fn: "trending",
      reg: regionCode,
      cat: catMeta?.youtubeCategoryId || "all",
      pt: options.pageToken || "",
      max: maxResults,
    })

    const cached = this.getCached<YouTubePaginatedResult>(cacheKey)
    if (cached) return { ...cached, cached: true }

    const existingFlight = this.inFlight.get(cacheKey)
    if (existingFlight) return existingFlight

    const work = (async (): Promise<YouTubePaginatedResult> => {
      const params: Record<string, string> = {
        part: "snippet,contentDetails,statistics,status",
        chart: "mostPopular",
        regionCode,
        maxResults: String(maxResults),
      }
      if (catMeta?.youtubeCategoryId) {
        params.videoCategoryId = catMeta.youtubeCategoryId
      }
      if (options.pageToken) {
        params.pageToken = options.pageToken
      }

      const json = await this.callYouTubeApi("videos", params, 1)
      const items: VideoDTO[] = []
      const seen = new Set<string>()
      for (const raw of json.items || []) {
        const dto = this.toPlayNovaVideoDTO(raw, catMeta?.name, regionCode)
        if (dto && !seen.has(dto.id)) {
          seen.add(dto.id)
          items.push(dto)
        }
      }

      const result: YouTubePaginatedResult = {
        items,
        nextPageToken: json.nextPageToken || null,
        prevPageToken: json.prevPageToken || null,
        totalResults: json.pageInfo?.totalResults || items.length,
        cached: false,
      }

      this.setCached(cacheKey, result, 30 * 60 * 1000) // 30 min cache
      return result
    })()

    this.inFlight.set(cacheKey, work)
    try {
      return await work
    } finally {
      this.inFlight.delete(cacheKey)
    }
  }

  /**
   * Fetch cached Short Videos discovery feed (labeled honestly as Short Videos)
   */
  static async getShortVideos(pageToken?: string, maxResults = 12): Promise<YouTubePaginatedResult> {
    return this.searchVideos({
      category: "Short Videos",
      duration: "short",
      order: "viewCount",
      pageToken,
      maxResults,
    })
  }

  /**
   * Fetch a single YouTube video by 11-char ID (1 quota unit, 60m cache)
   */
  static async getVideoByYouTubeId(
    ytId: string,
    regionCode = config.youtubeRegionCode
  ): Promise<VideoDTO | null> {
    if (!YT_ID_REGEX.test(ytId)) return null

    const cacheKey = `yt_video:${ytId}:${regionCode}`
    const cached = this.getCached<VideoDTO>(cacheKey)
    if (cached) return cached

    // Check MongoDB if recently synced (< 24h)
    if (isDatabaseConnected()) {
      const existing = await Video.findOne({
        sourceType: "youtube",
        externalVideoId: ytId,
      })
        .maxTimeMS(4000)
        .lean()

      if (existing && existing.lastSyncedAt) {
        const ageMs = Date.now() - new Date(existing.lastSyncedAt).getTime()
        if (ageMs < 24 * 60 * 60 * 1000 || !this.isConfigured()) {
          const dto: VideoDTO = {
            id: String(existing._id),
            title: existing.title,
            description: existing.description,
            videoUrl: existing.videoUrl,
            normalizedSourceUrl: existing.normalizedSourceUrl,
            thumbnailUrl: existing.thumbnailUrl,
            duration: existing.duration,
            category: existing.category,
            categories: existing.categories,
            views: existing.views,
            featured: existing.featured,
            quality: existing.quality,
            tags: existing.tags,
            sourceProvider: existing.sourceProvider,
            sourceAttribution: existing.sourceAttribution,
            license: existing.license,
            status: existing.status,
            validationStatus: existing.validationStatus,
            createdAt: existing.createdAt?.toISOString?.() || undefined,
            ...({
              sourceType: "youtube",
              externalVideoId: existing.externalVideoId,
              channelTitle: existing.channelTitle,
              channelId: existing.channelId,
              embeddable: existing.embeddable,
              isShortForm: existing.isShortForm,
            } as any),
          }
          this.setCached(cacheKey, dto, 60 * 60 * 1000)
          return dto
        }
      }
    }

    if (!this.isConfigured()) return null

    const items = await this.hydrateVideoIds([ytId], undefined, regionCode)
    const video = items[0] || null
    if (video) {
      this.setCached(cacheKey, video, 60 * 60 * 1000)
    }
    return video
  }

  /**
   * Persist a YouTube video record idempotently to MongoDB when a user watches or saves it
   * Uses canonical unique key (sourceType="youtube", externalVideoId=ytId)
   */
  static async ensurePersistedYouTubeVideo(ytId: string): Promise<VideoDTO | null> {
    if (!YT_ID_REGEX.test(ytId)) return null
    const dto = await this.getVideoByYouTubeId(ytId)
    if (!dto) return null

    if (isDatabaseConnected()) {
      const anyDto = dto as any
      const safeCategory = VALID_VIDEO_CATEGORIES.includes(dto.category) ? dto.category : "Entertainment"

      await Video.findOneAndUpdate(
        { sourceType: "youtube", externalVideoId: ytId },
        {
          $setOnInsert: {
            _id: `yt_${ytId}`,
            sourceType: "youtube",
            externalVideoId: ytId,
            sourceKey: `youtube:${ytId}`,
          },
          $set: {
            title: dto.title,
            description: dto.description || dto.title,
            videoUrl: `https://www.youtube.com/watch?v=${ytId}`,
            normalizedSourceUrl: `https://www.youtube.com/watch?v=${ytId}`,
            thumbnailUrl: dto.thumbnailUrl,
            duration: dto.duration,
            category: safeCategory,
            categories: [safeCategory],
            views: dto.views || 0,
            tags: dto.tags || ["youtube"],
            channelTitle: anyDto.channelTitle || "YouTube Creator",
            channelId: anyDto.channelId,
            embeddable: true,
            isShortForm: Boolean(anyDto.isShortForm),
            sourceProvider: "YouTube",
            sourceAttribution: dto.sourceAttribution || "YouTube",
            license: dto.license || "Standard YouTube Embed License",
            status: "published",
            validationStatus: "verified",
            validatedAt: new Date(),
            lastSyncedAt: new Date(),
          },
        },
        { upsert: true, new: true }
      ).maxTimeMS(4000)
    }

    return dto
  }

  /**
   * Quota-efficient YouTube Dynamic Homepage Feed with strict cross-section deduplication
   * Uses low-cost `chart=mostPopular` (1 unit each) across key categories + cached Short Videos!
   */
  static async getYouTubeHomepageFeed(regionCode = config.youtubeRegionCode) {
    const cacheKey = `yt_homepage:${regionCode}`
    const cached = this.getCached<any>(cacheKey)
    if (cached) return { ...cached, cached: true }

    const usedIds = new Set<string>()
    const claim = (list: VideoDTO[], max: number): VideoDTO[] => {
      const picked: VideoDTO[] = []
      for (const v of list) {
        if (usedIds.has(v.id)) continue
        usedIds.add(v.id)
        picked.push(v)
        if (picked.length >= max) break
      }
      return picked
    }

    // Use `chart=mostPopular` (1 unit per category!) to keep quota usage tiny (~6 units total!)
    const [overallTrending, gaming, music, entertainment, techScience] = await Promise.all([
      this.getTrending({ regionCode, maxResults: 20 }).catch(() => ({ items: [] as VideoDTO[] })),
      this.getTrending({ regionCode, category: "Gaming", maxResults: 8 }).catch(() => ({ items: [] as VideoDTO[] })),
      this.getTrending({ regionCode, category: "Music", maxResults: 8 }).catch(() => ({ items: [] as VideoDTO[] })),
      this.getTrending({ regionCode, category: "Entertainment", maxResults: 8 }).catch(() => ({ items: [] as VideoDTO[] })),
      this.getTrending({ regionCode, category: "Technology", maxResults: 8 }).catch(() => ({ items: [] as VideoDTO[] })),
    ])

    const featured = claim(overallTrending.items, 4)
    const trending = claim(overallTrending.items, 4)
    const latestUploads = claim(
      [...overallTrending.items].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      ),
      4
    )

    const categoryRows = [
      { category: "Gaming" as VideoCategoryType, items: claim(gaming.items, 4) },
      { category: "Music" as VideoCategoryType, items: claim(music.items, 4) },
      { category: "Entertainment" as VideoCategoryType, items: claim(entertainment.items, 4) },
      { category: "Technology" as VideoCategoryType, items: claim(techScience.items, 4) },
    ].filter((r) => r.items.length > 0)

    // Short Videos (only fetched if quota allows)
    const shortsRes = await this.getShortVideos(undefined, 8).catch(() => ({ items: [] as VideoDTO[] }))
    const shortVideos = claim(shortsRes.items, 6)

    const payload = {
      configured: true,
      featured,
      trending,
      latestUploads,
      categoryRows,
      shortVideos,
      uniqueCount: usedIds.size,
      cached: false,
    }

    this.setCached(cacheKey, payload, 25 * 60 * 1000)
    return payload
  }
}

