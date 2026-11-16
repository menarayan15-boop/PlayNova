"use client"

import React, { useState, useRef, useEffect } from "react"
import { PlaybackSpeed, SubtitleTrack } from "@/types"
import PlaybackSpeedMenu from "./PlaybackSpeedMenu"
import SubtitleMenu from "./SubtitleMenu"

interface VideoSettingsMenuProps {
  isOpen: boolean
  currentSpeed: PlaybackSpeed
  subtitles: SubtitleTrack[]
  activeSubtitleLanguage: string | null
  qualityResolution: string
  onSelectSpeed: (speed: PlaybackSpeed) => void
  onSelectSubtitle: (lang: string | null) => void
  onClose: () => void
}

type MenuView = "main" | "speed" | "subtitles"

export default function VideoSettingsMenu({
  isOpen,
  currentSpeed,
  subtitles,
  activeSubtitleLanguage,
  qualityResolution,
  onSelectSpeed,
  onSelectSubtitle,
  onClose,
}: VideoSettingsMenuProps) {
  const [view, setView] = useState<MenuView>("main")
  const menuRef = useRef<HTMLDivElement>(null)

  // Reset to main view whenever opened
  useEffect(() => {
    if (isOpen) {
      setView("main")
    }
  }, [isOpen])

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return

    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const activeSubtitleLabel = activeSubtitleLanguage
    ? subtitles.find((s) => s.language === activeSubtitleLanguage)?.label || activeSubtitleLanguage
    : "Off"

  return (
    <div
      ref={menuRef}
      className="absolute right-4 bottom-14 z-40 rounded-xl bg-[#0c2f35]/95 backdrop-blur-md border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-150"
    >
      {view === "main" && (
        <div className="flex flex-col gap-1 min-w-[200px] p-1.5 text-xs text-[#eef2ec]">
          {/* Header */}
          <div className="px-3 py-1.5 text-[11px] font-mono uppercase tracking-wider text-[#93aaa6] border-b border-white/10">
            Player Settings
          </div>

          {/* Speed submenu item */}
          <button
            type="button"
            onClick={() => setView("speed")}
            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Playback Speed</span>
            </div>
            <div className="flex items-center gap-1 text-[#8c7b33] font-mono">
              <span>{currentSpeed === 1 ? "1×" : `${currentSpeed}×`}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </button>

          {/* Subtitles submenu item */}
          <button
            type="button"
            onClick={() => setView("subtitles")}
            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M7 15h4M15 15h2M7 11h2M13 11h4" />
              </svg>
              <span>Subtitles</span>
            </div>
            <div className="flex items-center gap-1 text-[#cdc8f6] font-mono">
              <span>{activeSubtitleLabel}</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </div>
          </button>

          {/* Quality Info display (Section 13: Display actual resolution without fake switching) */}
          <div className="flex items-center justify-between px-3 py-2 text-[#93aaa6] border-t border-white/10 mt-1">
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Quality</span>
            </div>
            <span className="font-mono text-[#8c7b33] font-medium">{qualityResolution}</span>
          </div>
        </div>
      )}

      {view === "speed" && (
        <PlaybackSpeedMenu
          currentSpeed={currentSpeed}
          onSelectSpeed={(speed) => {
            onSelectSpeed(speed)
            setView("main")
          }}
          onBack={() => setView("main")}
        />
      )}

      {view === "subtitles" && (
        <SubtitleMenu
          tracks={subtitles}
          activeTrackLanguage={activeSubtitleLanguage}
          onSelectTrack={(lang) => {
            onSelectSubtitle(lang)
            setView("main")
          }}
          onBack={() => setView("main")}
        />
      )}
    </div>
  )
}
