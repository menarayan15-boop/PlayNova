"use client"

import React, { useRef, useState, useCallback, useEffect } from "react"
import { ThumbnailPreview } from "@/types"
import TimelinePreview from "./TimelinePreview"
import { useTimelinePreview } from "@/hooks/useTimelinePreview"

interface VideoTimelineProps {
  currentTime: number
  duration: number
  bufferedTime: number
  thumbnails?: ThumbnailPreview[]
  onSeek: (time: number) => void
  onScrubStart?: () => void
  onScrubEnd?: () => void
}

export default function VideoTimeline({
  currentTime,
  duration,
  bufferedTime,
  thumbnails,
  onSeek,
  onScrubStart,
  onScrubEnd,
}: VideoTimelineProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [timelineWidth, setTimelineWidth] = useState(400)

  const {
    previewTime,
    previewX,
    activeThumbnailUrl,
    updatePreview,
    clearPreview,
  } = useTimelinePreview(barRef, duration, thumbnails)

  // Measure timeline width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (barRef.current) {
        setTimelineWidth(barRef.current.clientWidth)
      }
    }
    updateWidth()
    window.addEventListener("resize", updateWidth)
    return () => window.removeEventListener("resize", updateWidth)
  }, [])

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0

  const calculateTimeFromPosition = useCallback(
    (clientX: number): number => {
      if (!barRef.current || duration <= 0) return 0
      const rect = barRef.current.getBoundingClientRect()
      const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const percentage = clickX / rect.width
      return percentage * duration
    },
    [duration]
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
    onScrubStart?.()

    const newTime = calculateTimeFromPosition(e.clientX)
    onSeek(newTime)
    updatePreview(e.clientX)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const draggedTime = calculateTimeFromPosition(moveEvent.clientX)
      onSeek(draggedTime)
      updatePreview(moveEvent.clientX)
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      onScrubEnd?.()
      clearPreview()
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      updatePreview(e.clientX)
    }
  }

  const handlePointerLeave = () => {
    if (!isDragging) {
      clearPreview()
    }
  }

  return (
    <div
      ref={barRef}
      role="slider"
      aria-label="Video timeline"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={Math.round(currentTime)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") {
          e.preventDefault()
          onSeek(Math.max(0, currentTime - 5))
        } else if (e.key === "ArrowRight") {
          e.preventDefault()
          onSeek(Math.min(duration, currentTime + 5))
        }
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-4 group flex items-center cursor-pointer select-none py-1.5 touch-none"
    >
      {/* Background Track */}
      <div className="w-full h-1.5 group-hover:h-2.5 bg-white/20 rounded-full overflow-hidden transition-all duration-200 relative backdrop-blur-sm">
        {/* Buffered Range Track */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-white/35 rounded-full transition-all duration-300 pointer-events-none"
          style={{ width: `${Math.min(100, Math.max(0, bufferedPercent))}%` }}
        />
        {/* Played Progress Track (PlayNova Gold-Lilac Gradient) */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#8c7b33] via-[#a8963f] to-[#cdc8f6] rounded-full pointer-events-none"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      {/* Scrub handle thumb */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#f5f4ee] border-2 border-[#8c7b33] shadow-md transition-transform duration-150 pointer-events-none ${
          isDragging || previewTime !== null ? "scale-100 ring-2 ring-[#8c7b33]/40" : "scale-0 group-hover:scale-100"
        }`}
        style={{ left: `calc(${progressPercent}% - 8px)` }}
      />

      {/* Timeline Hover Frame Preview */}
      <TimelinePreview
        previewTime={previewTime}
        previewX={previewX}
        timelineWidth={timelineWidth}
        thumbnailUrl={activeThumbnailUrl}
      />
    </div>
  )
}
