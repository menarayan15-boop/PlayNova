export type VideoCategory =
  | "Technology"
  | "Education"
  | "Nature"
  | "Science"
  | "Space"
  | "Entertainment"

export interface SubtitleTrack {
  id: string
  label: string
  language: string
  src: string
  default?: boolean
}

export interface ThumbnailPreview {
  time: number
  imageUrl: string
}

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
  subtitles?: SubtitleTrack[]
  previewThumbnails?: ThumbnailPreview[]
}

export type PlaybackSpeed = 0.5 | 1 | 1.25 | 1.5 | 2

export type ViewingMode = "normal" | "theater" | "fullscreen"

export interface PlayerState {
  playerId: string
  isPlaying: boolean
  isEnded: boolean
  isMuted: boolean
  volume: number // 0 to 1
  previousVolume: number // for restoring on unmute
  currentTime: number
  duration: number
  bufferedTime: number
  isBuffering: boolean
  isLoading: boolean
  isFullscreen: boolean
  isTheaterMode: boolean
  isPiP: boolean
  isPiPSupported: boolean
  playbackSpeed: PlaybackSpeed
  activeSubtitleTrack: string | null // track language or null for off
  availableSubtitles: SubtitleTrack[]
  showRemainingTime: boolean
  isSettingsOpen: boolean
  isShortcutsOpen: boolean
  error: string | null
  currentVideo: VideoItem | null
  actualResolution: string
}

export interface NavItem {
  label: string
  href: string
}
