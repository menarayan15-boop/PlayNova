"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import VideoCard from "@/components/ui/VideoCard"
import { getHomepageFeedApi, HomepageFeedResponse } from "@/services/videoApi"
import { getYouTubeHomepageApi, YouTubeHomepageResponse } from "@/services/youtubeApi"
import { VideoItem } from "@/types"
import { useAuthStore } from "@/stores/useAuthStore"

const DISMISSED_STORAGE_KEY = "playnova_dismissed_recs"

export default function DynamicHomepageSections() {
  const { isAuthenticated } = useAuthStore()
  const visitSeedRef = React.useRef<string>(`visit_${Date.now().toString(36)}`)
  const [feed, setFeed] = useState<HomepageFeedResponse | null>(null)
  const [ytFeed, setYtFeed] = useState<YouTubeHomepageResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissedIds, setDismissedIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DISMISSED_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setDismissedIds(parsed)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  const loadFeed = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [data, ytData] = await Promise.all([
        getHomepageFeedApi(visitSeedRef.current),
        getYouTubeHomepageApi(),
      ])
      if (data) setFeed(data)
      if (ytData) setYtFeed(ytData)
      if (!data && !ytData?.configured) {
        setError("Unable to load the video catalog right now.")
      }
    } catch {
      setError("Network error while loading PlayNova catalog.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadFeed()
  }, [isAuthenticated])

  const handleDismiss = (videoId: string) => {
    setDismissedIds((prev) => {
      const next = Array.from(new Set([...prev, videoId]))
      try {
        localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const handleResetDismissed = () => {
    setDismissedIds([])
    try {
      localStorage.removeItem(DISMISSED_STORAGE_KEY)
    } catch {}
  }

  const filteredRecommended = useMemo(
    () => (feed?.recommended || []).filter((v) => !dismissedIds.includes(v.id)),
    [feed, dismissedIds]
  )

  const renderRow = (
    keyPrefix: string,
    eyebrow: string,
    title: string,
    subtitle: string,
    videos: VideoItem[],
    viewAllHref: string,
    viewAllLabel: string,
    allowDismiss = false
  ) => {
    if (!videos || videos.length === 0) return null
    return (
      <section
        key={keyPrefix}
        className="relative w-full py-14 px-4 sm:px-6 lg:px-8 bg-[#f5f4ee] border-b border-[#e2e0d6]"
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c7b33]">
                  {eyebrow}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#10292d]">
                {title}
              </h2>
              <p className="text-xs sm:text-sm text-[#66726f] mt-1">{subtitle}</p>
            </div>

            <div className="flex items-center gap-4">
              {allowDismiss && dismissedIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetDismissed}
                  className="text-xs text-[#66726f] hover:text-[#10292d] underline underline-offset-2"
                >
                  Reset hidden ({dismissedIds.length})
                </button>
              )}
              <Link
                href={viewAllHref}
                className="text-xs sm:text-sm font-semibold text-[#8c7b33] hover:text-[#706227] inline-flex items-center gap-1 transition-colors shrink-0"
              >
                {viewAllLabel}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {videos.map((video) => (
              <div key={`${keyPrefix}-${video.id}`} className="relative group/rec">
                <VideoCard video={video} showWatchlistButton={true} />
                {allowDismiss && (
                  <button
                    type="button"
                    onClick={() => handleDismiss(video.id)}
                    title="Not interested"
                    aria-label={`Hide ${video.title} from recommendations`}
                    className="absolute top-2.5 left-2.5 z-20 opacity-0 group-hover/rec:opacity-100 focus:opacity-100 transition-opacity px-2 py-1 rounded-full bg-[#0c2f35]/85 backdrop-blur-sm text-[10px] font-medium text-[#eef2ec] hover:bg-[#0c2f35] border border-white/15"
                  >
                    Hide
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-[#f5f4ee] border-b border-[#e2e0d6]">
        <div className="max-w-7xl mx-auto flex flex-col gap-12">
          {Array.from({ length: 3 }).map((_, rowIdx) => (
            <div key={rowIdx} className="flex flex-col gap-5">
              <div className="h-7 w-52 rounded-lg bg-black/5 animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((__, i) => (
                  <div key={i} className="h-64 rounded-2xl bg-black/5 animate-pulse" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error || (!feed && !ytFeed?.configured)) {
    return (
      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 bg-[#f5f4ee] border-b border-[#e2e0d6]">
        <div className="max-w-xl mx-auto text-center p-8 rounded-3xl bg-white border border-[#e2e0d6]">
          <p className="text-sm text-[#66726f] mb-4">{error || "No videos available."}</p>
          <button
            type="button"
            onClick={loadFeed}
            className="px-5 py-2 rounded-full text-xs font-semibold bg-[#0f3238] text-white hover:bg-[#10292d]"
          >
            Retry Loading Catalog
          </button>
        </div>
      </section>
    )
  }

  return (
    <div id="showcase">
      {/* Live Discovery Sections (automatically rendered when catalog API is configured) */}
      {ytFeed?.configured && (
        <>
          {renderRow(
            "yt-trending",
            "Live Discovery · Popular",
            "Trending Worldwide",
            "Freshly curated trending videos across PlayNova.",
            ytFeed.trending,
            "/explore?source=youtube&sort=views",
            "Explore Trending"
          )}

          {renderRow(
            "yt-latest",
            "Live Discovery · New",
            "Latest Uploads",
            "Freshly published creator uploads across PlayNova categories.",
            ytFeed.latestUploads,
            "/explore?source=youtube&sort=recent",
            "See Latest Uploads"
          )}

          {/* Short Videos Vertical Preview Strip */}
          {ytFeed.shortVideos && ytFeed.shortVideos.length > 0 && (
            <section className="relative w-full py-14 px-4 sm:px-6 lg:px-8 bg-[#f5f4ee] border-b border-[#e2e0d6]">
              <div className="max-w-7xl mx-auto">
                <div className="flex items-end justify-between gap-4 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
                      <span className="text-[11px] font-mono uppercase tracking-wider text-[#8c7b33]">
                        Vertical Discovery
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#10292d]">
                      Short Videos
                    </h2>
                  </div>
                  <Link
                    href="/shorts"
                    className="text-xs sm:text-sm font-semibold text-[#8c7b33] hover:underline"
                  >
                    Open Short Videos Feed &rarr;
                  </Link>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  {ytFeed.shortVideos.map((vid) => (
                    <Link
                      key={`short-${vid.id}`}
                      href={`/watch?id=${encodeURIComponent(vid.id)}`}
                      className="group relative aspect-[9/16] rounded-2xl overflow-hidden bg-[#0c2f35] border border-[#e2e0d6] shadow-sm hover:shadow-lg transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={vid.thumbnailUrl}
                        alt={vid.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {/* Neutral PlayNova Play Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                        <span className="w-11 h-11 rounded-full bg-[#8c7b33] text-[#f5f4ee] flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform duration-300">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-3 flex flex-col justify-end">
                        <p className="text-xs font-medium text-white line-clamp-2 leading-snug">
                          {vid.title}
                        </p>
                        {vid.channelTitle && (
                          <p className="text-[10px] font-mono text-[#cdc8f6] truncate mt-1">
                            {vid.channelTitle}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Live Category Rows: Gaming, Music, Entertainment, Technology */}
          {ytFeed.categoryRows.map((row) =>
            renderRow(
              `yt-cat-${row.category}`,
              `PlayNova · ${row.category}`,
              row.category,
              `Freshly curated ${row.category} creator videos ready to stream.`,
              row.items,
              `/explore?source=youtube&category=${encodeURIComponent(row.category)}`,
              `Explore ${row.category}`
            )
          )}
        </>
      )}

      {/* Native PlayNova MongoDB Catalog Sections */}
      {feed && (
        <>
          {/* 1. Featured Videos */}
          {renderRow(
            "featured",
            "Editor's Spotlight",
            "Featured Videos",
            `Hand-verified highlights from PlayNova's ${feed.stats.totalPublished}-video library.`,
            feed.featured,
            "/explore?sort=relevant",
            "Explore Full Library"
          )}

          {/* 2. Trending Now */}
          {renderRow(
            "trending",
            "Top Velocity",
            "Trending Now",
            "Most watched and actively bookmarked streams — zero overlap with featured picks.",
            feed.trending,
            "/explore?sort=views",
            "View Most Watched"
          )}

          {/* 3. Recently Added */}
          {renderRow(
            "recent",
            "Fresh Releases",
            "Recently Added",
            "Newly verified public-domain and open-license additions to the PlayNova catalog.",
            feed.recentlyAdded,
            "/explore?sort=recent",
            "See All New Releases"
          )}

          {/* 4. Recommended for You */}
          {renderRow(
            "recommended",
            isAuthenticated ? "AI Tailored Discovery" : "Diverse Discovery",
            "Recommended for You",
            isAuthenticated
              ? "Category-diverse picks tailored to your watch history while excluding completed videos."
              : "A balanced mix of standout videos across Science, Space, Technology, Nature, and Education.",
            filteredRecommended,
            "/explore",
            "Discover More",
            true
          )}

          {/* 5. Category Rows (Technology, Science, Space, Nature, Education, Documentaries, Entertainment) */}
          {feed.categoryRows.map((row) =>
            renderRow(
              `cat-${row.category}`,
              `${row.category} Channel`,
              row.category,
              `${row.totalInCategory} unique verified videos available in ${row.category}.`,
              row.items,
              `/explore?category=${encodeURIComponent(row.category)}`,
              `View All ${row.category} (${row.totalInCategory})`
            )
          )}
        </>
      )}
    </div>
  )
}

