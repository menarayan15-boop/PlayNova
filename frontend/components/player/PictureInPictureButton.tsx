"use client"

import React from "react"

interface PictureInPictureButtonProps {
  isPiP: boolean
  isSupported: boolean
  onClick: () => void
}

export default function PictureInPictureButton({
  isPiP,
  isSupported,
  onClick,
}: PictureInPictureButtonProps) {
  if (!isSupported) {
    return (
      <button
        type="button"
        disabled
        aria-label="Picture-in-Picture unavailable in this browser"
        title="Picture-in-Picture not supported"
        className="p-1.5 rounded-lg text-white/30 cursor-not-allowed opacity-50"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <rect x="12" y="10" width="8" height="8" rx="1" strokeDasharray="2 2" />
        </svg>
      </button>
    )
  }

  const label = isPiP ? "Exit Picture-in-Picture (P)" : "Picture-in-Picture (P)"

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-1.5 rounded-lg active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7b33] ${
        isPiP
          ? "bg-[#8c7b33]/30 text-[#8c7b33]"
          : "hover:bg-white/15 text-[#eef2ec]/85 hover:text-[#eef2ec]"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <rect x="12" y="10" width="8" height="8" rx="1" fill={isPiP ? "currentColor" : "none"} />
      </svg>
    </button>
  )
}
