"use client"

import React, { useEffect, useState } from "react"
import { formatTime } from "@/utils/time"

interface ResumePromptProps {
  lastPositionSeconds: number
  durationSeconds: number
  onDismiss: () => void
  onResume: () => void
  onStartOver: () => void
  autoDismissSeconds?: number
}

export function ResumePrompt({
  lastPositionSeconds,
  durationSeconds,
  onDismiss,
  onResume,
  onStartOver,
  autoDismissSeconds = 10,
}: ResumePromptProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(autoDismissSeconds)

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          onDismiss()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onDismiss])

  const formattedTime = formatTime(lastPositionSeconds)
  const percent = durationSeconds > 0 ? Math.round((lastPositionSeconds / durationSeconds) * 100) : 0

  return (
    <div
      className="absolute bottom-20 left-4 sm:left-6 z-40 max-w-sm p-4 rounded-xl bg-[#0c2f35]/95 text-[#f5f4ee] border border-[#8c7b33]/40 shadow-[0_20px_45px_-15px_rgba(0,0,0,0.7)] backdrop-blur-md animate-fade-in transition-all"
      role="dialog"
      aria-label="Resume playback prompt"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#8c7b33] animate-pulse" />
          <span className="text-xs uppercase tracking-wider font-semibold text-[#8c7b33]">
            Resume Playback
          </span>
        </div>
        <button
          onClick={onDismiss}
          className="text-[#93aaa6] hover:text-[#f5f4ee] transition-colors p-1 -mr-1 -mt-1 text-sm"
          aria-label="Close resume prompt"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <p className="text-sm font-medium text-[#f5f4ee] mb-1">
        Continue watching from <span className="font-mono font-bold text-[#cdc8f6]">{formattedTime}</span>?
      </p>
      <p className="text-xs text-[#93aaa6] mb-3">
        You were {percent}% through this video.
      </p>

      {/* Progress preview bar */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-3.5">
        <div
          className="h-full bg-gradient-to-r from-[#8c7b33] to-[#cdc8f6] rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onResume}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#8c7b33] text-[#ffffff] hover:bg-[#a6923d] active:scale-95 transition-all shadow-sm"
        >
          Resume
        </button>
        <button
          onClick={onStartOver}
          className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/10 text-[#f5f4ee] hover:bg-white/15 active:scale-95 transition-all"
        >
          Start Over
        </button>
      </div>

      <span className="block text-[10px] text-right font-mono text-[#93aaa6]/70 mt-2">
        Auto-dismiss in {secondsRemaining}s
      </span>
    </div>
  )
}

