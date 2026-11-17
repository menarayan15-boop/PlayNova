"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import VideoCard from "@/components/ui/VideoCard"
import { getTrendingVideosApi } from "@/services/videoApi"
import { VideoItem } from "@/types"

export default function TrendingSection() {
  const [trending, setTrending] = useState<VideoItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function loadTrending() {
      setIsLoading(true)
      try {
        const items = await getTrendingVideosApi(4)
        if (isMounted) setTrending(items)
      } catch (err) {
        if (isMounted) setTrending([])
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    loadTrending()

    return () => {
      isMounted = false
    }
  }, [])

  if (!isLoading && trending.length === 0) {
    return null
  }

  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-[#f5f4ee] border-b border-[#e2e0d6]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#8c7b33] animate-ping" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#8c7b33]">
                Top Velocity
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#10292d]">
              Trending on PlayNova
            </h2>
            <p className="text-xs sm:text-sm text-[#66726f] mt-1">
              The highest-volume streams and widely bookmarked videos across the network.
            </p>
          </div>

          <Link
            href="/explore?sort=views"
            className="text-xs sm:text-sm font-semibold text-[#8c7b33] hover:text-[#706227] inline-flex items-center gap-1 transition-colors"
          >
            View Most Watched
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
            {trending.map((video) => (
              <VideoCard
                key={`trend-${video.id}`}
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

