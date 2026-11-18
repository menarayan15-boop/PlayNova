"use client"

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import SearchBar from "@/components/search/SearchBar"
import SearchFilterBar, { FilterState } from "@/components/search/SearchFilterBar"
import VideoCard from "@/components/ui/VideoCard"
import { searchVideosApi } from "@/services/videoApi"
import { getYouTubeStatusApi, searchYouTubeApi } from "@/services/youtubeApi"
import { VideoItem, VideoCategory } from "@/types"

const PAGE_SIZE = 12

function mapSortToYouTubeOrder(sort: FilterState["sort"]): "relevance" | "date" | "viewCount" {
  if (sort === "recent") return "date"
  if (sort === "views") return "viewCount"
  return "relevance"
}

function ExploreContent() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const initialQ = searchParams.get("q") || ""
  const initialCat = (searchParams.get("category") || searchParams.get("cat") || "All") as
    | "All"
    | VideoCategory
  const initialSort = (searchParams.get("sort") || "relevant") as FilterState["sort"]
  const initialSource = (searchParams.get("source") || "all") as FilterState["source"]

  const [query, setQuery] = useState(initialQ)
  const [filters, setFilters] = useState<FilterState>({
    category: initialCat,
    duration: "any",
    uploadDate: "any",
    sort: initialSort,
    source: initialSource,
  })

  const [youtubeConfigured, setYoutubeConfigured] = useState(false)
  const [ytNotice, setYtNotice] = useState<string | null>(null)
  const [items, setItems] = useState<VideoItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [ytNextPageToken, setYtNextPageToken] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const inFlightRef = useRef(false)
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)

  // Detect whether backend YOUTUBE_API_KEY is configured
  useEffect(() => {
    getYouTubeStatusApi().then((st) => {
      if (st) setYoutubeConfigured(Boolean(st.configured))
    })
  }, [])

  // Sync state if URL changes externally
  useEffect(() => {
    const q = searchParams.get("q") || ""
    const cat = (searchParams.get("category") || searchParams.get("cat") || "All") as
      | "All"
      | VideoCategory
    const sortParam = (searchParams.get("sort") || "relevant") as FilterState["sort"]
    const sourceParam = (searchParams.get("source") || "all") as FilterState["source"]
    setQuery(q)
    setFilters((prev) => ({
      ...prev,
      category: cat,
      sort: ["relevant", "recent", "views", "alpha"].includes(sortParam) ? sortParam : prev.sort,
      source: ["all", "youtube", "native"].includes(sourceParam) ? sourceParam : prev.source,
    }))
  }, [searchParams])

  const fetchPage = useCallback(
    async (pageToLoad: number, append: boolean, pageToken?: string | null) => {
      if (inFlightRef.current && append) return
      inFlightRef.current = true
      setErrorMsg(null)
      if (!append) setYtNotice(null)

      if (append) setIsLoadingMore(true)
      else setIsLoading(true)

      try {
        // Explicit YouTube mode OR All mode when YouTube is configured and query/YT-only category is selected
        const useYouTubeOnly = filters.source === "youtube"
        const useBoth = filters.source === "all" && youtubeConfigured

        if (useYouTubeOnly) {
          const ytRes = await searchYouTubeApi({
            query: query.trim() || undefined,
            category: filters.category !== "All" ? filters.category : undefined,
            uploadDate: filters.uploadDate,
            duration: filters.duration,
            order: mapSortToYouTubeOrder(filters.sort),
            pageToken: append ? pageToken || undefined : undefined,
            limit: PAGE_SIZE,
          })

          if (!ytRes.ok) {
            setYtNotice(
              ytRes.code === "YOUTUBE_API_KEY_MISSING"
                ? "YouTube Data API v3 key (YOUTUBE_API_KEY) is not configured on the backend yet. Switch Source to 'PlayNova Library' or add YOUTUBE_API_KEY in backend/.env."
                : ytRes.message || "YouTube search is currently unavailable."
            )
            if (!append) {
              setItems([])
              setTotal(0)
            }
            setHasMore(false)
            return
          }

          setYtNextPageToken(ytRes.nextPageToken)
          setHasMore(Boolean(ytRes.nextPageToken))
          setTotal(ytRes.totalResults)
          setPage(pageToLoad)

          if (append) {
            setItems((prev) => {
              const seen = new Set(prev.map((v) => v.id))
              return [...prev, ...ytRes.items.filter((v) => !seen.has(v.id))]
            })
          } else {
            setItems(ytRes.items)
          }
          return
        }

        // Native PlayNova MongoDB Library (+ optional YouTube merge when configured)
        const nativeDateRange =
          filters.uploadDate === "today" ? "week" : (filters.uploadDate as "week" | "month" | "year" | "any")

        const [nativeRes, ytRes] = await Promise.all([
          searchVideosApi({
            query: query.trim() || undefined,
            category: filters.category !== "All" ? filters.category : undefined,
            duration: filters.duration,
            dateRange: nativeDateRange,
            sort: filters.sort,
            page: pageToLoad,
            limit: PAGE_SIZE,
          }),
          useBoth && !append
            ? searchYouTubeApi({
                query: query.trim() || undefined,
                category: filters.category !== "All" ? filters.category : undefined,
                uploadDate: filters.uploadDate,
                duration: filters.duration,
                order: mapSortToYouTubeOrder(filters.sort),
                limit: 8,
              })
            : Promise.resolve(null),
        ])

        if (ytRes && !ytRes.ok && ytRes.code === "YOUTUBE_QUOTA_EXCEEDED") {
          setYtNotice(ytRes.message || "YouTube API quota limit reached; displaying PlayNova library results.")
        }

        const combinedNew = [
          ...(ytRes?.ok ? ytRes.items : []),
          ...(nativeRes.items || []),
        ]

        setTotal((nativeRes.total || 0) + (ytRes?.ok ? ytRes.items.length : 0))
        setPage(nativeRes.page)
        setTotalPages(nativeRes.totalPages)
        setYtNextPageToken(ytRes?.ok ? ytRes.nextPageToken : null)
        setHasMore(Boolean(nativeRes.hasMore ?? nativeRes.page < nativeRes.totalPages))

        if (append) {
          setItems((prev) => {
            const seen = new Set(prev.map((v) => v.id))
            return [...prev, ...combinedNew.filter((v) => !seen.has(v.id))]
          })
        } else {
          const seen = new Set<string>()
          setItems(
            combinedNew.filter((v) => {
              if (seen.has(v.id)) return false
              seen.add(v.id)
              return true
            })
          )
        }
      } catch (err) {
        console.error("Explore search failed:", err)
        setErrorMsg("Unable to load videos right now. Please try again.")
      } finally {
        inFlightRef.current = false
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    },
    [query, filters, youtubeConfigured]
  )

  useEffect(() => {
    fetchPage(1, false, null)
  }, [fetchPage])

  // Smooth infinite scroll sentinel
  useEffect(() => {
    if (!hasMore || isLoading || isLoadingMore) return
    const el = loadMoreTriggerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !inFlightRef.current && hasMore) {
          fetchPage(page + 1, true, ytNextPageToken)
        }
      },
      { rootMargin: "240px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoading, isLoadingMore, page, ytNextPageToken, fetchPage])

  const updateUrl = (qVal: string, catVal: string, sortVal: string, sourceVal: string) => {
    const params = new URLSearchParams()
    if (qVal) params.set("q", qVal)
    if (catVal && catVal !== "All") params.set("category", catVal)
    if (sortVal && sortVal !== "relevant") params.set("sort", sortVal)
    if (sourceVal && sourceVal !== "all") params.set("source", sourceVal)
    const qs = params.toString()
    router.replace(qs ? `/explore?${qs}` : "/explore")
  }

  const handleSearchSubmit = (newQuery: string) => {
    setQuery(newQuery)
    updateUrl(newQuery, filters.category, filters.sort, filters.source)
  }

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters)
    updateUrl(query, newFilters.category, newFilters.sort, newFilters.source)
  }

  return (
    <div className="pt-24 pb-24 bg-[#f5f4ee] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8">
        {/* Editorial Header Banner */}
        <div className="p-8 sm:p-12 rounded-3xl bg-[#0c2f35] text-[#eef2ec] border border-white/10 shadow-xl flex flex-col gap-4 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#8c7b33]/20 blur-3xl pointer-events-none"
          />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8c7b33]" />
            <span className="text-xs font-mono uppercase tracking-wider text-[#8c7b33]">
              PlayNova Discovery · 19 Categories {youtubeConfigured ? "· Live Catalog" : ""}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight text-[#ffffff]">
            {filters.category !== "All"
              ? `${filters.category}`
              : "Discover Videos Across Every Topic"}
          </h1>
          <p className="text-sm sm:text-base text-[#93aaa6] max-w-2xl leading-relaxed">
            Search across PlayNova&apos;s streaming catalog and creator channels by keyword, category, upload date, or duration.
          </p>

          <div className="mt-4 max-w-2xl">
            <SearchBar
              initialQuery={query}
              onSearch={handleSearchSubmit}
              placeholder="Search gaming, music, AI, space, documentaries, trailers..."
            />
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-6 rounded-2xl bg-white/70 backdrop-blur-md border border-[#e2e0d6] shadow-sm">
          <SearchFilterBar
            filters={filters}
            onChange={handleFilterChange}
            totalCount={total}
            youtubeConfigured={youtubeConfigured}
          />
        </div>

        {/* Graceful YouTube Key / Quota Notice */}
        {ytNotice && (
          <div className="p-4 rounded-2xl bg-[#fffdf7] border border-[#8c7b33]/40 text-xs text-[#66726f] flex flex-wrap items-center justify-between gap-2">
            <span>{ytNotice}</span>
            {filters.source === "youtube" && (
              <button
                type="button"
                onClick={() => handleFilterChange({ ...filters, source: "native" })}
                className="px-3 py-1 rounded-full bg-[#0f3238] text-white font-semibold"
              >
                Browse PlayNova Library
              </button>
            )}
          </div>
        )}

        {/* Active Query Indicator */}
        {query && (
          <div className="flex items-center gap-2 text-sm text-[#66726f]">
            <span>
              Showing results for &ldquo;<span className="text-[#10292d] font-semibold">{query}</span>&rdquo;
            </span>
            <button
              type="button"
              onClick={() => handleSearchSubmit("")}
              className="text-xs text-[#8c7b33] hover:underline ml-2"
            >
              Clear query
            </button>
          </div>
        )}

        {/* Error State with Retry */}
        {errorMsg && (
          <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-rose-800">{errorMsg}</p>
            <button
              type="button"
              onClick={() => fetchPage(1, false, null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-700 text-white hover:bg-rose-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-[#0c2f35]/10 border border-[#e2e0d6] h-72 animate-pulse flex flex-col overflow-hidden"
              >
                <div className="aspect-video bg-black/10 w-full" />
                <div className="p-4 flex flex-col gap-2 flex-1 justify-between">
                  <div className="h-4 bg-black/10 rounded w-3/4" />
                  <div className="h-3 bg-black/10 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Video Results Grid */}
        {!isLoading && items.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {items.map((video) => (
                <VideoCard key={video.id} video={video} showWatchlistButton={true} />
              ))}
            </div>

            <div ref={loadMoreTriggerRef} className="pt-8 border-t border-[#e2e0d6] flex flex-col items-center gap-3">
              <p className="text-xs font-mono text-[#66726f]">
                Showing {items.length} unique videos {filters.source !== "youtube" ? `(Page ${page} of ${totalPages})` : ""}
              </p>
              {hasMore && (
                <button
                  type="button"
                  disabled={isLoadingMore}
                  onClick={() => fetchPage(page + 1, true, ytNextPageToken)}
                  className="px-6 py-2.5 rounded-full text-xs font-semibold bg-[#0f3238] text-white hover:bg-[#10292d] disabled:opacity-50 shadow-sm transition-all"
                >
                  {isLoadingMore ? "Loading more videos..." : "Load More Videos"}
                </button>
              )}
            </div>
          </>
        )}

        {/* Empty State */}
        {!isLoading && !errorMsg && items.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center text-center p-8 rounded-3xl bg-white/50 border border-[#e2e0d6]">
            <h3 className="text-xl font-medium text-[#10292d] mb-2">No videos matched your criteria</h3>
            <p className="text-sm text-[#66726f] max-w-md mb-6">
              {!youtubeConfigured && !["Space", "Technology", "Science", "Nature", "Education", "Documentaries", "Entertainment"].includes(filters.category)
                ? `Configure YOUTUBE_API_KEY in backend/.env to stream live ${filters.category} videos from YouTube, or explore our verified PlayNova library categories below.`
                : "Try adjusting your search keywords, date filter, or category selection."}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["Space", "Technology", "Science", "Nature", "Education", "Documentaries"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setQuery("")
                    handleFilterChange({
                      category: cat as VideoCategory,
                      duration: "any",
                      uploadDate: "any",
                      sort: "relevant",
                      source: "all",
                    })
                  }}
                  className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-white border border-[#e2e0d6] text-[#10292d] hover:bg-black/5"
                >
                  Explore {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense
      fallback={
        <div className="pt-32 pb-24 text-center text-[#66726f]">
          <p className="text-sm font-medium">Loading PlayNova Discovery...</p>
        </div>
      }
    >
      <ExploreContent />
    </Suspense>
  )
}
