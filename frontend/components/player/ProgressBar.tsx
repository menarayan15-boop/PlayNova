"use client"

import React, { useRef, useState, useCallback } from "react"

interface ProgressBarProps {
  currentTime: number
  duration: number
  buffered?: number
  onSeek: (time: number) => void
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00"
  const totalSecs = Math.floor(seconds)
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    const remMins = mins % 60
    return `${hrs}:${remMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export default function ProgressBar({
  currentTime,
  duration,
  buffered = 0,
  onSeek,
}: ProgressBarProps) {
  const barRef = useRef<HTMLDivElement>(null)
  const [hoverPosition, setHoverPosition] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0

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
    const newTime = calculateTimeFromPosition(e.clientX)
    onSeek(newTime)

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const draggedTime = calculateTimeFromPosition(moveEvent.clientX)
      onSeek(draggedTime)
    }

    const handlePointerUp = () => {
      setIsDragging(false)
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!barRef.current) return
    const rect = barRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width))
    setHoverPosition(x / rect.width)
  }

  const handleMouseLeave = () => {
    setHoverPosition(null)
  }

  return (
    <div
      ref={barRef}
      role="slider"
      aria-label="Video playback progress"
      aria-valuemin={0}
      aria-valuemax={duration}
      aria-valuenow={currentTime}
      aria-valuetext={formatTime(currentTime)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") onSeek(Math.max(0, currentTime - 5))
        if (e.key === "ArrowRight") onSeek(Math.min(duration, currentTime + 5))
      }}
      onPointerDown={handlePointerDown}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-3 group flex items-center cursor-pointer select-none py-1"
    >
      {/* Background track */}
      <div className="w-full h-1.5 group-hover:h-2 bg-white/20 rounded-full overflow-hidden transition-all duration-200 relative backdrop-blur-sm">
        {/* Buffered track */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-white/35 rounded-full transition-all duration-300 pointer-events-none"
          style={{ width: `${Math.min(100, Math.max(0, bufferedPercent))}%` }}
        />
        {/* Played progress track (Teal/Gold theme) */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-[#8c7b33] to-[#cdc8f6] rounded-full pointer-events-none"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      {/* Scrub handle thumb */}
      <div
        className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#f5f4ee] border-2 border-[#8c7b33] shadow-md transition-transform duration-150 pointer-events-none ${
          isDragging || hoverPosition !== null ? "scale-100" : "scale-0 group-hover:scale-100"
        }`}
        style={{ left: `calc(${progressPercent}% - 7px)` }}
      />

      {/* Hover timestamp tooltip */}
      {hoverPosition !== null && (
        <div
          className="absolute -top-7 -translate-x-1/2 px-2 py-0.5 rounded bg-[#0c2f35] text-[#eef2ec] text-[11px] font-mono shadow-lg border border-white/10 pointer-events-none whitespace-nowrap"
          style={{ left: `${hoverPosition * 100}%` }}
        >
          {formatTime(hoverPosition * duration)}
        </div>
      )}
    </div>
  )
}

