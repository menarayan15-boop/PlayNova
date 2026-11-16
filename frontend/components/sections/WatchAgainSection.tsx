"use client"

import React, { useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuthStore } from "@/stores/useAuthStore"
import { useProgressStore } from "@/stores/useProgressStore"
import { formatTime } from "@/utils/time"

export default function WatchAgainSection() {
  const { isAuthenticated } = useAuthStore()
  const {
    completedVideos,
    fetchCompletedVideos,
    removeFromContinueWatching,
  } = useProgressStore()

  useEffect(() => {
    if (isAuthenticated) {
      fetchCompletedVideos()
    }
  }, [isAuthenticated, fetchCompletedVideos])

  if (!isAuthenticated || completedVideos.length === 0) {
    return null
  }

  return (
    <section className="relative w-full py-12 px-4 sm:px-6 lg:px-8 bg-[#f5f4ee] border-b border-[#10292d]/10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10292d]" />
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#10292d] tracking-tight">
              Watch Again
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#8c7b33]/20 text-[#8c7b33] font-semibold border border-[#8c7b33]/30">
              Completed
            </span>
          </div>

          <Link
            href="/history?status=completed"
            className="text-xs sm:text-sm font-semibold text-[#8c7b33] hover:text-[#736429] flex items-center gap-1 transition-colors"
          >
            All Completed
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Grid of Completed Videos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {completedVideos.map(({ progress, video }) => {
            const title = video?.title || progress.videoId
            const poster =
              video?.thumbnailUrl ||
              "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"
            const category = video?.category || "Streaming"

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

                  {/* Completed checkmark badge */}
                  <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600/90 text-white backdrop-blur-sm">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Watched
                  </span>

                  {/* Remove Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      removeFromContinueWatching(progress.videoId)
                    }}
                    title="Remove from history"
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-white/70 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                    aria-label={`Remove ${title} from history`}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Replay Button */}
                  <a
                    href="#hero-player"
                    onClick={() => {
                      const el = document.getElementById("hero-player")
                      if (el) el.scrollIntoView({ behavior: "smooth" })
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                    aria-label={`Replay ${title}`}
                  >
                    <div className="w-12 h-12 rounded-full bg-[#8c7b33]/90 group-hover:bg-[#8c7b33] text-white flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-all">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M1 4v6h6" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                    </div>
                  </a>
                </div>

                {/* Content info */}
                <div className="p-3.5">
                  <h3 className="font-semibold text-sm text-[#eef2ec] line-clamp-1 group-hover:text-[#cdc8f6] transition-colors">
                    {title}
                  </h3>

                  <div className="flex items-center justify-between text-xs text-[#93aaa6] mt-2 font-mono">
                    <span>Duration: {formatTime(progress.durationSeconds)}</span>
                    <span className="text-[#8c7b33] font-semibold">100% Watched</span>
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

