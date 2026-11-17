"use client"

import React, { useState, useEffect, useRef } from "react"
import { VideoItem } from "@/types"

interface AutoplayCountdownProps {
  nextVideo: VideoItem
  onPlayNow: () => void
  onCancel: () => void
  countdownSeconds?: number
}

export default function AutoplayCountdown({
  nextVideo,
  onPlayNow,
  onCancel,
  countdownSeconds = 5,
}: AutoplayCountdownProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(countdownSeconds)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setSecondsRemaining(countdownSeconds)

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current)
          onPlayNow()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [countdownSeconds, onPlayNow])

  const progressPct = ((countdownSeconds - secondsRemaining) / countdownSeconds) * 100

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-[#0c2f35]/95 border border-white/20 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col gap-4 text-center">
        {/* Header label with countdown circle */}
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c7b33] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#8c7b33] animate-pulse" />
            Up Next in {secondsRemaining}s
          </span>

          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel autoplay"
            className="text-xs font-mono text-[#93aaa6] hover:text-[#eef2ec] px-2 py-0.5 rounded hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>
        </div>

        {/* Video Card Preview */}
        <div className="flex gap-3 text-left p-2.5 rounded-xl bg-black/40 border border-white/10 items-center">
          <div className="relative w-28 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nextVideo.thumbnailUrl}
              alt={nextVideo.title}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/80 text-[10px] font-mono text-white">
              {Math.floor(nextVideo.duration / 60)}:
              {(nextVideo.duration % 60).toString().padStart(2, "0")}
            </span>
          </div>

          <div className="flex flex-col justify-center min-w-0 flex-1">
            <span className="text-[10px] font-mono text-[#cdc8f6] uppercase">
              {nextVideo.category}
            </span>
            <h4 className="text-sm font-medium text-[#eef2ec] truncate mt-0.5">
              {nextVideo.title}
            </h4>
          </div>
        </div>

        {/* Linear progress countdown bar */}
        <div className="w-full h-1.5 bg-white/15 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#8c7b33] to-[#cdc8f6] transition-all duration-1000 ease-linear rounded-full"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={onPlayNow}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#8c7b33] to-[#a8963f] hover:brightness-110 text-[#0c2f35] font-semibold text-xs tracking-wide shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 4.5V19.5L19 12L6 4.5Z" />
            </svg>
            Play Now ({secondsRemaining}s)
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-[#eef2ec] font-medium text-xs tracking-wide active:scale-95 transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

