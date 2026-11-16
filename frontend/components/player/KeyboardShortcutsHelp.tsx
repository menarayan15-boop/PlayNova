"use client"

import React, { useEffect, useRef } from "react"

interface KeyboardShortcutsHelpProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS = [
  { key: "Space / K", action: "Play or pause video" },
  { key: "← / →", action: "Seek backward / forward 10 seconds" },
  { key: "Shift + ← / →", action: "Seek backward / forward 30 seconds" },
  { key: "↑ / ↓", action: "Increase / decrease volume (5%)" },
  { key: "M", action: "Mute or unmute audio" },
  { key: "F", action: "Toggle full-screen mode" },
  { key: "T", action: "Toggle theater mode" },
  { key: "P", action: "Toggle Picture-in-Picture mode" },
  { key: "C", action: "Toggle subtitles on / off" },
  { key: "+ / -", action: "Increase / decrease playback speed" },
  { key: "N", action: "Play next video (if available)" },
  { key: "?", action: "Show or hide this keyboard help" },
]

export default function KeyboardShortcutsHelp({
  isOpen,
  onClose,
}: KeyboardShortcutsHelpProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={dialogRef}
        className="w-full max-w-lg rounded-2xl bg-[#0c2f35] text-[#eef2ec] border border-white/20 shadow-2xl p-6 relative max-h-[85vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
            <h3 id="shortcuts-title" className="text-base font-semibold tracking-tight">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            className="p-1 rounded-lg text-[#93aaa6] hover:text-[#eef2ec] hover:bg-white/10 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Shortcuts Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {SHORTCUTS.map((s) => (
            <div
              key={s.key}
              className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5"
            >
              <span className="text-[#93aaa6]">{s.action}</span>
              <kbd className="px-2 py-1 rounded bg-[#0a181b] border border-white/15 text-[#8c7b33] font-mono text-[11px] font-semibold whitespace-nowrap shadow-sm">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-[#93aaa6]">
          <span>Shortcuts apply whenever the active player is selected.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded-full bg-[#8c7b33] text-[#ffffff] font-medium text-xs hover:bg-[#a8963f] transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}
