"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { usePlayerStore } from "@/stores/usePlayerStore"
import { SubtitleTrack, ThumbnailPreview, PlaybackSpeed, VideoItem } from "@/types"
import PlayerControls from "./PlayerControls"
import LoadingIndicator from "./LoadingIndicator"
import KeyboardShortcutsHelp from "./KeyboardShortcutsHelp"
import AutoplayCountdown from "./AutoplayCountdown"
import { usePlaybackCoordinator } from "@/hooks/usePlaybackCoordinator"
import { useAutoHideControls } from "@/hooks/useAutoHideControls"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
import { useProgressTracking } from "@/hooks/useProgressTracking"
import { ResumePrompt } from "./ResumePrompt"

interface VideoPlayerProps {
  id?: string
  src?: string
  title?: string
  poster?: string
  autoPlay?: boolean
  subtitles?: SubtitleTrack[]
  thumbnails?: ThumbnailPreview[]
  className?: string
  nextVideo?: VideoItem | null
  enableGlobalShortcuts?: boolean
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onEnded?: () => void
  onNextVideo?: () => void
}

const DEFAULT_SUBTITLES: SubtitleTrack[] = [
  { id: "sub-en", label: "English", language: "en", src: "/captions/english.vtt", default: true },
  { id: "sub-es", label: "Español", language: "es", src: "/captions/spanish.vtt" },
  { id: "sub-fr", label: "Français", language: "fr", src: "/captions/french.vtt" },
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
  nextVideo,
  enableGlobalShortcuts = false,
  onTimeUpdate,
  onEnded,
  onNextVideo,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const userPausedRef = useRef(false)

  // Local per-instance playback state synchronized strictly with actual HTMLVideoElement events
  const [isPlaying, setIsPlaying] = useState(false)
  const [isEnded, setIsEnded] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [bufferedTime, setBufferedTime] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPiP, setIsPiP] = useState(false)
  const [isPiPSupported, setIsPiPSupported] = useState(false)
  const [actualResolution, setActualResolution] = useState("1080p HD")
  const [error, setError] = useState<string | null>(null)
  const [activeCueLines, setActiveCueLines] = useState<string[]>([])

  const [isScrubbing, setIsScrubbing] = useState(false)
  const [isFocusWithin, setIsFocusWithin] = useState(false)
  const [isAutoplayCancelled, setIsAutoplayCancelled] = useState(false)

  // Shared user-preference settings from store
  const {
    isMuted,
    volume,
    playbackSpeed,
    activeSubtitleTrack,
    showRemainingTime,
    isTheaterMode,
    isSettingsOpen,
    isShortcutsOpen,
    setIsMuted,
    setVolume,
    setPlaybackSpeed,
    cyclePlaybackSpeed,
    setActiveSubtitleTrack,
    setAvailableSubtitles,
    toggleSubtitles,
    toggleRemainingTime,
    toggleTheaterMode,
    toggleSettingsOpen,
    toggleShortcutsOpen,
    setIsShortcutsOpen,
  } = usePlayerStore()

  // Reset instance state cleanly when src changes (never auto-restarting a manually paused video)
  useEffect(() => {
    setIsAutoplayCancelled(false)
    setIsPlaying(false)
    setIsEnded(false)
    setCurrentTime(0)
    setDuration(0)
    setBufferedTime(0)
    setError(null)
    setActiveCueLines([])
    userPausedRef.current = false
  }, [src])

  // 1. Playback Coordinator: Pauses other PlayNova players when this video plays
  const { notifyPlaying } = usePlaybackCoordinator(id, () => {
    const video = videoRef.current
    if (video && !video.paused) {
      video.pause()
    }
  })

  // 2. Auto-hide controls (keeps visible when paused, scrubbing, menu open, or focused)
  const { controlsVisible, showControlsTemporarily } = useAutoHideControls({
    isPlaying,
    isScrubbing,
    isSettingsOpen,
    isShortcutsOpen,
    isFocusWithin,
    hideDelayMs: 3000,
  })

  // 3. Play / Pause logic — ALWAYS reads real HTMLVideoElement.paused (never stale React state!)
  const handleTogglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (video.ended) {
      userPausedRef.current = false
      video.currentTime = 0
      setIsEnded(false)
      video
        .play()
        .then(() => {
          setError(null)
          notifyPlaying()
        })
        .catch((err) => {
          console.warn("Replay request blocked or interrupted:", err)
        })
      return
    }

    if (!video.paused) {
      // Explicit user pause takes strict priority
      userPausedRef.current = true
      video.pause()
      setIsPlaying(false)
      showControlsTemporarily()
    } else {
      userPausedRef.current = false
      video
        .play()
        .then(() => {
          setError(null)
          notifyPlaying()
        })
        .catch((err) => {
          setIsPlaying(false)
          console.warn("Play request blocked or interrupted:", err)
        })
    }
  }, [notifyPlaying, showControlsTemporarily])

  // Dedicated Stop action: pauses playback and resets to 0:00
  const handleStop = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    userPausedRef.current = true
    video.pause()
    video.currentTime = 0
    setCurrentTime(0)
    setIsPlaying(false)
    setIsEnded(false)
    setActiveCueLines([])
    showControlsTemporarily()
  }, [showControlsTemporarily])

  // 4. Seeking logic
  const handleSeek = useCallback(
    (time: number) => {
      const video = videoRef.current
      if (!video) return
      const maxDur = video.duration || duration || 0
      const clamped = Math.max(0, Math.min(time, maxDur))
      video.currentTime = clamped
      setCurrentTime(clamped)
      if (clamped < maxDur) {
        setIsEnded(false)
      }
    },
    [duration]
  )

  // Smart watch history & resume playback tracking
  const {
    showResumePrompt,
    resumeData,
    dismissResumePrompt,
    handleResume,
    handleStartOver,
  } = useProgressTracking({
    videoId: id,
    videoRef,
    isPlaying,
    currentTime,
    duration,
    onSeek: handleSeek,
  })

  const handleSeekRelative = useCallback(
    (seconds: number) => {
      const video = videoRef.current
      if (!video) return
      const maxDur = video.duration || duration || 0
      const newTime = Math.max(0, Math.min((video.currentTime || 0) + seconds, maxDur))
      video.currentTime = newTime
      setCurrentTime(newTime)
      if (newTime < maxDur) {
        setIsEnded(false)
      }
      showControlsTemporarily()
    },
    [duration, showControlsTemporarily]
  )

  // 5. Volume adjustment (never triggers playback!)
  const handleVolumeChange = useCallback(
    (newVol: number) => {
      const clamped = Math.max(0, Math.min(1, newVol))
      setVolume(clamped)
      if (videoRef.current) {
        videoRef.current.volume = clamped
        videoRef.current.muted = clamped === 0
      }
    },
    [setVolume]
  )

  const handleToggleMute = useCallback(() => {
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    if (videoRef.current) {
      videoRef.current.muted = nextMuted
    }
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
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen()
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen()
        }
      }
    } catch (err) {
      console.warn("Fullscreen change rejected:", err)
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

  // 9. Subtitle selection — uses 'hidden' native mode so browser parses WebVTT cues
  // without painting overlapping bottom captions; PlayNova renders positioned accessible captions!
  const handleSelectSubtitle = useCallback(
    (lang: string | null) => {
      setActiveSubtitleTrack(lang)
      if (!lang) setActiveCueLines([])
    },
    [setActiveSubtitleTrack]
  )

  // 10. Check PiP support on mount
  useEffect(() => {
    if (typeof document !== "undefined") {
      setIsPiPSupported(Boolean(document.pictureInPictureEnabled))
    }
  }, [])

  // 11. Available subtitles list sync
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
          t.src === currentSubs[i]?.src
      )

    if (!isUnchanged) {
      prevSubtitlesRef.current = currentSubs
      setAvailableSubtitles(currentSubs)
    }
  }, [subtitles, setAvailableSubtitles])

  // Sync HTML5 textTracks to 'hidden' (for active language) or 'disabled' and read activeCues cleanly
  useEffect(() => {
    const video = videoRef.current
    if (!video || !video.textTracks) return

    let activeTrack: TextTrack | null = null

    for (let i = 0; i < video.textTracks.length; i++) {
      const track = video.textTracks[i]
      if (activeSubtitleTrack && track.language === activeSubtitleTrack) {
        // 'hidden' loads & fires cuechange without browser painting over our bottom controls!
        track.mode = "hidden"
        activeTrack = track
      } else {
        track.mode = "disabled"
      }
    }

    if (!activeTrack) {
      setActiveCueLines([])
      return
    }

    const updateCues = () => {
      if (!activeTrack || !activeTrack.activeCues) {
        setActiveCueLines([])
        return
      }
      const lines: string[] = []
      for (let i = 0; i < activeTrack.activeCues.length; i++) {
        const cue = activeTrack.activeCues[i] as VTTCue
        if (cue?.text) {
          lines.push(cue.text.replace(/<[^>]+>/g, "").trim())
        }
      }
      setActiveCueLines(lines.filter(Boolean))
    }

    updateCues()
    activeTrack.addEventListener("cuechange", updateCues)
    return () => {
      activeTrack?.removeEventListener("cuechange", updateCues)
    }
  }, [activeSubtitleTrack, src, subtitles])

  // 12. Fullscreen change listener
  useEffect(() => {
    const onFullscreenChange = () => {
      const isFull = Boolean(
        document.fullscreenElement || (document as any).webkitFullscreenElement
      )
      setIsFullscreen(isFull)
    }
    document.addEventListener("fullscreenchange", onFullscreenChange)
    document.addEventListener("webkitfullscreenchange", onFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", onFullscreenChange)
    }
  }, [])

  // 13. Synchronize volume, mute, and speed to video element (never starts playback!)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      videoRef.current.muted = isMuted
      videoRef.current.playbackRate = playbackSpeed
    }
  }, [volume, isMuted, playbackSpeed])

  // 14. Keyboard shortcuts (active when player is focused, playing, or on dedicated watch page)
  useKeyboardShortcuts({
    isActive: isFocusWithin || isPlaying || enableGlobalShortcuts,
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

  // 15. Native HTML5 Media Events (single source of truth for playback state)
  const handleLoadStart = () => {
    setIsLoading(true)
    setError(null)
  }

  const handleLoadedMetadata = () => {
    const video = videoRef.current
    if (!video) return
    setDuration(video.duration || 0)
    setIsLoading(false)

    const width = video.videoWidth
    const height = video.videoHeight
    if (height >= 2160 || width >= 3840) setActualResolution("4K UHD")
    else if (height >= 1080 || width >= 1920) setActualResolution("1080p HD")
    else if (height >= 720 || width >= 1280) setActualResolution("720p HD")
    else if (height > 0) setActualResolution(`${height}p`)

    // Ensure native browser tracks never paint over custom controls
    if (video.textTracks) {
      for (let i = 0; i < video.textTracks.length; i++) {
        const track = video.textTracks[i]
        track.mode = activeSubtitleTrack && track.language === activeSubtitleTrack ? "hidden" : "disabled"
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

  const handlePlay = () => {
    // If user manually paused and an unexpected auto-resume fired, enforce manual pause
    if (userPausedRef.current && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause()
      setIsPlaying(false)
      return
    }
    setIsPlaying(true)
    setIsEnded(false)
    notifyPlaying()
    showControlsTemporarily()
  }

  const handlePlaying = () => {
    if (userPausedRef.current && videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause()
      setIsPlaying(false)
      return
    }
    setIsPlaying(true)
    setIsBuffering(false)
    setIsLoading(false)
    setIsEnded(false)
    notifyPlaying()
    showControlsTemporarily()
  }

  const handlePause = () => {
    setIsPlaying(false)
    setIsBuffering(false)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setIsEnded(true)
    onEnded?.()
  }

  const handleProgress = () => {
    const video = videoRef.current
    if (!video) return
    const buff = video.buffered
    if (buff.length > 0) {
      setBufferedTime(buff.end(buff.length - 1))
    }
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    if (!video) return
    const cur = video.currentTime
    setCurrentTime(cur)
    onTimeUpdate?.(cur, video.duration || duration)
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
        case 1:
          message = "Video playback was aborted by the client."
          break
        case 2:
          message = "A network error prevented video data from loading."
          break
        case 3:
          message = "Video playback encountered a decoding or corruption error."
          break
        case 4:
          message = "Video resource is unavailable, restricted, or in an unsupported format."
          break
        default:
          message = `Stream error (${mediaError.message || "Code " + mediaError.code}).`
      }
    }
    setError(message)
  }

  // Picture-in-Picture event listeners
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
  }, [])

  const handleRetry = () => {
    const video = videoRef.current
    if (!video) return
    userPausedRef.current = false
    setError(null)
    setIsLoading(true)
    video.load()
    video.play().catch(() => {})
  }

  const areControlsShowing = controlsVisible || !isPlaying
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
        onTouchStart={showControlsTemporarily}
        onTouchMove={showControlsTemporarily}
        onFocus={() => setIsFocusWithin(true)}
        onBlur={(e) => {
          if (!containerRef.current?.contains(e.relatedTarget as Node)) {
            setIsFocusWithin(false)
          }
        }}
        className={`relative bg-[#0a181b] rounded-2xl overflow-hidden border border-white/10 select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7b33] transition-all duration-300 ${theaterModeStyles} ${className}`}
      >
        {/* HTML5 Video Element (native WebVTT tracks parsed in hidden mode; PlayNova renders positioned captions) */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          playsInline
          preload="metadata"
          autoPlay={autoPlay && !userPausedRef.current}
          crossOrigin="anonymous"
          onLoadStart={handleLoadStart}
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onWaiting={handleWaiting}
          onPlay={handlePlay}
          onPlaying={handlePlaying}
          onPause={handlePause}
          onEnded={handleEnded}
          onProgress={handleProgress}
          onTimeUpdate={handleTimeUpdate}
          onError={handleError}
          onClick={(e) => {
            e.stopPropagation()
            handleTogglePlay()
          }}
          className="w-full h-full object-contain bg-black cursor-pointer"
        >
          {subtitles.map((track) => (
            <track
              key={track.id || track.language}
              kind="subtitles"
              label={track.label}
              srcLang={track.language}
              src={track.src}
            />
          ))}
        </video>

        {/* Ambient Top Title Overlay */}
        <div
          className={`absolute top-0 inset-x-0 p-4 sm:p-5 bg-gradient-to-b from-black/80 via-black/30 to-transparent transition-opacity duration-300 pointer-events-none z-10 flex items-center justify-between ${
            areControlsShowing ? "opacity-100" : "opacity-0"
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

        {/* Accessible Non-Overlapping Custom Caption Overlay */}
        {activeSubtitleTrack && activeCueLines.length > 0 && !error && (
          <div
            data-testid="playnova-captions"
            role="region"
            aria-live="polite"
            aria-atomic="true"
            className={`pointer-events-none absolute inset-x-0 px-4 sm:px-8 flex flex-col items-center gap-1 z-10 transition-all duration-300 ${
              areControlsShowing ? "bottom-24 sm:bottom-[104px]" : "bottom-5 sm:bottom-8"
            }`}
          >
            {activeCueLines.map((line, i) => (
              <span
                key={i}
                className="inline-block max-w-[92%] sm:max-w-[80%] text-center px-3.5 py-1.5 rounded-lg bg-black/80 text-white text-xs sm:text-sm md:text-base font-medium leading-snug tracking-normal shadow-lg backdrop-blur-sm"
              >
                {line}
              </span>
            ))}
          </div>
        )}

        {/* Loading & Buffering Indicator (pointer-events-none so it never blocks Pause/Stop!) */}
        <LoadingIndicator isLoading={isLoading} isBuffering={isBuffering} />

        {/* Big Center Play / Replay Action Button */}
        {!isPlaying && !isLoading && !isBuffering && !error && (
          <button
            type="button"
            data-play-toggle="true"
            onClick={(e) => {
              e.stopPropagation()
              handleTogglePlay()
            }}
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
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0a181b]/95 z-30 text-center select-none">
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

        {/* Smart Resume Playback Prompt */}
        {showResumePrompt && resumeData && (
          <ResumePrompt
            lastPositionSeconds={resumeData.lastPositionSeconds}
            durationSeconds={resumeData.durationSeconds}
            onDismiss={dismissResumePrompt}
            onResume={handleResume}
            onStartOver={handleStartOver}
          />
        )}

        {/* Autoplay Next Video Countdown */}
        {isEnded && nextVideo && onNextVideo && !isAutoplayCancelled && (
          <AutoplayCountdown
            nextVideo={nextVideo}
            onPlayNow={() => onNextVideo()}
            onCancel={() => setIsAutoplayCancelled(true)}
          />
        )}

        {/* Custom Player Controls Bar */}
        <div
          className={`transition-opacity duration-300 ${
            areControlsShowing ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
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
            onStop={handleStop}
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
