import { create } from "zustand"
import { VideoItem, PlayerState, PlaybackSpeed, SubtitleTrack } from "@/types"

interface PlayerActions {
  setPlayerId: (id: string) => void
  setIsPlaying: (playing: boolean) => void
  togglePlay: () => void
  setIsEnded: (ended: boolean) => void
  setIsMuted: (muted: boolean) => void
  toggleMute: () => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setBufferedTime: (time: number) => void
  setIsBuffering: (buffering: boolean) => void
  setIsLoading: (loading: boolean) => void
  setIsFullscreen: (fullscreen: boolean) => void
  setIsTheaterMode: (theater: boolean) => void
  toggleTheaterMode: () => void
  setIsPiP: (pip: boolean) => void
  setIsPiPSupported: (supported: boolean) => void
  setPlaybackSpeed: (speed: PlaybackSpeed) => void
  cyclePlaybackSpeed: (direction: "up" | "down") => void
  setActiveSubtitleTrack: (lang: string | null) => void
  setAvailableSubtitles: (tracks: SubtitleTrack[]) => void
  toggleSubtitles: () => void
  toggleRemainingTime: () => void
  setIsSettingsOpen: (open: boolean) => void
  toggleSettingsOpen: () => void
  setIsShortcutsOpen: (open: boolean) => void
  toggleShortcutsOpen: () => void
  setActualResolution: (res: string) => void
  setError: (error: string | null) => void
  setVideo: (video: VideoItem) => void
}

const SPEED_OPTIONS: PlaybackSpeed[] = [0.5, 1, 1.25, 1.5, 2]

function getInitialVolume(): number {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("playnova_volume")
      if (saved !== null) {
        const parsed = parseFloat(saved)
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) return parsed
      }
    } catch {
      // Ignore localStorage errors
    }
  }
  return 0.8
}

function getInitialMuted(): boolean {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("playnova_muted")
      if (saved !== null) return saved === "true"
    } catch {
      // Ignore localStorage errors
    }
  }
  return false
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set, get) => ({
  playerId: "playnova-main",
  isPlaying: false,
  isEnded: false,
  isMuted: getInitialMuted(),
  volume: getInitialVolume(),
  previousVolume: getInitialVolume() || 0.8,
  currentTime: 0,
  duration: 0,
  bufferedTime: 0,
  isBuffering: false,
  isLoading: true,
  isFullscreen: false,
  isTheaterMode: false,
  isPiP: false,
  isPiPSupported: false,
  playbackSpeed: 1,
  activeSubtitleTrack: null,
  availableSubtitles: [],
  showRemainingTime: false,
  isSettingsOpen: false,
  isShortcutsOpen: false,
  error: null,
  currentVideo: null,
  actualResolution: "1080p HD",

  setPlayerId: (playerId) => set({ playerId }),
  setIsPlaying: (isPlaying) => set({ isPlaying, isEnded: isPlaying ? false : get().isEnded }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying, isEnded: false })),
  setIsEnded: (isEnded) => set({ isEnded, isPlaying: isEnded ? false : get().isPlaying }),

  setIsMuted: (isMuted) => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("playnova_muted", String(isMuted))
      } catch {}
    }
    set({ isMuted })
  },

  toggleMute: () => {
    const { isMuted, volume, previousVolume } = get()
    if (isMuted) {
      const restored = previousVolume > 0 ? previousVolume : 0.8
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("playnova_muted", "false")
          localStorage.setItem("playnova_volume", String(restored))
        } catch {}
      }
      set({ isMuted: false, volume: restored })
    } else {
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("playnova_muted", "true")
        } catch {}
      }
      set({ isMuted: true, previousVolume: volume > 0 ? volume : previousVolume })
    }
  },

  setVolume: (newVolume) => {
    const clamped = Math.max(0, Math.min(1, newVolume))
    const isMuted = clamped === 0
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("playnova_volume", String(clamped))
        localStorage.setItem("playnova_muted", String(isMuted))
      } catch {}
    }
    set((state) => ({
      volume: clamped,
      isMuted,
      previousVolume: clamped > 0 ? clamped : state.previousVolume,
    }))
  },

  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setBufferedTime: (bufferedTime) => set({ bufferedTime }),
  setIsBuffering: (isBuffering) => set({ isBuffering }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setIsTheaterMode: (isTheaterMode) => set({ isTheaterMode }),
  toggleTheaterMode: () => set((state) => ({ isTheaterMode: !state.isTheaterMode })),
  setIsPiP: (isPiP) => set({ isPiP }),
  setIsPiPSupported: (isPiPSupported) => set({ isPiPSupported }),

  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

  cyclePlaybackSpeed: (direction) => {
    const current = get().playbackSpeed
    const currentIndex = SPEED_OPTIONS.indexOf(current)
    let nextIndex: number
    if (direction === "up") {
      nextIndex = Math.min(SPEED_OPTIONS.length - 1, (currentIndex === -1 ? 1 : currentIndex) + 1)
    } else {
      nextIndex = Math.max(0, (currentIndex === -1 ? 1 : currentIndex) - 1)
    }
    set({ playbackSpeed: SPEED_OPTIONS[nextIndex] })
  },

  setActiveSubtitleTrack: (activeSubtitleTrack) => {
    if (get().activeSubtitleTrack === activeSubtitleTrack) return
    set({ activeSubtitleTrack })
  },

  setAvailableSubtitles: (newTracks) => {
    const current = get().availableSubtitles
    // Check if the tracks array is structurally unchanged to avoid infinite state loops
    if (current && newTracks && current.length === newTracks.length) {
      const isIdentical = current.every((track, i) => {
        const next = newTracks[i]
        return (
          track.id === next.id &&
          track.language === next.language &&
          track.label === next.label &&
          track.src === next.src &&
          track.default === next.default
        )
      })
      if (isIdentical) {
        return // Bail out: identical subtitles already in store
      }
    }
    set({ availableSubtitles: newTracks })
  },

  toggleSubtitles: () => {
    const { activeSubtitleTrack, availableSubtitles } = get()
    if (activeSubtitleTrack) {
      set({ activeSubtitleTrack: null })
    } else if (availableSubtitles.length > 0) {
      const defaultTrack = availableSubtitles.find((t) => t.default) || availableSubtitles[0]
      set({ activeSubtitleTrack: defaultTrack.language })
    }
  },

  toggleRemainingTime: () => set((state) => ({ showRemainingTime: !state.showRemainingTime })),
  setIsSettingsOpen: (isSettingsOpen) => set({ isSettingsOpen }),
  toggleSettingsOpen: () => set((state) => ({ isSettingsOpen: !state.isSettingsOpen })),
  setIsShortcutsOpen: (isShortcutsOpen) => set({ isShortcutsOpen }),
  toggleShortcutsOpen: () => set((state) => ({ isShortcutsOpen: !state.isShortcutsOpen })),
  setActualResolution: (actualResolution) => set({ actualResolution }),
  setError: (error) => set({ error, isBuffering: false, isPlaying: false, isLoading: false }),

  setVideo: (video) => {
    const subs = video.subtitles || []
    const defaultSub = subs.find((s) => s.default)
    set({
      currentVideo: video,
      currentTime: 0,
      duration: video.duration || 0,
      bufferedTime: 0,
      isPlaying: false,
      isEnded: false,
      error: null,
      isLoading: true,
      isBuffering: false,
      availableSubtitles: subs,
      activeSubtitleTrack: defaultSub ? defaultSub.language : null,
      actualResolution: video.quality && video.quality.length > 0 ? video.quality[0] : "1080p HD",
    })
  },
}))
