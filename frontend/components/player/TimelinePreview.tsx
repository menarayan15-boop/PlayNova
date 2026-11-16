"use client"

import React from "react"

interface TimelinePreviewProps {
  previewTime: number | null
  previewX: number
  timelineWidth: number
  thumbnailUrl: string | null
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

export default function TimelinePreview({
  previewTime,
  previewX,
  timelineWidth,
  thumbnailUrl,
}: TimelinePreviewProps) {
  if (previewTime === null) return null

  // Clamping preview card so it doesn't overflow left or right bounds
  const previewCardWidth = thumbnailUrl ? 150 : 64
  const halfWidth = previewCardWidth / 2
  const clampedX = Math.max(halfWidth, Math.min(previewX, timelineWidth - halfWidth))

  return (
    <div
      className="absolute bottom-6 pointer-events-none z-30 transition-all duration-75 ease-out select-none"
      style={{ left: `${clampedX}px`, transform: "translateX(-50%)" }}
      aria-hidden="true"
    >
      <div className="flex flex-col items-center">
        {/* Preview Frame Box */}
        <div className="p-1 rounded-lg bg-[#0c2f35] border border-white/20 shadow-2xl overflow-hidden backdrop-blur-md">
          {thumbnailUrl ? (
            <div className="w-[142px] aspect-video rounded overflow-hidden bg-black mb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailUrl}
                alt="Timeline preview frame"
                className="w-full h-full object-cover"
              />
            </div>
          ) : null}

          {/* Timestamp Badge */}
          <div className="text-center px-1.5 py-0.5 text-[11px] font-mono text-[#eef2ec] font-medium tracking-tight">
            {formatTime(previewTime)}
          </div>
        </div>

        {/* Pointer arrowhead */}
        <div className="w-2 h-2 bg-[#0c2f35] border-r border-b border-white/20 rotate-45 -mt-1" />
      </div>
    </div>
  )
}

