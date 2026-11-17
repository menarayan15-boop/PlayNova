/**
 * PlayNova Shared Player Manager (Feature 9)
 * Guarantees only one PlayNova player plays audio/video simultaneously in the current tab.
 */

type PauseCallback = () => void

class PlayerManager {
  private players: Map<string, PauseCallback> = new Map()
  private activePlayerId: string | null = null

  /**
   * Register a player instance with its pause callback
   */
  register(playerId: string, pauseCallback: PauseCallback): () => void {
    this.players.set(playerId, pauseCallback)

    return () => {
      this.players.delete(playerId)
      if (this.activePlayerId === playerId) {
        this.activePlayerId = null
      }
    }
  }

  /**
   * Notify that a player has started playback.
   * Pauses all other registered players in the current window/tab.
   */
  notifyPlaying(playerId: string): void {
    this.activePlayerId = playerId

    // Pause all other registered players in this tab
    this.players.forEach((pauseFn, id) => {
      if (id !== playerId) {
        try {
          pauseFn()
        } catch (err) {
          console.warn(`[PlayerManager] Error pausing player ${id}:`, err)
        }
      }
    })

    // Also dispatch DOM event for any non-registered listeners
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("playnova:play", { detail: { playerId } })
      )

      // Cross-tab broadcast
      if (typeof BroadcastChannel !== "undefined") {
        try {
          const channel = new BroadcastChannel("playnova_playback_coordinator")
          channel.postMessage({ type: "PLAY", playerId })
          channel.close()
        } catch {
          // Ignore BroadcastChannel errors in restricted contexts
        }
      }
    }
  }

  getActivePlayerId(): string | null {
    return this.activePlayerId
  }
}

export const playerManager = new PlayerManager()

