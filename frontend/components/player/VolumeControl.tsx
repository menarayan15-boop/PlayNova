"use client"

import React, { useState } from "react"

interface VolumeControlProps {
  volume: number
  isMuted: boolean
  onVolumeChange: (volume: number) => void
  onToggleMute: () => void
}

export default function VolumeControl({
  volume,
  isMuted,
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  const [isHovered, setIsHovered] = useState(false)
  const effectiveVolume = isMuted ? 0 : volume
  const volumePercent = Math.round(effectiveVolume * 100)

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onVolumeChange(parseFloat(e.target.value))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault()
      onVolumeChange(Math.min(1, effectiveVolume + 0.05))
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault()
      onVolumeChange(Math.max(0, effectiveVolume - 0.05))
    }
  }

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-2 relative group/vol"
    >
      {/* Mute/Unmute Toggle Button */}
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={isMuted || volume === 0 ? "Unmute audio" : `Mute audio (currently ${volumePercent}%)`}
        title={isMuted || volume === 0 ? "Unmute (M)" : `Mute (M) · ${volumePercent}%`}
        className="p-1.5 rounded-lg hover:bg-white/15 text-[#eef2ec]/85 hover:text-[#eef2ec] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7b33]"
      >
        {isMuted || volume === 0 ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : volume < 0.5 ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        )}
      </button>

      {/* Volume Slider Track */}
      <div className="relative flex items-center w-16 sm:w-20 transition-all duration-200">
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={effectiveVolume}
          onChange={handleSliderChange}
          onKeyDown={handleKeyDown}
          aria-label="Volume level slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={volumePercent}
          aria-valuetext={`${volumePercent}%`}
          className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#8c7b33] hover:h-2 transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-[#8c7b33]"
        />

        {/* Volume Percentage Tooltip */}
        {isHovered && (
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded bg-[#0c2f35] text-[#eef2ec] text-[10px] font-mono border border-white/10 shadow pointer-events-none whitespace-nowrap">
            {volumePercent}%
          </div>
        )}
      </div>
    </div>
  )
}

