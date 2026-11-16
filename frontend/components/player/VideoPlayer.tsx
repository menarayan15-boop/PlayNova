"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { usePlayerStore } from "@/stores/usePlayerStore"
import { SubtitleTrack, ThumbnailPreview, PlaybackSpeed } from "@/types"
import PlayerControls from "./PlayerControls"
import LoadingIndicator from "./LoadingIndicator"
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp"
import { usePlaybackCoordinator } from "@/hooks/usePlaybackCoordinator"
import { useAutoHideControls } from "@/hooks/useAutoHideControls"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"

interface VideoPlayerProps {
  id?: string
  src?: string
  title?: string
  poster?: string
  autoPlay?: boolean
  subtitles?: SubtitleTrack[]
  thumbnails?: ThumbnailPreview[]
  className?: string
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onEnded?: () => void
  onNextVideo?: () => void
}

const DEFAULT_SUBTITLES: SubtitleTrack[] = [
  { id: "sub-en", label: "English", language: "en", src: "/captions/english.vtt", default: true },
  { id: "sub-es", label: "Español", language: "es", src: "/captions/spanish.vtt" },
]

export default function VideoPlayer({
  id = "nova-player-main",
  src = "/sample-videos/cosmic-horizons.mp4",
  title = "Cosmic Horizons: The Deep Space Explorer",
  poster = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  autoPlay = false,
  subtitles = DEFAULT_SUBTITLES,
  thumbnails,
  className = "",
  onTimeUpdate,
  onEnded,
  onNextVideo,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const {
    isPlaying,
    isEnded,
    isMuted,
    volume,
    currentTime,
    duration,
    bufferedTime,
    isBuffering,
    isLoading,
    isFullscreen,
    isTheaterMode,
    isPiP,
    isPiPSupported,
    playbackSpeed,
    activeSubtitleTrack,
    showRemainingTime,
    isSettingsOpen,
    isShortcutsOpen,
    error,
    actualResolution,
    setIsPlaying,
    setIsEnded,
    setIsMuted,
    setVolume,
    setCurrentTime,
    setDuration,
    setBufferedTime,
    setIsBuffering,
    setIsLoading,
    setIsFullscreen,
    toggleTheaterMode,
    setIsPiP,
    setIsPiPSupported,
    setPlaybackSpeed,
    cyclePlaybackSpeed,
    setActiveSubtitleTrack,
    setAvailableSubtitles,
    toggleSubtitles,
    toggleRemainingTime,
    toggleSettingsOpen,
    toggleShortcutsOpen,
    setIsShortcutsOpen,
    setActualResolution,
    setError,
  } = usePlayerStore()

  // 1. Playback Coordinator: Pauses other PlayNova players when this video plays
  const { notifyPlaying } = usePlaybackCoordinator(id, () => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause()
    }
  })

  // 2. Auto-hide controls
  const { controlsVisible, showControlsTemporarily } = useAutoHideControls({
    isPlaying,
    isScrubbing,
    isSettingsOpen,
    isShortcutsOpen,
    hideDelayMs: 3000,
  })

  // 3. Play / Pause logic
  const handleTogglePlay = useCallback(() => {
    setHasInteracted(true)
    if (!videoRef.current) return

    if (isEnded) {
      videoRef.current.currentTime = 0
      videoRef.current.play().catch(() => {})
      setIsEnded(false)
      setIsPlaying(true)
    } else if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current
        .play()
        .then(() => {
          setError(null)
          notifyPlaying()
        })
        .catch((err) => {
          console.warn("Play request was blocked or interrupted:", err)
        })
    }
  }, [isEnded, isPlaying, setIsEnded, setIsPlaying, setError, notifyPlaying])

  // 4. Seeking logic
  const handleSeek = useCallback(
    (time: number) => {
      if (!videoRef.current) return
      const clamped = Math.max(0, Math.min(time, duration || 0))
      videoRef.current.currentTime = clamped
      setCurrentTime(clamped)
      if (isEnded && clamped < (duration || 0)) {
        setIsEnded(false)
      }
    },
    [duration, isEnded, setCurrentTime, setIsEnded]
  )

  const handleSeekRelative = useCallback(
    (seconds: number) => {
      if (!videoRef.current) return
      const newTime = Math.max(0, Math.min((videoRef.current.currentTime || 0) + seconds, duration || 0))
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
      if (isEnded && newTime < (duration || 0)) {
        setIsEnded(false)
      }
      showControlsTemporarily()
    },
    [duration, isEnded, setCurrentTime, setIsEnded, showControlsTemporarily]
  )

  // 5. Volume adjustment
  const handleVolumeChange = useCallback(
    (newVol: number) => {
      if (!videoRef.current) return
      setVolume(newVol)
      videoRef.current.volume = newVol
      videoRef.current.muted = newVol === 0
    },
    [setVolume]
  )

  const handleToggleMute = useCallback(() => {
    if (!videoRef.current) return
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    videoRef.current.muted = nextMuted
  }, [isMuted, setIsMuted])

  // 6. Playback speed
  const handleSelectSpeed = useCallback(
    (speed: PlaybackSpeed) => {
      setPlaybackSpeed(speed)
      if (videoRef.current) {
        videoRef.current.playbackRate = speed
      }
    },
    [setPlaybackSpeed]
  )

  // 7. Fullscreen toggle
  const handleToggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (!document.fullscreenElement) {
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (containerRef.current as any).webkitRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } else if ((document as any).webkitExitFullscreen) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (document as any).webkitExitFullscreen()
        }
      }
    } catch (err) {
      console.warn("Fullscreen change was rejected:", err)
    }
  }, [])

  // 8. Picture-in-Picture toggle
  const handleTogglePiP = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture()
      }
    } catch (err) {
      console.warn("Picture-in-Picture failed:", err)
    }
  }, [])

  // 9. Subtitles track sync
  const handleSelectSubtitle = useCallback(
    (lang: string | null) => {
      setActiveSubtitleTrack(lang)
      const video = videoRef.current
      if (!video || !video.textTracks) return

      for (let i = 0; i < video.textTracks.length; i++) {
        const track = video.textTracks[i]
        if (lang && track.language === lang) {
          track.mode = "showing"
        } else {
          track.mode = "disabled"
        }
      }
    },
    [setActiveSubtitleTrack]
  )

  // 10. Check PiP support on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsPiPSupported(Boolean(document.pictureInPictureEnabled))
    }
  }, [setIsPiPSupported])

  // 11. Initial & dynamic subtitles setup with stability guards
  const prevSubtitlesRef = useRef<SubtitleTrack[] | null>(null)
  useEffect(() => {
    const currentSubs = subtitles || []
    const prev = prevSubtitlesRef.current
    const isUnchanged =
      prev !== null &&
      prev.length === currentSubs.length &&
      prev.every(
        (t, i) =>
          t.id === currentSubs[i]?.id &&
          t.language === currentSubs[i]?.language &&
          t.src === currentSubs[i]?.src &&
          t.default === currentSubs[i]?.default
      )

    if (!isUnchanged) {
      prevSubtitlesRef.current = currentSubs
      setAvailableSubtitles(currentSubs)

      // Automatically configure default subtitle if not already selected
      if (!activeSubtitleTrack && currentSubs.length > 0) {
        const defaultTrack = currentSubs.find((t) => t.default)
        if (defaultTrack) {
          setActiveSubtitleTrack(defaultTrack.language)
        }
      } else if (activeSubtitleTrack && !currentSubs.some((t) => t.language === activeSubtitleTrack)) {
        // If current selection is no longer in track list, fallback to null
        setActiveSubtitleTrack(null)
      }
    }
  }, [subtitles, activeSubtitleTrack, setAvailableSubtitles, setActiveSubtitleTrack])

  // Synchronize native HTML5 textTracks state whenever activeSubtitleTrack changes
  useEffect(() => {
    const video = videoRef.current
    if (!video || !video.textTracks) return

    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i]
      if (activeSubtitleTrack && track.language === activeSubtitleTrack) {
        track.mode = "showing"
      } else {
        track.mode = "disabled"
      }
    }
  }, [activeSubtitleTrack])

  // Register text-track change listener to sync browser-native track changes
  useEffect(() => {
    const video = videoRef.current
    if (!video || !video.textTracks) return

    const trackList = video.textTracks
    const handleNativeTrackChange = () => {
      let showingLang: string | null = null
      for (let i = 0; i < trackList.length; i++) {
        if (trackList[i].mode === "showing") {
          showingLang = trackList[i].language
          break
        }
      }
      if (showingLang !== activeSubtitleTrack) {
        setActiveSubtitleTrack(showingLang)
      }
    }

    trackList.addEventListener("change", handleNativeTrackChange)
    return () => {
      trackList.removeEventListener("change", handleNativeTrackChange)
    }
  }, [activeSubtitleTrack, setActiveSubtitleTrack])

  // 12. Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      const isFull = Boolean(
        document.fullscreenElement ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (document as any).webkitFullscreenElement
      )
      setIsFullscreen(isFull)
    }

    document.addEventListener("fullscreenchange", onFullscreenChange)
    document.addEventListener("webkitfullscreenchange", onFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange)
    }
  }, [setIsFullscreen])

  // 13. Synchronize volume and speed to video element on state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      videoRef.current.muted = isMuted
      videoRef.current.playbackRate = playbackSpeed
    }
  }, [volume, isMuted, playbackSpeed])

  // 14. Keyboard shortcuts hook
  useKeyboardShortcuts({
    isActive: true,
    onTogglePlay: handleTogglePlay,
    onSeekRelative: handleSeekRelative,
    onVolumeChangeRelative: (delta) => handleVolumeChange(volume + delta),
    onToggleMute: handleToggleMute,
    onToggleFullscreen: handleToggleFullscreen,
    onToggleTheaterMode: toggleTheaterMode,
    onTogglePiP: handleTogglePiP,
    onToggleSubtitles: toggleSubtitles,
    onCycleSpeed: cyclePlaybackSpeed,
    onNextVideo,
    onToggleHelpModal: toggleShortcutsOpen,
  })

  // 15. Native HTML5 Video Events
  const handleLoadStart = () => {
    setIsLoading(true)
    setError(null)
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    const dur = videoRef.current.duration
    setDuration(dur)
    setIsLoading(false)

    // Detect actual resolution
    const width = videoRef.current.videoWidth
    const height = videoRef.current.videoHeight
    if (height >= 2160 || width >= 3840) {
      setActualResolution("4K UHD")
    } else if (height >= 1080 || width >= 1920) {
      setActualResolution("1080p HD")
    } else if (height >= 720 || width >= 1280) {
      setActualResolution("720p HD")
    } else if (height > 0) {
      setActualResolution(`${height}p`)
    }

    // Apply active subtitle track
    if (activeSubtitleTrack && videoRef.current.textTracks) {
      for (let i = 0; i < videoRef.current.textTracks.length; i++) {
        const track = videoRef.current.textTracks[i]
        track.mode = track.language === activeSubtitleTrack ? "showing" : "disabled"
      }
    }
  }

  const handleCanPlay = () => {
    setIsLoading(false)
    setIsBuffering(false)
  }

  const handleWaiting = () => {
    setIsBuffering(true)
  }

  const handlePlaying = () => {
    setIsPlaying(true)
    setIsBuffering(false)
    setIsLoading(false)
    setIsEnded(false)
    notifyPlaying()
    showControlsTemporarily()
  }

  const handlePause = () => {
    setIsPlaying(false)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setIsEnded(true)
    onEnded?.()
  }

  const handleProgress = () => {
    if (!videoRef.current) return
    const buff = videoRef.current.buffered
    if (buff.length > 0) {
      setBufferedTime(buff.end(buff.length - 1))
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const cur = videoRef.current.currentTime
    setCurrentTime(cur)
    onTimeUpdate?.(cur, duration)
    handleProgress()
  }

  const handleError = () => {
    setIsLoading(false)
    setIsBuffering(false)
    setIsPlaying(false)
    const mediaError = videoRef.current?.error
    let message = "Unable to load video stream. Please verify your connection or try another source."
    if (mediaError) {
      switch (mediaError.code) {
        case 1: // MEDIA_ERR_ABORTED
          message = "Video playback was aborted by the client."
          break
        case 2: // MEDIA_ERR_NETWORK
          message = "A network error prevented video data from loading."
          break
        case 3: // MEDIA_ERR_DECODE
          message = "Video playback encountered a decoding or corruption error."
          break
        case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
          message = "Video resource is unavailable, restricted (HTTP 403/404), or in an unsupported format."
          break
        default:
          message = `Stream error (${mediaError.message || "Code " + mediaError.code}).`
      }
    }
    setError(message)
  }

  // Picture in picture event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const onEnterPiP = () => setIsPiP(true)
    const onLeavePiP = () => setIsPiP(false)

    video.addEventListener("enterpictureinpicture", onEnterPiP)
    video.addEventListener("leavepictureinpicture", onLeavePiP)
    return () => {
      video.removeEventListener("enterpictureinpicture", onEnterPiP)
      video.removeEventListener("leavepictureinpicture", onLeavePiP)
    }
  }, [setIsPiP])

  const handleRetry = () => {
    if (!videoRef.current) return
    setError(null)
    setIsLoading(true)
    videoRef.current.load()
    videoRef.current.play().catch(() => {})
  }

  // Determine container styling based on viewing mode
  const theaterModeStyles = isTheaterMode
    ? "w-full aspect-[21/9] sm:h-[72vh] max-h-[820px] shadow-[0_0_80px_rgba(0,0,0,0.85)] z-20"
    : "w-full aspect-video shadow-2xl"

  return (
    <>
      <div
        ref={containerRef}
        tabIndex={0}
        onMouseMove={showControlsTemporarily}
        onPointerDown={showControlsTemporarily}
        className={`relative bg-[#0a181b] rounded-2xl overflow-hidden border border-white/10 select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7b33] transition-all duration-500 ${theaterModeStyles} ${className}`}
      >
        {/* HTML5 Video Element with native WebVTT text tracks */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          autoPlay={autoPlay}
          crossOrigin="anonymous"
          onLoadStart={handleLoadStart}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onWaiting={handleWaiting}
          onPlaying={handlePlaying}
          onPause={handlePause}
          onEnded={handleEnded}
          onProgress={handleProgress}
          onTimeUpdate={handleTimeUpdate}
          onError={handleError}
          onClick={handleTogglePlay}
          className="w-full h-full object-cover cursor-pointer"
        >
          {subtitles.map((track) => (
            <track
              key={track.id || track.language}
              kind="subtitles"
              label={track.label}
              srcLang={track.language}
              src={track.src}
              default={track.language === activeSubtitleTrack}
            />
          ))}
        </video>

        {/* Ambient Top Title Overlay */}
        <div
          className={`absolute top-0 inset-x-0 p-4 sm:p-5 bg-gradient-to-b from-black/80 via-black/30 to-transparent transition-opacity duration-300 pointer-events-none z-10 flex items-center justify-between ${
            controlsVisible || !isPlaying ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center gap-2 max-w-[80%]">
            <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
            <span className="text-[#eef2ec] text-sm sm:text-base font-medium drop-shadow-md truncate">
              {title}
            </span>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/40 text-[#cdc8f6] border border-white/10 backdrop-blur-sm">
            {actualResolution}
          </span>
        </div>

        {/* Loading & Buffering Indicator */}
        <LoadingIndicator isLoading={isLoading} isBuffering={isBuffering} />

        {/* Big Center Play / Replay Action Button */}
        {!isPlaying && !isLoading && !isBuffering && !error && (
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isEnded ? "Replay video" : "Play video"}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0f3238]/85 hover:bg-[#0f3238] border border-white/20 text-[#f5f4ee] flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-20 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#8c7b33]"
          >
            {isEnded ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
                <path d="M6 4.5V19.5L19 12L6 4.5Z" />
              </svg>
            )}
          </button>
        )}

        {/* Playback Error Overlay */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0a181b]/95 z-30 text-center select-none animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h4 className="text-[#eef2ec] font-semibold text-base mb-1">Stream Error</h4>
            <p className="text-[#93aaa6] text-xs sm:text-sm max-w-sm mb-4 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 rounded-full bg-[#8c7b33] hover:bg-[#a8963f] text-[#f5f4ee] text-xs font-semibold tracking-wide transition-all active:scale-95 shadow-md"
            >
              Retry Stream
            </button>
          </div>
        )}

        {/* Upgraded Custom Player Controls Bar */}
        <div
          className={`transition-opacity duration-300 ${
            controlsVisible || !isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          }`}
        >
          <PlayerControls
            isPlaying={isPlaying}
            isEnded={isEnded}
            volume={volume}
            isMuted={isMuted}
            currentTime={currentTime}
            duration={duration}
            bufferedTime={bufferedTime}
            playbackSpeed={playbackSpeed}
            subtitles={subtitles}
            activeSubtitleLanguage={activeSubtitleTrack}
            qualityResolution={actualResolution}
            showRemainingTime={showRemainingTime}
            isTheaterMode={isTheaterMode}
            isFullscreen={isFullscreen}
            isPiP={isPiP}
            isPiPSupported={isPiPSupported}
            isSettingsOpen={isSettingsOpen}
            thumbnails={thumbnails}
            onTogglePlay={handleTogglePlay}
            onSeek={handleSeek}
            onSeekRelative={handleSeekRelative}
            onVolumeChange={handleVolumeChange}
            onToggleMute={handleToggleMute}
            onToggleRemainingTime={toggleRemainingTime}
            onSelectSpeed={handleSelectSpeed}
            onSelectSubtitle={handleSelectSubtitle}
            onToggleSubtitles={toggleSubtitles}
            onToggleTheaterMode={toggleTheaterMode}
            onToggleFullscreen={handleToggleFullscreen}
            onTogglePiP={handleTogglePiP}
            onToggleSettings={toggleSettingsOpen}
            onToggleHelpModal={toggleShortcutsOpen}
            onScrubStart={() => setIsScrubbing(true)}
            onScrubEnd={() => setIsScrubbing(false)}
          />
        </div>
      </div>

      {/* Accessible Keyboard Shortcuts Help Modal */}
      <KeyboardShortcutsHelp
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </>
  )
}
