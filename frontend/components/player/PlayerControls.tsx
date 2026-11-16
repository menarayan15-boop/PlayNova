"use client"

import React from "react"
import { PlaybackSpeed, SubtitleTrack, ThumbnailPreview } from "@/types"
import PlayPauseButton from "./PlayPauseButton"
import VolumeControl from "./VolumeControl"
import VideoTimeline from "./VideoTimeline"
import VideoSettingsMenu from "./VideoSettingsMenu"
import FullscreenButton from "./FullscreenButton"
import PictureInPictureButton from "./PictureInPictureButton"
import TheaterModeButton from "./TheaterModeButton"

interface PlayerControlsProps {
  isPlaying: boolean
  isEnded: boolean
  volume: number
  isMuted: boolean
  currentTime: number
  duration: number
  bufferedTime: number
  playbackSpeed: PlaybackSpeed
  subtitles: SubtitleTrack[]
  activeSubtitleLanguage: string | null
  qualityResolution: string
  showRemainingTime: boolean
  isTheaterMode: boolean
  isFullscreen: boolean
  isPiP: boolean
  isPiPSupported: boolean
  isSettingsOpen: boolean
  thumbnails?: ThumbnailPreview[]
  onTogglePlay: () => void
  onSeek: (time: number) => void
  onSeekRelative: (seconds: number) => void
  onVolumeChange: (vol: number) => void
  onToggleMute: () => void
  onToggleRemainingTime: () => void
  onSelectSpeed: (speed: PlaybackSpeed) => void
  onSelectSubtitle: (lang: string | null) => void
  onToggleSubtitles: () => void
  onToggleTheaterMode: () => void
  onToggleFullscreen: () => void
  onTogglePiP: () => void
  onToggleSettings: () => void
  onToggleHelpModal: () => void
  onScrubStart?: () => void
  onScrubEnd?: () => void
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
  isEnded,
  volume,
  isMuted,
  currentTime,
  duration,
  bufferedTime,
  playbackSpeed,
  subtitles,
  activeSubtitleLanguage,
  qualityResolution,
  showRemainingTime,
  isTheaterMode,
  isFullscreen,
  isPiP,
  isPiPSupported,
  isSettingsOpen,
  thumbnails,
  onTogglePlay,
  onSeek,
  onSeekRelative,
  onVolumeChange,
  onToggleMute,
  onToggleRemainingTime,
  onSelectSpeed,
  onSelectSubtitle,
  onToggleSubtitles,
  onToggleTheaterMode,
  onToggleFullscreen,
  onTogglePiP,
  onToggleSettings,
  onToggleHelpModal,
  onScrubStart,
  onScrubEnd,
}: PlayerControlsProps) {
  const remainingSeconds = Math.max(0, duration - currentTime)
  const formattedTimeDisplay = showRemainingTime
    ? `-${formatTime(remainingSeconds)}`
    : `${formatTime(currentTime)} / ${formatTime(duration)}`

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute inset-x-0 bottom-0 px-4 py-3 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 z-20 flex flex-col gap-2 select-none"
    >
      {/* Interactive Timeline with Scrubbing and Thumbnail Previews */}
      <VideoTimeline
        currentTime={currentTime}
        duration={duration}
        bufferedTime={bufferedTime}
        thumbnails={thumbnails}
        onSeek={onSeek}
        onScrubStart={onScrubStart}
        onScrubEnd={onScrubEnd}
      />

      {/* Control Buttons Row */}
      <div className="flex items-center justify-between text-[#eef2ec] text-sm">
        {/* Left Controls: Play, Seek -10/+10, Volume, Time Display */}
        <div className="flex items-center gap-2 sm:gap-3">
          <PlayPauseButton
            isPlaying={isPlaying}
            isEnded={isEnded}
            onClick={onTogglePlay}
          />

          {/* Seek backward 10s */}
          <button
            type="button"
            onClick={() => onSeekRelative(-10)}
            aria-label="Rewind 10 seconds"
            title="Rewind 10s (←)"
            className="p-1.5 rounded-lg hover:bg-white/15 active:scale-95 text-[#eef2ec]/85 hover:text-[#eef2ec] transition-all flex items-center gap-0.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7b33]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            <span className="hidden sm:inline text-[11px] font-mono">-10s</span>
          </button>

          {/* Seek forward 10s */}
          <button
            type="button"
            onClick={() => onSeekRelative(10)}
            aria-label="Fast forward 10 seconds"
            title="Forward 10s (→)"
            className="p-1.5 rounded-lg hover:bg-white/15 active:scale-95 text-[#eef2ec]/85 hover:text-[#eef2ec] transition-all flex items-center gap-0.5 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7b33]"
          >
            <span className="hidden sm:inline text-[11px] font-mono">+10s</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
          </button>

          {/* Volume Control */}
          <VolumeControl
            volume={volume}
            isMuted={isMuted}
            onVolumeChange={onVolumeChange}
            onToggleMute={onToggleMute}
          />

          {/* Time Display (Click to toggle remaining time) */}
          <button
            type="button"
            onClick={onToggleRemainingTime}
            title="Click to toggle current vs remaining time"
            aria-label="Toggle playback time display format"
            className="text-[12px] font-mono text-[#eef2ec]/80 hover:text-[#eef2ec] tracking-tight ml-1 px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
          >
            {formattedTimeDisplay}
          </button>
        </div>

        {/* Right Controls: Subtitles, Settings, PiP, Theater, Fullscreen, Help */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Quick Subtitle Toggle Button */}
          {subtitles.length > 0 && (
            <button
              type="button"
              onClick={onToggleSubtitles}
              aria-label={activeSubtitleLanguage ? "Disable subtitles (C)" : "Enable subtitles (C)"}
              title={activeSubtitleLanguage ? `Subtitles: ${activeSubtitleLanguage.toUpperCase()} (C)` : "Enable Subtitles (C)"}
              className={`p-1.5 rounded-lg active:scale-95 transition-all text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7b33] ${
                activeSubtitleLanguage
                  ? "bg-[#cdc8f6]/30 text-[#cdc8f6] font-semibold"
                  : "hover:bg-white/15 text-[#eef2ec]/75 hover:text-[#eef2ec]"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="M7 15h4M15 15h2M7 11h2M13 11h4" />
              </svg>
            </button>
          )}

          {/* Settings Menu Gear Button */}
          <div className="relative">
            <button
              type="button"
              onClick={onToggleSettings}
              aria-label="Player settings"
              aria-expanded={isSettingsOpen}
              title="Settings (Speed, Subtitles, Quality)"
              className={`p-1.5 rounded-lg active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7b33] ${
                isSettingsOpen
                  ? "bg-[#8c7b33]/30 text-[#8c7b33]"
                  : "hover:bg-white/15 text-[#eef2ec]/85 hover:text-[#eef2ec]"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>

            {/* Popup Settings Menu */}
            <VideoSettingsMenu
              isOpen={isSettingsOpen}
              currentSpeed={playbackSpeed}
              subtitles={subtitles}
              activeSubtitleLanguage={activeSubtitleLanguage}
              qualityResolution={qualityResolution}
              onSelectSpeed={onSelectSpeed}
              onSelectSubtitle={onSelectSubtitle}
              onClose={onToggleSettings}
            />
          </div>

          {/* Picture-in-Picture Button */}
          <PictureInPictureButton
            isPiP={isPiP}
            isSupported={isPiPSupported}
            onClick={onTogglePiP}
          />

          {/* Theater Mode Button */}
          <TheaterModeButton
            isTheaterMode={isTheaterMode}
            onClick={onToggleTheaterMode}
          />

          {/* Fullscreen Button */}
          <FullscreenButton
            isFullscreen={isFullscreen}
            onClick={onToggleFullscreen}
          />

          {/* Keyboard Shortcuts Help Button */}
          <button
            type="button"
            onClick={onToggleHelpModal}
            aria-label="Keyboard shortcuts guide"
            title="Keyboard Shortcuts (?)"
            className="p-1.5 rounded-lg hover:bg-white/15 text-[#eef2ec]/75 hover:text-[#eef2ec] text-xs font-mono font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8c7b33]"
          >
            ?
          </button>
        </div>
      </div>
    </div>
  )
}
