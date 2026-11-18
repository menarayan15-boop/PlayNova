"use client"

import React, { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import VideoPlayer from "./VideoPlayer"
import YouTubePlayer from "./YouTubePlayer"
import VideoPlayerErrorBoundary from "./VideoPlayerErrorBoundary"
import VideoCard from "@/components/ui/VideoCard"
import { VideoItem, SubtitleTrack } from "@/types"
import { usePlayerStore } from "@/stores/usePlayerStore"
import { useWatchlistStore } from "@/stores/useWatchlistStore"
import { useAuthStore } from "@/stores/useAuthStore"
import { getSimilarVideosApi } from "@/services/videoApi"
import { getYouTubeRelatedApi } from "@/services/youtubeApi"
import { recordAnalyticsEventApi } from "@/services/analyticsApi"

interface WatchPageClientProps {
  activeVideo: VideoItem
  relatedVideos: VideoItem[]
}

const DEFAULT_MULTILINGUAL_SUBTITLES: SubtitleTrack[] = [
  { id: "sub-en", label: "English", language: "en", src: "/captions/english.vtt" },
  { id: "sub-es", label: "Español", language: "es", src: "/captions/spanish.vtt" },
  { id: "sub-fr", label: "Français", language: "fr", src: "/captions/french.vtt" },
]

export default function WatchPageClient({
  activeVideo,
  relatedVideos,
}: WatchPageClientProps) {
  const { isTheaterMode, activeSubtitleTrack, setActiveSubtitleTrack } = usePlayerStore()
  const { isInWatchlist, toggleWatchlist, addToCollection, collections } = useWatchlistStore()
  const { user, isAuthenticated, updatePreferences } = useAuthStore()
  const [similarVideos, setSimilarVideos] = useState<VideoItem[]>([])
  const [selectedCollection, setSelectedCollection] = useState("Watch Later")
  const [savedToast, setSavedToast] = useState<string | null>(null)

  const isSaved = isInWatchlist(activeVideo.id)
  const isYouTube =
    activeVideo.sourceType === "youtube" ||
    Boolean(activeVideo.externalVideoId) ||
    activeVideo.id.startsWith("yt_")
  const ytExternalId =
    activeVideo.externalVideoId || (activeVideo.id.startsWith("yt_") ? activeVideo.id.slice(3) : "")

  const subtitleTracks = useMemo(() => {
    if (activeVideo.subtitles && activeVideo.subtitles.length >= 3) {
      return activeVideo.subtitles
    }
    const existing = activeVideo.subtitles || []
    const merged = [...existing]
    for (const def of DEFAULT_MULTILINGUAL_SUBTITLES) {
      if (!merged.some((t) => t.language === def.language)) {
        merged.push(def)
      }
    }
    return merged
  }, [activeVideo.subtitles])

  // Apply saved user subtitle preference on mount / video change
  useEffect(() => {
    if (user?.preferences?.preferredSubtitle !== undefined) {
      setActiveSubtitleTrack(user.preferences.preferredSubtitle)
    }
  }, [activeVideo.id, user?.preferences?.preferredSubtitle, setActiveSubtitleTrack])

  // Fetch Similar / Related Videos & emit deduplicated view event
  useEffect(() => {
    let mounted = true
    async function loadSimilar() {
      const items = isYouTube && ytExternalId
        ? await getYouTubeRelatedApi(ytExternalId)
        : await getSimilarVideosApi(activeVideo.id, 4)
      if (mounted) setSimilarVideos(items.filter((v) => v.id !== activeVideo.id).slice(0, 4))
    }
    loadSimilar()

    // Record privacy-aware view event (server deduplicates within 30m window)
    if (user?.preferences?.historyTrackingEnabled !== false) {
      recordAnalyticsEventApi({
        videoId: activeVideo.id,
        eventType: "view",
      })
    }

    return () => {
      mounted = false
    }
  }, [activeVideo.id, isYouTube, ytExternalId, user?.preferences?.historyTrackingEnabled])

  const handleSubtitleChange = async (lang: string | null) => {
    setActiveSubtitleTrack(lang)
    if (isAuthenticated) {
      try {
        await updatePreferences({ preferredSubtitle: lang })
      } catch {
        // non-blocking preference sync
      }
    }
  }

  const handleSaveToCollection = async (collectionName: string) => {
    setSelectedCollection(collectionName)
    await addToCollection(activeVideo, collectionName)
    setSavedToast(`Saved to ${collectionName}`)
    setTimeout(() => setSavedToast(null), 2200)
  }

  const nextVideo = relatedVideos[0]
  const handleNextVideo = () => {
    if (nextVideo && typeof window !== "undefined") {
      window.location.href = `/watch?id=${nextVideo.id}`
    }
  }

  const availableCollections = useMemo(
    () => Array.from(new Set(["Watch Later", "Favorites", ...collections])),
    [collections]
  )

  return (
    <div className="pt-20 pb-20 bg-[#f5f4ee] min-h-screen transition-all duration-300">
      {/* Theater Mode Top Banner */}
      {isTheaterMode ? (
        <div className="w-full bg-[#071316] py-4 mb-8 border-b border-white/10 shadow-inner">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
            <VideoPlayerErrorBoundary fallbackTitle={activeVideo.title}>
              {isYouTube && ytExternalId ? (
                <YouTubePlayer
                  playnovaVideoId={activeVideo.id}
                  youtubeVideoId={ytExternalId}
                  title={activeVideo.title}
                  channelTitle={activeVideo.channelTitle}
                  onEnded={handleNextVideo}
                />
              ) : (
                <VideoPlayer
                  id={activeVideo.id}
                  src={activeVideo.videoUrl}
                  title={activeVideo.title}
                  poster={activeVideo.thumbnailUrl}
                  subtitles={subtitleTracks}
                  thumbnails={activeVideo.previewThumbnails}
                  nextVideo={nextVideo}
                  onNextVideo={handleNextVideo}
                  autoPlay={false}
                  enableGlobalShortcuts={true}
                />
              )}
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
                  {isYouTube && ytExternalId ? (
                    <YouTubePlayer
                      playnovaVideoId={activeVideo.id}
                      youtubeVideoId={ytExternalId}
                      title={activeVideo.title}
                      channelTitle={activeVideo.channelTitle}
                      onEnded={handleNextVideo}
                    />
                  ) : (
                    <VideoPlayer
                      id="watch-player"
                      src={activeVideo.videoUrl}
                      title={activeVideo.title}
                      poster={activeVideo.thumbnailUrl}
                      subtitles={subtitleTracks}
                      thumbnails={activeVideo.previewThumbnails}
                      nextVideo={nextVideo}
                      onNextVideo={handleNextVideo}
                      autoPlay={false}
                    />
                  )}
                </VideoPlayerErrorBoundary>
              </div>
            )}

            {/* Video Metadata & Description */}
            <div className="p-6 sm:p-7 rounded-2xl bg-[#ffffff] border border-[#e2e0d6] shadow-sm flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-[#0c2f35] text-[#8c7b33]">
                    {activeVideo.category}
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleWatchlist(activeVideo, selectedCollection)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border transition-all ${isSaved
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
                    <span>{isSaved ? "In Watchlist" : "Save"}</span>
                  </button>

                  {isAuthenticated && (
                    <select
                      aria-label="Save video to collection"
                      value={selectedCollection}
                      onChange={(e) => handleSaveToCollection(e.target.value)}
                      className="px-2.5 py-1 rounded-full text-xs bg-[#f5f4ee] border border-[#e2e0d6] text-[#10292d] hover:border-[#8c7b33] focus:outline-none cursor-pointer"
                    >
                      {availableCollections.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>
                  )}

                  {savedToast && (
                    <span className="text-[11px] font-medium text-[#2f7d57]">{savedToast}</span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs font-mono text-[#66726f]">
                  <span>{activeVideo.views.toLocaleString()} views</span>
                  <span>·</span>
                  <span className="text-[#2f7d57]">
                    {isYouTube ? "Embedded Stream" : "PlayNova Player"}
                  </span>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#10292d]">
                {activeVideo.title}
              </h1>

              {/* Channel Attribution for YouTube sources */}
              {isYouTube && activeVideo.channelTitle && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#66726f]">
                  <span>
                    Channel: <strong className="text-[#10292d]">{activeVideo.channelTitle}</strong>
                  </span>
                  {ytExternalId && (
                    <a
                      href={`https://www.youtube.com/watch?v=${ytExternalId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-[#8c7b33] hover:underline"
                    >
                      Watch on YouTube &#8599;
                    </a>
                  )}
                </div>
              )}

              {/* Quick Multilingual Subtitles Bar (Native HTML5 Engine) */}
              {!isYouTube && (
                <div className="flex flex-wrap items-center gap-2 py-2.5 px-3.5 rounded-xl bg-[#f5f4ee]/80 border border-[#e2e0d6]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#66726f] mr-1 flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8c7b33" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M7 12h4M13 12h4M7 16h10" />
                    </svg>
                    Subtitles:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSubtitleChange(null)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${activeSubtitleTrack === null
                        ? "bg-[#0f3238] text-white"
                        : "bg-white text-[#66726f] border border-[#e2e0d6] hover:text-[#10292d]"
                      }`}
                  >
                    Off
                  </button>
                  {subtitleTracks.map((track) => (
                    <button
                      key={track.language}
                      type="button"
                      onClick={() => handleSubtitleChange(track.language)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${activeSubtitleTrack === track.language
                          ? "bg-[#8c7b33] text-white shadow-sm"
                          : "bg-white text-[#66726f] border border-[#e2e0d6] hover:text-[#10292d]"
                        }`}
                    >
                      {track.label}
                    </button>
                  ))}
                </div>
              )}

              <p className="text-sm sm:text-base text-[#66726f] leading-relaxed">
                {activeVideo.description}
              </p>

              {/* Source Attribution & License Metadata */}
              {(activeVideo.sourceAttribution || activeVideo.license) && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-[#66726f] bg-[#f5f4ee]/60 px-3.5 py-2 rounded-xl border border-[#e2e0d6]/80">
                  {activeVideo.sourceAttribution && (
                    <span>
                      Source: <strong className="text-[#10292d]">{activeVideo.sourceAttribution}</strong>
                    </span>
                  )}
                  {activeVideo.license && (
                    <span>
                      License: <strong className="text-[#2f7d57]">{activeVideo.license}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Tags */}
              <div className="flex flex-wrap gap-2 pt-3 border-t border-[#e2e0d6]">
                {activeVideo.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/explore?q=${encodeURIComponent(tag)}`}
                    className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#f5f4ee] text-[#66726f] border border-[#e2e0d6] hover:border-[#8c7b33] hover:text-[#10292d] transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </div>

            {/* Phase 9: Similar Videos Shelf */}
            {similarVideos.length > 0 && (
              <div className="pt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c7b33]">
                      Similar Content
                    </span>
                    <h2 className="text-xl font-medium text-[#10292d]">
                      More Like This
                    </h2>
                  </div>
                  <Link
                    href={`/explore?category=${encodeURIComponent(activeVideo.category)}`}
                    className="text-xs font-semibold text-[#8c7b33] hover:underline"
                  >
                    View all {activeVideo.category} &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {similarVideos.map((vid) => (
                    <VideoCard key={`sim-${vid.id}`} video={vid} showWatchlistButton={true} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar: Next & Related Videos */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#e2e0d6]">
              <h3 className="font-semibold text-lg text-[#10292d]">
                Up Next
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
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                      <span className="w-7 h-7 rounded-full bg-[#8c7b33] text-[#f5f4ee] flex items-center justify-center shadow">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </span>
                    </div>
                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/80 text-[10px] font-mono text-white">
                      {Math.floor(video.duration / 60)}:
                      {(video.duration % 60).toString().padStart(2, "0")}
                    </span>
                  </div>

                  <div className="flex flex-col justify-between min-w-0 flex-1 py-0.5">
                    <div>
                      <h4 className="text-xs font-medium text-[#10292d] line-clamp-2 group-hover:text-[#8c7b33] transition-colors leading-snug">
                        {video.title}
                      </h4>
                      {video.channelTitle && (
                        <p className="text-[10px] font-mono text-[#66726f] truncate mt-0.5">
                          {video.channelTitle}
                        </p>
                      )}
                    </div>
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
