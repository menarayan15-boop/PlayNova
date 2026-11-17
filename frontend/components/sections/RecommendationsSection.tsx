"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import VideoCard from "@/components/ui/VideoCard"
import { getRecommendationsApi } from "@/services/videoApi"
import { VideoItem } from "@/types"
import { useAuthStore } from "@/stores/useAuthStore"

export default function RecommendationsSection() {
  const { isAuthenticated } = useAuthStore()
  const [recommendations, setRecommendations] = useState<VideoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadRecs() {
      setIsLoading(true)
      try {
        const items = await getRecommendationsApi({ limit: 4 })
        if (isMounted) {
          setRecommendations(items)
        }
      } catch (err) {
        if (isMounted) setRecommendations([])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadRecs()

    return () => {
      isMounted = false
    }
  }, [isAuthenticated])

  if (!isLoading && recommendations.length === 0) {
    return null
  }

  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-[#f5f4ee] border-b border-[#e2e0d6]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#8c7b33]">
                {isAuthenticated ? "Tailored Discovery" : "Curated Picks"}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#10292d]">
              Recommended for You
            </h2>
            <p className="text-xs sm:text-sm text-[#66726f] mt-1">
              {isAuthenticated
                ? "Scored dynamically across your watched categories, tags, and viewing duration."
                : "Top curated masterpieces favored by the PlayNova streaming community."}
            </p>
          </div>

          <Link
            href="/explore"
            className="text-xs sm:text-sm font-semibold text-[#8c7b33] hover:text-[#706227] inline-flex items-center gap-1 transition-colors"
          >
            Explore Full Library
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Loading skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-black/5 animate-pulse" />
            ))}
          </div>
        )}

        {/* Cards Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((video) => (
              <VideoCard
                key={`rec-${video.id}`}
                video={video}
                showWatchlistButton={true}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
