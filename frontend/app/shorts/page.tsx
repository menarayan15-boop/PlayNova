"use client"

import React, { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import YouTubePlayer from "@/components/player/YouTubePlayer"
import { getYouTubeShortsApi } from "@/services/youtubeApi"
import { searchVideosApi } from "@/services/videoApi"
import { VideoItem } from "@/types"
import { useWatchlistStore } from "@/stores/useWatchlistStore"

export default function ShortVideosPage() {
  const [items, setItems] = useState<VideoItem[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [nextPageToken, setNextPageToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isYouTubeFeed, setIsYouTubeFeed] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const { isInWatchlist, toggleWatchlist } = useWatchlistStore()

  const loadShorts = useCallback(async (pageToken?: string, append = false) => {
    if (!append) setIsLoading(true)
    const ytRes = await getYouTubeShortsApi(pageToken, 12)

    if (ytRes.ok && ytRes.items.length > 0) {
      setIsYouTubeFeed(true)
      setNotice(null)
      setNextPageToken(ytRes.nextPageToken)
      setItems((prev) => {
        if (!append) return ytRes.items
        const seen = new Set(prev.map((v) => v.id))
        return [...prev, ...ytRes.items.filter((v) => !seen.has(v.id))]
      })
      setIsLoading(false)
      return
    }

    // Graceful fallback to short-duration verified videos from PlayNova's own MongoDB library
    if (!append) {
      setIsYouTubeFeed(false)
      setNotice(
        ytRes.code === "YOUTUBE_API_KEY_MISSING"
          ? "YouTube Data API v3 (YOUTUBE_API_KEY) is not configured yet. Showing short-duration verified videos from PlayNova's library."
          : ytRes.message || "Showing short-duration videos from PlayNova's library."
      )
      const nativeRes = await searchVideosApi({ duration: "short", limit: 20, sort: "recent" })
      setItems(nativeRes.items || [])
      setNextPageToken(null)
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadShorts()
  }, [loadShorts])

  const activeVideo = items[activeIndex] || null

  const goPrev = useCallback(() => {
    setActiveIndex((idx) => Math.max(0, idx - 1))
  }, [])

  const goNext = useCallback(() => {
    setActiveIndex((idx) => {
      const next = Math.min(items.length - 1, idx + 1)
      if (next >= items.length - 2 && nextPageToken && isYouTubeFeed) {
        loadShorts(nextPageToken, true)
      }
      return next
    })
  }, [items.length, nextPageToken, isYouTubeFeed, loadShorts])

  // Keyboard navigation (ArrowUp / ArrowDown)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault()
        goNext()
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault()
        goPrev()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [goNext, goPrev])

  const activeYtId =
    activeVideo?.externalVideoId || (activeVideo?.id.startsWith("yt_") ? activeVideo.id.slice(3) : "")

  return (
    <div className="min-h-screen pt-20 pb-16 bg-[#f5f4ee]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c7b33]">
                Vertical Discovery · Single-Stream Focus
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#10292d]">
              Short Videos
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={goPrev}
              disabled={activeIndex <= 0}
              aria-label="Previous short video"
              className="px-4 py-2 rounded-full text-xs font-semibold bg-white border border-[#e2e0d6] text-[#10292d] hover:border-[#8c7b33] disabled:opacity-40"
            >
              &uarr; Previous
            </button>
            <span className="text-xs font-mono text-[#66726f] px-2">
              {items.length > 0 ? `${activeIndex + 1} / ${items.length}` : "0 / 0"}
            </span>
            <button
              type="button"
              onClick={goNext}
              disabled={activeIndex >= items.length - 1}
              aria-label="Next short video"
              className="px-4 py-2 rounded-full text-xs font-semibold bg-[#0f3238] text-white hover:bg-[#10292d] disabled:opacity-40"
            >
              Next &darr;
            </button>
          </div>
        </div>

        {notice && (
          <div className="p-3.5 rounded-2xl bg-[#fffdf7] border border-[#8c7b33]/40 text-xs text-[#66726f]">
            {notice}
          </div>
        )}

        {isLoading ? (
          <div className="mx-auto w-full max-w-sm aspect-[9/16] rounded-3xl bg-black/10 animate-pulse" />
        ) : !activeVideo ? (
          <div className="p-12 rounded-3xl bg-white border border-[#e2e0d6] text-center">
            <p className="text-sm text-[#66726f] mb-4">No short-duration videos are available right now.</p>
            <Link
              href="/explore"
              className="inline-flex px-5 py-2.5 rounded-full text-xs font-semibold bg-[#0f3238] text-white"
            >
              Explore Full Library
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Single Active Vertical Player Stage (strictly prevents simultaneous playback) */}
            <div className="lg:col-span-6 mx-auto w-full max-w-[400px]">
              {activeVideo.sourceType === "youtube" && activeYtId ? (
                <YouTubePlayer
                  key={activeVideo.id}
                  playnovaVideoId={activeVideo.id}
                  youtubeVideoId={activeYtId}
                  title={activeVideo.title}
                  channelTitle={activeVideo.channelTitle}
                  aspect="vertical"
                  autoPlay={false}
                  onEnded={goNext}
                />
              ) : (
                <div className="rounded-2xl overflow-hidden bg-black border border-[#e2e0d6] shadow-xl">
                  <video
                    key={activeVideo.id}
                    src={activeVideo.videoUrl}
                    poster={activeVideo.thumbnailUrl}
                    controls
                    playsInline
                    className="w-full aspect-[9/16] object-contain bg-black"
                    onEnded={goNext}
                  />
                </div>
              )}
            </div>

            {/* Metadata & Queue Sidebar */}
            <div className="lg:col-span-6 flex flex-col gap-5">
              <div className="p-6 rounded-3xl bg-white border border-[#e2e0d6] shadow-sm flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-mono uppercase bg-[#0c2f35] text-[#8c7b33]">
                    {activeVideo.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(activeVideo)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      isInWatchlist(activeVideo.id)
                        ? "bg-[#8c7b33] border-[#8c7b33] text-white"
                        : "bg-white border-[#e2e0d6] text-[#10292d]"
                    }`}
                  >
                    {isInWatchlist(activeVideo.id) ? "Saved to Watchlist" : "Save to Watchlist"}
                  </button>
                </div>

                <h2 className="text-xl font-semibold text-[#10292d]">{activeVideo.title}</h2>
                {activeVideo.channelTitle && (
                  <p className="text-xs font-mono text-[#8c7b33]">{activeVideo.channelTitle}</p>
                )}
                <p className="text-xs sm:text-sm text-[#66726f] leading-relaxed line-clamp-4">
                  {activeVideo.description}
                </p>

                <div className="flex items-center gap-3 pt-2 border-t border-[#e2e0d6]">
                  <Link
                    href={`/watch?id=${encodeURIComponent(activeVideo.id)}`}
                    className="text-xs font-semibold text-[#0f3238] hover:underline"
                  >
                    Open Full Watch Page &rarr;
                  </Link>
                  {activeYtId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${activeYtId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono text-[#8c7b33] hover:underline"
                    >
                      Watch on YouTube &#8599;
                    </a>
                  )}
                </div>
              </div>

              {/* Vertical Queue Cards */}
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#66726f]">
                  Up Next in Short Videos (Use &uarr; / &darr; keys)
                </span>
                {items.map((vid, idx) => (
                  <button
                    key={vid.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`flex items-center gap-3 p-2 rounded-2xl border text-left transition-all ${
                      idx === activeIndex
                        ? "bg-[#0c2f35] text-white border-[#0c2f35]"
                        : "bg-white text-[#10292d] border-[#e2e0d6] hover:border-[#8c7b33]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={vid.thumbnailUrl}
                      alt={vid.title}
                      className="w-16 h-12 rounded-xl object-cover bg-black/20 shrink-0"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">{vid.title}</p>
                      <p className={`text-[10px] font-mono ${idx === activeIndex ? "text-[#93aaa6]" : "text-[#66726f]"}`}>
                        {vid.channelTitle || vid.category} · {vid.duration}s
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

