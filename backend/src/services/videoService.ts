import { Video, IVideo } from "../models/Video.js"
import { WatchProgress } from "../models/WatchProgress.js"
import { UserService } from "./userService.js"
import { isDatabaseConnected } from "../config/db.js"

export interface VideoDTO {
  id: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  duration: number
  category: "Technology" | "Education" | "Nature" | "Science" | "Space" | "Entertainment" | "Documentaries"
  views: number
  featured?: boolean
  quality: string[]
  tags: string[]
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
}

export const SEED_VIDEOS: VideoDTO[] = [
  {
    id: "nova-01",
    title: "Cosmic Horizons: The Deep Space Explorer",
    description: "Journey beyond the known solar system with high-definition deep space imaging and astrophysical observations.",
    videoUrl: "/sample-videos/cosmic-horizons.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    duration: 734,
    category: "Space",
    views: 142500,
    featured: true,
    quality: ["4K", "1080p", "720p"],
    tags: ["astronomy", "space", "nebula", "exploration", "cosmos"],
  },
  {
    id: "nova-02",
    title: "Big Buck Bunny: The Open Animation Masterpiece",
    description: "The classic open-source 3D animated film produced by the Blender Institute, featuring forest wildlife and humor.",
    videoUrl: "/sample-videos/open-animation.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
    duration: 596,
    category: "Nature",
    views: 893000,
    featured: true,
    quality: ["1080p", "720p", "480p"],
    tags: ["nature", "animation", "blender", "story", "wildlife"],
  },
  {
    id: "nova-03",
    title: "Quantum Computing & The Silicon Frontier",
    description: "An in-depth documentary exploring qubit coherence, cryogenic cooling, and quantum computational superiority.",
    videoUrl: "/sample-videos/silicon-frontier.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    duration: 420,
    category: "Technology",
    views: 65120,
    featured: true,
    quality: ["4K", "1080p"],
    tags: ["quantum", "silicon", "hardware", "computing", "chips"],
  },
  {
    id: "nova-04",
    title: "The Architecture of Living Coral Reefs",
    description: "Explore the fragile biodiversity and calcium carbonate structures of the Indo-Pacific reef systems.",
    videoUrl: "/sample-videos/coral-reefs.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1546026423-cc4642628d2b?auto=format&fit=crop&w=1200&q=80",
    duration: 345,
    category: "Science",
    views: 112400,
    featured: false,
    quality: ["1080p", "720p"],
    tags: ["ocean", "biology", "ecology", "reefs", "marine"],
  },
  {
    id: "nova-05",
    title: "Principles of Modern React & Next.js Architecture",
    description: "Master modern streaming interfaces, React Server Components, and zero-waterfall full-stack application development.",
    videoUrl: "/sample-videos/react-architecture.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    duration: 512,
    category: "Education",
    views: 247800,
    featured: false,
    quality: ["1080p", "720p"],
    tags: ["react", "web", "nextjs", "coding", "software"],
  },
  {
    id: "nova-06",
    title: "Cinematic Soundscapes & Orchestral Scoring",
    description: "Behind the scenes with sound designers sculpting emotive audio dynamics for widescreen cinematic releases.",
    videoUrl: "/sample-videos/cinematic-sound.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    duration: 654,
    category: "Entertainment",
    views: 94600,
    featured: false,
    quality: ["4K", "1080p", "720p"],
    tags: ["audio", "orchestra", "film", "soundtrack", "music"],
  },
  {
    id: "nova-07",
    title: "Autonomous Systems & Neural Robotics",
    description: "Investigating transformer models in physical robotics, spatial perception, and human-collaborative automation.",
    videoUrl: "/sample-videos/silicon-frontier.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80",
    duration: 810,
    category: "Technology",
    views: 185400,
    featured: true,
    quality: ["4K", "1080p"],
    tags: ["robotics", "ai", "automation", "sensors", "neural"],
  },
  {
    id: "nova-08",
    title: "Deep Ocean Mysteries & The Mariana Trench",
    description: "Descending into the hadal zone to study bioluminescence, extreme pressure adaptation, and tectonic abyss geology.",
    videoUrl: "/sample-videos/coral-reefs.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1200&q=80",
    duration: 1120,
    category: "Documentaries",
    views: 312000,
    featured: true,
    quality: ["4K", "1080p"],
    tags: ["abyss", "deep-sea", "mariana", "documentary", "ocean"],
  },
  {
    id: "nova-09",
    title: "Renewable Energy Grids & Fusion Horizons",
    description: "A comprehensive investigation of magnetic confinement tokamaks, superconducting magnets, and net energy gain.",
    videoUrl: "/sample-videos/cosmic-horizons.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80",
    duration: 490,
    category: "Science",
    views: 78900,
    featured: false,
    quality: ["1080p", "720p"],
    tags: ["energy", "fusion", "physics", "clean-tech", "science"],
  },
  {
    id: "nova-10",
    title: "High Sierra: Alpine Ecosystems & Wilderness",
    description: "Glacial lakes, granite crests, and seasonal migratory wildlife across the dramatic North American mountain spine.",
    videoUrl: "/sample-videos/open-animation.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
    duration: 680,
    category: "Nature",
    views: 154200,
    featured: false,
    quality: ["4K", "1080p"],
    tags: ["mountains", "alps", "nature", "wilderness", "glaciers"],
  },
  {
    id: "nova-11",
    title: "The Evolution of Typography & Visual Design",
    description: "From movable lead type to modern variable web fonts and responsive typographic rhythm on high-DPI displays.",
    videoUrl: "/sample-videos/react-architecture.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80",
    duration: 360,
    category: "Education",
    views: 48900,
    featured: false,
    quality: ["1080p", "720p"],
    tags: ["typography", "design", "graphic", "history", "art"],
  },
  {
    id: "nova-12",
    title: "Symphony of the Stars: James Webb Deep Field",
    description: "Infrared spectroscopy reveals primordial galaxies formed over 13.1 billion years ago in unprecedented cosmic clarity.",
    videoUrl: "/sample-videos/cosmic-horizons.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=1200&q=80",
    duration: 980,
    category: "Space",
    views: 420000,
    featured: true,
    quality: ["4K", "1080p"],
    tags: ["jwst", "galaxies", "astronomy", "telescope", "space"],
  },
]

function toVideoDTO(v: any): VideoDTO {
  return {
    id: v._id ? String(v._id) : String(v.id),
    title: v.title,
    description: v.description,
    videoUrl: v.videoUrl,
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    category: v.category,
    views: v.views,
    featured: Boolean(v.featured),
    quality: v.quality || ["1080p", "720p"],
    tags: v.tags || [],
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : v.createdAt,
  }
}

// Escape regular expression special characters to avoid ReDoS / injection
function escapeRegex(text: string): string {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")
}

export class VideoService {
  /**
   * Seed videos into MongoDB Atlas if collection is empty
   */
  static async ensureSeedVideos(): Promise<void> {
    if (!isDatabaseConnected()) return

    try {
      const count = await Video.countDocuments()
      if (count === 0) {
        console.log("[VideoService] Seeding initial video catalog into MongoDB Atlas...")
        const docs = SEED_VIDEOS.map((v) => ({
          _id: v.id,
          title: v.title,
          description: v.description,
          videoUrl: v.videoUrl,
          thumbnailUrl: v.thumbnailUrl,
          duration: v.duration,
          category: v.category,
          views: v.views,
          featured: v.featured,
          quality: v.quality,
          tags: v.tags,
        }))
        await Video.insertMany(docs, { ordered: false })
        console.log(`[VideoService] Successfully seeded ${docs.length} videos to MongoDB Atlas.`)
      }
    } catch (err: any) {
      // Ignore duplicate key error on concurrent workers
      if (err?.code !== 11000) {
        console.warn("[VideoService] Seeding warning:", err?.message || err)
      }
    }
  }

  /**
   * Get all videos, optionally filtered by category
   */
  static async getAllVideos(category?: string): Promise<VideoDTO[]> {
    await this.ensureSeedVideos()

    if (isDatabaseConnected()) {
      try {
        const query: any = {}
        if (category && category !== "All") {
          query.category = { $regex: new RegExp(`^${escapeRegex(category)}$`, "i") }
        }
        const videos = await Video.find(query).sort({ createdAt: -1 }).lean()
        if (videos && videos.length > 0) {
          return videos.map(toVideoDTO)
        }
      } catch (err) {
        console.warn("[VideoService] Atlas fetch error, falling back to local dataset:", err)
      }
    }

    if (category && category !== "All") {
      return SEED_VIDEOS.filter((v) => v.category.toLowerCase() === category.toLowerCase())
    }
    return SEED_VIDEOS
  }

  /**
   * Get single video by ID
   */
  static async getVideoById(id: string): Promise<VideoDTO | null> {
    await this.ensureSeedVideos()

    if (isDatabaseConnected()) {
      try {
        const video = await Video.findById(id).lean()
        if (video) {
          return toVideoDTO(video)
        }
      } catch (err) {
        console.warn("[VideoService] Atlas lookup error, checking seed list:", err)
      }
    }

    const found = SEED_VIDEOS.find((v) => v.id === id)
    return found || null
  }

  /**
   * Advanced Video Search with filters, sorting, and pagination
   */
  static async searchVideos(options: VideoSearchOptions = {}): Promise<PaginatedVideosResult> {
    await this.ensureSeedVideos()

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

    if (isDatabaseConnected()) {
      try {
        const filter: any = {}

        // 1. Text / Keyword Search
        if (cleanQuery) {
          const safeRegex = new RegExp(escapeRegex(cleanQuery), "i")
          filter.$or = [
            { title: { $regex: safeRegex } },
            { description: { $regex: safeRegex } },
            { tags: { $in: [safeRegex] } },
            { category: { $regex: safeRegex } },
          ]
        }

        // 2. Category Filter
        if (category && category !== "All") {
          filter.category = { $regex: new RegExp(`^${escapeRegex(category)}$`, "i") }
        }

        // 3. Duration Filter
        if (duration === "short") {
          filter.duration = { $lt: 300 } // Under 5 minutes
        } else if (duration === "medium") {
          filter.duration = { $gte: 300, $lte: 900 } // 5 to 15 minutes
        } else if (duration === "long") {
          filter.duration = { $gt: 900 } // Over 15 minutes
        }

        // 4. Popularity Filter
        if (popularity === "popular") {
          filter.views = { $gte: 100000 }
        }

        // 5. Date Range Filter
        if (dateRange !== "any") {
          const now = new Date()
          const dateFilter: any = {}
          if (dateRange === "week") {
            dateFilter.$gte = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          } else if (dateRange === "month") {
            dateFilter.$gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          } else if (dateRange === "year") {
            dateFilter.$gte = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          }
          if (dateFilter.$gte) {
            filter.createdAt = dateFilter
          }
        }

        // 6. Sorting Order
        let sortOption: any = { createdAt: -1 }
        if (sort === "recent") {
          sortOption = { createdAt: -1 }
        } else if (sort === "views") {
          sortOption = { views: -1 }
        } else if (sort === "alpha") {
          sortOption = { title: 1 }
        } else if (sort === "relevant") {
          // If query present, prioritize views and match order
          sortOption = cleanQuery ? { views: -1 } : { featured: -1, views: -1 }
        }

        const [items, total] = await Promise.all([
          Video.find(filter).sort(sortOption).skip(skip).limit(safeLimit).lean(),
          Video.countDocuments(filter),
        ])

        return {
          items: items.map(toVideoDTO),
          total,
          page: safePage,
          limit: safeLimit,
          totalPages: Math.ceil(total / safeLimit) || 1,
        }
      } catch (err) {
        console.warn("[VideoService] Search in Atlas failed, falling back to in-memory filter:", err)
      }
    }

    // In-memory fallback
    let filtered = [...SEED_VIDEOS]

    if (cleanQuery) {
      const qLower = cleanQuery.toLowerCase()
      filtered = filtered.filter(
        (v) =>
          v.title.toLowerCase().includes(qLower) ||
          v.description.toLowerCase().includes(qLower) ||
          v.category.toLowerCase().includes(qLower) ||
          v.tags.some((t) => t.toLowerCase().includes(qLower))
      )
    }

    if (category && category !== "All") {
      filtered = filtered.filter((v) => v.category.toLowerCase() === category.toLowerCase())
    }

    if (duration === "short") {
      filtered = filtered.filter((v) => v.duration < 300)
    } else if (duration === "medium") {
      filtered = filtered.filter((v) => v.duration >= 300 && v.duration <= 900)
    } else if (duration === "long") {
      filtered = filtered.filter((v) => v.duration > 900)
    }

    if (popularity === "popular") {
      filtered = filtered.filter((v) => v.views >= 100000)
    }

    if (sort === "recent") {
      filtered.reverse()
    } else if (sort === "views") {
      filtered.sort((a, b) => b.views - a.views)
    } else if (sort === "alpha") {
      filtered.sort((a, b) => a.title.localeCompare(b.title))
    }

    const total = filtered.length
    const paginated = filtered.slice(skip, skip + safeLimit)

    return {
      items: paginated,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit) || 1,
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

    // 1. Direct title matching
    for (const v of searchRes.items) {
      if (v.title.toLowerCase().includes(qLower)) {
        suggestionsSet.add(v.title)
      }
      // 2. Tag matching
      for (const t of v.tags) {
        if (t.toLowerCase().includes(qLower)) {
          suggestionsSet.add(t)
        }
      }
      // 3. Category matching
      if (v.category.toLowerCase().includes(qLower)) {
        suggestionsSet.add(v.category)
      }
    }

    return {
      suggestions: Array.from(suggestionsSet).slice(0, limit),
      videos: searchRes.items.slice(0, 4),
    }
  }

  /**
   * Personalized recommendations scoring engine (Feature 4)
   * Formula:
   *  - Category similarity: 35%
   *  - Tag similarity: 25%
   *  - Watch history relevance: 20%
   *  - Popularity: 10%
   *  - Recency: 10%
   */
  static async getPersonalizedRecommendations(userId?: string, limit = 8): Promise<VideoDTO[]> {
    await this.ensureSeedVideos()
    const allVideos = await this.getAllVideos()

    if (!userId) {
      // Unauthenticated: Fallback to featured + highest views
      return [...allVideos]
        .sort((a, b) => (b.featured ? 1 : 0) * 1000000 + b.views - ((a.featured ? 1 : 0) * 1000000 + a.views))
        .slice(0, limit)
    }

    // Check user privacy preferences
    const user = await UserService.getUserById(userId)
    if (user?.preferences?.historyTrackingEnabled === false) {
      return [...allVideos]
        .sort((a, b) => b.views - a.views)
        .slice(0, limit)
    }

    // Fetch user's watch history
    let userProgressList: any[] = []
    if (isDatabaseConnected()) {
      try {
        userProgressList = await WatchProgress.find({ userId }).lean()
      } catch (err) {
        console.warn("[VideoService] Could not fetch progress for recommendations:", err)
      }
    }

    if (!userProgressList || userProgressList.length === 0) {
      // New user with no history: Return diverse featured content
      return [...allVideos]
        .sort((a, b) => (b.featured ? 1 : 0) * 1000000 + b.views - ((a.featured ? 1 : 0) * 1000000 + a.views))
        .slice(0, limit)
    }

    // 1. Calculate Category Frequency
    const categoryCounts: Record<string, number> = {}
    const tagCounts: Record<string, number> = {}
    const watchedVideoIds = new Set<string>()

    for (const prog of userProgressList) {
      watchedVideoIds.add(prog.videoId)
      const vid = allVideos.find((v) => v.id === prog.videoId)
      if (vid) {
        categoryCounts[vid.category] = (categoryCounts[vid.category] || 0) + 1
        for (const t of vid.tags) {
          tagCounts[t] = (tagCounts[t] || 0) + 1
        }
      }
    }

    const totalWatched = Math.max(1, userProgressList.length)
    const maxViews = Math.max(1, ...allVideos.map((v) => v.views))

    // 2. Score candidate videos
    const scored = allVideos.map((video) => {
      // Completely watched videos receive lower ranking so user discovers new content
      const hasWatched = watchedVideoIds.has(video.id)
      const userProg = userProgressList.find((p) => p.videoId === video.id)
      const isCompleted = userProg?.isCompleted || (userProg?.completionPercentage || 0) >= 90

      // Category Similarity (35%)
      const catCount = categoryCounts[video.category] || 0
      const categoryScore = (catCount / totalWatched) * 35

      // Tag Similarity (25%)
      const matchedTags = video.tags.filter((t) => tagCounts[t] && tagCounts[t] > 0).length
      const tagScore = Math.min(25, (matchedTags / Math.max(1, video.tags.length)) * 25)

      // Watch History Relevance (20%): unfinished videos boost relevance slightly, fully completed gets penalty
      let historyScore = 0
      if (hasWatched && !isCompleted && userProg?.lastPositionSeconds > 5) {
        historyScore = 18 // Strong incentive to resume/finish
      } else if (!hasWatched) {
        historyScore = 15 // High incentive for fresh unviewed content
      } else {
        historyScore = 2 // Already finished
      }

      // Popularity (10%)
      const popularityScore = (video.views / maxViews) * 10

      // Recency / Featured Boost (10%)
      const featuredBoost = video.featured ? 10 : 6

      const totalScore = categoryScore + tagScore + historyScore + popularityScore + featuredBoost

      return {
        video,
        score: totalScore,
      }
    })

    // Sort by descending recommendation score
    scored.sort((a, b) => b.score - a.score)

    return scored.map((s) => s.video).slice(0, limit)
  }

  /**
   * Get Trending Videos
   */
  static async getTrendingVideos(limit = 8): Promise<VideoDTO[]> {
    await this.ensureSeedVideos()
    const all = await this.getAllVideos()
    return [...all].sort((a, b) => b.views - a.views).slice(0, limit)
  }

  /**
   * Get Recently Added Videos
   */
  static async getRecentlyAdded(limit = 8): Promise<VideoDTO[]> {
    await this.ensureSeedVideos()
    const all = await this.getAllVideos()
    // Returns newest first
    return [...all].slice(0, limit)
  }
}
