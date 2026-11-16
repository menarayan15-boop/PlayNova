"use client"

import React from "react"
import { SubtitleTrack } from "@/types"

interface SubtitleMenuProps {
  tracks: SubtitleTrack[]
  activeTrackLanguage: string | null
  onSelectTrack: (language: string | null) => void
  onBack?: () => void
}

export default function SubtitleMenu({
  tracks,
  activeTrackLanguage,
  onSelectTrack,
  onBack,
}: SubtitleMenuProps) {
  const hasTracks = tracks && tracks.length > 0

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
          Subtitles / Captions
        </button>
      )}

      {/* "Off" option */}
      <button
        type="button"
        onClick={() => onSelectTrack(null)}
        className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
          activeTrackLanguage === null
            ? "bg-[#8c7b33]/30 text-[#8c7b33] font-semibold"
            : "hover:bg-white/10 text-[#eef2ec]"
        }`}
      >
        <span>Off</span>
        {activeTrackLanguage === null && (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>

      {/* Available Subtitle Tracks */}
      {hasTracks ? (
        tracks.map((track) => {
          const isSelected = activeTrackLanguage === track.language
          return (
            <button
              key={track.id || track.language}
              type="button"
              onClick={() => onSelectTrack(track.language)}
              className={`flex items-center justify-between px-3 py-2 rounded-lg transition-all ${
                isSelected
                  ? "bg-[#8c7b33]/30 text-[#8c7b33] font-semibold"
                  : "hover:bg-white/10 text-[#eef2ec]"
              }`}
            >
              <span>{track.label}</span>
              {isSelected && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
          )
        })
      ) : (
        <div className="px-3 py-2 text-center text-[11px] text-[#93aaa6]">
          No caption tracks available
        </div>
      )}
    </div>
  )
}

