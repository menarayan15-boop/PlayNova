"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useAuthStore } from "@/stores/useAuthStore"
import { useProgressStore } from "@/stores/useProgressStore"
import { progressApi } from "@/services/progressApi"
import { ProgressUpdatePayload } from "@/types"

interface UseProgressTrackingProps {
  videoId: string
  videoRef: React.RefObject<HTMLVideoElement | null>
  isPlaying: boolean
  currentTime: number
  duration: number
  onSeek: (seconds: number) => void
}

export function useProgressTracking({
  videoId,
  videoRef,
  isPlaying,
  currentTime,
  duration,
  onSeek,
}: UseProgressTrackingProps) {
  const { user, isAuthenticated } = useAuthStore()
  const { updateLocalProgress } = useProgressStore()

  const [resumeData, setResumeData] = useState<{
    lastPositionSeconds: number
    durationSeconds: number
  } | null>(null)
  const [showResumePrompt, setShowResumePrompt] = useState(false)
  const hasCheckedResumeRef = useRef(false)

  // Tracking refs
  const intervalStartRef = useRef<number | null>(null)
  const lastSavedPositionRef = useRef<number>(0)
  const isSavingRef = useRef<boolean>(false)

  // Check if history tracking is enabled by user preference
  const isTrackingEnabled =
    isAuthenticated && user?.preferences?.historyTrackingEnabled !== false

  /**
   * Save progress to backend or offline queue
   */
  const saveProgress = useCallback(
    async (overrideInterval?: [number, number]) => {
      if (!isTrackingEnabled || !videoRef.current || duration <= 0) return

      const pos = Math.round(videoRef.current.currentTime * 10) / 10
      const dur = Math.round(duration * 10) / 10

      // Don't save if position hasn't changed or duration invalid
      if (pos === lastSavedPositionRef.current && !overrideInterval) return

      let interval = overrideInterval
      if (!interval && intervalStartRef.current !== null) {
        const start = Math.round(intervalStartRef.current * 10) / 10
        const end = pos
        if (end > start + 0.5) {
          interval = [start, end]
          intervalStartRef.current = end // Advance start to prevent duplicate interval slices
        }
      }

      const payload: ProgressUpdatePayload = {
        lastPositionSeconds: pos,
        durationSeconds: dur,
        interval,
      }

      lastSavedPositionRef.current = pos

      try {
        isSavingRef.current = true
        const updated = await progressApi.saveProgress(videoId, payload, user?.id)
        if (updated) {
          updateLocalProgress(videoId, updated)
        }
      } catch (err) {
        console.warn("Could not save watch progress", err)
      } finally {
        isSavingRef.current = false
      }
    },
    [videoId, duration, isTrackingEnabled, user?.id, updateLocalProgress, videoRef]
  )

  const activeVideoIdRef = useRef<string>(videoId)
  activeVideoIdRef.current = videoId

  /**
   * Helper to seek safely once video metadata is available
   */
  const seekWhenMetadataReady = useCallback(
    (targetSeconds: number) => {
      const video = videoRef.current
      if (!video) return

      const doSeek = () => {
        const vidDur = video.duration || duration || Infinity
        const clamped = Math.max(0, Math.min(targetSeconds, vidDur > 2 ? vidDur - 2 : vidDur))
        onSeek(clamped)
      }

      if (video.readyState >= 1 && !isNaN(video.duration) && video.duration > 0) {
        doSeek()
      } else {
        const handleMetadata = () => {
          doSeek()
          video.removeEventListener("loadedmetadata", handleMetadata)
        }
        video.addEventListener("loadedmetadata", handleMetadata, { once: true })
      }
    },
    [videoRef, duration, onSeek]
  )

  /**
   * Initial check for resume position on video load
   */
  useEffect(() => {
    hasCheckedResumeRef.current = false
    setShowResumePrompt(false)
    setResumeData(null)
    intervalStartRef.current = null

    if (!isTrackingEnabled || !videoId) return

    let isMounted = true

    async function checkResume() {
      try {
        // Also trigger offline queue sync if coming online
        if (user?.id) {
          progressApi.syncOfflineQueue(user.id).catch(() => {})
        }

        const progress = await progressApi.getProgress(videoId)
        // Guard against unmount or stale responses from previous video requests
        if (!isMounted || activeVideoIdRef.current !== videoId || !progress) return

        updateLocalProgress(videoId, progress)

        // Only offer resume if user watched at least 5 seconds, video is not completed,
        // and user is not within 5 seconds of the end or >= 90% complete
        const isNearEnd = progress.durationSeconds > 0 && (progress.durationSeconds - progress.lastPositionSeconds <= 5)
        const isComplete = Boolean(progress.isCompleted || (progress.completionPercentage >= 90))

        if (progress.lastPositionSeconds > 5 && !isComplete && !isNearEnd) {
          const pref = user?.preferences?.resumePreference || "ask"

          if (pref === "auto") {
            seekWhenMetadataReady(progress.lastPositionSeconds)
          } else if (pref === "ask") {
            setResumeData({
              lastPositionSeconds: progress.lastPositionSeconds,
              durationSeconds: progress.durationSeconds,
            })
            setShowResumePrompt(true)
          }
          // If "start_over", do nothing, plays from 0
        }
      } catch (err) {
        console.warn("Failed to check resume progress:", err)
      }
    }

    checkResume()

    return () => {
      isMounted = false
    }
  }, [videoId, isTrackingEnabled, user?.id, updateLocalProgress, seekWhenMetadataReady, user?.preferences?.resumePreference])

  /**
   * Track interval start and stop on playback state changes
   */
  useEffect(() => {
    if (!isTrackingEnabled || !videoRef.current) return

    if (isPlaying) {
      if (intervalStartRef.current === null) {
        intervalStartRef.current = videoRef.current.currentTime
      }
    } else {
      // Paused: flush current interval immediately
      if (intervalStartRef.current !== null) {
        const start = intervalStartRef.current
        const end = videoRef.current.currentTime
        intervalStartRef.current = null
        if (end > start + 0.5) {
          saveProgress([start, end])
        } else {
          saveProgress()
        }
      } else {
        saveProgress()
      }
    }
  }, [isPlaying, isTrackingEnabled, saveProgress, videoRef])

  /**
   * Periodic throttled progress update during active playback (every 12 seconds)
   */
  useEffect(() => {
    if (!isPlaying || !isTrackingEnabled) return

    const interval = setInterval(() => {
      saveProgress()
    }, 12000)

    return () => clearInterval(interval)
  }, [isPlaying, isTrackingEnabled, saveProgress])

  /**
   * Flush progress on pagehide / visibilitychange / unmount
   */
  useEffect(() => {
    if (!isTrackingEnabled) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden" && videoRef.current) {
        const pos = videoRef.current.currentTime
        const dur = videoRef.current.duration || duration
        let intv: [number, number] | undefined = undefined
        if (intervalStartRef.current !== null && pos > intervalStartRef.current + 0.5) {
          intv = [intervalStartRef.current, pos]
        }
        progressApi.sendBeaconProgress(videoId, {
          lastPositionSeconds: pos,
          durationSeconds: dur,
          interval: intv,
        })
      }
    }

    const handleBeforeUnload = () => {
      if (videoRef.current) {
        const pos = videoRef.current.currentTime
        const dur = videoRef.current.duration || duration
        let intv: [number, number] | undefined = undefined
        if (intervalStartRef.current !== null && pos > intervalStartRef.current + 0.5) {
          intv = [intervalStartRef.current, pos]
        }
        progressApi.sendBeaconProgress(videoId, {
          lastPositionSeconds: pos,
          durationSeconds: dur,
          interval: intv,
        })
      }
    }

    const handleOnline = () => {
      if (user?.id) {
        progressApi.syncOfflineQueue(user.id)
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("pagehide", handleBeforeUnload)
    window.addEventListener("beforeunload", handleBeforeUnload)
    window.addEventListener("online", handleOnline)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("pagehide", handleBeforeUnload)
      window.removeEventListener("beforeunload", handleBeforeUnload)
      window.removeEventListener("online", handleOnline)
      // Flush on unmount
      if (videoRef.current) {
        saveProgress()
      }
    }
  }, [isTrackingEnabled, videoId, duration, user?.id, saveProgress, videoRef])

  const dismissResumePrompt = useCallback(() => {
    setShowResumePrompt(false)
  }, [])

  const handleResume = useCallback(() => {
    if (resumeData) {
      onSeek(resumeData.lastPositionSeconds)
    }
    setShowResumePrompt(false)
  }, [resumeData, onSeek])

  const handleStartOver = useCallback(() => {
    onSeek(0)
    setShowResumePrompt(false)
  }, [onSeek])

  return {
    showResumePrompt,
    resumeData,
    dismissResumePrompt,
    handleResume,
    handleStartOver,
    saveCurrentProgressNow: saveProgress,
  }
}

