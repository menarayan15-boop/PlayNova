"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { useAuthStore } from "@/stores/useAuthStore"
import { progressApi } from "@/services/progressApi"

declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
    __playnovaYtApiPromise?: Promise<any>
  }
}

function loadYouTubeIframeAPI(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"))
  if (window.YT && window.YT.Player) return Promise.resolve(window.YT)
  if (window.__playnovaYtApiPromise) return window.__playnovaYtApiPromise

  window.__playnovaYtApiPromise = new Promise((resolve) => {
    const prevCallback = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (prevCallback) prevCallback()
      resolve(window.YT)
    }

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      tag.async = true
      document.head.appendChild(tag)
    }
  })

  return window.__playnovaYtApiPromise
}

function describeYouTubeError(code: number): string {
  switch (code) {
    case 2:
      return "Invalid YouTube video identifier."
    case 5:
      return "HTML5 playback error occurred in the YouTube embedded player."
    case 100:
      return "This video has been removed or marked private on YouTube."
    case 101:
    case 150:
      return "The video owner has disabled embedded playback outside YouTube."
    default:
      return "This YouTube video is currently unavailable for embedded playback."
  }
}

interface YouTubePlayerProps {
  playnovaVideoId: string // e.g., "yt_dQw4w9WgXcQ"
  youtubeVideoId: string // 11-char YouTube ID
  title: string
  channelTitle?: string
  aspect?: "landscape" | "vertical"
  autoPlay?: boolean
  onEnded?: () => void
}

export default function YouTubePlayer({
  playnovaVideoId,
  youtubeVideoId,
  title,
  channelTitle,
  aspect = "landscape",
  autoPlay = false,
  onEnded,
}: YouTubePlayerProps) {
  const { user, isAuthenticated } = useAuthStore()
  const mountRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const userPausedRef = useRef(false)
  const onEndedRef = useRef(onEnded)
  onEndedRef.current = onEnded

  const [isReady, setIsReady] = useState(false)
  const [playerState, setPlayerState] = useState<"unstarted" | "playing" | "paused" | "buffering" | "ended">("unstarted")
  const [volume, setVolume] = useState(80)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [resumeSeconds, setResumeSeconds] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const trackingAllowed = isAuthenticated && user?.preferences?.historyTrackingEnabled !== false

  const saveCurrentProgress = useCallback(async () => {
    if (!trackingAllowed || !playerRef.current) return
    try {
      const cur = Number(playerRef.current.getCurrentTime?.() || 0)
      const dur = Number(playerRef.current.getDuration?.() || 0)
      if (dur > 0 && cur >= 2) {
        await progressApi.saveProgress(playnovaVideoId, {
          lastPositionSeconds: Math.floor(cur),
          durationSeconds: Math.floor(dur),
        })
      }
    } catch {
      // Non-blocking progress sync
    }
  }, [trackingAllowed, playnovaVideoId])

  // Keep ref to latest saveCurrentProgress so YT.Player NEVER remounts when auth initializes!
  const saveProgressRef = useRef(saveCurrentProgress)
  saveProgressRef.current = saveCurrentProgress

  // Load saved resume position from MongoDB if authenticated
  useEffect(() => {
    let mounted = true
    setResumeSeconds(null)
    if (!trackingAllowed) return

    progressApi
      .getProgress(playnovaVideoId)
      .then((prog) => {
        if (mounted && prog && prog.lastPositionSeconds > 5 && !prog.isCompleted) {
          setResumeSeconds(prog.lastPositionSeconds)
        }
      })
      .catch(() => {})

    return () => {
      mounted = false
    }
  }, [playnovaVideoId, trackingAllowed])

  // Initialize official YouTube IFrame Player API (ONLY depends on youtubeVideoId & autoPlay!)
  useEffect(() => {
    let cancelled = false
    userPausedRef.current = false
    setIsReady(false)
    setErrorMessage(null)
    setPlayerState("unstarted")
    setCurrentTime(0)

    loadYouTubeIframeAPI()
      .then((YT) => {
        if (cancelled || !mountRef.current) return

        mountRef.current.innerHTML = ""
        const playerDiv = document.createElement("div")
        playerDiv.className = "w-full h-full"
        mountRef.current.appendChild(playerDiv)

        playerRef.current = new YT.Player(playerDiv, {
          videoId: youtubeVideoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            controls: 1, // Preserve official YouTube UI, controls, captions & branding
            rel: 0,
            fs: 1,
            enablejsapi: 1,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (cancelled) return
              setIsReady(true)
              const dur = Number(event.target.getDuration?.() || 0)
              if (dur > 0) setDuration(dur)
              const vol = Number(event.target.getVolume?.() ?? 80)
              setVolume(vol)
              setIsMuted(Boolean(event.target.isMuted?.()))
            },
            onStateChange: (event: any) => {
              if (cancelled) return
              const st = event.data
              if (st === YT.PlayerState.PLAYING) {
                setPlayerState("playing")
                const dur = Number(event.target.getDuration?.() || 0)
                if (dur > 0) setDuration(dur)
              } else if (st === YT.PlayerState.PAUSED) {
                setPlayerState("paused")
                saveProgressRef.current()
              } else if (st === YT.PlayerState.BUFFERING) {
                setPlayerState("buffering")
              } else if (st === YT.PlayerState.ENDED) {
                setPlayerState("ended")
                saveProgressRef.current()
                onEndedRef.current?.()
              }
            },
            onError: (event: any) => {
              if (cancelled) return
              setErrorMessage(describeYouTubeError(Number(event.data)))
            },
          },
        })
      })
      .catch(() => {
        if (!cancelled) {
          setErrorMessage("Unable to load the official YouTube IFrame Player API.")
        }
      })

    return () => {
      cancelled = true
      saveProgressRef.current()
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
      try {
        playerRef.current?.destroy?.()
      } catch {}
      playerRef.current = null
    }
  }, [youtubeVideoId, autoPlay])

  // Periodic time display + MongoDB watch-progress sync while playing
  useEffect(() => {
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
    if (playerState !== "playing") return

    let tick = 0
    syncIntervalRef.current = setInterval(() => {
      try {
        const cur = Number(playerRef.current?.getCurrentTime?.() || 0)
        setCurrentTime(cur)
        tick++
        if (tick % 10 === 0) {
          saveProgressRef.current()
        }
      } catch {}
    }, 1000)

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current)
    }
  }, [playerState])

  // Check actual YT.PlayerState directly from the official API on toggle
  const handleTogglePlay = () => {
    if (!playerRef.current || !isReady) return
    const YT = window.YT
    const realState = playerRef.current.getPlayerState?.()
    const isActuallyPlaying =
      realState === YT?.PlayerState?.PLAYING || realState === YT?.PlayerState?.BUFFERING

    if (isActuallyPlaying) {
      userPausedRef.current = true
      playerRef.current.pauseVideo?.()
      setPlayerState("paused")
    } else {
      userPausedRef.current = false
      playerRef.current.playVideo?.()
    }
  }

  const handleStop = () => {
    if (!playerRef.current || !isReady) return
    userPausedRef.current = true
    playerRef.current.stopVideo?.()
    setPlayerState("unstarted")
    setCurrentTime(0)
  }

  const handleSeekBy = (deltaSeconds: number) => {
    if (!playerRef.current || !isReady) return
    const cur = Number(playerRef.current.getCurrentTime?.() || 0)
    const dur = Number(playerRef.current.getDuration?.() || duration || 0)
    const next = Math.max(0, Math.min(dur || cur + deltaSeconds, cur + deltaSeconds))
    playerRef.current.seekTo?.(next, true)
    setCurrentTime(next)
  }

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol)
    if (!playerRef.current || !isReady) return
    if (nextVol === 0) {
      playerRef.current.mute?.()
      setIsMuted(true)
    } else {
      playerRef.current.unMute?.()
      playerRef.current.setVolume?.(nextVol)
      setIsMuted(false)
    }
  }

  const handleToggleMute = () => {
    if (!playerRef.current || !isReady) return
    if (isMuted) {
      playerRef.current.unMute?.()
      setIsMuted(false)
    } else {
      playerRef.current.mute?.()
      setIsMuted(true)
    }
  }

  const handleResumeSaved = () => {
    if (!playerRef.current || !isReady || !resumeSeconds) return
    userPausedRef.current = false
    playerRef.current.seekTo?.(resumeSeconds, true)
    playerRef.current.playVideo?.()
    setResumeSeconds(null)
  }

  const formatTime = (sec: number) => {
    const s = Math.max(0, Math.floor(sec))
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${m}:${r.toString().padStart(2, "0")}`
  }

  const ytWatchUrl = `https://www.youtube.com/watch?v=${youtubeVideoId}`

  return (
    <div className="w-full flex flex-col bg-[#071316] rounded-2xl overflow-hidden border border-white/10">
      {/* Responsive Official YouTube Embed Frame (controls bar sits BELOW frame so YouTube captions never overlap!) */}
      <div
        className={`relative w-full bg-black ${
          aspect === "vertical" ? "aspect-[9/16] max-h-[75vh]" : "aspect-video"
        }`}
      >
        {errorMessage ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0c2f35] text-[#eef2ec] gap-3">
            <p className="text-sm sm:text-base font-medium max-w-md">{errorMessage}</p>
            <p className="text-xs text-[#93aaa6]">
              {title} {channelTitle ? `· ${channelTitle}` : ""}
            </p>
            <a
              href={ytWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-[#8c7b33] text-white hover:bg-[#a6923d] transition-colors"
            >
              Watch on YouTube &rarr;
            </a>
          </div>
        ) : (
          <div ref={mountRef} className="w-full h-full" aria-label={`YouTube video player: ${title}`} />
        )}
      </div>

      {/* Companion PlayNova API Controls & Resume Prompt Bar */}
      {!errorMessage && (
        <div className="px-4 py-2.5 bg-[#0c2f35] text-[#eef2ec] border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleTogglePlay}
              disabled={!isReady}
              aria-label={playerState === "playing" ? "Pause video" : "Play video"}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#8c7b33] hover:bg-[#a6923d] text-white font-semibold disabled:opacity-40 transition-colors"
            >
              {playerState === "playing" ? (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
              <span>{playerState === "playing" ? "Pause" : "Play"}</span>
            </button>
            <button
              type="button"
              onClick={handleStop}
              disabled={!isReady}
              aria-label="Stop video"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#eef2ec] font-medium disabled:opacity-40 transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <rect x="4" y="4" width="16" height="16" rx="2" />
              </svg>
              <span>Stop</span>
            </button>
            <button
              type="button"
              onClick={() => handleSeekBy(-10)}
              disabled={!isReady}
              aria-label="Seek backward 10 seconds"
              className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#eef2ec] disabled:opacity-40"
            >
              -10s
            </button>
            <button
              type="button"
              onClick={() => handleSeekBy(10)}
              disabled={!isReady}
              aria-label="Seek forward 10 seconds"
              className="px-2.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#eef2ec] disabled:opacity-40"
            >
              +10s
            </button>
            <span className="font-mono text-[11px] text-[#93aaa6] ml-1">
              {formatTime(currentTime)} {duration > 0 ? `/ ${formatTime(duration)}` : ""}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {resumeSeconds && resumeSeconds > 5 && isReady && (
              <button
                type="button"
                onClick={handleResumeSaved}
                className="px-3 py-1 rounded-full bg-emerald-600/90 hover:bg-emerald-600 text-white text-[11px] font-medium"
              >
                Resume at {formatTime(resumeSeconds)}
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleMute}
                disabled={!isReady}
                aria-label={isMuted ? "Unmute" : "Mute"}
                className="text-[11px] text-[#93aaa6] hover:text-white"
              >
                {isMuted ? "Muted" : "Vol"}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                aria-label="Volume"
                className="w-16 accent-[#8c7b33] cursor-pointer"
              />
            </div>

            <a
              href={ytWatchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-mono text-[#cdc8f6] hover:underline"
            >
              YouTube &#8599;
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
