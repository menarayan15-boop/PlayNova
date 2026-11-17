"use client"

import React from "react"
import Link from "next/link"
import VideoPlayer from "./VideoPlayer"
import VideoPlayerErrorBoundary from "./VideoPlayerErrorBoundary"
import { VideoItem } from "@/types"
import { usePlayerStore } from "@/stores/usePlayerStore"
import { useWatchlistStore } from "@/stores/useWatchlistStore"

interface WatchPageClientProps {
  activeVideo: VideoItem
  relatedVideos: VideoItem[]
}

export default function WatchPageClient({
  activeVideo,
  relatedVideos,
}: WatchPageClientProps) {
  const { isTheaterMode } = usePlayerStore()
  const { isInWatchlist, toggleWatchlist } = useWatchlistStore()
  const isSaved = isInWatchlist(activeVideo.id)

  const nextVideo = relatedVideos[0]
  const handleNextVideo = () => {
    if (nextVideo && typeof window !== "undefined") {
      window.location.href = `/watch?id=${nextVideo.id}`
    }
  }

  return (
    <div className="pt-20 pb-20 bg-[#f5f4ee] min-h-screen transition-all duration-300">
      {/* Theater Mode Top Banner */}
      {isTheaterMode ? (
        <div className="w-full bg-[#071316] py-4 mb-8 border-b border-white/10 shadow-inner">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <VideoPlayerErrorBoundary fallbackTitle={activeVideo.title}>
              <VideoPlayer
                id="watch-player"
                src={activeVideo.videoUrl}
                title={activeVideo.title}
                poster={activeVideo.thumbnailUrl}
                subtitles={activeVideo.subtitles}
                thumbnails={activeVideo.previewThumbnails}
                nextVideo={nextVideo}
                onNextVideo={handleNextVideo}
                autoPlay={false}
              />
            </VideoPlayerErrorBoundary>
          </div>
        </div>
      ) : null}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs font-mono text-[#66726f] mb-6">
          <Link href="/" className="hover:text-[#10292d]">
            Home
          </Link>
          <span>/</span>
          <Link href="/explore" className="hover:text-[#10292d]">
            Explore
          </Link>
          <span>/</span>
          <span className="text-[#8c7b33] font-semibold truncate max-w-xs sm:max-w-md">
            {activeVideo.title}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Column */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* If NOT theater mode, player renders here in standard 2/3 column */}
            {!isTheaterMode && (
              <div className="rounded-2xl overflow-hidden bg-black shadow-2xl border border-[#e2e0d6]/60">
                <VideoPlayerErrorBoundary fallbackTitle={activeVideo.title}>
                  <VideoPlayer
                    id="watch-player"
                    src={activeVideo.videoUrl}
                    title={activeVideo.title}
                    poster={activeVideo.thumbnailUrl}
                    subtitles={activeVideo.subtitles}
                    thumbnails={activeVideo.previewThumbnails}
                    nextVideo={nextVideo}
                    onNextVideo={handleNextVideo}
                    autoPlay={false}
                  />
                </VideoPlayerErrorBoundary>
              </div>
            )}

            {/* Video Metadata & Description */}
            <div className="p-6 sm:p-7 rounded-2xl bg-[#ffffff] border border-[#e2e0d6] shadow-sm flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-[#0c2f35] text-[#8c7b33]">
                    {activeVideo.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(activeVideo)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                      isSaved
                        ? "bg-[#8c7b33] border-[#8c7b33] text-white shadow-sm"
                        : "bg-white border-[#e2e0d6] text-[#10292d] hover:bg-black/5"
                    }`}
                  >
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill={isSaved ? "currentColor" : "none"}
                      stroke="currentColor"
                      strokeWidth="2.2"
                    >
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                    </svg>
                    <span>{isSaved ? "In Watchlist" : "Save to Watchlist"}</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-[#66726f]">
                  <span>{activeVideo.views.toLocaleString()} views</span>
                  <span>·</span>
                  <span className="text-[#2f7d57]">HTML5 Custom Engine</span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#10292d]">
                {activeVideo.title}
              </h1>

              <p className="text-sm sm:text-base text-[#66726f] leading-relaxed">
                {activeVideo.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-[#e2e0d6]">
                {activeVideo.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#f5f4ee] text-[#66726f] border border-[#e2e0d6]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar: Next & Related Videos */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e0d6]">
              <h3 className="font-semibold text-lg text-[#10292d]">
                Related Videos
              </h3>
              <span className="text-xs font-mono text-[#8c7b33]">
                {relatedVideos.length} Available
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {relatedVideos.map((video) => (
                <Link
                  key={video.id}
                  href={`/watch?id=${video.id}`}
                  className="group flex gap-3 p-2.5 rounded-xl bg-[#ffffff] hover:bg-[#eae7dc] border border-[#e2e0d6] transition-all hover:shadow-md"
                >
                  <div className="relative w-28 sm:w-32 aspect-video rounded-lg overflow-hidden bg-black flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={video.thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                      {Math.floor(video.duration / 60)}:
                      {(video.duration % 60).toString().padStart(2, "0")}
                    </span>
                  </div>

                  <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
                    <h4 className="text-xs font-medium text-[#10292d] line-clamp-2 group-hover:text-[#8c7b33] transition-colors leading-snug">
                      {video.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#66726f]">
                      <span>{video.category}</span>
                      <span>{(video.views / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

