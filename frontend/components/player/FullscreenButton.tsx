"use client"

import React from "react"

interface FullscreenButtonProps {
  isFullscreen: boolean
  onClick: () => void
}

export default function FullscreenButton({
  isFullscreen,
  onClick,
}: FullscreenButtonProps) {
  const label = isFullscreen ? "Exit full-screen (F)" : "Full-screen (F)"

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="p-1.5 rounded-lg hover:bg-white/15 text-[#eef2ec]/85 hover:text-[#eef2ec] active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7b33]"
    >
      {isFullscreen ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      )}
    </button>
  )
}
