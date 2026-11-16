"use client"

import { useState, useCallback, RefObject } from "react"
import { ThumbnailPreview } from "@/types"

export function useTimelinePreview(
  timelineRef: RefObject<HTMLDivElement>,
  duration: number,
  thumbnails?: ThumbnailPreview[]
) {
  const [previewTime, setPreviewTime] = useState<number | null>(null)
  const [previewX, setPreviewX] = useState<number>(0)
  const [previewPercentage, setPreviewPercentage] = useState<number>(0)
  const [activeThumbnailUrl, setActiveThumbnailUrl] = useState<string | null>(null)

  const updatePreview = useCallback(
    (clientX: number) => {
      if (!timelineRef.current || duration <= 0) return

      const rect = timelineRef.current.getBoundingClientRect()
      const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width))
      const percentage = offsetX / rect.width
      const time = Math.max(0, Math.min(percentage * duration, duration))

      setPreviewTime(time)
      setPreviewX(offsetX)
      setPreviewPercentage(percentage)

      // Find best matching thumbnail image if available
      if (thumbnails && thumbnails.length > 0) {
        let bestMatch = thumbnails[0].imageUrl
        for (const thumb of thumbnails) {
          if (thumb.time <= time) {
            bestMatch = thumb.imageUrl
          } else {
            break
          }
        }
        setActiveThumbnailUrl(bestMatch)
      } else {
        setActiveThumbnailUrl(null)
      }
    },
    [timelineRef, duration, thumbnails]
  )

  const clearPreview = useCallback(() => {
    setPreviewTime(null)
    setActiveThumbnailUrl(null)
  }, [])

  return {
    previewTime,
    previewX,
    previewPercentage,
    activeThumbnailUrl,
    updatePreview,
    clearPreview,
  }
}

