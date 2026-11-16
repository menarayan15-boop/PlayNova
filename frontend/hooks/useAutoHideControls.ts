"use client"

import { useState, useRef, useCallback, useEffect } from "react"

interface AutoHideOptions {
  isPlaying: boolean
  isScrubbing: boolean
  isSettingsOpen: boolean
  isShortcutsOpen: boolean
  hideDelayMs?: number
}

export function useAutoHideControls({
  isPlaying,
  isScrubbing,
  isSettingsOpen,
  isShortcutsOpen,
  hideDelayMs = 3000,
}: AutoHideOptions) {
  const [controlsVisible, setControlsVisible] = useState(true)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true)
    clearTimer()

    // Only auto-hide if playing and no interactive menu or scrubbing is active
    if (isPlaying && !isScrubbing && !isSettingsOpen && !isShortcutsOpen) {
      timerRef.current = setTimeout(() => {
        setControlsVisible(false)
      }, hideDelayMs)
    }
  }, [isPlaying, isScrubbing, isSettingsOpen, isShortcutsOpen, hideDelayMs, clearTimer])

  // When paused, scrubbing, or a modal/menu is open, always keep controls visible
  useEffect(() => {
    if (!isPlaying || isScrubbing || isSettingsOpen || isShortcutsOpen) {
      clearTimer()
      setControlsVisible(true)
    } else {
      showControlsTemporarily()
    }
    return () => clearTimer()
  }, [isPlaying, isScrubbing, isSettingsOpen, isShortcutsOpen, clearTimer, showControlsTemporarily])

  return {
    controlsVisible,
    setControlsVisible,
    showControlsTemporarily,
  }
}

