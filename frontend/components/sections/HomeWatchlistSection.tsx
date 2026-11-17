"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import VideoCard from "@/components/ui/VideoCard"
import { useWatchlistStore } from "@/stores/useWatchlistStore"
import { useAuthStore } from "@/stores/useAuthStore"

export default function HomeWatchlistSection() {
  const { items, fetchWatchlist, hasLoaded } = useWatchlistStore()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated && !hasLoaded) {
      fetchWatchlist()
    }
  }, [isAuthenticated, hasLoaded, fetchWatchlist])

  if (!isAuthenticated || items.length === 0) {
    return null
  }

  // Preview up to 4 items on home page
  const previewItems = items.slice(0, 4)

  return (
    <section className="relative w-full py-16 px-4 sm:px-6 lg:px-8 bg-[#f5f4ee] border-b border-[#e2e0d6]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#8c7b33]">
                Your Library
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#10292d]">
              Saved in Your Watchlist
            </h2>
            <p className="text-xs sm:text-sm text-[#66726f] mt-1">
              Videos you bookmarked to enjoy whenever you are ready.
            </p>
          </div>

          <Link
            href="/watchlist"
            className="text-xs sm:text-sm font-semibold text-[#8c7b33] hover:text-[#706227] inline-flex items-center gap-1 transition-colors"
          >
            View Full Watchlist ({items.length})
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {previewItems.map((entry) => (
            <VideoCard
              key={`home-wl-${entry.videoId}`}
              video={entry.video}
              showWatchlistButton={true}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
