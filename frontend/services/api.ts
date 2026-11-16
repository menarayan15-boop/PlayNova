import { VideoItem } from "@/types"

export const DEFAULT_SAMPLE_VIDEOS: VideoItem[] = [
  {
    id: "nova-01",
    title: "Cosmic Horizons: The Deep Space Explorer",
    description: "Journey beyond the known solar system with high-definition deep space imaging and astrophysical observations.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
    duration: 734,
    category: "Space",
    views: 142500,
    featured: true,
    quality: ["4K", "1080p", "720p"],
    tags: ["astronomy", "space", "nebula", "exploration"],
  },
  {
    id: "nova-02",
    title: "Big Buck Bunny: The Open Animation Masterpiece",
    description: "The classic open-source 3D animated film produced by the Blender Institute, featuring forest wildlife and humor.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1200&q=80",
    duration: 596,
    category: "Nature",
    views: 893000,
    featured: true,
    quality: ["1080p", "720p", "480p"],
    tags: ["nature", "animation", "blender", "story"],
  },
  {
    id: "nova-03",
    title: "Quantum Computing & The Silicon Frontier",
    description: "An in-depth documentary exploring qubit coherence, cryogenic cooling, and quantum computational superiority.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
    duration: 420,
    category: "Technology",
    views: 65120,
    featured: false,
    quality: ["4K", "1080p"],
    tags: ["quantum", "silicon", "hardware", "computing"],
  },
  {
    id: "nova-04",
    title: "The Architecture of Living Coral Reefs",
    description: "Explore the fragile biodiversity and calcium carbonate structures of the Indo-Pacific reef systems.",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
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
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
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
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80",
    duration: 654,
    category: "Entertainment",
    views: 94600,
    featured: false,
    quality: ["4K", "1080p", "720p"],
    tags: ["audio", "orchestra", "film", "soundtrack"],
  },
]

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"

export async function fetchVideos(category?: string): Promise<VideoItem[]> {
  try {
    const url = new URL(`${API_BASE_URL}/api/videos`)
    if (category && category !== "All") {
      url.searchParams.set("category", category)
    }

    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
      throw new Error(`API responded with status: ${res.status}`)
    }

    const data = await res.json()
    if (data.status === "success" && Array.isArray(data.data)) {
      return data.data
    }
  } catch (err) {
    // Graceful offline fallback
    console.info("Using local sample videos (API offline or unreachable)")
  }

  if (category && category !== "All") {
    return DEFAULT_SAMPLE_VIDEOS.filter(
      (v) => v.category.toLowerCase() === category.toLowerCase()
    )
  }
  return DEFAULT_SAMPLE_VIDEOS
}

export async function fetchVideoById(id: string): Promise<VideoItem | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/videos/${id}`, {
      headers: { "Content-Type": "application/json" },
    })
    if (res.ok) {
      const data = await res.json()
      if (data.status === "success" && data.data) {
        return data.data
      }
    }
  } catch (err) {
    // Ignore and fallback
  }

  const local = DEFAULT_SAMPLE_VIDEOS.find((v) => v.id === id)
  return local || null
}

