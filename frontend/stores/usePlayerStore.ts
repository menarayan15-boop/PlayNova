import { create } from "zustand"
import { VideoItem, PlayerState } from "@/types"

interface PlayerActions {
  setIsPlaying: (playing: boolean) => void
  togglePlay: () => void
  setIsMuted: (muted: boolean) => void
  toggleMute: () => void
  setVolume: (volume: number) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setIsBuffering: (buffering: boolean) => void
  setIsFullscreen: (fullscreen: boolean) => void
  setError: (error: string | null) => void
  setPlaybackRate: (rate: number) => void
  setVideo: (video: VideoItem) => void
  // Prepared architecture for Phase 2 features
  toggleTheaterMode: () => void
  togglePictureInPicture: () => void
  setSelectedQuality: (quality: string) => void
  toggleSubtitles: () => void
}

export const usePlayerStore = create<PlayerState & PlayerActions>((set) => ({
  isPlaying: false,
  isMuted: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  isBuffering: false,
  isFullscreen: false,
  error: null,
  playbackRate: 1.0,
  currentVideo: null,

  // Future architecture placeholders
  isTheaterMode: false,
  isPictureInPicture: false,
  selectedQuality: "1080p",
  subtitlesEnabled: false,

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsMuted: (isMuted) => set({ isMuted }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)), isMuted: volume === 0 }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  setDuration: (duration) => set({ duration }),
  setIsBuffering: (isBuffering) => set({ isBuffering }),
  setIsFullscreen: (isFullscreen) => set({ isFullscreen }),
  setError: (error) => set({ error, isBuffering: false, isPlaying: false }),
  setPlaybackRate: (playbackRate) => set({ playbackRate }),
  setVideo: (video) =>
    set({
      currentVideo: video,
      currentTime: 0,
      duration: video.duration || 0,
      isPlaying: false,
      error: null,
      isBuffering: false,
    }),

  toggleTheaterMode: () => set((state) => ({ isTheaterMode: !state.isTheaterMode })),
  togglePictureInPicture: () => set((state) => ({ isPictureInPicture: !state.isPictureInPicture })),
  setSelectedQuality: (selectedQuality) => set({ selectedQuality }),
  toggleSubtitles: () => set((state) => ({ subtitlesEnabled: !state.subtitlesEnabled })),
}))

