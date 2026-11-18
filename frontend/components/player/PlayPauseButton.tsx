"use client"

import React from "react"

interface PlayPauseButtonProps {
  isPlaying: boolean
  isEnded: boolean
  onClick: () => void
  size?: number
}

export default function PlayPauseButton({
  isPlaying,
  isEnded,
  onClick,
  size = 18,
}: PlayPauseButtonProps) {
  let label = "Play video"
  if (isEnded) label = "Replay video"
  else if (isPlaying) label = "Pause video"

  return (
    <button
      type="button"
      data-play-toggle="true"
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={label}
      title={`${label} (Space / K)`}
      className="w-10 h-10 rounded-full flex items-center justify-center bg-white/15 hover:bg-white/25 active:scale-95 transition-colors text-[#eef2ec] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7b33]"
    >
      {isEnded ? (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 4v6h6" />
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
        </svg>
      ) : isPlaying ? (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16" rx="1.5" />
          <rect x="14" y="4" width="4" height="16" rx="1.5" />
        </svg>
      ) : (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
          <path d="M6 4.5V19.5L19 12L6 4.5Z" />
        </svg>
      )}
    </button>
  )
}
