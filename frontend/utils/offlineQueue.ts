import { ProgressUpdatePayload } from "@/types"

interface QueuedProgressItem {
  id: string
  userId: string
  videoId: string
  payload: ProgressUpdatePayload
  timestamp: number
}

const DB_NAME = "playnova_progress_db"
const DB_VERSION = 1
const STORE_NAME = "pending_progress"

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null)
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
          store.createIndex("userId", "userId", { unique: false })
          store.createIndex("timestamp", "timestamp", { unique: false })
        }
      }

      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        console.warn("Failed to open IndexedDB for offline watch progress", request.error)
        resolve(null)
      }
    } catch (err) {
      console.warn("IndexedDB not accessible", err)
      resolve(null)
    }
  })
}

export class OfflineProgressQueue {
  /**
   * Queue a progress update when offline or network fails
   */
  static async enqueue(
    userId: string,
    videoId: string,
    payload: ProgressUpdatePayload
  ): Promise<void> {
    const db = await openDB()
    if (!db) return

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite")
        const store = tx.objectStore(STORE_NAME)
        const item: QueuedProgressItem = {
          id: `${userId}:${videoId}:${Date.now()}`,
          userId,
          videoId,
          payload,
          timestamp: Date.now(),
        }
        store.put(item)
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  /**
   * Get all queued items for a user
   */
  static async getQueueForUser(userId: string): Promise<QueuedProgressItem[]> {
    const db = await openDB()
    if (!db) return []

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readonly")
        const store = tx.objectStore(STORE_NAME)
        const index = store.index("userId")
        const request = index.getAll(userId)

        request.onsuccess = () => {
          const items: QueuedProgressItem[] = request.result || []
          items.sort((a, b) => a.timestamp - b.timestamp)
          resolve(items)
        }
        request.onerror = () => resolve([])
      } catch {
        resolve([])
      }
    })
  }

  /**
   * Remove a successfully synced item
   */
  static async remove(id: string): Promise<void> {
    const db = await openDB()
    if (!db) return

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite")
        const store = tx.objectStore(STORE_NAME)
        store.delete(id)
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  /**
   * Clear all queued items for a user (e.g. on logout)
   */
  static async clearUserQueue(userId: string): Promise<void> {
    const items = await this.getQueueForUser(userId)
    const db = await openDB()
    if (!db || items.length === 0) return

    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, "readwrite")
        const store = tx.objectStore(STORE_NAME)
        items.forEach((item) => store.delete(item.id))
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
  }
}

