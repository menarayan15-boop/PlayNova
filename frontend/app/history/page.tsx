"use client"

import React, { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuthStore } from "@/stores/useAuthStore"
import { useProgressStore } from "@/stores/useProgressStore"
import { formatTime } from "@/utils/time"

export default function HistoryPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuthStore()
  const {
    historyItems,
    historyPagination,
    isLoadingHistory,
    fetchHistory,
    deleteHistoryItem,
    clearAllHistory,
  } = useProgressStore()

  const [activeTab, setActiveTab] = useState<"all" | "unfinished" | "completed">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [showClearModal, setShowClearModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Load history whenever tab, search, or page changes
  useEffect(() => {
    if (!isAuthenticated) return

    const timer = setTimeout(() => {
      fetchHistory({
        page,
        limit: 12,
        status: activeTab,
        search: searchTerm,
      })
    }, 250)

    return () => clearTimeout(timer)
  }, [isAuthenticated, activeTab, searchTerm, page, fetchHistory])

  const handleDeleteItem = async (videoId: string) => {
    setIsDeleting(videoId)
    try {
      await deleteHistoryItem(videoId)
    } finally {
      setIsDeleting(null)
    }
  }

  const handleConfirmClear = async () => {
    await clearAllHistory()
    setShowClearModal(false)
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f4ee] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#8c7b33] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f5f4ee] pt-28 pb-16 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#0c2f35] text-[#f5f4ee] shadow-2xl border border-white/10 text-center">
          <div className="w-16 h-16 rounded-full bg-[#8c7b33]/20 border border-[#8c7b33]/40 flex items-center justify-center mx-auto mb-5 text-[#8c7b33]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-bold mb-2">Watch History</h2>
          <p className="text-sm text-[#93aaa6] mb-6 leading-relaxed">
            Sign in to track your playback progress, seamlessly resume streams across devices, and manage your watch history.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/login?redirect=/history"
              className="w-full py-3 rounded-full text-sm font-semibold bg-[#8c7b33] text-white hover:bg-[#a6923d] transition-all shadow-md active:scale-95 text-center"
            >
              Sign In to PlayNova
            </Link>
            <Link
              href="/register?redirect=/history"
              className="w-full py-3 rounded-full text-sm font-medium bg-white/10 text-white hover:bg-white/15 transition-all text-center"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f4ee] text-[#10292d] pt-28 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#10292d]/10 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#8c7b33] uppercase font-semibold mb-2">
              <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
              Playback Timeline
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#10292d] tracking-tight">
              Watch History
            </h1>
            <p className="text-sm text-[#10292d]/70 mt-1 max-w-xl">
              Review your stream coverage, resume unfinished titles, and manage your synchronized playback records.
            </p>
          </div>

          {historyItems.length > 0 && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowClearModal(true)}
                className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                Clear All History
              </button>
            </div>
          )}
        </div>

        {/* Filter Tabs and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center p-1 rounded-xl bg-[#10292d]/5 border border-[#10292d]/10">
            <button
              onClick={() => {
                setActiveTab("all")
                setPage(1)
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "all"
                  ? "bg-[#10292d] text-white shadow-sm"
                  : "text-[#10292d]/70 hover:text-[#10292d]"
              }`}
            >
              All Streams
            </button>
            <button
              onClick={() => {
                setActiveTab("unfinished")
                setPage(1)
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "unfinished"
                  ? "bg-[#10292d] text-white shadow-sm"
                  : "text-[#10292d]/70 hover:text-[#10292d]"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => {
                setActiveTab("completed")
                setPage(1)
              }}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                activeTab === "completed"
                  ? "bg-[#10292d] text-white shadow-sm"
                  : "text-[#10292d]/70 hover:text-[#10292d]"
              }`}
            >
              Completed
            </button>
          </div>

          {/* Search bar */}
          <div className="relative sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              placeholder="Search history..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs sm:text-sm bg-white border border-[#10292d]/15 text-[#10292d] placeholder-[#10292d]/40 focus:outline-none focus:ring-2 focus:ring-[#8c7b33]"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#10292d]/40"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#10292d]/40 hover:text-[#10292d]"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Loading state */}
        {isLoadingHistory ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, idx) => (
              <div key={idx} className="rounded-2xl bg-white/60 p-4 border border-[#10292d]/10 animate-pulse">
                <div className="aspect-video bg-black/10 rounded-xl mb-3" />
                <div className="h-4 bg-black/10 rounded w-3/4 mb-2" />
                <div className="h-3 bg-black/10 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : historyItems.length === 0 ? (
          /* Empty state */
          <div className="py-20 text-center rounded-3xl bg-white/60 border border-[#10292d]/10 max-w-2xl mx-auto p-8">
            <div className="w-16 h-16 rounded-full bg-[#10292d]/5 border border-[#10292d]/10 flex items-center justify-center mx-auto mb-4 text-[#8c7b33]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="text-xl font-serif font-bold text-[#10292d] mb-1">
              {searchTerm ? "No matching history found" : "No watch history yet"}
            </h3>
            <p className="text-sm text-[#10292d]/70 mb-6 max-w-sm mx-auto">
              {searchTerm
                ? `No streams in your history match "${searchTerm}". Try a different keyword.`
                : "Watch videos on PlayNova and your progress will automatically sync here."}
            </p>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-xs sm:text-sm font-semibold bg-[#10292d] text-white hover:bg-[#1a3e44] transition-all"
            >
              Explore Video Library
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        ) : (
          /* Grid of History Items */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {historyItems.map(({ progress, video }) => {
              const title = video?.title || progress.videoId
              const poster =
                video?.thumbnailUrl ||
                "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80"
              const category = video?.category || "Streaming"
              const isComp = progress.isCompleted || progress.completionPercentage >= 90
              const dateStr = new Date(progress.lastWatchedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })

              return (
                <div
                  key={progress.videoId}
                  className="group rounded-2xl bg-[#0c2f35] text-[#f5f4ee] overflow-hidden border border-[#10292d]/20 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Thumbnail area */}
                  <div className="relative aspect-video w-full overflow-hidden bg-black/40">
                    <Image
                      src={poster}
                      alt={title}
                      fill
                      sizes="(max-width: 768px) 100vw, 300px"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Category tag */}
                    <span className="absolute top-2.5 left-2.5 text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/60 text-[#cdc8f6] border border-white/10 backdrop-blur-sm">
                      {category}
                    </span>

                    {/* Status badge */}
                    {isComp ? (
                      <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-600/90 text-white backdrop-blur-sm">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Completed
                      </span>
                    ) : (
                      <span className="absolute bottom-2.5 left-2.5 text-[11px] font-mono text-white/90 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm">
                        {progress.completionPercentage}% watched
                      </span>
                    )}

                    {/* Single Item Deletion Button */}
                    <button
                      onClick={() => handleDeleteItem(progress.videoId)}
                      disabled={isDeleting === progress.videoId}
                      title="Remove from history"
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-900/80 text-white/70 hover:text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-sm active:scale-90"
                      aria-label={`Remove ${title} from history`}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>

                    {/* Play / Resume Overlay Button */}
                    <Link
                      href={`/watch?id=${progress.videoId}`}
                      className="absolute inset-0 flex items-center justify-center"
                      aria-label={`Watch ${title}`}
                    >
                      <div className="w-12 h-12 rounded-full bg-[#8c7b33]/90 group-hover:bg-[#8c7b33] text-white flex items-center justify-center shadow-lg group-hover:scale-110 active:scale-95 transition-all">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </Link>
                  </div>

                  {/* Progress track */}
                  <div className="w-full h-1.5 bg-black/40 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#8c7b33] to-[#cdc8f6] transition-all duration-300"
                      style={{ width: `${progress.completionPercentage}%` }}
                    />
                  </div>

                  {/* Card description */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-sm text-[#eef2ec] line-clamp-1 group-hover:text-[#cdc8f6] transition-colors">
                        {title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-[#93aaa6] mt-2 font-mono">
                        <span>{dateStr}</span>
                        <span>
                          {formatTime(progress.lastPositionSeconds)} / {formatTime(progress.durationSeconds)}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                      <Link
                        href={`/watch?id=${progress.videoId}`}
                        className="text-xs font-semibold text-[#8c7b33] hover:text-[#a6923d] flex items-center gap-1"
                      >
                        {isComp ? "Watch Again" : "Resume"}
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </Link>

                      <button
                        onClick={() => handleDeleteItem(progress.videoId)}
                        className="text-xs text-[#93aaa6] hover:text-rose-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {historyPagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-[#10292d]/15 text-[#10292d] hover:bg-[#10292d]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Previous
            </button>

            <span className="px-3 py-2 text-xs sm:text-sm font-mono text-[#10292d]/70">
              Page {historyPagination.page} of {historyPagination.totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(historyPagination.totalPages, p + 1))}
              disabled={page >= historyPagination.totalPages}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-[#10292d]/15 text-[#10292d] hover:bg-[#10292d]/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Clearing History */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="max-w-md w-full p-6 rounded-2xl bg-[#0c2f35] text-[#f5f4ee] border border-white/10 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </div>
            <h3 className="text-lg font-serif font-bold text-[#f5f4ee] mb-2">
              Clear all watch history?
            </h3>
            <p className="text-xs sm:text-sm text-[#93aaa6] mb-6 leading-relaxed">
              This will permanently delete all your playback progress, continue watching items, and completed stream records across all devices. This action cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowClearModal(false)}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium bg-white/10 text-white hover:bg-white/15 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-md active:scale-95"
              >
                Clear Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

