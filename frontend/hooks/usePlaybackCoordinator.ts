"use client"

import { useEffect, useCallback } from "react"

const CHANNEL_NAME = "playnova_playback_coordinator"

export function usePlaybackCoordinator(
  playerId: string,
  onPauseOtherPlayers: () => void
) {
  useEffect(() => {
    if (typeof window === "undefined") return

    // 1. Same-window communication via CustomEvent
    const handleSameWindowPlay = (e: Event) => {
      const customEvent = e as CustomEvent<{ playerId: string }>
      if (customEvent.detail && customEvent.detail.playerId !== playerId) {
        onPauseOtherPlayers()
      }
    }
    window.addEventListener("playnova:play", handleSameWindowPlay)

    // 2. Cross-tab communication via BroadcastChannel (if supported by browser)
    let channel: BroadcastChannel | null = null
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel(CHANNEL_NAME)
        channel.onmessage = (event) => {
          if (event.data && event.data.type === "PLAY" && event.data.playerId !== playerId) {
            onPauseOtherPlayers()
          }
        }
      } catch {
        // BroadcastChannel may fail in restricted iframes
      }
    }

    return () => {
      window.removeEventListener("playnova:play", handleSameWindowPlay)
      if (channel) {
        channel.close()
      }
    }
  }, [playerId, onPauseOtherPlayers])

  const notifyPlaying = useCallback(() => {
    if (typeof window === "undefined") return

    // Notify same window
    window.dispatchEvent(
      new CustomEvent("playnova:play", { detail: { playerId } })
    )

    // Notify other tabs
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const channel = new BroadcastChannel(CHANNEL_NAME)
        channel.postMessage({ type: "PLAY", playerId })
        channel.close()
      } catch {}
    }
  }, [playerId])

  return { notifyPlaying }
}

