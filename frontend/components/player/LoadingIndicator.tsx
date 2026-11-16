"use client"

import React from "react"

interface LoadingIndicatorProps {
  isLoading: boolean
  isBuffering: boolean
}

export default function LoadingIndicator({
  isLoading,
  isBuffering,
}: LoadingIndicatorProps) {
  if (!isLoading && !isBuffering) return null

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] z-30 pointer-events-none select-none animate-in fade-in duration-200"
      role="status"
      aria-live="polite"
    >
      <div className="relative w-12 h-12 mb-2">
        {/* Outer glowing pulsing ring */}
        <div className="absolute inset-0 rounded-full border-2 border-[#8c7b33]/20 animate-ping" />
        {/* Spinning track */}
        <div className="w-12 h-12 rounded-full border-3 border-[#8c7b33]/20 border-t-[#8c7b33] border-r-[#cdc8f6] animate-spin" />
      </div>
      <span className="text-xs font-mono text-[#eef2ec]/90 tracking-wider uppercase font-medium drop-shadow">
        {isLoading ? "Loading stream..." : "Buffering..."}
      </span>
    </div>
  )
}
