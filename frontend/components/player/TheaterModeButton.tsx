"use client"

import React from "react"

interface TheaterModeButtonProps {
  isTheaterMode: boolean
  onClick: () => void
}

export default function TheaterModeButton({
  isTheaterMode,
  onClick,
}: TheaterModeButtonProps) {
  const label = isTheaterMode ? "Default view (T)" : "Theater mode (T)"

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-1.5 rounded-lg active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7b33] ${
        isTheaterMode
          ? "bg-[#cdc8f6]/30 text-[#cdc8f6]"
          : "hover:bg-white/15 text-[#eef2ec]/85 hover:text-[#eef2ec]"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        {isTheaterMode ? (
          <path d="M7 9h10M7 15h10" />
        ) : (
          <path d="M5 9h14M5 15h14" />
        )}
      </svg>
    </button>
  )
}
