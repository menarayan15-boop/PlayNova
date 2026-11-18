import crypto from "node:crypto"
import {
  Video,
  VideoCategoryType,
  VALID_VIDEO_CATEGORIES,
  VideoPublicationStatus,
  IVideoValidationDetails,
} from "../models/Video.js"
import { WatchProgress } from "../models/WatchProgress.js"
import { UserService } from "./userService.js"
import { isDatabaseConnected } from "../config/db.js"
import { normalizeSourceUrl, validateVideoSource } from "../utils/videoValidation.js"

export interface VideoDTO {
  id: string
  title: string
  description: string
  videoUrl: string
  normalizedSourceUrl?: string
  sourceType?: "native" | "youtube"
  externalVideoId?: string
  channelTitle?: string
  channelId?: string
  embeddable?: boolean
  isShortForm?: boolean
  thumbnailUrl: string
  duration: number
  category: VideoCategoryType
  categories?: VideoCategoryType[]
  views: number
  featured?: boolean
  quality: string[]
  tags: string[]
  sourceProvider?: string
  sourceAttribution?: string
  license?: string
  status?: VideoPublicationStatus
  validationStatus?: "verified" | "pending" | "failed"
  validationDetails?: IVideoValidationDetails
  createdAt?: string
}

export interface VideoSearchOptions {
  query?: string
  category?: string
  duration?: "short" | "medium" | "long" | "any"
  popularity?: "popular" | "any"
  dateRange?: "week" | "month" | "year" | "any"
  sort?: "relevant" | "recent" | "views" | "alpha"
  page?: number
  limit?: number
}

export interface PaginatedVideosResult {
  items: VideoDTO[]
  total: number
  page: number
  limit: number
  totalPages: number
  hasMore: boolean
}

export interface HomepageFeedResult {
  featured: VideoDTO[]
  trending: VideoDTO[]
  recentlyAdded: VideoDTO[]
  recommended: VideoDTO[]
  categoryRows: {
    category: VideoCategoryType
    items: VideoDTO[]
    totalInCategory: number
  }[]
  stats: {
    totalPublished: number
    uniqueReturned: number
  }
}

function toVideoDTO(v: any): VideoDTO {
  return {
    id: v._id ? String(v._id) : String(v.id),
    title: v.title,
    description: v.description,
    videoUrl: v.videoUrl,
    normalizedSourceUrl: v.normalizedSourceUrl || normalizeSourceUrl(v.videoUrl || ""),
    sourceType: v.sourceType || "native",
    externalVideoId: v.externalVideoId,
    channelTitle: v.channelTitle,
    channelId: v.channelId,
    embeddable: v.embeddable !== false,
    isShortForm: Boolean(v.isShortForm),
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    category: v.category,
    categories: Array.isArray(v.categories) && v.categories.length > 0 ? v.categories : [v.category],
    views: v.views || 0,
    featured: Boolean(v.featured),
    quality: v.quality || ["1080p", "720p"],
    tags: v.tags || [],
    sourceProvider: v.sourceProvider || "PlayNova Catalog",
    sourceAttribution: v.sourceAttribution || "PlayNova",
    license: v.license || "Open / Public Domain",
    status: v.status || "published",
    validationStatus: v.validationStatus || "verified",
    validationDetails: v.validationDetails,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
  }
}

function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

// Compute Levenshtein edit distance between two short strings
function levenshteinDistance(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m

  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j)
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= n; j++) {
      const temp = dp[j]
      if (a[i - 1] === b[j - 1]) {
        dp[j] = prev
      } else {
        dp[j] = 1 + Math.min(prev, dp[j], dp[j - 1])
      }
      prev = temp
    }
  }
  return dp[n]
}

// Typo-tolerant fuzzy matching helper
function isFuzzyMatch(target: string, query: string): boolean {
  const t = target.toLowerCase()
  const q = query.toLowerCase().trim()
  if (!q) return true
  if (t.includes(q)) return true
  if (q.length < 3) return false

  const queryTokens = q.split(/\s+/).filter((tok) => tok.length >= 2)
  const targetWords = t.split(/[^a-z0-9]+/).filter(Boolean)

  return queryTokens.every((qt) => {
    if (t.includes(qt)) return true
    const maxDist = qt.length >= 5 ? 2 : 1
    return targetWords.some((w) => {
      if (w.startsWith(qt) || qt.startsWith(w)) return true
      if (Math.abs(w.length - qt.length) > maxDist) return false
      return levenshteinDistance(w, qt) <= maxDist
    })
  })
}

/**
 * Deduplicate videos by both ID and normalizedSourceUrl
 */
function deduplicateVideos(videos: VideoDTO[], excludeIds?: Set<string>, excludeUrls?: Set<string>): VideoDTO[] {
  const seenIds = new Set<string>(excludeIds || [])
  const seenUrls = new Set<string>(excludeUrls || [])
  const out: VideoDTO[] = []

  for (const v of videos) {
    const urlKey = v.normalizedSourceUrl || normalizeSourceUrl(v.videoUrl)
    if (seenIds.has(v.id) || (urlKey && seenUrls.has(urlKey))) {
      continue
    }
    seenIds.add(v.id)
    if (urlKey) seenUrls.add(urlKey)
    out.push(v)
  }

  return out
}

/**
 * Deterministic stable hash for controlled session variation (no jumpy re-renders)
 */
function stableRotationScore(id: string, seed: string): number {
  const hash = crypto.createHash("sha1").update(`${seed}:${id}`).digest()
  return (hash.readUInt16BE(0) / 65535) * 6 // Subtle 0..6 pt rotation tie-breaker
}

/**
 * Pick top N videos while enforcing category diversity (no single category dominates a row)
 */
function selectWithCategoryDiversity(
  candidates: VideoDTO[],
  limit: number,
  maxPerCategory = 2
): VideoDTO[] {
  const selected: VideoDTO[] = []
  const catCounts: Record<string, number> = {}
  const overflow: VideoDTO[] = []

  for (const v of candidates) {
    const c = catCounts[v.category] || 0
    if (c < maxPerCategory) {
      selected.push(v)
      catCounts[v.category] = c + 1
      if (selected.length >= limit) return selected
    } else {
      overflow.push(v)
    }
  }

  for (const v of overflow) {
    selected.push(v)
    if (selected.length >= limit) break
  }

  return selected
}

const PUBLISHED_FILTER = {
  $or: [{ status: "published" }, { status: { $exists: false } }],
  validationStatus: { $ne: "failed" },
}

const BUILTIN_PLAYNOVA_CATALOG: VideoDTO[] = [
  {
    id: "nova-01",
    title: "Cosmic Horizons: The Deep Space Explorer",
    description: "Journey beyond the known solar system with high-definition deep space imaging and astrophysical observations.",
    videoUrl: "/sample-videos/cosmic-horizons.mp4",
    normalizedSourceUrl: "/sample-videos/cosmic-horizons.mp4",
    sourceType: "native",
    embeddable: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    duration: 734,
    category: "Space",
    categories: ["Space", "Science"],
    views: 142500,
    featured: true,
    quality: ["4K", "1080p", "720p"],
    tags: ["astronomy", "space", "nebula", "exploration"],
    sourceProvider: "NASA / ESA Public Archive",
    sourceAttribution: "NASA & Space Telescope Science Institute",
    license: "Public Domain",
    status: "published",
    validationStatus: "verified",
  },
  {
    id: "nova-02",
    title: "Big Buck Bunny: The Open Animation Masterpiece",
    description: "The classic open-source 3D animated film produced by the Blender Institute, featuring forest wildlife and humor.",
    videoUrl: "/sample-videos/open-animation.mp4",
    normalizedSourceUrl: "/sample-videos/open-animation.mp4",
    sourceType: "native",
    embeddable: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
    duration: 596,
    category: "Nature",
    categories: ["Nature", "Entertainment"],
    views: 893000,
    featured: true,
    quality: ["1080p", "720p", "480p"],
    tags: ["nature", "animation", "blender", "story"],
    sourceProvider: "Blender Open Projects",
    sourceAttribution: "Blender Institute",
    license: "Creative Commons Attribution 3.0",
    status: "published",
    validationStatus: "verified",
  },
  {
    id: "nova-03",
    title: "Quantum Computing & The Silicon Frontier",
    description: "An in-depth documentary exploring qubit coherence, cryogenic cooling, and quantum computational superiority.",
    videoUrl: "/sample-videos/silicon-frontier.mp4",
    normalizedSourceUrl: "/sample-videos/silicon-frontier.mp4",
    sourceType: "native",
    embeddable: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    duration: 420,
    category: "Technology",
    categories: ["Technology", "Science"],
    views: 65120,
    featured: false,
    quality: ["4K", "1080p"],
    tags: ["quantum", "silicon", "hardware", "computing"],
    sourceProvider: "Open Science Library",
    sourceAttribution: "Quantum Tech Institute",
    license: "Creative Commons Attribution 4.0",
    status: "published",
    validationStatus: "verified",
  },
  {
    id: "nova-04",
    title: "The Architecture of Living Coral Reefs",
    description: "Explore the fragile biodiversity and calcium carbonate structures of the Indo-Pacific reef systems.",
    videoUrl: "/sample-videos/coral-reefs.mp4",
    normalizedSourceUrl: "/sample-videos/coral-reefs.mp4",
    sourceType: "native",
    embeddable: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=1200&q=80",
    duration: 345,
    category: "Science",
    categories: ["Science", "Nature"],
    views: 112400,
    featured: false,
    quality: ["1080p", "720p"],
    tags: ["ocean", "biology", "ecology", "reefs"],
    sourceProvider: "NOAA Marine Sanctuaries",
    sourceAttribution: "NOAA Ocean Exploration",
    license: "Public Domain",
    status: "published",
    validationStatus: "verified",
  },
  {
    id: "nova-05",
    title: "Principles of Modern React & Next.js Architecture",
    description: "Master modern streaming interfaces, React Server Components, and zero-waterfall full-stack application development.",
    videoUrl: "/sample-videos/react-architecture.mp4",
    normalizedSourceUrl: "/sample-videos/react-architecture.mp4",
    sourceType: "native",
    embeddable: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    duration: 512,
    category: "Education",
    categories: ["Education", "Technology"],
    views: 247800,
    featured: false,
    quality: ["1080p", "720p"],
    tags: ["react", "web", "nextjs", "coding"],
    sourceProvider: "Open Education Network",
    sourceAttribution: "PlayNova Engineering",
    license: "Creative Commons Attribution 4.0",
    status: "published",
    validationStatus: "verified",
  },
  {
    id: "nova-06",
    title: "Cinematic Soundscapes & Orchestral Scoring",
    description: "Behind the scenes with sound designers sculpting emotive audio dynamics for widescreen cinematic releases.",
    videoUrl: "/sample-videos/cinematic-sound.mp4",
    normalizedSourceUrl: "/sample-videos/cinematic-sound.mp4",
    sourceType: "native",
    embeddable: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    duration: 654,
    category: "Entertainment",
    categories: ["Entertainment", "Education"],
    views: 94600,
    featured: false,
    quality: ["4K", "1080p", "720p"],
    tags: ["audio", "orchestra", "film", "soundtrack"],
    sourceProvider: "Open Audio Archive",
    sourceAttribution: "Creative Sound Labs",
    license: "Creative Commons Attribution 3.0",
    status: "published",
    validationStatus: "verified",
  },
  {
    id: "nova-07",
    title: "Ocean Exploration: The Mariana Trench Abyss",
    description: "Deep sea submersibles documenting benthic species and hydrothermal vents at depths exceeding ten thousand meters.",
    videoUrl: "/sample-videos/oceans.mp4",
    normalizedSourceUrl: "/sample-videos/oceans.mp4",
    sourceType: "native",
    embeddable: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80",
    duration: 480,
    category: "Documentaries",
    categories: ["Documentaries", "Nature", "Science"],
    views: 312000,
    featured: true,
    quality: ["1080p", "720p"],
    tags: ["ocean", "deepsea", "documentary", "exploration"],
    sourceProvider: "NOAA Public Video Archive",
    sourceAttribution: "NOAA Office of Ocean Exploration",
    license: "Public Domain",
    status: "published",
    validationStatus: "verified",
  },
  {
    id: "nova-08",
    title: "The Red Planet: Mars Perseverance Rover Mission",
    description: "Surface exploration, sample collection, and high-resolution panoramic observations from Jezero Crater on Mars.",
    videoUrl: "/sample-videos/nature-sample.mp4",
    normalizedSourceUrl: "/sample-videos/nature-sample.mp4",
    sourceType: "native",
    embeddable: true,
    thumbnailUrl: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&w=1200&q=80",
    duration: 360,
    category: "Space",
    categories: ["Space", "Technology"],
    views: 520000,
    featured: true,
    quality: ["4K", "1080p"],
    tags: ["mars", "perseverance", "space", "rover"],
    sourceProvider: "NASA JPL Public Domain",
    sourceAttribution: "NASA / Jet Propulsion Laboratory",
    license: "Public Domain",
    status: "published",
    validationStatus: "verified",
  },
]

export class VideoService {
  private static catalogCache: { items: VideoDTO[]; expiresAt: number } | null = null
  private static readonly CATALOG_TTL_MS = 60 * 1000 // 60 seconds

  static invalidateCatalogCache(): void {
    this.catalogCache = null
  }

  private static ensureConnected(): void {
    if (!isDatabaseConnected()) {
      const err: any = new Error("Video catalog database is temporarily unavailable.")
      err.statusCode = 503
      throw err
    }
  }

  /**
   * Fetch all published, deduplicated videos directly from MongoDB Atlas (with 60s TTL cache)
   * Falls back gracefully to verified built-in catalog if Atlas connection is unavailable
   */
  static async getAllVideos(category?: string): Promise<VideoDTO[]> {
    if (!isDatabaseConnected()) {
      let fallback = BUILTIN_PLAYNOVA_CATALOG
      if (category && category !== "All") {
        const catLower = category.toLowerCase()
        fallback = fallback.filter(
          (v) =>
            v.category.toLowerCase() === catLower ||
            (v.categories && v.categories.some((c) => c.toLowerCase() === catLower))
        )
      }
      return fallback
    }

    const now = Date.now()
    let allPublished: VideoDTO[]

    if (this.catalogCache && this.catalogCache.expiresAt > now) {
      allPublished = this.catalogCache.items
    } else {
      const docs = await Video.find(PUBLISHED_FILTER)
        .sort({ createdAt: -1, _id: 1 })
        .maxTimeMS(5000)
        .lean()
      allPublished = deduplicateVideos(docs.map(toVideoDTO))
      this.catalogCache = { items: allPublished, expiresAt: now + this.CATALOG_TTL_MS }
    }

    if (category && category !== "All") {
      const catLower = category.toLowerCase()
      return allPublished.filter(
        (v) =>
          v.category.toLowerCase() === catLower ||
          (v.categories && v.categories.some((c) => c.toLowerCase() === catLower))
      )
    }

    return allPublished
  }

  /**
   * Get single video by ID (supports native catalog IDs, built-in fallback, and YouTube `yt_<id>`)
   */
  static async getVideoById(id: string): Promise<VideoDTO | null> {
    if (!isDatabaseConnected()) {
      const hit = BUILTIN_PLAYNOVA_CATALOG.find((v) => v.id === id)
      if (hit) return hit
      if (id.startsWith("yt_") && id.length === 14) {
        const { YouTubeService } = await import("./youtubeService.js")
        const ytId = id.slice(3)
        const video = await YouTubeService.getVideoByYouTubeId(ytId).catch(() => null)
        if (video) return video
      }
      return null
    }

    if (this.catalogCache && this.catalogCache.expiresAt > Date.now()) {
      const hit = this.catalogCache.items.find((v) => v.id === id)
      if (hit) return hit
    }

    const video = await Video.findById(id).maxTimeMS(4000).lean()
    if (video) return toVideoDTO(video)

    // On-demand hydration & canonical persistence when a user watches or saves a YouTube video (`yt_<11chars>`)
    if (id.startsWith("yt_") && id.length === 14) {
      const { YouTubeService } = await import("./youtubeService.js")
      const ytId = id.slice(3)
      const persisted = await YouTubeService.ensurePersistedYouTubeVideo(ytId).catch(() => null)
      if (persisted) return persisted
    }

    return null
  }

  /**
   * Advanced Video Search with multi-category matching, typo tolerance, and stable pagination
   */
  static async searchVideos(options: VideoSearchOptions = {}): Promise<PaginatedVideosResult> {
    const {
      query = "",
      category = "",
      duration = "any",
      popularity = "any",
      dateRange = "any",
      sort = "relevant",
      page = 1,
      limit = 12,
    } = options

    const cleanQuery = query.trim()
    const safeLimit = Math.max(1, Math.min(50, limit))
    const safePage = Math.max(1, page)
    const skip = (safePage - 1) * safeLimit

    if (!isDatabaseConnected()) {
      let pool = [...BUILTIN_PLAYNOVA_CATALOG]
      if (cleanQuery) {
        pool = pool.filter(
          (v) =>
            isFuzzyMatch(v.title, cleanQuery) ||
            isFuzzyMatch(v.description, cleanQuery) ||
            v.tags.some((t) => isFuzzyMatch(t, cleanQuery)) ||
            isFuzzyMatch(v.category, cleanQuery)
        )
      }
      if (category && category !== "All") {
        const catLower = category.toLowerCase()
        pool = pool.filter(
          (v) =>
            v.category.toLowerCase() === catLower ||
            (v.categories && v.categories.some((c) => c.toLowerCase() === catLower))
        )
      }
      if (duration === "short") pool = pool.filter((v) => v.duration < 300)
      else if (duration === "medium") pool = pool.filter((v) => v.duration >= 300 && v.duration <= 900)
      else if (duration === "long") pool = pool.filter((v) => v.duration > 900)

      if (sort === "recent") {
        pool.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
      } else if (sort === "views") {
        pool.sort((a, b) => b.views - a.views)
      } else if (sort === "alpha") {
        pool.sort((a, b) => a.title.localeCompare(b.title))
      }

      const total = pool.length
      const items = pool.slice(skip, skip + safeLimit)
      const totalPages = Math.max(1, Math.ceil(total / safeLimit))
      return {
        items,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages,
        hasMore: safePage < totalPages,
      }
    }

    const andConditions: any[] = [PUBLISHED_FILTER]

    // 1. Keyword Search
    if (cleanQuery) {
      const safeRegex = new RegExp(escapeRegex(cleanQuery), "i")
      andConditions.push({
        $or: [
          { title: { $regex: safeRegex } },
          { description: { $regex: safeRegex } },
          { tags: { $in: [safeRegex] } },
          { category: { $regex: safeRegex } },
          { categories: { $in: [safeRegex] } },
        ],
      })
    }

    // 2. Category Filter (supports primary category AND multi-category array)
    if (category && category !== "All") {
      const catRegex = new RegExp(`^${escapeRegex(category)}$`, "i")
      andConditions.push({
        $or: [{ category: { $regex: catRegex } }, { categories: { $in: [catRegex] } }],
      })
    }

    // 3. Duration Filter
    if (duration === "short") {
      andConditions.push({ duration: { $lt: 300 } })
    } else if (duration === "medium") {
      andConditions.push({ duration: { $gte: 300, $lte: 900 } })
    } else if (duration === "long") {
      andConditions.push({ duration: { $gt: 900 } })
    }

    // 4. Popularity Filter
    if (popularity === "popular") {
      andConditions.push({ views: { $gte: 1 } })
    }

    // 5. Date Range Filter
    if (dateRange !== "any") {
      const now = new Date()
      const msMap: Record<string, number> = {
        week: 7 * 24 * 60 * 60 * 1000,
        month: 30 * 24 * 60 * 60 * 1000,
        year: 365 * 24 * 60 * 60 * 1000,
      }
      if (msMap[dateRange]) {
        andConditions.push({ createdAt: { $gte: new Date(now.getTime() - msMap[dateRange]) } })
      }
    }

    const filter = andConditions.length === 1 ? andConditions[0] : { $and: andConditions }

    // 6. Stable Deterministic Sort (always appends _id: 1 tie-breaker so pages never repeat items)
    let sortOption: any = { createdAt: -1, _id: 1 }
    if (sort === "recent") {
      sortOption = { createdAt: -1, _id: 1 }
    } else if (sort === "views") {
      sortOption = { views: -1, createdAt: -1, _id: 1 }
    } else if (sort === "alpha") {
      sortOption = { title: 1, _id: 1 }
    } else if (sort === "relevant") {
      sortOption = cleanQuery
        ? { views: -1, featured: -1, createdAt: -1, _id: 1 }
        : { featured: -1, views: -1, createdAt: -1, _id: 1 }
    }

    let [docs, total] = await Promise.all([
      Video.find(filter).sort(sortOption).skip(skip).limit(safeLimit).maxTimeMS(5000).lean(),
      Video.countDocuments(filter).maxTimeMS(5000),
    ])

    let items = deduplicateVideos(docs.map(toVideoDTO))

    // Typo-tolerant fallback when strict keyword returns 0 matches
    if (total === 0 && cleanQuery.length >= 3) {
      const allCatalog = await this.getAllVideos(category && category !== "All" ? category : undefined)
      const fuzzyMatches = allCatalog.filter((v) => {
        const matchesText =
          isFuzzyMatch(v.title, cleanQuery) ||
          isFuzzyMatch(v.description, cleanQuery) ||
          isFuzzyMatch(v.category, cleanQuery) ||
          v.tags.some((t) => isFuzzyMatch(t, cleanQuery))
        if (!matchesText) return false
        if (duration === "short" && v.duration >= 300) return false
        if (duration === "medium" && (v.duration < 300 || v.duration > 900)) return false
        if (duration === "long" && v.duration <= 900) return false
        return true
      })

      if (fuzzyMatches.length > 0) {
        total = fuzzyMatches.length
        items = fuzzyMatches.slice(skip, skip + safeLimit)
      }
    }

    const totalPages = Math.max(1, Math.ceil(total / safeLimit))
    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages,
      hasMore: safePage < totalPages,
    }
  }

  /**
   * Fast auto-complete suggestions matching title, category, or tags
   */
  static async getSearchSuggestions(query: string, limit = 6): Promise<{ suggestions: string[]; videos: VideoDTO[] }> {
    const cleanQuery = query.trim()
    if (!cleanQuery) return { suggestions: [], videos: [] }

    const searchRes = await this.searchVideos({
      query: cleanQuery,
      limit,
      sort: "relevant",
    })

    const suggestionsSet = new Set<string>()
    const qLower = cleanQuery.toLowerCase()

    for (const v of searchRes.items) {
      if (v.title.toLowerCase().includes(qLower)) suggestionsSet.add(v.title)
      for (const t of v.tags) {
        if (t.toLowerCase().includes(qLower)) suggestionsSet.add(t)
      }
      if (v.category.toLowerCase().includes(qLower)) suggestionsSet.add(v.category)
    }

    if (suggestionsSet.size === 0) {
      for (const v of searchRes.items) suggestionsSet.add(v.title)
    }

    return {
      suggestions: Array.from(suggestionsSet).slice(0, limit),
      videos: searchRes.items.slice(0, 4),
    }
  }

  /**
   * Unified Dynamic Homepage Feed with Cross-Section Exclusion
   * Guarantees zero duplicate videos across Featured, Trending, Recently Added, Recommended, and Category Rows!
   */
  static async getHomepageFeed(userId?: string, sessionSeed?: string): Promise<HomepageFeedResult> {
    const allPublished = await this.getAllVideos()
    const seed = sessionSeed || new Date().toISOString().slice(0, 10)

    const usedIds = new Set<string>()
    const usedUrls = new Set<string>()

    const claim = (candidates: VideoDTO[], count: number, diverse = false): VideoDTO[] => {
      const available = deduplicateVideos(candidates, usedIds, usedUrls)
      const picked = diverse ? selectWithCategoryDiversity(available, count, 1) : available.slice(0, count)
      for (const v of picked) {
        usedIds.add(v.id)
        const u = v.normalizedSourceUrl || normalizeSourceUrl(v.videoUrl)
        if (u) usedUrls.add(u)
      }
      return picked
    }

    // 1. Featured Videos (4 diverse featured streams)
    const featuredCandidates = [...allPublished]
      .filter((v) => v.featured)
      .sort((a, b) => {
        const scoreA = b.views + stableRotationScore(b.id, `${seed}:feat`) * 10
        const scoreB = a.views + stableRotationScore(a.id, `${seed}:feat`) * 10
        return scoreA - scoreB
      })
    const featured = claim(featuredCandidates.length >= 4 ? featuredCandidates : allPublished, 4, true)

    // 2. Trending Now (4 highest-view / high-velocity streams excluding featured)
    const trendingCandidates = [...allPublished].sort(
      (a, b) =>
        b.views - a.views ||
        (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()) ||
        a.id.localeCompare(b.id)
    )
    const trending = claim(trendingCandidates, 4, true)

    // 3. Recently Added (4 newest streams excluding featured & trending)
    const recentCandidates = [...allPublished].sort(
      (a, b) =>
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime() ||
        a.id.localeCompare(b.id)
    )
    const recentlyAdded = claim(recentCandidates, 4, true)

    // 4. Recommended for You (personalized + category diverse, excluding already-claimed items)
    const recPool = await this.getPersonalizedRecommendations(userId, 20, {
      excludeIds: usedIds,
      sessionSeed: seed,
    })
    const recommended = claim(recPool, 4, true)

    // 5. Category Rows (Technology, Science, Space, Nature, Education, Documentaries, Entertainment)
    // Only emit categories with real unique remaining videos — never pad with unrelated videos!
    const orderedCategories: VideoCategoryType[] = [
      "Technology",
      "Science",
      "Space",
      "Nature",
      "Education",
      "Documentaries",
      "Entertainment",
    ]

    const categoryRows: HomepageFeedResult["categoryRows"] = []
    for (const cat of orderedCategories) {
      const catMatches = allPublished.filter((v) => v.category === cat)
      if (catMatches.length === 0) continue

      const sortedCat = [...catMatches].sort(
        (a, b) =>
          stableRotationScore(b.id, `${seed}:${cat}`) - stableRotationScore(a.id, `${seed}:${cat}`)
      )
      const picked = claim(sortedCat, 4, false)
      if (picked.length > 0) {
        categoryRows.push({
          category: cat,
          items: picked,
          totalInCategory: catMatches.length,
        })
      }
    }

    return {
      featured,
      trending,
      recentlyAdded,
      recommended,
      categoryRows,
      stats: {
        totalPublished: allPublished.length,
        uniqueReturned: usedIds.size,
      },
    }
  }

  /**
   * Personalized recommendations scoring engine with category diversity & controlled session rotation
   */
  static async getPersonalizedRecommendations(
    userId?: string,
    limit = 8,
    opts?: { excludeIds?: Set<string>; excludeVideoId?: string; sessionSeed?: string }
  ): Promise<VideoDTO[]> {
    const allVideos = await this.getAllVideos()
    const seed = opts?.sessionSeed || new Date().toISOString().slice(0, 10)
    const excludeSet = new Set<string>(opts?.excludeIds || [])
    if (opts?.excludeVideoId) excludeSet.add(opts.excludeVideoId)

    const pool = deduplicateVideos(allVideos, excludeSet)
    if (pool.length === 0) return []

    let userProgressList: any[] = []
    let trackingAllowed = true

    if (userId) {
      const user = await UserService.getUserById(userId)
      if (user?.preferences?.historyTrackingEnabled === false) {
        trackingAllowed = false
      } else {
        try {
          userProgressList = await WatchProgress.find({ userId }).maxTimeMS(4000).lean()
        } catch {
          userProgressList = []
        }
      }
    }

    // Cold-start or tracking disabled: diverse featured + recency + controlled session variation
    if (!userId || !trackingAllowed || userProgressList.length === 0) {
      const coldScored = pool
        .map((v) => {
          const recencyMs = new Date(v.createdAt || 0).getTime()
          const featuredPts = v.featured ? 20 : 0
          const popPts = Math.min(15, Math.log10(Math.max(1, v.views + 1)) * 3)
          const rotPts = stableRotationScore(v.id, `${seed}:cold`)
          return { video: v, score: featuredPts + popPts + rotPts + recencyMs / 1e14 }
        })
        .sort((a, b) => b.score - a.score)
        .map((s) => s.video)

      return selectWithCategoryDiversity(coldScored, limit, 2)
    }

    const categoryCounts: Record<string, number> = {}
    const tagCounts: Record<string, number> = {}
    const completedIds = new Set<string>()
    const inProgressIds = new Set<string>()

    for (const prog of userProgressList) {
      const isComp = prog.isCompleted || (prog.completionPercentage || 0) >= 90
      if (isComp) completedIds.add(prog.videoId)
      else if (prog.lastPositionSeconds > 5) inProgressIds.add(prog.videoId)

      const vid = allVideos.find((v) => v.id === prog.videoId)
      if (vid) {
        categoryCounts[vid.category] = (categoryCounts[vid.category] || 0) + 1
        for (const t of vid.tags) tagCounts[t] = (tagCounts[t] || 0) + 1
      }
    }

    const totalWatched = Math.max(1, userProgressList.length)
    const maxViews = Math.max(1, ...pool.map((v) => v.views))

    // Filter out already-completed videos unless too few remain
    const nonCompleted = pool.filter((v) => !completedIds.has(v.id))
    const scoringPool = nonCompleted.length >= limit ? nonCompleted : pool

    const scored = scoringPool
      .map((video) => {
        const catScore = ((categoryCounts[video.category] || 0) / totalWatched) * 35
        const matchedTags = video.tags.filter((t) => (tagCounts[t] || 0) > 0).length
        const tagScore = Math.min(25, (matchedTags / Math.max(1, video.tags.length)) * 25)
        const historyScore = inProgressIds.has(video.id) ? 16 : completedIds.has(video.id) ? -25 : 14
        const popularityScore = (video.views / maxViews) * 10
        const featuredBoost = video.featured ? 8 : 4
        const rotationPts = stableRotationScore(video.id, `${seed}:${userId}`)

        return {
          video,
          score: catScore + tagScore + historyScore + popularityScore + featuredBoost + rotationPts,
        }
      })
      .sort((a, b) => b.score - a.score)
      .map((s) => s.video)

    return selectWithCategoryDiversity(scored, limit, 2)
  }

  /**
   * "Because You Watched <Video>" (respects exclusion set)
   */
  static async getBecauseYouWatched(
    userId?: string,
    limit = 4,
    excludeIds?: Set<string>
  ): Promise<{ sourceVideo: VideoDTO; items: VideoDTO[] } | null> {
    const allVideos = await this.getAllVideos()
    if (allVideos.length === 0) return null

    let targetVideo: VideoDTO | null = null
    if (userId) {
      try {
        const latestProg = await WatchProgress.findOne({ userId })
          .sort({ lastWatchedAt: -1 })
          .maxTimeMS(4000)
          .lean()
        if (latestProg) {
          targetVideo = (await this.getVideoById(latestProg.videoId)) || null
        }
      } catch {
        targetVideo = null
      }
    }

    if (!targetVideo) {
      targetVideo = allVideos.find((v) => v.featured) || allVideos[0]
    }
    if (!targetVideo) return null

    const blocked = new Set<string>(excludeIds || [])
    blocked.add(targetVideo.id)

    const candidates = deduplicateVideos(allVideos, blocked)
      .map((v) => {
        let score = 0
        if (v.category === targetVideo!.category) score += 45
        const tagOverlap = v.tags.filter((t) => targetVideo!.tags.includes(t)).length
        score += tagOverlap * 18
        score += Math.min(10, Math.log10(Math.max(1, v.views + 1)) * 2)
        return { video: v, score }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.video)

    return { sourceVideo: targetVideo, items: candidates }
  }

  /**
   * "Trending in Your Interests" (respects exclusion set)
   */
  static async getTrendingInYourInterests(
    userId?: string,
    limit = 4,
    excludeIds?: Set<string>
  ): Promise<VideoDTO[]> {
    const allVideos = await this.getAllVideos()
    let topCategories = new Set<string>()

    if (userId) {
      try {
        const progs = await WatchProgress.find({ userId }).maxTimeMS(4000).lean()
        const catCounts: Record<string, number> = {}
        for (const p of progs) {
          const v = allVideos.find((item) => item.id === p.videoId)
          if (v) catCounts[v.category] = (catCounts[v.category] || 0) + 1
        }
        const sortedCats = Object.entries(catCounts)
          .sort((a, b) => b[1] - a[1])
          .map((e) => e[0])
        topCategories = new Set(sortedCats.slice(0, 3))
      } catch {
        // fallback below
      }
    }

    if (topCategories.size === 0) {
      topCategories = new Set(["Space", "Technology", "Science"])
    }

    const candidates = deduplicateVideos(
      allVideos.filter((v) => topCategories.has(v.category)),
      excludeIds
    ).sort((a, b) => b.views - a.views || a.id.localeCompare(b.id))

    return selectWithCategoryDiversity(candidates, limit, 2)
  }

  /**
   * "Discover Something New" (respects exclusion set)
   */
  static async getDiscoverSomethingNew(
    userId?: string,
    limit = 4,
    excludeIds?: Set<string>
  ): Promise<VideoDTO[]> {
    const allVideos = await this.getAllVideos()
    const watchedCategories = new Set<string>()

    if (userId) {
      try {
        const progs = await WatchProgress.find({ userId }).maxTimeMS(4000).lean()
        for (const p of progs) {
          const v = allVideos.find((item) => item.id === p.videoId)
          if (v) watchedCategories.add(v.category)
        }
      } catch {
        // ignore
      }
    }

    const pool = deduplicateVideos(allVideos, excludeIds)
    const unvisited = pool.filter((v) => !watchedCategories.has(v.category))
    const chosenPool = unvisited.length >= limit ? unvisited : pool
    return selectWithCategoryDiversity(chosenPool, limit, 1)
  }

  /**
   * "Similar Videos" for Watch Page (strictly excludes currently playing video & deduplicates)
   */
  static async getSimilarVideos(videoId: string, limit = 4): Promise<VideoDTO[]> {
    const allVideos = await this.getAllVideos()
    const target = await this.getVideoById(videoId)
    const exclude = new Set<string>([videoId])
    if (target?.normalizedSourceUrl) {
      // Also exclude any duplicate source URL
    }

    const pool = deduplicateVideos(
      allVideos,
      exclude,
      target?.normalizedSourceUrl ? new Set([target.normalizedSourceUrl]) : undefined
    )

    if (!target) return selectWithCategoryDiversity(pool, limit, 2)

    const ranked = pool
      .map((v) => {
        let score = 0
        if (v.category === target.category) score += 50
        const commonTags = v.tags.filter((t) => target.tags.includes(t)).length
        score += commonTags * 22
        score += Math.min(10, Math.log10(Math.max(1, v.views + 1)) * 2)
        return { video: v, score }
      })
      .sort((a, b) => b.score - a.score)
      .map((s) => s.video)

    return ranked.slice(0, limit)
  }

  /**
   * Aggregate Personalized Recommendation Shelves with Cross-Shelf Deduplication!
   */
  static async getPersonalizedShelves(userId?: string): Promise<{
    recommended: VideoDTO[]
    becauseYouWatched: { sourceVideo: VideoDTO; items: VideoDTO[] } | null
    trendingInInterests: VideoDTO[]
    discoverNew: VideoDTO[]
  }> {
    const used = new Set<string>()

    const recommended = await this.getPersonalizedRecommendations(userId, 4, { excludeIds: used })
    for (const v of recommended) used.add(v.id)

    const becauseYouWatched = await this.getBecauseYouWatched(userId, 4, used)
    if (becauseYouWatched) {
      for (const v of becauseYouWatched.items) used.add(v.id)
    }

    const trendingInInterests = await this.getTrendingInYourInterests(userId, 4, used)
    for (const v of trendingInInterests) used.add(v.id)

    const discoverNew = await this.getDiscoverSomethingNew(userId, 4, used)

    return {
      recommended,
      becauseYouWatched,
      trendingInInterests,
      discoverNew,
    }
  }

  /**
   * Get Trending Videos
   */
  static async getTrendingVideos(limit = 8, excludeIds?: Set<string>): Promise<VideoDTO[]> {
    const all = deduplicateVideos(await this.getAllVideos(), excludeIds)
    return [...all]
      .sort((a, b) => b.views - a.views || a.id.localeCompare(b.id))
      .slice(0, limit)
  }

  /**
   * Get Recently Added Videos
   */
  static async getRecentlyAdded(limit = 8, excludeIds?: Set<string>): Promise<VideoDTO[]> {
    const all = deduplicateVideos(await this.getAllVideos(), excludeIds)
    return [...all]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime() ||
          a.id.localeCompare(b.id)
      )
      .slice(0, limit)
  }

  // =========================================================================
  // ADMIN CONTENT MANAGEMENT & AUDIT METHODS
  // =========================================================================

  static async getAdminInventory(options: {
    status?: string
    category?: string
    page?: number
    limit?: number
  } = {}) {
    this.ensureConnected()

    const safePage = Math.max(1, options.page || 1)
    const safeLimit = Math.max(1, Math.min(50, options.limit || 20))
    const skip = (safePage - 1) * safeLimit

    const filter: any = {}
    if (options.status && options.status !== "all") {
      filter.status = options.status
    }
    if (options.category && options.category !== "All") {
      filter.$or = [{ category: options.category }, { categories: options.category }]
    }

    const [docs, total, statusCountsAgg, catCountsAgg] = await Promise.all([
      Video.find(filter).sort({ createdAt: -1, _id: 1 }).skip(skip).limit(safeLimit).maxTimeMS(5000).lean(),
      Video.countDocuments(filter).maxTimeMS(5000),
      Video.aggregate([{ $group: { _id: { $ifNull: ["$status", "published"] }, count: { $sum: 1 } } }]).option({
        maxTimeMS: 5000,
      }),
      Video.aggregate([
        { $match: PUBLISHED_FILTER },
        { $group: { _id: "$category", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]).option({ maxTimeMS: 5000 }),
    ])

    const statusCounts: Record<string, number> = {}
    for (const row of statusCountsAgg) {
      statusCounts[row._id] = row.count
    }

    const categoryCounts: Record<string, number> = {}
    for (const row of catCountsAgg) {
      categoryCounts[row._id] = row.count
    }

    return {
      items: docs.map(toVideoDTO),
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.max(1, Math.ceil(total / safeLimit)),
      },
      summary: {
        statusCounts,
        categoryCounts,
      },
    }
  }

  static async createAdminVideo(input: {
    title: string
    description: string
    videoUrl: string
    thumbnailUrl: string
    duration: number
    category: VideoCategoryType
    categories?: VideoCategoryType[]
    tags?: string[]
    sourceProvider?: string
    sourceAttribution?: string
    license?: string
    featured?: boolean
    publishImmediately?: boolean
  }): Promise<VideoDTO> {
    this.ensureConnected()

    if (!VALID_VIDEO_CATEGORIES.includes(input.category)) {
      throw new Error(`Invalid category '${input.category}'`)
    }

    const normalizedUrl = normalizeSourceUrl(input.videoUrl)
    const duplicate = await Video.findOne({ normalizedSourceUrl: normalizedUrl }).maxTimeMS(4000).lean()
    if (duplicate) {
      const err: any = new Error(
        `Duplicate video source detected: already exists as '${duplicate.title}' (${duplicate._id})`
      )
      err.statusCode = 409
      throw err
    }

    // Validate playback & thumbnail before publishing
    const validation = await validateVideoSource(input.videoUrl, input.thumbnailUrl)
    if (input.publishImmediately !== false && !validation.valid) {
      const err: any = new Error(
        `Video source failed playback validation and cannot be published: ${validation.details.error || "invalid media"}`
      )
      err.statusCode = 400
      throw err
    }

    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32)
    const suffix = crypto.createHash("sha1").update(normalizedUrl).digest("hex").slice(0, 8)
    const id = `vid-${slug || "media"}-${suffix}`

    const validCategories = Array.from(
      new Set([
        input.category,
        ...(input.categories || []).filter((c) => VALID_VIDEO_CATEGORIES.includes(c)),
      ])
    )

    const doc = await Video.create({
      _id: id,
      title: input.title.trim(),
      description: input.description.trim(),
      videoUrl: input.videoUrl.trim(),
      normalizedSourceUrl: normalizedUrl,
      sourceKey: `admin:${suffix}`,
      thumbnailUrl: input.thumbnailUrl.trim(),
      duration: Math.max(1, Math.round(Number(input.duration) || 60)),
      category: input.category,
      categories: validCategories,
      tags: Array.isArray(input.tags)
        ? input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 12)
        : [],
      sourceProvider: input.sourceProvider?.trim() || "Admin Authorized Source",
      sourceAttribution: input.sourceAttribution?.trim() || "Authorized Upload",
      license: input.license?.trim() || "Authorized License",
      featured: Boolean(input.featured),
      status: validation.valid && input.publishImmediately !== false ? "published" : "draft",
      validationStatus: validation.valid ? "verified" : "failed",
      validatedAt: new Date(),
      validationDetails: validation.details,
    })

    this.invalidateCatalogCache()
    return toVideoDTO(doc.toObject())
  }

  static async updateAdminVideo(
    id: string,
    updates: Partial<{
      title: string
      description: string
      category: VideoCategoryType
      categories: VideoCategoryType[]
      tags: string[]
      featured: boolean
      status: VideoPublicationStatus
      sourceAttribution: string
      license: string
      thumbnailUrl: string
    }>
  ): Promise<VideoDTO | null> {
    this.ensureConnected()

    const doc = await Video.findById(id).maxTimeMS(4000)
    if (!doc) return null

    if (typeof updates.title === "string" && updates.title.trim()) doc.title = updates.title.trim()
    if (typeof updates.description === "string" && updates.description.trim()) {
      doc.description = updates.description.trim()
    }
    if (updates.category && VALID_VIDEO_CATEGORIES.includes(updates.category)) {
      doc.category = updates.category
    }
    if (Array.isArray(updates.categories)) {
      const cleanCats = updates.categories.filter((c) => VALID_VIDEO_CATEGORIES.includes(c))
      if (cleanCats.length > 0) doc.categories = Array.from(new Set([doc.category, ...cleanCats]))
    }
    if (Array.isArray(updates.tags)) {
      doc.tags = updates.tags.map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 12)
    }
    if (typeof updates.featured === "boolean") doc.featured = updates.featured
    if (updates.status && ["published", "draft", "archived", "duplicate_archived", "broken"].includes(updates.status)) {
      if (updates.status === "published" && doc.validationStatus === "failed") {
        const err: any = new Error("Cannot publish a video whose media source failed validation.")
        err.statusCode = 400
        throw err
      }
      doc.status = updates.status
    }
    if (typeof updates.sourceAttribution === "string") doc.sourceAttribution = updates.sourceAttribution.trim()
    if (typeof updates.license === "string") doc.license = updates.license.trim()
    if (typeof updates.thumbnailUrl === "string" && updates.thumbnailUrl.trim()) {
      doc.thumbnailUrl = updates.thumbnailUrl.trim()
    }

    await doc.save()
    this.invalidateCatalogCache()
    return toVideoDTO(doc.toObject())
  }
}
