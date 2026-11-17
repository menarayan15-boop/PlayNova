"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useWatchlistStore } from "@/stores/useWatchlistStore"
import { useAuthStore } from "@/stores/useAuthStore"
import VideoCard from "@/components/ui/VideoCard"

type WatchlistSort = "recent" | "alpha" | "duration"

export default function WatchlistPage() {
  const { items, isLoading, fetchWatchlist, removeItem } = useWatchlistStore()
  const { isAuthenticated, isInitialized } = useAuthStore()
  const [sortOrder, setSortOrder] = useState<WatchlistSort>("recent")

  useEffect(() => {
    fetchWatchlist()
  }, [fetchWatchlist])

  // Sorting
  const sortedItems = [...items].sort((a, b) => {
    if (sortOrder === "recent") {
      return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
    } else if (sortOrder === "alpha") {
      return a.video.title.localeCompare(b.video.title)
    } else if (sortOrder === "duration") {
      return b.video.duration - a.video.duration
    }
    return 0
  })

  return (
    <div className="pt-24 pb-24 bg-[#f5f4ee] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Editorial Header */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0c2f35] text-[#eef2ec] border border-white/10 shadow-xl flex flex-col gap-4 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#8c7b33]/20 blur-3xl pointer-events-none"
          />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#8c7b33]">
              Personal Library
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-[#ffffff]">
            Your Watchlist
          </h1>
          <p className="text-sm sm:text-base text-[#93aaa6] max-w-xl leading-relaxed">
            Curate videos to watch later. Synced across your sessions and saved permanently to your PlayNova account.
          </p>
        </div>

        {/* Not Authenticated State */}
        {isInitialized && !isAuthenticated && (
          <div className="p-10 rounded-3xl bg-white/70 border border-[#e2e0d6] text-center flex flex-col items-center justify-center max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-[#8c7b33]/15 text-[#8c7b33] flex items-center justify-center mb-4">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-medium text-[#10292d] mb-2">Sign in to save videos</h2>
            <p className="text-sm text-[#66726f] mb-6">
              Create an account or sign in to build your personalized watchlist and sync it across all your devices.
            </p>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#10292d] text-white hover:bg-[#16383e] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 rounded-full text-xs font-semibold bg-white border border-[#e2e0d6] text-[#10292d] hover:bg-black/5 transition-colors"
              >
                Create Account
              </Link>
            </div>
          </div>
        )}

        {/* Authenticated Watchlist View */}
        {(!isInitialized || isAuthenticated) && (
          <>
            {/* Toolbar: Counter & Sort */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white/70 backdrop-blur-md border border-[#e2e0d6]">
              <div className="text-sm text-[#66726f]">
                Saved: <span className="font-semibold text-[#10292d]">{items.length}</span> {items.length === 1 ? "video" : "videos"}
              </div>

              {items.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#66726f]">Sort by:</span>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value as WatchlistSort)}
                    className="bg-white border border-[#e2e0d6] rounded-xl px-3 py-1.5 text-xs text-[#10292d] font-medium focus:outline-none cursor-pointer"
                  >
                    <option value="recent">Recently Added</option>
                    <option value="alpha">Title (A-Z)</option>
                    <option value="duration">Longest Duration</option>
                  </select>
                </div>
              )}
            </div>

            {/* Loading skeletons */}
            {isLoading && items.length === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-black/5 animate-pulse" />
                ))}
              </div>
            )}

            {/* Video Cards Grid */}
            {!isLoading && items.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {sortedItems.map((entry) => (
                  <div key={entry.videoId} className="flex flex-col relative">
                    <VideoCard
                      video={entry.video}
                      showWatchlistButton={true}
                    />
                    <div className="mt-2 flex items-center justify-between px-1">
                      <span className="text-[11px] text-[#66726f]">
                        Added {new Date(entry.addedAt).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(entry.videoId)}
                        className="text-[11px] text-[#66726f] hover:text-red-700 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {!isLoading && items.length === 0 && (
              <div className="py-20 flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-white/50 border border-[#e2e0d6]">
                <div className="w-16 h-16 rounded-2xl bg-[#8c7b33]/15 text-[#8c7b33] flex items-center justify-center mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-[#10292d] mb-2">Your watchlist is currently empty</h3>
                <p className="text-sm text-[#66726f] max-w-md mb-6 leading-relaxed">
                  As you browse channels and streams, tap the bookmark icon on any video thumbnail to save it here for later.
                </p>
                <Link
                  href="/explore"
                  className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#10292d] text-white hover:bg-[#16383e] shadow-sm transition-all"
                >
                  Explore Catalog
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

