"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuthStore } from "@/stores/useAuthStore"
import { useProgressStore } from "@/stores/useProgressStore"
import { formatTime } from "@/utils/time"

export default function ContinueWatchingSection() {
  const { isAuthenticated } = useAuthStore()
  const {
    continueWatching,
    isLoadingContinue,
    fetchContinueWatching,
    removeFromContinueWatching,
  } = useProgressStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchContinueWatching()
    }
  }, [isAuthenticated, fetchContinueWatching])

  if (!isAuthenticated || (!isLoadingContinue && continueWatching.length === 0)) {
    return null
  }

  return (
    <section className="relative w-full py-12 px-4 sm:px-6 lg:px-8 bg-[#f5f4ee] border-b border-[#10292d]/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#8c7b33] animate-pulse" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#10292d] tracking-tight">
              Continue Watching
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#10292d]/10 text-[#10292d]/80 font-semibold">
              {continueWatching.length}
            </span>
          </div>

          <Link
            href="/history?status=unfinished"
            className="text-xs sm:text-sm font-semibold text-[#8c7b33] hover:text-[#736429] flex items-center gap-1 transition-colors"
          >
            View All History
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Carousel / Grid of In-Progress Videos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {continueWatching.map(({ progress, video }) => {
            const title = video?.title || progress.videoId
            const poster =
              video?.thumbnailUrl ||
              "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"
            const category = video?.category || "Streaming"
            const remaining = Math.max(0, progress.durationSeconds - progress.lastPositionSeconds)
            const remainingMinutes = Math.ceil(remaining / 60)

            return (
              <div
                key={progress.videoId}
                className="group relative rounded-2xl bg-[#0c2f35] text-[#f5f4ee] overflow-hidden border border-[#10292d]/20 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Thumbnail & Video Preview */}
                <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                  <Image
                    src={poster}
                    alt={title}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Category badge */}
                  <span className="absolute top-2.5 left-2.5 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 text-[#cdc8f6] border border-white/10 backdrop-blur-sm">
                    {category}
                  </span>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      removeFromContinueWatching(progress.videoId)
                    }}
                    title="Remove from Continue Watching"
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                    aria-label={`Remove ${title} from continue watching`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Floating Play Button */}
                  <a
                    href="#hero-player"
                    onClick={() => {
                      // Scroll to player and let user play
                      const el = document.getElementById("hero-player")
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth" })
                      }
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                    aria-label={`Resume watching ${title}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#8c7b33]/90 group-hover:bg-[#8c7b33] text-white flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-all">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </a>

                  {/* Remaining Time Tag */}
                  <div className="absolute bottom-2 right-2.5 text-[11px] font-mono text-white/90 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm">
                    {remainingMinutes}m left
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-black/40 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#8c7b33] to-[#cdc8f6] transition-all duration-300"
                    style={{ width: `${progress.completionPercentage}%` }}
                  />
                </div>

                {/* Content info */}
                <div className="p-3.5">
                  <h3 className="font-semibold text-sm text-[#eef2ec] line-clamp-1 group-hover:text-[#cdc8f6] transition-colors">
                    {title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-[#93aaa6] mt-2 font-mono">
                    <span>
                      {formatTime(progress.lastPositionSeconds)} / {formatTime(progress.durationSeconds)}
                    </span>
                    <span className="font-semibold text-[#8c7b33]">
                      {progress.completionPercentage}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
