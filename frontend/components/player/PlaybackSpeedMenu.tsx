"use client"

import React from "react"
import { PlaybackSpeed } from "@/types"

interface PlaybackSpeedMenuProps {
  currentSpeed: PlaybackSpeed
  onSelectSpeed: (speed: PlaybackSpeed) => void
  onBack?: () => void
}

const SPEED_CHOICES: PlaybackSpeed[] = [0.5, 1, 1.25, 1.5, 2]

export default function PlaybackSpeedMenu({
  currentSpeed,
  onSelectSpeed,
  onBack,
}: PlaybackSpeedMenuProps) {
  return (
    <div className="flex flex-col gap-1 min-w-[170px] p-1.5 text-xs text-[#eef2ec]">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-white/10 text-[#93aaa6] hover:text-[#eef2ec] font-medium border-b border-white/10 mb-1 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Playback Speed
        </button>
      )}

      {SPEED_CHOICES.map((speed) => {
        const isSelected = currentSpeed === speed
        return (
          <button
            key={speed}
            type="button"
            onClick={() => onSelectSpeed(speed)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
              isSelected
                ? "bg-[#8c7b33]/30 text-[#8c7b33] font-semibold"
                : "hover:bg-white/10 text-[#eef2ec]"
            }`}
          >
            <span>{speed === 1 ? "Normal (1×)" : `${speed}×`}</span>
            {isSelected && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>
        )
      })}
    </div>
  )
}
