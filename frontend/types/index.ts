export type VideoCategory =
  | "Technology"
  | "Education"
  | "Nature"
  | "Science"
  | "Space"
  | "Entertainment"

export interface VideoItem {
  id: string
  title: string
  description: string
  videoUrl: string
  thumbnailUrl: string
  duration: number // in seconds
  category: VideoCategory
  views: number
  featured?: boolean
  quality: string[]
  tags: string[]
}

export interface PlayerState {
  isPlaying: boolean
  isMuted: boolean
  volume: number // 0 to 1
  currentTime: number
  duration: number
  isBuffering: boolean
  isFullscreen: boolean
  error: string | null
  playbackRate: number
  currentVideo: VideoItem | null
  // Phase 2 architecture preparation
  isTheaterMode: boolean
  isPictureInPicture: boolean
  selectedQuality: string
  subtitlesEnabled: boolean
}

export interface NavItem {
  label: string
  href: string
}

