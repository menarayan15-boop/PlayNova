"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { usePlayerStore } from "@/stores/usePlayerStore"
import PlayerControls from "./PlayerControls"

interface VideoPlayerProps {
  src?: string
  title?: string
  poster?: string
  autoPlay?: boolean
  className?: string
  onTimeUpdate?: (currentTime: number, duration: number) => void
  onEnded?: () => void
}

export default function VideoPlayer({
  src = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  title = "Cosmic Horizons: The Deep Space Explorer",
  poster = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  autoPlay = false,
  className = "",
  onTimeUpdate,
  onEnded,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null)

  const {
    isPlaying,
    isMuted,
    volume,
    currentTime,
    duration,
    isBuffering,
    isFullscreen,
    error,
    playbackRate,
    setIsPlaying,
    setIsMuted,
    setVolume,
    setCurrentTime,
    setDuration,
    setIsBuffering,
    setIsFullscreen,
    setError,
  } = usePlayerStore()

  const [buffered, setBuffered] = useState(0)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)

  // Update volume & muted on video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume
      videoRef.current.muted = isMuted
    }
  }, [volume, isMuted])

  // Update playback rate
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate
    }
  }, [playbackRate])

  // Reset error when src changes
  useEffect(() => {
    setError(null)
    setCurrentTime(0)
    setBuffered(0)
    setIsBuffering(true)
  }, [src, setError, setCurrentTime, setIsBuffering])

  // Handle Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (document as any).webkitFullscreenElement
      )
      setIsFullscreen(isCurrentlyFullscreen)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
    }
  }, [setIsFullscreen])

  // Auto-hide controls when playing and idle
  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true)
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current)
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setControlsVisible(false)
      }, 3000)
    }
  }, [isPlaying])

  const togglePlay = useCallback(() => {
    setHasInteracted(true)
    if (!videoRef.current) return

    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current
        .play()
        .then(() => setError(null))
        .catch((err) => {
          console.warn("Autoplay or Play rejected:", err)
        })
    }
  }, [isPlaying, setError])

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return
    const nextMuted = !isMuted
    setIsMuted(nextMuted)
    videoRef.current.muted = nextMuted
  }, [isMuted, setIsMuted])

  const handleVolumeChange = useCallback(
    (newVolume: number) => {
      if (!videoRef.current) return
      setVolume(newVolume)
      videoRef.current.volume = newVolume
      if (newVolume > 0 && isMuted) {
        setIsMuted(false)
        videoRef.current.muted = false
      }
    },
    [isMuted, setIsMuted, setVolume]
  )

  const seekTo = useCallback(
    (time: number) => {
      if (!videoRef.current) return
      const clamped = Math.max(0, Math.min(time, duration))
      videoRef.current.currentTime = clamped
      setCurrentTime(clamped)
    },
    [duration, setCurrentTime]
  )

  const seekRelative = useCallback(
    (seconds: number) => {
      if (!videoRef.current) return
      const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration))
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
      showControlsTemporarily()
    },
    [duration, setCurrentTime, showControlsTemporarily]
  )

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return

    try {
      if (!isFullscreen) {
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
      console.warn("Fullscreen toggle failed:", err)
    }
  }, [isFullscreen])

  // Video event handlers
  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const time = videoRef.current.currentTime
    setCurrentTime(time)
    onTimeUpdate?.(time, duration)

    // Calculate buffered range
    if (videoRef.current.buffered.length > 0) {
      const end = videoRef.current.buffered.end(videoRef.current.buffered.length - 1)
      setBuffered(end)
    }
  }

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return
    setDuration(videoRef.current.duration)
    setIsBuffering(false)
  }

  const handleWaiting = () => {
    setIsBuffering(true)
  }

  const handleCanPlay = () => {
    setIsBuffering(false)
  }

  const handlePlay = () => {
    setIsPlaying(true)
    showControlsTemporarily()
  }

  const handlePause = () => {
    setIsPlaying(false)
    setControlsVisible(true)
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current)
    }
  }

  const handleError = () => {
    setIsBuffering(false)
    setIsPlaying(false)
    setError("Unable to stream video. Please check your network connection or try another source.")
  }

  const handleRetry = () => {
    if (!videoRef.current) return
    setError(null)
    setIsBuffering(true)
    videoRef.current.load()
    videoRef.current.play().catch(() => {})
  }

  return (
    <div
      ref={containerRef}
      onMouseMove={showControlsTemporarily}
      onMouseLeave={() => isPlaying && setControlsVisible(false)}
      className={`relative w-full aspect-video bg-[#0a181b] rounded-xl overflow-hidden shadow-2xl border border-white/10 select-none group ${className}`}
    >
      {/* HTML5 Video element - Native controls deliberately disabled */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        autoPlay={autoPlay}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onWaiting={handleWaiting}
        onCanPlay={handleCanPlay}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={() => {
          setIsPlaying(false)
          onEnded?.()
        }}
        onError={handleError}
        onClick={togglePlay}
        className="w-full h-full object-cover cursor-pointer"
      />

      {/* Title overlay in top corner */}
      <div
        className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/70 to-transparent transition-opacity duration-300 pointer-events-none z-10 ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="text-[#eef2ec] text-sm sm:text-base font-medium drop-shadow-md line-clamp-1">
          {title}
        </span>
      </div>

      {/* Buffering Loading Indicator */}
      {isBuffering && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-20 pointer-events-none">
          <div className="w-12 h-12 rounded-full border-3 border-[#8c7b33]/20 border-t-[#8c7b33] animate-spin mb-2" />
          <span className="text-xs font-mono text-[#eef2ec]/80 tracking-wider uppercase">Loading stream...</span>
        </div>
      )}

      {/* Big Center Play Button Overlay (when paused or before user interaction) */}
      {!isPlaying && !isBuffering && !error && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Play video"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#0f3238]/85 hover:bg-[#0f3238] border border-white/20 text-[#f5f4ee] flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-all z-20 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#8c7b33]"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" className="ml-1">
            <path d="M6 4.5V19.5L19 12L6 4.5Z" />
          </svg>
        </button>
      )}

      {/* Error state message overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#0a181b]/95 z-30 text-center">
          <div className="w-12 h-12 rounded-full bg-red-900/30 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h4 className="text-[#eef2ec] font-medium text-base mb-1">Playback Error</h4>
          <p className="text-[#93aaa6] text-xs sm:text-sm max-w-sm mb-4">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="px-4 py-2 rounded-full bg-[#8c7b33] hover:bg-[#a8963f] text-[#f5f4ee] text-xs font-semibold tracking-wide transition-all active:scale-95 shadow-md"
          >
            Retry Playback
          </button>
        </div>
      )}

      {/* Custom Player Controls */}
      <div
        className={`transition-opacity duration-300 ${
          controlsVisible || !isPlaying ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <PlayerControls
          isPlaying={isPlaying}
          isMuted={isMuted}
          volume={volume}
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          isFullscreen={isFullscreen}
          onTogglePlay={togglePlay}
          onToggleMute={toggleMute}
          onVolumeChange={handleVolumeChange}
          onSeek={seekTo}
          onSeekRelative={seekRelative}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
    </div>
  )
}

