export type VideoCategory =
  | "Gaming"
  | "Music"
  | "Movies and Trailers"
  | "Entertainment"
  | "Comedy"
  | "Technology"
  | "AI and Programming"
  | "Science"
  | "Space"
  | "Nature"
  | "Travel and Vlogs"
  | "Food and Cooking"
  | "Fitness"
  | "Sports"
  | "Podcasts"
  | "Education"
  | "News"
  | "Documentaries"
  | "Short Videos"

export const ALL_VIDEO_CATEGORIES: VideoCategory[] = [
  "Gaming",
  "Music",
  "Movies and Trailers",
  "Entertainment",
  "Comedy",
  "Technology",
  "AI and Programming",
  "Science",
  "Space",
  "Nature",
  "Travel and Vlogs",
  "Food and Cooking",
  "Fitness",
  "Sports",
  "Podcasts",
  "Education",
  "News",
  "Documentaries",
  "Short Videos",
]

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
  normalizedSourceUrl?: string
  sourceType?: "native" | "youtube"
  externalVideoId?: string
  channelTitle?: string
  channelId?: string
  embeddable?: boolean
  isShortForm?: boolean
  thumbnailUrl: string
  duration: number // in seconds
  category: VideoCategory
  categories?: VideoCategory[]
  views: number
  featured?: boolean
  quality: string[]
  tags: string[]
  sourceProvider?: string
  sourceAttribution?: string
  license?: string
  status?: "published" | "draft" | "archived" | "duplicate_archived" | "broken"
  validationStatus?: "verified" | "pending" | "failed"
  createdAt?: string
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

export interface NotificationPreferences {
  recommendations: boolean
  newReleases: boolean
  systemUpdates: boolean
}

// User & Authentication Types for Phase 3, 4 & 10
export interface UserPreferences {
  preferredSpeed: number
  preferredSubtitle: string | null
  autoplay: boolean
  preferredTheme: string
  defaultVolume: number
  historyTrackingEnabled?: boolean
  resumePreference?: "ask" | "auto" | "start_over"
  completionThreshold?: number
  notificationPreferences?: NotificationPreferences
}

export interface WatchProgressDTO {
  id: string
  userId: string
  videoId: string
  lastPositionSeconds: number
  durationSeconds: number
  furthestPositionSeconds: number
  watchedIntervals: [number, number][]
  completionPercentage: number
  watchedPercentage?: number
  isCompleted: boolean
  completed?: boolean
  firstWatchedAt: string
  lastWatchedAt: string
  completedAt: string | null
  updatedAt?: string
  version: number
}

export interface HistoryItemDTO {
  progress: WatchProgressDTO
  video: VideoItem | null
}

export interface PaginatedHistoryResult {
  items: HistoryItemDTO[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface ProgressUpdatePayload {
  lastPositionSeconds: number
  durationSeconds: number
  interval?: [number, number]
  clientVersion?: number
}

export interface User {
  id: string
  fullName: string
  email: string
  role: "user" | "admin"
  avatarUrl?: string
  lastLoginAt?: string
  preferences: UserPreferences
  createdAt: string
  updatedAt?: string
}

export interface AuthResponse {
  status: "success" | "error"
  message?: string
  data?: {
    user: User
  }
}
