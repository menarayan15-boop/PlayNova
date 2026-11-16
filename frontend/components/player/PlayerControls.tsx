"use client"

import React from "react"
import ProgressBar from "./ProgressBar"

interface PlayerControlsProps {
  isPlaying: boolean
  isMuted: boolean
  volume: number
  currentTime: number
  duration: number
  buffered?: number
  isFullscreen: boolean
  onTogglePlay: () => void
  onToggleMute: () => void
  onVolumeChange: (vol: number) => void
  onSeek: (time: number) => void
  onSeekRelative: (seconds: number) => void
  onToggleFullscreen: () => void
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return "0:00"
  const totalSecs = Math.floor(seconds)
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    const remMins = mins % 60
    return `${hrs}:${remMins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export default function PlayerControls({
  isPlaying,
  isMuted,
  volume,
  currentTime,
  duration,
  buffered = 0,
  isFullscreen,
  onTogglePlay,
  onToggleMute,
  onVolumeChange,
  onSeek,
  onSeekRelative,
  onToggleFullscreen,
}: PlayerControlsProps) {
  const effectiveVolume = isMuted ? 0 : volume

  return (
    <div className="absolute inset-x-0 bottom-0 px-4 py-3 bg-gradient-to-t from-black/85 via-black/40 to-transparent transition-opacity duration-300 z-20 flex flex-col gap-2">
      {/* Progress scrub bar */}
      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        onSeek={onSeek}
      />

      {/* Control row */}
      <div className="flex items-center justify-between text-[#eef2ec] text-sm">
        {/* Left controls: Play/Pause, Replay 10s, Forward 10s, Volume, Time */}
        <div className="flex items-center gap-3">
          {/* Play / Pause button */}
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? "Pause video" : "Play video"}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/25 active:scale-95 transition-all text-[#eef2ec] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7b33]"
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1.5" />
                <rect x="14" y="4" width="4" height="16" rx="1.5" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                <path d="M6 4.5V19.5L19 12L6 4.5Z" />
              </svg>
            )}
          </button>

          {/* Seek backward 10s */}
          <button
            type="button"
            onClick={() => onSeekRelative(-10)}
            aria-label="Rewind 10 seconds"
            title="Rewind 10s"
            className="p-1.5 rounded-lg hover:bg-white/15 active:scale-95 text-[#eef2ec]/85 hover:text-[#eef2ec] transition-all flex items-center gap-0.5 text-xs"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span className="text-[11px] font-mono">-10s</span>
          </button>

          {/* Seek forward 10s */}
          <button
            type="button"
            onClick={() => onSeekRelative(10)}
            aria-label="Fast forward 10 seconds"
            title="Forward 10s"
            className="p-1.5 rounded-lg hover:bg-white/15 active:scale-95 text-[#eef2ec]/85 hover:text-[#eef2ec] transition-all flex items-center gap-0.5 text-xs"
          >
            <span className="text-[11px] font-mono">+10s</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>

          {/* Volume slider & mute/unmute */}
          <div className="flex items-center gap-2 group/vol relative">
            <button
              type="button"
              onClick={onToggleMute}
              aria-label={isMuted || volume === 0 ? "Unmute audio" : "Mute audio"}
              className="p-1.5 rounded-lg hover:bg-white/15 text-[#eef2ec]/85 hover:text-[#eef2ec] transition-all"
            >
              {isMuted || volume === 0 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : volume < 0.5 ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 5L6 9H2v6h4l5 4V5z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>

            {/* Volume slider */}
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={effectiveVolume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              aria-label="Audio volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(effectiveVolume * 100)}
              className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#8c7b33] hover:h-1.5 transition-all"
            />
          </div>

          {/* Time display: Current / Total */}
          <div className="text-[12px] font-mono text-[#eef2ec]/75 tracking-tight ml-1">
            <span className="text-[#eef2ec] font-medium">{formatTime(currentTime)}</span>
            <span className="mx-1 text-[#eef2ec]/40">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right controls: Quality pill, Fullscreen */}
        <div className="flex items-center gap-3">
          {/* HD Quality indicator pill */}
          <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-white/10 text-[#cdc8f6] border border-[#cdc8f6]/30">
            1080p HD
          </span>

          {/* Fullscreen button */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            className="p-1.5 rounded-lg hover:bg-white/15 text-[#eef2ec]/85 hover:text-[#eef2ec] transition-all"
          >
            {isFullscreen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

