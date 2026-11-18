import { VideoItem } from "@/types"
import { buildApiUrl } from "@/utils/apiConfig"

export const DEFAULT_SAMPLE_VIDEOS: VideoItem[] = [
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
    tags: ["astronomy", "space", "nebula", "exploration"],
    subtitles: [
      { id: "sub-en", label: "English", language: "en", src: "/captions/english.vtt", default: true },
      { id: "sub-es", label: "Español", language: "es", src: "/captions/spanish.vtt" },
    ],
    previewThumbnails: [
      { time: 0, imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=300&q=70" },
      { time: 60, imageUrl: "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=70" },
      { time: 180, imageUrl: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=300&q=70" },
      { time: 300, imageUrl: "https://images.unsplash.com/photo-1447433589675-4aaa569f3e05?auto=format&fit=crop&w=300&q=70" },
      { time: 480, imageUrl: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=300&q=70" },
      { time: 600, imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=70" },
    ],
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
    tags: ["nature", "animation", "blender", "story"],
    subtitles: [
      { id: "sub-en", label: "English", language: "en", src: "/captions/english.vtt", default: true },
    ],
    previewThumbnails: [
      { time: 0, imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=300&q=70" },
      { time: 100, imageUrl: "https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=300&q=70" },
      { time: 300, imageUrl: "https://images.unsplash.com/photo-1511497584788-87676104235f?auto=format&fit=crop&w=300&q=70" },
      { time: 500, imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=70" },
    ],
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
    featured: false,
    quality: ["4K", "1080p"],
    tags: ["quantum", "silicon", "hardware", "computing"],
    subtitles: [
      { id: "sub-en", label: "English", language: "en", src: "/captions/english.vtt" },
    ],
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
    tags: ["ocean", "biology", "ecology", "reefs"],
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
    tags: ["react", "web", "nextjs", "coding"],
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
    tags: ["audio", "orchestra", "film", "soundtrack"],
  },
]

export async function fetchVideos(category?: string): Promise<VideoItem[]> {
  try {
    const rawUrl = buildApiUrl("/api/v1/videos")
    const url = new URL(rawUrl, "http://localhost:5001")
    if (category && category !== "All") {
      url.searchParams.set("category", category)
    }

    const res = await fetch(
      rawUrl.startsWith("http") ? url.toString() : `${rawUrl}${url.searchParams.toString() ? `?${url.searchParams.toString()}` : ""}`,
      {
        next: { revalidate: 60 },
        headers: { "Content-Type": "application/json" },
      }
    )

    if (!res.ok) {
      return []
    }

    const data = await res.json()
    if (data.status === "success" && Array.isArray(data.data)) {
      return data.data
    }
  } catch (err) {
    console.warn("[api] fetchVideos failed:", err)
  }

  // Never silently serve fake hardcoded fallback videos
  return []
}

export async function fetchVideoById(id: string): Promise<VideoItem | null> {
  try {
    const res = await fetch(buildApiUrl(`/api/v1/videos/${id}`), {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })
    if (res.ok) {
      const data = await res.json()
      if (data.status === "success" && data.data) {
        return data.data
      }
    }
  } catch (err) {
    console.warn("[api] fetchVideoById failed:", err)
  }

  // Fallback for YouTube video IDs via dedicated YouTube endpoint when DB is temporarily unavailable
  if (id.startsWith("yt_")) {
    try {
      const ytRes = await fetch(buildApiUrl(`/api/v1/youtube/video/${encodeURIComponent(id)}`), {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      })
      if (ytRes.ok) {
        const data = await ytRes.json()
        if (data.status === "success" && data.data) {
          return data.data
        }
      }
    } catch (err) {
      console.warn("[api] YouTube video fallback failed:", err)
    }
  }

  return null
}
