"use client"

import { useEffect } from "react"

interface KeyboardShortcutHandlers {
  isActive: boolean
  onTogglePlay: () => void
  onSeekRelative: (seconds: number) => void
  onVolumeChangeRelative: (delta: number) => void
  onToggleMute: () => void
  onToggleFullscreen: () => void
  onToggleTheaterMode: () => void
  onTogglePiP: () => void
  onToggleSubtitles: () => void
  onCycleSpeed: (direction: "up" | "down") => void
  onNextVideo?: () => void
  onToggleHelpModal: () => void
}

export function useKeyboardShortcuts({
  isActive,
  onTogglePlay,
  onSeekRelative,
  onVolumeChangeRelative,
  onToggleMute,
  onToggleFullscreen,
  onToggleTheaterMode,
  onTogglePiP,
  onToggleSubtitles,
  onCycleSpeed,
  onNextVideo,
  onToggleHelpModal,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    if (!isActive || typeof window === "undefined") return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore keystrokes inside form controls or content editable areas
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return
      }

      // Modifier key checks (ignore browser shortcuts like Ctrl+F, Cmd+R, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return
      }

      switch (e.code) {
        case "Space":
          // If a non-play control button (e.g. Mute, Fullscreen, Settings) is focused,
          // let native button activation handle Space instead of toggling Play/Pause.
          if (target && target.tagName === "BUTTON" && target.getAttribute("data-play-toggle") !== "true") {
            return
          }
          e.preventDefault()
          e.stopPropagation()
          onTogglePlay()
          break

        case "KeyK":
          e.preventDefault()
          e.stopPropagation()
          onTogglePlay()
          break

        case "ArrowLeft":
          e.preventDefault()
          if (e.shiftKey) {
            onSeekRelative(-30) // Shift + Left = 30s
          } else {
            onSeekRelative(-10) // Left = 10s
          }
          break

        case "ArrowRight":
          e.preventDefault()
          if (e.shiftKey) {
            onSeekRelative(30) // Shift + Right = 30s
          } else {
            onSeekRelative(10) // Right = 10s
          }
          break

        case "ArrowUp":
          e.preventDefault()
          onVolumeChangeRelative(0.05) // Volume +5%
          break

        case "ArrowDown":
          e.preventDefault()
          onVolumeChangeRelative(-0.05) // Volume -5%
          break

        case "KeyM":
          e.preventDefault()
          onToggleMute()
          break

        case "KeyF":
          e.preventDefault()
          onToggleFullscreen()
          break

        case "KeyT":
          e.preventDefault()
          onToggleTheaterMode()
          break

        case "KeyP":
          e.preventDefault()
          onTogglePiP()
          break

        case "KeyC":
          e.preventDefault()
          onToggleSubtitles()
          break

        case "Period": // '>' key with shift, or '.'
          if (e.shiftKey || e.key === ">") {
            e.preventDefault()
            onCycleSpeed("up")
          }
          break

        case "Comma": // '<' key with shift, or '<'
          if (e.shiftKey || e.key === "<") {
            e.preventDefault()
            onCycleSpeed("down")
          }
          break

        case "Equal": // '+' or '='
          if (e.key === "+" || e.key === "=") {
            e.preventDefault()
            onCycleSpeed("up")
          }
          break

        case "Minus": // '-'
          e.preventDefault()
          onCycleSpeed("down")
          break

        case "KeyN":
          if (onNextVideo) {
            e.preventDefault()
            onNextVideo()
          }
          break

        case "Slash":
          if (e.shiftKey) {
            // '?' key
            e.preventDefault()
            onToggleHelpModal()
          }
          break

        default:
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    isActive,
    onTogglePlay,
    onSeekRelative,
    onVolumeChangeRelative,
    onToggleMute,
    onToggleFullscreen,
    onToggleTheaterMode,
    onTogglePiP,
    onToggleSubtitles,
    onCycleSpeed,
    onNextVideo,
    onToggleHelpModal,
  ])
}

