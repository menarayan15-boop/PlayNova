import { Video, IVideo } from "../models/Video.js"
import { isDatabaseConnected } from "../config/db.js"

export interface VideoDTO {
  id: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  duration: number
  category: "Technology" | "Education" | "Nature" | "Science" | "Space" | "Entertainment"
  views: number
  featured?: boolean
  quality: string[]
  tags: string[]
}

export const SAMPLE_VIDEOS: VideoDTO[] = [
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

export class VideoService {
  static async getAllVideos(category?: string): Promise<VideoDTO[]> {
    if (isDatabaseConnected()) {
      try {
        const query = category ? { category } : {}
        const videos = await Video.find(query).sort({ createdAt: -1 }).lean()
        if (videos && videos.length > 0) {
          return videos.map((v) => ({
            id: v._id.toString(),
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
        }
      } catch (err) {
        console.warn("[VideoService] Failed to fetch from MongoDB, falling back to sample data:", err)
      }
    }

    if (category) {
      return SAMPLE_VIDEOS.filter((v) => v.category.toLowerCase() === category.toLowerCase())
    }
    return SAMPLE_VIDEOS
  }

  static async getVideoById(id: string): Promise<VideoDTO | null> {
    if (isDatabaseConnected()) {
      try {
        const video = await Video.findById(id).lean()
        if (video) {
          return {
            id: video._id.toString(),
            title: video.title,
            description: video.description,
            videoUrl: video.videoUrl,
            thumbnailUrl: video.thumbnailUrl,
            duration: video.duration,
            category: video.category,
            views: video.views,
            featured: video.featured,
            quality: video.quality,
            tags: video.tags,
          }
        }
      } catch (err) {
        console.warn("[VideoService] MongoDB lookup failed, checking sample list:", err)
      }
    }

    const found = SAMPLE_VIDEOS.find((v) => v.id === id)
    return found || null
  }
}

