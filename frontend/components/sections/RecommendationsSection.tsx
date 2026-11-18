"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import VideoCard from "@/components/ui/VideoCard"
import {
  getRecommendationShelvesApi,
  getRecommendationsApi,
  RecommendationShelvesResponse,
} from "@/services/videoApi"
import { VideoItem } from "@/types"
import { useAuthStore } from "@/stores/useAuthStore"

const DISMISSED_STORAGE_KEY = "playnova_dismissed_recs"

export default function RecommendationsSection() {
  const { isAuthenticated } = useAuthStore()
  const [shelves, setShelves] = useState<RecommendationShelvesResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  // Load dismissed IDs from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setDismissedIds(parsed)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadShelves() {
      setIsLoading(true)
      try {
        const data = await getRecommendationShelvesApi()
        if (isMounted && data) {
          setShelves(data)
        } else if (isMounted) {
          // Fallback to single recommendation row
          const fallbackItems = await getRecommendationsApi({ limit: 4 })
          setShelves({
            recommended: fallbackItems,
            becauseYouWatched: null,
            trendingInInterests: [],
            discoverNew: [],
          })
        }
      } catch {
        if (isMounted) setShelves(null)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadShelves()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  const handleDismiss = (videoId: string) => {
    setDismissedIds((prev) => {
      const next = Array.from(new Set([...prev, videoId]))
      try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const handleResetDismissed = () => {
    setDismissedIds([])
    try {
      localStorage.removeItem(DISMISSED_STORAGE_KEY)
    } catch {
      // ignore
    }
  }

  const filteredRecommended = useMemo(
    () => (shelves?.recommended || []).filter((v) => !dismissedIds.includes(v.id)),
    [shelves, dismissedIds]
  )

  const filteredBecause = useMemo(
    () => (shelves?.becauseYouWatched?.items || []).filter((v) => !dismissedIds.includes(v.id)),
    [shelves, dismissedIds]
  )

  const filteredTrendingInterests = useMemo(
    () => (shelves?.trendingInInterests || []).filter((v) => !dismissedIds.includes(v.id)),
    [shelves, dismissedIds]
  )

  const filteredDiscoverNew = useMemo(
    () => (shelves?.discoverNew || []).filter((v) => !dismissedIds.includes(v.id)),
    [shelves, dismissedIds]
  )

  if (
    !isLoading &&
    filteredRecommended.length === 0 &&
    filteredBecause.length === 0 &&
    filteredTrendingInterests.length === 0 &&
    filteredDiscoverNew.length === 0
  ) {
    return null
  }

  const renderShelf = (
    keyPrefix: string,
    eyebrow: string,
    title: string,
    subtitle: string,
    videos: VideoItem[],
    allowDismiss = false
  ) => {
    if (videos.length === 0) return null
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c7b33]">
                {eyebrow}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#10292d]">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-[#66726f] mt-1">{subtitle}</p>
          </div>

          <div className="flex items-center gap-4">
            {allowDismiss && dismissedIds.length > 0 && (
              <button
                type="button"
                onClick={handleResetDismissed}
                className="text-xs text-[#66726f] hover:text-[#10292d] underline underline-offset-2"
              >
                Reset hidden ({dismissedIds.length})
              </button>
            )}
            <Link
              href="/explore"
              className="text-xs sm:text-sm font-semibold text-[#8c7b33] hover:text-[#706227] inline-flex items-center gap-1 transition-colors"
            >
              Explore Library
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <div key={`${keyPrefix}-${video.id}`} className="relative group/rec">
              <VideoCard video={video} showWatchlistButton={true} />
              {allowDismiss && (
                <button
                  type="button"
                  onClick={() => handleDismiss(video.id)}
                  title="Not interested"
                  aria-label={`Dismiss ${video.title} from recommendations`}
                  className="absolute top-2.5 left-2.5 z-20 opacity-0 group-hover/rec:opacity-100 focus:opacity-100 transition-opacity px-2 py-1 rounded-full bg-[#0c2f35]/85 backdrop-blur-sm text-[10px] font-medium text-[#eef2ec] hover:bg-[#0c2f35] border border-white/15"
                >
                  Hide
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-[#f5f4ee] border-b border-[#e2e0d6]">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        {isLoading ? (
          <div className="flex flex-col gap-6">
            <div className="h-8 w-56 rounded-lg bg-black/5 animate-pulse" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-black/5 animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {renderShelf(
              "rec",
              isAuthenticated ? "AI Tailored Discovery" : "Curated Picks",
              "Recommended for You",
              isAuthenticated
                ? "Ranked dynamically across your watched categories, tags, completion rate, and recent sessions."
                : "Top curated streams favored by the PlayNova community.",
              filteredRecommended,
              true
            )}

            {shelves?.becauseYouWatched &&
              renderShelf(
                "byw",
                "Contextual Match",
                `Because You Watched "${shelves.becauseYouWatched.sourceVideo.title}"`,
                `Handpicked titles sharing themes in ${shelves.becauseYouWatched.sourceVideo.category} and related topics.`,
                filteredBecause,
                true
              )}

            {renderShelf(
              "trend-int",
              "High Affinity",
              "Trending in Your Interests",
              "Most-watched releases matching the subjects you engage with most.",
              filteredTrendingInterests,
              false
            )}

            {renderShelf(
              "discover",
              "Fresh Horizons",
              "Discover Something New",
              "Acclaimed documentaries and features outside your usual viewing categories.",
              filteredDiscoverNew,
              false
            )}
          </>
        )}
      </div>
    </section>
  )
}
