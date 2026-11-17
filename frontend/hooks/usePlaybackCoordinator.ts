"use client"

import { useEffect, useCallback } from "react"
import { playerManager } from "@/utils/playerManager"

export function usePlaybackCoordinator(
  playerId: string,
  onPauseOtherPlayers: () => void
) {
  useEffect(() => {
    // Register with shared PlayerManager (Feature 9: Prevent Simultaneous Playback)
    const unregister = playerManager.register(playerId, onPauseOtherPlayers)

    return () => {
      unregister()
    }
  }, [playerId, onPauseOtherPlayers])

  const notifyPlaying = useCallback(() => {
    playerManager.notifyPlaying(playerId)
  }, [playerId])

  return { notifyPlaying }
}

